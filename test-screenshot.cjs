const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Collect console logs
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
  
  await page.goto('http://localhost:3461', {waitUntil: 'networkidle'});
  await page.waitForTimeout(1000);
  
  // Inject helper to find the game instance
  await page.evaluate(() => {
    // Try to find Game instances in the module system
    // The game is created in main.ts as: const game = new Game(canvas, 24);
    // But it's module-scoped, so we need to find it differently
    // One way: look at ES module exports or global state
    // Vite might expose modules via __vite__ or similar
    
    // Fallback: directly patch Game class to expose the instance
    window.gameRef = null;
  });
  
  // Try to find the game through its module
  const result = await page.evaluate(() => {
    // Vite bundles with ES modules
    // Try to find all objects that look like a Game instance
    const keys = Object.keys(window);
    for (const key of keys) {
      try {
        const obj = window[key];
        if (obj && typeof obj === 'object') {
          if (obj.constructor && obj.constructor.name === 'Game') {
            return { found: true, key };
          }
        }
      } catch(e) {}
    }
    
    // Try looking in the Vite module registry
    if (typeof __vite__ !== 'undefined') {
      for (const key of Object.keys(__vite__)) {
        try {
          const obj = __vite__[key];
          if (obj && typeof obj === 'object') {
            if (obj.player) return { found: true, viteKey: key, obj: true };
          }
        } catch(e) {}
      }
    }
    
    return { found: false };
  });
  
  console.log('Game instance:', result);
  
  // Alternative: use the canvas directly to extract pixel data
  for (const dir of ['RIGHT', 'LEFT', 'UP', 'DOWN']) {
    const dirVec = dir === 'RIGHT' ? {x:1,y:0} : dir === 'LEFT' ? {x:-1,y:0} : dir === 'UP' ? {x:0,y:-1} : {x:0,y:1};
    
    // Try setting direction via keyboard simulation
    // This way the game processes it normally
    const keyMap = { RIGHT: 'ArrowRight', LEFT: 'ArrowLeft', UP: 'ArrowUp', DOWN: 'ArrowDown' };
    
    // Press the Enter key first to start the game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Press the direction key
    await page.keyboard.press(keyMap[dir]);
    await page.waitForTimeout(300);
    
    // Take screenshot
    await page.screenshot({path: `screenshot_${dir}.png`});
    console.log('Saved screenshot_' + dir + '.png');
  }
  
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
