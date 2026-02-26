// public/wallet.js

function setStatus(msg) {
  const el = document.getElementById("statusText");
  if (el) el.textContent = msg;
}

function setWallet(addr) {
  const el = document.getElementById("walletText");
  if (el) el.textContent = addr || "Not connected";
}

function openInPhantom() {
  // Opens the current page inside Phantom’s in-app browser
  const url = encodeURIComponent(window.location.href);
  window.location.href = `https://phantom.app/ul/browse/${url}`;
}

async function connect() {
  const provider = window.solana;

  // If Phantom isn't injected (common on iPhone Safari), open Phantom browser
  if (!provider || !provider.isPhantom) {
    setStatus("Phantom not found — opening Phantom…");
    openInPhantom();
    return;
  }

  try {
    setStatus("Connecting…");
    const resp = await provider.connect(); // prompts Phantom
    const pubkey = resp.publicKey?.toString?.() || provider.publicKey?.toString?.();
    setWallet(pubkey);
    setStatus("Connected ✅");
  } catch (e) {
    console.error(e);
    setStatus("Connection cancelled or failed.");
  }
}

async function disconnect() {
  const provider = window.solana;
  try {
    if (provider?.isPhantom) await provider.disconnect();
  } catch (e) {
    console.error(e);
  }
  setWallet("");
  setStatus("Disconnected.");
}

document.addEventListener("DOMContentLoaded", () => {
  const btnConnect = document.getElementById("btnConnect");
  const btnDisconnect = document.getElementById("btnDisconnect");

  if (btnConnect) btnConnect.addEventListener("click", connect);
  if (btnDisconnect) btnDisconnect.addEventListener("click", disconnect);

  setStatus("Ready");
  setWallet("");
});
