export default async function handler(req, res) {
  try {
    const origin =
      (req.headers["x-forwarded-proto"] || "https") + "://" + req.headers.host;

    // Read the latest deployed JSON from /public
    const r = await fetch(origin + "/vip-picks.json", {
      cache: "no-store",
      headers: { "cache-control": "no-store" },
    });

    if (!r.ok) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(r.status).json({ error: "vip-picks.json not found" });
    }

    const data = await r.json();

    // Prevent edge/browser caching
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    return res.status(200).json(data);
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: String(e) });
  }
}
