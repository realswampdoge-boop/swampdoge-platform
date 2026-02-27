window.__PICKS_V1_LOADED__ = true;
console.log("✅ picks-v1.js LOADED");
window.addEventListener("DOMContentLoaded", () => {
  const debugEl = document.getElementById("debug");
  if (debugEl) debugEl.textContent = "picks-v1.js LOADED ✅";
});/*************************************************
 *  SWAMPDOGE FINAL BALANCE SYSTEM
 *************************************************/

// ================= CONFIG =================

// VIP requirement

// ================= FINAL SWAMPDOGE BALANCE (browser-safe) =================

// VIP requirement (set back to 1000000 when ready)
const MIN_SWAMPDOGE = 0;

// SwampDoge mint (DO NOT CHANGE)
const SWAMPDOGE_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

// CORS-friendly endpoints (tries each until one works)
const RPC_ENDPOINTS = [
  "https://rpc.ankr.com/solana",
  "https://solana-api.projectserum.com",
  // Only use Helius AFTER you add Allowed Domains in Helius dashboard
  // "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY",
];

function withTimeout(ms, promise) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return Promise.race([
    promise(ctrl.signal).finally(() => clearTimeout(t)),
  ]);
}

async function rpcCall(method, params) {
  let lastErr = null;

  for (const url of RPC_ENDPOINTS) {
    try {
      const result = await withTimeout(8000, (signal) =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params,
          }),
        })
      ).then(async (res) => {
        const json = await res.json();
        if (json?.error) throw new Error(json.error?.message || "RPC error");
        return json.result;
      });

      return result;
    } catch (e) {
      lastErr = e;
      // try next endpoint
    }
  }

  throw lastErr || new Error("All RPC endpoints failed");
}

// Returns UI amount (already adjusted for decimals)
async function getSwampdogeBalance(wallet) {
  const result = await rpcCall("getTokenAccountsByOwner", [
    wallet,
    { mint: SWAMPDOGE_MINT },
    { encoding: "jsonParsed" },
  ]);

  const accounts = result?.value || [];
  let total = 0;

  for (const acc of accounts) {
    const uiAmt =
      acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ??
      0;
    total += Number(uiAmt || 0);
  }

  return total;
}

// ================= VIP CHECK =================
async function refreshVipForWallet(wallet) {
  try {
    if (!wallet) {
      setSwampBal("0");
      setDebug("No wallet");
      showVip(false);
      return;
    }

    setSwampBal("...");
    setDebug("Checking SwampDoge...");

    const balance = await getSwampdogeBalance(wallet);

    setSwampBal(String(balance));

    const unlocked = balance >= MIN_SWAMPDOGE;
    showVip(unlocked);

    setDebug(unlocked ? "VIP UNLOCKED ✅" : "VIP LOCKED 🔒");
  } catch (e) {
    console.log("Balance check error:", e);
    setSwampBal("0");
    showVip(false);
    setDebug("Balance check error ❌");
  }
}

// Wallet event from wallet-v1.js
window.addEventListener("swampdoge:wallet", (e) => {
  const addr = e?.detail?.addr || null;
  refreshVipForWallet(addr);
});

// Run once after load (in case already connected)
setTimeout(() => {
  const addr = window.__SWAMPDOGE_WALLET__ || null;
  refreshVipForWallet(addr);
}, 800);



// ================= UI =================

const swampBalEl = document.getElementById("swampBalance");
const debugEl = document.getElementById("debug");
const vipLocked = document.getElementById("vipLocked");
const vipContent = document.getElementById("vipContent");

function setSwampBal(v) {
  if (swampBalEl) swampBalEl.textContent = v;
}

function setDebug(msg) {
  if (debugEl) debugEl.textContent = msg;
}

function showVip(unlocked) {
  if (!vipLocked || !vipContent) return;

  vipLocked.style.display = unlocked ? "none" : "block";
  vipContent.style.display = unlocked ? "block" : "none";
}


// ================= RPC HELPER =================

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  const json = await res.json();

  if (json.error) throw new Error(json.error.message);

  return json.result;
}


// ================= BALANCE FETCH =================

// ================= FINAL SWAMPDOGE BALANCE =================

// ================= FINAL SWAMPDOGE BALANCE =================
async function getSwampdogeBalance(wallet) {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          wallet,
          { mint: SWAMPDOGE_MINT },
          { encoding: "jsonParsed" }
        ]
      })
    });

    const json = await res.json();
    const accounts = json?.result?.value || [];

    let total = 0;
    for (const acc of accounts) {
      const amt = acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      total += Number(amt || 0);
    }

    return total;
  } catch (e) {
    console.log("Balance error:", e);
    return 0;
  }
}

// ================= MAIN VIP CHECK =================

async function refreshVipForWallet(wallet) {

  try {

    if (!wallet) {
      setDebug("No wallet");
      showVip(false);
      setSwampBal("0");
      return;
    }

    setDebug("Checking SwampDoge...");

    
    const balance = await getSwampdogeBalance(wallet);

    setSwampBal(balance);

    const unlocked = balance >= MIN_SWAMPDOGE;

    showVip(unlocked);

    setDebug(
      unlocked
        ? "VIP UNLOCKED ✅"
        : "VIP LOCKED 🔒"
    );

  } catch (e) {
    console.log(e);
    setDebug("Balance check error ❌");
    showVip(false);
  }
}


// ================= WALLET EVENTS =================

// wallet.js sends this event
window.addEventListener("swampdoge:wallet", (e) => {
  const addr = e?.detail?.addr || null;
  refreshVipForWallet(addr);
});

// run once if already connected
// FORCE BALANCE CHECK AFTER LOAD
setTimeout(() => {
  const addr = window.__SWAMPDOGE_WALLET__;
  if (addr) {
    refreshVipForWallet(addr);
  }
}, 1000);
