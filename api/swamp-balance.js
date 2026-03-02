export default async function handler(req, res) {
  try {
    const wallet = (req.query.wallet || "").toString().trim();
    if (!wallet) return res.status(400).json({ ok: false, error: "Missing wallet" });

    const mint = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

    // Solscan public endpoint (no auth)
    const url = `https://public-api.solscan.io/account/tokens?account=${encodeURIComponent(wallet)}`;

    const r = await fetch(url, {
      headers: { accept: "application/json" },
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({ ok: false, error: "Solscan fetch failed", status: r.status, body: txt });
    }

    const list = await r.json();

    // Find our mint
    const item = Array.isArray(list)
      ? list.find((t) => (t?.tokenAddress || t?.mintAddress || "") === mint)
      : null;

    // Solscan responses vary; handle common shapes
    let uiAmount = 0;

    if (item?.tokenAmount?.uiAmount != null) uiAmount = Number(item.tokenAmount.uiAmount);
    else if (item?.tokenAmount?.uiAmountString != null) uiAmount = Number(item.tokenAmount.uiAmountString);
    else if (item?.tokenAmount?.amount != null && item?.tokenAmount?.decimals != null) {
      uiAmount = Number(item.tokenAmount.amount) / Math.pow(10, Number(item.tokenAmount.decimals));
    }

    return res.status(200).json({ ok: true, wallet, mint, uiAmount });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
