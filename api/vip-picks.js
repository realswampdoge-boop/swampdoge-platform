const { kv } = require("@vercel/kv");

module.exports = async function handler(req, res) {
  try {
    const saved = await kv.get("vip_picks");

    if (saved && Array.isArray(saved.picks) && saved.picks.length) {
      return res.status(200).json(saved);
    }

    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      picks: [
        "PJ Washington over 15pts.",
        "Lakers ML",
        "Celtics -4.5",
      ],
      source: "fallback"
    });

  } catch (e) {
    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      picks: [
        "PJ Washington over 15pts.",
        "Lakers ML",
        "Celtics -4.5",
      ],
      error: String(e?.message || e)
    });
  }
};
