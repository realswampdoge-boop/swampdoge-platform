import { Connection, PublicKey } from "@solana/web3.js";

const SWAMP_MINT = new PublicKey("GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump");

const RPC_URL =
  process.env.HELIUS_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

// simple 5-min cache so you don’t spam RPC
let cache = { ts: 0, holders: 0 };
const CACHE_MS = 5 * 60 * 1000;

export default async function handler(req, res) {
  try {
    if (Date.now() - cache.ts < CACHE_MS) {
      return res.status(200).json({ holders: cache.holders, cached: true });
    }

    const connection = new Connection(RPC_URL, "confirmed");

    // NOTE: Solana RPC does NOT give perfect "holder count" directly.
    // This counts token accounts with a non-zero balance (best approximation).
    const largest = await connection.getTokenLargestAccounts(SWAMP_MINT);
    const nonZero = (largest?.value || []).filter(
      (x) => Number(x.uiAmount || 0) > 0
    );

    const holders = nonZero.length;

    cache = { ts: Date.now(), holders };
    return res.status(200).json({ holders, cached: false });
  } catch (e) {
    return res.status(200).json({ holders: 0, error: String(e?.message || e) });
  }
}
