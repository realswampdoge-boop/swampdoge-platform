import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ ok: false, error: "Missing API key" });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
Return EXACTLY 3 sports picks.
Output MUST be exactly 3 lines.
NO intro text. NO numbering. NO bullets.
Each line format: "League - Pick"
Example:
NBA - Warriors ML
NHL - Over 5.5 Goals
Soccer - Over 2.5 Goals
`,
    });

   const text = response.output[0].content[0].text || "";

const picks = text
  .split("\n")
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => s.replace(/^[-*•\d.]+\s*/, ""))      // remove bullets/1./2.
  .filter(s => !/^sure|^here are/i.test(s))      // remove intro lines
  .slice(0, 3);

    

    const data = {
      generatedAt: new Date().toISOString(),
      picks,
    };

    return res.status(200).json({ ok: true, ...data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      error: "AI picks generation failed",
      details: err.message,
    });
  }
}
