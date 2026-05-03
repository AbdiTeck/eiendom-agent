// app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Chief of Staff – AI for eiendomsmeglere",
  description: "AI-agentsystem med Gmail og Google Calendar-integrasjon",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
