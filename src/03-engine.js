
/* Scrap Prix v0.7.9 deterministic rules engine. Course + surface + weather decide
   what a car wants; Event Waves 1-5 add themed anomalies, multi-stage events and pass variants. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'), null);
  else root.ScrapEngine = factory(root.ScrapData, root.ScrapLegacyEngine);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (D) {
  'use strict';
  const {TUNING:T,SLOTS,CRITICAL,PARTS,TRACKS,SURFACES,SIGNATURES,WILDCARDS,PASS_EVENTS,FAKE_PASS_EVENTS,WEATHER,APPROACHES,RIVALS}=D;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const round=n=>Math.round(n*10)/10;
  const round5=n=>Math.max(5,Math.round(n/5)*5);
  const part=id=>PARTS.find(p=>p.id===id);
  const track=id=>TRACKS.find(t=>t.id===id);
  const surface=id=>SURFACES.find(s=>s.id===id);
  const signature=id=>SIGNATURES.find(e=>e.id===id);
  const wildcard=id=>WILDCARDS.find(e=>e.id===id);
  const weather=id=>WEATHER.find(w=>w.id===id);
  const anomaly=id=>D.ANOMALIES.find(e=>e.id===id);
  const passEvent=id=>(PASS_EVENTS||[]).find(e=>e.id===id);
  const fakePassEvent=id=>(FAKE_PASS_EVENTS||[]).find(e=>e.id===id);
  function eventDefinition(e){
    if(!e)return null;
    const base=e.kind==='signature'?signature(e.id):(e.kind==='anomaly'||e.kind==='chain')?anomaly(e.id):wildcard(e.id);
    if(!base)return null;
    if(e.stage&&base.stages?.[e.stage-1])return {...base,...base.stages[e.stage-1],stage:e.stage};
    return base;
  }
  function fail(s){throw Error(s);}
  function integer(n,min,max,name){if(!Number.isInteger(n)||n<min||n>max)fail('Invalid '+name+'.');}
  function finite(n,min,max,name){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)fail('Invalid '+name+'.');}
  function random(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
  function salted(seed,index,salt){return random((seed^Math.imul(index+1,0x9E3779B1)^salt)>>>0);}
  function shuffle(items,rng){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function weightedChoice(weights,rng){const entries=Object.entries(weights).filter(([,v])=>v>0),total=entries.reduce((n,[,v])=>n+v,0);let roll=rng()*total;for(const [id,w] of entries){roll-=w;if(roll<0)return id;}return entries.at(-1)?.[0];}
  function stream(seed,index,name){let hash=2166136261;for(const c of name)hash=Math.imul(hash^c.charCodeAt(0),16777619);return salted(seed,index,hash>>>0);}

  function marketLevel(raceIndex){integer(raceIndex,0,9999999,'race index');return Math.min(T.maxLevel,1+Math.floor(raceIndex/T.marketCadence));}
  function postCapRaces(raceIndex){const capStart=(T.maxLevel-1)*T.marketCadence;return Math.max(0,raceIndex-capStart);}
  function generationForTier(level){return level>0?1:0;}
  function equipmentLevel(level){integer(level,0,T.maxLevel,'equipment level');return level;}
  function minimumTier(item){return item?.price>0?1:0;}
  function freshPrice(level){integer(level,1,T.maxLevel,'equipment level');return round5(50+20*level+1.5*level*level);}
  function upgradePrice(item,level){if(!item||!item.price)fail('Starter equipment has no purchase price.');return freshPrice(level);}
  function tunePrice(targetLevel){return round5(freshPrice(targetLevel)*.30);}
  function basePrize(raceIndex){return T.basePrize+10*marketLevel(raceIndex);}
  function wrenchDropChance(raceIndex){return Math.max(T.wrenchDropFloor,T.wrenchDropStart-raceIndex*T.wrenchDropDecay);}

  function resolveGag(input){
    const loadout=input?.loadout||input;
    if(!loadout)return null;
    const hits=D.GAG_RECIPES.filter(g=>Object.entries(g.requires).every(([slot,id])=>loadout[slot]===id));
    return hits.length===1?hits[0]:null;
  }
  function gagEffect(input){const gag=resolveGag(input);return gag?D.GAG_EFFECTS[gag.id]||null:null;}

  function affinityWeights(base,state,gag){
    const out={...base};
    if(!state||!gag||state.gagStreak?.id!==gag.id||!state.gagStreak.count)return out;
    const bonusPP=Math.min(T.gagAffinityCap,T.gagAffinityPerRace*state.gagStreak.count);
    const ids=Object.keys(out).filter(id=>wildcard(id)?.favouredGags?.includes(gag.id));
    if(!ids.length)return out;
    const total=Object.values(out).reduce((a,b)=>a+b,0);
    const totalWeightBonus=total*bonusPP;
    for(const id of ids)out[id]+=(totalWeightBonus/ids.length);
    return out;
  }

  function chooseSurface(t,rng){return weightedChoice(t.surfaceWeights,rng);}
  function chooseWeather(surfaceId,rng){return weightedChoice(D.WEATHER_WEIGHTS[surfaceId]||D.WEATHER_WEIGHTS.smooth,rng);}
  function raceCard(seed,raceIndex,state=null){
    integer(seed,0,4294967295,'seed');integer(raceIndex,0,9999999,'race index');
    const cycle=Math.floor(raceIndex/TRACKS.length);
    const ids=shuffle(TRACKS.map(t=>t.id),salted(seed,cycle,0x431B0091));
    const t=track(ids[raceIndex%TRACKS.length]);
    const surfaceId=chooseSurface(t,stream(seed,raceIndex,'surface'));
    const weatherId=chooseWeather(surfaceId,stream(seed,raceIndex,'weather'));
    const depth=Math.min(1,raceIndex/45),lapRoll=stream(seed,raceIndex,'length')();
    const opening=[.52,.30,.14,.03,.01],late=[.10,.18,.29,.28,.15];let lapCount=7,c=0;
    for(let i=0;i<opening.length;i++){c+=opening[i]+(late[i]-opening[i])*depth;if(lapRoll<c){lapCount=i+3;break;}}
    const signatureLap=Math.ceil(lapCount/2),gag=state?resolveGag(state):null;
    const events=[{key:'signature',kind:'signature',lap:signatureLap,id:t.signature}];
    let choiceAlready=false;
    for(const [key,chance,baseWeights,lap] of [
      ['opening',D.RACE_RULES.openingChance,D.RACE_RULES.openingWeights,1],
      ['late',D.RACE_RULES.lateChance,D.RACE_RULES.lateWeights,lapCount]
    ]){
      const rng=stream(seed,raceIndex,key);
      if(rng()>=chance)continue;
      let weights=affinityWeights(baseWeights,state,gag);
      if(choiceAlready)weights=Object.fromEntries(Object.entries(weights).filter(([id])=>wildcard(id)?.delivery!=='choice'));
      const id=weightedChoice(weights,rng),def=wildcard(id);
      if(!id||!def)continue;
      if(def.delivery==='choice')choiceAlready=true;
      events.push({key,kind:'optional',lap,id});
    }
    const special=stream(seed,raceIndex,'anomaly');
    if(D.RACE_RULES.anomalyChance>0&&D.ANOMALIES.length&&special()<D.RACE_RULES.anomalyChance){
      let candidates=D.ANOMALIES.filter(def=>(!def.surfaces||def.surfaces.includes(surfaceId))&&(!def.tracks||def.tracks.includes(t.id))&&(!choiceAlready||def.delivery!=='choice'));
      if(candidates.length){
        const weights=Object.fromEntries(candidates.map(def=>[def.id,D.ANOMALY_WEIGHTS?.[def.id]||def.weight||1]));
        const id=weightedChoice(weights,special),def=anomaly(id),lap=1+Math.floor(special()*lapCount);
        const initial={key:'anomaly',kind:'anomaly',lap,id,stage:def?.stages?1:null};events.push(initial);
        if(def?.delivery==='choice')choiceAlready=true;
        if(def?.multiStage&&def.stages?.length>1){
          let stage=1;const chainRng=stream(seed,raceIndex,'chain:'+id);
          for(let l=lap+1;l<=lapCount&&stage<def.stages.length;l++){
            const guaranteed=stage===1&&def.multiStage.guaranteeSecond;
            if(guaranteed||chainRng()<(def.multiStage.followupChance??.5)){
              stage++;events.push({key:`anomaly-${id}-${stage}`,kind:'chain',lap:l,id,stage});
            }
          }
        }
      }
    }
    events.sort((a,b)=>a.lap-b.lap||((a.kind==='anomaly'||a.kind==='chain')?-1:(b.kind==='anomaly'||b.kind==='chain')?1:0));
    return {trackId:t.id,surfaceId,sceneId:t.scene||surface(surfaceId)?.scene||'ring',signatureId:t.signature,weatherId,lapCount,signatureLap,wearMultiplier:1+Math.max(0,lapCount-3)*.12,events};
  }
  function raceOutlook(seed,raceIndex){
    const c=raceCard(seed,raceIndex+1),t=track(c.trackId),s=surface(c.surfaceId);
    if(s.roughness>=4||t.course.impact>=5)return 'Rough, punishing terrain likely.';
    if(s.traction>=4)return 'Low-traction conditions expected.';
    if(t.course.endurance>=5)return 'A long endurance-heavy race is expected.';
    if(t.course.straight>=4&&s.roughness<=1)return 'Smooth high-speed racing expected.';
    if(t.course.cornering>=4)return 'A technical, corner-heavy race is likely.';
    return 'Mixed conditions expected.';
  }

  function stockForRound(s,round,attempt=0){
    const rng=salted(s.seed,s.raceIndex,(0x5A0B2026^Math.imul(round,0x9E3779B1)^Math.imul(attempt,0x7F4A7C15))>>>0);
    const slots=shuffle(SLOTS,rng).slice(0,T.shopCount),market=marketLevel(s.raceIndex);
    return slots.map(slot=>{
      const roll=rng();let delta=roll<.10?-1:roll<.77?0:roll<.97?1:2;
      const level=clamp(market+delta,1,T.maxLevel);
      const pool=PARTS.filter(p=>p.slot===slot&&p.price>0);
      const item=pool[Math.floor(rng()*pool.length)];
      return {id:item.id,slot,tier:level,level,generation:1,marketLevel:market,price:upgradePrice(item,level)};
    });
  }
  function shopOffers(s){
    const round=s.shopRefreshes;integer(round,0,T.maxShopRefreshes,'shop refresh count');
    if(round===0)return stockForRound(s,0);
    const previous=stockForRound({...s,shopRefreshes:0},0),before=previous.map(o=>`${o.id}:${o.level}`).join('|');
    for(let attempt=0;attempt<24;attempt++){const offers=stockForRound(s,round,attempt);if(offers.map(o=>`${o.id}:${o.level}`).join('|')!==before)return offers;}
    return previous;
  }
  function shopRefreshQuote(s){
    garage(s);const market=marketLevel(s.raceIndex),cost=Math.max(50,round5(freshPrice(market)*.40));
    const available=s.shopRefreshes<T.maxShopRefreshes&&!s.garageAction;
    return {cost,available,affordable:available&&s.credits>=cost,count:s.shopRefreshes,marketLevel:market};
  }
  function refreshShop(s){const q=shopRefreshQuote(s);if(!q.available)fail('This workshop refresh has already been used or the build action is spent.');if(!q.affordable)fail('Not enough money to refresh this workshop.');const next=clone(s);next.credits-=q.cost;next.shopRefreshes++;return next;}

  const SHOWCASE_GOALS=Object.freeze([
    {id:'podium',title:'Scrapyard Showdown',goal:'Finish in the top 3',bonusCredits:45,bonusPoints:100},
    {id:'victory',title:"Champion's Challenge",goal:'Finish in 1st place',bonusCredits:65,bonusPoints:150},
    {id:'clean',title:'Keep It Together',goal:'Finish with low total damage',bonusCredits:55,bonusPoints:120}
  ]);
  function showcaseForRace(seed,raceIndex,card=raceCard(seed,raceIndex)){if((raceIndex+1)%10!==0)return null;const round=Math.floor(raceIndex/10),choice=SHOWCASE_GOALS[(seed%SHOWCASE_GOALS.length+round)%SHOWCASE_GOALS.length],threshold=choice.id==='clean'?16+(card.lapCount-3)*3:null;return{...choice,threshold,goal:choice.id==='clean'?`Finish with ${threshold} or less total damage`:choice.goal};}
  function settleShowcase(goal,failedSlot,place,damage){if(!goal)return null;const success=!failedSlot&&(goal.id==='victory'?place===1:goal.id==='podium'?place<=3:damage<=goal.threshold);return{...goal,success,credits:success?goal.bonusCredits:0,points:success?goal.bonusPoints:0};}

  function newRun(seed=20261017){
    integer(seed,0,4294967295,'seed');const loadout=Object.fromEntries(SLOTS.map(slot=>[slot,PARTS.find(p=>p.slot===slot&&p.price===0).id]));
    return {version:T.version,seed,phase:'garage',finished:null,raceIndex:0,credits:T.startingCredits,wrenches:T.startingWrenches,points:0,approach:'balanced',loadout,
      levels:Object.fromEntries(SLOTS.map(s=>[s,0])),durability:Object.fromEntries(SLOTS.map(s=>[s,T.maxDurability])),repairs:Object.fromEntries(SLOTS.map(s=>[s,0])),
      garageAction:null,shopRefreshes:0,noStartStrikes:0,gagStreak:{id:null,count:0},discoveredGags:[],history:[]};
  }
  function garage(s){if(s.phase!=='garage'||s.finished)fail('Return to a working garage before changing your car.');}
  function tierBonus(level){integer(level,0,T.maxLevel,'level');return level<=1?0:round((level-1)*.05);}
  function partStats(item,level){
    if(!item)fail('Unknown component.');integer(level,0,T.maxLevel,'level');
    if(item.price===0)return {...item.stats};
    if(level<1)fail('Purchased component requires level 1 or above.');
    const mult=1+.05*(level-1),out={};
    for(const [k,v] of Object.entries(item.stats))out[k]=v>0?round(v*mult):v;
    return out;
  }
  function conditionEfficiency(d){integer(d,0,100,'part durability');if(d===0)return 0;if(d>=75)return 1;if(d>=50)return round(.90+.10*(d-50)/25);if(d>=25)return round(.65+.25*(d-25)/25);return round(.50+.15*(d-1)/24);}
  function stats(s){
    const result={power:0,grip:0,armour:0,cooling:0};
    for(const slot of SLOTS){if(s.durability[slot]===0)continue;const item=part(s.loadout[slot]);if(!item||item.slot!==slot)fail('Unknown installed part.');const values=partStats(item,s.levels[slot]),eff=conditionEfficiency(s.durability[slot]);for(const k of Object.keys(result)){const adjusted=values[k]>0?round(values[k]*eff):values[k];result[k]=round(result[k]+adjusted);}}
    for(const k of Object.keys(result))result[k]=Math.max(0,result[k]);return result;
  }
  function vehicleWeight(s){return SLOTS.reduce((sum,slot)=>{const p=part(s.loadout[slot]);if(!p||p.slot!==slot)fail('Unknown installed part.');return sum+p.weight;},0);}
  // Gadget traits are passive equipment effects, not part of the vehicle's identity.
  // A 0%-condition gadget stays installed (including gag recipes) but supplies no perks.
  function activeGadgetTraits(s){return s.durability.gadget>0?(part(s.loadout.gadget)?.traits||{}):{};}
  function evasionRate(){return 0;}
  function upgradeCondition(){return 100;}
  function effectiveStats(s){const st=stats(s),a=APPROACHES[s.approach]||APPROACHES.balanced;st.power=Math.max(0,round(st.power+a.power));st.grip=Math.max(0,round(st.grip+a.grip));return st;}

  function partUpgradeQuote(s,slot){
    garage(s);if(!SLOTS.includes(slot))fail('Unknown component slot.');const item=part(s.loadout[slot]);if(!item||item.slot!==slot)fail('Invalid fitted component.');
    const currentLevel=s.levels[slot],purchased=item.price>0&&currentLevel>=1,atCap=purchased&&currentLevel>=T.maxLevel,targetLevel=purchased?Math.min(T.maxLevel,currentLevel+1):0,market=marketLevel(s.raceIndex);
    const marketLocked=purchased&&!atCap&&targetLevel>market,cost=purchased&&!atCap?tunePrice(targetLevel):0,alreadyUsed=!!s.garageAction;
    const available=purchased&&!atCap&&!marketLocked&&!alreadyUsed;
    return {slot,itemId:item.id,generation:purchased?1:0,currentTier:currentLevel,targetTier:targetLevel,cap:T.maxLevel,currentLevel,targetLevel,capLevel:T.maxLevel,cost,purchased,atCap,atMax:atCap,marketLocked,alreadyUsed,available,affordable:available&&s.credits>=cost,marketLevel:market};
  }
  function upgradePart(s,slot){const q=partUpgradeQuote(s,slot);if(!q.available)fail(q.marketLocked?'Tuning cannot exceed the current Market Level.':'You cannot tune that component at this workshop.');if(!q.affordable)fail('Not enough money to tune that component.');const next=clone(s);next.credits-=q.cost;next.levels[slot]=q.targetLevel;next.garageAction={kind:'tune',slot};return next;}
  function gadgetTuneQuote(s){return partUpgradeQuote(s,'gadget');}
  function tuneGadget(s){return upgradePart(s,'gadget');}
  function buy(s,id){garage(s);const item=part(id);if(!item||!item.price)fail('This component does not exist.');if(s.garageAction)fail('You already tuned or replaced a part at this stop.');const offer=shopOffers(s).find(o=>o.id===id);if(!offer)fail('That component is not offered in this workshop.');if(s.credits<offer.price)fail('Not enough money for that replacement.');const next=clone(s);next.credits-=offer.price;next.loadout[item.slot]=item.id;next.levels[item.slot]=offer.level;next.durability[item.slot]=100;next.repairs[item.slot]=0;next.garageAction={kind:'replace',slot:item.slot};return next;}
  function setApproach(s,id){garage(s);if(!Object.hasOwn(APPROACHES,id))fail('Unknown driving approach.');return{...clone(s),approach:id};}
  function repairQuote(s,slot){if(!SLOTS.includes(slot))fail('Unknown component slot.');const amount=Math.min(T.repairAmount,T.maxDurability-s.durability[slot]);return{amount,cost:amount?s.repairs[slot]+1:0};}
  function repair(s,slot){garage(s);const q=repairQuote(s,slot);if(!q.amount)fail('That component is already fully repaired.');if(s.wrenches<q.cost)fail('Not enough wrenches.');const next=clone(s);next.wrenches-=q.cost;next.durability[slot]+=q.amount;next.repairs[slot]++;return next;}

  // Last-resort safety valve. No free prize money or normal repair resources.
  // The legacy save schema remains valid until the player uses a bodge.
  const BODGE_MAX_USES=3,BODGE_COOLDOWN_RACES=3,BODGE_CONDITION_LIMIT=25,BODGE_RESTORE=30;
  function bodgeQuote(s,slot){
    garage(s);
    if(!CRITICAL.includes(slot))fail('Only engine, tyres and chassis can be bodged.');
    const bodge=s.bodge||{uses:0,lastRaceIndex:-1,debt:0};
    const repairOption=repairQuote(s,slot);
    const canRepair=!(s.bountyPenalties?.repairLock>0)&&repairOption.amount>0&&s.wrenches>=repairOption.cost;
    const canReplace=!s.garageAction&&shopOffers(s).some(offer=>offer.slot===slot&&s.credits>=offer.price);
    const amount=Math.min(BODGE_RESTORE,T.maxDurability-s.durability[slot]);
    const wait=bodge.uses>0?Math.max(0,BODGE_COOLDOWN_RACES-(s.raceIndex-bodge.lastRaceIndex)):0;
    const fee=60+20*bodge.uses;
    let reason='';
    if(s.durability[slot]>BODGE_CONDITION_LIMIT)reason='Only available at 25% condition or lower.';
    else if(canRepair||canReplace)reason='A normal repair or affordable replacement is available.';
    else if(s.garageAction)reason='Your build action has already been used.';
    else if(bodge.uses>=BODGE_MAX_USES)reason='No emergency bodges remain this run.';
    else if(wait>0)reason=`Available after ${wait} more race${wait===1?'':'s'}.`;
    else if(amount<=0)reason='No repair needed.';
    return {slot,amount,fee,uses:bodge.uses,maxUses:BODGE_MAX_USES,debt:bodge.debt,
      wait,available:reason==='',reason};
  }
  function emergencyBodge(s,slot){
    const q=bodgeQuote(s,slot);
    if(!q.available)fail(q.reason||'Emergency bodge unavailable.');
    const next=clone(s),old=next.bodge||{uses:0,lastRaceIndex:-1,debt:0};
    next.durability[slot]=Math.min(T.maxDurability,next.durability[slot]+q.amount);
    next.bodge={uses:old.uses+1,lastRaceIndex:next.raceIndex,debt:old.debt+q.fee};
    next.garageAction={kind:'bodge',slot};
    return next;
  }

  function tyreGripMultiplier(tyre,surf,t,w,gag){
    let mult=w.grip||1,tr=tyre?.traits||{};const dry=!['rain','snowfall','blizzard'].includes(w.id)&&!['snow','ice'].includes(surf.id),smooth=surf.roughness===0&&surf.softness===0,loose=surf.traction>=2||surf.softness>=2||surf.roughness>=2;
    if(tr.drySmoothGripBonus&&dry&&smooth)mult*=1+tr.drySmoothGripBonus;
    if(tr.wetGripPenalty&&(['rain','snowfall','blizzard'].includes(w.id)||['snow','ice'].includes(surf.id)))mult*=1-tr.wetGripPenalty;
    if(tr.looseGripPenalty&&loose)mult*=1-tr.looseGripPenalty;
    if(tr.roughGripPenalty&&loose)mult*=1-tr.roughGripPenalty;
    if(tr.looseGripBonus&&loose)mult*=1+tr.looseGripBonus;
    if(tr.softGripBonus&&['sand','mud','snow'].includes(surf.id))mult*=1+tr.softGripBonus;
    if(tr.cornerGripPenalty&&t.course.cornering>=4)mult*=1-tr.cornerGripPenalty;
    return mult;
  }
  function environmentProfile(s,card){
    const t=track(card.trackId),surf=surface(card.surfaceId),w=weather(card.weatherId),st=effectiveStats(s),weight=vehicleWeight(s),gag=resolveGag(s),ge=gag?D.GAG_EFFECTS[gag.id]||{}:{};
    // Broken items remain physically installed but have zero mechanical output, including terrain/trait effects.
    const tyre=s.durability.tyres>0?part(s.loadout.tyres):null,engine=s.durability.engine>0?part(s.loadout.engine):null,chassis=s.durability.chassis>0?part(s.loadout.chassis):null,gadget=part(s.loadout.gadget),gadgetTraits=activeGadgetTraits(s);
    let grip=st.grip*tyreGripMultiplier(tyre,surf,t,w,gag),windReduction=gadgetTraits.windReduction||0;if(gag?.id==='plane')windReduction=clamp(windReduction+(ge.extraWindReduction||0),0,.9);grip*=1-(w.wind||0)*(1-windReduction)*.35;
    if(gag?.id==='spaceship')grip+=1;
    if(gag?.id==='dune'&&surf.id==='sand')grip*=1+(ge.sandGripBonus||0);
    if(gag?.id==='snowmobile'&&['snow','ice'].includes(surf.id))grip*=1+(ge.winterGripBonus||0);
    if(gadget?.id==='aero-kit'&&gadgetTraits.smoothGripBonus&&surf.roughness===0&&surf.softness===0&&t.course.straight>=3)grip*=1+gadgetTraits.smoothGripBonus;
    grip=Math.max(.1,grip);
    let power=st.power;
    if(gag?.id==='burger')power+=Math.min(ge.coolingToPowerCap||0,Math.max(0,(st.cooling-8)*.30));
    const loose=surf.traction>=2||surf.softness>=2||surf.roughness>=2;
    if(loose&&engine?.traits?.loosePowerPenalty)power*=1-engine.traits.loosePowerPenalty*Math.min(1,(surf.traction+surf.softness+surf.roughness)/10);
    if(loose&&engine?.traits?.roughPowerPenalty)power*=1-engine.traits.roughPowerPenalty*Math.min(1,(surf.roughness+surf.softness)/7);
    if(tyre?.traits?.smoothPowerPenalty&&surf.roughness===0&&surf.softness===0)power*=1-tyre.traits.smoothPowerPenalty;
    if(tyre?.traits?.straightEfficiency)power*=1+tyre.traits.straightEfficiency*(t.course.straight/5);
    if(gag?.id==='train')power*=1+(ge.straightPowerBonus||0)*(t.course.straight/5);
    if(gag?.id==='muscle'&&surf.roughness===0&&surf.softness===0&&!['rain','snowfall','blizzard'].includes(w.id))power*=1+(ge.dryStraightPowerBonus||0)*(t.course.straight/5);
    const tractionNeed=4+surf.traction*2+surf.softness*1.2+t.course.cornering*.4;
    let delivery=clamp(.42+grip/(tractionNeed*1.55),.35,1.04);
    const torque=engine?.traits?.torque||0;if(torque)delivery+=torque*(surf.softness/5)*.12;
    delivery=clamp(delivery,.35,1.08);const usablePower=power*delivery;
    let massPenalty=Math.max(0,weight-T.baseWeight)*t.course.acceleration*.18-Math.max(0,T.baseWeight-weight)*t.course.acceleration*.055;
    if(ge.massAccelerationReduction&&massPenalty>0)massPenalty*=1-ge.massAccelerationReduction;
    let roughPenalty=surf.roughness*(1.7+Math.max(0,T.baseWeight-weight)*.045),softWeightReduction=tyre?.traits?.softWeightReduction||0;
    if(chassis?.traits?.roughMomentumBonus)roughPenalty*=1-chassis.traits.roughMomentumBonus;
    if(chassis?.traits?.roughMomentumPenalty)roughPenalty*=1+chassis.traits.roughMomentumPenalty;
    if(ge.roughMomentumReduction)roughPenalty*=1-ge.roughMomentumReduction;
    let softPenalty=surf.softness*weight*.075*(1-softWeightReduction);if(torque)softPenalty*=1-.30*torque;if(ge.softPenaltyReduction)softPenalty*=1-ge.softPenaltyReduction;if(gag?.id==='dune'&&surf.id==='sand'&&ge.sandPenaltyReduction)softPenalty*=1-ge.sandPenaltyReduction;if(gag?.id==='snowmobile'&&surf.id==='snow'&&ge.snowPenaltyReduction)softPenalty*=1-ge.snowPenaltyReduction;
    let heat=Math.max(0,power-st.cooling-6+t.course.endurance*.9+(w.heat||0));if(ge.heatReduction)heat*=1-ge.heatReduction;
    const heatPenalty=heat*(.28+t.course.endurance*.13);
    const conditionPenalty=CRITICAL.reduce((n,slot)=>n+(100-s.durability[slot]),0)/24;
    const pace=usablePower*(1.45+t.course.straight*.36)+grip*(1.05+t.course.cornering*.38)-massPenalty-roughPenalty-softPenalty-heatPenalty-conditionPenalty;
    return {gag,stats:st,weight,grip:round(grip),power:round(power),usablePower:round(usablePower),delivery:round(delivery),massPenalty:round(massPenalty),roughPenalty:round(roughPenalty),softPenalty:round(softPenalty),heat:round(heat),heatPenalty:round(heatPenalty),conditionPenalty:round(conditionPenalty),pace:round(pace)};
  }

  const RIVAL_PROFILES=Object.freeze({
    formula:{power:2.1,grip:1.8,armour:.25,cooling:.55,mass:.55},
    gt:{power:1.35,grip:1.45,armour:.9,cooling:.8,mass:.35},
    monster:{power:.75,grip:1.05,armour:2.1,cooling:.85,mass:.20},
    hybrid:{power:1.2,grip:1.1,armour:1.0,cooling:1.25,mass:.30}
  });
  function rivalTierBudget(raceIndex){return marketLevel(raceIndex)*4;}
  function rivalBuilds(seed,raceIndex){
    const market=marketLevel(raceIndex),profiles=shuffle(Object.keys(RIVAL_PROFILES),salted(seed,raceIndex,0xC3215B89));
    return RIVALS.map((r,i)=>{const rng=salted(seed,raceIndex,(0x60AB7E41^Math.imul(i+1,0x45D9F3B))>>>0),archetype=profiles[i],profile=RIVAL_PROFILES[archetype],variation=rng()<.15?-1:rng()>.90?1:0,level=clamp(market+variation,1,T.maxLevel),loadout={},levels={};
      for(const slot of SLOTS){const candidates=PARTS.filter(p=>p.slot===slot&&p.price>0),scored=candidates.map(item=>{const st=partStats(item,level),score=st.power*profile.power+st.grip*profile.grip+st.armour*profile.armour+st.cooling*profile.cooling-item.weight*profile.mass+(rng()-.5)*5;return{item,score};}).sort((a,b)=>b.score-a.score);const pick=scored[Math.floor(rng()*Math.min(3,scored.length))];loadout[slot]=pick.item.id;levels[slot]=level;}
      const full={loadout,levels,durability:Object.fromEntries(SLOTS.map(slot=>[slot,100])),approach:'balanced'};return{name:r.name,archetype,budget:level*4,loadout,levels,stats:stats(full),weight:vehicleWeight(full)};});
  }
  function rivalIncidentExposure(raceIndex){return clamp(1-raceIndex/65,0,1);}
  function scoreRivalBuild(build,seed,raceIndex,card){const s={loadout:build.loadout,levels:build.levels,durability:Object.fromEntries(SLOTS.map(slot=>[slot,100])),repairs:Object.fromEntries(SLOTS.map(slot=>[slot,0])),approach:'balanced'},profile=environmentProfile(s,card),post=postCapRaces(raceIndex),rng=stream(seed,raceIndex,'rival-score:'+build.name),scale=1+post*T.postCapRivalPerRace;return{base:profile.pace,heatPenalty:profile.heatPenalty,weightPenalty:profile.massPenalty,score:round(profile.pace*.97*scale+(rng()-.5)*5)};}
  function rivalIncidentSetbacks(build,seed,raceIndex,card){const exposure=rivalIncidentExposure(raceIndex),rng=stream(seed,raceIndex,'rival-events:'+build.name);let penalty=0,damage=0;for(const e of card.events){const def=eventDefinition(e);if(!def)continue;const harmful=e.kind==='signature'||def.extraDamage>0;if(harmful&&rng()<.25*exposure){const hit=e.kind==='signature'?Math.max(1,def.severity*.25):Math.max(1,def.extraDamage*.5);damage+=hit;penalty+=hit*.25;}}return{incidentExposure:round(exposure),incidentDamage:round(damage),incidentPenalty:round(penalty),incidentHits:[]};}

  function distributeDamage(total,weights){const sum=SLOTS.reduce((v,slot)=>v+Math.max(0,weights[slot]||0),0)||1,actual={};let used=0;const fractions=SLOTS.map(slot=>{const raw=total*Math.max(0,weights[slot]||0)/sum,amount=Math.floor(raw);actual[slot]=amount;used+=amount;return{slot,fraction:raw-amount};}).sort((a,b)=>b.fraction-a.fraction||SLOTS.indexOf(a.slot)-SLOTS.indexOf(b.slot));for(let i=0;i<total-used;i++)actual[fractions[i%fractions.length].slot]++;return actual;}
  function strongestMitigation(sig,st){if(!sig)return'armour';const choices={power:st.power*.15,grip:st.grip*.25,armour:st.armour*.45,cooling:st.cooling*.10};return Object.entries(choices).sort((a,b)=>b[1]-a[1])[0][0];}
  function eventGagAdjustment(def,gag){
    if(!def||!gag||!def.favouredGags?.includes(gag.id))return{damageMultiplier:1,score:0};
    const table={
      mower:{damageMultiplier:.10,score:5},train:{damageMultiplier:0,score:6},boat:{damageMultiplier:0,score:5},tank:{damageMultiplier:.15,score:5},monster:{damageMultiplier:.20,score:5},burger:{damageMultiplier:0,score:4},icecream:{damageMultiplier:.20,score:4},plane:{damageMultiplier:.20,score:4},f1:{damageMultiplier:.35,score:3},muscle:{damageMultiplier:.45,score:4},fossil:{damageMultiplier:.25,score:4},spaceship:{damageMultiplier:.30,score:5},rocketcar:{damageMultiplier:.60,score:2},house:{damageMultiplier:.40,score:3},truck:{damageMultiplier:.50,score:3},dune:{damageMultiplier:.20,score:5},snowmobile:{damageMultiplier:.18,score:5}
    };
    return table[gag.id]||{damageMultiplier:.55,score:2};
  }

  function eventBuildAdjustment(def,s,profile,gag){
    if(!def)return{damageMultiplier:1,penaltyMultiplier:1,bonusScore:0};
    const tags=new Set(def.tags||[]),tyre=s.durability.tyres>0?part(s.loadout.tyres):null,chassis=s.durability.chassis>0?part(s.loadout.chassis):null,gadgetTraits=activeGadgetTraits(s);
    let damageMultiplier=1,penaltyMultiplier=1;
    if(tags.has('rough')){
      damageMultiplier*=1-(tyre?.traits?.roughDamageReduction||0);
      if(tyre?.traits?.roughDamage)damageMultiplier*=1+tyre.traits.roughDamage;
      if(chassis?.traits?.roughMomentumBonus)penaltyMultiplier*=1-chassis.traits.roughMomentumBonus;
      if(chassis?.traits?.roughMomentumPenalty)penaltyMultiplier*=1+chassis.traits.roughMomentumPenalty;
    }
    if(tags.has('water')){
      if(tyre?.id==='balloon-tyres'){damageMultiplier*=.72;penaltyMultiplier*=.65;}
      else if(tyre?.id==='monster-treads'||tyre?.id==='track-rollers'){damageMultiplier*=.86;penaltyMultiplier*=.82;}
    }
    if(tags.has('sand')){
      if(tyre?.id==='balloon-tyres'){damageMultiplier*=.70;penaltyMultiplier*=.58;}
      else if(tyre?.id==='monster-treads'||tyre?.id==='track-rollers'){damageMultiplier*=.82;penaltyMultiplier*=.72;}
    }
    if(tags.has('snow')){
      if(['balloon-tyres','monster-treads','track-rollers'].includes(tyre?.id)){damageMultiplier*=.78;penaltyMultiplier*=.67;}
      if(tyre?.id==='speed-slicks'){damageMultiplier*=1.25;penaltyMultiplier*=1.30;}
    }
    if(tags.has('ice')){
      if(['monster-treads','track-rollers'].includes(tyre?.id)){damageMultiplier*=.86;penaltyMultiplier*=.78;}
      if(tyre?.id==='speed-slicks'){damageMultiplier*=1.30;penaltyMultiplier*=1.35;}
    }
    if(tags.has('wind')){const reduction=gadgetTraits.windReduction||0;damageMultiplier*=1-reduction*.55;penaltyMultiplier*=1-reduction*.80;}
    if(tags.has('heat')){const cool=clamp(profile.stats.cooling/20,0,.65);damageMultiplier*=1-cool*.55;penaltyMultiplier*=1-cool*.35;}
    if(tags.has('visibility'))penaltyMultiplier*=clamp(1-profile.grip*.012,.68,1);
    if(tags.has('obstacle')&&profile.stats.armour>0)damageMultiplier*=clamp(1-profile.stats.armour*.012,.68,1);
    const gagAdj=eventGagAdjustment(def,gag);damageMultiplier*=gagAdj.damageMultiplier;
    return{damageMultiplier:clamp(damageMultiplier,.05,1.5),penaltyMultiplier:clamp(penaltyMultiplier,.15,1.5),bonusScore:gagAdj.score||0};
  }

  function choiceSuccessChance(def,s,profile,gag){
    const test=def?.choice?.test,tyre=s.durability.tyres>0?part(s.loadout.tyres):null;let chance=.34;
    if(test==='rough')chance+=(profile.grip+profile.stats.armour)/62;
    else if(test==='grass')chance+=profile.grip/38+Math.max(0,18-profile.weight)/90;
    else if(test==='water')chance+=profile.grip/44+(tyre?.id==='balloon-tyres'?.18:0);
    else if(test==='sand')chance+=(profile.grip+profile.usablePower*.55)/65+(tyre?.id==='balloon-tyres'?.20:0);
    else if(test==='ice')chance+=profile.grip/42+(['monster-treads','track-rollers'].includes(tyre?.id)?.12:0)-(tyre?.id==='speed-slicks'?.20:0);
    else if(test==='jump')chance+=profile.usablePower/58+Math.max(0,20-profile.weight)/75+profile.stats.armour/110;
    if(gag&&def.favouredGags?.includes(gag.id))chance+=.38;
    return clamp(chance,.15,.96);
  }

  function qualifiedShortcutPasses(laps,gag){
    if(!gag)return[];
    const resolved=laps.flatMap(lap=>lap.effects||[]).filter(hit=>hit.kind!=='wear');
    // A risky route must succeed. A route event with no choice is a forced detour.
    // The gag alone cannot create a pass: finishing position determines pass count.
    return (PASS_EVENTS||[]).filter(def=>def.motion==='shortcut'&&def.requiredGags?.includes(gag.id)&&
      def.triggerEvents?.some(id=>resolved.some(hit=>hit.id===id&&(!hit.choiceEvent||(hit.choice==='risk'&&hit.outcome==='success')))));
  }
  function choosePassEvents(seed,raceIndex,totalPasses,laps=[],gag=null){
    if(totalPasses<=0||!PASS_EVENTS?.length)return[];
    const qualified=qualifiedShortcutPasses(laps,gag);
    if(qualified.length){
      // Dedicated deterministic visual stream: the original pass RNG remains
      // exactly as before for runs without a qualifying gag and route.
      const rng=stream(seed,raceIndex,'gag-shortcut-pass');
      const def=qualified[Math.floor(rng()*qualified.length)];
      const hit=laps.flatMap(lap=>lap.effects||[]).find(e=>def.triggerEvents.includes(e.id)&&
        (!e.choiceEvent||(e.choice==='risk'&&e.outcome==='success')));
      // Preserve the exact event occurrence so presentation can synchronise
      // the pass with its matching route, rather than an unrelated lap beat.
      return[{index:Math.floor(rng()*totalPasses),id:def.id,triggerId:hit.id,triggerKey:hit.key}];
    }
    const rng=stream(seed,raceIndex,'special-pass');
    if(rng()>=T.passEventChance)return[];
    const id=weightedChoice(D.PASS_EVENT_WEIGHTS||Object.fromEntries(PASS_EVENTS.map(e=>[e.id,e.weight||0])),rng);
    return[{index:Math.floor(rng()*totalPasses),id}];
  }
  function chooseFakePassEvents(seed,raceIndex,totalPasses,realSpecials=[]){
    if(totalPasses<=0||!FAKE_PASS_EVENTS?.length)return[];const rng=stream(seed,raceIndex,'fake-pass');
    if(rng()>=T.fakePassChance)return[];
    const occupied=new Set(realSpecials.map(e=>e.index)),available=Array.from({length:totalPasses},(_,i)=>i).filter(i=>!occupied.has(i));
    if(!available.length)return[];
    const id=weightedChoice(D.FAKE_PASS_EVENT_WEIGHTS||Object.fromEntries(FAKE_PASS_EVENTS.map(e=>[e.id,e.weight||1])),rng);
    return[{index:available[Math.floor(rng()*available.length)],id}];
  }

  // Zero-condition engine OR tyres cannot start a race. One unsuccessful grid
  // attempt costs one cumulative strike (even if both are broken), no rewards.
  // Three no-starts end the run; DNF mid-race does NOT count as a no-start.
  // Achievement integration can key off noStart; do not award achievements here.
  function noStartRace(s){
    const next=clone(s),noStartSlots=['engine','tyres'].filter(slot=>s.durability[slot]===0),card=raceCard(s.seed,s.raceIndex,s),profile=environmentProfile(s,card);
    const rivals=rivalBuilds(s.seed,s.raceIndex).map(build=>{
      const rs=scoreRivalBuild(build,s.seed,s.raceIndex,card),inc=rivalIncidentSetbacks(build,s.seed,s.raceIndex,card);
      return {...build,...rs,...inc,score:round(rs.score-inc.incidentPenalty)};
    });
    const standings=[...rivals.map(r=>({name:r.name,score:r.score,player:false,archetype:r.archetype})).sort((a,b)=>b.score-a.score),
      {name:'Your contraption',score:0,player:true}];
    const showcase=settleShowcase(showcaseForRace(s.seed,s.raceIndex,card),noStartSlots[0],5,0);
    next.noStartStrikes=(s.noStartStrikes||0)+1;
    const result={rulesVersion:17,race:s.raceIndex+1,...card,showcase,noStart:true,noStartSlots,noStartStrike:next.noStartStrikes,noStartLimit:3,
      loadoutBefore:{...s.loadout},levelsBefore:{...s.levels},approach:s.approach,method:'none',
      stats:profile.stats,base:profile.pace,weight:profile.weight,evasion:0,
      weightPenalty:profile.massPenalty,terrainPenalty:round(profile.roughPenalty+profile.softPenalty),
      conditionPenalty:profile.conditionPenalty,heatPenalty:profile.heatPenalty,fortune:0,
      score:0,marketLevel:marketLevel(s.raceIndex),rivalTierBudget:rivalTierBudget(s.raceIndex),
      rivalBuilds:rivals,hazardDamage:0,normalWear:0,incidentDamage:0,eventScore:0,eventCredits:0,
      laps:[],lapsCompleted:0,failureLap:null,damage:0,
      damageBySlot:Object.fromEntries(SLOTS.map(slot=>[slot,0])),durabilityBefore:{...s.durability},
      durabilityAfter:{...s.durability},failedSlot:null,place:5,positionMultiplier:T.positionMultipliers[4],
      cleanMultiplier:1,riskMultiplier:1,prize:0,pointsEarned:0,wrenchDrop:0,passEvents:[],fakePassEvents:[],
      gagId:profile.gag?.id||null,gagName:profile.gag?.name||null,standings};
    next.raceIndex++;next.history.push(result);next.history=next.history.slice(-T.historyLimit);
    next.phase='result';next.finished=next.noStartStrikes>=3?'strikes':null;next.garageAction=null;next.shopRefreshes=0;
    next.gagStreak={id:null,count:0};
    return next;
  }

  function race(s,choices={}){
    garage(s);if(!choices||typeof choices!=='object'||Array.isArray(choices))fail('Race choices must be an object.');
    if(s.durability.engine===0||s.durability.tyres===0)return noStartRace(s);
    const next=clone(s),card=raceCard(s.seed,s.raceIndex,s),t=track(card.trackId),surf=surface(card.surfaceId),w=weather(card.weatherId),profile=environmentProfile(s,card),approach=APPROACHES[s.approach],gag=profile.gag,ge=gag?D.GAG_EFFECTS[gag.id]||{}:{},post=postCapRaces(s.raceIndex),stressScale=1+post*T.postCapStressPerRace;
    const before={...s.durability},laps=[];let failedSlot=null,failureLap=null,eventScore=0,eventCredits=0,normalWear=0,incidentDamage=0,hazardDamage=0,firstMajorImpact=true,method=strongestMitigation(signature(card.signatureId),profile.stats);
    function applyDamage(amount,target,kind,id,scoreDelta=0,credits=0,meta={}){
      amount=Math.max(0,Math.round(amount));const def=eventDefinition({kind,id}),obstacle=def?.tags?.includes('obstacle')||['pileup','debris','collapse','grass','rails'].includes(id),major=amount>=6,gadgetTraits=activeGadgetTraits(next);
      if(obstacle&&gadgetTraits.obstacleDamageReduction)amount=Math.round(amount*(1-gadgetTraits.obstacleDamageReduction));
      if(obstacle&&ge.obstacleDamageReduction)amount=Math.round(amount*(1-ge.obstacleDamageReduction));
      if(kind!=='wear'&&ge.impactWearReduction)amount=Math.round(amount*(1-ge.impactWearReduction));
      if(kind!=='wear'&&major&&firstMajorImpact&&gadgetTraits.firstMajorImpactReduction){amount=Math.round(amount*(1-gadgetTraits.firstMajorImpactReduction));firstMajorImpact=false;}
      const heat=profile.heat,weights={engine:next.durability.engine>0?1.1+heat*.10:0,tyres:next.durability.tyres>0?1.15+surf.tyreStress*.16:0,chassis:next.durability.chassis>0?1.2+t.course.impact*.12:0,gadget:next.durability.gadget>0?.65:0};if(target&&next.durability[target]>0)weights[target]+=1.6;
      let allocation=distributeDamage(amount,weights);
      const tyre=next.durability.tyres>0?part(next.loadout.tyres):null,rough=surf.roughness>=2||surf.softness>=2;
      if(rough&&allocation.tyres>0){let reduce=tyre?.traits?.roughDamageReduction||0;if(tyre?.traits?.roughDamage)reduce-=tyre.traits.roughDamage;if(gag?.id==='f1'&&surf.roughness===0)reduce+=ge.smoothTyreWearReduction||0;allocation.tyres=Math.max(0,Math.round(allocation.tyres*(1-reduce)));}
      if(gag?.id==='icecream'&&allocation.engine>0&&heat>0)allocation.engine=Math.round(allocation.engine*(1-(ge.engineHeatWearReduction||0)));
      const damageBySlot={};for(const slot of SLOTS){const value=next.durability[slot],loss=Math.max(0,allocation[slot]||0);next.durability[slot]=Math.max(0,value-loss);damageBySlot[slot]=value-next.durability[slot];}
      const damage=SLOTS.reduce((n,slot)=>n+damageBySlot[slot],0);failedSlot=next.durability.engine===0?'engine':next.durability.tyres===0?'tyres':null;return{kind,id,damage,damageBySlot,scoreDelta,credits,...meta};
    }
    const baseWear=Math.max(2,Math.round((3+t.course.impact*1.05+surf.roughness*1.15+surf.tyreStress*.55+profile.heat*.35+(w.wear||0)-profile.stats.armour*.12)*card.wearMultiplier*approach.wear*stressScale));
    for(let lap=1;lap<=card.lapCount;lap++){
      const record={lap,before:{...next.durability},effects:[],weatherId:card.weatherId,completed:false};const cumulative=Math.round(baseWear*lap/card.lapCount),prev=Math.round(baseWear*(lap-1)/card.lapCount),wear=applyDamage(cumulative-prev,null,'wear',null);record.effects.push(wear);normalWear+=wear.damage;
      // Optional failed bounty produces a real, recorded extra bad incident.
      // Event generation and race RNG remain unchanged when no penalty is active.
      if(lap===1&&!failedSlot&&(s.bountyPenalties?.extraEvent||0)>0){
        const def=eventDefinition({kind:'wildcard',id:'pothole-chain'});
        if(def){
          const hit=applyDamage(Math.round((def.extraDamage||4)*approach.wear*stressScale),def.target||'chassis','wildcard',def.id,def.score||-1,0,{bountyPenalty:true});
          hit.key='bounty-extra-'+s.raceIndex;record.effects.push(hit);
          incidentDamage+=hit.damage;eventScore+=hit.scoreDelta;
        }
      }
      if(!failedSlot)for(const event of card.events.filter(e=>e.lap===lap)){
        const def=eventDefinition(event);if(!def)continue;let amount=0,scoreDelta=def.score||0,credits=def.credits||0,meta={};
        if(event.stage)meta.stage=event.stage;
        if(event.kind==='signature'){
          const protection=profile.stats.armour*.28+profile.grip*.10+profile.stats.cooling*.05+profile.usablePower*.025;amount=Math.max(1,Math.round(def.severity+Math.floor(stream(s.seed,s.raceIndex,'hit:'+event.key)()*5)-protection));method=strongestMitigation(def,profile.stats);
        }else if(def.delivery==='choice'){
          const selected=choices[event.key]==='risk'?'risk':'safe',chance=choiceSuccessChance(def,next,profile,gag),shownChance=round(chance);meta={choice:selected,successChance:shownChance,choiceEvent:true};
          if(selected==='safe'){scoreDelta=def.choice.safeScore||0;amount=0;meta.outcome='safe';}
          else {const success=stream(s.seed,s.raceIndex,'choice:'+event.key)()<chance;meta.outcome=success?'success':'failure';scoreDelta=success?def.choice.successScore:def.choice.failScore;amount=success?(def.choice.successDamage||0):(def.choice.failDamage||0);}
          meta.outcomeText=meta.outcome==='safe'?def.choice.safeText:meta.outcome==='success'?def.choice.successText:def.choice.failText;meta.riskRating=shownChance>=.72?'GOOD':shownChance>=.5?'FAIR':'POOR';
        }else amount=def.extraDamage?Math.max(1,Math.round(def.extraDamage)):0;
        if(def.id==='anubis-judges'){
          const avgCondition=SLOTS.reduce((n,slot)=>n+(s.durability[slot]||0),0)/SLOTS.length;
          scoreDelta=avgCondition>=85?5:avgCondition>=65?2:avgCondition>=45?-1:-4;
          meta.judgement=avgCondition>=85?'worthy':avgCondition>=65?'acceptable':avgCondition>=45?'questionable':'condemned';
        }
        if(event.kind!=='signature'){const adj=eventBuildAdjustment(def,next,profile,gag);amount=Math.round(amount*adj.damageMultiplier);if(scoreDelta<0)scoreDelta=round(scoreDelta*adj.penaltyMultiplier);scoreDelta=round(scoreDelta+adj.bonusScore);}
        else {const adj=eventGagAdjustment(def,gag);amount=Math.round(amount*adj.damageMultiplier);scoreDelta=round(scoreDelta+(adj.score||0));}
        amount=Math.round(amount*approach.wear*stressScale);
        const hit=applyDamage(amount,def.target,event.kind,event.id,scoreDelta,credits,meta);hit.key=event.key;if(event.kind==='signature')hazardDamage=hit.damage;if(def.weatherId)record.weatherId=def.weatherId;record.effects.push(hit);incidentDamage+=hit.damage;eventScore+=hit.scoreDelta;eventCredits+=hit.credits;if(failedSlot)break;
      }
      record.after={...next.durability};record.failedSlot=failedSlot;record.completed=!failedSlot;laps.push(record);if(failedSlot){failureLap=lap;break;}
    }
    const damageBySlot=Object.fromEntries(SLOTS.map(slot=>[slot,before[slot]-next.durability[slot]])),damage=SLOTS.reduce((n,slot)=>n+damageBySlot[slot],0),rng=stream(s.seed,s.raceIndex,'placing'),fortune=round((rng()-.5)*6);
    const base=profile.pace,score=round(base+eventScore-hazardDamage*.18+fortune);
    const rivalLoadouts=rivalBuilds(s.seed,s.raceIndex),rivalResults=rivalLoadouts.map(build=>{const rs=scoreRivalBuild(build,s.seed,s.raceIndex,card),inc=rivalIncidentSetbacks(build,s.seed,s.raceIndex,card);return{...build,...rs,...inc,score:round(rs.score-inc.incidentPenalty)};});
    const standings=[{name:'Your contraption',score,player:true,tie:0},...rivalResults.map((r,i)=>({name:r.name,score:r.score,player:false,archetype:r.archetype,tie:i+1}))].sort((a,b)=>b.score-a.score||a.tie-b.tie);let place=standings.findIndex(r=>r.player)+1;if(failedSlot){const yours=standings.splice(place-1,1)[0];standings.push(yours);place=standings.length;}
    const passEvents=choosePassEvents(s.seed,s.raceIndex,failedSlot?0:Math.max(0,5-place),laps,gag),fakePassEvents=chooseFakePassEvents(s.seed,s.raceIndex,failedSlot?0:Math.max(0,5-place),passEvents);
    const positionMultiplier=T.positionMultipliers[place-1]||.75,cleanMultiplier=damage<=8?1.25:damage<=16?1.10:1,riskMultiplier=1,showcase=settleShowcase(showcaseForRace(s.seed,s.raceIndex,card),failedSlot,place,damage),prize=failedSlot?0:Math.round(basePrize(s.raceIndex)*positionMultiplier*cleanMultiplier)+eventCredits+(showcase?.credits||0),pointsEarned=failedSlot?0:Math.round(T.basePoints*positionMultiplier*cleanMultiplier)+(showcase?.points||0);
    const drops=stream(s.seed,s.raceIndex,'wrenches'),dropChance=wrenchDropChance(s.raceIndex),wrenchDrop=failedSlot||drops()>=dropChance?0:(drops()<.13?3:drops()<.34?2:1);
    const bodgeDebt=s.bodge?.debt||0,bodgeRepayment=failedSlot?0:Math.min(bodgeDebt,Math.floor(Math.max(0,prize)*.25)),netPrize=prize-bodgeRepayment;
    const result={rulesVersion:16,race:s.raceIndex+1,...card,showcase,...(bodgeRepayment?{grossPrize:prize,bodgeRepayment}:{}),loadoutBefore:{...s.loadout},levelsBefore:{...s.levels},approach:s.approach,method,stats:profile.stats,base,weight:profile.weight,evasion:0,weightPenalty:profile.massPenalty,terrainPenalty:round(profile.roughPenalty+profile.softPenalty),conditionPenalty:profile.conditionPenalty,heatPenalty:profile.heatPenalty,fortune,score,marketLevel:marketLevel(s.raceIndex),rivalTierBudget:rivalTierBudget(s.raceIndex),rivalBuilds:rivalResults,hazardDamage,normalWear,incidentDamage,eventScore,eventCredits,laps,lapsCompleted:laps.filter(l=>l.completed).length,failureLap,damage,damageBySlot,durabilityBefore:before,durabilityAfter:{...next.durability},failedSlot,place,positionMultiplier,cleanMultiplier,riskMultiplier,prize:netPrize,pointsEarned,wrenchDrop,passEvents,fakePassEvents,gagId:gag?.id||null,gagName:gag?.name||null,standings:standings.map(({name,score,player,archetype})=>({name,score,player,...(player?{}:{archetype})}))};
    next.noStartStrikes=s.noStartStrikes||0;next.raceIndex++;next.credits+=netPrize;if(next.bodge)next.bodge.debt-=bodgeRepayment;next.wrenches+=wrenchDrop;next.points+=pointsEarned;next.history.push(result);next.history=next.history.slice(-T.historyLimit);next.phase='result';next.finished=null;next.garageAction=null;next.shopRefreshes=0;
    if(!failedSlot&&gag){next.discoveredGags=[...new Set([...(next.discoveredGags||[]),gag.id])];next.gagStreak=next.gagStreak?.id===gag.id?{id:gag.id,count:next.gagStreak.count+1}:{id:gag.id,count:1};}else if(!gag)next.gagStreak={id:null,count:0};
    return next;
  }
  function continueRun(s){if(s.phase!=='result'||s.finished)fail('There is no next race in this run.');return{...clone(s),phase:'garage'};}

  function validateSave(input){
    if(!input||typeof input!=='object'||Array.isArray(input))fail('Save must be an object.');if(input.version!==T.version)fail('This save belongs to a different build. Start a fresh v0.4.0 run.');
    integer(input.seed,0,4294967295,'seed');integer(input.raceIndex,0,9999999,'race index');integer(input.credits,0,1000000000,'credits');integer(input.wrenches,0,1000000000,'wrenches');integer(input.points,0,1000000000,'score');if(!['garage','result'].includes(input.phase))fail('Invalid phase.');if(input.finished!==null&&!['wrecked','strikes'].includes(input.finished))fail('Invalid finish state.');if(!Object.hasOwn(APPROACHES,input.approach))fail('Invalid approach.');
    const loadout={},levels={},durability={},repairs={};for(const slot of SLOTS){const id=input.loadout?.[slot],p=part(id);if(!p||p.slot!==slot)fail('Invalid '+slot+' part.');loadout[slot]=id;integer(input.levels?.[slot],0,T.maxLevel,slot+' level');if(p.price===0&&input.levels[slot]!==0)fail('Starter parts must remain Lv0.');if(p.price>0&&input.levels[slot]<1)fail('Purchased parts require Lv1+.');levels[slot]=input.levels[slot];integer(input.durability?.[slot],0,100,slot+' condition');durability[slot]=input.durability[slot];integer(input.repairs?.[slot],0,1000000,slot+' repairs');repairs[slot]=input.repairs[slot];}
    const shopRefreshes=Number.isInteger(input.shopRefreshes)?input.shopRefreshes:0;integer(shopRefreshes,0,T.maxShopRefreshes,'shop refresh count');const garageAction=input.garageAction&&typeof input.garageAction==='object'?{kind:String(input.garageAction.kind),slot:String(input.garageAction.slot)}:null;if(garageAction&&(!['tune','replace','bodge'].includes(garageAction.kind)||!SLOTS.includes(garageAction.slot)||(garageAction.kind==='bodge'&&!CRITICAL.includes(garageAction.slot))))fail('Invalid garage action.');
    const noStartStrikes=input.noStartStrikes===undefined?0:input.noStartStrikes;integer(noStartStrikes,0,3,'no-start strikes');if(input.finished==='strikes'&&noStartStrikes!==3)fail('Strike-out requires three no-starts.');if(noStartStrikes===3&&input.finished!=='strikes')fail('Three no-starts must end a run.');
    const streak=input.gagStreak&&typeof input.gagStreak==='object'?input.gagStreak:{id:null,count:0};if(streak.id!==null&&!D.GAG_RECIPES.some(g=>g.id===streak.id))fail('Invalid gag streak.');integer(streak.count||0,0,9999999,'gag streak count');const discovered=Array.isArray(input.discoveredGags)?[...new Set(input.discoveredGags.filter(id=>D.GAG_RECIPES.some(g=>g.id===id)))]:[];const history=Array.isArray(input.history)?input.history.slice(-T.historyLimit):[];
    // Optional to keep saves created before the emergency rule valid.
    let bodge=null;
    if(input.bodge!==undefined){
      if(!input.bodge||typeof input.bodge!=='object'||Array.isArray(input.bodge))fail('Invalid emergency bodge state.');
      const {uses,lastRaceIndex,debt}=input.bodge;
      integer(uses,1,BODGE_MAX_USES,'bodge uses');
      integer(lastRaceIndex,0,input.raceIndex,'last bodge race index');
      integer(debt,0,1000,'bodge debt');
      if(garageAction?.kind==='bodge'&&lastRaceIndex!==input.raceIndex)fail('Bodge action must match this workshop.');
      bodge={uses,lastRaceIndex,debt};
    }else if(garageAction?.kind==='bodge')fail('Missing emergency bodge state.');
    return {version:T.version,seed:input.seed,phase:input.phase,finished:input.finished,raceIndex:input.raceIndex,credits:input.credits,wrenches:input.wrenches,points:input.points,approach:input.approach,loadout,levels,durability,repairs,garageAction,shopRefreshes,noStartStrikes,gagStreak:{id:streak.id,count:streak.count||0},discoveredGags:discovered,history,...(bodge?{bodge}:{})};
  }
  function encodeSave(s){return JSON.stringify(validateSave(s),null,2);}
  function decodeSave(text){if(typeof text!=='string'||text.length>400000)fail('Save file exceeds 400 KB or is not text.');let value;try{value=JSON.parse(text);}catch(_){fail('This is not valid JSON.');}return validateSave(value);}

  return {newRun,random,raceCard,raceOutlook,shopOffers,stockForRound,shopRefreshQuote,refreshShop,upgradePrice,freshPrice,tunePrice,marketLevel,part,track,surface,signature,wildcard,weather,anomaly,eventDefinition,passEvent,fakePassEvent,stats,effectiveStats,partStats,conditionEfficiency,vehicleWeight,evasionRate,upgradeCondition,partUpgradeQuote,upgradePart,gadgetTuneQuote,tuneGadget,buy,setApproach,repairQuote,repair,bodgeQuote,emergencyBodge,race,continueRun,validateSave,encodeSave,decodeSave,generationForTier,minimumTier,equipmentLevel,rivalTierBudget,rivalIncidentExposure,showcaseForRace,settleShowcase,resolveGag,gagEffect,environmentProfile,wrenchDropChance,choiceSuccessChance};
});

