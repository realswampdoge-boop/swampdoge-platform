const SWAMP_MINT =
  const RPC_URL = "https://rpc.ankr.com/solana";
const connection = new solanaWeb3.Connection(RPC_URL, "confirmed");
"GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";
// ✅ GLOBAL SOLANA CONNECTION
const connection = new solanaWeb3.Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);
window.__WALLET_V1_LOADED__ = true;
// wallet.js

const statusText = document.getElementById("statusText");
const walletText = document.getElementById("walletText");
const btnConnect = document.getElementById("btnConnect");
const btnDisconnect = document.getElementById("btnDisconnect");

function setStatus(msg) {
  if (statusText) statusText.textContent = msg;
}

function setWallet(addr) {
  if (walletText) walletText.textContent = addr || "Not connected";
}

async function connectWallet() {
  try {
    // If Phantom provider exists (desktop OR Phantom in-app browser)
    if (window.solana && window.solana.isPhantom) {
      setStatus("Connecting...");
      const resp = await window.solana.connect();
      const addr = resp.publicKey.toString();

      setStatus("Connected ✅");
      setWallet(addr);
// 🔥 FORCE VIP BALANCE CHECK
window.__SWAMPDOGE_WALLET__ = addr;
      
await checkVIPStatus(addr);
window.dispatchEvent(
  new CustomEvent("swampdoge:wallet", {
    detail: { addr }
  })
);
      // Optional: tell picks.js (if it listens for this)
      window.__SWAMPDOGE_WALLET__ = addr;
    



      return;
    }

    // iPhone Safari fallback: open site inside Phantom browser
    const appUrl = window.location.href;
    const deepLink = "https://phantom.app/ul/browse/" + encodeURIComponent(appUrl);

    setStatus("Opening Phantom...");
    window.location.href = deepLink;
  } catch (e) {
    console.log(e);
    setStatus("Connect failed");
  }
}

async function disconnectWallet() {
  try {
    if (window.solana && window.solana.isPhantom) {
      await window.solana.disconnect();
    }
  } catch (e) {
    console.log(e);
  } finally {
    setStatus("Ready");
    setWallet("Not connected");

    window.__SWAMPDOGE_WALLET__ = null;
    window.dispatchEvent(new CustomEvent("swampdoge:wallet", { detail: { addr: null } }));
  }
}

// Hook up buttons
btnConnect?.addEventListener("click", connectWallet);
btnDisconnect?.addEventListener("click", disconnectWallet);

// Default UI
// Default UI
setStatus("Ready");
setWallet("Not connected");


// ===== SWAMP TOKEN BALANCE =====
async function getSwampBalance(walletAddress) {
  try {
    const owner = new solanaWeb3.PublicKey(walletAddress);
    const mint = new solanaWeb3.PublicKey(SWAMP_MINT);

    // Token Program IDs (classic + Token-2022)
    const TOKEN_PROGRAM = new solanaWeb3.PublicKey(
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    );
    const TOKEN_2022_PROGRAM = new solanaWeb3.PublicKey(
      "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
    );

    async function fetchBalanceForProgram(programId) {
      const resp = await connection.getParsedTokenAccountsByOwner(
        owner,
        { programId }
      );

      let total = 0;

      for (const item of resp.value) {
        const info = item.account.data.parsed.info;
        if (info.mint !== mint.toBase58()) continue;

        const amt = info.tokenAmount;
        const decimals = Number(amt.decimals || 0);
        const raw = Number(amt.amount || 0);
        total += raw / Math.pow(10, decimals);
      }

      return total;
    }

    const bal1 = await fetchBalanceForProgram(TOKEN_PROGRAM);
    const bal2 = await fetchBalanceForProgram(TOKEN_2022_PROGRAM);

    const total = bal1 + bal2;

    // store + return
    window.__SWAMPDOGE_BALANCE__ = total;
    return total;
  } catch (e) {
    console.log(e);
    const el = document.getElementById("debugText");
    if (el) el.textContent = "TOKEN ERROR ❌";
    return 0;
  }
}
// 🐊 SWAMPDOGE VIP SYSTEM
let isVIP = false;

// IMPORTANT: put your real mint here (SPL token mint address)
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump"; // <-- confirm this is the mint

async function getSwampBalance(walletAddress) {
  try {
    const tokenAccounts =
      await connection.getParsedTokenAccountsByOwner(
        new solanaWeb3.PublicKey(walletAddress),
        { mint: new solanaWeb3.PublicKey(SWAMP_MINT) }
      );

    let total = 0;

    for (const ta of tokenAccounts.value) {
      const amt = ta.account.data.parsed.info.tokenAmount;
      // safest: uiAmountString already includes decimals correctly
      total += Number(amt.uiAmountString || 0);
    }

    return total;
  } catch (e) {
    console.log("TOKEN ERROR", e);
    const dbg = document.getElementById("debugText");
    if (dbg) dbg.textContent = "TOKEN ERROR ❌";
    return 0;
  }
}
async function checkVIPStatus(walletAddress) {
  try {
    const swampBalance = await getSwampBalance(walletAddress);

    // 1,000,000 to unlock (change if you want)
    if (swampBalance >= 1000000) {
      isVIP = true;
      unlockVIP();
    } else {
      isVIP = false;
      lockVIP();
    }
  } catch (e) {
    console.log(e);
  }
}
    if (swampBalance >= 1000000) {
      isVIP = true;
      unlockVIP();
    } else {
      lockVIP();
    }

  } catch (error) {
    console.log("VIP check failed", error);
  }
}
function unlockVIP() {
  const locked = document.getElementById("vipLocked");
  const content = document.getElementById("vipContent");
  if (locked) locked.style.display = "none";
  if (content) content.style.display = "block";
  // 🔒 ADMIN WALLET CHECK
const adminBtn = document.getElementById("adminBtn");

if (adminBtn) {
  if (walletAddress === ADMIN_WALLET) {
    adminBtn.style.display = "block";
  } else {
    adminBtn.style.display = "none";
  }
}
  // LOAD VIP PICKS
setTimeout(() => {
  if (window.loadVipPicks) window.loadVipPicks();
}, 200);
  
}

function lockVIP() {
  const locked = document.getElementById("vipLocked");
  const content = document.getElementById("vipContent");
  if (locked) locked.style.display = "block";
  if (content) content.style.display = "none";
}
