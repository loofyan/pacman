import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
    // Inject code BEFORE page loads to make game accessible
  await page.addInitScript(() => {
     // Monkey-patch: when Game.render is called, record eye arc data in global state
    const origGame = window.Game;
    
      // We'll patch CanvasRenderingContext2D.arc instead
    const ctxProto = CanvasRenderingContext2D.prototype;
    let savedX = null;
    let savedY = null;
    let saved = false;
    
    window.__renderData = [];
    let currentDir = '?';
    
    ctxProto.save = function() {
      if (!saved) {
        savedX = this.getTransform();
        saved = true;
       }
      return ctxProto.save.apply(this);
     };
    
    ctxProto.restore = function() {
      const result = ctxProto.restore.apply(this);
      saved = false;
      return result;
     };
    
    const origArc = ctxProto.arc;
    ctxProto.arc = function(x, y, r, startAngle, endAngle) {
      const result = origArc.call(this, x, y, r, startAngle, endAngle);
        // Eye has radius ~r*0.1 = ~1.008
       if (Math.abs(r - 1.008) < 0.02) {
        const transform = this.getTransform();
        const screenX = transform.a * x + transform.c * y + transform.e;
        const screenY = transform.b * x + transform.d * y + transform.f;
        window.__renderData.push({
          dir: currentDir,
          localX: x,
          localY: y,
          screenX,
          screenY,
          r,
          isInsideTransform: saved
          });
       }
      return result;
     };
    
      // Set current direction before render
    window.__setDir = function(d) { currentDir = d; };
   });
  
  await page.goto('http://localhost:3461', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  
    // Now use keyboard to set directions (which triggers render)
  const directions = ['/RIGHT', '/LEFT: a', ' /UP: w', ' DOWN: s'];
  const keys = ['d', 'a', 'w', 's'];
  const dirNames = ['RIGHT', 'LEFT', 'UP', 'DOWN'];
  
  // Start the game first
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  for (let i = 0; i < 4; i++) {
    await page.evaluate((d) => { window.__setDir(d); }, dirNames[i]);
    await page.keyboard.press(keys[i]);
    await page.waitForTimeout(400);  // Wait for a few render frames
    
    const data = await page.evaluate(() => window.__renderData);
    
     // Get latest render data for this direction
    const latest = data.filter(d => d.dir === dirNames[i]).slice(-1)[0];
    
    if (latest) {
      console.log(`${dirNames[i]}: local=(${latest.localX.toFixed(1)}, ${latest.localY.toFixed(1)}), screen=(${latest.screenX.toFixed(1)}, ${latest.screenY.toFixed(1)}), insideTransform=${latest.isInsideTransform}`);
      } else {
      console.log(`${dirNames[i]}: no eye data found`);
     }
   }
  
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
