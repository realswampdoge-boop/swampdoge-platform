import OpenAI from "openai";
import { kv } from "@vercel/kv";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const base = `https://${req.headers.host}`;

    // 1) Pull today’s real games from your own API
    const gamesResp = await fetch(`${base}/api/games`, { cache: "no-store" });
    const gamesJson = await gamesResp.json();
    const games = gamesJson?.games || [];

    if (!games.length) {
      return res.status(200).json({
        generatedAt: new Date().toISOString(),
        picks: ["No games found for today."]
      });
    }

    // Keep prompt short: only send matchups
    const matchupLines = games
      .slice(0, 30)
      .map((g) => `- [${g?.league?.league || g?.league || "UNK"}] ${g.matchup}`)
      .join("\n");

    // 2) Ask AI to pick from THESE matchups only
    const prompt = `
You are SwampDoge Picks.
Use ONLY the matchups listed below. Do NOT invent games.
Return exactly 3 picks as plain text lines, format:
"LEAGUE - PICK"

Matchups:
${matchupLines}

Rules:
- Only choose from the matchups listed
- No explanations, no extra text
- Prefer Moneyline or Spread picks
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    });

    const text = completion.choices?.[0]?.message?.content || "";
    const picks = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    const generatedAt = new Date().toISOString();

    // 3) Save picks to KV so /api/picks can serve “latest”
    const payloadToStore = {
      sport: "ALL",
      lastUpdated: generatedAt,
      picks: picks.map((p) => ({ title: p, body: "" }))
    };

    await kv.set("swamp:picks:latest", payloadToStore);

    // 4) Return result
    return res.status(200).json({
      generatedAt,
      picks
    });
  } catch (e) {
    return res.status(500).json({
      generatedAt: "",
      picks: [],
      error: String(e?.message || e)
    });
  }
}
