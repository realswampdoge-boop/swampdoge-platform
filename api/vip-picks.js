export default async function handler(req, res) {
  try {
    const base = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!base || !token) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    const r = await fetch(`${base}/get/vip_picks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const j = await r.json();
    const stored = j?.result;

    const picks = stored ? JSON.parse(stored) : [];

    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      picks: Array.isArray(picks) ? picks : [],
    });
  } catch (e) {
    return res.status(500).json({
      error: "vip-picks crashed",
      message: e?.message || String(e),
    });
  }
}
