export default async function handler(req, res) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(500).json({ ok: false, error: "OPENAI_API_KEY missing" });

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const path = process.env.GITHUB_AI_PATH || "public/ai-picks.json";

    if (!owner || !repo || !token) {
      return res.status(500).json({ ok: false, error: "Missing GitHub env vars" });
    }

    // Get fresh AI picks from internal endpoint
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (!base) return res.status(500).json({ ok: false, error: "NEXT_PUBLIC_BASE_URL missing" });

    const aiResp = await fetch(`${base}/api/ai-picks`, { cache: "no-store" });
    const aiData = await aiResp.json();

    if (!aiResp.ok || !aiData.ok) {
      return res.status(500).json({ ok: false, error: "AI picks generation failed", details: aiData });
    }

    const apiBase = "https://api.github.com";
    const getUrl = `${apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`;

    // Read SHA if exists
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

    const contentB64 = Buffer.from(JSON.stringify(aiData, null, 2), "utf8").toString("base64");

    const putBody = {
      message: "Publish AI picks",
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
