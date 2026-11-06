// Headless-browser smoke test: loads the built game, starts a run, races, and fails on any script error.
// Needs Google Chrome/Chromium (set CHROME_PATH to override) and Node 22+ (global WebSocket).
const {spawn}=require('child_process'),fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),page='file://'+path.join(root,'dist/index.html');
const chromePath=process.env.CHROME_PATH||['google-chrome','chromium','chromium-browser'].find(c=>{try{return require('child_process').spawnSync('which',[c]).status===0;}catch(_){return false;}});
if(!chromePath){console.log('SKIP: no Chrome/Chromium found.');process.exit(0);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'scrap-smoke-'));
  const port=9300+Math.floor(Math.random()*500);
  const chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--window-size=1280,820','about:blank'],{stdio:'ignore'});
  const errors=[];
  try{
    let target;
    for(let i=0;i<50&&!target;i++){try{target=(await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t=>t.type==='page');}catch(_){await sleep(200);}}
    assert(target,'Chrome did not start');
    const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
    let id=0;const pending=new Map();
    ws.onmessage=ev=>{
      const msg=JSON.parse(ev.data);
      if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);return;}
      if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.exception?.description||msg.params.exceptionDetails.text);
      if(msg.method==='Runtime.consoleAPICalled'&&msg.params.type==='error')errors.push('console.error: '+msg.params.args.map(a=>a.value??a.description).join(' '));
      if(msg.method==='Log.entryAdded'&&msg.params.entry.level==='error')errors.push('log: '+msg.params.entry.text+' '+(msg.params.entry.url||''));
    };
    const send=(method,params={})=>new Promise(res=>{const i=++id;pending.set(i,res);ws.send(JSON.stringify({id:i,method,params}));});
    const evaluate=async expr=>(await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result.result.value;
    await send('Runtime.enable');await send('Log.enable');await send('Page.enable');
    await send('Page.navigate',{url:page});
    await sleep(2500);

    const screen=()=>evaluate(`document.getElementById('game').dataset.screen`);
    assert.equal(await screen(),'title','Game should open on the title screen');
    const click=action=>evaluate(`(()=>{const b=document.querySelector('[data-action="${action}"]');if(!b)return false;b.click();return true;})()`);

    assert(await click('new'),'No "new run" button on the title screen');
    await sleep(800);
    if(await evaluate(`!!document.querySelector('[data-action="confirm-ok"]')&&document.getElementById('confirm-modal').open`))await click('confirm-ok'),await sleep(800);
    assert.equal(await screen(),'garage','New run should land in the garage');

    assert(await click('race'),'No race button in the garage');
    await sleep(1500);
    for(let i=0;i<30&&(await screen())==='race';i++){
      await click('skip');await evaluate(`document.querySelector('[data-action="event-choice"]')?.click()`);await sleep(1000);
    }
    const end=await screen();
    assert(['result','garage'].includes(end),`Race ended on unexpected screen: ${end}`);
    assert.deepEqual(errors,[],'Browser reported errors:\n'+errors.join('\n'));
    console.log(`PASS: browser smoke test (title → garage → race → ${end}) with no script errors.`);
    ws.close();
  }finally{chrome.kill();await new Promise(r=>{chrome.once('exit',r);setTimeout(r,2000);});try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch(_){}}
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
