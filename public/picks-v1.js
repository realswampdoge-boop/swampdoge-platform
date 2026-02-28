/* ============================================
   SwampDoge Picks (v1) - Single File
   ============================================ */

window.__PICKS_V1_LOADED__ = true;

console.log("✅ picks-v1.js LOADED");

// 🔒 SwampDoge Admin Lock
const ADMIN_WALLET = "AumagmtFTNer1QYcCmpG3AyqbLKMD9ByDg4okB3wtiBy";
const ADMIN_PIN = "7777"; // change this if you want a different PIN

// ===================== CONFIG =====================

// VIP requirement (set back to 1000000 when ready)
const MIN_SWAMPDOGE = 0;

// SwampDoge token mint (DO NOT CHANGE)
const SWAMPDOGE_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

// Put your BEST RPC first. You can keep the public fallbacks.
const RPC_ENDPOINTS = [
  // ✅ a612e91d-167a-4900-990c-72e358b1c647
  "https://mainnet.helius-rpc.com/?api-key=a612e91d-167a-4900-990c-72e358b1c647",

  // Public fallbacks:
  "https://rpc.ankr.com/solana",
  "https://api.mainnet-beta.solana.com",
];

// ===================== UI HOOKS =====================
// These IDs should exist in your index.html. If not, the code won’t crash.
let swampBalEl = null;
let debugEl = null;
let vipLocked = null;
let vipContent = null;

// Helper: set UI safely
function setSwampBal(v) {
  if (swampBalEl) swampBalEl.textContent = String(v);
}
function setDebug(msg) {
  if (debugEl) debugEl.textContent = String(msg);
}

// Show/hide VIP area
function showVip(isUnlocked) {
  if (vipLocked) vipLocked.style.display = isUnlocked ? "none" : "block";
  if (vipContent) vipContent.style.display = isUnlocked ? "block" : "none";
}

// ===================== RPC HELPERS =====================

function withTimeout(ms, promiseFactory) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);

  return Promise.resolve()
    .then(() => promiseFactory(ctrl.signal))
    .finally(() => clearTimeout(timer));
}

async function rpc(method, params) {
  let lastErr = null;

  for (const url of RPC_ENDPOINTS) {
    try {
      const json = await withTimeout(8000, (signal) =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params,
          }),
        })
      ).then(async (r) => {
        // Some RPCs respond with non-200 but still have JSON
        const data = await r.json().catch(() => null);
        if (!r.ok) {
          const msg =
            data?.error?.message ||
            `HTTP ${r.status} from RPC`;
          throw new Error(msg);
        }
        return data;
      });

      if (json?.error) throw new Error(json.error.message || "RPC error");
      return json.result;
    } catch (e) {
      lastErr = e;
      // try next endpoint
    }
  }

  throw lastErr || new Error("All RPC endpoints failed");
}

// ===================== FINAL SWAMPDOGE BALANCE =====================
// Uses getTokenAccountsByOwner (mint filter) and sums uiAmount
async function getSwampdogeBalance(wallet) {
  try {
    const result = await rpc("getTokenAccountsByOwner", [
      wallet,
      { mint: SWAMPDOGE_MINT },
      { encoding: "jsonParsed" },
    ]);

    const accounts = result?.value || [];
    let total = 0;

    for (const acc of accounts) {
      const amt =
        acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
      total += Number(amt || 0);
    }

    return total;
  } catch (e) {
    // Show the real reason on screen
    setDebug("RPC FAIL: " + (e?.message || e));
    return 0;
  }
}

// ===================== MAIN VIP CHECK =====================

async function refreshVipForWallet(wallet) {
  try {
    if (!wallet) {
      setDebug("No wallet");
      showVip(false);
      setSwampBal("0");
      return;
    }

    setDebug("Checking SwampDoge...");
    setSwampBal("...");

    const balance = await getSwampdogeBalance(wallet);

    setSwampBal(balance);

    const unlocked = Number(balance) >= Number(MIN_SWAMPDOGE);
    showVip(unlocked);

    setDebug(unlocked ? "VIP UNLOCKED ✅" : "VIP LOCKED 🔒");
  } catch (e) {
    console.log(e);
    setDebug("Balance check error ❌");
    showVip(false);
  }
}

