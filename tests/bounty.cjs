// Bounty Board behaviour tests. Uses built browser bundle, no gameplay UI bypass.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','dist','dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const ctx=vm.createContext({console});ctx.window=ctx;ctx.globalThis=ctx;
for(const i of [0,1,2,3,25])vm.runInContext(scripts[i],ctx);
const E=ctx.ScrapEngine,clone=s=>JSON.parse(JSON.stringify(s));
const types=Array.from(E.bountyDefinitions);
assert.equal(types.length,47,'Thirty ordinary challenges and seventeen classified gag contracts');
const ids=types.map(x=>x.id);
assert.equal(new Set(ids).size,47,'Contract IDs remain unique');
assert.equal(types.filter(t=>!t.gagId).length,30);
assert.equal(types.filter(t=>t.gagId).length,ctx.ScrapData.GAG_RECIPES.length);
assert.deepEqual(types.filter(t=>t.gagId).map(t=>t.gagId).sort(),
  Array.from(ctx.ScrapData.GAG_RECIPES,g=>g.id).sort(),'Every gag can be a bounty');
for(const t of types){assert(t.races>=1&&t.races<=8&&t.weight>0);assert(t.reward&&t.failure&&t.goal);}
assert.equal(new Set(types.filter(t=>!t.gagId).map(t=>t.title.toLowerCase())).size,30,'Ordinary bounty titles must be unique');
assert.equal(new Set(types.filter(t=>!t.gagId).map(t=>t.goal.toLowerCase())).size,30,'No duplicate ordinary bounty objectives');
// Every new contract length must survive an immediate save, especially the eight-race classified offers.
for(const def of types){
 const fixture=clone(E.newRun(9000));fixture.bounties=[{id:def.id,remaining:def.races,progress:0}];
 const decoded=clone(E.decodeSave(E.encodeSave(fixture)));
 assert.equal(decoded.bounties[0].remaining,def.races,'Save rejected '+def.id+' deadline');
 const invalid=clone(fixture);invalid.bounties[0].remaining=def.races+1;
 assert.throws(()=>E.validateSave(invalid),'Excess deadline accepted for '+def.id);
}
const start=clone(E.newRun(20261017));
assert.equal(start.bounties,undefined);
assert.equal(E.decodeSave(E.encodeSave(start)).bounties,undefined,'Existing saves stay unchanged');

let offer=E.bountyOffer(start);
assert(offer&&types.some(t=>t.id===offer.id));
let taken=clone(E.acceptBounty(start,offer.id));
assert.equal(taken.bounties.length,1);
assert.equal(taken.bountyAcceptedAt,0);
assert.equal(E.bountyOffer(taken).id,offer.id,'One offer per race, no offer swapping after acceptance');
assert.throws(()=>E.acceptBounty(taken,offer.id));
assert.deepEqual(clone(E.decodeSave(E.encodeSave(taken)).bounties),taken.bounties);
assert.equal(E.cancelBounty(taken,offer.id).bounties.length,0,'Cancellation frees slot and fails');
const cloned=clone(taken);cloned.phase='garage';cloned.raceIndex=1;cloned.bountyAcceptedAt=0;
let offer2=E.bountyOffer(cloned);
assert(offer2&&offer2.id!==offer.id,'A duplicate active contract must not be reoffered');
let taken2=clone(E.acceptBounty(cloned,offer2.id));
taken2.phase='garage';taken2.raceIndex=2;const offer3=E.bountyOffer(taken2);
assert(offer3&&!taken2.bounties.some(x=>x.id===offer3.id));
taken2=clone(E.acceptBounty(taken2,offer3.id));
assert.equal(taken2.bounties.length,3);
const maxed=clone(taken2);maxed.phase='garage';maxed.raceIndex=3;
assert.throws(()=>E.acceptBounty(maxed,E.bountyOffer(maxed).id),'Three slot capacity');
const dropped=clone(E.cancelBounty(maxed,maxed.bounties[0].id));
assert.equal(dropped.bounties.length,2);

const hidden=E.bountyDisplay(start,{id:'tank',remaining:5,progress:0});
assert(!hidden.title.includes('Tank')&&!hidden.goal.includes('Tank'),'Locked gag requirement stays hidden');
assert(hidden.failure.includes('three garages'),'Failure remains visible even when classified');
const revealed=clone(start);revealed.discoveredGags=['tank'];
assert(E.bountyDisplay(revealed,{id:'tank',remaining:5}).goal.includes('Tank'));

