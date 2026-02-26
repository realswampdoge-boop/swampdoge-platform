// ====== CONFIG ======
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

// Change this to whatever amount unlocks VIP (example: 1000 SWAMP)
const MIN_SWAMP_TO_UNLOCK = 1000;

// Use a CORS-friendly RPC first (Ankr usually works in browsers)
const RPC_URLS = [
  "https://rpc.ankr.com/solana",
  "https://api.mainnet-beta.solana.com",
];

// ====== UI HOOKS ======
const connectBtn = document.getElementById("connectWalletBtn");
const phantomBtn = document.getElementById("connectPhantomBtn");
const walletText = document.getElementById("walletAddress");
const tokenStatus = document.getElementById("tokenStatus");
const swampBalanceEl = document.getElementById("swampBalance");
const vipContent = document.getElementById("vipContent");
const vipLocked = document.getElementById("vipLocked");

// Optional: if you have a VIP list renderer later
window.renderVipPicks = window.renderVipPicks || function () {};

function setStatus(msg) {
  if (tokenStatus) tokenStatus.innerText = msg;
}

function showVip(isUnlocked) {
  if (vipContent) vipContent.style.display = isUnlocked ? "block" : "none";
  if (vipLocked) vipLocked.style.display = isUnlocked ? "none" : "block";
}

function setBalance(amount) {
  if (swampBalanceEl) swampBalanceEl.innerText = `SWAMP Balance: ${amount}`;
}

// ====== RPC HELPERS ======
async function rpcFetch(body) {
  let lastErr;
  for (const url of RPC_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("RPC failed");
}

async function getTokenBalanceByMint(ownerPubkeyStr, mintStr) {
  // 1) Find token accounts for this mint
  const tokenAccounts = await rpcFetch({
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenAccountsByOwner",
    params: [
      ownerPubkeyStr,
      { mint: mintStr },
      { encoding: "jsonParsed" },
    ],
  });

  const list = tokenAccounts?.result?.value || [];
  if (!list.length) return 0;

  // 2) Sum balances across token accounts (uiAmount handles decimals)
  let total = 0;
  for (const acct of list) {
    const uiAmount =
      acct?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
    total += uiAmount;
  }
  return total;
}

// ====== WALLET CONNECT ======
async function connectAndCheck() {
  try {
    const provider = window.solana;

    if (!provider || !provider.isPhantom) {
      alert("Phantom Wallet not found. Install Phantom and try again.");
      // helpful link
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setStatus("Connecting wallet...");
    const resp = await provider.connect(); // prompts Phantom
    const pubkey = resp.publicKey.toString();

    if (walletText) walletText.innerText = `Connected: ${pubkey}`;

    setStatus("Checking $SWAMP balance...");
    const bal = await getTokenBalanceByMint(pubkey, SWAMP_MINT);

    setBalance(bal);

    if (bal >= MIN_SWAMP_TO_UNLOCK) {
      setStatus(`✅ VIP Unlocked — $SWAMP: ${bal}`);
      showVip(true);
      window.renderVipPicks(); // optional
    } else {
      setStatus(`🔒 Need ${MIN_SWAMP_TO_UNLOCK} $SWAMP — you have ${bal}`);
      showVip(false);
    }
  } catch (err) {
    console.error(err);
    setStatus("Error connecting/checking wallet. Try again.");
    showVip(false);
  }
}

// Make BOTH buttons do the same thing
if (connectBtn) connectBtn.addEventListener("click", connectAndCheck);
if (phantomBtn) phantomBtn.addEventListener("click", connectAndCheck);

// Default state
showVip(false);
setStatus("Tap Connect Wallet to check VIP eligibility.");