// ===================== BOOTSTRAP =====================

window.addEventListener("DOMContentLoaded", () => {
  // Grab elements (update these IDs if your HTML uses different ones)
  swampBalEl = document.getElementById("swampBal") || document.getElementById("swampBalance");
  debugEl = document.getElementById("debug");
  vipLocked = document.getElementById("vipLocked");
  vipContent = document.getElementById("vipContent");

  // If debug exists, show loader status like your screenshot
  const walletReady = !!window.__WALLET_V1_LOADED__ || !!window.__WALLET_LOADED__;
  setDebug(
    `Loader ✅ | wallet ${walletReady ? "✅" : "❌"} | picks ✅`
  );

  // Listen for wallet connect event from wallet-v1.js
  window.addEventListener("swampdoge:wallet", (e) => {
    const addr = e?.detail?.addr || null;
    window.__SWAMPDOGE_WALLET__ = addr;
    refreshVipForWallet(addr);
  });

  // Run once if already connected
  setTimeout(() => {
    const addr = window.__SWAMPDOGE_WALLET__ || null;
    if (addr) refreshVipForWallet(addr);
  }, 500);

  // FORCE BALANCE CHECK AFTER LOAD
  setTimeout(() => {
    const addr = window.__SWAMPDOGE_WALLET__ || null;
    if (addr) refreshVipForWallet(addr);
  }, 1200);
});
// 🐊 VIP PICKS AUTO-LOADER (with on-screen debug)
async function loadVipPicks() {
  const dbg = document.getElementById("debugText");

  try {
    if (dbg) dbg.textContent = "Loading VIP picks JSON...";

    const res = await fetch("/vip-picks.json?v=" + Date.now());
    if (!res.ok) throw new Error("VIP JSON HTTP " + res.status);

    const data = await res.json();

    const ul = document.getElementById("vipPicksList");
    if (!ul) throw new Error("Missing element: #vipPicksList");

    ul.innerHTML = "";

(data.picks || []).forEach((p) => {

  p.split(",").forEach(text => {
    const li = document.createElement("li");
    li.textContent = text.trim();
    ul.appendChild(li);
  });

});

    if (dbg) dbg.textContent = "VIP picks loaded ✅ (" + (data.picks || []).length + ")";
  } catch (e) {
    console.log("VIP picks load failed", e);
    if (dbg) dbg.textContent = "VIP picks ERROR: " + (e?.message || e);
  }
}

window.loadVipPicks = loadVipPicks;

// Force one load on page load (safe even if VIP is locked)
setTimeout(() => {
  if (window.loadVipPicks) window.loadVipPicks();
}, 800);

// =============================
// 🛠️ ADMIN PANEL UI
// =============================
(function initAdminPanel() {
  const btnToggle = document.getElementById("btnAdminToggle");
  const panel = document.getElementById("adminPanel");
  const pinInput = document.getElementById("adminPin");
  const picksBox = document.getElementById("adminPicks");
  const btnPublish = document.getElementById("btnPublish");
  const status = document.getElementById("adminStatus");

  if (!btnToggle || !panel || !picksBox || !btnPublish || !status) return;

  // Toggle panel
  btnToggle.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    status.textContent = "";
  });

  // Prefill with current picks (from DOM list)
  btnToggle.addEventListener("click", () => {
    const ul = document.getElementById("vipPicksList");
    if (!ul) return;
    const current = Array.from(ul.querySelectorAll("li")).map(li => li.textContent || "");
    if (current.length) picksBox.value = current.join("\n");
  });

  // Publish
  btnPublish.addEventListener("click", async () => {
    const pin = (pinInput.value || "").trim();
    const picks = (picksBox.value || "")
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    if (!pin) return (status.textContent = "Enter Admin PIN.");
    if (!picks.length) return (status.textContent = "Add at least 1 pick.");

    status.textContent = "Publishing...";

    try {
      const res = await fetch("/api/update-vip-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, picks })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));

      status.textContent = "Published ✅ Reloading picks...";
      // Refresh picks from JSON after publish
      setTimeout(() => {
        if (window.loadVipPicks) window.loadVipPicks();
      }, 500);
    } catch (e) {
      status.textContent = "Publish failed: " + (e?.message || e);
    }
  });
})();
