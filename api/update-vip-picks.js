export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { pin, picks } = req.body || {};

  // ===============================
// ✅ SWAMPDOGE ADMIN SECURITY
// ===============================

// Read values from request
const { pin, picks } = req.body || {};

// Validate request
if (!pin || !Array.isArray(picks)) {
  return res.status(400).json({
    error: "Missing pin or picks"
  });
}

// Admin PIN (from Vercel env or fallback)
const ADMIN_PIN = (process.env.ADMIN_PIN || "7777").trim();

// Compare PIN
if (String(pin).trim() !== ADMIN_PIN) {
  return res.status(401).json({
    error: "Wrong PIN"
  });
}
    // GitHub settings from env
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = process.env.GITHUB_FILE_PATH || "public/vip-picks.json";

    if (!token || !owner || !repo) {
      return res.status(500).json({ error: "Server missing GitHub env vars" });
    }

    // 1) Read current file to get sha
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    const getResp = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    });

    const current = await getResp.json();
    if (!getResp.ok) {
      return res.status(getResp.status).json({ error: current?.message || "GitHub read failed" });
    }

    const sha = current.sha;

    // 2) Write updated content
    const payload = {
      updated: new Date().toISOString().slice(0, 10),
      picks: picks.slice(0, 50) // safety cap
    };

    const contentBase64 = Buffer.from(JSON.stringify(payload, null, 2)).toString("base64");

    const putResp = await fetch(getUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update VIP picks (admin panel)",
        content: contentBase64,
        sha
      })
    });

    const out = await putResp.json();
    if (!putResp.ok) {
      return res.status(putResp.status).json({ error: out?.message || "GitHub write failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
