export default async function handler(req, res) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = process.env.GITHUB_FILE_PATH || "public/vip-picks.json";
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return res.status(500).json({ ok: false, error: "Missing GitHub env vars" });
    }

    const apiBase = "https://api.github.com";
    const url = `${apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`;

    const gh = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json"
      }
    });

    const data = await gh.json();
    if (!gh.ok) {
      return res.status(gh.status).json({ ok: false, error: "GitHub read failed", details: data });
    }

    const content = Buffer.from(data.content || "", "base64").toString("utf8");
    const json = JSON.parse(content);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(json);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
