document.addEventListener("DOMContentLoaded", () => {
  const d = document.getElementById("debugText");
  const b = document.getElementById("swampBal");
  if (d) d.textContent = "PICKS-V1 LOADED ✅";
  if (b) b.textContent = "PICKS CHECKING...";
});
window.addEventListener("error", (e) => {
  const d = document.getElementById("debugText");
  if (d) d.textContent = "JS ERROR: " + e.message;
});
document.addEventListener("DOMContentLoaded", async () => {
//document.addEventListener("DOMContentLoaded", () => { picks.js
const swampBalEl = document.getElementById("swampBal");
function setSwampBal(x) {
  if (swampBalEl) swampBalEl.textContent = String(x ?? 0);
}
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
const RPC = "https://api.mainnet-beta.solana.com";

const TOKEN_PROGRAM =
"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const TOKEN_2022_PROGRAM =
"TokenzQdYkK9N5nY6p6YXZ2zYxYvBy06SnVAkVnnBY";

const debugEl = document.getElementById("debugText");

function setDebug(msg){
  if(debugEl) debugEl.textContent = msg;
}

async function fetchAccounts(walletAddress, programId){

  const body = {
    jsonrpc:"2.0",
    id:1,
    method:"getTokenAccountsByOwner",
    params:[
      walletAddress,
      { programId },
      { encoding:"jsonParsed" }
    ]
  };

  const res = await fetch(RPC,{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body:JSON.stringify(body)
  });

  const json = await res.json();
  return json?.result?.value || [];
}

async function getTokenBalance(walletAddress, mintAddress){

  const [spl,t22] = await Promise.all([
    fetchAccounts(walletAddress,TOKEN_PROGRAM),
    fetchAccounts(walletAddress,TOKEN_2022_PROGRAM)
  ]);

  setDebug(`SPL:${spl.length} T22:${t22.length}`);

  let total = 0;

  for(const acc of [...spl,...t22]){
    const info = acc?.account?.data?.parsed?.info;

    if(info?.mint === mintAddress){
      total += info.tokenAmount.uiAmount || 0;
    }
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
    
setSwampBal(bal);
    
    const unlocked = bal >= MIN_SWAMP;
    showVip(unlocked);

    // Optional: show balance somewhere if you want later
    console.log("SWAMP balance:", bal, "unlocked:", unlocked);
  } catch (e) {
    console.log(e);
    showVip(false);
  }
}
function setSwampBal(x) {
  const el = document.getElementById("swampBal");
  if (el) el.textContent = String(x);
}

function setDebug(msg) {
  const el = document.getElementById("debugText");
  if (el) el.textContent = msg;
}

async function refreshVipForWallet(addr) {
  try {
    if (!addr) {
      setSwampBal("0");
      setDebug("No wallet");
      return;
    }

    setDebug("Checking SWAMP…");

    // wallet-v1.js provides getTokenBalance()
    const bal = await getTokenBalance(addr);

    setSwampBal(bal);

    const unlocked = bal >= MIN_SWAMP;
    showVip(unlocked);

    setDebug(unlocked ? "VIP UNLOCKED ✅" : "VIP LOCKED 🔒");
  } catch (e) {
    console.log(e);
    setDebug("Balance check error ❌");
  }
}

// When wallet connects/disconnects
window.addEventListener("swampdoge:wallet", (e) => {
  const addr = e?.detail?.addr || null;
  refreshVipForWallet(addr);
});

// Also run once if wallet already set
if (window.__SWAMPDOGE_WALLET__) {
  refreshVipForWallet(window.__SWAMPDOGE_WALLET__);
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
});
