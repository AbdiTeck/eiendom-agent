"use client";
// app/bolig/[id]/page.tsx – henter bolig fra Supabase

import { useState, useEffect } from "react";

export default function BoligSide({ params }: { params: { id: string } }) {
  const [bolig, setBolig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ navn: "", epost: "", telefon: "", melding: "" });
  const [status, setStatus] = useState<"idle" | "sender" | "sendt" | "feil">("idle");
  const [bekreftelse, setBekreftelse] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "interesse">("info");

  useEffect(() => {
    fetch("/api/boliger")
      .then((r) => r.json())
      .then((d) => {
        const funnet = (d.boliger ?? []).find((b: any) => b.slug === params.id);
        setBolig(funnet ?? null);
        setLoading(false);
      });
  }, [params.id]);

  async function sendHenvendelse() {
    if (!form.navn || !form.epost) return;
    setStatus("sender");
    try {
      const res = await fetch("/api/henvendelse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, boligAdresse: bolig.adresse, boligId: bolig.slug }),
      });
      const data = await res.json();
      if (data.success) { setBekreftelse(data.bekreftelse); setStatus("sendt"); }
      else setStatus("feil");
    } catch { setStatus("feil"); }
  }

  if (loading) return <div style={s.center}>Laster bolig...</div>;

  if (!bolig) return (
    <div style={s.center}>
      <h2>Boligen ble ikke funnet</h2>
      <a href="/boliger" style={{ color: "#0C447C" }}>← Se alle boliger</a>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <a href="/boliger" style={s.logo}>★ Chief of Staff Eiendom</a>
        <a href="/login" style={s.dashLink}>Megler-innlogging →</a>
      </div>

      <div style={s.layout}>
        <div style={s.left}>
          <div style={s.gallery}>
            {["🏢", "🛋️", "🍳"].map((e, i) => (
              <div key={i} style={s.galleryItem}>{e}</div>
            ))}
          </div>

          <div style={s.card}>
            <h1 style={s.adresse}>{bolig.adresse}</h1>
            <div style={s.pris}>kr {bolig.pris},-</div>

            <div style={s.fakta}>
              {[["Størrelse", bolig.storrelse], ["Type", bolig.rom], ["Etasje", bolig.etasje], ["Byggeår", bolig.byggeaar]]
                .filter(([, v]) => v)
                .map(([label, val]) => (
                  <div key={label} style={s.faktaItem}>
                    <div style={s.faktaLabel}>{label}</div>
                    <div style={s.faktaVal}>{val}</div>
                  </div>
                ))}
            </div>

            <div style={s.tabs}>
              <button style={{ ...s.tab, ...(activeTab === "info" ? s.tabActive : {}) }} onClick={() => setActiveTab("info")}>Om boligen</button>
              <button style={{ ...s.tab, ...(activeTab === "interesse" ? s.tabActive : {}) }} onClick={() => setActiveTab("interesse")}>Meld interesse</button>
            </div>

            {activeTab === "info" && (
              <div>
                <p style={s.beskrivelse}>{bolig.beskrivelse}</p>
                {bolig.visningsdatoer?.length > 0 && (
                  <div style={s.visningBox}>
                    <div style={s.visningTitle}>📅 Visningsdatoer</div>
                    {bolig.visningsdatoer.map((d: string, i: number) => (
                      <div key={i} style={s.visningDato}>{d}</div>
                    ))}
                  </div>
                )}
                <button style={s.interesseBtn} onClick={() => setActiveTab("interesse")}>Meld interesse →</button>
              </div>
            )}

            {activeTab === "interesse" && (
              <div>
                {status === "sendt" ? (
                  <div style={s.bekreftelse}>
                    <div style={{ fontSize: 20, marginBottom: 10 }}>✅ Takk!</div>
                    <p style={{ fontSize: 14, color: "#0F6E56", lineHeight: 1.7, margin: 0 }}>{bekreftelse}</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>Fyll ut skjemaet så tar megler kontakt innen 24 timer.</p>
                    {[
                      { key: "navn", label: "Fullt navn *", type: "text", placeholder: "Kari Nordmann" },
                      { key: "epost", label: "E-post *", type: "email", placeholder: "kari@example.com" },
                      { key: "telefon", label: "Telefon", type: "tel", placeholder: "900 12 345" },
                    ].map(({ key, label, type, placeholder }) => (
                      <div key={key} style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 5 }}>{label}</label>
                        <input type={type} placeholder={placeholder}
                          value={form[key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          style={s.input} />
                      </div>
                    ))}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 5 }}>Melding</label>
                      <textarea placeholder="Spørsmål eller kommentarer..." value={form.melding}
                        onChange={(e) => setForm({ ...form, melding: e.target.value })}
                        style={s.textarea} rows={3} />
                    </div>
                    {status === "feil" && <p style={{ color: "#991B1B", fontSize: 13, marginBottom: 12 }}>Noe gikk galt. Prøv igjen.</p>}
                    <button style={{ ...s.sendBtn, ...(status === "sender" ? { background: "#999" } : {}) }}
                      onClick={sendHenvendelse} disabled={status === "sender" || !form.navn || !form.epost}>
                      {status === "sender" ? "Sender..." : "Send interesse →"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={s.right}>
          <div style={s.infoBox}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Hvorfor melde interesse?</div>
            {["Megler kontakter deg innen 24 timer", "Få beskjed om prisendringer", "Book privat visning", "Still spørsmål direkte"].map((t) => (
              <div key={t} style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>✓ {t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#F8F7F4", fontFamily: "Georgia, serif" },
  header: { background: "#fff", borderBottom: "1px solid #E5E5E0", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 16, fontWeight: 600, textDecoration: "none", color: "#1a1a1a" },
  dashLink: { fontSize: 13, color: "#888", textDecoration: "none" },
  layout: { maxWidth: 1100, margin: "0 auto", padding: "32px 20px", display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" as const },
  left: { flex: "1 1 580px" },
  right: { flex: "0 0 280px" },
  gallery: { display: "flex", gap: 8, marginBottom: 20 },
  galleryItem: { flex: 1, height: 160, background: "#E5E5E0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 },
  card: { background: "#fff", border: "1px solid #E5E5E0", borderRadius: 12, padding: 28 },
  adresse: { margin: "0 0 6px", fontSize: 22, fontWeight: 600 },
  pris: { fontSize: 20, fontWeight: 700, marginBottom: 20 },
  fakta: { display: "flex", gap: 16, flexWrap: "wrap" as const, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #F0F0EB" },
  faktaItem: { minWidth: 80 },
  faktaLabel: { fontSize: 11, color: "#999", textTransform: "uppercase" as const },
  faktaVal: { fontSize: 15, fontWeight: 600, marginTop: 2 },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: { padding: "8px 18px", borderRadius: 999, border: "1px solid #E5E5E0", background: "transparent", cursor: "pointer", fontSize: 13, color: "#666", fontFamily: "Georgia, serif" },
  tabActive: { background: "#1a1a1a", color: "#fff", borderColor: "#1a1a1a" },
  beskrivelse: { fontSize: 14, lineHeight: 1.8, color: "#444", margin: "0 0 20px" },
  visningBox: { background: "#F8F7F4", borderRadius: 8, padding: "14px 16px", marginBottom: 16 },
  visningTitle: { fontSize: 13, fontWeight: 600, marginBottom: 8 },
  visningDato: { fontSize: 13, color: "#555", marginBottom: 4 },
  interesseBtn: { width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#1a1a1a", color: "#fff", fontSize: 15, cursor: "pointer", fontFamily: "Georgia, serif" },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #E5E5E0", borderRadius: 8, fontSize: 14, fontFamily: "Georgia, serif", boxSizing: "border-box" as const, outline: "none" },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid #E5E5E0", borderRadius: 8, fontSize: 14, fontFamily: "Georgia, serif", boxSizing: "border-box" as const, resize: "vertical" as const, outline: "none" },
  sendBtn: { width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#1a1a1a", color: "#fff", fontSize: 15, cursor: "pointer", fontFamily: "Georgia, serif" },
  bekreftelse: { background: "#E1F5EE", borderRadius: 10, padding: 20, textAlign: "center" as const },
  center: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Georgia, serif" },
  infoBox: { background: "#fff", border: "1px solid #E5E5E0", borderRadius: 12, padding: 20 },
};
