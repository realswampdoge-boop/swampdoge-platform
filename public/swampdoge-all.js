/* SwampDoge All-in-One (Wallet + VIP + Admin + AI Picks)
   Works with IDs shown in your screenshots:
   btnConnect, btnDisconnect, statusText, walletText, swampBal, debugText
   vipLocked, vipContent, vipPicksList, freePicksList
   vipProgressBar, vipProgressText
   adminPanel, adminPin, adminPicks, btnPublish, adminStatus, btnAdminToggle
   aiPicksMeta, aiPicksList
*/

(() => {
  // =========================
  // CONFIG (edit if needed)
  // =========================
  const REQUIRED_SWAMP = 1_000_000; // VIP unlock threshold
  const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump"; // your token mint
  const RPC_URL =
    window.__SWAMP_RPC__ ||
    "https://api.mainnet-beta.solana.com"; // change if you use a custom RPC

  const VIP_PICKS_URL = "/api/vip-picks"; // you have a vercel.json rewrite
  const AI_PICKS_URL = "/api/ai-picks";
  const PUBLISH_VIP_URL = "/api/update-vip-picks";

  // =========================
  // DOM HELPERS
  // =========================
  const $ = (id) => document.getElementById(id);

  // Elements (match your HTML IDs)
  let elStatus,
    elWallet,
    elBal,
    elDebug,
    elVipLocked,
    elVipContent,
    elVipList,
    elFreeList,
    elVipBar,
    elVipText,
    elAdminPanel,
    elAdminPin,
    elAdminPicks,
    elBtnPublish,
    elAdminStatus,
    elBtnAdminToggle,
    elAiMeta,
    elAiList;

  function setText(el, txt) {
    if (el) el.textContent = String(txt);
  }

  function setDebug(msg) {
    setText(elDebug, msg);
  }

  function show(el, on) {
    if (!el) return;
    el.style.display = on ? "block" : "none";
  }

  function fmtNum(n) {
    const x = Number(n);
    if (!isFinite(x)) return String(n);
    return x.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  // =========================
  // WALLET
  // =========================
  let connectedWallet = null;

  async function connectWallet() {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        setText(elStatus, "Phantom not found ❌");
        return;
      }
      setText(elStatus, "Connecting...");
      const res = await window.solana.connect();
      connectedWallet = res?.publicKey?.toString?.() || null;

      setText(elStatus, connectedWallet ? "Connected ✅" : "Not connected ❌");
      setText(elWallet, connectedWallet || "");
      setDebug(`Loader ✅ | wallet ${connectedWallet ? "✅" : "❌"} | picks ✅`);

      await refreshVipForWallet(connectedWallet);
    } catch (e) {
      console.log(e);
      setText(elStatus, "Connect failed ❌");
      setDebug(`Connect error ❌`);
    }
  }

  async function disconnectWallet() {
    try {
      await window.solana?.disconnect?.();
    } catch {}
    connectedWallet = null;
    setText(elStatus, "Disconnected");
    setText(elWallet, "");
    setText(elBal, "0");
    showVip(false);
  }

  // =========================
  // SOLANA TOKEN BALANCE
  // =========================
  async function getTokenBalance(owner, mint) {
    // Uses getTokenAccountsByOwner and parses SPL token amount
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        owner,
        { mint },
        { encoding: "jsonParsed" }
      ]
    };

    const r = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const j = await r.json();
    const accounts = j?.result?.value || [];
    let total = 0;

    for (const acc of accounts) {
      const amt =
        acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ??
        0;
      total += Number(amt) || 0;
    }
    return total;
  }

  function showVip(unlocked) {
    // locked view shows when NOT unlocked
    show(elVipLocked, !unlocked);
    show(elVipContent, unlocked);
  }

  function setVipProgress(balance) {
    const pct = Math.max(0, Math.min(100, (balance / REQUIRED_SWAMP) * 100));
    if (elVipBar) elVipBar.style.width = `${pct}%`;
    setText(elVipText, `VIP Progress: ${pct.toFixed(1)}%`);
  }

  async function refreshVipForWallet(wallet) {
    try {
      if (!wallet) {
        setText(elBal, "0");
        setVipProgress(0);
        showVip(false);
        return;
      }

      const bal = await getTokenBalance(wallet, SWAMP_MINT);
      setText(elBal, fmtNum(bal));
      setVipProgress(bal);

      const unlocked = bal >= REQUIRED_SWAMP;
      showVip(unlocked);

      // Load VIP picks list regardless (you can show them only if unlocked)
      await loadVipPicks(unlocked);
    } catch (e) {
      console.log(e);
      setDebug("Balance check error ❌");
      setText(elBal, "0");
      setVipProgress(0);
      showVip(false);
    }
  }

  // =========================
  // VIP PICKS (read)
  // =========================
  async function loadVipPicks(unlocked) {
    try {
      const res = await fetch(VIP_PICKS_URL, { cache: "no-store" });
      const data = await res.json();

      const picks = Array.isArray(data?.picks) ? data.picks : [];
      if (elVipList) elVipList.innerHTML = "";

      for (const p of picks) {
        const li = document.createElement("li");
        li.textContent = p;
        if (elVipList) elVipList.appendChild(li);
      }

      setDebug(`VIP picks loaded ✅ (${picks.length})`);

      // If locked, you can still keep VIP list hidden by showVip(false)
      if (!unlocked) showVip(false);
    } catch (e) {
      console.log(e);
      setDebug("VIP picks load failed ❌");
    }
  }

  // =========================
  // AI PICKS (read)
  // =========================
  function renderAiPicks(payload) {
    if (!elAiList) return;
    elAiList.innerHTML = "";

    const updated = payload?.generatedAt ? new Date(payload.generatedAt) : null;
    setText(
      elAiMeta,
      updated ? `Updated: ${updated.toLocaleString()}` : "Updated: —"
    );

    const picks = Array.isArray(payload?.picks) ? payload.picks : [];
    for (const p of picks) {
      const li = document.createElement("li");
      const title = document.createElement("div");
      title.style.fontWeight = "700";
      title.textContent = p?.title || "Pick";

      const reason = document.createElement("div");
      reason.style.opacity = "0.9";
      reason.style.marginTop = "6px";
      reason.textContent = p?.reason || "";

      const conf = document.createElement("div");
      conf.style.marginTop = "6px";
      conf.textContent =
        p?.confidence != null ? `Confidence: ${Math.round(p.confidence * 100)}%` : "";

      li.appendChild(title);
      li.appendChild(reason);
      li.appendChild(conf);
      elAiList.appendChild(li);
    }
  }

  async function loadAiPicks() {
    try {
      const res = await fetch(AI_PICKS_URL, { cache: "no-store" });
      const data = await res.json();
      if (data?.ok === false) throw new Error(data?.message || "AI picks failed");
      renderAiPicks(data);
    } catch (e) {
      console.log(e);
      setText(elAiMeta, "AI picks failed to load");
    }
  }

  // =========================
  // ADMIN (toggle + publish VIP)
  // =========================
  function toggleAdmin() {
    if (!elAdminPanel) return;
    const showing = elAdminPanel.style.display !== "none";
    show(elAdminPanel, !showing);
  }

  async function publishVipPicks() {
    try {
      const pin = (elAdminPin?.value || "").trim();
      const text = (elAdminPicks?.value || "").trim();

      if (!pin) {
        setText(elAdminStatus, "Enter PIN");
        return;
      }
      if (!text) {
        setText(elAdminStatus, "Enter picks");
        return;
      }

      const picks = text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      setText(elAdminStatus, "Publishing...");

      const res = await fetch(PUBLISH_VIP_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin, picks }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      setText(elAdminStatus, "Published ✅");
      // Reload VIP picks after publish
      await loadVipPicks(true);
    } catch (e) {
      console.log(e);
      setText(elAdminStatus, `Publish failed ❌ (${e.message})`);
    }
  }

  // =========================
  // BOOTSTRAP
  // =========================
  function bindEls() {
    elStatus = $("statusText");
    elWallet = $("walletText");
    elBal = $("swampBal");
    elDebug = $("debugText") || $("debug"); // fallback just in case

    elVipLocked = $("vipLocked");
    elVipContent = $("vipContent");
    elVipList = $("vipPicksList");
    elFreeList = $("freePicksList");

    elVipBar = $("vipProgressBar");
    elVipText = $("vipProgressText");

    elAdminPanel = $("adminPanel");
    elAdminPin = $("adminPin");
    elAdminPicks = $("adminPicks");
    elBtnPublish = $("btnPublish");
    elAdminStatus = $("adminStatus");
    elBtnAdminToggle = $("btnAdminToggle");

    elAiMeta = $("aiPicksMeta");
    elAiList = $("aiPicksList");

    // Default admin hidden
    show(elAdminPanel, false);

    // Buttons
    const btnConnect = $("btnConnect");
    const btnDisconnect = $("btnDisconnect");
    if (btnConnect) btnConnect.addEventListener("click", connectWallet);
    if (btnDisconnect) btnDisconnect.addEventListener("click", disconnectWallet);

    if (elBtnPublish) elBtnPublish.addEventListener("click", publishVipPicks);
    if (elBtnAdminToggle) elBtnAdminToggle.addEventListener("click", toggleAdmin);

    // Mark file loaded
    window.__PICKS_V1_LOADED__ = true;
    setDebug("Loader ✅ | wallet ❌ | picks ✅");
  }

  async function init() {
    bindEls();

    // Try auto-connect if Phantom already connected
    try {
      if (window.solana?.isPhantom) {
        const resp = await window.solana.connect({ onlyIfTrusted: true }).catch(() => null);
        const addr = resp?.publicKey?.toString?.() || null;
        if (addr) {
          connectedWallet = addr;
          setText(elStatus, "Connected ✅");
          setText(elWallet, addr);
          await refreshVipForWallet(addr);
        }
      }
    } catch {}

    // Load AI picks now + refresh every 60s
    await loadAiPicks();
    setInterval(loadAiPicks, 60_000);

    // Refresh VIP/balance every 25s if connected
    setInterval(() => {
      if (connectedWallet) refreshVipForWallet(connectedWallet);
    }, 25_000);
  }

  window.addEventListener("DOMContentLoaded", init);
})();
