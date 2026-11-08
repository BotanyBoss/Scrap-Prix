// Controlled economy study. This tests scripted strategies from synthetic late-game states;
// not a human playtest and NOT evidence of the true difficulty curve by itself.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','dist','dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
const ctx=vm.createContext({console});ctx.window=ctx;ctx.globalThis=ctx;
for(const i of [0,1,2,3,25])vm.runInContext(scripts[i],ctx);
const E=ctx.ScrapEngine;
const copy=v=>JSON.parse(JSON.stringify(v));
function scenario(seed,from){
 const s=copy(E.newRun(seed));s.raceIndex=from;s.credits=250;s.wrenches=1;
 s.loadout={engine:'v8',tyres:'monster-treads',chassis:'boilerplate',gadget:'cooling-fan'};
 for(const slot of Object.keys(s.loadout)){s.levels[slot]=10;s.repairs[slot]=1;}
 s.durability={engine:46,tyres:55,chassis:62,gadget:70};
 return s;
}
function choose(s){
 for(const slot of ['engine','tyres','chassis']){
   const q=E.repairQuote(s,slot);
   if(q.amount&&s.durability[slot]<45&&!q.locked&&s.wrenches>=q.cost)s=E.repair(s,slot);
 }
 const eligible=E.shopOffers(s).filter(x=>!s.garageAction&&s.credits>=x.price&&s.durability[x.slot]<38);
 if(eligible.length){eligible.sort((a,b)=>s.durability[a.slot]-s.durability[b.slot]);s=E.buy(s,eligible[0].id);}
 if(!s.garageAction){
   for(const slot of ['engine','tyres','chassis']){
      if(E.bodgeQuote(s,slot).available){s=E.emergencyBodge(s,slot);break;}
   }
 }
 return s;
}
function acceptAccordingToPolicy(s,policy){
 if(policy==='none')return s;
 const o=E.bountyOffer(s);
 if(!o||(s.bounties||[]).length>=3)return s;
 if(policy==='selective'){
   const last=s.history.at(-1);
   const safe=(o.id==='third'&&last?.place===3)||(o.id==='survivor'&&Math.min(s.durability.engine,s.durability.tyres)>65)
     ||(o.id==='comeback'&&last?.place>=4)||(o.id==='worn'&&s.durability.engine<=25&&s.durability.engine>0);
   if(!safe)return s;
 }
 return E.acceptBounty(s,o.id);
}
function simulate(seed,from,policy){
 let s=scenario(seed,from),started=0,finishes=0,top3=0,accepted=0,succeeded=0,failed=0,noStart=0,coupons=0,bodges=0,totalWinnings=0;
 for(let i=0;i<Math.max(0,100-from)&&!s.finished;i++){
    s=choose(s);
    const old=(s.bounties||[]).length;
    s=acceptAccordingToPolicy(s,policy);
    accepted+=(s.bounties||[]).length>old?1:0;
    const before=copy(s);
    s=E.race(s,{});
    let r=s.history.at(-1);
    started++;noStart+=r.noStart?1:0;finishes+=(!r.noStart&&!r.failedSlot)?1:0;top3+=(!r.noStart&&!r.failedSlot&&r.place<=3)?1:0;
    totalWinnings+=r.prize||0;
    for(const outcome of r.bountyResults||[]){succeeded+=outcome.success?1:0;failed+=outcome.success?0:1;}
    coupons+=s.bountyCoupons||0;
    bodges=s.bodge?.uses||0;
    assert(s.credits>=0&&s.wrenches>=0,'Underflow');
    assert(s.bountyCoupons===undefined||s.bountyCoupons<=3);
    if(!s.finished)s=E.continueRun(s);
 }
 return{seed,from,policy,started,finishes,noStart,top3,accepted,succeeded,failed,
    bodges,credits:s.credits,wrenches:s.wrenches,winnings:totalWinnings,
    debt:s.bodge?.debt||0,reached100:s.raceIndex>=100};
}
const summary={};
const seeds=[11,29,47,101,20261017,424242,85219,987654321];
for(const policy of ['none','selective','all']){
  const all=[];
  for(const from of [40,50])for(const seed of seeds)all.push(simulate(seed,from,policy));
  const sum=k=>all.reduce((v,x)=>v+x[k],0);
  summary[policy]={sessions:all.length,started:sum('started'),finishes:sum('finishes'),noStarts:sum('noStart'),
    top3:sum('top3'),contractsAccepted:sum('accepted'),bountiesWon:sum('succeeded'),
    bountiesFailed:sum('failed'),reachedRace100:sum('reached100'),
    avgEndingCredits:Math.round(sum('credits')/all.length),avgWinnings:Math.round(sum('winnings')/all.length),
    avgDebt:Math.round(sum('debt')/all.length)};
}
assert(summary.none.contractsAccepted===0);
assert(summary.selective.contractsAccepted<=summary.all.contractsAccepted);
assert(summary.all.bountiesFailed>0,'Accepting every bounty must carry meaningful risk');
console.log('BOUNTY ECONOMY STRESS (same seeded starting states, scripted strategies):');
console.log(JSON.stringify(summary,null,2));
console.log('PASS: comparison completed without currency underflow or free acceptance.');
