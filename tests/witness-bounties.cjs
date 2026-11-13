// New optional long-shot contracts: prior witness gating, real current-race
// viewing receipts, deferred settlement, skipped scenes, save and idempotence.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const storageData=new Map(),storage={getItem:k=>storageData.get(k)||null,setItem:(k,v)=>storageData.set(k,String(v))};
const ctx=vm.createContext({localStorage:storage});ctx.window=ctx;ctx.globalThis=ctx;
for(const file of ['src/02-catalogue.js','src/03-engine.js','src/26-bounties.js','src/27-encyclopaedia.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const E=ctx.ScrapEngine,A=ctx.ScrapEncyclopaedia,plain=x=>JSON.parse(JSON.stringify(x));
const defs=Array.from(E.bountyDefinitions).filter(d=>d.witness);
assert.equal(defs.length,6);
assert.equal(defs.filter(x=>x.category==='Weather Long-Shots').length,2);
assert.equal(defs.filter(x=>x.category==='Event Long-Shots').length,3);
assert.equal(defs.filter(x=>x.category==='Special Orders').length,1);
assert(defs.every(x=>x.hidden&&x.prior&&x.witness&&x.races<=8&&x.races>0));
for(let seed=1;seed<=300;seed++)assert(!defs.some(x=>x.id===E.bountyOffer(E.newRun(seed))?.id),
 'Long shot may not be offered before discovery');
A.recordWeather('blizzard');
A.recordEventSeen('anomaly','first-contact');
A.recordEventSeen('anomaly','suspicious-lights',1);
assert.equal(A.hasSeenEvent('anomaly','suspicious-lights',4),false);
const noFinale=defs.find(x=>x.id==='lights-finale');
assert.equal(A.hasSeenEvent('anomaly','suspicious-lights',4),false);
A.recordEventSeen('chain','suspicious-lights',2);
assert.equal(A.hasSeenEvent('anomaly','suspicious-lights',4),false);
A.recordEventSeen('chain','suspicious-lights',4);
assert.equal(A.hasSeenEvent('anomaly','suspicious-lights',4),true);
A.recordEventSeen('anomaly','kaiju-crossing');
assert.equal(A.hasSeenLegendary(),true);
let offered=false;
for(let seed=1;seed<=3000;seed++){
 const offer=E.bountyOffer(E.newRun(seed));
 if(defs.some(x=>x.id===offer?.id)){offered=true;break;}
}
assert(offered,'Prior discoveries should enable some long-shot offers');
// Natural Blizzard finishing with a valid 1st–4th place result.
let before,after;
for(let seed=1;seed<=8000;seed++){
 const s=E.newRun(seed),card=E.raceCard(seed,0,s);
 if(card.weatherId!=='blizzard')continue;
 s.bounties=[{id:'whiteout-witness',remaining:1,progress:0},{id:'fourth',remaining:1,progress:0}];
 const a=E.race(s),r=a.history.at(-1);
 if(!r.failedSlot&&!r.noStart&&r.place<=4){before=s;after=a;break;}
}
assert(before&&after,'Find real completed Blizzard race');
const original=JSON.stringify(before),resolved=after.history.at(-1);
assert.deepEqual(plain(after.bountyWitnessPending),['whiteout-witness']);
assert.throws(()=>E.continueRun(after),'Unsettled witness bets must not enter next garage');
assert.equal(after.bountyWitnessed.length,0);
assert.equal(resolved.bountyResults.length,1,'Ordinary bounty settles immediately');
assert.strictEqual(E.markBountyWitness(after,'w:hot'),after,'False weather must not count');
assert.strictEqual(E.markBountyWitness(after,'e:anomaly:kaiju-crossing:0'),after,'Unrolled event must not count');
const skip=E.finalizeWitnessBounties(after);
assert.equal(skip.bountyWitnessPending,undefined);
assert.equal(skip.bounties.some(x=>x.id==='whiteout-witness'),false);
const fail=skip.history.at(-1).bountyResults.find(x=>x.id==='whiteout-witness');
assert(fail&&!fail.success,'Skip must fail expiring witnessed-only contract');
assert.equal(skip.durability.tyres,after.durability.tyres-10,'Actual failure penalty applies');
assert.strictEqual(E.finalizeWitnessBounties(skip),skip,'Skip settlement is idempotent');
const seen=E.markBountyWitness(after,'w:blizzard');
assert.equal(seen.bountyWitnessed.length,1);
assert.strictEqual(E.markBountyWitness(seen,'w:blizzard'),seen,'Duplicate receipt is ignored');
const restored=E.decodeSave(E.encodeSave(seen));
assert.deepEqual(plain(restored.bountyWitnessPending),['whiteout-witness']);
assert.deepEqual(plain(restored.bountyWitnessed),['w:blizzard']);
const won=E.finalizeWitnessBounties(restored);
const success=won.history.at(-1).bountyResults.find(x=>x.id==='whiteout-witness');
assert(success?.success,'Actually watched eligible race must win');
assert.equal(won.wrenches,after.wrenches+2);
assert.equal(won.history.at(-1).bountyWrenches,(after.history.at(-1).bountyWrenches||0)+2);
assert.equal(won.history.at(-1).prize,resolved.prize,'Presentation quality cannot change cash prize');
assert.strictEqual(E.finalizeWitnessBounties(won),won);
assert.equal(E.continueRun(won).phase,'garage','Settled race can continue');
assert.equal(JSON.stringify(before),original,'No mutation of committed garage state');
const later=E.race({...before,bounties:[{id:'whiteout-witness',remaining:2,progress:0}]});
const delay=E.finalizeWitnessBounties(later);
assert.equal(delay.bounties[0].remaining,1,'Failed roll retries in following race');
assert.equal(delay.durability.tyres,later.durability.tyres,'No early penalty for remaining deadline');
// A real event must be resolved and watched in THIS race, not just a past archive.
let eventBefore,eventAfter;
for(let seed=1;seed<12000;seed++){
 const s=E.newRun(seed),card=E.raceCard(seed,0,s);
 if(!card.events.some(e=>e.id==='first-contact'))continue;
 s.bounties=[{id:'first-contact-witness',remaining:1,progress:0}];
 const a=E.race(s),r=a.history.at(-1);
 if(!r.failedSlot&&!r.noStart&&r.place<=4&&r.laps.some(l=>l.effects.some(e=>e.id==='first-contact'))){
   eventBefore=s;eventAfter=a;break;
 }
}
assert(eventAfter,'Find a naturally resolved First Contact event');
const receipt='e:anomaly:first-contact:0';
const eventSeen=E.markBountyWitness(eventAfter,receipt);
assert.equal(eventSeen.bountyWitnessed[0],receipt);
assert.equal(E.finalizeWitnessBounties(eventSeen).history.at(-1).bountyResults[0].success,true);
assert.equal(E.finalizeWitnessBounties(eventAfter).history.at(-1).bountyResults[0].success,false);
assert.throws(()=>E.validateSave({...seen,bountyWitnessed:['malicious:value']}));
assert.throws(()=>E.validateSave({...seen,bountyWitnessPending:['not-a-contract']}));
// Synthetic timing fixtures test stage exclusivity without brute-forcing a
// one-in-many-thousands four-stage finale. They still resolve through the
// same production receipt/settlement APIs.
let stageBefore,stageAfter;
for(let seed=1;seed<80;seed++){
 const s=E.newRun(seed);
 // Controlled stage timing fixture: a high-level legitimate catalogue loadout
 // makes a podium finish likely, without trying to discover a rare finale here.
 s.loadout={engine:'v8',tyres:'monster-treads',chassis:'boilerplate',gadget:'cooling-fan'};
 s.levels={engine:10,tyres:10,chassis:10,gadget:10};
 s.bounties=[{id:'lights-finale',remaining:1,progress:0},{id:'legendary-special-order',remaining:1,progress:0}];
 const a=E.race(s),r=a.history.at(-1);
 if(!r.failedSlot&&!r.noStart&&r.place<=3){stageBefore=s;stageAfter=a;break;}
}
assert(stageAfter,'Need completed top-three race for controlled stage fixture');
stageAfter.history.at(-1).laps[0].effects.push({kind:'chain',id:'suspicious-lights',stage:4,damage:0});
stageAfter.history.at(-1).laps[0].effects.push({kind:'anomaly',id:'kaiju-crossing',damage:0});
assert.strictEqual(E.markBountyWitness(stageAfter,'e:chain:suspicious-lights:3'),stageAfter,
 'Unresolved earlier stage may not count as finale');
const withFinale=E.markBountyWitness(stageAfter,'e:chain:suspicious-lights:4');
assert.equal(withFinale.bountyWitnessed.length,1);
const finaleOnly=E.finalizeWitnessBounties(withFinale);
assert.equal(finaleOnly.history.at(-1).bountyResults.find(x=>x.id==='lights-finale').success,true);
assert.equal(finaleOnly.history.at(-1).bountyResults.find(x=>x.id==='legendary-special-order').success,false,
 'Different rare encounter cannot win without its own viewing receipt');
const withKaiju=E.markBountyWitness(withFinale,'e:anomaly:kaiju-crossing:0');
const both=E.finalizeWitnessBounties(withKaiju);
assert(both.history.at(-1).bountyResults.every(x=>x.success),'Both watched rare events qualify');
assert.equal(both.bountyCoupons,2);
assert.equal(both.wrenches,stageAfter.wrenches,'Voucher payout must not inflate wrenches');
console.log('PASS: 6 long shots, discovery gates, real weather/event, skipped/seen settlement, stage finale, special order, saved receipts');