const dis=clone(start);
dis.bounties=[{id:'third',remaining:1,progress:0}];dis.bountyAcceptedAt=0;dis.bountyOfferedId='third';
const abort=clone(E.cancelBounty(dis,'third'));
assert.equal(abort.bountyPenalties.shopOne,1,'Abandoning immediately applies penalty');
assert.equal(E.shopOffers(abort).length,1);
const after=clone(E.race(abort));
assert.equal(after.bountyPenalties.shopOne,0);
if(!after.finished)assert.equal(E.shopOffers(E.continueRun(after)).length,3);

const blocked=clone(start);
blocked.bounties=[{id:'tank',remaining:5,progress:0}];blocked.bountyAcceptedAt=0;blocked.bountyOfferedId='tank';
const cancelled=clone(E.cancelBounty(blocked,'tank'));
assert.equal(cancelled.bountyPenalties.repairLock,3);
assert(E.repairQuote(cancelled,'engine').locked);
assert.throws(()=>E.repair(cancelled,'engine'));
const bodge=clone(cancelled);bodge.durability.engine=0;bodge.credits=0;
assert.equal(E.bodgeQuote(bodge,'engine').available,true,'Emergency Bodge still works during lockout if no alternative');

const sab=clone(start);sab.bounties=[{id:'comeback',remaining:2,progress:0}];sab.bountyAcceptedAt=0;sab.bountyOfferedId='comeback';
const sabotage=clone(E.cancelBounty(sab,'comeback'));
assert.equal(sabotage.bountyPenalties.extraEvent,1);
const hurt=clone(E.race(sabotage));
assert(hurt.history.at(-1).laps.some(l=>l.effects.some(e=>e.bountyPenalty&&e.id==='pothole-chain')),'Bad event should actually appear in race effects');
assert.equal(hurt.bountyPenalties.extraEvent,0);

const coupon=clone(start);coupon.bountyCoupons=1;
const offered=E.shopOffers(coupon)[0];
const free=clone(E.claimBountyReplacement(coupon,offered.id));
assert.equal(free.credits,coupon.credits,'Voucher cannot change money');
assert.equal(free.bountyCoupons,0);
assert.equal(free.durability[offered.slot],100);
assert.equal(free.garageAction.kind,'replace');
assert.deepEqual(clone(E.decodeSave(E.encodeSave(free)).loadout),free.loadout);

let success=0,failed=0;
const builds=[
 {engine:'v8',tyres:'monster-treads',chassis:'boilerplate',gadget:'cooling-fan'},
 {engine:'race-block',tyres:'speed-slicks',chassis:'carbon-lite',gadget:'aero-kit'},
 {engine:'heavy-diesel',tyres:'steel-belt',chassis:'armoured-tub',gadget:'bolt-armour'},
 {engine:'inline-four',tyres:'scrap-racer',chassis:'longbody',gadget:'stock-gadget'}
];
for(let seed=1;seed<=200;seed++){
  const s=clone(E.newRun(seed));
  s.raceIndex=20;s.loadout=builds[seed%builds.length];
  for(const slot of ['engine','tyres','chassis','gadget'])s.levels[slot]=E.part(s.loadout[slot]).price?6:0;
  s.durability={engine:85,tyres:85,chassis:85,gadget:85};
  s.approach=['careful','balanced','reckless'][seed%3];
  s.bounties=[{id:'third',remaining:1,progress:0}];s.bountyAcceptedAt=20;s.bountyOfferedId='third';
  const out=clone(E.race(s)),r=out.history.at(-1);
  if(r.place===3&&!r.failedSlot&&!r.noStart){assert(r.bountyResults?.[0]?.success);success++;}
  else {assert.equal(r.bountyResults?.[0]?.success,false);failed++;}
  assert.equal(out.bounties.length,0);
}
assert(success>0&&failed>0,'Precision contract should be winnable yet risky across seeds');

// Regression: an apparent affordable engine hidden by a restricted shop must not disqualify Emergency Bodge.
let restricted=null,hiddenEngine=null;
for(let seed=1;seed<=160&&!restricted;seed++){
  const candidate=clone(E.newRun(seed));
  candidate.raceIndex=50;candidate.credits=10000;candidate.wrenches=0;candidate.durability.engine=0;
  candidate.bountyPenalties={shopOne:1,repairLock:0,extraEvent:0};
  const unrestricted=E.shopOffers({...candidate,bountyPenalties:{}});
  const hidden=unrestricted.slice(1).find(o=>o.slot==='engine');
  if(unrestricted[0].slot!=='engine'&&hidden){restricted=candidate;hiddenEngine=hidden;}
}
assert(restricted&&hiddenEngine,'Find a shop with an affordable but hidden engine offer');
assert.equal(E.shopOffers(restricted).length,1);
assert.equal(E.bodgeQuote(restricted,'engine').available,true,'Bodge must use genuinely accessible stock');
assert.throws(()=>E.buy(restricted,hiddenEngine.id),'Hidden engine cannot be purchased');

