// api/holders.js
export default async function handler(req, res) {
  const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";
  const key = process.env.HELIUS_API_KEY;

  if (!key) {
    return res.status(200).json({ holders: 0, error: "Missing HELIUS_API_KEY" });
  }

  try {
    const url = `https://mainnet.helius-rpc.com/?api-key=${key}`;

    // Helius supports getTokenAccounts with pagination via cursor.
    // We count unique owners with non-zero balance.
    let owners = new Set();
    let cursor = null;

    for (let i = 0; i < 30; i++) { // safety cap
      const body = {
        jsonrpc: "2.0",
        id: "holders",
        method: "getTokenAccounts",
        params: {
          mint: SWAMP_MINT,
          limit: 1000,
          ...(cursor ? { cursor } : {})
        }
      };

      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const j = await r.json();
      const result = j?.result;

      const accts = result?.token_accounts || [];
      for (const a of accts) {
        const amount = Number(a?.amount || 0);
        if (amount > 0 && a?.owner) owners.add(a.owner);
      }

      cursor = result?.cursor;
      if (!cursor) break;
    }

    return res.status(200).json({ holders: owners.size });
  } catch (e) {
    return res.status(200).json({ holders: 0, error: String(e?.message || e) });
  }
}
