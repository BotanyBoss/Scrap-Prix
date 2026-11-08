// Verify in real Chromium: bounty payouts, post-contract condition and restored results.
const {spawn,spawnSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),page='file://'+path.join(root,'dist/index.html');
const chromePath=process.env.CHROME_PATH||['google-chrome','chromium','chromium-browser'].find(c=>spawnSync('which',[c]).status===0);
if(!chromePath){console.log('SKIP: Chrome/Chromium not installed.');process.exit(0);}
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'scrap-bounty-result-'));
 const port=9700+Math.floor(Math.random()*600);
 const chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--remote-debugging-port='+port,'--user-data-dir='+profile,'--window-size=1280,880','about:blank'],{stdio:'ignore'});
 let ws;const errors=[];
 try{
   let target;
   for(let i=0;i<60&&!target;i++){await pause(200);try{
     const all=await(await fetch('http://127.0.0.1:'+port+'/json')).json();target=all.find(x=>x.type==='page');
   }catch{}}
   assert(target,'Chromium did not start');
   ws=new WebSocket(target.webSocketDebuggerUrl);
   await new Promise((yes,no)=>{ws.onopen=yes;ws.onerror=no;});
   const pending=new Map();let seq=0;
   ws.onmessage=ev=>{
     const m=JSON.parse(ev.data);
     if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}
     if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
     if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(x=>x.value||x.description).join(' '));
   };
   const send=(method,params={})=>new Promise(resolve=>{const id=++seq;pending.set(id,resolve);ws.send(JSON.stringify({id,method,params}));});
   const evalJs=async expr=>{
     const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
     if(r.result.exceptionDetails)throw Error(r.result.exceptionDetails.text||'Browser expression error');
     return r.result.result.value;
   };
   await send('Runtime.enable');await send('Page.enable');
   await send('Page.navigate',{url:page});await pause(1600);
   const expected=await evalJs([
     '(()=>{',
     ' const E=window.ScrapEngine,s=E.newRun(582);',
     ' s.durability={engine:100,tyres:100,chassis:25,gadget:100};',
     " s.bounties=[{id:'survivor',remaining:1,progress:1},{id:'worn',remaining:1,progress:0}];",
     ' const done=E.race(s),r=done.history.at(-1);',
     ' if(r.bountyResults?.length!==2||!r.bountyResults.every(x=>x.success))throw Error("Fixture did not complete both contracts");',
     " localStorage.setItem('scrap-prix-v0400-systems-run-v21',E.encodeSave(done));",
     ' return {raceWrenches:r.wrenchDrop,bountyWrenches:r.bountyWrenches,endOfRace:r.durabilityAfter.chassis,garageChassis:done.durability.chassis};',
     '})()'
   ].join(''));
   assert.equal(expected.bountyWrenches,1);
   assert(expected.garageChassis>expected.endOfRace);
   await send('Page.reload',{ignoreCache:true});await pause(1500);
   const resumed=await evalJs("(()=>{const b=document.querySelector('[data-action=\"continue-title\"]');if(!b)return false;b.click();return true;})()");
   assert(resumed,'Saved run must be loadable');
   await pause(700);
   const finish=await evalJs("({screen:document.getElementById('game')?.dataset.screen,settlement:document.querySelector('.bounty-results')?.textContent})");
   assert.equal(finish.screen,'result');
   assert(finish.settlement.includes('BOUNTIES +1'),'Report omitted bounty bonus');
   assert(finish.settlement.includes('RACE +'+expected.raceWrenches),'Report omitted race wrench drop');
   assert(finish.settlement.includes('TOTAL +'+(expected.raceWrenches+1)),'Report did not reconcile wrench total');
   assert(finish.settlement.toLowerCase().includes('chassis'),'Report omitted patched part');
   const details=await evalJs("(()=>{document.querySelector('[data-action=\"result-tab\"][data-id=\"details\"]').click();return {now:document.querySelector('.condition-row[data-slot=\"chassis\"] .condition-now b')?.textContent,explanation:document.querySelector('.condition-row[data-slot=\"chassis\"] .settlement-condition')?.textContent,settlement:document.querySelector('.result-main .bounty-results')?.textContent};})()");
   assert.equal(details.now,expected.garageChassis+'%','Breakdown did not show final garage condition');
   assert(details.explanation.includes('After race: '+expected.endOfRace+'%'),'Missing pre-reward condition');
   assert(details.settlement.includes('BOUNTIES +1'));
   assert.deepEqual(errors,[]);
   console.log('PASS: bounty payout, race drop, final condition and reload displayed correctly in Chromium.');
   console.log(JSON.stringify({expected,summary:finish.settlement.slice(0,155),details}));
 }finally{
   if(ws&&ws.readyState===WebSocket.OPEN)ws.close();
   chrome.kill('SIGTERM');
   await pause(650);
   // Chromium may still be flushing profile data after the browser assertions succeed.
   fs.rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:250});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
