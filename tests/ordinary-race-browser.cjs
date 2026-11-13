// Run against the built game with Playwright Core and a local Chromium installation.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const url=require('node:url').pathToFileURL(path.resolve(__dirname,'../dist/dev.html')).href;
const proof=process.env.RACE_CAPTURE_DIR;
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
  try{
    for(const seed of [2,3,18,71]){
      const page=await browser.newPage({viewport:seed===71?{width:540,height:820}:{width:960,height:660}});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      await page.goto(url);
      const button=(action,id)=>page.locator('[data-action="'+action+'"]'+(id?'[data-id="'+id+'"]':'')).filter({visible:true}).first();
      await button('settings').click();
      assert.equal(await page.locator('#setting-film').isChecked(),false);
      await page.locator('#setting-film').check();
      await page.locator('#seed-input').fill(String(seed));
      await button('seed').click();
      await button('approach','balanced').click();
      if(seed===18){
        await button('shop').click();
        await page.locator('[data-action="buy"]:enabled').first().click();
        await button('confirm-ok').click();await button('close-modal').click();
      }
      const expected=await page.evaluate(seed=>{
        const E=ScrapEngine,s=E.decodeSave(localStorage.getItem('scrap-prix-v0400-systems-run-v21'));
        return E.race(s,seed===3?{late:'risk'}:{}).history.at(-1);
      },seed);
      const folder=proof&&seed<=3?path.join(proof,String(seed)):null;
      if(folder)fs.mkdirSync(folder,{recursive:true});
      let count=0;const timestamps=[];
      async function capture(){if(!folder)return; timestamps.push(Date.now());await page.screenshot({path:path.join(folder,String(count++).padStart(4,'0')+'.jpg'),type:'jpeg',quality:70});}
      await capture();
      await button('race').click();
      await button('pause').click();
      assert.deepEqual(await page.locator('#race-canvas').evaluate(c=>[c.width,c.height]),[480,270]);
      const frozen=await page.locator('#race-canvas').evaluate(c=>c.toDataURL());
      await page.waitForTimeout(180);
      assert.equal(await page.locator('#race-canvas').evaluate(c=>c.toDataURL()),frozen);
      await button('pause').click();
      await button('speed',folder?'2':'4').click();
      const laps=new Set(),shots=new Set();
      let chose=false;
      const deadline=Date.now()+100000;
      while(await page.locator('#race-wrap').count()){
        assert(Date.now()<deadline,'Race did not finish: '+errors.join(' / '));
        const beat=await page.evaluate(()=>[document.querySelector('#stage-counter')?.textContent,document.querySelector('#race-wrap')?.dataset.shot]);
        if(beat[0])laps.add(beat[0]); if(beat[1])shots.add(beat[1]);
        await capture();
        if(await button('event-choice','risk').isVisible()){
          shots.add('decision');await capture();
          const p=await page.locator('#race-progress').getAttribute('value');
          await page.waitForTimeout(320);await capture();
          assert.equal(await page.locator('#race-progress').getAttribute('value'),p);
          await button('event-choice',seed===3?'risk':'safe').click();chose=true;
        }
        await page.waitForTimeout(folder?85:50);
      }
      await button('continue').waitFor();
      await capture();
      const actual=await page.evaluate(()=>ScrapEngine.decodeSave(localStorage.getItem('scrap-prix-v0400-systems-run-v21')).history.at(-1));
      for(const key of ['laps','standings','prize','pointsEarned','damageBySlot','loadoutBefore'])assert.deepEqual(actual[key],expected[key],key);
      for(const lap of actual.laps)assert(laps.has(lap.lap+' / '+actual.lapCount),'missing lap '+lap.lap);
      assert(shots.has('event')&&shots.has('consequence')&&shots.has('finish'));
      assert.equal(chose,seed===3||expected.laps.some(l=>l.effects.some(e=>e.choiceEvent)));
      await button('continue').click();await button('race').waitFor();await capture();
      assert.deepEqual(errors,[]);
      console.log('PASS',seed,Array.from(laps),Array.from(shots),count,'capture frames');
      if(folder)fs.writeFileSync(path.join(folder,'frames.json'),JSON.stringify({count,timestamps}));
      await page.close();
    }
    for(const mode of ['skip','interrupt','dnf','dns']){
      const page=await browser.newPage({viewport:{width:1024,height:768},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(url);
      // Explicit damaged-car fixtures exercise genuine engine retirement / no-start.
      await page.evaluate(mode=>{
        const E=ScrapEngine,s=E.newRun(mode==='skip'||mode==='interrupt'?3:2);
        if(mode==='dnf'||mode==='dns')s.durability.engine=mode==='dnf'?1:0;
        localStorage.setItem('scrap-prix-v0400-systems-run-v21',E.encodeSave(s));
      },mode);
      await page.reload();
      const click=(action,id)=>page.locator('[data-action="'+action+'"]'+(id?'[data-id="'+id+'"]':'')+':visible').first().click();
      await click('continue-title');await click('settings');
      assert.equal(await page.locator('#setting-motion').isChecked(),false);
      await page.locator('#setting-film').check();await page.locator('#setting-autoplay').uncheck();
      await click('close-modal');await click('race');
      if(mode==='dns')await click('confirm-ok');
      await page.locator('#race-wrap[data-shot]').waitFor();
      if(mode==='interrupt'){await page.reload();await click('continue-title');}
      else if(mode==='skip'){await click('skip');await click('confirm-ok');}
      else{
        let terminal=false;
        for(let i=0;i<16&&await page.locator('#race-wrap').count();i++){
          terminal ||= await page.locator('#race-wrap').getAttribute('data-shot')===mode;
          await click('next-phase');
        }
        assert(terminal,mode+' treatment missing');
      }
      await page.locator('#game[data-screen="result"]').waitFor();
      const r=await page.evaluate(()=>ScrapEngine.decodeSave(localStorage.getItem('scrap-prix-v0400-systems-run-v21')).history.at(-1));
      if(mode==='dns')assert(r.noStart&&r.laps.length===0&&r.prize===0);
      else if(mode==='dnf')assert(r.failedSlot&&r.failureLap);
      else assert.equal(r.laps.flatMap(l=>l.effects).find(e=>e.key==='late').choice,'safe');
      await click('continue');assert.deepEqual(errors,[]);await page.close();
      console.log('PASS manual/reduced-motion',mode);
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
