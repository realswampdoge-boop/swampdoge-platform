export default async function handler(req, res) {
  try {
    const provided =
      String(req.headers["x-cron-secret"] || req.query.secret || "").trim();
    const CRON_SECRET = String(process.env.CRON_SECRET || "").trim();

    // If CRON_SECRET exists, enforce it
    if (CRON_SECRET && provided !== CRON_SECRET) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (!base) return res.status(500).json({ ok: false, error: "NEXT_PUBLIC_BASE_URL missing" });

    const r = await fetch(`${base}/api/publish-ai`, { method: "POST" });
    const data = await r.json().catch(() => ({}));

    return res.status(200).json({ ok: true, publishAi: data });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
