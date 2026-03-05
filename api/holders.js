export default async function handler(req, res) {
  const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";
  const key = process.env.HELIUS_API_KEY;

  if (!key) return res.status(200).json({ holders: 0, error: "Missing HELIUS_API_KEY" });

  try {
    const url = `https://mainnet.helius-rpc.com/?api-key=${key}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "supply",
        method: "getTokenSupply",
        params: [SWAMP_MINT],
      }),
    });

    const j = await r.json();

    const supply = Number(j?.result?.value?.uiAmount || 0);

    // If supply exists, there is at least 1 holder (you or someone).
    const holders = supply > 0 ? 1 : 0;

    return res.status(200).json({ holders, supply, mint: SWAMP_MINT });
  } catch (e) {
    return res.status(200).json({ holders: 0, error: String(e?.message || e) });
  }
}
