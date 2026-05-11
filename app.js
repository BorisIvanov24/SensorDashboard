const channelID = "3378399";

async function loadData() {
  const url = `https://api.thingspeak.com/channels/${channelID}/feeds/last.json`;

  const res = await fetch(url);
  const data = await res.json();

  document.getElementById("temp").innerHTML = data.field1 + " °C";
  document.getElementById("hum").innerHTML = data.field2 + " %";
}

loadData();
setInterval(loadData, 15000);