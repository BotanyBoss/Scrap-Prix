/* Genuine engine-result fixtures, not pre-scripted success/failure animations. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({});ctx.window=ctx;ctx.globalThis=ctx;
for(const f of ['src/02-catalogue.js','src/03-engine.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const E=ctx.ScrapEngine,M=require('../src/30-race-manifest.js');
const R=require('../src/31-race-director.js'),plain=x=>JSON.parse(JSON.stringify(x));
function check(seed,choice){
  const before=E.newRun(seed);
  const scheduled=E.raceCard(seed,0,before).events.find(e=>e.id==='broken-bridge-jump');
  assert(scheduled,'Seed must genuinely roll Broken Bridge Jump: '+seed);
  const beforeJSON=JSON.stringify(before);
  const after=E.race(before,choice==='risk'?{[scheduled.key]:'risk'}:{});
  const afterJSON=JSON.stringify(after);
  const manifest=M.fromResolvedRace(before,after);
  const story=R.plan(manifest,{eventKey:scheduled.key});
  assert.equal(JSON.stringify(before),beforeJSON,'Planner cannot mutate starting build');
  assert.equal(JSON.stringify(after),afterJSON,'Planner cannot mutate finished race');
  assert.equal(story.source.id,'broken-bridge-jump');
  assert.equal(story.source.key,scheduled.key);
  assert.equal(story.totalMs,24300);
  assert.equal(story.shots.length,7);
  assert.deepEqual(plain(story.vehicleLoadout),plain(after.history.at(-1).loadoutBefore));
  const hit=manifest.laps.flatMap(l=>l.effects).find(e=>e.id==='broken-bridge-jump');
  assert.equal(story.readout.damage,hit.damage);
  assert.equal(story.readout.outcome,hit.outcome);
  assert.deepEqual(plain(story.readout.damageBySlot),plain(hit.damageBySlot));
  assert.equal(JSON.stringify(R.plan(manifest)),JSON.stringify(story),
    'Same result generates same shots');
  assert(R.sample(story,-1).shot.id==='opening');
  assert(R.sample(story,story.totalMs).progress===1);
  assert.equal(R.sample(story,1e8).elapsedMs,story.totalMs);
  for(const shot of story.shots){
    assert.equal(shot.source.key,scheduled.key);
    assert.deepEqual(plain(shot.vehicleLoadout),plain(story.vehicleLoadout));
    assert(!('position' in shot)&&!('overtake' in shot),'Never invent rival positions');
  }
  return story;
}
const safe=check(76,'safe'),fail=check(76,'risk'),win=check(385,'risk');
assert.equal(safe.branch,'safe');
assert.equal(fail.branch,'risk-failure');
assert.equal(win.branch,'risk-success');
assert(safe.shots.some(s=>s.id==='detour')&&!safe.shots.some(s=>s.id==='impact'));
assert(fail.shots.some(s=>s.id==='impact')&&!fail.shots.some(s=>s.id==='landing'));
assert(win.shots.some(s=>s.id==='landing')&&!win.shots.some(s=>s.id==='impact'));
assert.notEqual(safe.readout.damage,fail.readout.damage,'Different branch, real damage');
assert.equal(safe.source.key,fail.source.key);
assert.throws(()=>R.sample(safe,NaN));
const notABridge=E.newRun(1);
assert.throws(()=>R.plan(M.fromResolvedRace(notABridge,E.race(notABridge))));
assert(!fs.readFileSync(path.join(__dirname,'..','src/game.template.html'),'utf8')
  .includes('{{SCRIPT:src/31-race-director.js}}'),'First Flight may not silently ship in the game');
console.log('PASS: real bridge seeds, branching, real effects, replay sampling, no RNG/save mutation');
