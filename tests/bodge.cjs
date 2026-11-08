// Focused checks for the limited Emergency Bodge. No bounty board/economy changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','dist','dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const sandbox=vm.createContext({console});sandbox.window=sandbox;sandbox.globalThis=sandbox;
for(const i of [0,1,2,3])vm.runInContext(scripts[i],sandbox);
const E=sandbox.ScrapEngine,copy=x=>JSON.parse(JSON.stringify(x));

const old=copy(E.newRun(20261017));
assert.equal(old.bodge,undefined,'Legacy runs should not acquire new state until rescue is used');
assert.equal(E.decodeSave(E.encodeSave(old)).bodge,undefined);

const desperate=copy(E.newRun(20261017));
desperate.raceIndex=50;desperate.credits=0;desperate.wrenches=0;desperate.durability.engine=0;
const offer=E.bodgeQuote(desperate,'engine');
assert.equal(offer.available,true,'Critical engine with no conventional repair must be recoverable');
assert.equal(offer.amount,30);assert.equal(offer.fee,60);
const patched=copy(E.emergencyBodge(desperate,'engine'));
assert.equal(patched.durability.engine,30);
assert.equal(patched.bodge.debt,60);assert.equal(patched.bodge.uses,1);
assert.equal(patched.garageAction.kind,'bodge');
assert.equal(patched.credits,0);assert.equal(patched.wrenches,0);
assert.deepEqual(copy(E.decodeSave(E.encodeSave(patched)).bodge),patched.bodge,'Save/load must retain lifeline use and debt');
assert.equal(E.bodgeQuote(patched,'tyres').available,false,'The major garage action is spent');
assert.throws(()=>E.emergencyBodge(patched,'engine'));
assert.throws(()=>E.bodgeQuote(patched,'gadget'));

const affordable=copy(desperate);affordable.wrenches=1;
assert.equal(E.bodgeQuote(affordable,'engine').available,false,'Do not rescue when normal wrench repair is available');
const healthy=copy(desperate);healthy.durability.engine=50;
assert.equal(E.bodgeQuote(healthy,'engine').available,false,'Do not rescue a healthy component');
const usedTwo=copy(patched);usedTwo.phase='garage';usedTwo.garageAction=null;usedTwo.raceIndex=3;usedTwo.durability.engine=0;
const second=copy(E.emergencyBodge(usedTwo,'engine'));
assert.equal(second.bodge.debt,140);assert.equal(second.bodge.uses,2);
const cooling=copy(second);cooling.garageAction=null;cooling.raceIndex=4;cooling.durability.engine=0;
assert.equal(E.bodgeQuote(cooling,'engine').available,false,'Three race cooldown should be enforced');
const ready=copy(cooling);ready.raceIndex=6;
const third=copy(E.emergencyBodge(ready,'engine'));
assert.equal(third.bodge.debt,240);assert.equal(third.bodge.uses,3);
const exhausted=copy(third);exhausted.garageAction=null;exhausted.raceIndex=9;exhausted.durability.engine=0;
assert.equal(E.bodgeQuote(exhausted,'engine').available,false,'Three uses are the lifetime cap');

let testedRepayment=false;
for(const seed of [1,20261017,424242,987654321,17017]){
  const fresh=copy(E.newRun(seed));
  const paid=copy(E.race(fresh));
  const owing=copy(fresh);
  owing.bodge={uses:1,lastRaceIndex:0,debt:60};
  const indebted=copy(E.race(owing));
  const base=paid.history.at(-1),result=indebted.history.at(-1);
  assert.equal(result.place,base.place,'Debt must never affect race result');
  assert.equal(result.pointsEarned,base.pointsEarned,'Debt must not affect score');
  assert.equal(result.wrenchDrop,base.wrenchDrop,'Debt must not affect wrench drops');
  if(base.prize<=0)continue;
  const due=Math.min(60,Math.floor(base.prize*.25));
  assert.equal(result.grossPrize,base.prize);
  assert.equal(result.bodgeRepayment,due);
  assert.equal(result.prize,base.prize-due);
  assert.equal(indebted.bodge.debt,60-due);
  assert.equal(indebted.credits,paid.credits-due);
  assert(due<=base.prize*.25,'No more than a quarter of earnings withheld');
  testedRepayment=true;break;
}
assert(testedRepayment,'Could not find a successful race to validate repayment');
console.log('PASS: Emergency Bodge eligibility, limited uses, cooldown, saves and capped debt repayment.');
