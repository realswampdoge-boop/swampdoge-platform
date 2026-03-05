import OpenAI from "openai";

// Map your UI league keys to the league codes coming from /api/games
const LEAGUE_MAP = {
  NBA: "nba",
  NHL: "nhl",
  MLB: "mlb",
  NCAAB: "mens-college-basketball",
  EPL: "eng.1",
  UCL: "uefa.champions",
  NFL: "nfl",
};

function demoPicks(leagueKey) {
  const map = {
    NBA: ["Warriors ML", "Over 231.5", "Knicks +4"],
    NHL: ["Rangers ML", "Under 6.5", "Bruins +1.5"],
    MLB: ["Yankees ML", "Over 8.5", "Dodgers -1.5"],
    NCAAB: ["Gonzaga -5", "Duke -3", "Over 145.5"],
    EPL: ["Arsenal ML", "Over 2.5", "Both teams score"],
    UCL: ["Home or Draw", "Over 2.5", "Both teams score"],
    NFL: ["Home +3.5", "Under 47.5", "Moneyline (home)"],
  };
  return map[leagueKey] || ["Demo picks loaded"];
}

// Tries to parse JSON from the model; falls back to line-splitting.
function parsePicksFromModel(text) {
  const t = (text || "").trim();

  // Try JSON first
  try {
    const j = JSON.parse(t);
    if (j && Array.isArray(j.picks)) {
      return j.picks.map((s) => String(s).trim()).filter(Boolean).slice(0, 3);
    }
  } catch (_) {}

  // Fallback: lines
  const lines = t
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    // remove bullets / numbering
    .map((s) => s.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    // remove obvious "intro" sentences if any slipped in
    .filter((s) => !/^sure/i.test(s) && !/^here are/i.test(s));

  return lines.slice(0, 3);
}

export default async function handler(req, res) {
  try {
    const leagueKey = String(req.query.league || "NBA").toUpperCase();
    const leagueCode = LEAGUE_MAP[leagueKey] || "nba";

    // Build absolute URL to call our own /api/games on Vercel
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const base = `${proto}://${host}`;

    // Pull today’s games from your working endpoint
    const gr = await fetch(`${base}/api/games`, { cache: "no-store" });
    const gj = await gr.json();
    const allGames = Array.isArray(gj.games) ? gj.games : [];

    // Filter games for the requested league
    const leagueGames = allGames.filter((g) => {
      const code = g?.league?.league; // e.g. "nba", "nhl", "mlb"
      return code === leagueCode;
    });

    const matchups = leagueGames
      .map((g) => g.matchup)
      .filter(Boolean)
      .slice(0, 12);

    // If no games, return demo picks so your UI doesn’t break
    if (matchups.length === 0) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        league: leagueKey,
        picks: demoPicks(leagueKey),
        source: "demo_no_games",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // IMPORTANT: force clean output (no intro sentences)
    const prompt = `
You are SwampDoge Picks Engine.

League: ${leagueKey}

Today's games (use ONLY these teams):
${matchups.map((m) => `- ${m}`).join("\n")}

Return EXACTLY 3 picks based on those games.
Rules:
- NO intro text, NO explanations
- NO numbering, NO bullets
- Each pick should be a short betting-style line (e.g. "Celtics ML", "Over 220.5", "Knicks +4")
- Only choose teams that appear in the games list above
- Output MUST be valid JSON only in this format:
{"picks":["PICK1","PICK2","PICK3"]}
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: "Return JSON only. No extra text." },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    });

    const text = completion?.choices?.[0]?.message?.content || "";
    const picks = parsePicksFromModel(text);

    // If the model messed up, fall back to demo
    const finalPicks = picks.length === 3 ? picks : demoPicks(leagueKey);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      league: leagueKey,
      picks: finalPicks,
      source: picks.length === 3 ? "ai_games" : "demo_parse_fallback",
      gamesUsed: matchups.slice(0, 6),
    });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      league: String(req.query.league || "NBA").toUpperCase(),
      picks: demoPicks(String(req.query.league || "NBA").toUpperCase()),
      source: "demo_error",
      error: String(e?.message || e),
    });
  }
}
