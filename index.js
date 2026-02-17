const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function checkVinted() {
  console.log("Controllo Vinted...");

  try {
    const url = "https://www.vinted.it/catalog?search_text=funko";

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const jsonMatch = data.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\});/s);

    if (!jsonMatch) {
      console.log("JSON non trovato");
      return;
    }

    const jsonData = JSON.parse(jsonMatch[1]);

    console.log("JSON trovato!");

    const items = jsonData.catalog?.items || [];

    console.log("Numero items trovati:", items.length);

  } catch (err) {
    console.log("Errore:", err.message);
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
