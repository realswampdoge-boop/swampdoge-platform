/* SwampDoge Picks v1
   - Wallet connect display hooks (expects wallet-v1.js to dispatch "swampdoge:wallet")
   - VIP gating by token balance (progress bar)
   - Loads VIP picks from /vip-picks.json (rewritten to /api/vip-picks)
   - Admin panel publishes VIP picks via /api/update-vip-picks
   - Displays AI picks from /api/ai-picks (optional publish flow via /api/publish-ai)
*/

let swampBalEl = null;
let debugEl = null;
let vipLocked = null;
let vipContent = null;
let adminWrap = null;
let adminPinEl = null;
let adminTextEl = null;
let adminBtnEl = null;
let adminMsgEl = null;

function setDebug(msg) {
  if (debugEl) debugEl.textContent = msg;
}

function setSwampBal(v) {
  if (swampBalEl) swampBalEl.textContent = String(v);
}

function showVip(unlocked) {
  if (vipLocked) vipLocked.style.display = unlocked ? "none" : "block";
  if (vipContent) vipContent.style.display = unlocked ? "block" : "none";
}

function showAdmin(show) {
  if (adminWrap) adminWrap.style.display = show ? "block" : "none";
}

function fmtNum(n) {
  const x = Number(n);
  if (!isFinite(x)) return String(n);
  return x.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// ---------------- VIP PICKS (read) ----------------
async function loadVipPicks() {
  try {
    const res = await fetch("/vip-picks.json", { cache: "no-store" }); // rewrites to /api/vip-picks if vercel.json set
    const data = await res.json();

    // Expected format:
    // { v: number, updatedAt: "...", picksText: "line1\nline2\n..." }
    const picksText = (data && (data.picksText || data.text || "")) || "";

    // Render VIP picks in vipContent (simple bullets)
    const list = document.getElementById("vipList");
    if (list) {
      const lines = picksText
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

      list.innerHTML = lines.map(line => `<li>${escapeHtml(line)}</li>`).join("");
    }

    setDebug(`VIP picks loaded ✅ (${(data && data.v) || 1})`);
  } catch (e) {
    console.log(e);
    setDebug("VIP picks load error ❌");
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------------- VIP CHECK (balance → unlock) ----------------
async function refreshVipForWallet(wallet) {
  try {
    if (!wallet) {
      setSwampBal("0");
      showVip(false);
      return;
    }

    setDebug("Checking SwampDoge...");
    setSwampBal("...");

    // IMPORTANT:
    // You already have your balance logic working.
    // Replace the next line with your real balance fetch if you want.
    // For now it uses a global injected by your wallet logic if present.
    let balance =
      (window.__SWAMPDOGE_BALANCE__ != null ? Number(window.__SWAMPDOGE_BALANCE__) : null);

    // Fallback: keep last known or 0
    if (balance == null || !isFinite(balance)) balance = 0;

    setSwampBal(fmtNum(balance));

    const VIP_REQUIREMENT = 1000000;
    const unlocked = Number(balance) >= VIP_REQUIREMENT;

    const progress = Math.min(100, (Number(balance) / VIP_REQUIREMENT) * 100);

    // Progress bar UI
    const bar = document.getElementById("vipProgressBar");
    const txt = document.getElementById("vipProgressText");
    if (bar) bar.style.width = progress + "%";
    if (txt) txt.textContent = `VIP Progress: ${progress.toFixed(1)}%`;

    // Debug
    setDebug(unlocked ? "VIP UNLOCKED ✅" : `VIP Progress: ${progress.toFixed(1)}%`);

    showVip(unlocked);

    // If unlocked, ensure VIP picks loaded
    if (unlocked) loadVipPicks();
  } catch (e) {
    console.log(e);
    setDebug("Balance check error ❌");
    showVip(false);
  }
}

// ---------------- ADMIN (publish VIP picks) ----------------
async function publishVipPicks() {
  if (!adminMsgEl) return;

  adminMsgEl.textContent = "Publishing...";
  const pin = (adminPinEl && adminPinEl.value) || "";
  const picksText = (adminTextEl && adminTextEl.value) || "";

  try {
    const res = await fetch("/api/update-vip-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, picksText })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      adminMsgEl.textContent = `Publish failed: HTTP ${res.status}`;
      return;
    }

    adminMsgEl.textContent = "Published ✅";
    // Reload VIP picks so UI updates
    await loadVipPicks();
  } catch (e) {
    console.log(e);
    adminMsgEl.textContent = "Publish failed: network error";
  }
}

// ---------------- AI PICKS (read) ----------------
async function loadAiPicks() {
  try {
    const res = await fetch("/api/ai-picks", { cache: "no-store" });
    const data = await res.json();

    const box = document.getElementById("aiPicks");
    if (!box) return;

    if (!data || !data.ok) {
      box.textContent = "AI picks not available yet.";
      return;
    }

    const picks = Array.isArray(data.picks) ? data.picks : [];
    box.innerHTML = picks
      .map(
        p => `
        <div class="pick">
          <b>${escapeHtml(p.title || "")}</b><br/>
          ${escapeHtml(p.reason || "")}<br/>
          Confidence: ${Math.round((Number(p.confidence || 0) * 100))}%
        </div>
      `
      )
      .join("");
  } catch (e) {
    console.log("AI picks error", e);
  }
}

// ---------------- BOOTSTRAP ----------------
/* ===== SWAMPDOGE AI PICKS AUTO LOAD ===== */

async function loadAiPicks() {
  try {
    const res = await fetch("/api/ai-picks", { cache: "no-store" });
    const data = await res.json();

    const meta = document.getElementById("aiPicksMeta");
    const list = document.getElementById("aiPicksList");

    if (!data.ok) {
      if (meta) meta.textContent = "AI picks unavailable";
      return;
    }

    if (meta)
      meta.textContent =
        "Updated: " +
        new Date(data.generatedAt).toLocaleString();

    if (list) {
      list.innerHTML = "";
      data.picks.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML =
          `<b>${p.title}</b><br>
           ${p.reason}<br>
           Confidence: ${(p.confidence * 100).toFixed(0)}%`;
        list.appendChild(li);
      });
    }
  } catch (e) {
    console.log(e);
  }
}

loadAiPicks();
setInterval(loadAiPicks, 60000);
window.addEventListener("DOMContentLoaded", () => {
  // Grab elements
  swampBalEl = document.getElementById("swampBal");
  debugEl = document.getElementById("debug");
  vipLocked = document.getElementById("vipLocked");
  vipContent = document.getElementById("vipContent");

  adminWrap = document.getElementById("adminPanel");
  adminPinEl = document.getElementById("adminPin");
  adminTextEl = document.getElementById("adminText");
  adminBtnEl = document.getElementById("adminPublishBtn");
  adminMsgEl = document.getElementById("adminMsg");

  // Loader debug
  const walletReady =
    !!window.__WALLET_V1_LOADED__ || !!window.__WALLET_LOADED__;
  setDebug(`Loader ✅ | wallet ${walletReady ? "✅" : "❌"} | picks ✅`);

  // Button handlers
  if (adminBtnEl) adminBtnEl.addEventListener("click", publishVipPicks);

  // Default hidden admin
  showAdmin(false);

  // If you have an "Admin" toggle button, it should call window.__toggleAdmin()
  window.__toggleAdmin = () => {
    const cur = adminWrap && adminWrap.style.display !== "none";
    showAdmin(!cur);
  };

  // Listen for wallet connect event from wallet-v1.js
  window.addEventListener("swampdoge:wallet", (e) => {
    const addr = e?.detail?.addr || null;
    window.__SWAMPDOGE_WALLET__ = addr;
    refreshVipForWallet(addr);
  });

  // Run once if already connected (your wallet script sets __SWAMPDOGE_WALLET__)
  setTimeout(() => {
    const addr = window.__SWAMPDOGE_WALLET__ || null;
    if (addr) refreshVipForWallet(addr);
  }, 500);

  // Always load AI picks (free)
  loadAiPicks();
});
