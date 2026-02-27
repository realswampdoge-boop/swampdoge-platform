/*************************************************
 *  SWAMPDOGE FINAL BALANCE SYSTEM
 *************************************************/

// ================= CONFIG =================

// VIP requirement
const MIN_SWAMPDOGE = 1000000;

// SwampDoge token mint (DO NOT CHANGE)
const SWAMPDOGE_MINT =
  "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

// 🔥 YOUR HELIUS RPC
const RPC =
  "https://mainnet.helius-rpc.com/?api-key=a612e91d-167a-4900-990c-72e358b1c647";


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

async function getTokenBalance(wallet) {

  const result = await rpc("getTokenAccountsByOwner", [
    wallet,
    { mint: SWAMPDOGE_MINT },
    { encoding: "jsonParsed" },
  ]);

  const accounts = result?.value || [];

  let total = 0;

  for (const acc of accounts) {
    const amount =
      acc.account.data.parsed.info.tokenAmount.uiAmount;

    total += Number(amount || 0);
  }

  return total;
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

    // ⭐ NEW CODE GOES HERE ⭐
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
