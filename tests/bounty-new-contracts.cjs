// Targeted tests for the user-approved bounty expansions and their edge cases.
// Inspect private goal predicates in this test VM only; production exports are unchanged.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','dist','dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const ctx=vm.createContext({console});ctx.window=ctx;ctx.globalThis=ctx;
for(const i of [0,1,2,3])vm.runInContext(scripts[i],ctx);
const hook='  E.__testGoal=(id,result,previous,before)=>finishedGoal(lookup(id),{id,remaining:1,progress:0},result,previous,before);\n  E.__testLowDamagingEventRace=lowDamagingEventRace;\n';
const patched=scripts[25].replace('  E.bountyDefinitions=types;',hook+'  E.bountyDefinitions=types;');
assert.notEqual(patched,scripts[25],'Bounty test hook must load before exports');
vm.runInContext(patched,ctx);
const E=ctx.ScrapEngine,clone=v=>JSON.parse(JSON.stringify(v));
const ids=['risk-reward','bodge-podium','phoenix','tyre-cliff','engine-cliff','everything-fine','biscuit','double-disaster','no-repairs-five'];
const defs=Array.from(E.bountyDefinitions);
assert.equal(defs.length,41,'24 ordinary + 17 classified');
for(const id of ids){const def=defs.find(d=>d.id===id);assert(def,id+' absent');assert(def.category&&def.rarity);assert(def.reward&&def.failure);assert(def.races>=1&&def.races<=8);}
assert.equal(new Set(defs.map(d=>d.id)).size,defs.length);
assert.equal(new Set(defs.filter(d=>!d.gagId).map(d=>d.goal)).size,24,'Duplicate ordinary goal');
const base={place:1,noStart:false,failedSlot:null,durabilityBefore:{engine:30,tyres:30,chassis:30,gadget:30},durabilityAfter:{engine:7,tyres:9,chassis:17,gadget:20},laps:[]};
const goal=(id,r=base,before={garageAction:null})=>E.__testGoal(id,r,null,before);
assert(goal('bodge-podium',base,{garageAction:{kind:'bodge',slot:'chassis'}}));
assert(goal('phoenix',base,{garageAction:{kind:'bodge',slot:'chassis'}}));
assert(!goal('phoenix',base,{garageAction:{kind:'replace',slot:'engine'}}),'Replacement is not Bodge');
assert(!goal('phoenix',{...base,place:2},{garageAction:{kind:'bodge',slot:'chassis'}}),'Only a win counts for Phoenix');
assert(goal('bodge-podium',{...base,place:3},{garageAction:{kind:'bodge',slot:'engine'}}));
assert(!goal('bodge-podium',{...base,place:4},{garageAction:{kind:'bodge',slot:'engine'}}));
assert(goal('tyre-cliff'));assert(goal('engine-cliff'));
assert(!goal('tyre-cliff',{...base,durabilityAfter:{...base.durabilityAfter,tyres:0}}),'Destroyed tyres cannot qualify');
assert(!goal('engine-cliff',{...base,durabilityAfter:{...base.durabilityAfter,engine:11}}),'Above 10% does not qualify');
assert(goal('everything-fine',{...base,place:4}));
assert(!goal('everything-fine',{...base,place:5}));
assert(!goal('everything-fine',{...base,durabilityBefore:{...base.durabilityBefore,gadget:31}}),'All FOUR parts required');
assert(!goal('everything-fine',{...base,failedSlot:'engine'}),'DNF never qualifies');
const risky={kind:'wildcard',id:'wormhole',choiceEvent:true,choice:'risk',outcome:'success',damage:0};
assert(goal('biscuit',{...base,laps:[{effects:[risky]}]}));
assert(!goal('biscuit',{...base,laps:[{effects:[{...risky,damage:1}]}]}),'Shortcut damage cannot be positive');
assert(!goal('biscuit',{...base,laps:[{effects:[{...risky,choice:'safe'}]}]}),'Safe route does not count');
const sig=E.raceCard(31,0).signatureId;
const incident=n=>({kind:'signature',id:sig,damage:n});
const eventRace=n=>({...base,laps:[{effects:[{kind:'wear',damage:22},incident(n)]}]});
assert(E.__testLowDamagingEventRace(eventRace(5)),'Ordinary wear excluded from event-damage threshold');
assert(E.__testLowDamagingEventRace(eventRace(0)),'Fully mitigated dangerous event counts');
assert(!E.__testLowDamagingEventRace(eventRace(6)),'Damage limit is five per race');
assert(!E.__testLowDamagingEventRace({...base,laps:[{effects:[{kind:'wear',damage:1}]}]}),'No damaging event, no progress');
// Risk/Reward succeeds ONLY by cancelling another outstanding contract.
// That original contract's failure penalty must apply first.
let s=clone(E.newRun(101));s.bounties=[{id:'risk-reward',remaining:2,progress:0},{id:'third',remaining:1,progress:0}];
const cancelled=clone(E.cancelBounty(s,'third'));
assert.equal(cancelled.bounties.length,0);
assert.equal(cancelled.wrenches,s.wrenches+2,'Risk/Reward pays +2 wrenches');
assert.equal(cancelled.bountyPenalties.shopOne,1,'Cancelled third-place bounty applies its genuine penalty');
assert(cancelled.bountyLastCancel.riskReward?.success);
const own=clone(E.cancelBounty(s,'risk-reward'));
assert.equal(own.wrenches,s.wrenches,'Cancelling itself must not pay out');
assert.equal(own.bounties.length,1);
s=clone(E.newRun(83));s.bounties=[{id:'no-repairs-five',remaining:3,progress:3}];s.wrenches=10;s.durability.chassis=70;
const repaired=clone(E.repair(s,'chassis'));
assert.equal(repaired.bounties[0].progress,0,'Normal repair resets five-race streak');
const after=clone(E.newRun(83));after.bounties=[{id:'no-repairs-five',remaining:1,progress:4}];
const completed=clone(E.race(after));
assert.equal(completed.history.at(-1).bountyResults?.[0]?.success,true,'Fifth completed clean race pays out');
assert.equal(completed.bountyCoupons,1);
after.bounties=[{id:'no-repairs-five',remaining:1,progress:4}];
assert.equal(E.decodeSave(E.encodeSave(after)).bounties[0].progress,4,'Four-race streak survives save/load');
assert.throws(()=>E.validateSave({...after,bounties:[{id:'no-repairs-five',remaining:1,progress:6}]}),'Invalid streak rejected');
// Impossible-to-Bodge (all three uses spent) must not receive another Bodge contract offer.
for(let seed=1;seed<=60;seed++){const state=clone(E.newRun(seed));state.bodge={uses:3,lastRaceIndex:0,debt:0};const offer=E.bountyOffer(state);assert(!['phoenix','bodge-podium'].includes(offer?.id));}
console.log('PASS: nine unique approved bounties, exact thresholds, sacrifice payout, five-race streak, Bodge timing, event damage and save compatibility.');
