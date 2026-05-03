// app/api/auth/[...nextauth]/route.ts
// Håndterer Google OAuth innlogging og lagrer access tokens

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            // Gmail – sende og lese e-post
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.readonly",
            // Google Calendar – opprette og lese avtaler
            "https://www.googleapis.com/auth/calendar",
          ].join(" "),
          access_type: "offline",  // Gir oss refresh_token
          prompt: "consent",       // Tvinger Google til å gi refresh_token
        },
      },
    }),
  ],

  callbacks: {
    // Lagrer access_token og refresh_token i JWT-sesjonen
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },

    // Gjør tokens tilgjengelig i useSession() på klienten
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
