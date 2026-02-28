// api/publishVip.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    // Accept password OR pin from the client
    const provided = String(body.password ?? body.pin ?? "").trim();

    // Your admin secret (from Vercel env). Fallback keeps it working if env missing.
    const ADMIN_PIN = String(process.env.ADMIN_PIN || "swampadmin").trim();

    if (!provided || provided !== ADMIN_PIN) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Raw textarea text can come in as body.picks (string) or body.text
    const rawText = String(body.picks ?? body.text ?? "");

    // ✅ Convert multiline textarea into an ARRAY (each line = 1 pick)
    const picksArray = rawText
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    // GitHub env vars
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    // ✅ Always write to this exact file
    const path = "public/vip-picks.json";

    if (!token || !owner || !repo) {
      return res.status(500).json({ message: "Missing GitHub env vars" });
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Get current SHA (required for updates)
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

    // Update the file
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

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      message: "Published ✅",
      picks: picksArray,
      count: picksArray.length,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
}
