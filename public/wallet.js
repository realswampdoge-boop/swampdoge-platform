// ====== CONFIG ======
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump"; // your $SWAMP mint
const MIN_SWAMP_TO_UNLOCK = 1; // change later if you want (ex: 1000)

// public RPC (can be rate-limited sometimes; we’ll add a fallback)
const RPC_URLS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana"
];

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
  // getParsedTokenAccountsByOwner is easiest (no decimals math needed)
  const json = await rpcFetch({
    jsonrpc: "2.0",
    id: 1,
    method: "getParsedTokenAccountsByOwner",
    params: [
      ownerPubkey,
      { mint },
      { encoding: "jsonParsed" }
    ]
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

    if (!provider || !provider.isPhantom) {
      alert("Phantom Wallet not found. Install Phantom and try again.");
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setStatus("Connecting wallet…");
    const resp = await provider.connect();
    const pubkey = resp.publicKey.toString();

    walletText.innerText = "Connected: " + pubkey;

    setStatus("Checking $SWAMP balance…");
    const swampBal = await getTokenBalanceByMint(pubkey, SWAMP_MINT);

    if (swampBal >= MIN_SWAMP_TO_UNLOCK) {
      setStatus(`✅ VIP Unlocked — $SWAMP balance: ${swampBal}`);
      showVip(true);

      // optional: trigger VIP picks render if picks.js is loaded
      if (window.renderVipPicks) window.renderVipPicks();
    } else {
      setStatus(`🔒 Need ${MIN_SWAMP_TO_UNLOCK} $SWAMP — you have: ${swampBal}`);
      showVip(false);
    }
  } catch (err) {
    console.error(err);
    setStatus("Error connecting/checking wallet. Try again.");
    showVip(false);
  }
}

if (connectBtn) connectBtn.addEventListener("click", connectWallet);

// default locked on load
showVip(false);
