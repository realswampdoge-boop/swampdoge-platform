// api/holders.js
export default async function handler(req, res) {
  const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

  try {
    // SolanaFM token info endpoint (returns JSON)
    const r = await fetch(
      `https://api.solana.fm/v0/tokens/${SWAMP_MINT}`,
      {
        headers: {
          accept: "application/json",
          "user-agent": "swampdoge-platform",
        },
        cache: "no-store",
      }
    );

    const text = await r.text();

    // ensure it's JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Non-JSON response from SolanaFM");
    }

    // SolanaFM commonly provides holders as holdersCount or holders
    const holders =
      Number(data?.holdersCount ?? data?.holders ?? data?.data?.holdersCount ?? 0);

    return res.status(200).json({ holders });
  } catch (e) {
    return res.status(200).json({
      holders: 0,
      error: String(e?.message || e),
    });
  }
}
