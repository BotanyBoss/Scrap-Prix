/* First Flight shot planner. No game RNG or render side effects.
 * Production template deliberately does not import this prototype.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ScrapRaceDirector=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const EVENT_ID='broken-bridge-jump';
  const VERSION=1;
  // Excludes the indefinite human decision pause.
  const DEFINITIONS={
    opening:['rear-three-quarter','racing',3100],
    bridgeApproach:['track-wide','bridge-reveal',4100],
    choice:['front-three-quarter','choice-hold',2100],
    detour:['side','safe-detour',5000],
    detourMerge:['rear-three-quarter','rejoin-detour',2200],
    lift:['side','jump-launch',5000],
    landing:['side','successful-landing',2200],
    failureFlight:['side','jump-launch',4500],
    impact:['component-closeup','failed-landing',2700],
    mechanical:['component-closeup','real-effects',3300],
    rejoin:['rear-three-quarter','resume-race',4500],
    dnf:['rear-three-quarter','terminal-stop',4500]
  };
  function plan(manifest,options={}){
    if(!manifest||manifest.version!==1||manifest.finish?.noStart||
       !manifest.vehicle?.loadout||!Array.isArray(manifest.laps))
      throw Error('Expected a real resolved Race Manifest.');
    const found=[];
    for(const lap of manifest.laps)for(const effect of lap.effects||[])
      if(effect.id===EVENT_ID&&effect.kind!=='wear'&&
         (!options.eventKey||effect.key===options.eventKey))
        found.push({lap,effect});
    if(found.length!==1)throw Error('Expected exactly one resolved Broken Bridge Jump.');
    const {lap,effect}=found[0];
    const branch=effect.choice==='safe'&&effect.outcome==='safe'?'safe':
      effect.choice==='risk'&&effect.outcome==='success'?'risk-success':
      effect.choice==='risk'&&effect.outcome==='failure'?'risk-failure':null;
    if(!branch)throw Error('Bridge choice has no valid resolved outcome.');
    const fatal=!!manifest.finish.failedSlot&&
      manifest.finish.failureLap===lap.lap&&
      lap.effects.at(-1)?.index===effect.index;
    const source={race:manifest.raceNumber,lap:lap.lap,kind:effect.kind,
      id:effect.id,key:effect.key,index:effect.index};
    const loadout=clone(manifest.vehicle.loadout);
    const readout={choice:effect.choice,outcome:effect.outcome,
      outcomeText:effect.outcomeText,damage:effect.damage,
      damageBySlot:clone(effect.damageBySlot),
      scoreDelta:effect.scoreDelta,credits:effect.credits};
    let at=0;
    const shots=[];
    function shot(id,props={}){
      const [camera,motion,durationMs]=DEFINITIONS[id];
      shots.push({id,camera,motion,durationMs,startMs:at,endMs:at+durationMs,
        source:clone(source),vehicleLoadout:clone(loadout),...props});
      at+=durationMs;
    }
    shot('opening',{kind:'race',setting:clone(manifest.setting)});
    shot('bridgeApproach',{kind:'event',setting:clone(manifest.setting)});
    shot('choice',{kind:'choice',holdForInput:true,
      choiceKey:effect.key,selectedChoice:effect.choice});
    if(branch==='safe'){shot('detour',{kind:'branch'});shot('detourMerge',{kind:'branch'});}
    else if(branch==='risk-success'){shot('lift',{kind:'branch'});shot('landing',{kind:'branch'});}
    else{shot('failureFlight',{kind:'branch'});shot('impact',{kind:'branch'});}
    shot('mechanical',{kind:'feedback',readout:clone(readout)});
    shot(fatal?'dnf':'rejoin',{kind:fatal?'terminal':'race',
      finish:fatal?{failedSlot:manifest.finish.failedSlot,
        failureLap:manifest.finish.failureLap}:null});
    if(at<20000||at>30000)throw Error('First Flight is outside its 20–30s budget.');
    return {version:VERSION,kind:EVENT_ID,raceNumber:manifest.raceNumber,
      source,branch,terminal:fatal,setting:clone(manifest.setting),
      vehicleLoadout:loadout,readout,shots,totalMs:at};
  }
  function sample(story,elapsedMs){
    if(!story||story.version!==VERSION||!Number.isFinite(elapsedMs)||
      !Array.isArray(story.shots))throw Error('Invalid shot plan or time.');
    const t=clamp(elapsedMs,0,story.totalMs);
    const item=story.shots.find(s=>t<s.endMs)||story.shots.at(-1);
    return {shot:item,elapsedMs:t,localMs:t-item.startMs,
      progress:clamp((t-item.startMs)/item.durationMs,0,1)};
  }
  return Object.freeze({EVENT_ID,VERSION,plan,sample});
});
