const { kv } = require("@vercel/kv");

module.exports = async function handler(req, res) {
  try {
    const body = req.body || {};
    let picks = [];

    if (Array.isArray(body.picks)) {
      picks = body.picks;
    } else if (typeof body.text === "string") {
      picks = body.text.split("\n");
    }

    picks = picks
      .map(p => String(p).trim())
      .filter(Boolean)
      .slice(0, 3);

    if (!picks.length) {
      return res.status(400).json({ ok: false, error: "No picks provided" });
    }

    const payload = {
      updatedAt: new Date().toISOString(),
      picks
    };

    await kv.set("vip_picks", payload);

    return res.status(200).json({ ok: true, saved: payload });

  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
};
