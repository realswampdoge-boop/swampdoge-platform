const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async function handler(req, res) {
  const latest = {
    updatedAt: new Date().toISOString(),
    picks: ["TEST PICK 1", "TEST PICK 2", "TEST PICK 3"],
  };

  await redis.set("vip_picks", latest);
  return res.status(200).json({ ok: true, saved: latest });
};
