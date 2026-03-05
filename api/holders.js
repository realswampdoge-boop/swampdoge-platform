const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

const RPC_URL =
  process.env.HELIUS_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

export default async function handler(req, res) {
  try {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenLargestAccounts",
      params: [SWAMP_MINT],
    };

    const r = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });

    const j = await r.json();

    const arr = j?.result?.value || [];

    const nonZero = arr.filter(
      (x) => Number(x?.uiAmount || 0) > 0
    );

    const holders = nonZero.length;

    return res.status(200).json({
      holders,
      mint: SWAMP_MINT
    });

  } catch (e) {
    return res.status(200).json({
      holders: 0,
      error: String(e?.message || e)
    });
  }
}
