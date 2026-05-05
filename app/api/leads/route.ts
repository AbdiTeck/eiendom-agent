// app/api/leads/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGmailClient } from "@/lib/google";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  message: string;
  receivedAt: string;
  priority: "høy" | "middels" | "lav";
}

async function parseLeadWithGPT(emailText: string): Promise<Omit<Lead, "id" | "receivedAt">> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content: `Du er en parser for eiendomsleads. 
Ekstraher informasjon fra e-postteksten og returner KUN JSON (ingen markdown):
{"name":"fullt navn eller Ukjent","email":"e-post eller ukjent","phone":"telefon eller ukjent","property":"boligadresse eller tittel","message":"kort oppsummering av henvendelsen på norsk","priority":"høy eller middels eller lav"}`,
      },
      { role: "user", content: emailText.substring(0, 1000) },
    ],
  });
  try {
    const raw = response.choices[0].message.content ?? "{}";
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { name: "Ukjent", email: "ukjent", phone: "ukjent", property: "Ukjent bolig", message: emailText.substring(0, 150), priority: "middels" };
  }
}

function decodeEmailBody(payload: any): string {
  if (payload?.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }
  if (payload?.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
    }
    // Prøv HTML hvis ingen plain text
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = Buffer.from(part.body.data, "base64url").toString("utf-8");
        return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
    }
  }
  return "";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  // Sjekk om det er en test-request
  const { searchParams } = new URL(req.url);
  const isTest = searchParams.get("test") === "true";

  if (isTest) {
    // Returner test-leads så du kan se at UI fungerer
    const testLeads: Lead[] = [
      {
        id: "test-1",
        name: "Kari Nordmann",
        email: "kari@example.com",
        phone: "900 12 345",
        property: "Storgata 12, Oslo",
        message: "Veldig interessert i boligen. Ønsker ekstravisning.",
        receivedAt: new Date().toISOString(),
        priority: "høy",
      },
      {
        id: "test-2",
        name: "Ole Hansen",
        email: "ole@example.com",
        phone: "910 23 456",
        property: "Bergveien 4, Oslo",
        message: "Spurte om finansiering og overtakelsesdato.",
        receivedAt: new Date(Date.now() - 86400000).toISOString(),
        priority: "middels",
      },
      {
        id: "test-3",
        name: "Lena Berg",
        email: "lena@example.com",
        phone: "920 34 567",
        property: "Parkveien 8, Oslo",
        message: "Tidlig i prosessen, vil se flere boliger.",
        receivedAt: new Date(Date.now() - 172800000).toISOString(),
        priority: "lav",
      },
    ];
    return NextResponse.json({ leads: testLeads, total: testLeads.length, source: "test" });
  }

  try {
    const gmail = getGmailClient(session.accessToken, session.refreshToken);

    // Bredt søk – fanger Finn.no og andre eiendomsleads
    const searchResult = await gmail.users.messages.list({
      userId: "me",
      q: 'subject:(henvendelse OR interessert OR visning OR "ny melding" OR bolig OR eiendom) newer_than:30d',
      maxResults: 20,
    });

    console.log("Gmail søk returnerte:", searchResult.data.messages?.length ?? 0, "e-poster");

    const messages = searchResult.data.messages ?? [];

    if (messages.length === 0) {
      return NextResponse.json({
        leads: [],
        total: 0,
        message: "Ingen leads funnet. Prøv ?test=true for testdata, eller send deg selv en test-e-post med emne 'Ny henvendelse på bolig'.",
      });
    }

    const leads: Lead[] = await Promise.all(
      messages.map(async (msg) => {
        const full = await gmail.users.messages.get({ userId: "me", id: msg.id!, format: "full" });
        const emailText = decodeEmailBody(full.data.payload);
        const internalDate = full.data.internalDate ?? "0";
        const parsed = await parseLeadWithGPT(emailText || "Ingen innhold");
        return { id: msg.id!, ...parsed, receivedAt: new Date(parseInt(internalDate)).toISOString() };
      })
    );

    const priorityOrder = { høy: 0, middels: 1, lav: 2 };
    leads.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json({ leads, total: leads.length });
  } catch (error: any) {
    console.log("Leads fetch error:", error?.message);
    return NextResponse.json({ error: "Kunne ikke hente leads", details: error?.message }, { status: 500 });
  }
}
