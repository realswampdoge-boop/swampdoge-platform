// api/update-vip-picks.js
// Updates vip-picks.json in GitHub using a secure admin key.
// Works on Vercel serverless functions (Node runtime).

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function safeEqual(a = "", b = "") {
  // constant-time-ish compare to avoid timing leaks
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function parsePicks(input) {
  // Accept:
  // - multi-line (one pick per line)
  // - or comma-separated
  // - or a mix of both
  const raw = String(input || "");
  const lines = raw.split(/\r?\n/);

  const picks = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // If they paste comma-separated, split it too
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) continue;

    for (const p of parts) {
      // avoid super tiny junk
      if (p.length >= 2) picks.push(p);
    }
  }

  // de-dupe while keeping order
  const seen = new Set();
  return picks.filter((p) => (seen.has(p) ? false : (seen.add(p), true)));
}

async function ghFetch(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) {}
  return { res, data, text };
}

export default async function handler(req, res) {
  // CORS/preflight (safe)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return json(res, 200, { ok: true });

  if (req.method !== "POST") {
    return json(res, 405, { ok: false, message: "Use POST" });
  }

  // ---- REQUIRED ENV VARS ----
  const ADMIN_KEY = process.env.ADMIN_KEY || "";
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
  const GITHUB_OWNER = process.env.GITHUB_OWNER || "";
  const GITHUB_REPO = process.env.GITHUB_REPO || "";
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

  // The file you want to update in the repo.
  // Change this if your vip-picks.json is in a different place.
  const VIP_PICKS_PATH = process.env.VIP_PICKS_PATH || "vip-picks.json";

  if (!ADMIN_KEY || !GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return json(res, 500, {
      ok: false,
      message:
        "Server not configured. Missing one of: ADMIN_KEY, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO"
    });
  }

  // Parse body (Vercel usually gives req.body already as object)
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { body = { raw: body }; }
  }
  body = body || {};

  // Admin key can be sent as:
  // - body.adminKey
  // - Authorization: Bearer <key>
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const providedKey = String(body.adminKey || bearer || "");

  if (!safeEqual(providedKey, ADMIN_KEY)) {
    return json(res, 401, { ok: false, message: "Unauthorized" });
  }

  // Action: "reset" or "update"
  const action = String(body.action || "update").toLowerCase();

  let picks = [];
  if (action === "reset") {
    picks = [
      "🟢 VIP Picks reset for today",
      "Add today’s picks in the Admin Panel 👇"
    ];
  } else {
    picks = parsePicks(body.picksText);
    if (picks.length === 0) {
      return json(res, 400, { ok: false, message: "No picks provided" });
    }
  }

  const payload = {
    updated: new Date().toISOString().slice(0, 10),
    picks
  };

  const apiBase = "https://api.github.com";
  const contentsUrl = `${apiBase}/repos/${encodeURIComponent(
    GITHUB_OWNER
  )}/${encodeURIComponent(GITHUB_REPO)}/contents/${VIP_PICKS_PATH}?ref=${encodeURIComponent(
    GITHUB_BRANCH
  )}`;

  // 1) Get current SHA (if file exists)
  const get = await ghFetch(contentsUrl, {
    method: "GET",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json"
    }
  });

  let sha = null;
  if (get.res.status === 200 && get.data && get.data.sha) {
    sha = get.data.sha;
  } else if (get.res.status !== 404) {
    return json(res, 500, {
      ok: false,
      message: `GitHub GET failed: ${get.res.status}`,
      details: get.data || get.text
    });
  }

  // 2) PUT new content
  const contentB64 = Buffer.from(JSON.stringify(payload, null, 2)).toString(
    "base64"
  );

  const putBody = {
    message: action === "reset" ? "Reset VIP picks" : "Update VIP picks",
    content: contentB64,
    branch: GITHUB_BRANCH
  };
  if (sha) putBody.sha = sha;

  const put = await ghFetch(`${apiBase}/repos/${encodeURIComponent(
    GITHUB_OWNER
  )}/${encodeURIComponent(GITHUB_REPO)}/contents/${VIP_PICKS_PATH}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(putBody)
  });

  if (!put.res.ok) {
    return json(res, 500, {
      ok: false,
      message: `GitHub PUT failed: ${put.res.status}`,
      details: put.data || put.text
    });
  }

  return json(res, 200, {
    ok: true,
    message: action === "reset" ? "vip-picks.json reset ✅" : "vip-picks.json updated ✅",
    updated: payload.updated,
    count: payload.picks.length
  });
}
