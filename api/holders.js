// api/holders.js
import { Connection, PublicKey } from "@solana/web3.js";

const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// Use Helius RPC if you have it, otherwise fallback to a public RPC.
// BEST: set HELIUS_RPC_URL in Vercel env, like:
// https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
const RPC_URL =
  process.env.HELIUS_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

let cache = { ts: 0, holders: 0 };
const CACHE_MS = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  try {
    // cache
    if (Date.now() - cache.ts < CACHE_MS && cache.holders > 0) {
      return res.status(200).json({ holders: cache.holders, cached: true });
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const mint = new PublicKey(SWAMP_MINT);

    // WARNING: this can be heavy if there are tons of holders.
    // Helius RPC recommended.
    const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      filters: [
        { dataSize: 165 }, // token account size
        { memcmp: { offset: 0, bytes: mint.toBase58() } }, // mint at offset 0
      ],
      encoding: "jsonParsed",
    });

    const owners = new Set();

    for (const a of accounts) {
      const info = a.account?.data?.parsed?.info;
      if (!info) continue;

      const amt = info.tokenAmount?.uiAmount || 0;
      if (amt > 0) owners.add(info.owner);
    }

    const holders = owners.size;

    cache = { ts: Date.now(), holders };

    return res.status(200).json({ holders, cached: false });
  } catch (e) {
    return res.status(200).json({
      holders: null,
      error: String(e?.message || e),
    });
  }
}
