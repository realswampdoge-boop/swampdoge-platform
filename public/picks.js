// picks.js

const vipLocked = document.getElementById("vipLocked");
const vipContent = document.getElementById("vipContent");

function showVip(isUnlocked) {
  if (!vipLocked || !vipContent) return;
  vipLocked.style.display = isUnlocked ? "none" : "block";
  vipContent.style.display = isUnlocked ? "block" : "none";
}

// --- CONFIG ---
const MIN_SWAMP = 1_000_000;

// Your SWAMP token mint (you told me earlier)
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

// A public Solana RPC endpoint (works for basic reads)
const RPC = "https://api.mainnet-beta.solana.com";

// --- Helpers ---
async function getTokenBalance(walletAddress, mintAddress) {
  // Find token accounts owned by wallet for this mint
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenAccountsByOwner",
    params: [
      walletAddress,
      { mint: mintAddress },
      { encoding: "jsonParsed" }
    ]
  };

  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  const accounts = json?.result?.value || [];

  let total = 0;

  for (const acc of accounts) {
    const amountUi =
      acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
    total += amountUi;
  }

  return total;
}

async function refreshVipForWallet(walletAddress) {
  try {
    if (!walletAddress) {
      showVip(false);
      return;
    }

    // Default locked while checking
    showVip(false);

    const bal = await getTokenBalance(walletAddress, SWAMP_MINT);

    const unlocked = bal >= MIN_SWAMP;
    showVip(unlocked);

    // Optional: show balance somewhere if you want later
    console.log("SWAMP balance:", bal, "unlocked:", unlocked);
  } catch (e) {
    console.log(e);
    showVip(false);
  }
}

// Listen for wallet events from wallet.js
window.addEventListener("swampdoge:wallet", (e) => {
  const addr = e?.detail?.addr || null;
  refreshVipForWallet(addr);
});

// Also run on load if wallet.js stored it
setTimeout(() => {
  const addr = window.__SWAMPDOGE_WALLET__ || null;
  refreshVipForWallet(addr);
}, 250);
