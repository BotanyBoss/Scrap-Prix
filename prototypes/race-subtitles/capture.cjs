// Capture a real Scrap Prix race frame with a temporary, non-shipped commentator subtitle HUD.
// Uses the existing built game engine, graphics, and live event panel. Does not alter race results.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn,spawnSync}=require('node:child_process');
const chromePath=process.env.CHROME_PATH||['google-chrome','chromium','chromium-browser'].find(c=>spawnSync('which',[c]).status===0);
if(!chromePath)throw Error('Chrome/Chromium is required');
const pageUrl='file://'+path.join(__dirname,'..','..','dist','index.html');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'scrap-dialogue-image-'));
  const port=10200+Math.floor(Math.random()*900);
  const chrome=spawn(chromePath,[
    '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
    '--window-size=1440,900','--force-device-scale-factor=1','--hide-scrollbars',
    '--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
  let chromeErrors='';chrome.stderr.on('data',x=>{chromeErrors=(chromeErrors+String(x)).slice(-3000);});
  let ws;
  try{
    let target;
    for(let i=0;i<100&&!target;i++){await pause(200);try{
      target=(await(await fetch('http://127.0.0.1:'+port+'/json')).json()).find(x=>x.type==='page');
    }catch{}}
    assert(target,'Chrome did not start: '+chromeErrors);
    ws=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
    let id=0;const pending=new Map(),errors=[];
    ws.onmessage=ev=>{
      const m=JSON.parse(ev.data);
      if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}
      if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
    };
    const send=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);ws.send(JSON.stringify({id:n,method,params}));});
    const run=async expr=>{
      const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
      if(r.result.exceptionDetails)throw Error(r.result.exceptionDetails.exception?.description||r.result.exceptionDetails.text);
      return r.result.result?.value;
    };
    await send('Page.enable');await send('Runtime.enable');
    await send('Page.navigate',{url:pageUrl});await pause(1800);
    assert.equal(await run("document.querySelector('#game')?.dataset.screen"),'title','Wrong initial game screen');
    const seed=await run("(()=>{for(let n=1;n<=20000;n++){const c=window.ScrapEngine.raceCard(n,0);if(c.events.some(e=>e.id==='experimental-magnet'))return n;}return null;})()");
    assert(seed!==null,'Could not find natural seeded magnet event');
    await run("document.querySelector('[data-action=\"settings\"]').click()");
    await pause(100);
    await run("(()=>{const x=document.getElementById('setting-autoplay');x.checked=false;x.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('seed-input').value=String("+seed+");document.querySelector('[data-action=\"seed\"]').click();})()");
    await pause(400);
    if(await run("document.getElementById('confirm-modal').open"))await run("document.querySelector('[data-action=\"confirm-ok\"]').click()");
    assert.equal(await run("document.querySelector('#game')?.dataset.screen"),'garage','Seeded garage not available');
    await run("document.querySelector('[data-action=\"race\"]').click()");
    await pause(500);
    assert.equal(await run("document.querySelector('#game')?.dataset.screen"),'race','Race scene did not load');
    // Advance using the game's own Next action until the actual generated magnet event.
    let found=false;
    for(let i=0;i<60;i++){
      const title=await run("document.querySelector('#event-title')?.textContent||''");
      if(/magnet/i.test(title)){found=true;break;}
      const still=await run("document.querySelector('#game')?.dataset.screen");
      if(still!=='race')break;
      await run("document.querySelector('[data-action=\"next-phase\"]')?.click()");
      await pause(60);
    }
    assert(found,'Natural magnet event not visible in race replay');
    await run("document.querySelector('[data-action=\"pause\"]')?.click()");
    // The next DOM elements are a disposable screenshot overlay, NOT a new shipped feature.
    await run("(()=>{"
       +"const panel=document.querySelector('#race-wrap');"
       +"const event=document.querySelector('#event-box');event.classList.remove('compact');"
       +"panel.dataset.paused='false';"
       +"const css=document.createElement('style');"
       +"css.textContent='#race-wrap .paused-label{display:none!important;}#concept-subtitle{position:absolute;z-index:16;right:18px;bottom:86px;width:368px;max-width:44%;display:flex;align-items:stretch;gap:10px;padding:10px;background:#0b2027eb;color:#f6f0dd;border:2px solid #688b94;box-shadow:0 5px 0 #07141bd1;font-family:Trebuchet MS,Arial,sans-serif;pointer-events:none;box-sizing:border-box}#concept-subtitle .face{flex:0 0 58px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;background:#bca773;border:3px solid #1c333c;color:#24353b}#concept-subtitle .face .hat{font-size:22px;font-weight:900;letter-spacing:-3px}#concept-subtitle .face .eyes{font-size:20px;font-weight:bold;letter-spacing:3px;line-height:1}#concept-subtitle .face .chin{font-size:15px;line-height:1}#concept-subtitle .caption{font-size:10px;letter-spacing:1.2px;font-weight:900;color:#edc765;display:block;padding-bottom:4px}#concept-subtitle .caption .live{color:#a0bec1;font-size:9px}#concept-subtitle .line{font-size:15px;font-weight:700;line-height:1.3;margin:0;letter-spacing:.05px}#concept-subtitle .copy{display:flex;flex-direction:column;justify-content:center}#concept-subtitle:after{content:\"\";position:absolute;right:25px;bottom:-13px;width:18px;height:18px;background:#0b2027;border-right:2px solid #688b94;border-bottom:2px solid #688b94;transform:rotate(45deg)}';"
       +"document.head.append(css);"
       +"const b=document.createElement('aside');b.id='concept-subtitle';b.setAttribute('aria-label','Proposed character radio subtitles');"
       +"b.innerHTML='<div class=\"face\"><div class=\"hat\">▰▰</div><div class=\"eyes\">• •</div><div class=\"chin\">⌣</div></div><div class=\"copy\"><span class=\"caption\">??? &nbsp; / &nbsp; <span class=\"live\">RADIO</span></span><p class=\"line\">Hang on... I never ordered a magnet THAT big. Did I?</p></div>';"
       +"panel.append(b);"
       +"return true;})()");
    await pause(650);
    const summary=await run("({screen:document.querySelector('#game').dataset.screen,seed:"+seed+",event:document.querySelector('#event-title').textContent,subtitle:document.querySelector('#concept-subtitle .line').textContent,wrap:document.querySelector('#race-wrap').getBoundingClientRect().toJSON()})");
    assert.equal(summary.screen,'race');
    assert(/magnet/i.test(summary.event));
    assert(summary.wrap.width>600&&summary.wrap.height>300,'Race view rendered too small');
    const out=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    assert(out.result?.data,'Screenshot capture failed');
    fs.writeFileSync(path.join(__dirname,'race-screen-with-subtitles.png'),Buffer.from(out.result.data,'base64'));
    console.log('CAPTURED ACTUAL GAME RACE SCREEN:',JSON.stringify(summary));
    console.log('OUTPUT: race-screen-with-subtitles.png');
    if(errors.length)console.log('Non-blocking browser exceptions:',errors.slice(0,4));
  }finally{
    if(ws?.readyState===WebSocket.OPEN)ws.close();
    chrome.kill('SIGTERM');
    await pause(600);
    fs.rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:250});
  }
})().catch(err=>{console.error(err);process.exitCode=1;});
