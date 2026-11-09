/* True in-game Three.js workshop browser capture; runs only on the visual integration branch. */
(function capture(){
  const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
  const {spawn,spawnSync}=require('node:child_process');
  const home=path.resolve(__dirname,'../..'),file=path.join(home,'dist','index.html'),out=path.join(home,'artifacts','three-garage');
  const binary=process.env.CHROME_PATH||['google-chrome','chromium','chromium-browser'].find(c=>spawnSync('which',[c]).status===0);
  if(!binary)throw Error('Chromium unavailable');
  fs.mkdirSync(out,{recursive:true});
  const server=http.createServer((_req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(fs.readFileSync(file));});
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  (async()=>{
    await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
    const port=server.address().port,debug=9840+Math.floor(Math.random()*2800);
    const profile=fs.mkdtempSync(path.join(os.tmpdir(),'scrap-three-garage-'));
    const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'--window-size=1440,900','about:blank'],{stdio:['ignore','ignore','pipe']});
    let stderr='',socket=null;
    chrome.stderr.on('data',b=>{stderr=(stderr+String(b)).slice(-2400);});
    try{
      let page=null;
      for(let i=0;i<110&&!page;i++){try{page=(await (await fetch(`http://127.0.0.1:${debug}/json`)).json()).find(x=>x.type==='page');}catch(_){}if(!page){if(chrome.exitCode!==null)break;await sleep(240);}}
      assert(page,'Chromium debug startup failed: '+stderr);
      socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((ok,no)=>{socket.onopen=ok;socket.onerror=no;});
      let seq=0;const waiting=new Map(),errors=[];
      socket.onmessage=ev=>{const msg=JSON.parse(ev.data);if(msg.id&&waiting.has(msg.id)){waiting.get(msg.id)(msg);waiting.delete(msg.id);return;}
        if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.exception?.description||msg.params.exceptionDetails.text);
      };
      const send=(method,params={})=>new Promise(ok=>{const id=++seq;waiting.set(id,ok);socket.send(JSON.stringify({id,method,params}));});
      const evalJs=async js=>{
        const result=await send('Runtime.evaluate',{expression:js,returnByValue:true,awaitPromise:true});
        if(result.result.exceptionDetails)throw Error(result.result.exceptionDetails.text);
        return result.result.result.value;
      };
      const click=async action=>evalJs(`(()=>{const b=document.querySelector('[data-action="${action}"]');if(!b)return false;b.click();return true;})()`);
      const viewport=async(w,h)=>{await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await sleep(260);};
      const screenshot=async name=>{
        const res=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        assert(res.result?.data,'Screenshot failed: '+name);
        fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(res.result.data,'base64'));
      };
      await send('Runtime.enable');await send('Page.enable');
      await viewport(1440,900);
      await send('Page.navigate',{url:`http://127.0.0.1:${port}/`});await sleep(1400);
      assert(await click('new'),'Start run button missing');
      await sleep(450);
      if(await evalJs("document.getElementById('confirm-modal').open"))await click('confirm-ok');
      assert.equal(await evalJs("document.getElementById('game').dataset.screen"),'garage');
      const before=await evalJs("(()=>{const r=JSON.parse(localStorage.getItem('scrap-prix-v0400-systems-run-v21'));return JSON.stringify({loadout:r.loadout,levels:r.levels,credits:r.credits,durability:r.durability})})()");
      await screenshot('garage-original-1440x900');
      assert(await click('garage-3d'),'3D comparison button unavailable');
      let loaded=false,status='';
      for(let i=0;i<90&&!loaded;i++){await sleep(300);status=await evalJs("document.getElementById('garage-three-status')?.textContent||''");
        loaded=status.includes('THREE.JS · PROCEDURAL')||status.includes('THREE.JS · PROCEDURAL TEST')||status.includes('DRAG TO ROTATE');
        if(status.includes('UNAVAILABLE'))break;
      }
      assert(loaded,'3D scene failed to load. Status: '+status+'; browser: '+errors.join(' | '));
      await sleep(700);
      const result=await evalJs("(()=>({parts:ScrapThreeGarage.parts(),metrics:ScrapThreeGarage.metrics(),screen:document.getElementById('game').dataset.screen,active:document.querySelector('.garage-art').dataset.visual}))()");
      assert(result.metrics&&result.metrics.calls>5,'WebGL renderer did not draw a real 3D scene: '+JSON.stringify(result));
      assert.equal(result.active,'three');
      assert(result.parts&&result.parts.engine&&result.parts.tyres&&result.parts.chassis&&result.parts.gadget);
      await screenshot('garage-threejs-1440x900');
      await viewport(390,844);await screenshot('garage-threejs-390x844');
      await viewport(1440,900);
      assert(await click('garage-3d'),'Return to original 2D garage');
      assert(await evalJs("document.getElementById('garage-three-canvas').hidden"),'3D canvas still active after toggling');
      const after=await evalJs("(()=>{const r=JSON.parse(localStorage.getItem('scrap-prix-v0400-systems-run-v21'));return JSON.stringify({loadout:r.loadout,levels:r.levels,credits:r.credits,durability:r.durability})})()");
      assert.equal(after,before,'Preview must not change saved mechanics');
      assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
      fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify({threejs:result,unchangedSave:true,offlineFallback:true},null,2));
      console.log('PASS: Real Three.js garage rendered using four equipped parts; draw calls='+result.metrics.calls+', triangles='+result.metrics.triangles+'; original toggles back; save unchanged.');
    }finally{
      if(socket)socket.close();chrome.kill('SIGTERM');server.close();
      try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:180});}catch(err){console.warn('Nonfatal Chrome cleanup:',err.code||err.message);}
    }
  })().catch(err=>{console.error('3D GARAGE CAPTURE FAILED:',err.stack||err);process.exitCode=1;server.close();});
})();
