export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, claims: [] });
  }

  if (req.method === "POST") {
    const { wallet, amount, reason, pick } = req.body || {};

    if (!wallet || !amount || !reason) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const claim = {
      id: "claim_" + Date.now(),
      wallet,
      amount,
      reason,
      pick: pick || "SWAMP Rewards Redemption",
      status: "queued",
      tx: "",
      createdAt: new Date().toISOString()
    };

    return res.status(200).json({ ok: true, claim });
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
