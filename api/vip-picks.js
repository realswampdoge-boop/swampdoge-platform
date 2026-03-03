import { kv } from "@vercel/kv";

const KEY = "SWAMP_VIP_PICKS";

export default async function handler(req, res) {
  try {
    // GET = read picks
    if (req.method === "GET") {
      const data = (await kv.get(KEY)) || {
        updatedAt: new Date().toISOString(),
        picks: ["(no VIP picks yet)"],
      };

      return res.status(200).json(data);
    }

    // POST = save picks
    if (req.method === "POST") {
      const { picks } = req.body || {};
      if (!Array.isArray(picks)) {
        return res.status(400).json({ error: "picks must be an array" });
      }

      const data = {
        updatedAt: new Date().toISOString(),
        picks: picks.slice(0, 10),
      };

      await kv.set(KEY, data);
      return res.status(200).json({ ok: true, ...data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
