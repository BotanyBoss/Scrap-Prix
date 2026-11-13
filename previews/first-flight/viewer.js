(async function(){
  'use strict';
  const $=id=>document.getElementById(id),E=ScrapEngine,D=ScrapRaceDirector;
  const cam=firstFlightCamera($('film'));
  let before,event,definition,story,submitted,time=0,anchor=0,base=0,playing=false,rate=1;
  const hold=()=>story.shots.find(s=>s.holdForInput);
  const waiting=()=>!submitted&&time>=hold().startMs;
  const rebase=()=>{anchor=performance.now();base=time};
  function resolve(choice){
    const after=E.race(before,{[event.key]:choice});
    story=D.plan(ScrapRaceManifest.fromResolvedRace(before,after),{eventKey:event.key});
  }
  function reset(){
    before=E.newRun(Number($('seed').value));
    event=E.raceCard(before.seed,before.raceIndex,before).events.find(e=>e.id===D.EVENT_ID);
    definition=E.eventDefinition(event);resolve('safe');submitted=false;time=0;playing=true;rebase();
    $('safe').textContent=definition.choice.safeLabel;$('risk').textContent=definition.choice.riskLabel;
    $('prompt').textContent=definition.choice.prompt;
    $('parts').textContent=Object.values(story.vehicleLoadout).map(id=>E.part(id).name).join(' · ');
    $('source').textContent='Seed '+before.seed+' · race '+story.source.race+' · lap '+story.source.lap+' · '+story.source.key+' / '+story.setting.trackId+' / '+story.setting.weatherId;
    $('seek').max=story.totalMs;render();
  }
  function limit(t){
    time=Math.min(Math.max(0,t),submitted?story.totalMs:hold().startMs);
    if(waiting()||time===story.totalMs)playing=false;
  }
  function tick(now){if(playing){limit(base+(now-anchor)*rate);render()}requestAnimationFrame(tick)}
  function render(){
    const f=D.sample(story,time);
    cam.paint(story,f,$('reduce').checked);
    $('film').dataset.shot=f.shot.id;
    $('clock').textContent=(time/1000).toFixed(1)+' / '+(story.totalMs/1000).toFixed(1)+' s';
    $('seek').value=Math.round(time);$('choice').hidden=!waiting();
    $('shot').textContent=(story.shots.indexOf(f.shot)+1)+'/7  ·  '+f.shot.motion.replaceAll('-',' ').toUpperCase();
    $('play').disabled=waiting();$('play').textContent=playing?'Pause':time===story.totalMs?'Replay':'Play';
    const r=story.readout, show=submitted&&time>=story.shots[4].startMs;
    const report=show?[r.outcomeText,'',...ScrapData.SLOTS.map(slot=>slot+': '+(r.damageBySlot[slot]||0)+' damage'),
      'Bridge damage: '+r.damage,'Performance: '+(r.scoreDelta>0?'+':'')+r.scoreDelta+' score','Credits: '+r.credits].join('\n'):
      waiting()?'Awaiting your route choice.':submitted?'Route selected.':'Approaching the broken span.';
    if($('facts').textContent!==report)$('facts').textContent=report;
  }
  function choose(value){if(!waiting())return;resolve(value);submitted=true;time=hold().startMs;playing=true;rebase();render()}
  $('safe').onclick=()=>choose('safe');$('risk').onclick=()=>choose('risk');
  $('skip').onclick=()=>{if(!submitted)submitted=true;time=story.totalMs;playing=false;render()}; // existing safe plan
  $('restart').onclick=reset;$('seed').onchange=reset;
  $('play').onclick=()=>{if(time===story.totalMs){time=0}playing=!playing;rebase();render()};
  $('seek').oninput=e=>{playing=false;limit(Number(e.target.value));rebase();render()};
  $('speed').onchange=e=>{if(playing)limit(base+(performance.now()-anchor)*rate);rate=parseInt(e.target.value,10);rebase();render()};
  $('reduce').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('reduce').onchange=render;$('native').onchange=e=>document.body.classList.toggle('native',e.target.checked);
  await cam.ready;reset();requestAnimationFrame(tick);
})().catch(e=>{document.getElementById('facts').textContent='Preview failed: '+e.message;console.error(e)});
