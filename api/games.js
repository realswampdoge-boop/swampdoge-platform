export default async function handler(req, res) {

  try {

    const leagues = [
      "nba",
      "nhl",
      "mlb",
      "ncaab",
      "soccer_epl"
    ];

    const games = [];

    for (const league of leagues) {

      const r = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${league}/scoreboard`
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
