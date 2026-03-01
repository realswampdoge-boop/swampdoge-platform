// api/ai-picks.js
// AI Picks endpoint for Vercel Serverless Functions (works in /api folder)
//
// Requires env var:
//   OPENAI_API_KEY = your real OpenAI key (starts with sk-...)
// Optional:
//   AI_MODEL = gpt-4.1   (default below)
//   AI_PICKS_DEFAULT_SPORT = nba

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

function pickTextFromResponsesAPI(json) {
  // Responses API returns: { output: [ { content: [ { type:"output_text", text:"..." } ] } ] }
  try {
    const out = json?.output || [];
    for (const msg of out) {
      const content = msg?.content || [];
      for (const c of content) {
        if (c?.type === "output_text" && typeof c?.text === "string") return c.text;
      }
    }
  } catch {}
  // fallback
  if (typeof json?.output_text === "string") return json.output_text;
  return "";
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  noStore(res);

  // Allow GET only (simple to call from the browser)
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      ok: false,
      error: "Missing OPENAI_API_KEY env var in Vercel",
    });
  }

  const model = process.env.AI_MODEL || "gpt-4.1";
  const sport = (req.query.sport || process.env.AI_PICKS_DEFAULT_SPORT || "nba")
    .toString()
    .toLowerCase();

  // how many picks?
  const nRaw = Number(req.query.n || 3);
  const n = Number.isFinite(nRaw) ? Math.max(1, Math.min(8, nRaw)) : 3;

  // Prompt: predictions only (no betting instructions)
  const prompt = `
You are generating "SwampDoge AI Picks" for today.

Rules:
- Provide ${n} picks for ${sport}.
- These are predictions/analysis only. Do NOT mention betting odds, sportsbooks, parlays, units, or gambling instructions.
- Each pick must be short and clear.
- Return STRICT JSON only, no markdown.

JSON format:
{
  "sport": "${sport}",
  "picks": [
    {
      "title": "Short pick title",
      "reason": "1 sentence reason",
      "confidence": 0.00
    }
  ]
}

Confidence is a number from 0.50 to 0.80.
`.trim();

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        temperature: 0.7,
        max_output_tokens: 500,
      }),
    });

    const json = await r.json();

    if (!r.ok) {
      return res.status(500).json({
        ok: false,
        error: "OpenAI request failed",
        status: r.status,
        details: json,
      });
    }

    const text = pickTextFromResponsesAPI(json);
    const parsed = safeJsonParse(text);

    if (!parsed || !Array.isArray(parsed.picks)) {
      return res.status(500).json({
        ok: false,
        error: "AI output was not valid JSON in the expected format",
        raw: text?.slice(0, 800) || "",
      });
    }

    // clean + clamp confidence
    const picks = parsed.picks.slice(0, n).map((p) => ({
      title: String(p.title || "").slice(0, 120),
      reason: String(p.reason || "").slice(0, 240),
      confidence: Math.max(0.5, Math.min(0.8, Number(p.confidence) || 0.6)),
    }));

    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      sport,
      picks,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "Server error calling OpenAI",
      details: String(e?.message || e),
    });
  }
};
