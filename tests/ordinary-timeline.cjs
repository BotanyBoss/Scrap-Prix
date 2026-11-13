const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});
context.window=context;
for(const file of ['02-catalogue','03-engine','04-cosmetic-surprises','05-presentation',
  '07-raster','08-gag-recipes','09-vehicle-art','12-event-director','30-race-manifest','31-race-director','32-ordinary-timeline']){
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../src/'+file+'.js'),'utf8'),context);
}
const {ScrapEngine:E,ScrapRaceManifest:M,ScrapRaceDirector:D,ScrapOrdinaryTimeline:T,
  ScrapPresentation:P,ScrapEventTiming:timing}=context;
function verify(before,choices={}){
  const after=E.race(before,choices),facts=M.fromResolvedRace(before,after);
  const replay=timing.prepareReplay(P.createReplay(before,after),E),story=T.plan(facts,replay,choices);
  const events=facts.laps.flatMap(l=>l.effects.filter(e=>e.kind!=='wear'));
  assert.deepEqual(story.shots.filter(s=>s.source?.kind&&['event','decision'].includes(s.family)&&s.source.damageBySlot)
    .map(s=>s.source.key),events.map(e=>e.key));
  assert.equal(story.totalMs,replay.total);
  let t=0;for(const shot of story.shots){
    assert.equal(shot.startMs,t);
    assert.equal(D.sample(story,t).shot,shot);
    assert.equal(D.sample(story,t+shot.durationMs*.5).shot,shot);
    t=shot.endMs;
  }
  assert.equal(JSON.stringify(story),JSON.stringify(T.plan(facts,replay,choices)));
  return {facts,story,events};
}
for(const [seed,laps,ids] of [[2,3,['heatwave']],[18,5,['debris','deep-sand']],
  [71,7,['debris','lucky-gap']],[3,3,['dune-shortcut']]]){
  const {facts,events}=verify(E.newRun(seed));assert.equal(facts.plannedLaps,laps);
  for(const id of ids)assert(events.some(e=>e.id===id));
}
for(const choice of ['safe','risk']){
  const {story}=verify(E.newRun(3),{late:choice});
  assert.equal(story.shots.find(s=>s.family==='consequence'&&s.source.key==='late').source.choice,choice);
}
for(const [condition,terminal] of [[1,'dnf'],[0,'dns']]){
  const s=E.newRun(2);s.durability.engine=condition;
  const {story,facts}=verify(s);assert.equal(story.shots.at(-1).family,terminal);
  assert(facts.laps.length<facts.plannedLaps);
}
// Exercise the actual provider with a capture spy. The POC covers raster output.
for(const file of ['previews/vehicle-pipeline/assembly.js','src/33-race-frames.js'])
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),context);
context.softwareFrame=(rig,camera,wear)=>({rig,camera,wear});
const frame=context.createRaceFrames();
for(const chassis of ['stock-chassis','needle-frame','longbody']){
  const gear={...E.newRun(2).loadout,chassis},rear=frame(gear,'rear');
  assert.equal(rear.rig.wheels.length,chassis==='longbody'?6:4);
  assert.equal(frame(gear,'rear'),rear);
  for(const view of ['front','side'])assert.equal(frame(gear,view).rig,rear.rig);
  assert.notEqual(frame({...gear,engine:'v8'},'rear').rig,rear.rig);
  assert.equal(frame({...gear,engine:'reactor'},'rear'),null);
}
console.log('PASS ordinary occurrences, seeded branches, clock boundaries, DNF/DNS, three chassis and exact equipment fallback');
