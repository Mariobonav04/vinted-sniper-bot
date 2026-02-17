const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function checkVinted() {
  console.log("Controllo Vinted API avanzato...");

  try {
    const url = "https://www.vinted.it/api/v2/catalog/items?search_text=funko";

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "it-IT,it;q=0.9",
        "Referer": "https://www.vinted.it/",
        "Origin": "https://www.vinted.it",
        "Connection": "keep-alive"
      }
    });

    if (!data.items) {
      console.log("Items non trovati");
      return;
    }

    console.log("Items trovati:", data.items.length);
    console.log("Primo titolo:", data.items[0].title);
    console.log("Primo prezzo:", data.items[0].price);
    console.log("Primo link:", "https://www.vinted.it/items/" + data.items[0].id);

  } catch (err) {
    console.log("Errore:", err.response?.status || err.message);
  }
}



// 🔥 IMPORTANTE: usare clientReady
client.once('clientReady', () => {
  console.log(`Bot online come ${client.user.tag}`);

  // Esegui subito al primo avvio
  checkVinted();

  // Poi ogni 2 minuti
  setInterval(checkVinted, 120000);
});

client.login(TOKEN);
