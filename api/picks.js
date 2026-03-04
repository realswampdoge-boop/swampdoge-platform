export default function handler(req, res) {
  const league = (req.query.league || "").toUpperCase();

  const picksMap = {
    NBA: ["Warriors ML", "Over 231.5", "Knicks +4"],
    NHL: ["Rangers ML", "Under 6.5", "Bruins +1.5"],
    MLB: ["Yankees ML", "Over 8.5", "Dodgers -1.5"],
    NCAAB: ["Duke -4.5", "Under 145.5", "Kansas ML"],
    EPL: ["Arsenal ML", "Over 2.5", "Both teams score"]
  };

  res.status(200).json({
    league,
    picks: picksMap[league] || []
  });
}
