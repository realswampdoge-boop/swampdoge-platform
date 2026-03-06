function setDebug(msg) {
  const el = document.getElementById("debugText");
  if (el) el.textContent = msg;
}

window.addEventListener("error", (e) => setDebug("JS ERROR ❌ " + (e.message || "")));
window.addEventListener("unhandledrejection", (e) =>
  setDebug("PROMISE ❌ " + (e.reason?.message || e.reason || ""))
);

setDebug("JS START ✅");
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("debugText");
if (el) el.textContent = "JS LOADED v103 ✅";
});
window.onerror = function(msg, src, line, col, err) {
  const el = document.getElementById("debugText");
  if (el) el.textContent =
    "JS CRASH ❌ line " + line + ": " + msg;
};
// ✅ Show any JS crash on-screen (so we stop being blind)
window.addEventListener("error", (e) => {
  const el = document.getElementById("debugText");
  if (el) el.textContent = "JS ERROR ❌ " + (e?.message || "unknown");
});
window.addEventListener("unhandledrejection", (e) => {
  const el = document.getElementById("debugText");
  if (el) el.textContent = "PROMISE ERROR ❌ " + (e?.reason?.message || e?.reason || "unknown");
});
function debug(msg) {
  console.log(msg);
// ✅ Tap detector (captures even if button handlers fail)
document.addEventListener("click", (e) => {
  const t = e.target;
  debug("CLICK: " + (t.id || t.tagName));
}, true);

document.addEventListener("touchstart", (e) => {
  const t = e.target;
  debug("TOUCH: " + (t.id || t.tagName));
}, { capture: true, passive: true });
  debug("TAP DETECTOR ON v99 ✅");
  const el = document.getElementById("debugText");
  if (el) el.textContent = msg;
}
console.log("✅ swampdoge-all.js LOADED");
window.__SWAMPDOGE_ALL_LOADED__ = true;
setTimeout(() => {
  const d = document.getElementById("debugText");
 if (d)d.textContent = "JS LOADED v100 ✅";
}, 300);
/* swampdoge-all.js
   All-in-one: wallet + picks + VIP + admin + AI picks

   Requires in index.html (order matters):
   <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
   <script src="./swampdoge-all.js?v=3"></script>
*/
function refreshAllPicks() {
  loadVipPicks();
  loadAiPicks();
  // iPhone Safari timing backup
  setTimeout(loadVipPicks, 600);
  setTimeout(loadAiPicks, 900);
}
(() => {
  // ====== CONFIG ======
const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";
  const VIP_MIN = 1_000_000;

  // CORS-friendly Solana RPC (browser safe)
  const RPC_URL = "https://rpc.ankr.com/solana";
  const RPC_COMMITMENT = "confirmed";

  const REFRESH_BAL_MS = 25_000;
  const REFRESH_PICKS_MS = 60_000;

  // ====== FLAGS FOR LOADER PROOF ======
  window.__WALLET_V1_LOADED__ = true;
  window.__PICKS_V1_LOADED__ = true;

  // ====== DOM REFS ======
  let statusText, walletText, swampBalEl, debugEl;

  let vipLocked, vipContent, vipPicksList;
  let vipProgressBar, vipProgressText;

  let aiPicksMeta, aiPicksList, freePicksList;

  let adminPanel, adminPin, adminPicks, btnPublish, adminStatus;
  let btnAdminToggle;

  // ====== STATE ======
  let currentWallet = null;
  let isVIP = false;

  // Keep one Connection instance
  function getConnection() {
    if (!window.solanaWeb3) return null;
    return new window.solanaWeb3.Connection(RPC_URL, RPC_COMMITMENT);
  }

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg) {
    if (statusText) statusText.textContent = msg;
  }

  function setWallet(addr) {
    if (walletText) walletText.textContent = addr || "";
  }
async function connectWallet() {
  // Works in Safari/desktop when Phantom injects
  if (window.solana && window.solana.isPhantom) {
    const resp = await window.solana.connect();
    setWallet(resp.publicKey.toString());
    return;
  }

  // iOS Home Screen app / webview fallback:
  // open Phantom’s in-app browser on your Vercel URL
  const url = encodeURIComponent(window.location.href);
  window.location.href = `https://phantom.app/ul/browse/${url}?ref=swampdoge`;
}

  // iOS "app" / PWA / webview fallback
  const url = encodeURIComponent(window.location.href);
  window.location.href = `https://phantom.app/ul/browse/${url}?ref=swampdoge`;
}

  // iPhone Safari: open Phantom via deep link
  return connectWalletMobile();
}
   window.connectWalletSmart = connectWalletSmart;
