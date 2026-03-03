const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const body = req.body || {};
    let picks = Array.isArray(body.picks) ? body.picks : [];

    picks = picks.map(p => String(p).trim()).filter(Boolean).slice(0, 3);

    if (!picks.length) {
      return res.status(400).json({ ok: false, error: "No picks provided" });
    }

    const latest = { updatedAt: new Date().toISOString(), picks };

    await redis.set("vip_picks", latest);

    return res.status(200).json({ ok: true, saved: latest });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
};
