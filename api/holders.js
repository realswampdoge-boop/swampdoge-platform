export default async function handler(req, res) {
  const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

  try {
    const r = await fetch(
      `https://public-api.solscan.io/token/holders?tokenAddress=${SWAMP_MINT}&limit=1`,
      { headers: { accept: "application/json" } }
    );

    const data = await r.json();

    // Solscan returns total holders in `total`
    const holders = Number(data?.total || 0);

    return res.status(200).json({ holders });
  } catch (e) {
    return res.status(200).json({ holders: 0, error: String(e?.message || e) });
  }
}
