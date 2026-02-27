// picks-v1.js
const swampBalEl = document.getElementById("swampBal");
const debugEl = document.getElementById("debugText");

const vipLocked = document.getElementById("vipLocked");
const vipContent = document.getElementById("vipContent");

// ----- CONFIG -----
const MIN_SWAMP = 1_000_000;
// Your token mint (the pump address you shared)
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

// Public RPC (works without keys, can be rate-limited)
const RPC = "https://api.mainnet-beta.solana.com";

function setSwampBal(x) {
  if (swampBalEl) swampBalEl.textContent = String(x);
}
function setDebug(msg) {
  if (debugEl) debugEl.textContent = String(msg);
}

function showVip(isUnlocked) {
  if (!vipLocked || !vipContent) return;
  vipLocked.style.display = isUnlocked ? "none" : "block";
  vipContent.style.display = isUnlocked ? "block" : "none";
}

// RPC helper
async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json?.error) throw new Error(json.error?.message || "RPC error");
  return json.result;
}

// ✅ No solanaWeb3 needed
// ⭐ FINAL SWAMP BALANCE CHECK (Pump.fun compatible)

// --- SWAMP BALANCE (supports SPL Token + Token-2022) ---

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

async function getTokenBalance(walletAddress) {
  try {
    setDebug("Checking SWAMP...");

    const connection = new solanaWeb3.Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    const owner = new solanaWeb3.PublicKey(walletAddress);
    const mintStr = String(SWAMP_MINT);

    // Helper: fetch all token accounts for a given token program, then filter by mint
    async function fetchFromProgram(programId) {
      const resp = await connection.getParsedTokenAccountsByOwner(owner, {
        programId: new solanaWeb3.PublicKey(programId),
      });

      let total = 0;

      for (const item of resp.value || []) {
        const info = item?.account?.data?.parsed?.info;
        const thisMint = info?.mint;
        if (thisMint !== mintStr) continue;

        const uiAmt = info?.tokenAmount?.uiAmount;
        total += Number(uiAmt || 0);
      }

      return total;
    }

    // Check both programs and add them up
    const bal1 = await fetchFromProgram(TOKEN_PROGRAM_ID);
    const bal2 = await fetchFromProgram(TOKEN_2022_PROGRAM_ID);
    const total = bal1 + bal2;

    setDebug(`SWAMP found: ${total}`);
    return total;
  } catch (e) {
    console.log(e);
    setDebug("Balance check error ❌");
    return 0;
  }
}
async function refreshVipForWallet(addr) {
  try {
    if (!addr) {
      setSwampBal("0");
      setDebug("No wallet");
      showVip(false);
      return;
    }

    setDebug("Checking SWAMP...");
    const bal = await getTokenBalance(addr);

    setSwampBal(bal);

    const unlocked = bal >= MIN_SWAMP;
    showVip(unlocked);

    setDebug(unlocked ? "VIP UNLOCKED ✅" : "VIP LOCKED 🔒");
  } catch (e) {
    console.log(e);
    setDebug("Balance check error ❌");
    showVip(false);
  }
}

// Run whenever wallet changes
window.addEventListener("swampdoge:wallet", (e) => {
  const addr = e?.detail?.addr || null;
  refreshVipForWallet(addr);
});

// Initial state
setSwampBal("0");
setDebug("picks-v1.js running ✅");
showVip(false);

// If wallet already set by wallet-v1.js
setTimeout(() => {
  refreshVipForWallet(window.__SWAMPDOGE_WALLET__ || null);
}, 300);
