// api/admin-publish.js
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }

    const { pin, payload } = req.body || {};
    const ADMIN_PIN = process.env.ADMIN_PIN;

    if (!ADMIN_PIN) {
      return res.status(500).json({ error: "ADMIN_PIN_NOT_SET" });
    }
    if (!pin || pin !== ADMIN_PIN) {
      return res.status(401).json({ error: "WRONG_PIN" });
    }
    if (!payload || !payload.picks || !Array.isArray(payload.picks)) {
      return res.status(400).json({ error: "BAD_PAYLOAD" });
    }

    const toStore = {
      ...payload,
      lastUpdated: new Date().toISOString()
    };

    await kv.set("swamp:picks:latest", toStore);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, stored: toStore });
  } catch (e) {
    return res.status(500).json({ error: "PUBLISH_ERROR", details: String(e) });
  }
}
