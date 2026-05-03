"use client";
// app/login/page.tsx

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/");
  }, [session, router]);

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.logo}>★</div>
        <h1 style={styles.title}>Chief of Staff</h1>
        <p style={styles.sub}>AI-agentsystem for eiendomsmeglere</p>

        <button
          style={styles.googleBtn}
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 10 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Logg inn med Google
        </button>

        <p style={styles.note}>
          Appen ber om tilgang til Gmail og Google Calendar for å sende e-poster og booke visninger på dine vegne.
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#F8F7F4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Georgia, serif",
    padding: 20,
  },
  card: {
    background: "#fff",
    border: "1px solid #E5E5E0",
    borderRadius: 16,
    padding: "48px 40px",
    maxWidth: 400,
    width: "100%",
    textAlign: "center",
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#CECBF6",
    color: "#3C3489",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    margin: "0 auto 20px",
  },
  title: { margin: "0 0 8px", fontSize: 24, fontWeight: 600, color: "#1a1a1a" },
  sub: { margin: "0 0 32px", fontSize: 14, color: "#888" },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "12px 20px",
    border: "1px solid #E5E5E0",
    borderRadius: 8,
    background: "#fff",
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
    color: "#1a1a1a",
    marginBottom: 20,
  },
  note: { fontSize: 12, color: "#aaa", lineHeight: 1.6 },
};
