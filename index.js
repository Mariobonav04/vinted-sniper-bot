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

  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) {
    console.log("Canale non trovato");
    return;
  }

  for (const product of products) {
    try {
      const url = `https://www.vinted.it/catalog?search_text=${encodeURIComponent(product.name)}`;

      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const $ = cheerio.load(data);

      $('a[href*="/items/"]').each((_, el) => {
        const relativeLink = $(el).attr('href');
        if (!relativeLink) return;

        const link = "https://www.vinted.it" + relativeLink;

        if (sentItems.has(link)) return;

        const parent = $(el).closest('div');
        const priceText = parent.text().match(/(\d+,\d+|\d+)\s?€/);

        if (!priceText) return;

        const price = parseFloat(priceText[0].replace('€', '').replace(',', '.'));

        if (price <= product.maxPrice) {
          sentItems.add(link);

          channel.send(
            `🚨 POSSIBILE AFFARE!\n` +
            `Prodotto: ${product.name}\n` +
            `Prezzo: ${price}€\n` +
            `Link: ${link}`
          );
        }
      });

    } catch (err) {
      console.log("Errore:", err.message);
    }
  }
}

client.once('ready', () => {
  console.log(`Bot online come ${client.user.tag}`);
  setInterval(checkVinted, 120000);
});

client.login(TOKEN);
