import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const fallback = [
    "PJ Washington over 15pts.",
    "Lakers ML",
    "Celtics -4.5",
  ];

  try {
    const saved = await kv.get("vip_picks"); // <-- KEY NAME

    // If KV has valid picks, return them
    if (saved && Array.isArray(saved.picks) && saved.picks.length >= 1) {
      return res.status(200).json(saved);
    }

    // If nothing saved yet, NEVER return []
    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      picks: fallback,
      source: "fallback_empty_kv",
    });
  } catch (e) {
    // If KV errors, STILL never return []
    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      picks: fallback,
      source: "fallback_error",
      error: String(e?.message || e),
    });
  }
}
