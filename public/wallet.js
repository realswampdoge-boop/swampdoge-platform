// SwampDoge Wallet v2 (Mobile Safe)

const statusEl = document.getElementById("statusText");
const walletEl = document.getElementById("walletText");

function setStatus(msg){
  if(statusEl) statusEl.innerText = msg;
}

function setWallet(addr){
  if(walletEl) walletEl.innerText = addr || "Not connected";
}

function openPhantom(){
  const url = encodeURIComponent(window.location.href);
  window.location.href =
    "https://phantom.app/ul/browse/" + url;
}

async function connectWallet(){
  const provider = window.solana;

  // iPhone Safari fix
  if(!provider || !provider.isPhantom){
    setStatus("Opening Phantom...");
    openPhantom();
    return;
  }

  try{
    setStatus("Connecting...");
    const resp = await provider.connect();
    setWallet(resp.publicKey.toString());
    setStatus("Connected ✅");
  }catch(e){
    console.error(e);
    setStatus("Connection failed");
  }
}

async function disconnectWallet(){
  const provider = window.solana;
  if(provider?.isPhantom){
    await provider.disconnect();
  }
  setWallet("");
  setStatus("Disconnected");
}

document.addEventListener("DOMContentLoaded", () => {

  const connectBtn =
    document.getElementById("btnConnect");

  const disconnectBtn =
    document.getElementById("btnDisconnect");

  connectBtn?.addEventListener("click", connectWallet);
  disconnectBtn?.addEventListener("click", disconnectWallet);

  setStatus("Ready");
});
