export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const base = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!base || !token) {
      return res.status(500).json({ error: "Missing KV config" });
    }

    const { picks } = req.body || {};

    if (!Array.isArray(picks)) {
      return res.status(400).json({ error: "picks must be array" });
    }

    const clean = picks
      .map(p => String(p || "").trim())
      .filter(Boolean)
      .slice(0, 3);

    await fetch(`${base}/set/vip_picks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: JSON.stringify(clean),
      }),
    });

    return res.status(200).json({
      ok: true,
      saved: clean,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({
      error: "publish failed",
      message: e?.message || String(e),
    });
  }
}
