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

// Program IDs
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

// Helper: safe number
function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

async function getTokenBalance(ownerAddress) {
  // Returns total SWAMP across BOTH token programs (Token + Token-2022)
  // Works even if the mint is Token-2022.

  // 1) Try Token Program using mint filter (fast path)
  let total = 0;

  try {
    const r1 = await rpc("getTokenAccountsByOwner", [
      ownerAddress,
      { mint: SWAMP_MINT },
      { encoding: "jsonParsed" }
    ]);

    const accs1 = r1?.value || [];
    for (const a of accs1) {
      const ui = a?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      total += toNum(ui);
    }
  } catch (e) {
    // ignore; we'll still try Token-2022
  }

  // 2) Token-2022 program: must query by programId, then filter by mint ourselves
  try {
    const r2 = await rpc("getTokenAccountsByOwner", [
      ownerAddress,
      { programId: TOKEN_2022_PROGRAM },
      { encoding: "jsonParsed" }
    ]);

    const accs2 = r2?.value || [];
    for (const a of accs2) {
      const info = a?.account?.data?.parsed?.info;
      const mint = info?.mint;
      if (mint === SWAMP_MINT) {
        const ui = info?.tokenAmount?.uiAmount;
        total += toNum(ui);
      }
    }
  } catch (e) {
    // if this fails, show debug
    throw e;
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
