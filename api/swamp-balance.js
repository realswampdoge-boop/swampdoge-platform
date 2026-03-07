export default async function handler(req, res) {
  try {
    const wallet = (req.query.wallet || "").toString().trim();
    if (!wallet) {
      return res.status(400).json({ ok: false, error: "Missing wallet" });
    }

    const mint = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

    const body = {
      jsonrpc: "2.0",
      id: "1",
      method: "getTokenAccountsByOwner",
      params: [
        wallet,
        { mint },
        { encoding: "jsonParsed" }
      ]
    };

    const r = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const j = await r.json();

    if (j?.error) {
      return res.status(500).json({
        ok: false,
        error: j.error.message || "RPC error"
      });
    }

    const accounts = j?.result?.value || [];
    let total = 0;

    for (const acc of accounts) {
      const amt = acc?.account?.data?.parsed?.info?.tokenAmount;
      total += Number(amt?.uiAmountString || amt?.uiAmount || 0);
    }

    return res.status(200).json({
      ok: true,
      balance: total,
      uiAmount: total
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message || "Unknown error"
    });
  }
}
