// lib/google.ts
// Hjelpefunksjoner for å sette opp Google API-klienten med brukerens tokens

import { google } from "googleapis";

// Lager en autentisert Google OAuth2-klient fra brukerens tokens
export function getGoogleClient(accessToken: string, refreshToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return auth;
}

// Gmail-klient
export function getGmailClient(accessToken: string, refreshToken: string) {
  const auth = getGoogleClient(accessToken, refreshToken);
  return google.gmail({ version: "v1", auth });
}

// Calendar-klient
export function getCalendarClient(accessToken: string, refreshToken: string) {
  const auth = getGoogleClient(accessToken, refreshToken);
  return google.calendar({ version: "v3", auth });
}
