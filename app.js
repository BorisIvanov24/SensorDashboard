const channelID = "3378399";

let chart;

async function loadData() {

  // 🟢 LAST DATA
  const lastURL = `https://api.thingspeak.com/channels/${channelID}/feeds/last.json`;
  const lastRes = await fetch(lastURL);
  const last = await lastRes.json();

  document.getElementById("temp").innerHTML = last.field1 + " °C";
  document.getElementById("hum").innerHTML = last.field2 + " %";

  // 📊 HISTORICAL DATA
  const historyURL = `https://api.thingspeak.com/channels/${channelID}/feeds.json?results=20`;
  const histRes = await fetch(historyURL);
  const hist = await histRes.json();

  const labels = hist.feeds.map(f => f.created_at.slice(11,19));
  const temps = hist.feeds.map(f => Number(f.field1));

  // 📈 CHART
  if (!chart) {
    const ctx = document.getElementById('chart');

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Temperature °C',
          data: temps,
          borderColor: '#00ffcc',
          fill: false
        }]
      }
    });

  } else {
    chart.data.labels = labels;
    chart.data.datasets[0].data = temps;
    chart.update();
  }
}

loadData();
setInterval(loadData, 15000);