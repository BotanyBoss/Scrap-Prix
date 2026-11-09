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
    // Garage noticeboard: separate tab, one rotating offer + three owned sheets.
    assert(await click('shop'),'Shop should open from garage');
    await sleep(160);
    assert(await click('shop-tab'),'Bounty tab switch exists');
    // First tab is PARTS; switch deliberately to the bounty board.
    await evaluate("document.querySelector('[data-action=shop-tab][data-id=bounties]').click()");
    await sleep(160);
    assert.equal(await evaluate("document.querySelectorAll('.bounty-board-rail .bounty-sheet').length"),4,'Bounty board has exactly four sideways sheets');
    assert.equal(await evaluate("document.querySelectorAll('.bounty-sheet-empty').length"),3,'Three owned slots begin empty');
    assert(await evaluate("!!document.querySelector('.bounty-sheet-offer [data-action=accept-bounty]')"),'One offer remains available while slots are empty');
    assert(await click('accept-bounty'),'Accept bounty button should work');
    assert(await evaluate("document.getElementById('confirm-modal').open"),'Bounty acceptance requires confirmation');
    assert(await click('confirm-ok'),'Must be able to confirm bounty');
    await sleep(180);
    assert.equal(await evaluate("document.querySelector('.bounty-sheet-offer [data-action=accept-bounty]').disabled"),true,'Only one new bounty may be accepted per race');
    assert.equal(await evaluate("document.querySelectorAll('.bounty-sheet-active').length"),1,'Accepted contract appears on the noticeboard');
    assert(await click('cancel-bounty'),'Active contract can be abandoned');
    assert(await evaluate("document.getElementById('confirm-modal').open"),'Cancellation must warn about automatic failure');
    assert(await click('confirm-ok'),'Cancel confirmation should work');
    await sleep(130);
    assert.equal(await evaluate("document.querySelectorAll('.bounty-sheet-active').length"),0,'Abandoning frees the slot immediately');
    assert.equal(await evaluate("document.querySelectorAll('.bounty-sheet-empty').length"),3);
    assert(await click('close-modal'),'Shop / Bounties should close');


    const startSeed=async()=>{
      await click('settings');
      await evaluate(`document.getElementById('seed-input').value='430013945'`);
      await click('seed');await click('confirm-ok');
      assert.equal(await screen(),'garage','Seeded run should land in the garage');
    };
    const advanceToChoice=async()=>{
      for(let i=0;i<30&&(await screen())==='race';i++){
        if(await evaluate(`!!document.querySelector('[data-action="event-choice"][data-id="risk"]')`))return;
        await click('next-phase');
      }
      assert.fail('Seeded race did not reach its route choice');
    };
    const savedChoice=()=>evaluate(`JSON.parse(localStorage.getItem('scrap-prix-v0400-systems-run-v21')).history.at(-1).laps.flatMap(l=>l.effects).find(e=>e.choiceEvent)?.choice`);
    await startSeed();
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
    for(const approach of ['careful','balanced','reckless']){
      await evaluate(`document.querySelector('[data-action="approach"][data-id="${approach}"]').click()`);
      const layout=await evaluate(`(()=>{const panel=document.querySelector('.next-race').getBoundingClientRect(),note=document.querySelector('.approach-info').getBoundingClientRect(),next=document.querySelector('.garage-top').nextElementSibling.getBoundingClientRect();return {panelBottom:panel.bottom,noteBottom:note.bottom,nextTop:next.top}})()`);
      assert(layout.noteBottom<=layout.panelBottom&&layout.panelBottom<=layout.nextTop,`${approach} description overflows the mobile garage panel: ${JSON.stringify(layout)}`);
    }
    await click('settings');
    await evaluate(`document.getElementById('setting-autoplay').click()`);
    await click('close-modal');
    assert(await click('race'),'No race button in the garage');
    await sleep(500);
    assert.equal(await screen(),'race','Race should open');
    const visible=await evaluate(`(()=>{const r=document.querySelector('[data-action="next-phase"]').getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth})()`);
    assert(visible,'Manual replay Next button should be visible on mobile');
    await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
    assert(await evaluate(`(()=>{const r=document.querySelector('[data-action="next-phase"]').getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth})()`),'Manual replay Next button should be visible on desktop');
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
    const before=await evaluate(`document.getElementById('race-progress').value`);
    await click('next-phase');
    assert((await evaluate(`document.getElementById('race-progress').value`))>before,'Next should advance the manual replay');
    await advanceToChoice();
    await click('skip');
    assert(await evaluate(`document.getElementById('confirm-modal').open&&document.getElementById('confirm-content').textContent.includes('safe route')`),'First skip should explain safe routes');
    await click('confirm-cancel');
    assert.equal(await screen(),'race','Cancelling skip should keep the replay');
    assert(await evaluate(`!!document.querySelector('[data-action="event-choice"][data-id="risk"]')`),'Cancelling skip should leave the choice available');
    await click('skip');
    await click('confirm-ok');
    assert.equal(await screen(),'result','Confirming skip should show the result');
    assert.equal(await savedChoice(),'safe','Skipping an unresolved route should retain the safe default');
    assert.equal(await evaluate(`localStorage.getItem('scrap-prix-skip-hint-seen')`),'1','Skip explanation should be remembered');
    await click('continue');
    assert.equal(await screen(),'garage','Continue should return to garage');
    await send('Page.reload');
    await sleep(1000);
    await click('continue-title');
    assert.equal(await screen(),'garage','Saved run should resume after reload');
    await startSeed();
    await send('Emulation.setDeviceMetricsOverride',{width:480,height:270,deviceScaleFactor:1,mobile:false});
    await click('race');
    await sleep(300);
    await advanceToChoice();
    const choiceLayout=await evaluate(`(()=>{const node=document.getElementById('event-box'),card=node.getBoundingClientRect(),controls=document.querySelector('.race-controls').getBoundingClientRect(),buttons=[...document.querySelectorAll('[data-action="event-choice"]')].map(b=>b.getBoundingClientRect().bottom);return {cardBottom:card.bottom,controlsTop:controls.top,buttons,text:node.innerText,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight}})()`);
    assert(choiceLayout.cardBottom<=choiceLayout.controlsTop,`Landscape choice and replay controls should not overlap: ${JSON.stringify(choiceLayout)}`);
    assert(choiceLayout.buttons.every(bottom=>bottom<=choiceLayout.cardBottom),`Landscape route choices should fit inside the card: ${JSON.stringify(choiceLayout)}`);
    await evaluate(`document.querySelector('[data-action="event-choice"][data-id="risk"]').click()`);
    await click('skip');
    assert.equal(await screen(),'result','Later skips should not repeat the explanation');
    assert.equal(await savedChoice(),'risk','Skipping should keep a route choice already made');
    await click('continue');await click('settings');
    await evaluate(`document.getElementById('setting-autoplay').click()`);
    await click('close-modal');
    await evaluate(`localStorage.removeItem('scrap-prix-skip-hint-seen')`);
    await send('Page.reload');await sleep(1000);await click('continue-title');
    await click('race');await sleep(300);await click('skip');
    assert(await evaluate(`document.getElementById('confirm-modal').open`),'Reset skip hint should open');
    const pausedAt=await evaluate(`document.getElementById('race-progress').value`);
    await sleep(1000);
    assert.equal(await evaluate(`document.getElementById('race-progress').value`),pausedAt,'The race must pause while the skip explanation is open');
    await click('confirm-cancel');await sleep(500);
    assert((await evaluate(`document.getElementById('race-progress').value`))>pausedAt,'The race should resume after cancelling the explanation');
    await evaluate(`(()=>{const s=ScrapEngine.newRun(430013945);s.durability.engine=25;s.durability.tyres=1;s.durability.chassis=1;s.wrenches=10;localStorage.setItem('scrap-prix-v0400-systems-run-v21',ScrapEngine.encodeSave(s));})()`);
    await send('Page.reload');await sleep(1000);await click('continue-title');
    for(const slot of ['engine','tyres']){
      const warning=await evaluate(`document.querySelector('[data-slot="${slot}"] .part-risk')?.textContent`);
      assert(warning?.includes('DNF')&&warning.includes('no rewards and no strike')&&warning.includes('no start and +1 strike'),`${slot} should explain both failure outcomes`);
    }
    assert(!(await evaluate(`document.querySelector('[data-slot="chassis"] .part-risk')`)),'A worn chassis should not display an engine/tyre failure warning');
    await evaluate(`document.querySelector('[data-action="repair"][data-id="engine"]').click()`);
    assert(!(await evaluate(`document.querySelector('[data-slot="engine"] .part-risk')`)),'Repairing above 25% should clear the warning');
    await evaluate(`(()=>{const s=ScrapEngine.newRun(430013945);s.durability.engine=0;s.durability.tyres=26;localStorage.setItem('scrap-prix-v0400-systems-run-v21',ScrapEngine.encodeSave(s));})()`);
    await send('Page.reload');await sleep(1000);await click('continue-title');
    assert(await evaluate(`document.querySelector('.start-warning')?.textContent.includes("WON'T START")`),'A 0% engine should show the no-start warning');
    assert(!(await evaluate(`document.querySelector('.part-risk')`)),'A broken engine and tyres above 25% should not show a critical risk warning');
    assert.deepEqual(errors,[],'Browser reported errors:\n'+errors.join('\n'));
    console.log('PASS: browser smoke test (mobile garage, manual replay and skip explanation) with no script errors.');
    ws.close();
  }finally{chrome.kill();await new Promise(r=>{chrome.once('exit',r);setTimeout(r,2000);});try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch(_){}}
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
