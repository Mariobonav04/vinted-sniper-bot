const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const products = [
  {
    name: "funko venom 888",
    maxPrice: 20
  }
];

const sentItems = new Set();

async function checkVinted() {
  console.log("Sto controllando Vinted...");

  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) {
    console.log("Canale non trovato!");
    return;
  }

  try {
    const testUrl = "https://www.vinted.it/catalog?search_text=funko";

    const { data } = await axios.get(testUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    console.log("Pagina ricevuta!");

    channel.send("✅ BOT ATTIVO - Pagina Vinted letta correttamente!");

  } catch (err) {
    console.log("Errore Vinted:", err.message);
  }
}

client.once('ready', () => {
  console.log(`Bot online come ${client.user.tag}`);
  setInterval(checkVinted, 120000);
});

client.login(TOKEN);
