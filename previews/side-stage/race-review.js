/* Art Forge real-race review: one factually resolved event, three real DEV shot phases. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const motion=$('motion-workspace'),review=$('real-race-workspace');
 const canvas=$('race-stage'),ctx=canvas.getContext('2d');
 const run=ScrapSeed18DebrisReview.load(18),effect=run.event;
 const style={road:'#52696c',curb:'#ddc68e',ink:'#253e48',near:'#789893',mark:'#f2e7c9'};
 const phases=[['anticipation','Warning'],['reaction','Reaction'],['recovery','Recovery']];
 let elapsed=0,playing=false,last=null;
 function mode(which){
  motion.hidden=which!=='motion';review.hidden=which!=='race';
  $('mode-motion').setAttribute('aria-pressed',String(which==='motion'));
  $('mode-race').setAttribute('aria-pressed',String(which==='race'));
  last=null;if(which==='race')paint();
 }
 $('mode-motion').addEventListener('click',()=>mode('motion'));
 $('mode-race').addEventListener('click',()=>mode('race'));
 const formatTime=ms=>(ms/1000).toFixed(2)+' s';
 const slots=Object.entries(effect.damageBySlot||{}).filter(([,amount])=>amount>0);
 const title=ScrapEngine.eventDefinition(effect)?.title||'Flying Spare Parts';
 $('race-title').textContent=title;
 $('race-lap').textContent=run.manifest.raceNumber+' / '+run.shots[0].lap+
    ' of '+run.manifest.plannedLaps;
 $('race-key').textContent=effect.kind+':'+effect.key;
 $('race-damage').textContent=effect.damage>0?String(effect.damage)+' actual damage':'No actual damage (evasion)';
 $('race-slots').textContent=slots.length?slots.map(([slot,amount])=>slot+' -'+amount).join(' · '):'None';
 $('race-loadout').textContent=Object.entries(run.manifest.vehicle.loadout)
    .map(([slot,id])=>slot+': '+id).join(' / ');
 $('race-finish').textContent=run.result.failedSlot?'DNF':String(run.result.place)+' / 5';
 $('race-seek').max=run.durationMs;
 $('race-reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(let i=0;i<phases.length;i++){
  const [phase,label]=phases[i],shot=run.shots[i];
  const button=document.createElement('button');button.type='button';
  button.textContent=label+' · '+formatTime(shot.durationMs);
  button.dataset.reviewPhase=phase;
  button.addEventListener('click',()=>{
   elapsed=shot.startMs-run.clipStartMs;playing=false;last=null;paint();
  });
  $('race-phase-buttons').append(button);
 }
 function horizon(){
  ctx.fillStyle='#c6ded8';ctx.fillRect(0,0,480,270);
  ctx.fillStyle='#abc6c5';ctx.fillRect(0,66,480,53);
  ctx.fillStyle='#819fa1';ctx.beginPath();
  ctx.moveTo(0,91);ctx.lineTo(56,58);ctx.lineTo(91,81);
  ctx.lineTo(159,45);ctx.lineTo(213,85);ctx.lineTo(304,54);
  ctx.lineTo(360,80);ctx.lineTo(432,62);ctx.lineTo(480,83);
  ctx.lineTo(480,127);ctx.lineTo(0,127);ctx.fill();
  ctx.fillStyle='#e3ebdf';ctx.fillRect(0,0,480,5);
 }
 function current(){
  // The end of this clip is the next shot boundary. Stay on the final frame.
  return ScrapRaceDirector.sample(run.storyboard,
   run.clipStartMs+Math.min(elapsed,run.durationMs-.001)).shot;
 }
 function paint(){
  const shot=current(),phase=shot.debris.phase,absolute=run.clipStartMs+elapsed;
  ctx.clearRect(0,0,480,270);horizon();
  ScrapOrdinaryFilm.trackside(ctx,style,shot,{
   loadout:run.manifest.vehicle.loadout,time:absolute,motion:!$('race-reduced').checked
  });
  const pose=canvas.dataset.sideStage?JSON.parse(canvas.dataset.sideStage).pose:null;
  canvas.dataset.phase=phase;canvas.dataset.camera=shot.camera;
  canvas.dataset.source=effect.id;canvas.dataset.eventKey=effect.key;
  canvas.dataset.damage=effect.damage;
  canvas.dataset.timeMs=String(Math.round(elapsed));
  canvas.dataset.action=pose?.action||'anticipation';
  $('race-shot').textContent=phase+' / '+shot.camera;
  $('race-clock').textContent=formatTime(elapsed)+' / '+formatTime(run.durationMs);
  $('race-seek').value=String(Math.round(elapsed));
  $('race-live').textContent='Phase: '+phase+'  |  Camera: '+shot.camera+
    '  |  Animation: '+(pose?.action||'approaching debris')+
    '\nEvent clock '+formatTime(elapsed)+'  |  Real damage '+effect.damage+
    '  |  Source '+effect.kind+':'+effect.key;
  for(const button of $('race-phase-buttons').children)
   button.setAttribute('aria-current',String(button.dataset.reviewPhase===phase));
  $('race-play').textContent=playing?'Pause':'Play';
  $('race-play').setAttribute('aria-pressed',String(playing));
 }
 function jump(ms){elapsed=Math.max(0,Math.min(run.durationMs,ms));playing=false;last=null;paint();}
 $('race-play').addEventListener('click',()=>{
  if(elapsed>=run.durationMs)elapsed=0;
  playing=!playing;last=null;paint();
 });
 $('race-restart').addEventListener('click',()=>jump(0));
 $('race-step').addEventListener('click',()=>jump(elapsed+1000/30));
 $('race-seek').addEventListener('input',()=>jump(Number($('race-seek').value)));
 $('race-reduced').addEventListener('change',paint);
 $('race-snapshot').addEventListener('click',()=>{
  const link=document.createElement('a');
  link.href=canvas.toDataURL('image/png');link.download='scrap-prix-seed18-'+
   canvas.dataset.phase+'-'+canvas.dataset.timeMs+'ms.png';link.click();
 });
 $('race-export').addEventListener('click',()=>{
  $('race-json').value=JSON.stringify({
   seed:run.seed,raceNumber:run.manifest.raceNumber,lap:run.shots[0].lap,
   event:run.event,loadout:run.manifest.vehicle.loadout,shots:run.shots.map(s=>({
    phase:s.debris.phase,camera:s.camera,startMs:s.startMs-run.clipStartMs,durationMs:s.durationMs
   })),timeMs:Math.round(elapsed),playbackSpeed:Number($('race-speed').value),
   reducedMotion:$('race-reduced').checked
  },null,2);
 });
 function frame(now){
  if(last!==null&&playing&&!document.hidden&&!review.hidden){
   elapsed+=Math.min(100,Math.max(0,now-last))*Number($('race-speed').value);
   if(elapsed>=run.durationMs){
    if($('race-loop').checked)elapsed=elapsed%run.durationMs;
    else{elapsed=run.durationMs;playing=false;}
   }
  }
  last=now;
  if(!review.hidden)paint();
  requestAnimationFrame(frame);
 }
 paint();requestAnimationFrame(frame);
})();
