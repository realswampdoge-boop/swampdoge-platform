import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const data = await kv.get("vip_picks");

    // If nothing saved yet, return a safe default
    if (!data) {
      return res.status(200).json({
        updatedAt: null,
        picks: []
      });
    }

    // If KV accidentally stored a string, parse it safely
    if (typeof data === "string") {
      try {
        return res.status(200).json(JSON.parse(data));
      } catch {
        return res.status(200).json({ updatedAt: null, picks: [] });
      }
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(200).json({ updatedAt: null, picks: [] });
  }
}
