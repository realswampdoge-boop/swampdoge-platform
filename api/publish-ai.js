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
Give me 3 confident sports betting picks for today.
Short format.
Example:
Team A ML
Over 2.5 Goals
Lakers -4.5
      `,
    });

    const text = response.output[0].content[0].text;

    const picks = text
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
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
