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

      // Optional: tell picks.js (if it listens for this)
      window.__SWAMPDOGE_WALLET__ = addr;
      window.dispatchEvent(new CustomEvent("swampdoge:wallet", { detail: { addr } }));

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
setStatus("Ready");
setWallet("Not connected");
