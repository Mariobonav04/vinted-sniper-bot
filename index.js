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
    maxPrice: 999 // per test iniziale
  }
];

const sentItems = new Set();

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

  } catch (err) {
    console.log("Errore:", err.message);
  }
}


client.once('ready', () => {
  console.log(`Bot online come ${client.user.tag}`);
  setInterval(checkVinted, 120000);
});

client.login(TOKEN);
