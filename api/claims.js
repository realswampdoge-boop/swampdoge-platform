let claims = [];

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, claims });
  }

  if (req.method === "POST") {
    try {
      const { wallet, amount, reason, pick } = req.body || {};

      if (!wallet || !amount || !reason) {
        return res.status(400).json({
          ok: false,
          error: "Missing wallet, amount, or reason"
        });
      }

      const claim = {
        id: "claim_" + Date.now(),
        wallet,
        pick: pick || "SWAMP Rewards Redemption",
        amount: Number(amount),
        reason,
        status: "queued",
        tx: "",
        createdAt: new Date().toISOString()
      };

      claims.unshift(claim);

      return res.status(200).json({
        ok: true,
        claim
      });
    } catch (e) {
      return res.status(500).json({
        ok: false,
        error: e.message || "Server error"
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const { id, status, tx } = req.body || {};

      if (!id) {
        return res.status(400).json({ ok: false, error: "Missing claim id" });
      }

      claims = claims.map((item) =>
        item.id === id
          ? {
              ...item,
              status: status || item.status,
              tx: typeof tx === "string" ? tx : item.tx
            }
          : item
      );

      return res.status(200).json({ ok: true, claims });
    } catch (e) {
      return res.status(500).json({
        ok: false,
        error: e.message || "Server error"
      });
    }
  }

  return res.status(405).json({
    ok: false,
    error: "Method not allowed"
  });
}
