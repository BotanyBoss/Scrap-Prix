const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const dir=path.resolve(process.env.PROOF_DIR||'dist/vehicle-proof');fs.mkdirSync(dir,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1150,height:780}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.context().setOffline(true);
    await page.goto(pathToFileURL(path.resolve('dist/VEHICLE-PIPELINE.html')).href);
    assert.equal(await page.locator('#error').innerText(),'');
    const bench=await page.evaluate(()=>{
      const canvas=document.createElement('canvas');canvas.width=492;canvas.height=339;
      const gpu=gpuView(canvas),samples={gpu:[],software:[],assembly:[],orbitBatch:[]},ids=Pipeline.choices;
      let rig,combinations=0;const w=document.createElement('canvas').getContext('2d');
      for(const chassis of ids.chassis)for(const tyres of ids.tyres)for(const engine of ids.engine)for(const gadget of ids.gadget){
        const t=performance.now(),before=rig;rig=Pipeline.assemble({chassis,tyres,engine,gadget},before);
        const count=gpu.update(rig);samples.assembly.push(performance.now()-t);
        if(before && before.loadout.engine===engine && before.loadout.chassis===chassis && before.loadout.tyres===tyres && count!==1)throw Error('Unnecessary buffer rebuild');
        if(rig.wheels.length!==(chassis==='longbody'?6:4))throw Error('Incorrect wheel count');
        for(const p of Object.values(rig.groups).flat())if(!p.pts.every(pt=>pt.every(Number.isFinite)))throw Error('Invalid geometry');
        for(const angles of Object.values(Pipeline.cameras)){
          const start=performance.now(),frame=gpu.snapshot(angles,'');
          const pixels=frame.getContext('2d').getImageData(0,0,164,113).data;
          samples.gpu.push(performance.now()-start);
          const ts=performance.now(),soft=softwareFrame(rig,angles,'');samples.software.push(performance.now()-ts);
          for(const img of [pixels,soft.getContext('2d').getImageData(0,0,164,113).data]){
            let visible=0;for(let y=0;y<113;y++)for(let x=0;x<164;x++)if(img[(y*164+x)*4+3]){
              visible++;if(!x||!y||x===163||y===112)throw Error('Clipped sprite');
            }
            if(visible<300)throw Error('Blank sprite');
          }
        }
        combinations++;
      }
      for(let k=0;k<5;k++){
        const start=performance.now();
        for(let i=0;i<30;i++)gpu.draw([i*Math.PI/15,.3],'');
        w.drawImage(canvas,0,0,1,1);w.getImageData(0,0,1,1);
        samples.orbitBatch.push((performance.now()-start)/30);
      }
      const gl=canvas.getContext('webgl'),ext=gl.getExtension('WEBGL_debug_renderer_info');
      return {combinations,views:combinations*3,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown',
        assetCount:Pipeline.units.size,finalMeshBytes:gpu.bytes(),timings:Object.fromEntries(Object.entries(samples).map(([k,a])=>{
          a.sort((a,b)=>a-b);return [k,{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]}]}))};
    });
    for(const [chassis,engine,tyres,gadget] of [
      ['stock-chassis','stock-engine','stock-tyres','stock-gadget'],['needle-frame','inline-four','skinny-spokes','impact-foam'],
      ['longbody','v8','speed-slicks','cooling-fan']]){
      for(const [id,v] of Object.entries({chassis,engine,tyres,gadget}))await page.selectOption('#'+id,v);
      for(const view of ['side','rear','front']){
        await page.selectOption('#view',view);await page.screenshot({path:path.join(dir,chassis+'-'+view+'.png')});
      }
      await page.check('#sockets');await page.screenshot({path:path.join(dir,chassis+'-sockets.png')});await page.uncheck('#sockets');
      await page.selectOption('#engine',engine==='v8'?'stock-engine':'v8');
      await page.screenshot({path:path.join(dir,chassis+'-swap.png')});
    }
    await page.selectOption('#wear','engine');
    const worn=await page.locator('#capture').evaluate(c=>c.toDataURL());
    await page.selectOption('#wear','');assert.notEqual(worn,await page.locator('#capture').evaluate(c=>c.toDataURL()));
    await page.selectOption('#wear','engine');assert.equal(worn,await page.locator('#capture').evaluate(c=>c.toDataURL()));
    const d=page.waitForEvent('download');await page.click('#export');await(await d).saveAs(path.join(dir,'worn-longbody.png'));
    await page.screenshot({path:path.join(dir,'longbody-wear.png')});
    const repeat=await page.evaluate(()=>{
      const l=Object.fromEntries(Object.keys(Pipeline.choices).map(s=>[s,document.getElementById(s).value]));
      const a=Pipeline.assemble(l),gpu=gpuView(document.createElement('canvas'));
      gpu.update(a);const snap=()=>gpu.snapshot(Pipeline.cameras.side,'').toDataURL();
      const first=snap();gpu.draw([2,.6],'tyres');return snap()===first;
    });
    assert(repeat);assert.deepEqual(errors,[]);
    console.log(JSON.stringify(bench));fs.writeFileSync(path.join(dir,'metrics.json'),JSON.stringify(bench,null,2));
    if(process.env.FORGE_URL){
      await page.context().setOffline(false);await page.goto(process.env.FORGE_URL);
      const frame=page.frameLocator('iframe[title="Vehicle pipeline"]');
      await frame.locator('#chassis').selectOption('longbody');assert.match(await frame.locator('#layout').innerText(),/6 wheels/);
      await page.screenshot({path:path.join(dir,'studio.png')});
    }
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
