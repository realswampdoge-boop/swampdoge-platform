(function () {
  const statusEl = document.getElementById("status");
  const addrEl = document.getElementById("addr");
  const btnConnect = document.getElementById("btnConnect");
  const btnDisconnect = document.getElementById("btnDisconnect");

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = kind || "";
  }

  function setAddr(text) {
    addrEl.textContent = text;
  }

  function getProvider() {
    const p = window.solana;
    if (p && p.isPhantom) return p;
    return null;
  }

  async function connect() {
    try {
      setStatus("Connecting...", "");
      const provider = getProvider();

      if (!provider) {
        setStatus("Phantom not found", "bad");
        alert("Phantom Wallet not found.\n\nInstall Phantom, then open this site INSIDE Phantom browser.");
        // Optional: send them to Phantom website
        window.open("https://phantom.app/", "_blank");
        return;
      }

      const resp = await provider.connect(); // triggers Phantom popup
      const pubkey = resp.publicKey.toString();

      setAddr(pubkey);
      setStatus("Connected ✅", "ok");
    } catch (e) {
      console.error(e);
      setStatus("Connection failed", "bad");
    }
  }

  async function disconnect() {
    try {
      const provider = getProvider();
      if (provider?.disconnect) await provider.disconnect();
    } catch (e) {
      console.error(e);
    }
    setAddr("Not connected");
    setStatus("Disconnected", "");
  }

  // Make sure taps work
  btnConnect.addEventListener("click", connect);
  btnDisconnect.addEventListener("click", disconnect);

  setStatus("Ready", "");
})();
