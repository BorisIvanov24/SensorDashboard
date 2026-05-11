const channelID = "3378399";

let chart;
let lastTimestamp = null;

// Format "преди X минути / секунди / часа"
function timeAgo(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);

  if (diffSec < 10)  return "току що";
  if (diffSec < 60)  return `преди ${diffSec} сек`;
  if (diffMin < 60)  return `преди ${diffMin} мин`;
  return `преди ${diffHr} ч`;
}

// Tick the "ago" label every second without re-fetching
function tickAgo() {
  if (lastTimestamp) {
    document.getElementById("temp-ago").textContent = timeAgo(lastTimestamp);
    document.getElementById("hum-ago").textContent  = timeAgo(lastTimestamp);
  }
}
setInterval(tickAgo, 5000);

async function loadData() {
  try {
    // ── LAST VALUE ──────────────────────────────────────────
    const lastURL = `https://api.thingspeak.com/channels/${channelID}/feeds/last.json`;
    const lastRes = await fetch(lastURL);
    const last    = await lastRes.json();

    lastTimestamp = last.created_at;

    document.getElementById("temp").textContent = last.field1 ?? "--";
    document.getElementById("hum").textContent  = last.field2 ?? "--";
    tickAgo();

    // ── ALL HISTORICAL DATA (up to 8000 records) ─────────────
    const historyURL = `https://api.thingspeak.com/channels/${channelID}/feeds.json?results=8000`;
    const histRes    = await fetch(historyURL);
    const hist       = await histRes.json();

    const feeds  = hist.feeds ?? [];
    const labels = feeds.map(f => {
      const d = new Date(f.created_at);
      return d.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit" })
           + " " + d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
    });
    const temps = feeds.map(f => f.field1 !== null ? Number(f.field1) : null);
    const hums  = feeds.map(f => f.field2 !== null ? Number(f.field2) : null);

    // ── CHART ─────────────────────────────────────────────────
    if (!chart) {
      const ctx = document.getElementById("chart").getContext("2d");

      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Температура °C",
              data: temps,
              borderColor: "#ff6b35",
              backgroundColor: "rgba(255,107,53,0.08)",
              borderWidth: 1.5,
              pointRadius: 0,
              pointHoverRadius: 4,
              tension: 0.3,
              fill: true,
              yAxisID: "yTemp",
            },
            {
              label: "Влажност %",
              data: hums,
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56,189,248,0.07)",
              borderWidth: 1.5,
              pointRadius: 0,
              pointHoverRadius: 4,
              tension: 0.3,
              fill: true,
              yAxisID: "yHum",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              labels: {
                color: "#94a3b8",
                font: { family: "'Space Mono', monospace", size: 11 },
                boxWidth: 12,
                padding: 20,
              },
            },
            tooltip: {
              backgroundColor: "#0e1420",
              borderColor: "#1e2a3a",
              borderWidth: 1,
              titleColor: "#e2e8f0",
              bodyColor: "#94a3b8",
              titleFont: { family: "'Space Mono', monospace", size: 11 },
              bodyFont:  { family: "'Space Mono', monospace", size: 11 },
              padding: 12,
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#4a5568",
                font: { family: "'Space Mono', monospace", size: 9 },
                maxTicksLimit: 10,
                maxRotation: 30,
              },
              grid: { color: "#1e2a3a" },
            },
            yTemp: {
              position: "left",
              ticks: {
                color: "#ff6b35",
                font: { family: "'Space Mono', monospace", size: 10 },
                callback: v => v + " °C",
              },
              grid: { color: "#1e2a3a" },
            },
            yHum: {
              position: "right",
              ticks: {
                color: "#38bdf8",
                font: { family: "'Space Mono', monospace", size: 10 },
                callback: v => v + " %",
              },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });

    } else {
      chart.data.labels = labels;
      chart.data.datasets[0].data = temps;
      chart.data.datasets[1].data = hums;
      chart.update("none");
    }

  } catch (err) {
    console.error("Грешка при зареждане:", err);
  }
}

loadData();
setInterval(loadData, 30000); // refresh every 30 s
