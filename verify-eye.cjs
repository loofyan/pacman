const puppeteer = require('/Users/orso/node_modules/puppeteer-core');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
      });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3461');
  await sleep(1000);
  
  const dirs = ['RIGHT', 'LEFT', 'UP', 'DOWN'];
  const results = [];
  
  for (const dirName of dirs) {
        // Stop game loop, set fixed position and direction, force render
    await page.evaluate((dirName) => {
      const game = window.game;
      if (!game) return;
      
         // Stop the game loop
      game.stop();
      
         // Set fixed player position
      game.player.col = 10.0;
      game.player.row = 10.0;
      game.player.mouthOpen = 0.5;
      game.player.dead = false;
      game.mode = 'playing';
      
         // Set direction
      const dirMap = {
        RIGHT: {x:1,y:0},
        LEFT: {x:-1,y:0},
        UP: {x:0,y:-1},
        DOWN: {x:0,y:1},
        };
      game.player.dir = dirMap[dirName];
      
        // Force render
      game.render();
    }, dirName);
    
        // Snapshot pixel data
    const pixelData = await page.evaluate((dirName) => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      
       // Player at (10, 10), tile=24
      const cx = 10 * 24 + 12;      // 252
      const cy = (10 + 1) * 24 + 12; // 276
      const r = 24 * 0.42;          // 10.08
      
      const expectedEyeX = cx + r * 0.15;     // 253.5
      const expectedEyeY = cy - r * 0.35;     // 272.5
      
          // Scan for eye pixels (black pixels adjacent to yellow body)
        const bodyLeft = Math.max(0, Math.floor(cx - r * 2.5));
      const bodyTop = Math.max(0, Math.floor(cy - r * 2.5));
      const bodySize = Math.ceil(r * 5);
      
       const imageData = ctx.getImageData(bodyLeft, bodyTop, bodySize, bodySize);
      
         // Find the eye centroid
      const eyePixels = [];
      for (let py = 1; py < bodySize - 1; py++) {
        for (let px = 1; px < bodySize - 1; px++) {
          const i = (py * bodySize + px) * 4;
          const rr = imageData.data[i], gg = imageData.data[i+1], bb = imageData.data[i+2];
          
             // Pixel is basically black
          if (rr < 30 && gg < 30 && bb < 30) {
                // Check if surrounded by yellow
              let yellowCount = 0;
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  const ni = ((py+dy) * bodySize + (px+dx)) * 4;
                  if (imageData.data[ni] > 150 && imageData.data[ni+1] > 150) {
                    yellowCount++;
                      }
                    }
                  }
               if (yellowCount >= 3) {
                eyePixels.push({ x: bodyLeft + px, y: bodyTop + py });
                }
             }
            }
          }
      
           // Compute centroid
      let avgX = 0, avgY = 0;
      for (const p of eyePixels) { avgX += p.x; avgY += p.y; }
      if (eyePixels.length > 0) { avgX /= eyePixels.length; avgY /= eyePixels.length; }
      
        // Also: draw ASCII grid around the body to show the pattern
      const grid = [];
      const gridLeft = bodyLeft;
      const gridTop = bodyTop;
      const gridW = Math.min(bodySize, 26);
      const gridH = Math.min(bodySize, 26);
      for (let py = 0; py < gridH; py++) {
        const row = [];
        for (let px = 0; px < gridW; px++) {
          const i = (py * bodySize + px) * 4;
          const rr = imageData.data[i], gg = imageData.data[i+1], bb = imageData.data[i+2];
          if (rr < 50 && gg < 50 && bb < 50) row.push('█');
          else if (rr > 200 && gg > 150) row.push('◙');       // Yellow Pacman body
          else if (rr > 100 && gg > 100) row.push('░');    // Other colored
          else row.push(' ');
            }
        grid.push(row.join(''));
          }
      
        // Find mouth region (gap in body)
      return {
        dir: dirName,
        expectedEye: { x: Math.round(expectedEyeX), y: Math.round(expectedEyeY) },
        measuredEye: eyePixels.length > 0 ? { x: Math.round(avgX), y: Math.round(avgY) } : null,
        eyePixels: eyePixels.length,
        bodyCenter: { x: Math.round(cx), y: Math.round(cy) },
        grid,
          };
          }, dirName);
    
    results.push(pixelData);
    console.log('=== ' + dirName + ' ===');
    console.log('Expected eye:', pixelData.expectedEye);
    console.log('Measured eye:', pixelData.measuredEye);
    console.log('Pixels:', pixelData.eyePixels);
    console.log('Grid:');
    console.log(pixelData.grid.join('\n'));
     }
  
  console.log('\n=== SUMMARY ===');
  results.forEach(r => {
    const eye = r.measuredEye;
    console.log(`${r.dir}: measured=(${eye?.x || '?'}, ${eye?.y || '?'}) vs expected(${r.expectedEye.x}, ${r.expectedEye.y})`);
     });
  
  await browser.close();
})().catch(e => { console.error(e.stack || e); process.exit(1); });
