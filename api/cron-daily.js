export default async function handler(req, res) {
  // Allow GET so you can test in browser, but require a secret to actually run.
  const provided =
    String(req.headers["x-cron-secret"] || req.query.secret || "").trim();

  const CRON_SECRET = String(process.env.CRON_SECRET || "").trim();

  // If you haven't set CRON_SECRET yet, we won't block (for setup/testing),
  // but once you set it, the secret becomes required.
  const secretEnabled = !!CRON_SECRET;

  if (secretEnabled && provided !== CRON_SECRET) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  // ---- GitHub env vars (you already use these in publishVip.js) ----
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  // file to write
  const path = "public/vip-picks.json";

  if (!token || !owner || !repo) {
    return res.status(500).json({
      ok: false,
      message: "Missing GitHub env vars (GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO)",
    });
  }

  try {
    // 1) Get current file SHA
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const getResp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const current = await getResp.json();
    const sha = current?.sha;

    // 2) Build the NEW daily payload (you can change the default text)
    const payload = {
      updated: new Date().toISOString().slice(0, 10),
      picks: [
        "🟢 VIP Picks reset for today",
        "Add today’s picks in the Admin Panel 👇",
      ],
    };

    const content = Buffer.from(JSON.stringify(payload, null, 2)).toString(
      "base64"
    );

    // 3) Write the file back to GitHub
    const putResp = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Daily reset vip-picks.json (${payload.updated})`,
        content,
        sha, // required for updates
      }),
    });

    const putJson = await putResp.json();

    if (!putResp.ok) {
      return res.status(500).json({
        ok: false,
        message: "GitHub update failed",
        status: putResp.status,
        details: putJson,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "vip-picks.json reset ✅",
      updated: payload.updated,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Cron error",
      error: String(err),
    });
  }
}
