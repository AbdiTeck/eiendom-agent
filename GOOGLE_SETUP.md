# Google OAuth Setup – Steg for steg

## 1. Opprett Google Cloud-prosjekt

1. Gå til https://console.cloud.google.com
2. Klikk "New Project" → gi det navn "eiendom-agent"
3. Klikk "Create"

## 2. Aktiver APIer

I Google Cloud Console, gå til "APIs & Services" → "Enable APIs":
- Søk etter og aktiver: **Gmail API**
- Søk etter og aktiver: **Google Calendar API**

## 3. Opprett OAuth credentials

1. Gå til "APIs & Services" → "Credentials"
2. Klikk "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Navn: "eiendom-agent"
5. Under "Authorized redirect URIs", legg til:
   - http://localhost:3000/api/auth/callback (utvikling)
   - https://ditt-domene.vercel.app/api/auth/callback (produksjon)
6. Klikk "Create" → kopier Client ID og Client Secret

## 4. OAuth consent screen

1. Gå til "OAuth consent screen"
2. User Type: **External**
3. Fyll inn app-navn, e-post
4. Scopes – legg til:
   - https://www.googleapis.com/auth/gmail.send
   - https://www.googleapis.com/auth/gmail.readonly
   - https://www.googleapis.com/auth/calendar
5. Test users: legg til din egen e-post

## 5. Legg til i .env.local

```
GOOGLE_CLIENT_ID=din_client_id_her
GOOGLE_CLIENT_SECRET=din_client_secret_her
NEXTAUTH_SECRET=et_tilfeldig_langt_passord_her
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=din_openai_nøkkel_her
```

Generer NEXTAUTH_SECRET med:
```bash
openssl rand -base64 32
```
Eller bruk: https://generate-secret.vercel.app/32
