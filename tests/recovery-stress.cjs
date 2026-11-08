// Diagnostic comparison of fixed late-game garage states: recovery with and without Emergency Bodge.
// Synthetic starting states at races 40, 50, 55; this is NOT a human difficulty estimate.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','dist','dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const env=vm.createContext({console});env.window=env;env.globalThis=env;
for(const i of [0,1,2,3])vm.runInContext(scripts[i],env);
const E=env.ScrapEngine;
const clone=o=>JSON.parse(JSON.stringify(o));
const cases=[
  {race:40,money:320,wrenches:2,condition:{engine:25,tyres:44,chassis:58,gadget:34}},
  {race:50,money:160,wrenches:0,condition:{engine:0,tyres:26,chassis:40,gadget:20}},
  {race:55,money:80,wrenches:0,condition:{engine:12,tyres:9,chassis:25,gadget:36}}
];
const counts={baseline:{},bodge:{}};
function run(seed,entry,useBodge){
  let s=clone(E.newRun(seed));
  s.raceIndex=entry.race;s.credits=entry.money;s.wrenches=entry.wrenches;
  s.loadout={engine:'v8',tyres:'monster-treads',chassis:'boilerplate',gadget:'cooling-fan'};
  for(const slot of Object.keys(s.loadout)){assert(E.part(s.loadout[slot]),slot);s.levels[slot]=10;}
  s.durability={...entry.condition};
  const result={races:0,noStarts:0,finishes:0,top3:0,bodges:0,endingCredits:0,endingWrenches:0,endingDebt:0};
  for(let i=0;i<10&&!s.finished;i++){
    // Make careful triage decisions at the start of every workshop.
    const critical=['engine','tyres','chassis'];
    const urgent=[...critical].sort((a,b)=>s.durability[a]-s.durability[b]);
    for(const slot of urgent){
      const q=E.repairQuote(s,slot);
      if(s.durability[slot]<45&&q.amount&&s.wrenches>=q.cost)s=E.repair(s,slot);
    }
    const offered=E.shopOffers(s).filter(o=>o.price<=s.credits && s.durability[o.slot]<40);
    if(offered.length){const best=offered.sort((a,b)=>s.durability[a.slot]-s.durability[b.slot])[0];s=E.buy(s,best.id);}
    if(useBodge&&!s.garageAction){
      const eligible=urgent.filter(slot=>E.bodgeQuote(s,slot).available);
      if(eligible.length){s=E.emergencyBodge(s,eligible[0]);result.bodges++;}
    }
    s=E.race(s,{});
    const r=s.history.at(-1);
    result.races++;
    if(r.noStart)result.noStarts++;
    else if(!r.failedSlot){result.finishes++;if(r.place<=3)result.top3++;}
    if(!s.finished)s=E.continueRun(s);
  }
  result.endingCredits=s.credits;result.endingWrenches=s.wrenches;result.endingDebt=s.bodge?.debt||0;
  return result;
}
for(const [name,useBodge] of [['baseline',false],['bodge',true]]){
  for(const entry of cases){
    const data=[];
    for(const seed of [1,2,4,16,42,101,20261017,424242,987654321,7462,85219,246810])data.push(run(seed,entry,useBodge));
    const sum=k=>data.reduce((n,x)=>n+x[k],0);
    counts[name][entry.race]={runs:data.length,starts:sum('races'),finishedRaces:sum('finishes'),noStarts:sum('noStarts'),top3:sum('top3'),bodges:sum('bodges'),avgCredits:Math.round(sum('endingCredits')/data.length),avgDebt:Math.round(sum('endingDebt')/data.length)};
    assert(data.every(x=>x.endingCredits>=0&&x.endingDebt>=0),'Currency underflow');
  }
}
assert(counts.bodge[50].noStarts<=counts.baseline[50].noStarts,'Recovery should not increase no-starts in identical race-50 desperate states');
console.log('LATE-GAME SYNTHETIC ECONOMY COMPARISON (10 races from each start, same seeds):');
console.log(JSON.stringify(counts,null,2));
console.log('PASS: no currency underflow; race-50 Emergency Bodge reduced or preserved no-start count.');
