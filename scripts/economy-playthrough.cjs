// Start-from-scratch simulated playthroughs. NOT human playtesting.
// Run: node scripts/economy-playthrough.cjs
// No synthetic gear, currency, condition, manually selected event or altered RNG.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const context = vm.createContext({});
context.window = context;
context.globalThis = context;
for (const name of ['src/02-catalogue.js', 'src/03-engine.js', 'src/26-bounties.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'), context, {filename: name});
const E = context.ScrapEngine, D = context.ScrapData;
const SEEDS = Array.from({length: 24}, (_, i) => (101 + i * 7919) >>> 0);
const MAX_RACES = 120;
const PLANS = [
  {name: 'careful-no-board-no-bodge', driving: 'careful', board: 'none', bodge: false},
  {name: 'careful-no-board', driving: 'careful', board: 'none', bodge: true},
  {name: 'careful-selective', driving: 'careful', board: 'selective', bodge: true},
  {name: 'careful-every-offer', driving: 'careful', board: 'all', bodge: true},
  {name: 'swapper-selective', driving: 'swapper', board: 'selective', bodge: true},
  {name: 'swapper-every-offer', driving: 'swapper', board: 'all', bodge: true}
];
const SLOTS = ['engine', 'tyres', 'chassis', 'gadget'];
const CRITICAL = ['engine', 'tyres', 'chassis'];
const clone = value => JSON.parse(JSON.stringify(value));
const signature = v => JSON.stringify(v);
function roll(seed, race, salt) {
  let v = (seed ^ Math.imul(race + 1, 0x9e3779b1) ^ salt) >>> 0;
  v = Math.imul(v ^ (v >>> 16), 0x7feb352d);
  v = Math.imul(v ^ (v >>> 15), 0x846ca68b);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
}
let archive;
context.ScrapEncyclopaedia = {
  hasSeenWeather: id => archive.weather.has(id),
  hasSeenEvent: (kind, id, stage) => archive.events.has(id) &&
    (!Number.isInteger(stage) || stage <= 0 || (archive.stages.get(id) || 0) >= stage),
  hasSeenLegendary: () => archive.legendary,
  isGagKnown: id => archive.gags.has(id)
};
function newArchive() {
  return {weather: new Set(), events: new Set(), stages: new Map(), legendary: false, gags: new Set()};
}
function stats(s) {
  return E.environmentProfile(s, E.raceCard(s.seed, s.raceIndex, s)).pace;
}
function bestOffer(s, style) {
  const pace = stats(s), card = E.raceCard(s.seed, s.raceIndex, s);
  const reserve = style === 'careful' ? 0.018 : 0.007;
  const picks = E.shopOffers(s).filter(o => o.price <= s.credits || (s.bountyCoupons || 0) > 0)
    .map(o => {
      const adjusted = {...s, loadout: {...s.loadout, [o.slot]: o.id},
        levels: {...s.levels, [o.slot]: o.level},
        durability: {...s.durability, [o.slot]: 100}};
      const improvement = E.environmentProfile(adjusted, card).pace - pace;
      const recovery = (100 - s.durability[o.slot]) * (CRITICAL.includes(o.slot) ? .15 : .075);
      const danger = CRITICAL.includes(o.slot) && s.durability[o.slot] < 30 ? 8 : 0;
      return {...o, improvement,score: improvement + recovery + danger - o.price * reserve};
    }).sort((a,b) => b.score - a.score);
  return picks[0] || null;
}
function useVoucherOrBuy(s, offer, m) {
  if (!offer) return s;
  if ((s.bountyCoupons || 0) > 0) {
    m.vouchersSpent++;
    return E.claimBountyReplacement(s, offer.id);
  }
  if (offer.price <= s.credits) {
    m.purchases++;
    m.purchaseCost += offer.price;
    return E.buy(s, offer.id);
  }
  return s;
}
function mechanic(before, plan, m) {
  let s = before;
  const extreme = CRITICAL.filter(slot => s.durability[slot] === 0);
  for (const slot of extreme) {
    const quote = E.repairQuote(s, slot);
    const offer = E.shopOffers(s).find(x => x.slot === slot && x.price <= s.credits);
    if (!s.garageAction && offer) {s = useVoucherOrBuy(s, offer, m);continue;}
    if (quote.amount && !quote.locked && s.wrenches >= quote.cost) {
      s = E.repair(s, slot);m.repairs++;m.repairWrenches += quote.cost;continue;
    }
    if (plan.bodge && !s.garageAction && E.bodgeQuote(s, slot).available) {
      s = E.emergencyBodge(s, slot);m.bodges++;continue;
    }
  }
  if (!s.garageAction) {
    const best = bestOffer(s, plan.driving);
    const threshold = plan.driving === 'swapper' ? .8 : 4;
    if (best && best.score >= threshold) s = useVoucherOrBuy(s, best, m);
  }
  if (!s.garageAction) {
    const options = SLOTS.map(slot => {
      const q = E.partUpgradeQuote(s, slot);
      if (!q.affordable || s.durability[slot] < 55) return null;
      const proposed = {...s,levels:{...s.levels,[slot]:q.targetLevel}};
      return {slot,cost:q.cost,improvement:stats(proposed) - stats(s)};
    }).filter(Boolean).sort((a,b) => b.improvement / Math.max(1,b.cost) - a.improvement / Math.max(1,a.cost));
    const best = options[0];
    if (best && best.improvement > (plan.driving === 'swapper' ? 1.25 : 2.4)) {
      s = E.upgradePart(s, best.slot);m.tunes++;m.tuningCost += best.cost;
    }
  }
  // Repairs are separately allowed and escalate in wrench cost.
  const target = plan.driving === 'careful' ? 68 : 54;
  for (let pass=0;pass<3;pass++) {
    const options = CRITICAL.filter(slot => s.durability[slot] < target)
      .map(slot => ({slot,quote:E.repairQuote(s,slot),d:s.durability[slot]}))
      .filter(x => x.quote.amount>0 && !x.quote.locked && s.wrenches>=x.quote.cost)
      .sort((a,b)=>a.d-b.d);
    if (!options.length) break;
    const x=options[0];s=E.repair(s,x.slot);m.repairs++;m.repairWrenches+=x.quote.cost;
  }
  if (plan.bodge && !s.garageAction)
    for (const slot of CRITICAL.filter(x => s.durability[x]<=25).sort((a,b)=>s.durability[a]-s.durability[b])) {
      if(E.bodgeQuote(s,slot).available){s=E.emergencyBodge(s,slot);m.bodges++;break;}
    }
  const criticalMin=Math.min(s.durability.engine,s.durability.tyres);
  let approach = criticalMin < 52 || (plan.driving==='careful' && s.durability.chassis<55)
    ? 'careful' : plan.driving==='swapper' && criticalMin>=77 ? 'reckless' : 'balanced';
  if (s.approach!==approach) s=E.setApproach(s,approach);
  return s;
}
function takeSelective(offer,s){
  const id=offer.id,prev=s.history.at(-1),min=Math.min(s.durability.engine,s.durability.tyres);
  if(offer.gagId)return E.resolveGag(s)?.id===offer.gagId;
  if(offer.witness){
    if(offer.witness.kind==='weather')
      return E.raceCard(s.seed,s.raceIndex,s).weatherId===offer.witness.id && min>=38;
    return offer.races>=6 && min>=80 && s.wrenches>=2 &&
      !['lights-finale'].includes(id);
  }
  if(['balanced','careful','reckless'].includes(id))
    return s.approach===id && min>=42;
  if(id==='fresh')return s.garageAction?.kind==='replace';
  if(id==='bodge-podium'||id==='phoenix')return s.garageAction?.kind==='bodge' && min>=35;
  if(id==='worn')return CRITICAL.some(x=>s.durability[x]>0&&s.durability[x]<=25);
  if(id==='engine-cliff'||id==='tyre-cliff')return false;
  if(id==='everything-fine')return SLOTS.every(x=>s.durability[x]<=30);
  if(id==='clean')return min>=78&&s.approach==='careful';
  if(id==='survivor')return min>=85&&s.durability.chassis>=75;
  if(id==='comeback')return prev?.place>=4&&min>=65;
  if(id==='match')return prev&&!prev.failedSlot&&!prev.noStart&&min>=75;
  if(id==='no-repairs-five')return false;
  if(id==='risk-reward')return (s.bounties||[]).length>=1 && s.wrenches<2;
  if(id==='route'||id==='biscuit')return min>=80 && s.wrenches>=2;
  if(id==='third'||id==='second'||id==='fourth'||id==='fifth')
    return min>=65 && (s.bountyPenalties?.repairLock||0)===0;
  if(id==='drop')return prev?.place<=2&&min>=75;
  if(id==='double-disaster')return min>=80;
  return false;
}
function accept(s,plan,m){
  const offer=E.bountyOffer(s);
  if(offer){
    const cat=offer.category||'Unknown';
    m.offers[cat]=(m.offers[cat]||0)+1;
    if(offer.witness)m.longShotOffers++;
    if(plan.board!=='none'&&(s.bounties||[]).length<3 &&
      (plan.board==='all'||takeSelective(offer,s))){
      s=E.acceptBounty(s,offer.id);m.accepted++;
      if(offer.witness)m.longShotAccepted++;
    }
  }
  return s;
}
function choiceMap(s,plan,watch){
  const card=E.raceCard(s.seed,s.raceIndex,s),choices={};
  if(watch==='skip')return choices;
  for(const ev of card.events) {
    if(watch==='first-lap'&&ev.lap>1)continue;
    const def=E.eventDefinition(ev);
    if(def?.delivery!=='choice')continue;
    const chance=E.choiceSuccessChance(def,s,E.environmentProfile(s,card),E.resolveGag(s));
    if(chance >= (plan.driving==='swapper'?.54:.72) && Math.min(s.durability.engine,s.durability.tyres)>40)
      choices[ev.key]='risk';
  }
  return choices;
}
function watchResult(result,s,watch) {
  if(watch==='skip'||result.noStart)return s;
  const visible = watch==='all' ? result.laps : result.laps.filter(l=>l.lap===1);
  // Weather visible in the opening (unless presentation was skipped).
  archive.weather.add(result.weatherId);
  s=E.markBountyWitness(s,'w:'+result.weatherId);
  for(const lap of visible){
    for(const effect of lap.effects){
      if(effect.kind==='wear'||!effect.id)continue;
      const token='e:'+effect.kind+':'+effect.id+':'+(effect.stage||0);
      s=E.markBountyWitness(s,token);
      if(effect.kind==='anomaly'||effect.kind==='chain'){
        archive.events.add(effect.id);
        archive.stages.set(effect.id,Math.max(archive.stages.get(effect.id)||0,effect.stage||0));
        if(E.eventDefinition(effect)?.tags?.includes('legendary'))archive.legendary=true;
      }
      const def=E.eventDefinition(effect);
      if(def?.weatherId){
        archive.weather.add(def.weatherId);
        s=E.markBountyWitness(s,'w:'+def.weatherId);
      }
    }
  }
  for(const pass of result.passEvents||[])s=E.markBountyWitness(s,'p:'+pass.id);
  for(const fake of result.fakePassEvents||[])s=E.markBountyWitness(s,'f:'+fake.id);
  if(result.gagId)archive.gags.add(result.gagId);
  return s;
}
function sample(seed,plan){
  archive=newArchive();
  let s=E.newRun(seed);
  const m={races:0,completed:0,dnfs:0,dns:0,top3:0,wins:0,
    purchases:0,purchaseCost:0,vouchersSpent:0,tunes:0,tuningCost:0,
    repairs:0,repairWrenches:0,bodges:0,bodgeRepay:0,
    accepted:0,success:0,fail:0,longShotOffers:0,longShotAccepted:0,longShotWins:0,
    expiringFailure:0,shopLocks:0,repairLocks:0,extraEvents:0,
    watched:0,skipped:0,grossPrize:0,netPrize:0,credits:0,wrenches:0,debt:0,offers:{},
    awards:{},fails:{},finished:null,reached10:false,reached25:false,reached50:false};
  for(let i=0;i<MAX_RACES&&!s.finished;i++){
    if(s.phase!=='garage')throw Error('Race loop not in garage');
    if(s.bountyPenalties?.shopOne)m.shopLocks++;
    if(s.bountyPenalties?.repairLock)m.repairLocks++;
    if(s.bountyPenalties?.extraEvent)m.extraEvents++;
    s=mechanic(s,plan,m);
    s=accept(s,plan,m);
    const v=roll(seed,s.raceIndex,0x51a7bc0);
    const watch=v<.68?'all':v<.88?'first-lap':'skip';
    if(watch==='skip')m.skipped++;else m.watched++;
    const choices=choiceMap(s,plan,watch);
    const committed=signature(s);
    let next=E.race(s,choices);
    if(signature(s)!==committed)throw Error('Engine mutated garage state');
    const r=next.history.at(-1);
    assert.equal(next.raceIndex,i+1);
    next=watchResult(r,next,watch);
    next=E.finalizeWitnessBounties(next);
    assert(!next.bountyWitnessPending?.length,'Unsettled witnessed-only wager');
    assert.deepEqual(E.finalizeWitnessBounties(next),next,'Settlement idempotent');
    if(i%10===0){
      const restored=E.decodeSave(E.encodeSave(next));
      assert.equal(signature(restored),signature(E.validateSave(next)), 'Canonical save round-trip damaged state');
    }
    m.races++;m.completed+=!r.noStart&&!r.failedSlot?1:0;
    m.dns+=!!r.noStart;m.dnfs+=!r.noStart&&!!r.failedSlot?1:0;
    m.top3+=!r.noStart&&!r.failedSlot&&r.place<=3?1:0;
    m.wins+=!r.noStart&&!r.failedSlot&&r.place===1?1:0;
    m.grossPrize+=r.grossPrize??r.prize;
    m.netPrize+=r.prize;
    m.bodgeRepay+=r.bodgeRepayment||0;
    for(const x of r.bountyResults||[]){
      if(x.success){m.success++;m.awards[x.id]=(m.awards[x.id]||0)+1;
        if(E.bountyDefinitions.find(d=>d.id===x.id)?.witness)m.longShotWins++;
      } else {m.fail++;m.fails[x.id]=(m.fails[x.id]||0)+1;}
    }
    if(next.credits<0||next.wrenches<0||next.bodge?.debt<0||(next.bountyCoupons||0)>3)
      throw Error('Economy underflow or voucher overflow');
    s=next;
    if(!s.finished)s=E.continueRun(s);
  }
  m.credits=s.credits;m.wrenches=s.wrenches;m.debt=s.bodge?.debt||0;
  m.finished=s.finished||'cap';m.reached10=s.raceIndex>=10;
  m.reached25=s.raceIndex>=25;m.reached50=s.raceIndex>=50;
  m.reached75=s.raceIndex>=75;m.reached100=s.raceIndex>=100;
  m.reached120=s.raceIndex>=120;
  m.stageFinales=[...archive.stages.values()].filter(n=>n>=4).length;
  m.legendarySeen=archive.legendary?1:0;
  return m;
}
function summarize(rows){
  const n=rows.length,sum=k=>rows.reduce((a,x)=>a+x[k],0);
  const keys=['races','completed','dnfs','dns','top3','wins','purchases','purchaseCost',
    'vouchersSpent','tunes','tuningCost','repairs','repairWrenches','bodges','bodgeRepay',
    'accepted','success','fail','longShotOffers','longShotAccepted','longShotWins',
    'shopLocks','repairLocks','extraEvents','watched','skipped','grossPrize','netPrize',
    'credits','wrenches','debt','stageFinales','legendarySeen'];
  const z={seeds:n,meanRaces:Math.round(sum('races')/n*10)/10,
    medianRaces:rows.map(r=>r.races).sort((a,b)=>a-b)[Math.floor(n/2)],
    reached10:sum('reached10'),reached25:sum('reached25'),reached50:sum('reached50'),
    reached75:sum('reached75'),reached100:sum('reached100'),reached120:sum('reached120'),
    strikeOut:rows.filter(r=>r.finished==='strikes').length};
  for(const k of keys)z[k]=sum(k);
  z.avgEndCredits=Math.round(z.credits/n);
  z.avgEndWrenches=Math.round(z.wrenches/n*10)/10;
  z.avgEndDebt=Math.round(z.debt/n);
  z.offerCategories={};z.winsByContract={};z.failsByContract={};
  for(const r of rows){
    for(const [k,v]of Object.entries(r.offers))z.offerCategories[k]=(z.offerCategories[k]||0)+v;
    for(const [k,v]of Object.entries(r.awards))z.winsByContract[k]=(z.winsByContract[k]||0)+v;
    for(const [k,v]of Object.entries(r.fails))z.failsByContract[k]=(z.failsByContract[k]||0)+v;
  }
  return z;
}
const output={method:'deterministic simulation, not human playtest',maxRaces:MAX_RACES,seeds:SEEDS,
  cohorts:{},noManualEventInjection:true};
for(const plan of PLANS){
  const runs=SEEDS.map(seed=>sample(seed,plan));
  output.cohorts[plan.name]=summarize(runs);
  assert.equal(output.cohorts[plan.name].seeds,SEEDS.length);
  assert(output.cohorts[plan.name].races>=SEEDS.length);
  assert.equal(output.cohorts[plan.name].success+output.cohorts[plan.name].fail,
    Object.values(output.cohorts[plan.name].winsByContract).reduce((a,b)=>a+b,0)+
    Object.values(output.cohorts[plan.name].failsByContract).reduce((a,b)=>a+b,0));
}
assert.equal(output.cohorts['careful-no-board-no-bodge'].accepted,0);
assert.equal(output.cohorts['careful-no-board'].accepted,0);
assert.equal(output.cohorts['careful-no-board-no-bodge'].bodges,0);
assert(output.cohorts['careful-every-offer'].accepted>=output.cohorts['careful-selective'].accepted);
console.log('ECONOMY_PLAYTHROUGH_JSON='+JSON.stringify(output));
console.log('PASS: start-from-scratch, matched seeds, legitimate shop/repair choices, active bounties and witnessed settlements');