// Regression: sabotage cannot disappear on a DNS, but must be consumed when the bad event fires.
let noStartSabotage=clone(E.newRun(1234));
noStartSabotage.durability.engine=0;
noStartSabotage.bountyPenalties={shopOne:0,repairLock:0,extraEvent:1};
const dns=clone(E.race(noStartSabotage));
assert(dns.history.at(-1).noStart,'Zero-engine test must cause a DNS');
assert.equal(dns.bountyPenalties.extraEvent,1,'Pending bad event survives a no-start');
assert.deepEqual(clone(E.decodeSave(E.encodeSave(dns)).bountyPenalties),dns.bountyPenalties);
const repaired=clone(E.continueRun(dns));repaired.durability.engine=100;
const started=clone(E.race(repaired));
assert(started.history.at(-1).laps.some(l=>l.effects.some(e=>e.bountyPenalty)),'Resumed race must receive the event');
assert.equal(started.bountyPenalties.extraEvent,0,'Incident applied exactly once');

// Regression: a fourth completed Tank voucher cannot create an invalid or unredeemable save.
const tankRecipe=ctx.ScrapData.GAG_RECIPES.find(g=>g.id==='tank');
assert(tankRecipe);
let overflow=null;
for(let seed=1;seed<=120&&!overflow;seed++){
  const s=clone(E.newRun(seed));s.bountyCoupons=3;s.loadout={...tankRecipe.requires};
  s.durability={engine:100,tyres:100,chassis:100,gadget:100};
  for(const slot of ['engine','tyres','chassis','gadget'])s.levels[slot]=E.part(s.loadout[slot]).price?6:0;
  s.bounties=[{id:'tank',remaining:1,progress:0}];s.bountyAcceptedAt=0;s.bountyOfferedId='tank';
  const out=clone(E.race(s));
  if(out.history.at(-1).bountyResults?.[0]?.success)overflow={before:s,after:out};
}
assert(overflow,'Tank bounty can be completed with a full set of vouchers');
assert.equal(overflow.after.bountyCoupons,3,'Voucher capacity remains three');
assert.equal(overflow.after.history.at(-1).bountyResults[0].reward.kind,'voucherOverflowWrench');
assert.equal(overflow.after.bountyWrenches,undefined,'Post-race accounting belongs on result history');
assert.equal(overflow.after.history.at(-1).bountyWrenches,1);
assert.equal(overflow.after.wrenches,overflow.before.wrenches+overflow.after.history.at(-1).wrenchDrop+1);
assert.equal(E.decodeSave(E.encodeSave(overflow.after)).bountyCoupons,3,'Saving at capacity must work');
const garageAfterOverflow=clone(E.continueRun(overflow.after));
const redeemable=E.shopOffers(garageAfterOverflow)[0];
const redeemed=clone(E.claimBountyReplacement(garageAfterOverflow,redeemable.id));
assert.equal(redeemed.bountyCoupons,2,'Vouchers can still be redeemed after overflow');

// Regression: final garage condition and bonus wrenches are recorded separately from lap wear / race drops.
let both=clone(E.newRun(582));both.durability={engine:100,tyres:100,chassis:25,gadget:100};
both.bounties=[{id:'survivor',remaining:1,progress:1},{id:'worn',remaining:1,progress:0}];
const bothDone=clone(E.race(both)),bresult=bothDone.history.at(-1);
assert.equal(bresult.bountyResults.length,2);
assert(bresult.bountyResults.every(b=>b.success),'Both contracts should settle successfully in controlled case');
assert.equal(bresult.bountyWrenches,1,'Separate bounty wrench bonus is recorded');
assert.equal(bresult.bountyGarageWrenches,bothDone.wrenches);
assert.equal(bresult.bountyGarageDurabilityAfter.chassis,bothDone.durability.chassis);
assert.equal(bresult.bountyGarageDurabilityAfter.chassis,Math.min(100,bresult.durabilityAfter.chassis+20));
assert.equal(E.decodeSave(E.encodeSave(bothDone)).history.at(-1).bountyWrenches,1);

console.log('PASS: six offers, slots, hidden Tank, penalties, rescue compatibility, voucher, exact-third results and saves.');
console.log(JSON.stringify({success,failed}));
