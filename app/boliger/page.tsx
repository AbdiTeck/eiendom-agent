"use client";
// app/boliger/page.tsx – offentlig boligoversikt

import { useState, useEffect } from "react";

export default function BoligOversikt() {
  const [boliger, setBoliger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/boliger")
      .then((r) => r.json())
      .then((d) => { setBoliger(d.boliger ?? []); setLoading(false); });
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.logo}>★ Chief of Staff Eiendom</div>
        <a href="/login" style={s.link}>Megler-innlogging →</a>
      </div>

      <div style={s.hero}>
        <h1 style={s.heroTitle}>Finn din drømmebolig</h1>
        <p style={s.heroSub}>Vi hjelper deg å finne riktig bolig – kontakt oss direkte fra annonsen</p>
      </div>

      <div style={s.container}>
        {loading ? (
          <p style={s.muted}>Laster boliger...</p>
        ) : boliger.length === 0 ? (
          <p style={s.muted}>Ingen boliger til salgs akkurat nå. Sjekk tilbake snart!</p>
        ) : (
          <div style={s.grid}>
            {boliger.map((b) => (
              <a key={b.id} href={`/bolig/${b.slug}`} style={s.card}>
                <div style={s.cardImage}>🏠</div>
                <div style={s.cardBody}>
                  <div style={s.cardAdresse}>{b.adresse}</div>
                  <div style={s.cardPris}>kr {b.pris},-</div>
                  <div style={s.cardFakta}>
                    {b.rom && <span style={s.tag}>{b.rom}</span>}
                    {b.storrelse && <span style={s.tag}>{b.storrelse}</span>}
                    {b.etasje && <span style={s.tag}>{b.etasje}</span>}
                  </div>
                  <div style={s.cardBeskrivelse}>
                    {b.beskrivelse?.substring(0, 100)}...
                  </div>
                  <div style={s.melding}>Meld interesse →</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#F8F7F4", fontFamily: "Georgia, serif" },
  header: { background: "#fff", borderBottom: "1px solid #E5E5E0", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 16, fontWeight: 600 },
  link: { fontSize: 13, color: "#888", textDecoration: "none" },
  hero: { background: "#1a1a1a", color: "#fff", padding: "60px 32px", textAlign: "center" as const },
  heroTitle: { margin: "0 0 12px", fontSize: 36, fontWeight: 600 },
  heroSub: { margin: 0, fontSize: 16, color: "#aaa" },
  container: { maxWidth: 1100, margin: "0 auto", padding: "40px 20px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 },
  card: { background: "#fff", border: "1px solid #E5E5E0", borderRadius: 12, overflow: "hidden", textDecoration: "none", color: "inherit", display: "block", transition: "transform 0.2s" },
  cardImage: { height: 180, background: "#E5E5E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 },
  cardBody: { padding: 20 },
  cardAdresse: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  cardPris: { fontSize: 18, fontWeight: 700, marginBottom: 12 },
  cardFakta: { display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 12 },
  tag: { fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "#F8F7F4", border: "1px solid #E5E5E0", color: "#666" },
  cardBeskrivelse: { fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 12 },
  melding: { fontSize: 13, fontWeight: 600, color: "#1a1a1a" },
  muted: { color: "#999", fontStyle: "italic" },
};