window.connectWalletMobile = connectWalletMobile;
  function setDebug(msg) {
    if (debugEl) debugEl.textContent = msg;
  }

  function setSwampBal(v) {
    if (swampBalEl) swampBalEl.textContent = String(v ?? "");
  }

  function showVip(unlocked) {
    if (vipLocked) vipLocked.style.display = unlocked ? "none" : "block";
    if (vipContent) vipContent.style.display = unlocked ? "block" : "none";
  }

  function setVipProgress(balance) {
    const pct = Math.max(0, Math.min(100, (Number(balance || 0) / VIP_MIN) * 100));
    if (vipProgressBar) vipProgressBar.style.width = `${pct.toFixed(1)}%`;
    if (vipProgressText) vipProgressText.textContent = `VIP Progress: ${pct.toFixed(1)}%`;
  }

  function showAdmin(show) {
    if (adminPanel) adminPanel.style.display = show ? "block" : "none";
  }

  // ====== PHANTOM HELPERS ======
  function phantomProvider() {
    // Phantom injects window.solana in its in-app browser OR via extension on desktop
    if (window.solana && window.solana.isPhantom) return window.solana;
    return null;
  }

  // If user is NOT in Phantom browser, this deep-link opens Phantom and returns to your site
  function openPhantomDeepLink() {
    const back = encodeURIComponent(window.location.href);
    const link = `https://phantom.app/ul/browse/${back}?ref=${encodeURIComponent("swampdoge")}`;
    window.location.href = link;
  }

  // You used onclick="connectWalletMobile()" in HTML — we provide it.
  window.connectWalletMobile = async function connectWalletMobile() {
    await connectWallet();
  };

  async function connectWallet() {
    try {
      const provider = phantomProvider();
      if (!provider) {
        setStatus("Phantom not found ❌");
        setDebug("Open this page inside Phantom browser");
        // Deep link helps on iPhone
        openPhantomDeepLink();
        return;
      }

      setStatus("Connecting…");
      const resp = await provider.connect();
      const addr = resp?.publicKey?.toString?.() || null;
      if (!addr) throw new Error("No wallet address returned");

      currentWallet = addr;
      window.__SWAMPDOGE_WALLET__ = addr;

      setStatus("Connected ✅");
      setWallet(addr);
      await refreshVipForWallet(addr);
      refreshAllPicks();
         // notify other code if needed
      window.dispatchEvent(new CustomEvent("swampdoge:wallet", { detail: { addr } }));

      // Immediately refresh VIP + balance
   
    } catch (e) {
      console.log(e);
      setStatus("Connect error ❌");
      setDebug(String(e?.message || e));
    }
  }

  async function disconnectWallet() {
    try {
      const provider = phantomProvider();
      if (provider?.disconnect) await provider.disconnect();
    } catch (e) {
      // ignore
    }
    currentWallet = null;
    window.__SWAMPDOGE_WALLET__ = null;
    window.__SWAMPDOGE_BALANCE__ = 0;

    setStatus("Disconnected");
    setWallet("");
    setSwampBal("...");
    setVipProgress(0);
    showVip(false);
    showAdmin(false);
  }

  // ====== TOKEN BALANCE ======
  async function getSwampBalance(walletAddress) {
    try {
      const connection = getConnection();
      if (!connection) throw new Error("solanaWeb3 not loaded");

      const owner = new window.solanaWeb3.PublicKey(walletAddress);
      const mint = new window.solanaWeb3.PublicKey(SWAMP_MINT);

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });

      let balance = 0;
      tokenAccounts.value.forEach(({ account }) => {
        const amt = account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
        balance += amt;
      });

      return balance;
    } catch (e) {
      console.log(e);
      setDebug("TOKEN ERROR ❌");
      return 0;
    }
  }

  // ====== VIP / PICKS ======
  async function loadVipPicks() {
    try {
      const res = await fetch(`/vip-picks.json?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`vip-picks status ${res.status}`);
      const data = await res.json();

      // Expect: { updatedAt, picks: [...] } OR { picks: [...] }
      const picks = Array.isArray(data?.picks) ? data.picks : Array.isArray(data) ? data : [];

      if (vipPicksList) {
        vipPicksList.innerHTML = "";
        picks.forEach((p) => {
          const li = document.createElement("li");
          li.textContent = typeof p === "string" ? p : JSON.stringify(p);
          vipPicksList.appendChild(li);
        });
      }

      setDebug(`VIP picks loaded ✅ (${picks.length})`);
    } catch (e) {
      console.log(e);
      setDebug("VIP picks load ❌");
    }
  }
function setVipVisual(isUnlocked, balance, needed) {
  const vipCard = document.getElementById("vipCard");
  const vipLockNote = document.getElementById("vipLockNote");
  const vipProgressFill = document.getElementById("vipProgressFill");
  const vipStatusText = document.getElementById("vipStatusText");
  const vipPicksBox = document.getElementById("vipPicksBox");

  if (!vipCard || !vipLockNote || !vipProgressFill || !vipStatusText || !vipPicksBox) return;

  const pct = Math.max(0, Math.min(100, (balance / needed) * 100));
  vipProgressFill.style.width = pct + "%";

  if (isUnlocked) {
    vipCard.classList.add("vipUnlocked");
    vipCard.classList.add("pulse");
setTimeout(() => vipCard.classList.remove("pulse"), 450);
    vipLockNote.textContent = "VIP ACCESS UNLOCKED ✅";
    vipLockNote.classList.add("vipUnlockedText");
    vipStatusText.textContent = "Premium access active";
    vipStatusText.classList.add("vipUnlockedText");
    vipPicksBox.style.display = "block";
  } else {
    vipCard.classList.remove("vipUnlocked");
    vipLockNote.innerHTML = "Hold <b>$SWAMP</b> to unlock VIP picks.";
    vipLockNote.classList.remove("vipUnlockedText");
    vipStatusText.textContent = `${Number(balance).toLocaleString()} / ${Number(needed).toLocaleString()} SWAMP`;
    vipStatusText.classList.remove("vipUnlockedText");
    vipPicksBox.style.display = "none";
  }
}


  async function refreshVipForWallet(walletAddress) {
    // 1) balance
    const bal = await getSwampBalance(walletAddress);
    setVipVisual(bal >= MIN_SWAMP_FOR_VIP, bal, MIN_SWAMP_FOR_VIP);
setDebug(`BAL ✅ ${bal}`);
    window.__SWAMPDOGE_BALANCE__ = bal;
    setSwampBal(bal);
    setVipProgress(bal);

    // 2) gating
    isVIP = bal >= VIP_MIN;
    showVip(isVIP);

    // 3) picks
    await loadVipPicks();
    await loadAiPicks();
    setTimeout(loadAiPicks, 800);
  }

  
  // ======= AI PICKS =======
async function loadAiPicks() {
  try {
    // Always use LET if we might re-grab elements
    let aiPicksMeta = document.getElementById("aiPicksMeta");
    let aiPicksList = document.getElementById("aiPicksList");

    if (aiPicksMeta) aiPicksMeta.textContent = "Loading AI picks...";

    const res = await fetch("/api/ai-picks?ts=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("ai-picks status " + res.status);

    const data = await res.json();

    // Re-grab once (safe because LET)
    aiPicksMeta = document.getElementById("aiPicksMeta");
    aiPicksList = document.getElementById("aiPicksList");

    const picks = Array.isArray(data?.picks) ? data.picks : [];

    const ts = data?.updatedAt || data?.generatedAt || "";
    if (aiPicksMeta) aiPicksMeta.textContent = ts ? `Updated: ${ts}` : "Updated";

    if (aiPicksList) {
      aiPicksList.innerHTML = "";
      picks.forEach((p) => {
        const li = document.createElement("li");
        li.textContent = typeof p === "string" ? p : (p?.title || JSON.stringify(p));
        aiPicksList.appendChild(li);
      });

      if (!picks.length) {
        const li = document.createElement("li");
        li.textContent = "No AI picks yet.";
        aiPicksList.appendChild(li);
      }
    }
  } catch (e) {
    console.log("AI PICKS ERROR", e);
    const aiPicksMeta = document.getElementById("aiPicksMeta");
    if (aiPicksMeta) aiPicksMeta.textContent = "AI picks error ❌";
  }
}

  // ====== ADMIN PUBLISH ======
  async function publishVipPicks() {
    try {
      if (!adminStatus) return;

      const pin = adminPin?.value || "";
      const text = adminPicks?.value || "";

      adminStatus.textContent = "Publishing…";

      const res = await fetch("/api/update-vip-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, picksText: text }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        adminStatus.textContent = data?.error ? `Error: ${data.error}` : `Error (${res.status})`;
        return;
      }

      adminStatus.textContent = "Published ✅";
      // refresh VIP picks display
      await loadVipPicks();
    } catch (e) {
      console.log(e);
      if (adminStatus) adminStatus.textContent = "Publish error ❌";
    }
  }

  // ====== UTIL ======
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ====== BOOTSTRAP ======
  window.addEventListener("DOMContentLoaded", () => {
    // Wallet section IDs
    statusText = $("statusText");
    walletText = $("walletText");
    swampBalEl = $("balanceText");
    debugEl = $("debugText");

    // VIP section IDs
    vipLocked = $("vipLocked");
    vipContent = $("vipContent");
    vipPicksList = $("vipPicksList");

    vipProgressBar = $("vipProgressBar");
    vipProgressText = $("vipProgressText");

    // Picks section IDs
    aiPicksMeta = $("aiPicksMeta");
    aiPicksList = $("aiPicksList");
    freePicksList = $("freePicksList"); // (optional)

    // Admin IDs (based on your screenshots)
    adminPanel = $("adminPanel");
    adminPin = $("adminPin");
    adminPicks = $("adminPicks");
    btnPublish = $("btnPublish");
    adminStatus = $("adminStatus");
    btnAdminToggle = $("btnAdminToggle");

    // Default UI state
    setStatus("Not connected");
    setWallet("");
    setSwampBal("...");
    showVip(false);
    showAdmin(false);
    setVipProgress(0);

    // Buttons: supports both onclick and addEventListener
    const btnConnect = $("btnConnect");
    const btnDisconnect = $("btnDisconnect");

    if (btnConnect && !btnConnect.getAttribute("onclick")) {
      btnConnect?.addEventListener("click", connectWalletSmart);
    }

    if (btnDisconnect) btnDisconnect.addEventListener("click", disconnectWallet);

    if (btnPublish) btnPublish.addEventListener("click", publishVipPicks);

    if (btnAdminToggle) {
      btnAdminToggle.addEventListener("click", () => {
        const cur = adminPanel && adminPanel.style.display !== "none";
        showAdmin(!cur);
      });
    }

    // Load picks immediately (AI + VIP list)
    

    // If already connected (Phantom can auto-inject)
    setTimeout(async () => {
      const provider = phantomProvider();
      try {
        // If Phantom is available and already authorized, it may expose publicKey
        const addr = provider?.publicKey?.toString?.() || window.__SWAMPDOGE_WALLET__ || null;
        if (addr) {
          currentWallet = addr;
          setStatus("Connected ✅");
          setWallet(addr);
          await refreshVipForWallet(addr);
           refreshAllPicks();
        }
      } catch {
        // ignore
      }
    }, 600);

    // Auto-refresh loops
    setInterval(() => {
      loadAiPicks();
    }, REFRESH_PICKS_MS);

    setInterval(() => {
      if (currentWallet) refreshVipForWallet(currentWallet);
    }, REFRESH_BAL_MS);

    // Listen for wallet event if something else fires it
    window.addEventListener("swampdoge:wallet", async (e) => {
      const addr = e?.detail?.addr || null;
      if (addr) {
        currentWallet = addr;
        await refreshVipForWallet(addr);
      }
    });

    // Debug loader message
    setDebug("Loader ✅ | wallet ✅ | picks ✅");
  });
})();
window.connectWalletSmart = connectWalletSmart;
window.connectWalletMobile = connectWalletMobile;


// ===== SWAMPDOGE STARTUP =====


document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("SwampDoge booting...");

    if (!document.getElementById("aiPicksSection")) {
      const section = document.createElement("section");
      section.id = "aiPicksSection";

      section.innerHTML = `
        <h3>🤖 AI Picks</h3>
        <div id="aiPicksMeta" class="small muted">
          Loading AI picks...
        </div>
        <ul id="aiPicksList"></ul>
        <hr>
      `;

      document.body.appendChild(section);
    }

    await loadVipPicks();
    await loadAiPicks();

    setInterval(loadVipPicks, 30000);
    setInterval(loadAiPicks, 30000);

  } catch (e) {
    console.log("BOOT ERROR", e);
  }
});
document.addEventListener("DOMContentLoaded", () => {

  debug("Binding buttons...");

  const btnConnect = document.getElementById("btnConnect");
  const btnDisconnect = document.getElementById("btnDisconnect");
  const btnPublish = document.getElementById("btnPublish");

  if (btnConnect) {
    btnConnect.addEventListener("click", () => {
      debug("Connect tapped ✅");
      connectWalletSmart();
    });
  } else {
    debug("btnConnect NOT FOUND ❌");
  }

  if (btnDisconnect) {
    btnDisconnect.addEventListener("click", () => {
      debug("Disconnect tapped ✅");
      disconnectWallet();
    });
  }

  if (btnPublish) {
    btnPublish.addEventListener("click", () => {
      debug("Publish tapped ✅");
      publishVipPicks();
    });
  }

});

// ✅ PANIC BIND: always bind buttons after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const debugEl = document.getElementById("debugText");
  const say = (m) => { if (debugEl) debugEl.textContent = m; console.log(m); };

  const btnConnect = document.getElementById("btnConnect");
  const btnDisconnect = document.getElementById("btnDisconnect");
  const btnPublish = document.getElementById("btnPublish");

  say("Binding buttons...");

  const safe = (fn, name) => () => {
    try { fn(); }
    catch (e) { console.log(e); say(`${name} ERROR ❌`); }
  };

  // Use whichever connect function actually exists
  const connectFn =
    (typeof connectWalletSmart === "function" && connectWalletSmart) ||
    (typeof connectWallet === "function" && connectWallet) ||
    (typeof connectPhantom === "function" && connectPhantom);

  if (btnConnect && connectFn) {
    btnConnect.addEventListener("click", safe(connectFn, "Connect"));
    btnConnect.addEventListener("touchstart", (e) => { e.preventDefault(); safe(connectFn, "Connect")(); }, { passive: false });
    say("Buttons ready ✅");
  } else {
    say("Connect bind failed ❌");
  }

  if (btnDisconnect && typeof disconnectWallet === "function") {
    btnDisconnect.addEventListener("click", safe(disconnectWallet, "Disconnect"));
    btnDisconnect.addEventListener("touchstart", (e) => { e.preventDefault(); safe(disconnectWallet, "Disconnect")(); }, { passive: false });
  }

  if (btnPublish && typeof publishVipPicks === "function") {
    btnPublish.addEventListener("click", safe(publishVipPicks, "Publish"));
    btnPublish.addEventListener("touchstart", (e) => { e.preventDefault(); safe(publishVipPicks, "Publish")(); }, { passive: false });
  }
});

// ✅ Hard fallback taps (works even when addEventListener breaks)
window.__tapConnect = () => {
  debug("Connect tapped ✅");
  const fn =
    (typeof connectWalletSmart === "function" && connectWalletSmart) ||
    (typeof connectWallet === "function" && connectWallet) ||
    (typeof connectPhantom === "function" && connectPhantom);

  if (!fn) return debug("No connect function ❌");
  fn();
};

window.__tapDisconnect = () => {
  debug("Disconnect tapped ✅");
  if (typeof disconnectWallet !== "function") return debug("disconnectWallet missing ❌");
  disconnectWallet();
};

window.__tapPublish = () => {
  debug("Publish tapped ✅");
  if (typeof publishVipPicks !== "function") return debug("publishVipPicks missing ❌");
  publishVipPicks();
};

window.__tapAdmin = () => {
  debug("Admin tapped ✅");
  if (typeof showAdmin !== "function") return debug("showAdmin missing ❌");

  const adminPanel = document.getElementById("adminPanel");
  const open = adminPanel && adminPanel.style.display !== "none";
  showAdmin(!open);
};
/* =========================
   SWAMPDOGE BUTTON BRIDGE
========================= */

window.__tapConnect = async function () {
  console.log("CONNECT TAP ✅");
  connectWallet();
};

window.__tapDisconnect = function () {
  console.log("DISCONNECT TAP ✅");
  disconnectWallet && disconnectWallet();
};

window.__tapPublish = function () {
  console.log("PUBLISH TAP ✅");
  publishVipPicks && publishVipPicks();
};
document.addEventListener("DOMContentLoaded", () => {
  const onTap = (id, fn, label) => {
    const btn = document.getElementById(id);
    if (!btn) return setDebug(`MISSING ❌ ${id}`);

    const handler = async (e) => {
      e?.preventDefault?.();
      try {
        setDebug(`${label} ✅`);
        await fn();
      } catch (err) {
        console.log(err);
        setDebug(`${label} ❌ ${err?.message || err}`);
      }
    };

    btn.addEventListener("click", handler);
    btn.addEventListener("touchstart", handler, { passive: false });
  };

  onTap("btnConnect", async () => {
    // SAFARI / DESKTOP
    if (window.solana && window.solana.isPhantom) {
      const resp = await window.solana.connect();
      if (typeof setWallet === "function") setWallet(resp.publicKey.toString());
      return;
    }

    // iOS HOME SCREEN / WEBVIEW fallback
    const url = encodeURIComponent(window.location.href);
    window.location.href = `https://phantom.app/ul/browse/${url}?ref=swampdoge`;
  }, "CONNECT");

  onTap("btnDisconnect", async () => {
    if (window.solana && window.solana.isPhantom) {
      await window.solana.disconnect();
    }
    if (typeof setWallet === "function") setWallet("");
  }, "DISCONNECT");

  onTap("btnPublish", async () => {
    if (typeof publishVipPicks !== "function") throw new Error("publishVipPicks() missing");
    await publishVipPicks();
  }, "PUBLISH");

  setDebug("BUTTONS READY ✅");
});
