// app/api/gmail/send/route.ts
// Sender e-post via brukerens Gmail-konto

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getGmailClient } from "@/lib/google";

interface SendEmailBody {
  to: string;
  subject: string;
  body: string;
}

// Konverterer e-post til base64 RFC 2822-format som Gmail API krever
function makeEmailRaw(to: string, from: string, subject: string, body: string): string {
  const email = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body).toString("base64"),
  ].join("\r\n");

  return Buffer.from(email).toString("base64url");
}

export async function POST(req: NextRequest) {
  // Sjekk at brukeren er innlogget
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const { to, subject, body }: SendEmailBody = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Mangler to, subject eller body" }, { status: 400 });
  }

  try {
    const gmail = getGmailClient(session.accessToken, session.refreshToken);

    const raw = makeEmailRaw(to, session.user?.email ?? "", subject, body);

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    return NextResponse.json({
      success: true,
      messageId: result.data.id,
      message: `E-post sendt til ${to}`,
    });
  } catch (error) {
    console.error("Gmail send error:", error);
    return NextResponse.json({ error: "Kunne ikke sende e-post" }, { status: 500 });
  }
}
