// app/api/henvendelse/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Henvendelse {
  id: string;
  navn: string;
  epost: string;
  telefon: string;
  melding: string;
  boligAdresse: string;
  boligId: string;
  tidspunkt: string;
  status: "ny" | "behandlet";
}

// Global variabel som overlever hot-reloads i development
declare global {
  var _henvendelser: Henvendelse[] | undefined;
}
if (!global._henvendelser) {
  global._henvendelser = [];
}
const henvendelser = global._henvendelser;

async function callGPT(system: string, user: string): Promise<string> {
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 500,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return r.choices[0].message.content ?? "";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { navn, epost, telefon, melding, boligAdresse, boligId } = body;

  if (!navn || !epost || !boligAdresse) {
    return NextResponse.json({ error: "Mangler navn, e-post eller boligadresse" }, { status: 400 });
  }

  const henvendelse: Henvendelse = {
    id: `h-${Date.now()}`,
    navn,
    epost,
    telefon: telefon ?? "",
    melding: melding ?? "",
    boligAdresse,
    boligId: boligId ?? "ukjent",
    tidspunkt: new Date().toISOString(),
    status: "ny",
  };
  henvendelser.push(henvendelse);

  const analyse = await callGPT(
    `Du er Chief of Staff for en eiendomsmegler. En potensiell kjøper har meldt interesse.
Lag to ting i JSON (ingen markdown):
{
  "bekreftelse": "hyggelig bekreftelse til kunden på norsk (2-3 setninger, fortell at megler tar kontakt innen 24 timer)",
  "meglerMelding": "kort intern melding til megler om denne henvendelsen med prioritetsanbefaling"
}`,
    `Kunde: ${navn} (${epost}, tlf: ${telefon})
Bolig: ${boligAdresse}
Melding: ${melding || "Ingen melding – ønsker å melde interesse"}`
  );

  let cosResultat = { bekreftelse: "", meglerMelding: "" };
  try {
    cosResultat = JSON.parse(analyse.replace(/```json|```/g, "").trim());
  } catch {
    cosResultat.bekreftelse = `Takk, ${navn}! Vi har mottatt din interesse for ${boligAdresse}. Megler tar kontakt innen 24 timer.`;
  }

  return NextResponse.json({
    success: true,
    henvendelseId: henvendelse.id,
    bekreftelse: cosResultat.bekreftelse,
  });
}

export async function GET() {
  const sorted = [...henvendelser].sort(
    (a, b) => new Date(b.tidspunkt).getTime() - new Date(a.tidspunkt).getTime()
  );
  return NextResponse.json({ henvendelser: sorted, total: sorted.length });
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  const h = henvendelser.find((x) => x.id === id);
  if (h) h.status = "behandlet";
  return NextResponse.json({ success: true });
}