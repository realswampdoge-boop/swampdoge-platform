import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const league = (req.query.league || "").toUpperCase();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
Generate 3 strong betting picks for today's ${league} games.
Return only picks like:

Team ML
Over/Under
Spread

Example:
Warriors ML
Over 231.5
Knicks +4
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const text = response.choices[0].message.content;

 const picks = text
  .split("\n")
  .map(p => p.trim())
  .filter(p =>
    p &&
    !p.toLowerCase().includes("here") &&
    !p.toLowerCase().includes("sure")
  )
  .slice(0, 3);

    res.status(200).json({
      league,
      picks
    });

  } catch (e) {
    console.log(e);

    res.status(200).json({
      league: req.query.league,
      picks: ["AI picks unavailable"]
    });
  }
}
