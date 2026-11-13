/* Immutable-by-convention factual adapter for a future cartoon shot director.
 * No RNG, no racing physics, no score or save mutation. Not loaded by game.template. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapRaceManifest=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const cp=v=>JSON.parse(JSON.stringify(v==null?null:v));
 const opt=(o,k)=>Object.hasOwn(o,k)?o[k]:null;
 function fromResolvedRace(before,after){
  if(!before||!after||after.seed!==before.seed||after.raceIndex!==before.raceIndex+1||
     after.phase!=='result'||!Array.isArray(after.history))throw Error('Expected one resolved engine race');
  const r=after.history.at(-1);
  if(!r||r.race!==before.raceIndex+1||!Array.isArray(r.laps)||!Array.isArray(r.standings))
    throw Error('Missing engine race result');
  const laps=r.laps.map(l=>({lap:l.lap,completed:!!l.completed,weatherId:l.weatherId||r.weatherId,
    conditionBefore:cp(l.before),conditionAfter:cp(l.after),failedSlot:l.failedSlot||null,
    effects:(l.effects||[]).map((e,index)=>({index,kind:e.kind,id:opt(e,'id'),key:opt(e,'key'),
      stage:opt(e,'stage'),damage:e.damage||0,damageBySlot:cp(e.damageBySlot||{}),
      scoreDelta:e.scoreDelta||0,credits:e.credits||0,choiceEvent:!!e.choiceEvent,
      choice:opt(e,'choice'),outcome:opt(e,'outcome'),outcomeText:opt(e,'outcomeText'),
      bountyPenalty:!!e.bountyPenalty}))}));
  return {version:1,seed:before.seed,raceIndex:before.raceIndex,raceNumber:r.race,
    plannedLaps:r.lapCount,completedLaps:r.lapsCompleted,
    setting:{trackId:r.trackId,surfaceId:r.surfaceId,weatherId:r.weatherId,
      signatureId:r.signatureId,approach:r.approach},
    vehicle:{loadout:cp(r.loadoutBefore||before.loadout),levels:cp(r.levelsBefore||before.levels),
      conditionAtStart:cp(r.durabilityBefore||before.durability),gagId:r.gagId||null},
    scheduledEvents:cp((r.events||[]).map(e=>({key:e.key,kind:e.kind,id:e.id,lap:e.lap,stage:opt(e,'stage')}))),
    laps,passes:cp(r.passEvents||[]),fakePasses:cp(r.fakePassEvents||[]),
    standings:r.standings.map((s,index)=>({place:index+1,name:s.name,player:!!s.player,
      score:s.score,archetype:s.archetype||null})),
    finish:{place:r.place,noStart:!!r.noStart,noStartSlots:cp(r.noStartSlots||[]),
      noStartStrike:opt(r,'noStartStrike'),failedSlot:r.failedSlot||null,
      failureLap:opt(r,'failureLap'),conditionAfterRace:cp(r.durabilityAfter),
      damage:r.damage||0,damageBySlot:cp(r.damageBySlot||{}),
      prize:r.prize||0,points:r.pointsEarned||0,wrenches:r.wrenchDrop||0,
      bountyResults:cp(r.bountyResults||[])}};
 }
 function factualBeatPlan(manifest){
  if(!manifest||manifest.version!==1)throw Error('Unknown manifest');
  const beats=[{kind:'opening',lap:0,source:null}];
  if(!manifest.finish.noStart)for(const lap of manifest.laps){
    beats.push({kind:'lap',lap:lap.lap,source:null});
    for(const e of lap.effects)if(e.kind!=='wear')
      beats.push({kind:'event',lap:lap.lap,
        source:{kind:e.kind,id:e.id,key:e.key,index:e.index,stage:e.stage,
          choice:e.choice,outcome:e.outcome}});
  }
  beats.push({kind:manifest.finish.noStart?'dns':manifest.finish.failedSlot?'dnf':'finish',
    lap:manifest.finish.failureLap||manifest.completedLaps,source:null});
  return beats;
 }
 return Object.freeze({fromResolvedRace,factualBeatPlan});
});
