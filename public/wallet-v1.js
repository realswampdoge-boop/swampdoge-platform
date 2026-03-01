const SWAMP_MINT =
"GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";
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
      
checkVIPStatus(addr);
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
async function getTokenBalance(walletAddress) {
  try {
    const connection = new solanaWeb3.Connection(RPC);

    const owner = new solanaWeb3.PublicKey(walletAddress);

    const tokens =
      await connection.getParsedTokenAccountsByOwner(owner, {
        programId: new solanaWeb3.PublicKey(
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        ),
      });

    let balance = 0;

    tokens.value.forEach((t) => {
      const info = t.account.data.parsed.info;

      if (info.mint === SWAMP_MINT) {
        balance += info.tokenAmount.uiAmount || 0;
      }
    });

    document.getElementById("debugText").textContent =
      "TOKEN SCAN COMPLETE ✅";
window.__SWAMPDOGE_BALANCE__ = balance;
    checkVIPStatus(window.__SWAMPDOGE_WALLET__ || "");
return balance;
    
  } catch (e) {
    console.log(e);
    document.getElementById("debugText").textContent =
      "TOKEN ERROR ❌";
    return 0;
  }
}
// 🐊 SWAMPDOGE VIP SYSTEM
let isVIP = false;

// IMPORTANT: put your real mint here (SPL token mint address)
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump"; // <-- confirm this is the mint

async function getSwampBalance(walletAddress) {
  try {
    const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new solanaWeb3.PublicKey(walletAddress),
      { mint: new solanaWeb3.PublicKey(SWAMP_MINT) }
    );

    let balance = 0;

    tokenAccounts.value.forEach((acc) => {
      const amt = Number(acc.account.data.parsed.info.tokenAmount.uiAmount || 0);
      balance += amt;
    });

    window.__SWAMPDOGE_BALANCE__ = balance;
    return balance;
  } catch (e) {
    console.log(e);
    const el = document.getElementById("debugText");
    if (el) el.textContent = "TOKEN ERROR ❌";
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
