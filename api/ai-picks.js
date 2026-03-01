export default async function handler(req, res) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(500).json({ ok: false, error: "OPENAI_API_KEY missing" });

    // sport can be "nba", etc.
    const sport = String(req.query.sport || "nba").toLowerCase();

    // Simple prompt (you can tune later)
    const prompt = `
You are a sports picks assistant. Return 3 picks for ${sport}.
Respond ONLY as JSON in this exact shape:
{
  "sport": "${sport}",
  "picks": [
    { "title": "...", "reason": "...", "confidence": 0.0 }
  ]
}
Confidence is 0.0 to 1.0.
No extra keys. No markdown.
`;

    // Using OpenAI Responses API via fetch
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    const raw = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ ok: false, error: "OpenAI request failed", details: raw });
    }

    const text =
      raw.output_text ||
      (raw.output && raw.output[0] && raw.output[0].content && raw.output[0].content[0] && raw.output[0].content[0].text) ||
      "";

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({ ok: false, error: "Model did not return JSON", text });
    }

    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      sport,
      picks: parsed.picks || []
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
