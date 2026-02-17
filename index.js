const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function checkVinted() {
  console.log("Controllo Vinted API...");

  try {
    const url = "https://www.vinted.it/api/v2/catalog/items?search_text=funko";

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!data.items) {
      console.log("Nessun campo items trovato");
      return;
    }

    console.log("Items trovati:", data.items.length);

    const first = data.items[0];

    console.log("Primo titolo:", first.title);
    console.log("Primo prezzo:", first.price);
    console.log("Primo link:", "https://www.vinted.it/items/" + first.id);

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
