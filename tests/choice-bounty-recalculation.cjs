// Real seeded races: re-resolving one choice must never double-settle bounties or Bodge debt.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({});ctx.window=ctx;ctx.globalThis=ctx;
for(const file of ['src/02-catalogue.js','src/03-engine.js','src/26-bounties.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const E=ctx.ScrapEngine, same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
let tested=0,wins=0,losses=0,paid=0;
for(let seed=1;seed<=240;seed++){
 const before=E.newRun(seed),card=E.raceCard(seed,0,before);
 const choice=card.events.find(e=>E.eventDefinition(e)?.delivery==='choice');
 if(!choice)continue;
 before.bounties=[{id:'fourth',remaining:1,progress:0}];
 before.bountyAcceptedAt=0;before.bountyOfferedId='fourth';
 before.bodge={uses:1,lastRaceIndex:0,debt:60};
 const original=JSON.stringify(before);
 const safe=E.race(before,{}),explicitSafe=E.race(before,{[choice.key]:'safe'});
 const risk=E.race(before,{[choice.key]:'risk'}),identicalRisk=E.race(before,{[choice.key]:'risk'});
 const r=risk.history.at(-1);
 assert(same(safe,explicitSafe),'Unchosen route must default to safe');
 assert(same(risk,identicalRisk),'Re-resolved risk must be deterministic and independent');
 assert.equal(JSON.stringify(before),original,'Race may not mutate original committed garage state');
 assert.equal(r.bountyResults?.length,1,'One completed/failed bounty settlement');
 assert.equal(risk.bounties.length,0,'Deadline settles once');
 assert.equal(risk.bodge.debt,60-(r.bodgeRepayment||0),'Bodge repayment applied once');
 assert.equal(r.bodgeRepayment,Math.min(60,Math.floor((r.grossPrize||0)*.25)),
  'Debt repayment must be capped at 25% of actual gross race prize');
 assert.equal(risk.credits,before.credits+r.prize,'No doubled cash payout');
 assert.equal(risk.wrenches,before.wrenches+r.wrenchDrop+(r.bountyWrenches||0),
  'Only official race drops and bounty rewards may add wrenches');
 const restored=E.decodeSave(E.encodeSave(risk));
 assert(same(restored.bounties,risk.bounties),'Bounty settlement saved correctly');
 assert(same(restored.bodge,risk.bodge),'Bodge debt/uses saved correctly');
 assert(same(restored.history.at(-1).bountyResults,r.bountyResults),'Outcome ledger saved');
 assert.equal(safe.history.at(-1).events.length,r.events.length,'Choice may not reroll event pool');
 tested++;if(r.bountyResults[0].success)wins++;else losses++;
 if(r.bodgeRepayment>0)paid++;
}
assert(tested>=30&&wins>0&&losses>0&&paid>0,'Test must exercise varied real results');
console.log('PASS: '+tested+' natural choice races, '+wins+' bounty successes, '+losses+
 ' failures, '+paid+' debt repayments; no duplicate settlement or save damage');
