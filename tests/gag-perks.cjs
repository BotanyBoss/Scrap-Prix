// Gag perk regression: prevent bonus values becoming decorative catalogue entries.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const scripts=[...fs.readFileSync(path.join(root,'dist/dev.html'),'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const engineSource=fs.readFileSync(path.join(root,'src/03-engine.js'),'utf8');
function loadWithDisabled(gag,key){
  const ctx=vm.createContext({console});ctx.window=ctx;ctx.globalThis=ctx;
  for(const i of [0,1,2])vm.runInContext(scripts[i],ctx);
  const d=ctx.ScrapData;
  if(gag)ctx.ScrapData={...d,GAG_EFFECTS:{...d.GAG_EFFECTS,[gag]:{...d.GAG_EFFECTS[gag],[key]:0}}};
  vm.runInContext(scripts[3],ctx);
  return{D:ctx.ScrapData,E:ctx.ScrapEngine};
}
const live=loadWithDisabled(),L=live.E,D=live.D;
const neutral={
 f1:loadWithDisabled('f1','smoothTyreWearReduction').E,
 monster:loadWithDisabled('monster','obstacleMomentumReduction').E,
 spaceship:loadWithDisabled('spaceship','rocketGripPenaltyReduction').E
};
for(const [gag,effect] of Object.entries(D.GAG_EFFECTS)){
 for(const key of Object.keys(effect).filter(k=>k!=='name')){
   assert(engineSource.includes(key),'Perk is defined but not used by gameplay engine: '+gag+'.'+key);
 }
}
function state(seed,gag,race=10){
 const s=JSON.parse(JSON.stringify(L.newRun(seed))),recipe=D.GAG_RECIPES.find(g=>g.id===gag);
 s.raceIndex=race;s.loadout={...recipe.requires};s.levels={engine:10,tyres:10,chassis:10,gadget:10};
 s.durability={engine:100,tyres:100,chassis:100,gadget:100};s.approach='careful';
 return s;
}
// A working spaceship returns half the two rocket-component grip penalties (1 grip).
for(let race=0;race<20;race++){
 const s=state(123,'spaceship',race),card=L.raceCard(s.seed,s.raceIndex);
 const withBonus=L.environmentProfile(s,card),without=neutral.spaceship.environmentProfile(s,card);
 assert(withBonus.grip>without.grip,'Spaceship grip perk not applied: '+race);
}
// F1's fractional savings must add up over several laps instead of disappearing to rounding.
let f1Samples=0,f1Benefit=0;
for(let seed=1;seed<=160;seed++)for(let race=0;race<25;race++){
 const s=state(seed,'f1',race),card=L.raceCard(seed,race);
 const surf=L.surface(card.surfaceId);
 if(surf.roughness!==0||surf.softness!==0)continue;
 const a=L.race(s).history.at(-1),b=neutral.f1.race(s).history.at(-1);
 assert(a.damageBySlot.tyres<=b.damageBySlot.tyres,'Smooth F1 perk increased tyre damage');
 if(a.damageBySlot.tyres<b.damageBySlot.tyres)f1Benefit++;
 f1Samples++;
}
assert(f1Samples>100&&f1Benefit>20,'F1 10% tyre saving is too weak/inactive to show in sampled races');
// Monster Truck obstacle momentum perk reduces negative event-score penalties.
let obstacleTrials=0,monsterBenefit=0;
for(let seed=1;seed<=220;seed++)for(let race=0;race<35;race++){
 const s=state(seed,'monster',race),card=L.raceCard(seed,race);
 const obstacles=card.events.some(x=>x.kind!=='signature'&&L.eventDefinition(x)?.tags?.includes('obstacle')&&(L.eventDefinition(x)?.score||0)<0);
 if(!obstacles)continue;
 const a=L.race(s).history.at(-1),b=neutral.monster.race(s).history.at(-1);
 assert(a.eventScore>=b.eventScore,'Monster obstacle momentum perk decreased event score');
 if(a.eventScore>b.eventScore)monsterBenefit++;
 obstacleTrials++;
}
assert(obstacleTrials>8&&monsterBenefit>4,'Monster Truck momentum perk inactive for obstacle events');
console.log('PERK QA:',JSON.stringify({perksReviewed:Object.values(D.GAG_EFFECTS).reduce((n,e)=>n+Object.keys(e).length-1,0),
 f1Samples,f1Benefit,obstacleTrials,monsterBenefit}));
console.log('PASS: named perks are referenced; F1, Monster Truck and Space Car bonuses change real engine outcomes.');
