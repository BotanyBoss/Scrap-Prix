/* Check the source-backed preview in Chromium, without external test packages. */
const assert=require('node:assert/strict'),{spawn,spawnSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const chromePath=process.env.CHROME_PATH||
 ['google-chrome','chromium','chromium-browser'].find(c=>spawnSync('which',[c]).status===0);
if(!chromePath){console.log('SKIP seed-18 browser check: no Chrome/Chromium found');process.exit(0)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'scrap-seed18-'));
 const port=9700+Math.floor(Math.random()*300);
 const chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu',
  '--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 const errors=[];
 try{
  let target;
  for(let i=0;i<65&&!target;i++){
   try{target=(await (await fetch('http://127.0.0.1:'+port+'/json')).json()).find(t=>t.type==='page')}
   catch(_){await sleep(150)}
  }
  assert(target,'Chromium did not start');
  const ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
  let id=0;const requests=new Map();
  ws.onmessage=event=>{
   const response=JSON.parse(event.data);
   if(response.id&&requests.has(response.id)){requests.get(response.id)(response);requests.delete(response.id);return}
   if(response.method==='Runtime.exceptionThrown')
    errors.push(response.params.exceptionDetails.exception?.description||response.params.exceptionDetails.text);
   if(response.method==='Runtime.consoleAPICalled'&&response.params.type==='error')
    errors.push('console.error in browser');
  };
  const send=(method,params={})=>new Promise(resolve=>{
   const next=++id;requests.set(next,resolve);ws.send(JSON.stringify({id:next,method,params}));
  });
  const evalJS=async expression=>{
   const reply=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
   if(reply.result.exceptionDetails)throw Error(reply.result.exceptionDetails.text);
   return reply.result.result.value;
  };
  await send('Runtime.enable');await send('Page.enable');
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,'../dist/SIDE-STAGE.html')).href});
  await sleep(1100);
  assert.equal(await evalJS('document.title'),'Scrap Prix · Side animation stage');
  assert(await evalJS("document.querySelector('#stage')?.width===480"),'Original motion viewer missing');
  assert(await evalJS("!!document.querySelector('#mode-race')"),'Race review mode missing');
  await evalJS("document.getElementById('mode-race').click()");
  const basics=await evalJS("(()=>{const c=document.getElementById('race-stage');return [c.dataset.phase,c.dataset.camera,c.dataset.source,Number(c.dataset.damage),document.getElementById('real-race-workspace').hidden]})()");
  assert.deepEqual(basics.slice(0,3),['anticipation','front','debris']);
  assert(Number.isFinite(basics[3]));assert.equal(basics[4],false);
  for(const [phase,camera] of [['reaction','side'],['recovery','side']]){
   const result=await evalJS("(()=>{document.querySelector('[data-review-phase="+JSON.stringify(phase)+"]').click();const c=document.getElementById('race-stage');return [c.dataset.phase,c.dataset.camera,c.toDataURL().length]})()");
   assert.equal(result[0],phase);assert.equal(result[1],camera);
   assert(result[2]>1000,'Blank '+phase+' preview');
  }
  await evalJS("document.getElementById('race-reduced').click()");
  await evalJS('document.querySelector("[data-review-phase=reaction]").click()');
  assert.equal(await evalJS("document.getElementById('race-stage').dataset.action"),'reduced motion');
  await evalJS("document.getElementById('race-reduced').click()");
  await evalJS("document.getElementById('race-restart').click()");
  const before=Number(await evalJS("document.getElementById('race-stage').dataset.timeMs"));
  await evalJS("document.getElementById('race-speed').value='4';document.getElementById('race-play').click()");
  await sleep(280);
  const after=Number(await evalJS("document.getElementById('race-stage').dataset.timeMs"));
  assert(after>before,'Animation clock did not advance');
  await evalJS("document.getElementById('race-play').click()");
  await evalJS("document.getElementById('race-export').click()");
  assert.equal(await evalJS("JSON.parse(document.getElementById('race-json').value).seed"),18);
  await evalJS("document.getElementById('mode-motion').click()");
  assert.equal(await evalJS("document.getElementById('motion-workspace').hidden"),false);
  assert.deepEqual(errors,[],'Page script errors: '+errors.join('\n'));
  console.log('PASS seed-18 Side Stage browser: real event, camera phases, reduced motion, playback, original mode');
  ws.close();
 }finally{
  chrome.kill();
  await new Promise(resolve=>{chrome.once('exit',resolve);setTimeout(resolve,1800)});
  fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:200});
 }
})().catch(error=>{console.error('FAIL seed-18 browser:',error);process.exitCode=1});
