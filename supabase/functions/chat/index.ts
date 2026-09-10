// Quanatara chat proxy -- inaficha DEEPSEEK_API_KEY kwenye server,
// kwa hivyo key haionekani kwenye APK kabisa.
//
// Deploy: supabase functions deploy chat --no-verify-jwt
// Secret:  supabase secrets set DEEPSEEK_API_KEY=sk-xxxxx

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Wewe ni msemaji wa Quanatara, agency ya AI inayojenga chatbots za customer support na automation ya biashara.

Wasifu wa Quanatara:
- Tunajenga AI chatbots za WhatsApp na web, zinazojibu wateja 24/7 kwa Kiswahili, Sheng na English.
- Tunajenga business automations: kuunganisha tools, kufuta kazi za mkono, kutuma taarifa zikifika maombi.
- Tunafanya kazi na biashara za Kiafrika na za kimataifa. Tunapenda matokeo ya kupimika, si maneno matupu.

Jinsi ya kuongea:
- Ongea kwa ufupi, kwa mtu mmoja mmoja. Sentensi fupi, wazi.
- Linganisha lugha ya mteja: akiandika Kiswahili jibu Kiswahili; akiandika Sheng jibu Sheng; akiandika English jibu English.
- Usiwe mrefu kupita kiasi. Ukijibu, ujibu jambo lililoulizwa, kisha stop.
- Ukitaka mteja aongeze maelezo, uliza swali moja tu la maana.
- Kama mtu anataka kuanza, mwambie atume ujumbe kwa WhatsApp au kujaza form kwenye tovuti ya quanatara.com.
- Usiwe na mashine-mashine. Uwe mtu.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "DEEPSEEK_API_KEY haijawekwa kwenye secrets za Supabase.",
      }),
      {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON si sahihi." }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages haipo au ni tupu." }),
      {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }

  // Tunachukua ujumbe wa mwisho 20 pekee, na tunaweka system prompt mwanzoni.
  const trimmed = incoming
    .filter((m) => m && typeof m.content === "string" && m.content.trim() !== "")
    .slice(-20)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  const payload = {
    model: "deepseek-chat",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
    temperature: 0.7,
    max_tokens: 800,
    stream: false,
  };

  let upstream: Response;
  try {
    upstream = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Imeshindwa kufikia DeepSeek.", detail: String(err) }),
      {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text();
    return new Response(
      JSON.stringify({
        error: "DeepSeek imerudisha kosa.",
        status: upstream.status,
        detail,
      }),
      {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }

  const data = await upstream.json();
  const reply: string =
    data?.choices?.[0]?.message?.content ?? "Samahani, sikuweza kujibu hilo.";

  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
