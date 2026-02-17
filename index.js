const { Client, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer');

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const products = [
  {
    name: "funko",
    maxPrice: 120
  }
];

const sentItems = new Set();

async function checkVinted() {
  console.log("Avvio browser...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  // Blocca immagini e css per alleggerire
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

  for (const product of products) {

    const url = `https://www.vinted.it/catalog?search_text=${encodeURIComponent(product.name)}`;

    console.log("Carico:", url);

    await page.goto(url, { waitUntil: 'networkidle2' });


    const items = await page.evaluate(() => {
  const results = [];

  const cards = document.querySelectorAll('[data-testid="grid-item"]');

  cards.forEach(card => {
    const linkElement = card.querySelector('a[href*="/items/"]');
    if (!linkElement) return;

    const link = linkElement.href;

    // Il prezzo spesso è il primo testo con €
    const text = card.innerText;
    const priceMatch = text.match(/(\d+,\d+|\d+)\s?€/);

    if (!priceMatch) return;

    const price = parseFloat(priceMatch[0].replace('€', '').replace(',', '.'));

    results.push({ link, price });
  });

  return results;
});



    console.log("Links trovati:", items.length);


    const channel = await client.channels.fetch(CHANNEL_ID);

    for (const item of items) {
      if (!sentItems.has(item.link) && item.price <= product.maxPrice) {

        sentItems.add(item.link);

        await channel.send(
          `🚨 POSSIBILE AFFARE!\n` +
          `Prodotto: ${product.name}\n` +
          `Prezzo: ${item.price}€\n` +
          `Link: ${item.link}`
        );
      }
    }
  }

  await browser.close();
}

client.once('clientReady', async () => {
  console.log(`Bot online come ${client.user.tag}`);

  await checkVinted();
  setInterval(checkVinted, 120000);
});

client.login(TOKEN);
