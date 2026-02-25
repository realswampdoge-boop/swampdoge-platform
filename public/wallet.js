const connectBtn = document.getElementById("connectWallet");
const walletText = document.getElementById("walletAddress");

async function connectWallet() {
  try {
    const provider = window.phantom?.solana;

    if (!provider || !provider.isPhantom) {
      alert("Install Phantom Wallet");
      window.open("https://phantom.app/", "_blank");
      return;
    }

    const resp = await provider.connect();

    walletText.innerText =
      "Connected: " + resp.publicKey.toString();
  } catch (err) {
    console.error(err);
  }
}

connectBtn.addEventListener("click", connectWallet);
