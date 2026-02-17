const { Client, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer');

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const products = [
  { name: "funko venom 888", maxPrice: 20 },
  { name: "funko carnage 926", maxPrice: 18 }
];

const sentItems = new Set();

let browser;
let page;

async function initBrowser() {
  browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (
      req.resourceType() === 'image' ||
      req.resourceType() === 'stylesheet' ||
      req.resourceType() === 'font'
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
}

async function checkVinted() {
  console.log("Controllo prodotti...");

  const channel = await client.channels.fetch(CHANNEL_ID);

  for (const product of products) {
    const url = `https://www.vinted.it/catalog?search_text=${encodeURIComponent(product.name)}`;

    console.log("Cerco:", product.name);

    await page.goto(url, { waitUntil: 'networkidle2' });

    const items = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('[data-testid="grid-item"]');

      cards.forEach(card => {
        const linkElement = card.querySelector('a[href*="/items/"]');
        if (!linkElement) return;

        const link = linkElement.href;
        const text = card.innerText;
        const priceMatch = text.match(/(\d+,\d+|\d+)\s?€/);

        if (!priceMatch) return;

        const price = parseFloat(priceMatch[0].replace('€', '').replace(',', '.'));

        results.push({ link, price });
      });

      return results;
    });

    console.log(product.name, "→ trovati:", items.length);

    for (const item of items) {
      if (!sentItems.has(item.link) && item.price <= product.maxPrice) {
        sentItems.add(item.link);

        await channel.send(
          `🚨 POSSIBILE AFFARE!\n` +
          `Ricerca: ${product.name}\n` +
          `Prezzo: ${item.price}€\n` +
          `Link: ${item.link}`
        );
      }
    }
  }
}

client.once('clientReady', async () => {
  console.log(`Bot online come ${client.user.tag}`);

  await initBrowser();

  await checkVinted();
  setInterval(checkVinted, 120000);
});

client.login(TOKEN);
