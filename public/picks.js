async function loadPicks() {
  const res = await fetch("/picks.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load picks.json");
  return await res.json();
}

function stars(n) {
  return "⭐".repeat(Math.max(0, Math.min(5, n || 0)));
}

function renderList(items) {
  return (items || [])
    .map(
      x => `<div class="card" style="margin-top:10px;">
        <div><b>${x.league}</b>: ${x.pick}</div>
        <div>${stars(x.rating)}</div>
      </div>`
    )
    .join("");
}

async function renderFreePicks() {
  try {
    const data = await loadPicks();
    const el = document.getElementById("todaysPicks");
    if (el) el.innerHTML = renderList(data.free);
  } catch (e) {
    console.error(e);
  }
}

window.renderVipPicks = async function () {
  try {
    const data = await loadPicks();
    const el = document.getElementById("vipPicks");
    if (el) el.innerHTML = renderList(data.vip);
  } catch (e) {
    console.error(e);
  }
};

document.addEventListener("DOMContentLoaded", renderFreePicks);
