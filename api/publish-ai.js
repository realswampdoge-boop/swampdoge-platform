export default async function handler(req, res) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL;

    const ai = await fetch(`${base}/api/ai-picks`);
    const data = await ai.json();

    if (!data.ok) {
      return res.status(500).json({ ok:false });
    }

    const body = JSON.stringify({
      generatedAt: data.generatedAt,
      picks: data.picks
    });

    const contentB64 = Buffer.from(body).toString("base64");

    const repo = process.env.GITHUB_REPO;
    const owner = process.env.GITHUB_OWNER;
    const token = process.env.GITHUB_TOKEN;

    const path = "public/ai-picks.json";

    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "AI picks update",
          content: contentB64
        })
      }
    );

    res.json({ ok:true });

  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
}
