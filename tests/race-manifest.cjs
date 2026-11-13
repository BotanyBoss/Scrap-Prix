// Race Manifest validation using real engine outcomes, not invented fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({});ctx.window=ctx;ctx.globalThis=ctx;
for(const f of ['src/02-catalogue.js','src/03-engine.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const E=ctx.ScrapEngine,M=require('../src/30-race-manifest.js');
const plain=x=>JSON.parse(JSON.stringify(x));
function verify(before,after){
 const a=JSON.stringify(before),b=JSON.stringify(after),r=after.history.at(-1);
 const man=M.fromResolvedRace(before,after);
 assert.equal(man.seed,before.seed);
 assert.equal(man.finish.place,r.place);
 assert.equal(man.finish.damage,r.damage);
 assert.deepEqual(plain(man.finish.damageBySlot),plain(r.damageBySlot));
 assert.deepEqual(plain(man.vehicle.loadout),plain(r.loadoutBefore));
 assert.deepEqual(plain(man.laps.map(x=>x.lap)),plain(r.laps.map(x=>x.lap)));
 assert.equal(man.standings.filter(x=>x.player).length,1);
 assert.equal(JSON.stringify(man),JSON.stringify(M.fromResolvedRace(before,after)));
 assert.equal(JSON.stringify(before),a);assert.equal(JSON.stringify(after),b);
 const plan=M.factualBeatPlan(man);
 assert.equal(plan.at(-1).kind,man.finish.noStart?'dns':man.finish.failedSlot?'dnf':'finish');
 assert.deepEqual(plain(plan.filter(x=>x.kind==='event').map(x=>x.source.id)),
   plain(man.laps.flatMap(l=>l.effects.filter(e=>e.kind!=='wear').map(e=>e.id))));
 return man;
}
for(const seed of [1,17,1337,20261017]){
 const s=E.newRun(seed);verify(s,E.race(s));
}
const broken=E.newRun(324);broken.durability.engine=0;
const noStart=verify(broken,E.race(broken));
assert.equal(noStart.finish.noStart,true);assert.equal(noStart.laps.length,0);
let before,choice;
for(let seed=1;seed<3000;seed++){
 const s=E.newRun(seed),card=E.raceCard(seed,0,s);
 const hit=card.events.find(e=>E.eventDefinition(e)?.delivery==='choice');
 if(hit){before=s;choice=hit;break;}
}
assert(choice,'Natural choice not found in search');
const safe=verify(before,E.race(before)),risk=verify(before,E.race(before,{[choice.key]:'risk'}));
const find=m=>m.laps.flatMap(l=>l.effects).find(e=>e.key===choice.key&&e.choiceEvent);
assert.equal(find(safe).choice,'safe');assert.equal(find(risk).choice,'risk');
assert(['success','failure'].includes(find(risk).outcome));
assert.deepEqual(plain(safe.scheduledEvents),plain(risk.scheduledEvents));
assert.throws(()=>M.fromResolvedRace(before,before));
console.log('PASS: race manifest facts, DNS, real choice outcomes, deterministic no-mutation');
