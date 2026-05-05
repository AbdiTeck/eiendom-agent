// app/api/boliger/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("boliger")
    .select("*")
    .order("opprettet", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ boliger: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adresse, pris, storrelse, rom, etasje, byggeaar, beskrivelse, visningsdatoer } = body;

  if (!adresse || !pris) {
    return NextResponse.json({ error: "Mangler adresse eller pris" }, { status: 400 });
  }

  const slug = adresse
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("boliger")
    .insert({
      slug, adresse, pris,
      storrelse: storrelse ?? "",
      rom: rom ?? "",
      etasje: etasje ?? "",
      byggeaar: byggeaar ?? "",
      beskrivelse: beskrivelse ?? "",
      visningsdatoer: visningsdatoer ?? [],
      status: "aktiv",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, bolig: data });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from("boliger").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
