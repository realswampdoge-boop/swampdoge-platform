async function connectWallet() {
  if (!window.solana) {
    alert("Install Phantom Wallet");
    return;
  }

  const resp = await window.solana.connect();
  document.getElementById("wallet").innerText =
    "Connected: " + resp.publicKey.toString();
}
