// api/vip-picks.js
export default async function handler(req, res) {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path =
      process.env.GITHUB_FILE_PATH || "public/vip-picks.json";

    if (!token || !owner || !repo) {
      return res.status(500).json({
        message: "Missing GitHub environment variables",
      });
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const gh = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const data = await gh.json();

    if (!gh.ok) {
      return res.status(500).json({
        message: "GitHub read failed",
        error: data,
      });
    }

    // Decode GitHub base64 file
    const jsonText = Buffer.from(data.content, "base64").toString(
      "utf8"
    );

    // Prevent Vercel caching
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(jsonText);
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: String(err),
    });
  }
}
