"use client";
// app/page.tsx – Hoveddashboard med alle integrasjoner

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/app/api/leads/route";

const QUICK_TASKS = [
  "Lag boligannonse for Storgata 12, 3-roms, 65m², prisantydning 3,2 mill",
  "Skriv oppfølgingsmail til leads som var på visning i går",
  "Book visning for Bergveien 4 lørdag 10. mai kl. 12:00, send invitasjon",
  "Lag ukesrapport for mine aktive boliger og leads",
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [cosResult, setCosResult] = useState<any>(null);
  const [agentResults, setAgentResults] = useState<any[]>([]);
  const [executedActions, setExecutedActions] = useState<any[]>([]);
  const [executeActions, setExecuteActions] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsMessage, setLeadsMessage] = useState("");
  const [henvendelser, setHenvendelser] = useState<any[]>([]);
  const [loadingHenvendelser, setLoadingHenvendelser] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [activeTab, setActiveTab] = useState<"agent" | "leads" | "kalender" | "henvendelser">("agent");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function fetchLeads() {
    setLoadingLeads(true);
    setLeadsMessage("");
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data.leads ?? []);
      if (data.message) setLeadsMessage(data.message);
    } catch { }
    setLoadingLeads(false);
  }

  async function fetchTestLeads() {
    setLoadingLeads(true);
    try {
      const res = await fetch("/api/leads?test=true");
      const data = await res.json();
      setLeads(data.leads ?? []);
      setLeadsMessage("⚠️ Viser testdata – ikke ekte leads fra Gmail.");
    } catch { }
    setLoadingLeads(false);
  }

  async function fetchEvents() {
    setLoadingEvents(true);
    try {
      const res = await fetch("/api/calendar/book");
      const data = await res.json();
      setUpcomingEvents(data.events ?? []);
    } catch { }
    setLoadingEvents(false);
  }

  async function fetchHenvendelser() {
    setLoadingHenvendelser(true);
    try {
      const res = await fetch("/api/henvendelse");
      const data = await res.json();
      setHenvendelser(data.henvendelser ?? []);
    } catch { }
    setLoadingHenvendelser(false);
  }

  async function markerBehandlet(id: string) {
    await fetch("/api/henvendelse", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchHenvendelser();
  }

  useEffect(() => {
    if (activeTab === "leads") fetchLeads();
    if (activeTab === "kalender") fetchEvents();
    if (activeTab === "henvendelser") fetchHenvendelser();
  }, [activeTab]);

  async function runAgent() {
    if (!task.trim() || running) return;
    setRunning(true);
    setCosResult(null);
    setAgentResults([]);
    setExecutedActions([]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, executeActions }),
      });
      const data = await res.json();
      setCosResult(data.cos);
      setAgentResults(data.results ?? []);
      setExecutedActions(data.executedActions ?? []);
    } catch { }
    setRunning(false);
  }

  if (status === "loading") return <div style={styles.loading}>Laster...</div>;

  const priorityColor = { høy: "#E1F5EE", middels: "#FEF9E7", lav: "#F8F7F4" };
  const priorityTextColor = { høy: "#0F6E56", middels: "#7D6608", lav: "#666" };

  return (
    <main style={styles.main}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>★</div>
            <div>
              <h1 style={styles.title}>Chief of Staff</h1>
              <p style={styles.sub}>Innlogget som {session?.user?.email}</p>
            </div>
          </div>
          <button style={styles.signOutBtn} onClick={() => signOut()}>Logg ut</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {(["agent", "leads", "kalender", "henvendelser"] as const).map((tab) => (
            <button
              key={tab}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab === "agent" ? "🤖 Agent" : tab === "leads" ? "📥 Finn.no Leads" : tab === "kalender" ? "📅 Kalender" : "🔔 Henvendelser"}
            </button>
          ))}
        </div>

        {/* Agent Tab */}
        {activeTab === "agent" && (
          <div>
            <div style={styles.card}>
              <textarea
                style={styles.textarea}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Beskriv oppgaven... f.eks: Send oppfølgingsmail til kari@example.com og book visning for Storgata 12 fredag kl. 17:00"
                rows={3}
              />
              <div style={styles.quickRow}>
                {QUICK_TASKS.map((t, i) => (
                  <button key={i} style={styles.quickBtn} onClick={() => setTask(t)}>
                    {t.substring(0, 35)}...
                  </button>
                ))}
              </div>
              <div style={styles.actionRow}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={executeActions}
                    onChange={(e) => setExecuteActions(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Utfør ekte handlinger (send Gmail / book Calendar)
                </label>
                <button
                  style={{ ...styles.runBtn, ...(running ? styles.runBtnDisabled : {}) }}
                  onClick={runAgent}
                  disabled={running}
                >
                  {running ? "Kjører..." : "Kjør agenter ↗"}
                </button>
              </div>
            </div>

            {/* Agent Results */}
            {cosResult && (
              <div style={styles.pipeline}>
                <div style={styles.step}>
                  <div style={styles.stepHeader}>
                    <div style={{ ...styles.icon, background: "#CECBF6", color: "#3C3489" }}>★</div>
                    <div style={styles.stepInfo}>
                      <div style={styles.stepTitle}>Chief of Staff</div>
                      <div style={styles.stepSub}>Analyse ferdig</div>
                    </div>
                    <span style={{ ...styles.badge, background: "#E1F5EE", color: "#0F6E56" }}>Ferdig</span>
                  </div>
                  <div style={styles.output}>
                    {cosResult.analyse}{"\n\n"}Delegerte til: {cosResult.agenter?.join(", ")}
                  </div>
                </div>

                {agentResults.map((r) => {
                  const colors: any = {
                    email: { bg: "#B5D4F4", text: "#0C447C" },
                    annonse: { bg: "#9FE1CB", text: "#085041" },
                    kalender: { bg: "#FAC775", text: "#633806" },
                    lead: { bg: "#F5C4B3", text: "#712B13" },
                  };
                  const icons: any = { email: "@", annonse: "⌂", kalender: "▦", lead: "◎" };
                  const labels: any = { email: "E-post-agent", annonse: "Annonse-agent", kalender: "Kalender-agent", lead: "Lead-agent" };
                  return (
                    <div key={r.id} style={styles.step}>
                      <div style={styles.stepHeader}>
                        <div style={{ ...styles.icon, background: colors[r.id]?.bg, color: colors[r.id]?.text }}>
                          {icons[r.id]}
                        </div>
                        <div style={styles.stepInfo}>
                          <div style={styles.stepTitle}>{labels[r.id]}</div>
                        </div>
                        <span style={{ ...styles.badge, background: "#E1F5EE", color: "#0F6E56" }}>Ferdig</span>
                      </div>
                      <div style={styles.output}>{r.output}</div>
                    </div>
                  );
                })}

                {executedActions.length > 0 && (
                  <div style={{ ...styles.step, borderColor: "#9FE1CB" }}>
                    <div style={styles.stepTitle}>✅ Utførte handlinger</div>
                    {executedActions.map((a, i) => (
                      <div key={i} style={{ ...styles.output, marginTop: 8 }}>
                        {a.message ?? JSON.stringify(a)}
                        {a.eventLink && <><br /><a href={a.eventLink} target="_blank" style={{ color: "#0C447C" }}>Åpne i Google Calendar →</a></>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={styles.cardTitle}>Finn.no leads fra Gmail</h2>
            </div>
            {leadsMessage && <p style={{fontSize:13, color:"#888", marginBottom:12, fontStyle:"italic"}}>{leadsMessage}</p>}
            <div style={{display:"flex", gap:8, marginBottom:16}}>
              <button style={styles.refreshBtn} onClick={fetchLeads}>Hent fra Gmail</button>
              <button style={styles.refreshBtn} onClick={fetchTestLeads}>Vis testdata</button>
            </div>
            {loadingLeads ? (
              <p style={styles.muted}>Henter leads fra Gmail...</p>
            ) : leads.length === 0 ? (
              <p style={styles.muted}>Ingen leads funnet. Trykk "Vis testdata" for å teste UI-et, eller send deg selv en e-post med emne "Ny henvendelse på bolig".</p>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} style={{ ...styles.leadCard, background: priorityColor[lead.priority] }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: 14 }}>{lead.name}</strong>
                    <span style={{ fontSize: 11, color: priorityTextColor[lead.priority], fontWeight: 600 }}>
                      {lead.priority.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.leadDetail}>{lead.property}</div>
                  <div style={styles.leadDetail}>{lead.email} · {lead.phone}</div>
                  <div style={{ ...styles.leadDetail, marginTop: 4 }}>{lead.message}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Henvendelser Tab */}
      {activeTab === ("henvendelser" as any) && (
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={styles.cardTitle}>🔔 Innkommende henvendelser</h2>
            <button style={styles.refreshBtn} onClick={fetchHenvendelser}>Oppdater</button>
          </div>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
            Kunder som melder interesse via boligsidene dukker opp her. 
            Del boliglenken med potensielle kjøpere: <code style={{background:"#F8F7F4", padding:"2px 6px", borderRadius:4}}>localhost:3000/bolig/storgata-12</code>
          </p>
          {loadingHenvendelser ? (
            <p style={styles.muted}>Henter henvendelser...</p>
          ) : henvendelser.length === 0 ? (
            <div>
              <p style={styles.muted}>Ingen henvendelser ennå.</p>
              <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
                Test det selv: Åpne <a href="/bolig/storgata-12" target="_blank" style={{color:"#0C447C"}}>localhost:3000/bolig/storgata-12</a> og fyll ut interesseskjemaet.
              </p>
            </div>
          ) : (
            henvendelser.map((h: any) => (
              <div key={h.id} style={{
                ...styles.leadCard,
                background: h.status === "behandlet" ? "#F8F7F4" : "#E1F5EE",
                opacity: h.status === "behandlet" ? 0.7 : 1,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: 14 }}>{h.navn}</strong>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: h.status === "ny" ? "#CECBF6" : "#E5E5E0", color: h.status === "ny" ? "#3C3489" : "#666" }}>
                    {h.status === "ny" ? "🆕 Ny" : "✅ Behandlet"}
                  </span>
                </div>
                <div style={styles.leadDetail}>🏠 {h.boligAdresse}</div>
                <div style={styles.leadDetail}>📧 {h.epost} · 📞 {h.telefon || "ikke oppgitt"}</div>
                {h.melding && <div style={styles.leadDetail}>💬 "{h.melding}"</div>}
                <div style={styles.leadDetail}>⏰ {new Date(h.tidspunkt).toLocaleString("nb-NO")}</div>
                {h.status === "ny" && (
                  <button
                    onClick={() => markerBehandlet(h.id)}
                    style={{ marginTop: 10, fontSize: 12, padding: "5px 12px", border: "1px solid #E5E5E0", borderRadius: 8, background: "#fff", cursor: "pointer" }}
                  >
                    Marker som behandlet
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Kalender Tab */}
        {activeTab === "kalender" && (
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={styles.cardTitle}>Kommende visninger</h2>
              <button style={styles.refreshBtn} onClick={fetchEvents}>Oppdater</button>
            </div>
            {loadingEvents ? (
              <p style={styles.muted}>Henter kalender...</p>
            ) : upcomingEvents.length === 0 ? (
              <p style={styles.muted}>Ingen kommende visninger funnet i Google Calendar.</p>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} style={styles.eventCard}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{event.title}</div>
                  <div style={styles.leadDetail}>
                    {event.start ? new Date(event.start).toLocaleString("nb-NO", { dateStyle: "medium", timeStyle: "short" }) : ""}
                  </div>
                  <div style={styles.leadDetail}>📍 {event.location}</div>
                  {event.attendees.length > 0 && (
                    <div style={styles.leadDetail}>👥 {event.attendees.join(", ")}</div>
                  )}
                  {event.link && <a href={event.link} target="_blank" style={{ fontSize: 12, color: "#0C447C" }}>Åpne i Google Calendar →</a>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", background: "#F8F7F4", padding: "32px 20px", fontFamily: "Georgia, serif" },
  container: { maxWidth: 760, margin: "0 auto" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Georgia, serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  logo: { width: 44, height: 44, borderRadius: "50%", background: "#CECBF6", color: "#3C3489", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: "bold" },
  title: { margin: 0, fontSize: 22, fontWeight: 600, color: "#1a1a1a" },
  sub: { margin: 0, fontSize: 12, color: "#888", marginTop: 2 },
  signOutBtn: { fontSize: 13, padding: "6px 14px", border: "1px solid #E5E5E0", borderRadius: 8, background: "transparent", cursor: "pointer", color: "#666" },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: { padding: "8px 18px", borderRadius: 999, border: "1px solid #E5E5E0", background: "transparent", cursor: "pointer", fontSize: 13, color: "#666" },
  tabActive: { background: "#1a1a1a", color: "#fff", borderColor: "#1a1a1a" },
  card: { background: "#fff", border: "1px solid #E5E5E0", borderRadius: 12, padding: 24, marginBottom: 16 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 600 },
  textarea: { width: "100%", border: "1px solid #E5E5E0", borderRadius: 8, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", background: "#FAFAF8" },
  quickRow: { display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 10, marginBottom: 14 },
  quickBtn: { fontSize: 11, padding: "4px 11px", borderRadius: 999, border: "1px solid #E5E5E0", background: "#F8F7F4", color: "#666", cursor: "pointer" },
  actionRow: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10 },
  checkLabel: { fontSize: 13, color: "#555", display: "flex", alignItems: "center", cursor: "pointer" },
  runBtn: { padding: "10px 22px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#1a1a1a", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  runBtnDisabled: { background: "#999", borderColor: "#999", cursor: "not-allowed" },
  refreshBtn: { fontSize: 12, padding: "5px 12px", border: "1px solid #E5E5E0", borderRadius: 8, background: "transparent", cursor: "pointer" },
  pipeline: { display: "flex", flexDirection: "column" as const, gap: 10 },
  step: { background: "#fff", border: "1px solid #E5E5E0", borderRadius: 12, padding: "16px 20px" },
  stepHeader: { display: "flex", alignItems: "center", gap: 12 },
  icon: { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, fontWeight: "bold" },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: 600, color: "#1a1a1a" },
  stepSub: { fontSize: 12, color: "#888" },
  badge: { fontSize: 11, padding: "3px 10px", borderRadius: 999 },
  output: { marginTop: 10, padding: "10px 12px", background: "#FAFAF8", borderRadius: 8, fontSize: 13, color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap" as const },
  leadCard: { border: "1px solid #E5E5E0", borderRadius: 8, padding: "12px 14px", marginBottom: 10 },
  leadDetail: { fontSize: 12, color: "#666", marginTop: 3 },
  eventCard: { border: "1px solid #E5E5E0", borderRadius: 8, padding: "12px 14px", marginBottom: 10, background: "#FAFAF8" },
  muted: { fontSize: 14, color: "#999", fontStyle: "italic" },
};