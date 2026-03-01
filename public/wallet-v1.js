/************************************************************
 * 🐊 SWAMPDOGE - WALLET + BALANCE + VIP (SINGLE CLEAN FILE)
 * - One (1) getSwampBalance() only
 * - Mainnet connection
 * - Balance updates UI
 * - VIP lock/unlock updates
 * - Admin wallet check
 ************************************************************/

/* ✅ CONFIG */
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";
const VIP_MIN_BALANCE = 1000000;

// Put YOUR admin wallet here (the wallet that should see the Admin button)
const ADMIN_WALLET = "PASTE_ADMIN_WALLET_HERE";

/* ✅ MAINNET CONNECTION */
const connection = new solanaWeb3.Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);

/* ✅ GLOBAL STATE */
let walletAddress = null;
let isVIP = false;

// (optional debug globals)
window.__WALLET_V1_LOADED__ = true;
window.__SWAMPDOGE_WALLET__ = null;
window.__SWAMPDOGE_BALANCE__ = 0;

/* ✅ UI HELPERS (safe) */
function $(id) {
  return document.getElementById(id);
}

function setStatus(msg) {
  const el = $("statusText");
  if (el) el.textContent = msg;
}

function setWallet(addr) {
  const el = $("walletText");
  if (el) el.textContent = addr || "Not connected";
}

function setBalanceUI(val) {
  const el = $("balanceText");
  if (el) el.textContent = Number(val || 0).toLocaleString();
}

function setDebug(msg) {
  const el = $("debugText");
  if (el) el.textContent = msg || "";
}

/* ✅ VIP UI */
function unlockVIP() {
  const locked = $("vipLocked");
  const content = $("vipContent");
  if (locked) locked.style.display = "none";
  if (content) content.style.display = "block";

  const vip = $("vipStatus");
  if (vip) vip.textContent = "VIP UNLOCKED 🐊🔥";

  // 🔒 ADMIN WALLET CHECK (show/hide admin button)
  const adminBtn = $("adminBtn");
  if (adminBtn) {
    adminBtn.style.display = (walletAddress === ADMIN_WALLET) ? "block" : "none";
  }

  // Load VIP picks if your page defines window.loadVipPicks()
  setTimeout(() => {
    if (typeof window.loadVipPicks === "function") {
      window.loadVipPicks();
    }
  }, 200);
}

function lockVIP() {
  const locked = $("vipLocked");
  const content = $("vipContent");
  if (locked) locked.style.display = "block";
  if (content) content.style.display = "none";

  const vip = $("vipStatus");
  if (vip) vip.textContent = "Standard User";

  const adminBtn = $("adminBtn");
  if (adminBtn) adminBtn.style.display = "none";
}

/* ✅ ONE SINGLE BALANCE FUNCTION (NO DUPLICATES) */
async function getSwampBalance(addr) {
  try {
    const owner = new solanaWeb3.PublicKey(addr);
    const mint = new solanaWeb3.PublicKey(SWAMP_MINT);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      owner,
      { mint }
    );

    let total = 0;

    for (const item of tokenAccounts.value) {
      const ta = item.account.data.parsed.info.tokenAmount;
      // uiAmount is already decimals-adjusted
      const ui = Number(ta.uiAmount ?? ta.uiAmountString ?? 0);
      total += (Number.isFinite(ui) ? ui : 0);
    }

    return total;

  } catch (e) {
    console.log("TOKEN ERROR", e);
    setDebug("TOKEN ERROR ❌");
    return 0;
  }
}

/* ✅ VIP CHECK */
async function checkVIPStatus(addr) {
  try {
    const swampBalance = await getSwampBalance(addr);

    // store + show
    window.__SWAMPDOGE_BALANCE__ = swampBalance;
    setBalanceUI(swampBalance);

    if (swampBalance >= VIP_MIN_BALANCE) {
      isVIP = true;
      unlockVIP();
    } else {
      isVIP = false;
      lockVIP();
    }

    return swampBalance;

  } catch (e) {
    console.log("VIP check failed", e);
    lockVIP();
    return 0;
  }
}

/* ✅ CONNECT / DISCONNECT */
async function connectWallet() {
  try {
    setDebug("");
    setStatus("Connecting...");

    if (!window.solana || !window.solana.isPhantom) {
      setStatus("Phantom not found");
      setDebug("Install Phantom ❌");
      return;
    }

    const resp = await window.solana.connect();
    const addr = resp.publicKey.toString();

    walletAddress = addr;
    window.__SWAMPDOGE_WALLET__ = addr;

    setWallet(addr);
    setStatus("Connected ✅");

    // 🔥 Force balance + VIP refresh every connect
    await checkVIPStatus(addr);

  } catch (e) {
    console.log(e);
    setStatus("Connect failed ❌");
  }
}

async function disconnectWallet() {
  try {
    if (window.solana && window.solana.isPhantom) {
      await window.solana.disconnect();
    }
  } catch (e) {
    console.log(e);
  }

  walletAddress = null;
  window.__SWAMPDOGE_WALLET__ = null;
  window.__SWAMPDOGE_BALANCE__ = 0;
  isVIP = false;

  setWallet("Not connected");
  setBalanceUI(0);
  lockVIP();
  setStatus("Ready");
}

/* ✅ BUTTON HOOKUP */
function hookButtons() {
  const btnConnect = $("btnConnect");
  const btnDisconnect = $("btnDisconnect");

  if (btnConnect) btnConnect.addEventListener("click", connectWallet);
  if (btnDisconnect) btnDisconnect.addEventListener("click", disconnectWallet);

  // default UI state
  setStatus("Ready");
  setWallet("Not connected");
  setBalanceUI(0);
  lockVIP();
}

document.addEventListener("DOMContentLoaded", hookButtons);
