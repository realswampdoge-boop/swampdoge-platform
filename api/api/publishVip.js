export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { password, picks } = req.body;

    // ADMIN PASSWORD
    if (password !== "swampadmin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Save picks temporarily (demo storage)
    global.vipPicks = picks;

    return res.status(200).json({
      success: true,
      message: "VIP Picks Published 🐊🔥",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Server error publishing picks",
    });
  }
}
