/* Headless Chromium screenshots of actual Scrap Prix dialogue layouts for design review. */
(function capture(){
  const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
  const {spawn,spawnSync}=require('node:child_process');
  const root=path.resolve(__dirname,'..','..'),out=path.join(root,'artifacts','dialogue-ui');
  const chromePath=process.env.CHROME_PATH||['google-chrome','chromium','chromium-browser'].find(c=>spawnSync('which',[c]).status===0);
  if(!chromePath)throw Error('Chrome or Chromium is required for screenshots');
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  fs.mkdirSync(out,{recursive:true});
  const page='file://'+path.join(root,'dist','index.html');
  (async()=>{
    const profile=fs.mkdtempSync(path.join(os.tmpdir(),'scrap-dialogue-capture-'));
    const port=9850+Math.floor(Math.random()*450);
    const chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--window-size=1440,900','about:blank'],{stdio:'ignore'});
    let ws=null;
    try{
      let target=null;
      for(let i=0;i<50&&!target;i++){try{target=(await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t=>t.type==='page');}catch(e){await sleep(160);}}
      assert(target,'Could not reach Chromium debugger');
      ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
      let seq=0;const pending=new Map(),errors=[];
      ws.onmessage=ev=>{const msg=JSON.parse(ev.data);if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);return;}if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);};
      const send=(method,params={})=>new Promise(resolve=>{const id=++seq;pending.set(id,resolve);ws.send(JSON.stringify({id,method,params}));});
      const evalJs=async js=>{const res=await send('Runtime.evaluate',{expression:js,returnByValue:true,awaitPromise:true});if(res.result.exceptionDetails)throw Error(res.result.exceptionDetails.text);return res.result.result.value;};
      const click=async(action,id=null)=>evalJs(`(()=>{const b=document.querySelector(${JSON.stringify(`[data-action="${action}"]`+(id?`[data-id="${id}"]`:''))});if(!b)return false;b.click();return true;})()`);
      const viewport=async(w,h)=>{await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await sleep(220);};
      const shot=async name=>{
        const res=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
        assert(res.result?.data,'Screenshot capture was empty');
        fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(res.result.data,'base64'));
        const details=await evalJs(`(()=>{const id=document.getElementById('game').dataset.screen,d=document.querySelector('.dialogue-dock:not([hidden])'),p=d?.getBoundingClientRect(),ctrl=document.querySelector('.race-controls')?.getBoundingClientRect();return{screen:id,visibleDialogue:!!d,speaker:d?.querySelector('.dialogue-speaker')?.textContent,dialogue:p?{top:p.top,right:p.right,bottom:p.bottom,left:p.left}:null,controls:ctrl?{top:ctrl.top,bottom:ctrl.bottom}:null}})()`);
        if(!details.visibleDialogue)throw Error(name+': expected dialogue preview to be visible');
        return {name,details};
      };
      await send('Runtime.enable');await send('Page.enable');
      await viewport(1440,900);await send('Page.navigate',{url:page});await sleep(1300);
      assert(await click('new'),'New run button missing');await sleep(850);
      if(await evalJs('document.getElementById("confirm-modal").open'))await click('confirm-ok'),await sleep(250);
      assert.equal(await evalJs("document.getElementById('game').dataset.screen"),'garage');
      const gallery=[];
      gallery.push(await shot('garage-desktop-1440x900'));
      await viewport(390,844);
      gallery.push(await shot('garage-mobile-390x844'));
      await viewport(1440,900);
      await click('settings');await sleep(140);
      await evalJs("(()=>{const box=document.getElementById('setting-autoplay');if(box.checked)box.click();})()");
      await click('close-modal');
      assert(await click('race'),'Race button missing');
      await sleep(350);
      assert.equal(await evalJs("document.getElementById('game').dataset.screen"),'race');
      gallery.push(await shot('radio-opening-desktop-1440x900'));
      await viewport(390,844);
      gallery.push(await shot('radio-opening-mobile-390x844'));
      await viewport(1440,900);
      for(let i=0;i<14;i++){
        const label=await evalJs("document.querySelector('#race-dialogue .dialogue-speaker span')?.textContent||''");
        if(label==='TRACK HAZARD'||label==='UNUSUAL EVENT'){gallery.push(await shot('radio-event-desktop-1440x900'));break;}
        const ok=await click('next-phase');
        if(!ok||await evalJs("document.getElementById('game').dataset.screen!=='race'"))break;
      }
      assert.equal(errors.length,0,'Browser exceptions: '+errors.join('; '));
      fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify(gallery,null,2));
      console.log('CAPTURED: '+JSON.stringify(gallery.map(x=>x.name)));
    }finally{
      if(ws)ws.close();chrome.kill();
      await new Promise(resolve=>{chrome.once('exit',resolve);setTimeout(resolve,2000);});
      fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:150});
    }
  })().catch(err=>{console.error('DIALOGUE CAPTURE FAILED:',err.stack||err);process.exitCode=1;});
})();
