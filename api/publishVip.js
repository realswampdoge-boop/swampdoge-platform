import { kv } from "@vercel/kv";

function normalize(lines) {
  return (lines || [])
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export default async function handler(req, res) {
  try {
    let picks = [];

    const body = req.body || {};
    if (typeof body.text === "string") picks = body.text.split("\n");
    if (Array.isArray(body.picks)) picks = body.picks;

    picks = normalize(picks);

    if (picks.length === 0) {
      return res.status(400).json({ ok: false, error: "No picks provided" });
    }

    const payload = { updatedAt: new Date().toISOString(), picks };

    await kv.set("vip_picks", payload); // <-- SAME KEY NAME
    return res.status(200).json({ ok: true, saved: payload });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
