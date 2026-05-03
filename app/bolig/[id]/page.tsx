"use client";
// app/bolig/[id]/page.tsx
// Offentlig boligside – ingen innlogging nødvendig
// Kunder besøker denne siden og melder interesse

import { useState } from "react";

// Eksempelboliger – bytt med database i produksjon
const BOLIGER: Record<string, any> = {
  "storgata-12": {
    adresse: "Storgata 12, Oslo",
    pris: "3 200 000",
    størrelse: "65 m²",
    rom: "3-roms",
    etasje: "3. etasje",
    byggeår: "1985",
    beskrivelse: "Lys og gjennomgående leilighet med god planløsning. Oppusset kjøkken (2021), eget bad med gulvvarme og to gode soverom. Sentralt beliggende – alt du trenger rett utenfor døren. Kort vei til kollektivtransport, butikker og restauranter.",
    bilder: ["🏢", "🛋️", "🍳"],
    megler: "Abdiqani Hirsi",
    meglerTlf: "900 00 000",
    visningsDatoer: ["Lørdag 10. mai kl. 12:00–13:00", "Søndag 11. mai kl. 14:00–15:00"],
  },
  "bergveien-4": {
    adresse: "Bergveien 4, Oslo",
    pris: "4 500 000",
    størrelse: "85 m²",
    rom: "4-roms",
    etasje: "2. etasje",
    byggeår: "1998",
    beskrivelse: "Romslig familieleilighet med panoramautsikt. Stor stue med peis, moderne kjøkken og tre gode soverom. Garasjeplass inkludert. Rolig og barnevennlig område med nærhet til skoler og grøntarealer.",
    bilder: ["🏡", "🌲", "🛏️"],
    megler: "Abdiqani Hirsi",
    meglerTlf: "900 00 000",
    visningsDatoer: ["Tirsdag 6. mai kl. 17:00–18:00", "Lørdag 10. mai kl. 11:00–12:00"],
  },
};

