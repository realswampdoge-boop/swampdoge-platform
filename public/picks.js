document.addEventListener("DOMContentLoaded", async () => {
  const freeEl = document.getElementById("freePicksList");
  const vipEl  = document.getElementById("vipPicksList");

  if (!freeEl || !vipEl) {
    console.log("Missing freePicksList / vipPicksList elements in HTML");
    return;
  }

  try {
    const res = await fetch("./picks.json", { cache: "no-store" });
    const data = await res.json();

    freeEl.innerHTML = (data.free || []).map(p => `<li>${p.league}: ${p.pick}</li>`).join("");
    vipEl.innerHTML  = (data.vip  || []).map(p => `<li>${p.league}: ${p.pick}</li>`).join("");
  } catch (e) {
    console.error(e);
    freeEl.innerHTML = "<li>Could not load picks.json</li>";
  }
});
