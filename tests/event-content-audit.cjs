// Event catalogue reachability, mechanical resolution and replay coverage.
// This audits existing art-neutral event behavior; it does not certify final 3D visuals.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','dist','dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const ctx=vm.createContext({console});ctx.window=ctx;ctx.globalThis=ctx;
for(const i of [0,1,2,3,5])vm.runInContext(scripts[i],ctx);
const D=ctx.ScrapData,E=ctx.ScrapEngine,P=ctx.ScrapPresentation;
const clone=v=>JSON.parse(JSON.stringify(v));
const assertUnique=(name,items)=>assert.equal(new Set(items.map(x=>x.id)).size,items.length,name+' has duplicate IDs');
for(const [name,items] of [['part',D.PARTS],['track',D.TRACKS],['wildcard',D.WILDCARDS],['anomaly',D.ANOMALIES],['pass event',D.PASS_EVENTS],['fake pass',D.FAKE_PASS_EVENTS]])assertUnique(name,items);
const wild=new Set(D.WILDCARDS.map(x=>x.id)),anomaly=new Set(D.ANOMALIES.map(x=>x.id)),gags=new Set(D.GAG_RECIPES.map(x=>x.id));
assert.equal(D.WILDCARDS.length,48);
assert.equal(D.ANOMALIES.length,37);
assert.equal(D.PASS_EVENTS.length,26);
assert.equal(D.FAKE_PASS_EVENTS.length,7);
for(const [label,weights] of [['opening',D.RACE_RULES.openingWeights],['late',D.RACE_RULES.lateWeights]]){
 for(const [id,weight] of Object.entries(weights)){assert(wild.has(id),'Unknown '+label+' weighted event '+id);assert(weight>0,'Unreachable '+id);}
}
for(const def of D.WILDCARDS){
 assert((D.RACE_RULES.openingWeights[def.id]||0)+(D.RACE_RULES.lateWeights[def.id]||0)>0,'Regular event never weighted: '+def.id);
 assert(E.eventDefinition({kind:'optional',id:def.id})?.id===def.id,'Wildcard cannot resolve: '+def.id);
}
for(const def of D.ANOMALIES){
 assert((D.ANOMALY_WEIGHTS[def.id]||def.weight||0)>0,'Anomaly has no weight: '+def.id);
 if(def.tracks)for(const id of def.tracks)assert(D.TRACKS.some(t=>t.id===id),'Unknown required track '+id);
 if(def.surfaces)for(const id of def.surfaces)assert(D.SURFACES.some(t=>t.id===id),'Unknown required surface '+id);
 if(def.stages)for(let i=1;i<=def.stages.length;i++)assert.equal(E.eventDefinition({kind:i===1?'anomaly':'chain',id:def.id,stage:i})?.stage,i);
 assert.equal(E.eventDefinition({kind:'anomaly',id:def.id})?.id,def.id,'Unresolvable anomaly '+def.id);
}
for(const track of D.TRACKS)assert(D.SIGNATURES.some(s=>s.id===track.signature),'Unknown signature '+track.id);
for(const def of [...D.WILDCARDS,...D.ANOMALIES,...D.PASS_EVENTS,...D.FAKE_PASS_EVENTS]){
 for(const gag of def.favouredGags||[])assert(gags.has(gag),'Event references missing gag '+gag);
 for(const gag of def.requiredGags||[])assert(gags.has(gag),'Special pass requires missing gag '+gag);
 for(const id of def.triggerEvents||[])assert(wild.has(id)||anomaly.has(id),'Special pass references missing event '+id);
}
for(const def of D.PASS_EVENTS){
 assert(D.PASS_EVENT_WEIGHTS?.[def.id]>0 || (def.requiredGags?.length && def.triggerEvents?.length),
   'Special pass has no selection path: '+def.id);
}
for(const def of D.FAKE_PASS_EVENTS)assert((D.FAKE_PASS_EVENT_WEIGHTS?.[def.id]||0)>0,'Fake pass never selectable: '+def.id);
// Sweep independent deterministic course cards. Do not count invented event choices.
const seenWild=new Set(),seenAnomaly=new Set(),seenTrack=new Set();
const samples=new Map(),stageSeen=new Set();let cards=0,choices=0;
for(let seed=1;seed<=320;seed++)for(let race=0;race<90;race++){
 const c=E.raceCard(seed,race);seenTrack.add(c.trackId);cards++;
 assert(c.lapCount>=3&&c.lapCount<=7);
 let choiceCount=0;
 for(const event of c.events){
   assert(event.lap>=1&&event.lap<=c.lapCount,'Event outside racing laps');
   const def=E.eventDefinition(event);
   assert(def&&def.id===event.id,'Missing or mismatched event implementation: '+event.id);
   if(def.delivery==='choice')choiceCount++;
   if(event.kind==='optional')seenWild.add(event.id);
   if(event.kind==='anomaly'||event.kind==='chain')seenAnomaly.add(event.id);
   if(event.stage&&event.stage>1)stageSeen.add(event.id);
   if(!samples.has(event.id))samples.set(event.id,[]);
   const examples=samples.get(event.id);
   if(examples.length<8&&race<50)examples.push({seed,race,event});
 }
 assert(choiceCount<=1,'Two incompatible choices in one race');
 choices+=choiceCount;
}
for(const id of wild)assert(seenWild.has(id),'Unreachable regular race event: '+id);
for(const id of anomaly)assert(seenAnomaly.has(id),'Unreachable anomaly: '+id);
assert.equal(seenTrack.size,D.TRACKS.length,'Track missing from rotation');
assert(stageSeen.size>0,'No multistage anomalies generated');
// Run actual engine rules and build presentation timelines for at least one reachable
// instance of every event definition. These are controlled cars, not human playthroughs.
let resolved=0,visualized=0;const missed=[];
for(const id of [...wild,...anomaly]){
 let found=false;
 for(const {seed,race,event} of samples.get(id)||[]){
   const s=clone(E.newRun(seed));
   s.raceIndex=race;s.approach='careful';s.durability={engine:100,tyres:100,chassis:100,gadget:100};
   s.loadout={engine:'heavy-diesel',tyres:'monster-treads',chassis:'armoured-tub',gadget:'bolt-armour'};
   s.levels={engine:10,tyres:10,chassis:10,gadget:10};
   const after=E.race(s),result=after.history.at(-1);
   const matched=result.laps.some(l=>l.effects.some(x=>x.id===id&&(!event.stage||x.stage===event.stage)));
   if(!matched)continue;
   found=true;resolved++;
   const replay=P.createReplay(s,after);
   assert(replay.steps.length>=2&&replay.total>0,'No replay generated for '+id);
   assert(replay.steps.some(step=>step.event===id||step.sourceId===id),
     'Resolved event not present in replay: '+id);
   const first=P.frame(replay,0),last=P.frame(replay,replay.total);
   assert(first.step&&last.step&&last.done,'Broken replay timing '+id);
   visualized++;break;
 }
 if(!found)missed.push(id);
}
assert.equal(missed.length,0,'Could not resolve/replay catalogue events: '+missed.join(', '));
console.log('EVENT CONTENT AUDIT:',JSON.stringify({
 regular:D.WILDCARDS.length,anomalies:D.ANOMALIES.length,
 passes:D.PASS_EVENTS.length,fakePasses:D.FAKE_PASS_EVENTS.length,
 tracks:D.TRACKS.length,seededCards:cards,choiceCards:choices,
 resolved,visualized,multistageReached:stageSeen.size
}));
console.log('PASS: all regular/anomaly definitions reachable and replayable; all pass and gag references valid.');
