import OpenAI from "openai";
import { kv } from "@vercel/kv";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function pick3FromGames(games) {
  // Simple fallback if AI parsing fails: pick first 3 matchups
  return games.slice(0, 3).map((g) => {
    const lg = g?.league?.league || g?.league || "SPORT";
    return `${lg.toUpperCase()} - ${g.matchup} (Moneyline)`;
  });
}

export default async function handler(req, res) {
  try {
    const base = `https://${req.headers.host}`;

    // ✅ Always use TODAY'S games from /api/games
    const gr = await fetch(`${base}/api/games`, { cache: "no-store" });
    const gj = await gr.json();
    const games = gj?.games || [];

    if (!games.length) {
      return res.status(200).json({
        ok: true,
        generatedAt: new Date().toISOString(),
        picks: ["No games found for today."]
      });
    }

    // Build matchup list (keep it readable)
    const matchupLines = games
      .slice(0, 40)
      .map((g) => {
        const lg = g?.league?.league || g?.league || "UNK";
        return `- [${String(lg).toUpperCase()}] ${g.matchup}`;
      })
      .join("\n");

    const prompt = `
You are SwampDoge AI Picks.

Use ONLY the matchups listed below.
Do NOT invent games or leagues not shown.
Return exactly 3 picks, one per line, format exactly:
"LEAGUE - PICK"

Matchups:
${matchupLines}

Rules:
- Pick types allowed: Moneyline or Spread or Total
- Each pick must clearly reference teams from the matchups list
- No explanations, no extra text
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    });

    const text = completion.choices?.[0]?.message?.content || "";

    // Parse lines
    let picks = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    // If AI returned junk, fallback to first 3 matchups
    if (picks.length < 3) {
      picks = pick3FromGames(games);
    }

    const generatedAt = new Date().toISOString();

    // ✅ Store “latest picks” for /api/picks to serve
    const payloadToStore = {
      sport: "ALL",
      lastUpdated: generatedAt,
      picks: picks.map((p) => ({ title: p, body: "" }))
    };

    await kv.set("swamp:picks:latest", payloadToStore);

    return res.status(200).json({
      ok: true,
      generatedAt,
      picks
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
