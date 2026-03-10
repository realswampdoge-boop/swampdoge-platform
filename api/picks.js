import OpenAI from "openai";

const LEAGUE_MAP = {
  NBA: "nba",
  NHL: "nhl",
  MLB: "mlb",
  NCAAB: "mens-college-basketball",
  EPL: "eng.1",
  UCL: "uefa.champions",
  NFL: "nfl",
};

function emptyPicks(leagueKey) {
  const map = {
    NBA: ["No NBA picks posted yet"],
    NHL: ["No NHL picks posted yet"],
    MLB: ["No MLB picks posted yet"],
    NCAAB: ["No NCAAB picks posted yet"],
    EPL: ["No EPL picks posted yet"],
    UCL: ["No UCL picks posted yet"],
    NFL: ["NFL is currently in offseason — no games today"],
  };
  return map[leagueKey] || ["No picks posted yet"];
}

function parsePicksFromModel(text) {
  const t = (text || "").trim();

  try {
    const j = JSON.parse(t);
    if (j && Array.isArray(j.picks)) {
      return j.picks.map((s) => String(s).trim()).filter(Boolean).slice(0, 3);
    }
  } catch (_) {}

  const lines = t
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter((s) => !/^sure/i.test(s) && !/^here are/i.test(s));

  return lines.slice(0, 3);
}

export default async function handler(req, res) {
  try {
    // =========================
    // 1) TOKEN PAYOUT BRANCH
    // =========================
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const action = String(body.action || "");

      if (action === "payout") {
        const adminPin = String(body.adminPin || "");
        const toWallet = String(body.toWallet || "").trim();
        const amount = Number(body.amount || 0);

        if (adminPin !== process.env.ADMIN_PIN) {
          return res.status(401).json({ ok: false, error: "Wrong admin pin" });
        }

        if (!toWallet) {
          return res.status(400).json({ ok: false, error: "Missing destination wallet" });
        }

        if (!amount || amount <= 0) {
          return res.status(400).json({ ok: false, error: "Invalid amount" });
        }

        // SAFE SKELETON ONLY
        // Real transfer code goes here later.
        return res.status(200).json({
          ok: true,
          message: "Payout request accepted",
          toWallet,
          amount,
        });
      }

      return res.status(400).json({ ok: false, error: "Unknown POST action" });
    }

    // =========================
    // 2) EXISTING PICKS LOGIC
    // =========================
    const leagueKey = String(req.query.league || "NBA").toUpperCase();
    const leagueCode = LEAGUE_MAP[leagueKey] || "nba";

    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const base = `${proto}://${host}`;

    const gr = await fetch(`${base}/api/games`, { cache: "no-store" });
    const gj = await gr.json();
    const allGames = Array.isArray(gj.games) ? gj.games : [];

    const leagueGames = allGames.filter((g) => {
      const code = g?.league?.league;
      return code === leagueCode;
    });

    const matchups = leagueGames
      .map((g) => g.matchup)
      .filter(Boolean)
      .slice(0, 12);

    if (matchups.length === 0) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        league: leagueKey,
        picks: emptyPicks(leagueKey),
        source: "no_games_today",
        gamesUsed: [],
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        league: leagueKey,
        picks: emptyPicks(leagueKey),
        source: "missing_openai_key",
        gamesUsed: matchups.slice(0, 6),
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are SwampDoge Picks Engine.

League: ${leagueKey}

Today's games (use ONLY these teams):
${matchups.map((m) => `- ${m}`).join("\n")}

Return EXACTLY 3 picks.
Rules:
- NO intro text
- NO explanations
- NO numbering
- NO bullets
- Each pick must be short
- Only use teams from the games above
- Output valid JSON only:
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

    res.setHeader("Cache-Control", "no-store");

    if (picks.length !== 3) {
      return res.status(200).json({
        league: leagueKey,
        picks: emptyPicks(leagueKey),
        source: "ai_parse_failed",
        gamesUsed: matchups.slice(0, 6),
      });
    }

    return res.status(200).json({
      league: leagueKey,
      picks,
      source: "ai_games",
      gamesUsed: matchups.slice(0, 6),
    });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      league: String(req.query.league || "NBA").toUpperCase(),
      picks: ["Picks temporarily unavailable"],
      source: "api_error",
      error: String(e?.message || e),
    });
  }
}
