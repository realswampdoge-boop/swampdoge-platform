const SWAMP_MINT =
"GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

const MIN_SWAMP_TO_UNLOCK = 1000000;
const TOKEN_MINT =
"GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

const statusEl = document.getElementById("statusText");
const walletEl = document.getElementById("walletText");

function setStatus(msg){
  if(statusEl) statusEl.innerText = msg;
}

function setWallet(addr){
  if(walletEl) walletEl.innerText = addr || "Not connected";
}

async function connectWallet(){

  const provider = window.solana;

  if(!provider || !provider.isPhantom){
    alert("Install Phantom Wallet");
    window.open("https://phantom.app/");
    return;
  }

  try{
    setStatus("Connecting...");
    const resp = await provider.connect();
    const pubkey = resp.publicKey.toString();
setStatus("Connecting wallet...");

const resp = await provider.connect();

const pubkey = resp.publicKey.toString();

if (walletText) walletText.innerText = pubkey;

setStatus("✅ Wallet Connected");

// wait 1 second before balance check
setTimeout(async () => {
  try {
    setStatus("Checking $SWAMP balance...");

    const balance = await getTokenBalance(pubkey);

    if (balance >= MIN_SWAMP_TO_UNLOCK) {
      setStatus("✅ VIP Unlocked");
      showVip(true);
    } else {
      setStatus("🔒 Need 1,000,000 $SWAMP");
      showVip(false);
    }

  } catch (e) {
    console.error(e);
    setStatus("Balance check failed");
  }
}, 1000);
async function getTokenBalance(wallet) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenAccountsByOwner",
    params: [
      wallet,
      { mint: SWAMP_MINT },
      { encoding: "jsonParsed" }
    ]
  };

  const res = await rpcFetch(body);

  if (!res?.result?.value?.length) return 0;

  return parseFloat(
    res.result.value[0].account.data.parsed.info.tokenAmount.uiAmount
  );
}
  function disconnectWallet() {
  try {
    if (window.solana && window.solana.disconnect) {
      window.solana.disconnect();
    }

    const walletText = document.getElementById("walletText");
    const statusText = document.getElementById("statusText");

    if (walletText) walletText.innerText = "Not connected";
    if (statusText) statusText.innerText = "Disconnected";

  } catch (err) {
    console.error(err);
  }
}
