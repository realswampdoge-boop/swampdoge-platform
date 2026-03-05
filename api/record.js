// api/record.js
// Simple record store (in-memory). NOTE: resets on redeploy/cold start.
// Next upgrade later: persist to Vercel KV / Upstash.

let cache = {
  ts: 0,
  record: {
    wins: 0,
    losses: 0,
    pushes: 0,
    units: 0,
    updated: new Date().toISOString(),
  },
};

export default async function handler(req, res) {
  try {
    // GET = read record
    if (req.method === "GET") {
      return res.status(200).json(cache.record);
    }

    // POST = update record (optional, simple secret)
    if (req.method === "POST") {
      const secret = req.headers["x-record-secret"];
      const required = process.env.RECORD_SECRET;

      // If you set RECORD_SECRET in Vercel, POST requires the header.
      if (required && secret !== required) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { wins = 0, losses = 0, pushes = 0, units = 0 } = body || {};

      cache.record.wins += Number(wins) || 0;
      cache.record.losses += Number(losses) || 0;
      cache.record.pushes += Number(pushes) || 0;
      cache.record.units += Number(units) || 0;
      cache.record.updated = new Date().toISOString();

      return res.status(200).json(cache.record);
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(200).json(cache.record); // fail soft
  }
}
