export default async function handler(req, res) {

  try {

    const leagues = [
  { sport: "basketball", league: "nba" },
  { sport: "hockey", league: "nhl" },
  { sport: "baseball", league: "mlb" },
  { sport: "basketball", league: "mens-college-basketball" },
  { sport: "soccer", league: "eng.1" }
];

    const games = [];

    for (const league of leagues) {

      const r = await fetch(
`https://site.api.espn.com/apis/site/v2/sports/${league.sport}/${league.league}/scoreboard`
);

      const data = await r.json();

      if (!data.events) continue;

      data.events.forEach(e => {

        const home = e.competitions[0].competitors.find(c => c.homeAway === "home").team.displayName;
        const away = e.competitions[0].competitors.find(c => c.homeAway === "away").team.displayName;

        games.push({
          league,
          matchup: `${away} vs ${home}`
        });

      });

    }

    res.status(200).json({ games });

  } catch (e) {

    res.status(200).json({
      games: []
    });

  }

}
