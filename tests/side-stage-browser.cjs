const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const proof=path.resolve(process.env.PROOF_DIR||'dist/side-stage-proof');
fs.mkdirSync(proof,{recursive:true});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1240,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.FORGE_URL||require('node:url').pathToFileURL(path.resolve('dist/SIDE-STAGE.html')).href);
    const frame=process.env.FORGE_URL?page.frameLocator('iframe[title="Scrap Prix Side Stage"]'):page;
    const stage=frame.locator('#stage');
    await stage.waitFor();
    // Phase 3D: mode switch and source-backed, deterministic event preview.
    await frame.locator('#mode-race').click();
    assert.equal(await frame.locator('#real-race-workspace').isVisible(),true);
    assert.equal(await frame.locator('#motion-workspace').isVisible(),false);
    const raceStage=frame.locator('#race-stage');
    const actual=await raceStage.evaluate(()=>{
      const r=ScrapSeed18DebrisReview.load(18);
      return {seed:r.seed,source:r.source.id,damage:r.event.damage,
        phases:r.shots.map(s=>s.debris.phase),cameras:r.shots.map(s=>s.camera)};
    });
    assert.equal(actual.seed,18);assert.equal(actual.source,'debris');
    assert.deepEqual(actual.phases,['anticipation','reaction','recovery']);
    assert.deepEqual(actual.cameras,['front','side','side']);
    assert.equal(Number(await raceStage.getAttribute('data-damage')),actual.damage);
    for(const [phase,camera] of [['anticipation','front'],['reaction','side'],['recovery','side']]){
      await frame.locator('[data-review-phase="'+phase+'"]').click();
      assert.equal(await raceStage.getAttribute('data-phase'),phase);
      assert.equal(await raceStage.getAttribute('data-camera'),camera);
      const shot=await raceStage.evaluate(c=>c.toDataURL());
      await frame.locator('#race-seek').evaluate(e=>e.dispatchEvent(new Event('input')));
      assert.equal(await raceStage.evaluate(c=>c.toDataURL()),shot);
      await raceStage.screenshot({path:path.join(proof,'seed18-'+phase+'.png')});
    }
    await frame.locator('#race-reduced').check();
    await frame.locator('[data-review-phase="reaction"]').click();
    assert.equal(await raceStage.getAttribute('data-action'),'reduced motion');
    await frame.locator('#race-reduced').uncheck();
    await frame.locator('#race-step').click();
    assert(Number(await frame.locator('#race-seek').inputValue())>0);
    await frame.locator('#race-export').click();
    assert.equal(JSON.parse(await frame.locator('#race-json').inputValue()).seed,18);
    await frame.locator('#race-restart').click();
    assert.equal(Number(await frame.locator('#race-seek').inputValue()),0);
    await frame.locator('#mode-motion').click();
    assert.equal(await frame.locator('#motion-workspace').isVisible(),true);
    await frame.locator('#play').click();
    async function seek(t){await frame.locator('#seek').evaluate((e,t)=>{e.value=t;e.dispatchEvent(new Event('input'));},t);}
    for(const chassis of ['stock-chassis','needle-frame','longbody']){
      await frame.locator('#chassis').selectOption(chassis);
      await frame.locator('#preset').selectOption('jump');
      await seek(4000);
      const first=await stage.evaluate(c=>c.toDataURL());
      await seek(1800);await seek(4000);
      assert.equal(await stage.evaluate(c=>c.toDataURL()),first);
      assert.equal(Number(await stage.getAttribute('data-wheels')),chassis==='longbody'?6:4);
      await stage.screenshot({path:path.join(proof,chassis+'-jump.png')});
      await frame.locator('#reduced').check();
      await seek(3000);const still=await stage.evaluate(c=>c.toDataURL());
      await seek(5000);assert.equal(await stage.evaluate(c=>c.toDataURL()),still);
      await frame.locator('#reduced').uncheck();
    }
    await frame.locator('#chassis').selectOption('stock-chassis');
    await frame.locator('summary').click();await frame.locator('#export').click();
    const config=await frame.locator('#config').inputValue();
    await frame.locator('#engine').selectOption('v8');await frame.locator('#restore').click();
    assert.equal(await frame.locator('#engine').inputValue(),'stock-engine');
    assert.equal(await frame.locator('#config').inputValue(),config);
    await frame.locator('#step').click();assert(Number(await frame.locator('#seek').inputValue())>0);
    await frame.locator('#restart').click();assert.equal(Number(await frame.locator('#seek').inputValue()),0);
    for(const speed of ['1','2','4']){
      await frame.locator('#playback-speed').selectOption(speed);await frame.locator('#play').click();
      await page.waitForTimeout(220);await frame.locator('#play').click();
      assert(Number(await frame.locator('#seek').inputValue())>100);await frame.locator('#restart').click();
    }
    await frame.locator('#preset').selectOption('cruise');await frame.locator('#playback-speed').selectOption('1');
    await seek(7990);await frame.locator('#loop').check();await frame.locator('#play').click();
    await page.waitForTimeout(150);await frame.locator('#play').click();assert(Number(await frame.locator('#seek').inputValue())<700);
    await frame.locator('summary').click();await page.screenshot({path:path.join(proof,'art-forge.png')});
    const frames=path.join(proof,'motion');fs.mkdirSync(frames,{recursive:true});
    const stamps=[],samples=[];
    let count=0;
    for(const preset of ['accelerate-brake','bump','jump','impact']){
      await frame.locator('#preset').selectOption(preset);
      await frame.locator('#duration').fill('4000');await frame.locator('#loop').uncheck();
      await frame.locator('#restart').click();await frame.locator('#play').click();
      while(await frame.locator('#play').getAttribute('aria-pressed')==='true'){
        stamps.push(Date.now());samples.push({preset,pose:JSON.parse(await stage.getAttribute('data-pose'))});
        await stage.screenshot({path:path.join(frames,String(count++).padStart(4,'0')+'.png')});
        await page.waitForTimeout(45);
      }
    }
    fs.writeFileSync(path.join(frames,'frames.json'),JSON.stringify({count,timestamps:stamps,samples}));
    if(process.env.BASELINE_DEV){
      for(const [name,file] of [['phase-3b',process.env.BASELINE_DEV],['phase-3c',path.resolve('dist/dev.html')]]){
        const game=await browser.newPage({viewport:{width:960,height:660}});
        game.on('pageerror',e=>errors.push(e.message));
        await game.goto(require('node:url').pathToFileURL(file).href);
        const click=action=>game.locator('[data-action="'+action+'"]:visible').first().click();
        await click('settings');await game.locator('#setting-film').check();
        await game.locator('#setting-autoplay').uncheck();
        await game.locator('#seed-input').fill('2');await click('seed');await click('race');
        assert.equal(await game.locator('#race-progress').getAttribute('value'),'0');
        const png=await game.locator('#race-canvas').evaluate(c=>c.toDataURL().split(',')[1]);
        fs.writeFileSync(path.join(proof,name+'-opening.png'),Buffer.from(png,'base64'));
        await game.close();
      }
    }
    assert.deepEqual(errors,[]);
    console.log('PASS Art Forge controls, config round trip, exact frames after seeking, 3 chassis, reduced motion, loop and real-time motion capture',count);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
