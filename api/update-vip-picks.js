// /api/update-vip-picks.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Use POST" });
    }

    const {
      pin,
      password,
      picks,
      picksText,
      action,
      filePath: filePathOverride,
    } = req.body || {};

    // ---- Admin auth (accepts either PIN or password) ----
    const ADMIN_PIN = process.env.ADMIN_PIN;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    const provided = String(pin ?? password ?? "");
    const pinOk = ADMIN_PIN && provided === String(ADMIN_PIN);
    const passOk = ADMIN_PASSWORD && provided === String(ADMIN_PASSWORD);

    if (!pinOk && !passOk) {
      return res.status(401).json({ ok: false, error: "Bad admin PIN/password" });
    }

    // ---- Required env ----
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    // Default branch if not set
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

    // Where VIP picks JSON is stored in your repo
    const GITHUB_FILE_PATH =
      filePathOverride ||
      process.env.GITHUB_FILE_PATH ||
      "public/vip-picks.json";

    const missing = [];
    if (!GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
    if (!GITHUB_OWNER) missing.push("GITHUB_OWNER");
    if (!GITHUB_REPO) missing.push("GITHUB_REPO");
    if (!GITHUB_FILE_PATH) missing.push("GITHUB_FILE_PATH");

    if (missing.length) {
      return res.status(500).json({
        ok: false,
        error: "Missing env vars",
        missing,
      });
    }

    const apiBase = "https://api.github.com";

    async function ghFetch(url, options = {}) {
      const r = await fetch(url, {
        ...options,
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      const text = await r.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (_) {}

      if (!r.ok) {
        // This is what will show up in Vercel logs
        console.error("GitHub API error", r.status, url, json || text);
        throw new Error(
          `GitHub API ${r.status}: ${JSON.stringify(json || text).slice(0, 400)}`
        );
      }
      return json;
    }

    // ---- Convert picks into array ----
    let picksArr = [];
    if (action === "reset") {
      picksArr = [];
    } else if (Array.isArray(picks)) {
      picksArr = picks.map(String).map((s) => s.trim()).filter(Boolean);
    } else {
      const raw = String(picksText ?? picks ?? "");
      picksArr = raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const contentObj = {
      updatedAt: new Date().toISOString(),
      picks: picksArr,
    };

    const contentString = JSON.stringify(contentObj, null, 2);
    const contentB64 = Buffer.from(contentString, "utf8").toString("base64");

    // ---- Get current SHA (if file exists) ----
    const getUrl = `${apiBase}/repos/${encodeURIComponent(
      GITHUB_OWNER
    )}/${encodeURIComponent(GITHUB_REPO)}/contents/${encodeURIComponent(
      GITHUB_FILE_PATH
    )}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

    let sha = undefined;
    try {
      const current = await ghFetch(getUrl, { method: "GET" });
      sha = current?.sha;
    } catch (e) {
      // If file doesn't exist, we'll create it (no sha)
      console.log("File not found, will create:", GITHUB_FILE_PATH);
    }

    // ---- PUT new content ----
    const putUrl = `${apiBase}/repos/${encodeURIComponent(
      GITHUB_OWNER
    )}/${encodeURIComponent(GITHUB_REPO)}/contents/${encodeURIComponent(
      GITHUB_FILE_PATH
    )}`;

    const putBody = {
      message: `Update VIP picks (${picksArr.length})`,
      content: contentB64,
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    };

    const result = await ghFetch(putUrl, {
      method: "PUT",
      body: JSON.stringify(putBody),
    });

    return res.status(200).json({
      ok: true,
      picksCount: picksArr.length,
      path: GITHUB_FILE_PATH,
      branch: GITHUB_BRANCH,
      commit: result?.commit?.sha || null,
    });
  } catch (err) {
    console.error("update-vip-picks FAILED:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || String(err),
    });
  }
}
