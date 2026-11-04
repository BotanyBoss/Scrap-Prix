/* Scrap Prix v0.7.21e — presentation-only shared timing director.
 * One elapsed clock drives the visible actor, FX and camera through a mapped
 * renderer timeline. These profiles NEVER affect seeded event selection,
 * physical damage, credits, standings, run state or saves.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapEventTiming=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
 const entry=(id,baseDuration,frames,labels,beats,kind,formula='bespoke')=>Object.freeze({
  id,baseDuration,frames:Object.freeze(frames),labels:Object.freeze(labels),
  beats:Object.freeze(beats),kind,formula,total:beats.reduce((s,n)=>s+n,0)
 });
 // Frame values are authored stage boundaries from the existing renderer.
 // Distinct real-time beat lengths change COMEDIC TIMING without rewriting the art.
 const LOCKED_PROFILES=Object.freeze({
  'cow':entry('cow',3400,[0,.15,.34,.68,.88,1],['Entrance','Approach','Stubborn pause','Finally moves','Exit'],[500,750,1400,1400,550],'ordinary'),
  'ghost-fake':entry('ghost-fake',1000,[0,.13,.43,.56,.70,1],['Ominous entrance','Apparition','False overtake','Dissolve','Real rival reveal'],[800,1300,1300,1000,850],'fake'),
  'clone-fake':entry('clone-fake',1000,[0,.13,.40,.57,.86,1],['Scanner arrives','Copy formed','Inferior clone passed','Superior clone escapes','Afterimage'],[750,1150,1350,1600,800],'fake'),
  'mirror-fake':entry('mirror-fake',1000,[0,.19,.41,.69,.85,1],['Reflective pane','Double appears','Copy peels away','Glass breaks','Return'],[850,1200,1250,1100,700],'fake'),
  'possessed-fake':entry('possessed-fake',1000,[0,.18,.40,.60,.73,1],['Unnatural silence','Engine possessed','False advantage','Possessed comeback','Afterglow'],[800,1050,1000,950,750],'fake'),
  'spring-trap':entry('spring-trap',1000,[0,.10,.32,.53,.80,1],['Road panel clue','Coil compresses','Launch','Suspended car','Scrap falls'],[800,1150,1250,1050,650],'special'),
  'ufo-pass':entry('ufo-pass',1000,[0,.16,.34,.44,.81,1],['Shadow overhead','Tractor beam','Rival resists','Abduction','Empty road'],[800,1150,950,1500,650],'special'),
  'shadow-pass':entry('shadow-pass',1000,[0,.23,.43,.64,.81,1],['Shadow stirs','Reaches','Clamps','Drags rival','Dissolves'],[800,900,950,1200,700],'special')
 });
 // Family templates preserve individual renderer keyframes, but share real-time pacing.
 // Original v0.7.21d hero profiles remain untouched. Shortcut passes are ALWAYS
 // presented inside their 9.5-second road scene, never as a detached pass clip.
 const FORMULAS=Object.freeze({
  'animal-pass':Object.freeze({kind:'special',ms:[550,650,1150,1000,550],frames:[0,.10,.34,.70,.88,1],labels:['Roadside clue','Animal enters','Rival reacts','Pass','Clear road'],base:1000}),
  'comic-pass':Object.freeze({kind:'special',ms:[650,1000,1000,1050,650],frames:[0,.16,.36,.63,.82,1],labels:['Unusual sight','The situation','Rival distracted','Overtake','Comedic end'],base:1000}),
  'impact-pass':Object.freeze({kind:'special',ms:[750,1050,1250,1200,700],frames:[0,.12,.43,.66,.85,1],labels:['Warning','Build tension','Impact','Rival displaced','Debris settles'],base:1000}),
  'giant-pass':Object.freeze({kind:'special',ms:[850,1250,1500,1350,750],frames:[0,.12,.39,.66,.87,1],labels:['Distant warning','Creature arrives','Huge contact','Rival removal','Aftermath'],base:1000}),
  'abduction-pass':Object.freeze({kind:'special',ms:[700,1050,1350,1550,700],frames:[0,.16,.36,.55,.86,1],labels:['Anomaly appears','Target acquired','Rival struggles','Abduction','Empty lane'],base:1000}),
  'fake-comeback':Object.freeze({kind:'fake',ms:[700,950,1200,1350,750],frames:[0,.15,.37,.59,.82,1],labels:['Something odd','False pass','Almost ahead','Sudden comeback','Back to racing'],base:1000}),
  'fake-magic':Object.freeze({kind:'fake',ms:[750,1000,1100,1350,800],frames:[0,.13,.37,.58,.85,1],labels:['Unexplained light','Disappearance','False advantage','Rival returns','Afterglow'],base:1000}),
  'animal':Object.freeze({kind:'ordinary',ms:[500,650,1250,1050,550],frames:[0,.12,.34,.68,.90,1],labels:['Roadside arrival','Approach','Crossing','Rival reaction','Exit'],base:3400}),
  'weather':Object.freeze({kind:'ordinary',ms:[350,600,1000,900,550],frames:[0,.16,.34,.70,.87,1],labels:['Weather builds','Arrival','Peak conditions','Clearing','Normal road'],base:3400}),
  'surface':Object.freeze({kind:'ordinary',ms:[450,600,900,950,550],frames:[0,.18,.35,.65,.86,1],labels:['Road warning','Approach','Surface hazard','Recovery','Clear road'],base:3400}),
  'obstacle':Object.freeze({kind:'ordinary',ms:[450,750,1050,1050,550],frames:[0,.13,.34,.67,.87,1],labels:['Object spotted','Approach','Hazard','Reaction','Exit'],base:3400}),
  'road-damage':Object.freeze({kind:'ordinary',ms:[650,800,1200,1200,650],frames:[0,.15,.33,.67,.87,1],labels:['Road warning','Structure fails','Main action','Shockwave','Debris settles'],base:3400}),
  'energy':Object.freeze({kind:'ordinary',ms:[600,900,1200,1250,650],frames:[0,.13,.38,.67,.87,1],labels:['Charge','Energy buildup','Discharge','Shockwave','Afterglow'],base:3400}),
  'route-choice':Object.freeze({kind:'ordinary',ms:[650,1050,1450,1450,600],frames:[0,.13,.36,.66,.87,1],labels:['Route appears','Approach','Choose route','Cross obstacle','Return'],base:3400})
 });
 const FAMILY_GROUPS=Object.freeze({
  'animal-pass':['duck-pass','goose-pass','boar-pass','bull-pass'],
  'comic-pass':['monologue'],
  'impact-pass':['lightning-pass','slash-pass','meteor-pass','stone-pass','coffin-pass','trebuchet-pass'],
  'giant-pass':['foot-pass','tail-pass','web-pass'],
  'abduction-pass':['tornado-pass','blackhole-pass','tentacle-pass','crab-pass'],
  'fake-comeback':['rival-awakening','weighted-spoiler'],
  'fake-magic':['ufo-fake'],
  'animal':['deer','sheep','ducks'],
  'weather':['downpour','fog','heatwave','crosswind','hail','storm-1','storm-2','storm-3'],
  'surface':['oil','flood','ice','potholes','sand','snow'],
  'obstacle':['cargo','pileup','grass','roadworks','debris','bins','gravel','clearline','delivery'],
  'road-damage':['crater','tremor-1','tremor-2','tremor-3'],
  'energy':['beam','mini-sun','sun-gaze','lab-2','lab-3','aura'],
  'route-choice':['ramp','bridge']
 });
 const generated={};
 for(const [formula,ids] of Object.entries(FAMILY_GROUPS))for(const id of ids){
  const t=FORMULAS[formula];
  generated[id]=entry(id,t.base,t.frames.slice(),t.labels.slice(),t.ms.slice(),t.kind,formula);
 }
 const PROFILES=Object.freeze({...generated,...LOCKED_PROFILES});
 const profile=id=>PROFILES[id]||null;
 const timingFamilies=()=>Object.freeze(Object.fromEntries(Object.entries(FAMILY_GROUPS).map(([k,v])=>[k,Object.freeze(v.slice())])));

 function beatsFor(id,override){
  const p=profile(id);if(!p)return null;
  return p.beats.map((n,i)=>Array.isArray(override)&&Number.isFinite(override[i])?clamp(Number(override[i]),200,4000):n);
 }
 function duration(id,override){const beats=beatsFor(id,override);return beats?beats.reduce((a,b)=>a+b,0):null;}
 function sample(id,elapsed,override){
  const p=profile(id);if(!p)return null;
  const beats=beatsFor(id,override),total=beats.reduce((a,b)=>a+b,0),t=clamp(elapsed,0,total);
  let start=0;
  for(let i=0;i<beats.length;i++){
   const end=start+beats[i];
   if(t<=end||i===beats.length-1){
    const local=clamp((t-start)/beats[i]);
    const normalized=p.frames[i]+(p.frames[i+1]-p.frames[i])*local;
    return {id,label:p.labels[i],index:i,beatElapsed:t-start,beatDuration:beats[i],elapsed:t,total,progress:t/total,visualProgress:normalized,visualTime:p.baseDuration*normalized};
   }
   start=end;
  }
  return null;
 }
 function mapTime(id,elapsed,override){const s=sample(id,elapsed,override);return s?s.visualTime:elapsed;}
 function overtakeState(original,replay,elapsed){
  const state=original(replay,elapsed);
  if(!replay?.steps?.some(step=>step.presentationPass))return state;
  const drivingDuration=Math.max(1,replay.total-replay.steps.at(-1).duration),total=state.total;
  const timed=[];let ms=0;
  for(const step of replay.steps){
   if(step.presentationPass)timed.push({...step.presentationPass,start:ms,end:ms+step.duration});
   ms+=step.duration;
  }
  const scriptedSpecials=new Set(timed.filter(x=>x.kind==='special').map(x=>x.id));
  const scriptedFakes=new Set(timed.filter(x=>x.kind==='fake').map(x=>x.id));
  const anchors=new Map();
  for(const window of timed){
   const time=window.kind==='special'?window.end-.16*(window.end-window.start):window.end+550;
   anchors.set(window.index,Math.max(anchors.get(window.index)||0,clamp(time/drivingDuration,.07,.965)));
  }
  // Keep existing gag-shortcut passes anchored to their full route sequence.
  const shortcuts=(replay.result.passEvents||[]).filter(e=>/shortcut-pass$/.test(e.id));
  if(shortcuts.length){
   ms=0;
   for(const step of replay.steps){
    for(const e of shortcuts){
     if(step.sourceId===e.triggerId&&step.id.startsWith((e.triggerKey||'')+'-'))
      anchors.set(e.index,clamp((ms+.80*step.duration)/drivingDuration,.07,.96));
    }
    ms+=step.duration;
   }
  }
  const crossings=[...state.crossings];
  if(anchors.size&&total>0){
   const points=[{index:-1,time:.055},...Array.from(anchors,([index,time])=>({index,time})).sort((a,b)=>a.index-b.index),{index:total,time:.985}];
   for(let i=1;i<points.length;i++)points[i].time=Math.min(.992,Math.max(points[i].time,points[i-1].time+.016*(points[i].index-points[i-1].index)));
   for(let j=0;j<total;j++){
    let n=1;while(n<points.length-1&&points[n].index<j)n++;
    const a=points[n-1],b=points[n],w=(j-a.index)/(b.index-a.index);
    crossings[j]=a.time+(b.time-a.time)*w;
   }
  }
  state.crossings=crossings;
  state.passed=crossings.filter(time=>state.progress>=time).length;
  state.position=5-state.passed;
  if(state.special&&scriptedSpecials.has(state.special.id))state.special=null;
  if(state.fake&&scriptedFakes.has(state.fake.id))state.fake=null;
  const active=timed.find(x=>elapsed>=x.start&&elapsed<x.end);
  if(active){
   state.presentation=active;
   const shown={id:active.id,index:active.index,local:clamp((elapsed-active.start)/(active.end-active.start))};
   if(active.kind==='special'){state.special=shown;state.fake=null;}
   else{state.fake=shown;state.special=null;}
  }
  return state;
 }
 // Choice decisions can change the finishing position, which in turn changes
 // previously inserted cinematic overtakes. Re-anchor to the SAME scene after
 // recomputing the deterministic race rather than reusing an obsolete absolute
 // clock and unexpectedly jumping to an earlier lap or skipping the choice.
 function reanchorScene(replay,id,elapsedInScene=0){
  if(!replay||!Array.isArray(replay.steps)||typeof id!=='string')throw Error('Invalid replay scene anchor.');
  let start=0;
  for(const step of replay.steps){
   if(step.id===id){
    const offset=Number.isFinite(elapsedInScene)?Math.max(0,elapsedInScene):0;
    return Math.min(replay.total, start+Math.min(offset,Math.max(0,step.duration-1)));
   }
   start+=step.duration;
  }
  throw Error('Replay scene anchor is missing: '+id);
 }
 function cinematicMarkers(replay,engine){
  if(!replay?.result||!engine)return [];
  const result=replay.result,total=Math.max(0,5-(result.failedSlot?5:result.place));
  const items=[];
  for(const [kind,source,lookup] of [['fake',result.fakePassEvents,'fakePassEvent'],['special',result.passEvents,'passEvent']]){
   for(const e of source||[]){
    if(!Number.isInteger(e.index)||e.index<0||e.index>=total)continue;
    const def=engine[lookup](e.id);if(!def||def.motion==='shortcut'||!profile(def.visual)||profile(def.visual).kind!==kind)continue;
    items.push({kind,id:e.id,index:e.index,visual:def.visual,definition:def,duration:duration(def.visual)});
   }
  }
  return items.sort((a,b)=>a.index-b.index||(a.kind==='fake'?-1:1));
 }
 // Insert *presentation-only* beats between normal lap scenes. The engine's
 // precomputed pass events and final positions remain the sole authority.
 // Re-creating a replay from a resolved choice produces the same step schedule.
 function prepareReplay(replay,engine){
  if(!replay||replay.timingPrepared)return replay;
  for(const step of replay.steps){
   const p=profile(step.event);
   if(p&&p.kind==='ordinary')step.duration=Math.max(step.duration,p.total);
  }
  const markers=cinematicMarkers(replay,engine);
  if(markers.length){
   const lapCount=replay.result.lapCount||3,total=Math.max(1,5-(replay.result.failedSlot?5:replay.result.place));
   const byLap=new Map();
   for(const marker of markers){
    const lap=Math.max(1,Math.min(lapCount,1+Math.floor(marker.index*lapCount/total)));
    if(!byLap.has(lap))byLap.set(lap,[]);
    byLap.get(lap).push(marker);
   }
   const steps=[],done=new Set();
   for(let i=0;i<replay.steps.length;i++){
    const step=replay.steps[i];steps.push(step);
    const next=replay.steps[i+1];
    if(step.id==='finish'||!step.lap||done.has(step.lap)||next?.lap===step.lap)continue;
    done.add(step.lap);
    for(const marker of byLap.get(step.lap)||[]){
     steps.push({id:`cinematic-${marker.kind}-${marker.id}-${marker.index}`,lap:step.lap,
      label:marker.kind==='fake'?'RIVAL COMEBACK':'SPECIAL OVERTAKE',
      title:marker.definition.title,copy:marker.definition.text,duration:marker.duration,
      event:marker.visual,sourceId:marker.id,weatherId:step.weatherId,
      presentationPass:Object.freeze({kind:marker.kind,id:marker.id,index:marker.index,visual:marker.visual})});
    }
   }
   replay.steps=steps;
  }
  replay.total=replay.steps.reduce((s,step)=>s+step.duration,0);
  replay.timingPrepared=true;
  return replay;
 }
 return Object.freeze({PROFILES,FORMULAS,FAMILY_GROUPS,profile,timingFamilies,beatsFor,duration,sample,mapTime,overtakeState,cinematicMarkers,prepareReplay,reanchorScene});
});
