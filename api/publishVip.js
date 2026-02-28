// api/publishVip.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    // Accept either "password" or "pin"
    const provided = String(body.password ?? body.pin ?? "").trim();

    // Use Vercel env var if set; fallback to "swampadmin" to match your current file
    const ADMIN_PIN = String(process.env.ADMIN_PIN || "swampadmin").trim();

    if (!provided || provided !== ADMIN_PIN) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Accept textarea as a string in body.picks (or body.text)
    const rawText = String(body.picks ?? body.text ?? "");

    // Turn multiline text into an array of picks
    const picksArray = rawText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // GitHub config from Vercel env
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    // Always write here
    const path = "public/vip-picks.json";

    if (!token || !owner || !repo) {
      return res.status(500).json({ message: "Missing GitHub env vars" });
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Get current SHA
    const getResp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const current = await getResp.json();
    const sha = current?.sha;

    const payload = {
      updated: new Date().toISOString().slice(0, 10),
      picks: picksArray,
    };

    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString("base64");

    // Write updated file
    const putResp = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update VIP picks",
        content,
        sha,
      }),
    });

    const result = await putResp.json();

    if (!putResp.ok) {
      return res.status(500).json({ message: "GitHub write failed", error: result });
    }

    // Stop caching
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      message: "VIP Picks Published 🐊🔥",
      picks: picksArray,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
}
