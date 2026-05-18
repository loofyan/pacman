import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173');

// Wait a bit for the page to fully load and render
await page.waitForTimeout(1000);

await page.screenshot({ path: 'start-screen.png', fullPage: false });

console.log('Screenshot saved to start-screen.png');

await browser.close();
