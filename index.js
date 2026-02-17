const { Client, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer');
const fs = require('fs');

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let browser;
let page;
const sentItems = new Set();
const DATA_FILE = './searches.json';

// =====================
// File utils
// =====================

function loadSearches() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveSearches(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// =====================
// Puppeteer init
// =====================

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

// =====================
// Scraper con filtro 24h
// =====================

async function checkVinted() {
  const searches = loadSearches();

  console.log("Ricerche caricate:", searches);

  for (const search of searches) {

    const url = `https://www.vinted.it/catalog?search_text=${encodeURIComponent(search.query)}`;

    console.log("Cerco:", search.query);

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

    console.log("Prodotti trovati:", items.length);

    const channel = await client.channels.fetch(search.channelId);

    if (!channel) {
      console.log("Canale non trovato!");
      continue;
    }

    // 🔥 TEST: manda SOLO il primo prodotto trovato
    if (items.length > 0) {
      const first = items[0];

      console.log("Invio test:", first.link);

      await channel.send(
        `🔥 TEST INVIO\n` +
        `Prezzo: ${first.price}€\n` +
        `Link: ${first.link}`
      );
    }
  }
}


// =====================
// Discord Commands
// =====================

client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  const args = message.content.split(" ");

  if (args[0] === "!add") {

    if (args.length < 3) {
      return message.reply("Uso: !add parola_chiave prezzo_max");
    }

    const maxPrice = parseFloat(args[args.length - 1]);
    const query = args.slice(1, -1).join(" ");

    const searches = loadSearches();

    searches.push({
      channelId: message.channel.id,
      query,
      maxPrice
    });

    saveSearches(searches);

    return message.reply(`Ricerca aggiunta: "${query}" ≤ ${maxPrice}€`);
  }

  if (args[0] === "!remove") {

    const query = args.slice(1).join(" ");
    let searches = loadSearches();

    searches = searches.filter(
      s => !(s.channelId === message.channel.id && s.query === query)
    );

    saveSearches(searches);

    return message.reply(`Ricerca rimossa: "${query}"`);
  }

  if (args[0] === "!list") {

    const searches = loadSearches()
      .filter(s => s.channelId === message.channel.id);

    if (searches.length === 0)
      return message.reply("Nessuna ricerca attiva in questo canale.");

    let reply = "Ricerche attive:\n";
    searches.forEach(s => {
      reply += `• ${s.query} ≤ ${s.maxPrice}€\n`;
    });

    return message.reply(reply);
  }
});

// =====================
// Start
// =====================

client.once('clientReady', async () => {
  console.log(`Bot online come ${client.user.tag}`);

  await initBrowser();
  await checkVinted();

  setInterval(checkVinted, 120000);
});

//client.login(TOKEN);
