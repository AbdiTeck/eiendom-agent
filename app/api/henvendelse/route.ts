// app/api/henvendelse/route.ts – med Supabase database

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// POST – kunde sender henvendelse
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { navn, epost, telefon, melding, boligAdresse, boligId } = body;

  if (!navn || !epost || !boligAdresse) {
    return NextResponse.json({ error: "Mangler navn, e-post eller boligadresse" }, { status: 400 });
  }

  // Lagre i Supabase
  const { data, error } = await supabase
    .from("henvendelser")
    .insert({
      navn,
      epost,
      telefon: telefon ?? "",
      melding: melding ?? "",
      bolig_adresse: boligAdresse,
      bolig_id: boligId ?? "ukjent",
      status: "ny",
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase feil:", error);
    return NextResponse.json({ error: "Kunne ikke lagre henvendelse" }, { status: 500 });
  }

  // Chief of Staff analyserer
  const analyse = await callGPT(
    `Du er Chief of Staff for en eiendomsmegler. En potensiell kjøper har meldt interesse.
Lag to ting i JSON (ingen markdown):
{
  "bekreftelse": "hyggelig bekreftelse til kunden på norsk (2-3 setninger, fortell at megler tar kontakt innen 24 timer)",
  "meglerMelding": "kort intern melding til megler om henvendelsen med prioritetsanbefaling"
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
    henvendelseId: data.id,
    bekreftelse: cosResultat.bekreftelse,
  });
}

// GET – dashboard henter alle henvendelser
export async function GET() {
  const { data, error } = await supabase
    .from("henvendelser")
    .select("*")
    .order("tidspunkt", { ascending: false });

  if (error) {
    console.error("Supabase feil:", error);
    return NextResponse.json({ error: "Kunne ikke hente henvendelser" }, { status: 500 });
  }

  // Map snake_case til camelCase for frontend
  const henvendelser = (data ?? []).map((h) => ({
    id: h.id,
    navn: h.navn,
    epost: h.epost,
    telefon: h.telefon,
    melding: h.melding,
    boligAdresse: h.bolig_adresse,
    boligId: h.bolig_id,
    tidspunkt: h.tidspunkt,
    status: h.status,
  }));

  return NextResponse.json({ henvendelser, total: henvendelser.length });
}

// PATCH – megler markerer som behandlet
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();

  const { error } = await supabase
    .from("henvendelser")
    .update({ status: "behandlet" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Kunne ikke oppdatere" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
