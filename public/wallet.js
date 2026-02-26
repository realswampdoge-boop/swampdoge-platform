// public/wallet.js
(() => {
  const $ = (id) => document.getElementById(id);

  function setStatus(msg, ok = false) {
    const el = $("statusText");
    if (el) el.textContent = msg;
    const card = document.querySelector(".card");
    if (card) {
      card.classList.toggle("ok", ok);
      card.classList.toggle("bad", !ok);
    }
    console.log("[wallet]", msg);
  }

  function setWallet(addr = "") {
    const el = $("walletText");
    if (el) el.textContent = addr || "Not connected";
  }

  function getProvider() {
    const any = window.solana;
    if (any && any.isPhantom) return any;
    return null;
  }

  function openInPhantom() {
    // Opens current site inside Phantom’s in-app browser (required on iPhone Safari/Chrome)
    const url = window.location.href;
    const deepLink = "https://phantom.app/ul/browse/" + encodeURIComponent(url);
    window.location.href = deepLink;
  }

  async function connect() {
    try {
      setStatus("Connecting…");
      const provider = getProvider();

      if (!provider) {
        setStatus("Phantom not detected. Opening in Phantom…");
        openInPhantom();
        return;
      }

      const resp = await provider.connect({ onlyIfTrusted: false });
      const pubkey = resp?.publicKey?.toString?.() || provider.publicKey?.toString?.();
      if (!pubkey) throw new Error("No publicKey returned");

      setWallet(pubkey);
      setStatus("Connected ✅", true);
    } catch (e) {
      console.error(e);
      setStatus("Connection failed ❌ (check console)", false);
    }
  }

  async function disconnect() {
    try {
      const provider = getProvider();
      if (provider?.disconnect) await provider.disconnect();
      setWallet("");
      setStatus("Disconnected", true);
    } catch (e) {
      console.error(e);
      setStatus("Disconnect failed ❌", false);
    }
  }

  function bind() {
    const btnConnect = $("btnConnect");
    const btnDisconnect = $("btnDisconnect");

    if (!btnConnect || !btnDisconnect) {
      setStatus("Buttons not found (check IDs in index.html)", false);
      return;
    }

    // Make iPhone taps 100% register
    btnConnect.style.pointerEvents = "auto";
    btnDisconnect.style.pointerEvents = "auto";

    btnConnect.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); connect(); }, { passive: false });
    btnDisconnect.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); disconnect(); }, { passive: false });

    // Extra insurance for iOS
    btnConnect.addEventListener("touchstart", (e) => { e.preventDefault(); connect(); }, { passive: false });
    btnDisconnect.addEventListener("touchstart", (e) => { e.preventDefault(); disconnect(); }, { passive: false });

    setWallet("");
    setStatus("Ready", true);
  }

  // Run after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
