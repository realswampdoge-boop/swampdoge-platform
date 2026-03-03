import { kv } from "@vercel/kv";
let latest = {
  updatedAt: new Date().toISOString(),
  picks: [
    "PJ Washington over 15pts.",
    "Lakers ML",
    "Celtics -4.5"
  ]
};

module.exports = async function handler(req, res) {
  try {
    const body = req.body || {};
    let picks = [];

    if (Array.isArray(body.picks)) {
      picks = body.picks;
    }

    picks = picks
      .map(p => String(p).trim())
      .filter(Boolean)
      .slice(0, 3);

    if (!picks.length) {
      return res.status(400).json({ ok: false });
    }

    latest = {
      updatedAt: new Date().toISOString(),
      picks
    };

    await kv.set("vip_picks", latest);
    
    return res.status(200).json({ ok: true, saved: latest });

  } catch (e) {
    return res.status(500).json({ ok: false });
  }
};
