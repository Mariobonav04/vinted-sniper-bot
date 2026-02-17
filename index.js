import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import * as cheerio from 'cheerio';


const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = process.env.CHANNEL_ID;

// CONFIG PRODOTTI
const products = [
  {
    name: "funko venom 888",
    maxPrice: 20
  }
];

const sentItems = new Set();

async function checkVinted() {
  for (const product of products) {
    const url = `https://www.vinted.it/catalog?search_text=${encodeURIComponent(product.name)}`;

    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const $ = cheerio.load(data);

      $('.feed-grid__item').each((_, el) => {
        const link = "https://www.vinted.it" + $(el).find('a').attr('href');
        const priceText = $(el).find('.web_ui__Text__text').first().text();
        const price = parseFloat(priceText.replace('€', '').replace(',', '.'));

        if (!sentItems.has(link) && price <= product.maxPrice) {
          sentItems.add(link);

          const channel = client.channels.cache.get(CHANNEL_ID);
          if (channel) {
            channel.send(
              `🚨 POSSIBILE AFFARE!\n` +
              `Prodotto: ${product.name}\n` +
              `Prezzo: ${price}€\n` +
              `Link: ${link}`
            );
          }
        }
      });

    } catch (err) {
      console.log("Errore:", err.message);
    }
  }
}

client.once('ready', () => {
  console.log(`Bot online come ${client.user.tag}`);
  setInterval(checkVinted, 120000); // ogni 2 minuti
});

client.login(TOKEN);
