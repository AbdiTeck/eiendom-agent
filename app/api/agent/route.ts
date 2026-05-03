// app/api/agent/route.ts v6

import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getGmailClient, getCalendarClient } from "@/lib/google";

function getNextDateForDay(dayName: string, time: string): string {
  const days: Record<string, number> = {
    søndag: 0, mandag: 1, tirsdag: 2, onsdag: 3,
    torsdag: 4, fredag: 5, lørdag: 6,
  };
  const target = days[dayName.toLowerCase()] ?? 1;
  const now = new Date();
  const diff = (target - now.getDay() + 7) % 7 || 7;
  const date = new Date(now);
  date.setDate(now.getDate() + diff);
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    date.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
  } else {
    date.setHours(17, 0, 0, 0);
  }
  return date.toISOString();
}

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

// Trekk ut adresse fra tekst – støtter "Bergveien 4", "Storgata 12B" osv.
function extractAddress(text: string): string {
  // Prøv med gatetype først
  const withType = text.match(/[A-ZÆØÅ][a-zæøå]+(gata|gate|veien|vei|vegen|veg|allé|plass|bakken|ringen|stien|torget|løkka)\s+\d+\w*/i);
  if (withType) return withType[0];
  // Prøv uten gatetype: "Bergveien 4", "Fjordgata 22" – stort forbokstav + tall
  const simple = text.match(/[A-ZÆØÅ][a-zæøå]{2,}\s+\d+\w*/);
  if (simple) return simple[0];
  return "";
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callGPT(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 800,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  return response.choices[0].message.content ?? "";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const { task, executeActions } = await req.json();
  if (!task) return NextResponse.json({ error: "Mangler oppgave" }, { status: 400 });

  // Steg 1: Chief of Staff – velger agenter basert på oppgave
  const cosRaw = await callGPT(
    `Du er Chief of Staff-agent for eiendomsmegler. Analyser oppgaven og velg riktige agenter.

Regler:
- "boligannonse", "lag annonse", "skriv annonse" → bruk "annonse"
- "oppfølging", "oppfølgingsmail", "send mail" → bruk "email"
- "visning", "book", "kalender" → bruk "kalender"  
- "ukesrapport", "rapport", "leads", "oversikt" → bruk "lead"
- Bruk gjerne flere agenter samtidig

Svar KUN med JSON (ingen markdown):
{"analyse": "kort analyse på norsk", "agenter": ["annonse"]}`,
    task
  );

  let cosResult: any;
  try {
    cosResult = JSON.parse(cosRaw.replace(/```json|```/g, "").trim());
  } catch {
    cosResult = { analyse: "Analyserer oppgaven.", agenter: ["email"] };
  }

  // Steg 2: Kjør underagenter med bedre prompts
  const results = [];
  const prompts: Record<string, string> = {
    email: `Du er e-post-agent for norsk eiendomsmegler. 
Skriv en profesjonell oppfølgingsmail på norsk (maks 10 linjer).
Inkluder: emne, hilsen, innhold, avslutning med meglers navn.
Kun selve e-postteksten.`,
    annonse: `Du er boligannonse-agent for norsk eiendomsmegler.
Skriv en engasjerende boligannonse i Finn.no-stil på norsk.
Inkluder: tittel med adresse, nøkkelfakta (størrelse, rom, pris), 
2-3 selgende setninger om boligen, visningsinformasjon.
Kun selve annonseteksten.`,
    kalender: `Du er kalender-agent for norsk eiendomsmegler.
Lag en detaljert visningsplan på norsk.
Inkluder: dato, tid, adresse, hvem som er invitert, praktisk info.
Kun selve visningsplanen.`,
    lead: `Du er lead- og rapporteringsagent for norsk eiendomsmegler.
Lag en ukesrapport eller lead-oversikt på norsk.
Inkluder: aktive boliger, antall leads, prioriterte oppfølginger, 
anbefalte handlinger for neste uke.
Kun selve rapporten.`,
  };

  for (const agentId of cosResult.agenter ?? []) {
    const output = await callGPT(prompts[agentId] ?? "Hjelp med oppgaven.", task);
    results.push({ id: agentId, output });
  }

  const executedActions: any[] = [];

  if (executeActions) {
    // --- E-POST ---
    const hasEmail = /send|mail|e-post|invitasjon|oppfølging/i.test(task);
    if (hasEmail) {
      try {
        const emailRaw = await callGPT(
          `Ekstraher e-postdetaljer fra oppgaven. Svar KUN med JSON (ingen markdown):
{"to": "epost@example.com", "subject": "Emne her", "body": "E-posttekst her"}
Hvis ingen e-postadresse er nevnt, svar: {}`,
          task
        );
        const emailData = JSON.parse(emailRaw.replace(/```json|```/g, "").trim());
        if (emailData.to && emailData.subject) {
          const gmail = getGmailClient(session.accessToken, session.refreshToken);
          const raw = makeEmailRaw(emailData.to, session.user?.email ?? "", emailData.subject, emailData.body);
          await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
          executedActions.push({ type: "send_email", success: true, message: `E-post sendt til ${emailData.to}` });
        }
      } catch (e: any) {
        executedActions.push({ type: "send_email", error: e?.message ?? "Ukjent feil" });
      }
    }

    // --- KALENDER ---
    const hasCalendar = /visning|book|kalender|avtale/i.test(task);
    if (hasCalendar) {
      try {
        const dayMatch = task.match(/mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag/i);
        const timeMatch = task.match(/kl\.?\s*(\d{1,2}[.:]\d{2})/i);
        const dayName = dayMatch ? dayMatch[0] : "mandag";
        const timeStr = timeMatch ? timeMatch[1].replace(".", ":") : "17:00";
        const isoDate = getNextDateForDay(dayName, timeStr);

        const address = extractAddress(task) || "Adresse fra oppgaven";
        const title = `Visning – ${address}`;
        const emailMatches = task.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        const attendeeEmails: string[] = emailMatches ?? [];

        console.log("=== KALENDER BOOKING ===");
        console.log("title:", title, "| date:", isoDate, "| address:", address);

        const startTime = new Date(isoDate);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        const calendar = getCalendarClient(session.accessToken, session.refreshToken);

        const event = await calendar.events.insert({
          calendarId: "primary",
          sendUpdates: "all",
          requestBody: {
            summary: title,
            description: "Visning booket via Chief of Staff",
            location: address,
            start: { dateTime: startTime.toISOString(), timeZone: "Europe/Oslo" },
            end: { dateTime: endTime.toISOString(), timeZone: "Europe/Oslo" },
            attendees: attendeeEmails.map((email) => ({ email })),
            reminders: {
              useDefault: false,
              overrides: [
                { method: "email", minutes: 24 * 60 },
                { method: "popup", minutes: 60 },
              ],
            },
          },
        });

        console.log("SUCCESS! Event ID:", event.data.id);
        executedActions.push({
          type: "book_calendar",
          success: true,
          eventId: event.data.id,
          eventLink: event.data.htmlLink,
          message: `✅ Visning booket: ${title} – ${startTime.toLocaleDateString("nb-NO")} kl. ${startTime.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}`,
        });
      } catch (e: any) {
        console.log("KALENDER FEIL:", e?.message);
        executedActions.push({ type: "book_calendar", error: e?.message ?? "Ukjent feil" });
      }
    }
  }

  return NextResponse.json({ cos: cosResult, results, executedActions });
}