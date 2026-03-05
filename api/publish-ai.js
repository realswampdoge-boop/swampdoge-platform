import OpenAI from "openai";
import { kv } from "@vercel/kv";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const base = `https://${req.headers.host}`;

    // 1) Get today's games from your own endpoint
    const gr = await fetch(`${base}/api/games?v=1`, { cache: "no-store" });
    const gj = await gr.json();
    const games = gj?.games || [];

    if (!games.length) {
      return res.status(200).json({
        ok: true,
        generatedAt: new Date().toISOString(),
        source: "ai_games",
        picks: ["No games found for today."],
        gamesUsed: []
      });
    }

    // 2) Build a compact list of matchups (grouped by league)
    const normalized = games.map((g) => {
      const lg = (g?.league?.league || g?.league || "UNK").toLowerCase();
      const matchup = String(g?.matchup || "").trim();
      return { league: lg, matchup };
    }).filter(x => x.matchup);

    // Keep prompt size reasonable
    const gamesUsed = normalized.slice(0, 40);

    const matchupLines = gamesUsed
      .map((g) => `- [${g.league.toUpperCase()}] ${g.matchup}`)
      .join("\n");

    // 3) Ask AI to choose ONLY from these matchups
    const prompt = `
You are SwampDoge AI Picks.

Use ONLY the matchups listed below.
DO NOT invent teams, games, or leagues not listed.

Return EXACTLY 6 picks total (across ALL leagues), one per line.
Format exactly:
"LEAGUE - PICK"

Rules:
- Each pick must clearly reference teams from ONE listed matchup.
- Allowed pick types: Moneyline, Spread, Total (Over/Under).
- No explanations, no extra text.

Matchups:
${matchupLines}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    });

    const text = completion.choices?.[0]?.message?.content || "";
    let picks = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    // Fallback if AI returns weird output
    if (picks.length < 3) {
      picks = gamesUsed.slice(0, 6).map(g => `${g.league.toUpperCase()} - ${g.matchup} (Moneyline)`);
    }

    const generatedAt = new Date().toISOString();

    // 4) Save "latest picks" so /api/picks can serve them
    const payloadToStore = {
      sport: "ALL",
      lastUpdated: generatedAt,
      picks: picks.map((p) => ({ title: p, body: "" }))
    };

    await kv.set("swamp:picks:latest", payloadToStore);

    // 5) Return result
    return res.status(200).json({
      ok: true,
      generatedAt,
      source: "ai_games",
      picks,
      gamesUsed: gamesUsed.map(g => `${g.league.toUpperCase()}: ${g.matchup}`)
    });

  } catch (e) {
    return res.status(500).json({
      ok: false,
      generatedAt: "",
      picks: [],
      error: String(e?.message || e)
    });
  }
}
