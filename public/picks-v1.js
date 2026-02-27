// public/picks-v1.js
// FINAL Swampdoge balance + VIP unlock (SPL Token + Token-2022)

// ---------------- CONFIG ----------------

// Set how many tokens needed to unlock VIP.
// If you want VIP always unlocked for testing, set to 0.
const MIN_SWAMPDOGE = 0;

// Your Swampdoge token mint (DO NOT CHANGE)
const SWAMPDOGE_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

// RPC endpoints (browser CORS-friendly list).
// If one fails, it tries the next.
// For best reliability, replace the first one with your own Helius/QuickNode/Alchemy URL.
const RPC_ENDPOINTS = [
  "https://rpc.ankr.com/solana",
  "https://solana-api.projectserum.com",
  "https://mainnet.helius-rpc.com/?api-key=a612e91d-167a-4900-990c-72e358b1c647",
];

// Token program IDs
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"; // SPL Token
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"; // Token-2022

// ---------------- DOM ----------------

const vipLocked = document.getElementById("vipLocked");
const vipContent = document.getElementById("vipContent");
const debugEl = document.getElementById("debugText");
const swampBalEl = document.getElementById("swampBal");

function setDebug(msg) {
  if (debugEl) debugEl.textContent = String(msg);
}

function setSwampdogeBal(x) {
  if (swampBalEl) swampBalEl.textContent = String(x);
}

function showVip(isUnlocked) {
  if (!vipLocked || !vipContent) return;
  vipLocked.style.display = isUnlocked ? "none" : "block";
  vipContent.style.display = isUnlocked ? "block" : "none";
}

// ---------------- RPC HELPERS ----------------

async function rpcCall(endpoint, method, params) {
  const res = await fetch(endpoint, {
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
  if (json?.error) throw new Error(json.error?.message || "RPC error");
  return json.result;
}

async function rpcWithFallback(method, params) {
  let lastErr = null;

  for (const endpoint of RPC_ENDPOINTS) {
    try {
      return await rpcCall(endpoint, method, params);
    } catch (e) {
      lastErr = e;
      // Try next endpoint
    }
  }

  // If all endpoints failed, throw last error
  throw lastErr || new Error("All RPC endpoints failed");
}

// ---------------- BALANCE CHECK (SPL + 2022) ----------------

function safeNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function sumFromTokenAccounts(result) {
  const accounts = result?.value || [];
  let total = 0;

  for (const acc of accounts) {
    const parsed = acc?.account?.data?.parsed;
    const info = parsed?.info;
    const tokenAmount = info?.tokenAmount;

    // uiAmount is already human-readable (accounts for decimals)
    // uiAmountString is a string version; prefer it when available.
    const ui = tokenAmount?.uiAmountString ?? tokenAmount?.uiAmount ?? 0;
    total += safeNumber(ui);
  }

  return total;
}

async function getSwampdogeBalanceForProgram(walletAddress, programId) {
  // getTokenAccountsByOwner with jsonParsed is easiest in browser
  const result = await rpcWithFallback("getTokenAccountsByOwner", [
    walletAddress,
    { mint: SWAMPDOGE_MINT },
    { encoding: "jsonParsed", commitment: "confirmed", programId },
  ]);

  return sumFromTokenAccounts(result);
}

async function getFinalSwampdogeBalance(walletAddress) {
  // Check both programs and add them
  const [bal1, bal2] = await Promise.all([
    getSwampdogeBalanceForProgram(walletAddress, TOKEN_PROGRAM),
    getSwampdogeBalanceForProgram(walletAddress, TOKEN_2022_PROGRAM),
  ]);

  return bal1 + bal2;
}

// ---------------- MAIN FLOW ----------------

async function refreshVipForWallet(addr) {
  try {
    if (!addr) {
      setSwampdogeBal("0");
      setDebug("No wallet");
      showVip(false);
      return;
    }

    setDebug("Checking Swampdoge…");

    const bal = await getFinalSwampdogeBalance(addr);

    // Keep it pretty (no long decimals)
    const pretty = bal >= 1 ? Math.round(bal).toString() : bal.toFixed(6);

    setSwampdogeBal(pretty);

    const unlocked = bal >= MIN_SWAMPDOGE;
    showVip(unlocked);

    setDebug(unlocked ? "VIP UNLOCKED ✅" : "VIP LOCKED 🔒");
  } catch (e) {
    console.log(e);

    // Most common browser issue is CORS / “Failed to fetch”
    const msg = String(e?.message || e);
    if (msg.toLowerCase().includes("failed to fetch")) {
      setDebug("RPC blocked (CORS). Use a different RPC ✅");
    } else {
      setDebug(`Balance check error ❌ (${msg})`);
    }

    setSwampdogeBal("0");
    showVip(false);
  }
}

// Listen for wallet connect/disconnect events from wallet-v1.js
window.addEventListener("swampdoge:wallet", (e) => {
  const addr = e?.detail?.addr || null;
  refreshVipForWallet(addr);
});

// Also run once shortly after page load if wallet already set
setTimeout(() => {
  const addr = window.__SWAMPDOGE_WALLET__ || null;
  refreshVipForWallet(addr);
}, 250);

// Debug marker so you can confirm this file loaded
if (!debugEl?.textContent || debugEl.textContent === "...") {
  setDebug("picks-v1.js LOADED ✅");
}
