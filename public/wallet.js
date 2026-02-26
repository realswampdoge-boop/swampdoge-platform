const SWAMP_MINT =
"GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

const MIN_SWAMP_TO_UNLOCK = 1000000;
const TOKEN_MINT =
"GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

const statusEl = document.getElementById("statusText");
const walletEl = document.getElementById("walletText");

function setStatus(msg){
  if(statusEl) statusEl.innerText = msg;
}

function setWallet(addr){
  if(walletEl) walletEl.innerText = addr || "Not connected";
}

async function connectWallet(){

  const provider = window.solana;

  if(!provider || !provider.isPhantom){
    alert("Install Phantom Wallet");
    window.open("https://phantom.app/");
    return;
  }

  try{
    setStatus("Connecting...");
    const resp = await provider.connect();
    const pubkey = resp.publicKey.toString();

    setWallet(pubkey);
    setStatus("Checking $SWAMP balance...");

    await checkSwamp(pubkey);

  }catch(err){
    console.log(err);
    setStatus("Connection failed");
  }
}

async function checkSwamp(wallet){

  const rpc = "https://api.mainnet-beta.solana.com";

  const body = {
    jsonrpc:"2.0",
    id:1,
    method:"getTokenAccountsByOwner",
    params:[
      wallet,
      { mint:TOKEN_MINT },
      { encoding:"jsonParsed" }
    ]
  };

  const res = await fetch(rpc,{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body:JSON.stringify(body)
  });

  const data = await res.json();

  if(
    data.result.value.length > 0 &&
    data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount > 0
  ){
      unlockVIP();
  } else {
      lockVIP();
  }
}

function unlockVIP(){
  setStatus("✅ VIP Unlocked");
  const vip=document.getElementById("vipContent");
  const locked=document.getElementById("vipLocked");
  if(vip) vip.style.display="block";
  if(locked) locked.style.display="none";
}

function lockVIP(){
  setStatus("🔒 Hold $SWAMP to unlock");
}

document.getElementById("btnConnect")
?.addEventListener("click",connectWallet);
async function checkSwampBalance(wallet) {
  try {
    setStatus("Checking $SWAMP balance...");

    const connection =
      new solanaWeb3.Connection(
        "https://api.mainnet-beta.solana.com"
      );

    const tokenAccounts =
      await connection.getParsedTokenAccountsByOwner(
        new solanaWeb3.PublicKey(wallet),
        { programId: new solanaWeb3.PublicKey(
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        )}
      );

    let balance = 0;

    tokenAccounts.value.forEach(acc => {
      const info = acc.account.data.parsed.info;
      if (info.mint === SWAMP_MINT) {
        balance = info.tokenAmount.uiAmount;
      }
    });

    if (balance >= MIN_SWAMP_TO_UNLOCK) {
      setStatus("VIP Unlocked ✅");
      document.querySelector("#vipPicksList")
        .style.display = "block";
    } else {
      setStatus(
        `Need ${MIN_SWAMP_TO_UNLOCK} $SWAMP`
      );
      document.querySelector("#vipPicksList")
        .style.display = "none";
    }

  } catch (err) {
    console.error(err);
    setStatus("Balance check failed");
  }
}