export default function BoligSide({ params }: { params: { id: string } }) {
  const bolig = BOLIGER[params.id];
  const [form, setForm] = useState({ navn: "", epost: "", telefon: "", melding: "" });
  const [status, setStatus] = useState<"idle" | "sender" | "sendt" | "feil">("idle");
  const [bekreftelse, setBekreftelse] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "interesse">("info");

  if (!bolig) {
    return (
      <div style={s.center}>
        <h2>Boligen ble ikke funnet</h2>
        <p>Prøv <a href="/bolig/storgata-12">Storgata 12</a> eller <a href="/bolig/bergveien-4">Bergveien 4</a></p>
      </div>
    );
  }

  async function sendHenvendelse() {
    if (!form.navn || !form.epost) return;
    setStatus("sender");
    try {
      const res = await fetch("/api/henvendelse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, boligAdresse: bolig.adresse, boligId: params.id }),
      });
      const data = await res.json();
      if (data.success) {
        setBekreftelse(data.bekreftelse);
        setStatus("sendt");
      } else {
        setStatus("feil");
      }
    } catch {
      setStatus("feil");
    }
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>★ Chief of Staff Eiendom</div>
        <a href="/" style={s.dashLink}>Megler-dashboard →</a>
      </div>

      <div style={s.layout}>
        {/* Venstre – boliginfo */}
        <div style={s.left}>
          {/* Bildegalleri */}
          <div style={s.gallery}>
            {bolig.bilder.map((b: string, i: number) => (
              <div key={i} style={s.galleryItem}>{b}</div>
            ))}
          </div>

          {/* Nøkkelfakta */}
          <div style={s.card}>
            <h1 style={s.adresse}>{bolig.adresse}</h1>
            <div style={s.pris}>kr {bolig.pris},-</div>

            <div style={s.fakta}>
              {[
                ["Størrelse", bolig.størrelse],
                ["Type", bolig.rom],
                ["Etasje", bolig.etasje],
                ["Byggeår", bolig.byggeår],
              ].map(([label, val]) => (
                <div key={label} style={s.faktaItem}>
                  <div style={s.faktaLabel}>{label}</div>
                  <div style={s.faktaVal}>{val}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
              <button style={{ ...s.tab, ...(activeTab === "info" ? s.tabActive : {}) }} onClick={() => setActiveTab("info")}>Om boligen</button>
              <button style={{ ...s.tab, ...(activeTab === "interesse" ? s.tabActive : {}) }} onClick={() => setActiveTab("interesse")}>Meld interesse</button>
            </div>

            {activeTab === "info" && (
              <div>
                <p style={s.beskrivelse}>{bolig.beskrivelse}</p>
                <div style={s.visningBox}>
                  <div style={s.visningTitle}>📅 Visningsdatoer</div>
                  {bolig.visningsDatoer.map((d: string, i: number) => (
                    <div key={i} style={s.visningDato}>{d}</div>
                  ))}
                </div>
                <div style={s.meglerBox}>
                  <div style={s.meglerNavn}>🏠 {bolig.megler}</div>
                  <div style={s.meglerTlf}>{bolig.meglerTlf}</div>
                </div>
                <button style={s.interesseBtn} onClick={() => setActiveTab("interesse")}>
                  Meld interesse →
                </button>
              </div>
            )}

            {activeTab === "interesse" && (
              <div>
                {status === "sendt" ? (
                  <div style={s.bekreftelse}>
                    <div style={s.bekreftelseTittel}>✅ Takk!</div>
                    <p style={s.bekreftelseText}>{bekreftelse}</p>
                  </div>
                ) : (
                  <div>
                    <p style={s.skjemaIntro}>Fyll ut skjemaet så tar megler kontakt med deg innen 24 timer.</p>

                    {[
                      { key: "navn", label: "Fullt navn *", type: "text", placeholder: "Kari Nordmann" },
                      { key: "epost", label: "E-postadresse *", type: "email", placeholder: "kari@example.com" },
                      { key: "telefon", label: "Telefonnummer", type: "tel", placeholder: "900 12 345" },
                    ].map(({ key, label, type, placeholder }) => (
                      <div key={key} style={s.field}>
                        <label style={s.label}>{label}</label>
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={form[key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          style={s.input}
                        />
                      </div>
                    ))}

                    <div style={s.field}>
                      <label style={s.label}>Melding (valgfritt)</label>
                      <textarea
                        placeholder="F.eks: Ønsker ekstravisning, eller har spørsmål om..."
                        value={form.melding}
                        onChange={(e) => setForm({ ...form, melding: e.target.value })}
                        style={s.textarea}
                        rows={3}
                      />
                    </div>

                    {status === "feil" && (
                      <p style={{ color: "#991B1B", fontSize: 13, marginBottom: 12 }}>Noe gikk galt. Prøv igjen.</p>
                    )}

                    <button
                      style={{ ...s.sendBtn, ...(status === "sender" ? s.sendBtnDisabled : {}) }}
                      onClick={sendHenvendelse}
                      disabled={status === "sender" || !form.navn || !form.epost}
                    >
                      {status === "sender" ? "Sender..." : "Send interesse →"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Høyre – kart/info panel */}
        <div style={s.right}>
          <div style={s.mapBox}>
            <div style={s.mapPlaceholder}>🗺️</div>
            <div style={s.mapText}>{bolig.adresse}</div>
          </div>
          <div style={s.infoBox}>
            <div style={s.infoTitle}>Hvorfor melde interesse?</div>
            <div style={s.infoItem}>✓ Megler kontakter deg innen 24 timer</div>
            <div style={s.infoItem}>✓ Få beskjed om prisendringer</div>
            <div style={s.infoItem}>✓ Book privat visning</div>
            <div style={s.infoItem}>✓ Still spørsmål direkte til megler</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#F8F7F4", fontFamily: "Georgia, serif" },
  header: { background: "#fff", borderBottom: "1px solid #E5E5E0", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 16, fontWeight: 600, color: "#1a1a1a" },
  dashLink: { fontSize: 13, color: "#888", textDecoration: "none" },
  layout: { maxWidth: 1100, margin: "0 auto", padding: "32px 20px", display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" as const },
  left: { flex: "1 1 580px" },
  right: { flex: "0 0 280px" },
  gallery: { display: "flex", gap: 8, marginBottom: 20 },
  galleryItem: { flex: 1, height: 160, background: "#E5E5E0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 },
  card: { background: "#fff", border: "1px solid #E5E5E0", borderRadius: 12, padding: 28 },
  adresse: { margin: "0 0 6px", fontSize: 22, fontWeight: 600, color: "#1a1a1a" },
  pris: { fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 20 },
  fakta: { display: "flex", gap: 16, flexWrap: "wrap" as const, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #F0F0EB" },
  faktaItem: { minWidth: 100 },
  faktaLabel: { fontSize: 11, color: "#999", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  faktaVal: { fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginTop: 2 },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: { padding: "8px 18px", borderRadius: 999, border: "1px solid #E5E5E0", background: "transparent", cursor: "pointer", fontSize: 13, color: "#666", fontFamily: "Georgia, serif" },
  tabActive: { background: "#1a1a1a", color: "#fff", borderColor: "#1a1a1a" },
  beskrivelse: { fontSize: 14, lineHeight: 1.8, color: "#444", margin: "0 0 20px" },
  visningBox: { background: "#F8F7F4", borderRadius: 8, padding: "14px 16px", marginBottom: 16 },
  visningTitle: { fontSize: 13, fontWeight: 600, marginBottom: 8 },
  visningDato: { fontSize: 13, color: "#555", marginBottom: 4 },
  meglerBox: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "12px 0", borderTop: "1px solid #F0F0EB" },
  meglerNavn: { fontSize: 14, fontWeight: 600 },
  meglerTlf: { fontSize: 14, color: "#666" },
  interesseBtn: { width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#1a1a1a", color: "#fff", fontSize: 15, cursor: "pointer", fontFamily: "Georgia, serif" },
  skjemaIntro: { fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, color: "#666", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #E5E5E0", borderRadius: 8, fontSize: 14, fontFamily: "Georgia, serif", boxSizing: "border-box" as const, outline: "none" },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid #E5E5E0", borderRadius: 8, fontSize: 14, fontFamily: "Georgia, serif", boxSizing: "border-box" as const, resize: "vertical" as const, outline: "none" },
  sendBtn: { width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#1a1a1a", color: "#fff", fontSize: 15, cursor: "pointer", fontFamily: "Georgia, serif", marginTop: 4 },
  sendBtnDisabled: { background: "#999", cursor: "not-allowed" },
  bekreftelse: { background: "#E1F5EE", borderRadius: 10, padding: 20, textAlign: "center" as const },
  bekreftelseTittel: { fontSize: 20, marginBottom: 10 },
  bekreftelseText: { fontSize: 14, color: "#0F6E56", lineHeight: 1.7, margin: 0 },
  center: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Georgia, serif" },
  mapBox: { background: "#fff", border: "1px solid #E5E5E0", borderRadius: 12, padding: 20, marginBottom: 16, textAlign: "center" as const },
  mapPlaceholder: { fontSize: 48, marginBottom: 8 },
  mapText: { fontSize: 13, color: "#666" },
  infoBox: { background: "#fff", border: "1px solid #E5E5E0", borderRadius: 12, padding: 20 },
  infoTitle: { fontSize: 14, fontWeight: 600, marginBottom: 12 },
  infoItem: { fontSize: 13, color: "#555", marginBottom: 8, lineHeight: 1.5 },
};
