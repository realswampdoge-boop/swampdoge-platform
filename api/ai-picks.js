export default async function handler(req, res) {
  try {

    const today = new Date().toISOString().slice(0,10);

    const base = `https://${req.headers.host}`;
    const r = await fetch(`${base}/api/publish-ai`);
    const j = await r.json();

    if (!r.ok || !j?.picks?.length) {
      throw new Error(j?.error || "AI picks generation failed");
    }

    return res.status(200).json({
      picks: j.picks,
      updatedAt: today
    });

  } catch (e) {

    return res.status(500).json({
      updatedAt: "",
      picks: [],
      error: String(e?.message || e)
    });

  }
}
