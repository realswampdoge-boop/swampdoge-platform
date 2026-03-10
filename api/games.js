export default async function handler(req, res) {
  try {
    const TZ = "America/New_York"; // Tampa time
    const todayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ
    }).format(new Date());
    const todayYYYYMMDD = todayKey.replaceAll("-", "");

    const leagues = [
      { sport: "basketball", league: "nba" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "basketball", league: "mens-college-basketball" },
      { sport: "soccer", league: "eng.1" }
    ];

    const games = [];

    for (const league of leagues) {
      const url =
        `https://site.api.espn.com/apis/site/v2/sports/${league.sport}/${league.league}/scoreboard?dates=${todayYYYYMMDD}`;

      const r = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });

      if (!r.ok) continue;

      const data = await r.json();
      if (!Array.isArray(data?.events)) continue;

      data.events.forEach((e) => {
        const comps = e?.competitions?.[0]?.competitors || [];
        const homeTeam = comps.find((c) => c.homeAway === "home")?.team?.displayName;
        const awayTeam = comps.find((c) => c.homeAway === "away")?.team?.displayName;

        if (!homeTeam || !awayTeam) return;

        games.push({
          league,
          matchup: `${awayTeam} vs ${homeTeam}`,
          date: e?.date || "",
          status: e?.status?.type?.description || ""
        });
      });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ games });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      games: [],
      error: String(e?.message || e)
    });
  }
}
