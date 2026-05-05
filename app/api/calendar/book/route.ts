// app/api/calendar/book/route.ts
// Oppretter visningsavtaler i Google Calendar og sender invitasjoner

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCalendarClient } from "@/lib/google";

interface BookingBody {
  title: string;          // F.eks. "Visning – Storgata 12"
  date: string;           // ISO 8601: "2025-05-10T12:00:00"
  durationMinutes: number; // F.eks. 60
  address: string;         // Visningsadresse
  attendeeEmails: string[]; // E-poster til interessenter
  description?: string;    // Valgfri beskrivelse
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const body: BookingBody = await req.json();
  const { title, date, durationMinutes, address, attendeeEmails, description } = body;

  if (!title || !date || !address) {
    return NextResponse.json({ error: "Mangler title, date eller address" }, { status: 400 });
  }

  try {
    const calendar = getCalendarClient(session.accessToken, session.refreshToken);

    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + (durationMinutes ?? 60) * 60 * 1000);

    const event = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: "all", // Sender automatisk e-postinvitasjon til alle attendees
      requestBody: {
        summary: title,
        description: description ?? `Visning arrangert av ${session.user?.name}`,
        location: address,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: "Europe/Oslo",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "Europe/Oslo",
        },
        attendees: attendeeEmails.map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // E-post 24 timer før
            { method: "popup", minutes: 60 },       // Pop-up 1 time før
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      eventId: event.data.id,
      eventLink: event.data.htmlLink,
      message: `Visning booket: ${title} – ${startTime.toLocaleDateString("nb-NO")} kl. ${startTime.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}`,
    });
  } catch (error) {
    console.error("Calendar booking error:", error);
    return NextResponse.json({ error: "Kunne ikke booke visning" }, { status: 500 });
  }
}

// Henter kommende visninger fra Google Calendar
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  try {
    const calendar = getCalendarClient(session.accessToken, session.refreshToken);

    const result = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
      q: "Visning", // Filtrerer kun visningsavtaler
    });

    const events = (result.data.items ?? []).map((e) => ({
      id: e.id,
      title: e.summary,
      start: e.start?.dateTime,
      end: e.end?.dateTime,
      location: e.location,
      attendees: e.attendees?.map((a) => a.email) ?? [],
      link: e.htmlLink,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json({ error: "Kunne ikke hente kalender" }, { status: 500 });
  }
}
