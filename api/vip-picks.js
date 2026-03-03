const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const data = await redis.get("vip_picks");
    return res.status(200).json(data || { updatedAt: null, picks: [] });
  } catch (e) {
    return res.status(500).json({ updatedAt: null, picks: [], error: String(e?.message || e) });
  }
};
