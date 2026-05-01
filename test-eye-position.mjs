import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3461', {waitUntil: 'networkidle'});
  await page.waitForTimeout(2000);

    // Sample pixel data for each direction
  const results = { RIGHT: {}, LEFT: {}, UP: {}, DOWN: {} };

  for (const dir of ['RIGHT', 'LEFT', 'UP', 'DOWN']) {
    const dirVec = dir === 'RIGHT' ? {x:1,y:0} : dir === 'LEFT' ? {x:-1,y:0} : dir === 'UP' ? {x:0,y:-1} : {x:0,y:1};
    
     // Directly set the player direction and force a render
    // We need to find the Game instance in the Vite ES module
    const dirResult = await page.evaluate((d) => {
       // Find Game instance by searching all global objects
       // Vite ES modules: try to find via importmap or global registry
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      
       // Try: find the game instance via its canvas reference
       // The game is created as: const game = new Game(canvas, 24);
       // Game stores canvas as this.canvas
       // We can search for it by looking at all objects referencing this canvas
       // Alternative: just patch the Game class prototype
       // Let's try a simpler approach - find Game via its render method on canvas
      
       // The simplest approach: look at Vite's module cache
       // Vite might store modules in a global object like __vite__ or __vite__moduleGraph
      
       // Actually, let's just find the canvas's rendering context and inject
       // We know the player position from the game init: player = new Player(14, 20)
       // So body center is:
      const tileSize = 24;
      const col = 14;
      const row = 20;
      const bodyX = col * tileSize + tileSize / 2;
      const bodyY = (row + 1) * tileSize + tileSize / 2;
      const r = tileSize * 0.42;
      const body = canvas.getContext('2d');

       // Draw the game at this position by modifying player state via brute force
       // Actually, this won't work because we can't access the Game instance
      
       // Alternative: look at all properties of window
       const allKeys = Object.keys(window).filter(k => !k.startsWith('__'));
       let game = null;
       for (const k of allKeys) {
        try {
          if (window[k] && window[k].player && window[k].render) {
            game = window[k];
            break;
          }
         } catch(e) {}
       }
      
       // Try to find in ES module namespace  
       // Vite might not expose the module globally
       // Let's try accessing globalThis
       for (const k of Object.keys(globalThis)) {
        try {
          if (globalThis[k] && globalThis[k].player && globalThis[k].render) {
            game = globalThis[k];
            break;
          }
         } catch(e) {}
       }
      
      if (!game) {
        return { error: 'Cannot find game instance', keys: allKeys.slice(0, 20) };
       }
      
       // Set player direction and position
      game.player.col = col;
      game.player.row = row;
      game.player.dir = { x: d.x, y: d.y };
      game.player.mouthOpen = 0.5;
      game.render();

       // Now extract pixel data around the body center
      const ctx = body;
      const startX = Math.max(0, Math.floor(bodyX - r * 2));
      const startY = Math.max(0, Math.floor(bodyY - r * 2));
      const size = Math.ceil(r * 2) + 20;
      const region = ctx.getImageData(startX, startY, size, size);

       // Find the eye (black pixel)
      const eyePixels = [];
      for (let y = 0; y < region.height; y++) {
        for (let x = 0; x < region.width; x++) {
          const idx = (y * region.width + x) * 4;
          const pr = region.data[idx];
          const pg = region.data[idx + 1];
          const pb = region.data[idx + 2];
          const pa = region.data[idx + 3];
            // Eye is black: (0,0,0) with full alpha
          if (pr < 20 && pg < 20 && pb < 20 && pa === 255) {
            eyePixels.push({ 
              screenX: startX + x, 
              screenY: startY + y 
           });
          }
         }
       }
      
      return {
        bodyCenter: { x: bodyX, y: bodyY },
        eyePixels,
       };
     }, dirVec);
    
    results[dir] = dirResult;
    console.log(`Direction ${dir}:`, JSON.stringify(dirResult));
    }
  
    // Check if eye positions are the same for all directions
  const eyePositions = Object.entries(results).map(([dir, result]) => {
    if (!result || result.error) return null;
    const avgEyeX = result.eyePixels.reduce((s: number, p: any) => s + p.screenX, 0) / (result.eyePixels.length || 1);
    const avgEyeY = result.eyePixels.reduce((s: number, p: any) => s + p.screenY, 0) / (result.eyePixels.length || 1);
    return { dir, eyeX: avgEyeX, eyeY: avgEyeY };
    }).filter(Boolean);
  
  console.log('\n=== Eye Positions ===');
  console.log(JSON.stringify(eyePositions, null, 2));
  
  if (eyePositions.length === 4) {
    const ref = eyePositions[0];
    const consistent = eyePositions.every(ep => Math.abs(ep.eyeX - ref.eyeX) < 2 && Math.abs(ep.eyeY - ref.eyeY) < 2);
    console.log(`\nAll directions consistent: ${consistent}`);
    if (!consistent) {
      console.log('INCONSISTENCY DETECTED!');
      eyePositions.forEach(ep => {
        console.log(`${ep.dir}: (${ep.eyeX}, ${ep.eyeY}) vs REF (${ref.eyeX}, ${ref.eyeY})`);
       });
     }
   }
  
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
