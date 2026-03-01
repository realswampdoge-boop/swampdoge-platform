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
  setTimeout(loadAiPicks, 800);
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
async function connectWalletSmart() {
  // If Phantom is injected (desktop / Phantom in-app browser)
  if (window.solana && window.solana.isPhantom) {
    return connectWallet();
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
      // notify other code if needed
      window.dispatchEvent(new CustomEvent("swampdoge:wallet", { detail: { addr } }));

      // Immediately refresh VIP + balance
      await refreshVipForWallet(addr);
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
      const res = await fetch("/api/vip-picks", { cache: "no-store" });
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

  async function refreshVipForWallet(walletAddress) {
    // 1) balance
    const bal = await getSwampBalance(walletAddress);
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
     // If the AI section is missing in HTML, create it dynamically
let aiSection = document.getElementById("aiPicksSection");
if (!aiSection) {
  aiSection = document.createElement("section");
  aiSection.id = "aiPicksSection";

  const h = document.createElement("h3");
  h.textContent = "🤖 AI Picks";

  const meta = document.createElement("div");
  meta.id = "aiPicksMeta";
  meta.className = "small muted";
  meta.textContent = "Loading AI picks...";

  const ul = document.createElement("ul");
  ul.id = "aiPicksList";

  aiSection.appendChild(h);
  aiSection.appendChild(meta);
  aiSection.appendChild(ul);

  // Insert AI section right before the Admin Panel (best spot)
  const adminTitle = Array.from(document.querySelectorAll("h2,h3")).find(x =>
    (x.textContent || "").toLowerCase().includes("admin")
  );

  if (adminTitle && adminTitle.parentNode) {
    adminTitle.parentNode.insertBefore(aiSection, adminTitle);
  } else {
    document.body.appendChild(aiSection);
  }
}

// Re-grab these in case we just created them
aiPicksMeta = document.getElement
    if (aiPicksMeta) aiPicksMeta.textContent = "Loading AI picks...";

    const res = await fetch("/api/ai-picks", { cache: "no-store" });
    if (!res.ok) throw new Error(`ai-picks status ${res.status}`);

    const data = await res.json();

    // Support generatedAt OR updatedAt
    const ts =
      data?.updatedAt ||
      data?.generatedAt ||
      data?.generated_at ||
      "";

    const picks = Array.isArray(data?.picks) ? data.picks : [];

    if (aiPicksMeta) {
      aiPicksMeta.textContent = ts
        ? `Updated: ${ts}`
        : "AI Picks Ready ✅";
    }

    if (aiPicksList) {
      aiPicksList.innerHTML = "";

      if (!picks.length) {
        const li = document.createElement("li");
        li.textContent = "No AI picks yet.";
        aiPicksList.appendChild(li);
        return;
      }

      picks.forEach((p) => {
        const li = document.createElement("li");

        if (typeof p === "string") {
          li.textContent = p;
        } else {
          const title = p.title || "AI Pick";
          const reason = p.reason || "";
          const conf =
            typeof p.confidence === "number"
              ? ` (${Math.round(p.confidence * 100)}%)`
              : "";

          li.innerHTML =
            `<strong>${title}${conf}</strong>` +
            (reason ? `<br><small>${reason}</small>` : "");
        }

        aiPicksList.appendChild(li);
      });
    }

    const dbg = document.getElementById("debugText");
    if (dbg) dbg.textContent = "AI picks loaded ✅";

  } catch (e) {
    console.log("AI PICKS ERROR", e);
    if (aiPicksMeta) aiPicksMeta.textContent = "AI picks error ❌";
    const dbg = document.getElementById("debugText");
    if (dbg) dbg.textContent = "AI picks error ❌";
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
    // Load picks immediately (AI + VIP list)
refreshAllPicks();

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


