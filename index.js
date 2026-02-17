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

    console.log("Lunghezza HTML:", data.length);

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) {
      await channel.send("🔎 Test Vinted completato. Controlla i log su Railway.");
    }

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
