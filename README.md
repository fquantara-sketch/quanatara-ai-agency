# Quanatara AI — Android App

App ya chatbot ya Quanatara, iliyojengwa kwa React Native (Expo). Mtu anaongea na bot inayojua huduma za Quanatara, kisha anaongozwa kuwasiliana.

## Jinsi inavyofanya kazi

```
App (React Native)  ->  Supabase Edge Function  ->  DeepSeek API
```

App haiongei na DeepSeek moja kwa moja. Inatuma ujumbe kwenye edge function yetu, na function hiyo (iliyo kwenye server) ndiyo inayoshikilia `DEEPSEEK_API_KEY`. Kwa hivyo key haionekani kwenye APK kabisa — mtu akipakua app hawezi kuichukua.

## Setup

### 1. Deploy backend (mara moja)

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set DEEPSEEK_API_KEY=sk-your-real-key
supabase functions deploy chat --no-verify-jwt
```

Baada ya deploy, utapata URL kama:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat`

### 2. Weka .env

```bash
cp .env.example .env
```

Weka:
- `EXPO_PUBLIC_CHAT_API_URL` = URL ya function uliyoipata hapo juu
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` = anon key ya project yako (Supabase → Settings → API)

### 3. Endesha kwenye simu (kuona kama inafanya kazi)

```bash
npm install
npx expo start
```

Scan QR code na app ya **Expo Go** kwenye simu yako.

### 4. Jenga APK halisi

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

Baada ya ~15-20 dakika utapata link ya kupakua `.apk`. Tuma kwa mtu yeyote, au weka Play Store kwa profile ya `production` (inatoa `.aab`).

## Kumbuka kuhusu icons

`app.json` inataja `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png` na `assets/favicon.png`. Ongeza picha zako hapo kabla ya kujenga APK — au badilisha `app.json` kama hutaki icons zako bado.

## Badilisha bot inavyojibu

System prompt ya bot iko kwenye `supabase/functions/chat/index.ts`. Badilisha maneno hapo, kisha u-deploy tena (`supabase functions deploy chat --no-verify-jwt`) — mabadiliko yanaonekana mara moja bila kujenga app upya.
