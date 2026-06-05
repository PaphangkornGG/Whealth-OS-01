const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE EXCEPTION:', err.toString());
  });

  await page.goto(`file://${path.resolve(__dirname, 'Netto - Wealth OS.html')}`);
  // Wait a moment for Babel to compile
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
})();
