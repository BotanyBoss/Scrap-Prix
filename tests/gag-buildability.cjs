// All 17 gag vehicles must be genuinely constructible through normal shop purchases.
// Budgets here are deliberately supplied to isolate catalogue availability from game economy;
// shop picks, one build action/race, repairs, races and victory checks are real engine actions.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','dist','dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const ctx=vm.createContext({console});ctx.window=ctx;ctx.globalThis=ctx;
for(const i of [0,1,2,3,25])vm.runInContext(scripts[i],ctx);
const D=ctx.ScrapData,E=ctx.ScrapEngine;
const toPlain=x=>JSON.parse(JSON.stringify(x));
assert.equal(D.PARTS.length,40);
assert.equal(D.GAG_RECIPES.length,17);
const allParts=new Map(D.PARTS.map(p=>[p.id,p]));
for(const gag of D.GAG_RECIPES){
 assert.deepEqual(Object.keys(toPlain(gag.requires)).sort(),['chassis','engine','gadget','tyres'],'Exact four-part recipe '+gag.id);
 for(const [slot,id] of Object.entries(gag.requires)){
   const part=allParts.get(id);assert(part&&part.slot===slot&&part.price>0,'Unavailable purchasable '+slot+'/'+id+' for '+gag.id);
 }
 assert(D.GAG_EFFECTS[gag.id]&&Object.keys(D.GAG_EFFECTS[gag.id]).length>1,'No mechanical perk for '+gag.id);
 assert.equal(E.resolveGag(gag.requires)?.id,gag.id,'Full recipe does not resolve '+gag.id);
 for(const [slot,id] of Object.entries(gag.requires)){
   const wrong=D.PARTS.find(p=>p.slot===slot&&p.id!==id).id;
   assert.notEqual(E.resolveGag({...gag.requires,[slot]:wrong})?.id,gag.id,'Partial recipe triggers '+gag.id);
 }
}
const types=Array.from(E.bountyDefinitions),contracts=new Map(types.filter(t=>t.gagId).map(t=>[t.gagId,t]));
assert.equal(contracts.size,17,'All gag vehicle bounties are defined');
const bought={};let complete=0;
for(const [ix,gag] of D.GAG_RECIPES.entries()){
  let found=false;
  // Different seeds guard against one bizarre but unlucky fixed shop sequence.
  for(const seed of [117+ix*17,20261017+ix,424242+ix]){
   let s=toPlain(E.newRun(seed));
   s.credits=8000000;s.wrenches=8000000;s.approach='careful';
   let replacements=0;
   for(let n=0;n<170&&!s.finished;n++){
     // Only regular legal repair actions. No direct edits to equipped parts.
     for(const slot of ['engine','tyres','chassis','gadget']){
       while(s.durability[slot]<90){
         const q=E.repairQuote(s,slot);if(!q.amount)break;
         s=toPlain(E.repair(s,slot));
       }
     }
     if(E.resolveGag(s)?.id!==gag.id){
       const needed=E.shopOffers(s).find(o=>gag.requires[o.slot]===o.id&&s.loadout[o.slot]!==o.id);
       if(needed){s=toPlain(E.buy(s,needed.id));replacements++;}
     }
     const fullyBuilt=E.resolveGag(s)?.id===gag.id;
     if(fullyBuilt){
       const contract=contracts.get(gag.id);
       assert(contract,'Missing gag bounty '+gag.id);
       // Controlled accepted bounty: check engine payout on a truly assembled car.
       s.bounties=[{id:contract.id,remaining:1,progress:0}];
       s.bountyCoupons=0;
     }
     const after=toPlain(E.race(s)),last=after.history.at(-1);
     if(fullyBuilt&&!last.noStart&&!last.failedSlot){
       assert.equal(last.gagId,gag.id,'Completed race must identify exact gag');
       assert(last.bountyResults?.some(x=>x.id===contracts.get(gag.id).id&&x.success),
         'Gag bounty should pay out on a successfully completed race');
       assert.equal(after.bountyCoupons,1,'Completed gag bounty must grant a free replacement voucher');
       assert(after.discoveredGags.includes(gag.id),'Completed race must discover gag');
       // Before discovery the precise request is classified; after it, it becomes readable.
       const newRun=E.newRun(seed);
       assert.equal(E.bountyDisplay(newRun,{id:contracts.get(gag.id).id}).revealed,false);
       assert.equal(E.bountyDisplay(after,{id:contracts.get(gag.id).id}).revealed,true);
       assert.equal(E.gagEffect(after)?.name,D.GAG_EFFECTS[gag.id].name);
       bought[gag.id]={race:last.race,purchases:replacements,seed};
       complete++;found=true;break;
     }
     if(!after.finished)s=toPlain(E.continueRun(after));
     else break;
   }
   if(found)break;
  }
  assert(found,'Could not assemble and complete a gag bounty through legal shop/race flow: '+gag.id);
}
console.log('GAG CONSTRUCTIBILITY:',JSON.stringify({complete,details:bought}));
console.log('PASS: all 17 recipes assembled via legal purchases, raced to completion, discovered and rewarded.');
