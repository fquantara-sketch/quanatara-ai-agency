# Quanatara AI — Android App

App ya chatbot ya Quanatara, iliyojengwa kwa React Native (Expo). Mtu anaongea na bot inayojua huduma za Quanatara, kisha anaongozwa kuwasiliana.

## Jinsi inavyofanya kazi

```
App (React Native)  ->  Supabase Edge Function  ->  DeepSeek API
```

App haiongei na DeepSeek moja kwa moja. Inatuma ujumbe kwenye edge function yetu, na function hiyo (iliyo kwenye server) ndiyo inayoshikilia `DEEPSEEK_API_KEY`. Kwa hivyo key haionekani kwenye APK kabisa — mtu akipakua app hawezi kuichukua.

Project ref yako: **smszwcvryknxxwjihuax**
URL ya project yako: `https://smszwcvryknxxwjihuax.supabase.co`

---

## Hatua 1 — Deploy backend (fanya wewe mwenyewe, mara moja)

Hizi ni amri za terminal kwenye kompyuta yako. Zinahitaji Node.js imewekwa.

> **Windows: kama unaona `npx.ps1 cannot be loaded because running scripts is disabled`**
>
> PowerShell inazuia scripts kwa default. Suluhisho rahisi ni kubadilisha kwenda **Command Prompt** (fungua Start, andika `cmd`) na kuendesha amri hizo hapo.
>
> Kama unataka kubaki PowerShell, endesha hii mara moja kisha fungua dirisha jipya:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
>
> Njia ya tatu: weka `cmd /c` mbele ya kila amri, mfano `cmd /c "npx supabase login"`.

Kwanza ingia kwenye folder la mradi (amri hizi zinaendesha ndani ya folder lilo na `package.json`):

```bash
git clone https://github.com/fquantara-sketch/quanatara-ai-agency.git
cd quanatara-ai-agency
```

Kisha:

```bash
npm install -g supabase
supabase login
supabase link --project-ref smszwcvryknxxwjihuax
supabase secrets set DEEPSEEK_API_KEY=sk-weka-key-yako-halisi-hapa
supabase functions deploy chat --no-verify-jwt
```

`supabase login` itafungua browser na kukuomba access token — hiyo ni njia salama ya kuthibitisha, hakuna password inayopita hapa.

Baada ya deploy, function yako itakuwa hapa:
`https://smszwcvryknxxwjihuax.supabase.co/functions/v1/chat`

### Jaribu kama inafanya kazi

```bash
curl -X POST https://smszwcvryknxxwjihuax.supabase.co/functions/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Habari, mnafanya nini?"}]}'
```

Ukiona jibu la JSON, backend yako ipo tayari.

---

## Hatua 2 — Weka .env

```bash
cp .env.example .env
```

Kisha fungua `.env` na uweke:

```
EXPO_PUBLIC_CHAT_API_URL=https://smszwcvryknxxwjihuax.supabase.co/functions/v1/chat
EXPO_PUBLIC_SUPABASE_URL=https://smszwcvryknxxwjihuax.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key kutoka Settings -> API>
```

`.env` inaingia `.gitignore`, kwa hivyo haiingii GitHub.

---

## Hatua 3 — Endesha kwenye simu (kuona kama inafanya kazi)

```bash
npm install
npx expo start
```

Scan QR code na app ya **Expo Go** kwenye simu yako. Chat itafanya kazi mara moja ikiwa Hatua 1 imekamilika.

---

## Hatua 4 — Jenga APK halisi

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

Baada ya ~15-20 dakika utapata link ya kupakua `.apk`. Tuma kwa mtu yeyote, au weka Play Store kwa profile ya `production` (inatoa `.aab`).

---

## Icons

`app.json` inataja `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png` na `assets/favicon.png`. Ongeza picha zako hapo kabla ya kujenga APK — au badilisha `app.json` kama hutaki icons zako bado.

---

## Badilisha bot inavyojibu

System prompt ya bot iko kwenye `supabase/functions/chat/index.ts`. Badilisha maneno hapo, kisha u-deploy tena:

```bash
supabase functions deploy chat --no-verify-jwt
```

Mabadiliko yanaonekana mara moja bila kujenga app upya.

---

## Usalama — jambo la kukumbuka

Function imedeploywa kwa `--no-verify-jwt`, maana yake mtu yeyote anayejua URL anaweza kuitumia. Kwa demo hii inafaa. Kwa app halisi yenye watumiaji wengi, unataka:

- kuondoa `--no-verify-jwt` ili JWT itolewe na kila mtu ajiingize
- kuweka rate limiting ili mtu asichome pesa zako kwa maombi mengi
- kufuatilia matumizi kwenye dashboard ya DeepSeek
