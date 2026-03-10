export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const league = String(req.query.league || "NBA").toUpperCase();
    const base = `https://${req.headers.host}`;

    const r = await fetch(`${base}/api/picks?league=${encodeURIComponent(league)}`, {
      cache: "no-store"
    });

    const j = await r.json();

    if (!r.ok || !Array.isArray(j?.picks)) {
      throw new Error(j?.error || "AI picks failed");
    }

    return res.status(200).json({
      picks: j.picks,
      updatedAt: today,
      league,
      source: j?.source || "api_picks"
    });
  } catch (e) {
    return res.status(500).json({
      updatedAt: "",
      picks: [],
      error: String(e?.message || e)
    });
  }
}
