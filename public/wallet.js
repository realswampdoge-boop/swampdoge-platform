// ====== CONFIG =====
window.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const phantomBtn = document.getElementById("phantomBtn");

  if (!connectBtn || !phantomBtn) {
    alert("Buttons not found in HTML (missing IDs).");
    return;
  }

  // Make both buttons do the same thing
  connectBtn.onclick = connectPhantom;
  phantomBtn.onclick = connectPhantom;
});

function connectPhantom() {
  const isPhantomBrowser =
    window?.phantom?.solana?.isPhantom || navigator.userAgent.includes("Phantom");

  // If you’re not inside Phantom’s in-app browser, deep-link into it
  if (!window?.phantom?.solana?.isPhantom) {
    const url = encodeURIComponent(window.location.href);
    window.location.href = `https://phantom.app/ul/browse/${url}`;
    return;
  }

  window.phantom.solana.connect();
}
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump"; // $SWAMP mint
const MIN_SWAMP_TO_UNLOCK = 1; // change later (ex: 1000)

const RPC_URLS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana"
];
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";
// ====== UI ======
const connectBtn = document.getElementById("connectWallet");
const walletText = document.getElementById("walletAddress");
const tokenStatus = document.getElementById("tokenStatus");
const vipContent = document.getElementById("vipContent");
const vipLocked = document.getElementById("vipLocked");

function setStatus(msg) {
  if (tokenStatus) tokenStatus.innerText = msg;
}

function showVip(isUnlocked) {
  if (!vipContent || !vipLocked) return;
  vipContent.style.display = isUnlocked ? "block" : "none";
  vipLocked.style.display = isUnlocked ? "none" : "block";
}

// ====== SOLANA HELPERS ======
async function checkSwampBalance(publicKey) {
  try {
    const owner = new solanaWeb3.PublicKey(publicKey);

    const response = await rpcFetch({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        owner.toBase58(),
        { mint: SWAMP_MINT },
        { encoding: "jsonParsed" }
      ]
    });

    const accounts = response.result.value;

    if (accounts.length > 0) {
      setStatus("VIP UNLOCKED 🔓");
      showVip(true);
    } else {
      setStatus("Hold $SWAMP to unlock.");
      showVip(false);
    }
  } catch (e) {
    console.log(e);
    setStatus("Error checking wallet.");
  }
}
async function rpcFetch(body) {
  let lastErr;
  for (const url of RPC_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("RPC failed");
}

async function getTokenBalanceByMint(ownerPubkey, mint) {
  const json = await rpcFetch({
    jsonrpc: "2.0",
    id: 1,
    method: "getParsedTokenAccountsByOwner",
    params: [ownerPubkey, { mint }, { encoding: "jsonParsed" }]
  });

  const accounts = json?.result?.value || [];
  let total = 0;

  for (const acc of accounts) {
    const info = acc?.account?.data?.parsed?.info;
    const amount = info?.tokenAmount?.uiAmount;
    if (typeof amount === "number") total += amount;
  }
  return total;
}

// ====== WALLET FLOW ======
async function connectWallet() {
  try {
    const provider = window.phantom?.solana;
function getSolanaProvider() {
  // Phantom, Solflare, Backpack, etc commonly inject window.solana
  if (window.solana && window.solana.isPhantom) return window.solana;
  if (window.solana) return window.solana;

  // Some wallets use window.phantom.solana
  if (window.phantom?.solana) return window.phantom.solana;

  return null;
}

async function connectWallet() {
  try {
    const provider = getSolanaProvider();
    if (!provider) {
      alert("No Solana wallet found. Open this site inside Phantom/Solflare/Backpack in-app browser.");
      return;
    }

    setStatus("Connecting wallet...");
    const resp = await provider.connect();
    const pubkey = resp.publicKey.toString();

    if (walletText) walletText.innerText = pubkey;
    setStatus("Wallet connected ✅");

    // If you call your balance check here, keep it:
    // await checkVip(pubkey);

  } catch (err) {
    console.error(err);
    setStatus("Error connecting wallet. Try again.");
  }
}

    setStatus("Connecting wallet…");
    const resp = await provider.connect();
    const pubkey = resp.publicKey.toString();

    if (walletText) walletText.innerText = "Connected: " + pubkey;

    setStatus("Checking $SWAMP balance…");
    const bal = await getTokenBalanceByMint(pubkey, SWAMP_MINT);

    if (bal >= MIN_SWAMP_TO_UNLOCK) {
      setStatus(`✅ VIP Unlocked — $SWAMP: ${bal}`);
      showVip(true);
      if (window.renderVipPicks) window.renderVipPicks();
    } else {
      setStatus(`🔒 Need ${MIN_SWAMP_TO_UNLOCK} $SWAMP — you have: ${bal}`);
      showVip(false);
    }
  } catch (err) {
    console.error(err);
    setStatus("Error connecting/checking wallet. Try again.");
    showVip(false);
  }
}

if (connectBtn) connectBtn.addEventListener("click", connectWallet);
showVip(false);
