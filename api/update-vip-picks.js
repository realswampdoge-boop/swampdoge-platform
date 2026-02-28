export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const { password, picks } = body || {};

    if (password !== "swampadmin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("VIP PICKS:", picks);

    return res.status(200).json({
      success: true,
      message: "VIP Picks Published 🐊🔥",
      picks
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
      error: String(err)
    });
  }
}
