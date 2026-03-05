import OpenAI from "openai";
import { kv } from "@vercel/kv";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function normalize(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Very simple “is this pick based on a real matchup?” validator
function pickMatchesAnyGame(pickLine, gamesUsed) {
  const p = normalize(pickLine);
  return gamesUsed.some(g => {
    const m = normalize(g.matchup);
    // require at least one team token from matchup to appear in pick text
    const parts = m.split(" vs ");
    if (parts.length !== 2) return false;
    const a = parts[0].trim().split(" ").slice(-2).join(" "); // last 2 words
    const b = parts[1].trim().split(" ").slice(-2).join(" ");
    return p.includes(a) || p.includes(b);
  });
}

export default async function handler(req, res) {
  try {
    const base = `https://${req.headers.host}`;

    // 1) Pull TODAY games
    const gr = await fetch(`${base}/api/games?v=${Date.now()}`, { cache: "no-store" });
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

    // 2) Normalize + keep prompt size reasonable
    const gamesUsed = games
      .map(g => ({
        league: (g?.league?.league || g?.league || "unk").toLowerCase(),
        matchup: String(g?.matchup || "").trim()
      }))
      .filter(g => g.matchup)
      .slice(0, 40);

    const matchupLines = gamesUsed
      .map(g => `- [${g.league.toUpperCase()}] ${g.matchup}`)
      .join("\n");

    // 3) Ask AI for picks across ALL leagues
    const prompt = `
You are SwampDoge AI Picks.

Use ONLY the matchups listed below.
DO NOT invent teams/games/leagues.

Return EXACTLY 6 picks total across ALL leagues.
Format EXACTLY one per line:
"LEAGUE - PICK"

Rules:
- Each pick must reference teams from ONE listed matchup.
- Allowed: Moneyline, Spread, Total (Over/Under)
- No explanations.

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
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 10); // grab a few extra then validate

    // 4) Validation: remove any pick not tied to TODAY games
    picks = picks.filter(p => pickMatchesAnyGame(p, gamesUsed)).slice(0, 6);

    // If AI still gave junk, fallback: build 6 from the games list
    if (picks.length < 3) {
      picks = gamesUsed.slice(0, 6).map(g => `${g.league.toUpperCase()} - ${g.matchup} (Moneyline)`);
    }

    const generatedAt = new Date().toISOString();

    // 5) Save for /api/picks
    await kv.set("swamp:picks:latest", {
      sport: "ALL",
      lastUpdated: generatedAt,
      picks: picks.map(p => ({ title: p, body: "" }))
    });

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
