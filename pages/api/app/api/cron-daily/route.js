// pages/api/cron-daily.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  // simple secret so random people can't trigger it
  const secret = req.headers["x-cron-secret"];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;

    // Default daily content (edit this text anytime)
    const dailyPicksText =
      "🔥 Daily reset ✅\n" +
      "New VIP picks will be posted soon.\n" +
      "Stay tuned 🐊";

    // Call your existing VIP publisher endpoint
    const resp = await fetch(`${baseUrl}/api/publishVip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin: process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD,
        text: dailyPicksText,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({
        message: "Cron publish failed",
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Daily VIP reset ran ✅",
      details: data,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Cron server error",
      error: String(err),
    });
  }
}
