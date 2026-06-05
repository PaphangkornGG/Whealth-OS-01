const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:8080/index.html', {waitUntil: 'networkidle0'});

  // Wait for React to render something specific
  try {
    await page.waitForSelector('#root > div', { timeout: 5000 });
    const content = await page.evaluate(() => document.body.innerText);
    console.log("App rendered! Text snippet:", content.substring(0, 100).replace(/\n/g, ' '));
  } catch (e) {
    console.log("App did NOT render! Screen is blank.");
  }
  
  await browser.close();
  process.exit(0);
})();
