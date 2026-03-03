export default function handler(req, res) {
  res.status(200).json({
    updatedAt: new Date().toISOString(),
    picks: [
      "Pj Washington over 15pts.",
      "Lakers ML",
      "Celtics -4.5"
    ]
  });
}

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
