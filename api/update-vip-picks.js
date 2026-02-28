export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    // Accept pin OR password from the app
    const pin = body.pin ?? body.password ?? "";
    const text = body.text ?? body.picks ?? "";

    // Use Vercel env pin (fallback 1234)
    const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
    if (String(pin).trim() !== String(ADMIN_PIN).trim()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Each line becomes a pick
    const picks = String(text)
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    // GitHub env vars (you already set most of these)
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = process.env.GITHUB_FILE_PATH || "public/vip-picks.json";

    if (!token || !owner || !repo || !path) {
      return res.status(500).json({ message: "Missing GitHub env vars" });
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Get current SHA (needed to update a file)
    const getResp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const current = await getResp.json();
    const sha = current?.sha; // if file exists

    const newJson = {
      updated: new Date().toISOString().slice(0, 10),
      picks,
    };

    const content = Buffer.from(JSON.stringify(newJson, null, 2)).toString("base64");

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

    const putJson = await putResp.json();
    if (!putResp.ok) {
      return res.status(500).json({ message: "GitHub write failed", error: putJson });
    }

    return res.status(200).json({ success: true, message: "Published ✅", picks });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
}
