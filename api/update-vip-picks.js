export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const { pin, picksText } = req.body || {};
    const ADMIN_PIN = String(process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || "").trim();

    if (!ADMIN_PIN) return res.status(500).json({ ok: false, error: "ADMIN_PIN not set" });
    if (String(pin || "").trim() !== ADMIN_PIN) return res.status(401).json({ ok: false, error: "Bad PIN" });

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = process.env.GITHUB_FILE_PATH || "public/vip-picks.json";
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return res.status(500).json({ ok: false, error: "Missing GitHub env vars" });
    }

    const apiBase = "https://api.github.com";
    const getUrl = `${apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`;

    // 1) GET existing SHA (if exists)
    let sha = null;
    const getResp = await fetch(getUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json"
      }
    });

    if (getResp.ok) {
      const getData = await getResp.json();
      sha = getData.sha || null;
    }

    // 2) PUT new content
    const payload = {
      v: Date.now(),
      updatedAt: new Date().toISOString(),
      picksText: String(picksText || "").trim()
    };

    const contentB64 = Buffer.from(JSON.stringify(payload, null, 2), "utf8").toString("base64");

    const putBody = {
      message: "Update VIP picks",
      content: contentB64,
      branch: "main"
    };
    if (sha) putBody.sha = sha;

    const putResp = await fetch(getUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(putBody)
    });

    const putData = await putResp.json();
    if (!putResp.ok) {
      return res.status(500).json({ ok: false, error: "GitHub write failed", details: putData });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
