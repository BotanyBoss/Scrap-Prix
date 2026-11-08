/* Scrap Prix optional bounty contracts: deterministic offers, voluntary risks, no base-prize inflation.
   Loaded after the engine and before the UI. Unaccepted contracts never affect a run. */
(function(){
  'use strict';
  const E=window.ScrapEngine;
  if(!E)throw Error('ScrapEngine required before bounties');
  const clone=v=>JSON.parse(JSON.stringify(v));
  const types=Object.freeze([
    {id:'third',title:'The Perfect Third',goal:'Finish exactly third in your next race.',races:1,
      reward:'Patch weakest critical part +20 condition',failure:'Next garage: one shop offer',weight:4},
    {id:'reckless',title:'Against the Odds',goal:'Finish first or second while driving Reckless.',races:1,
      reward:'+1 wrench',failure:'Engine loses 12 condition',weight:4},
    {id:'survivor',title:'Keep It Together',goal:'Finish two consecutive races without a critical part failing.',races:3,
      reward:'+1 wrench',failure:'No normal repairs for one garage',weight:4},
    {id:'worn',title:'Running on Fumes',goal:'Finish with engine, tyres or chassis starting at 25% condition or less.',races:1,
      reward:'Patch weakest critical part +20 condition',failure:'One critical part loses 10 condition',weight:4},
    {id:'comeback',title:'The Comeback Kid',goal:'Improve your finish by at least two places compared with your previous race.',races:2,
      reward:'+1 wrench',failure:'An extra bad event in the next race',weight:3},
    {id:'tank',title:'Classified Vehicle Request',goal:'Complete a race driving the Tank gag vehicle.',races:5,
      reward:'One free replacement from a future shop',failure:'No normal repairs for three garages',weight:1,hidden:true}
  ]);
  const lookup=id=>types.find(t=>t.id===id);
  const nonneg=(n,max=100)=>Number.isInteger(n)&&n>=0&&n<=max;
  const hash=(seed,round,salt=0)=>{
    let x=(Math.imul((round+1)>>>0,0x9e3779b1)^(seed>>>0)^salt)>>>0;
    x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return(x^(x>>>16))>>>0;
  };
  const penalties=s=>({
    shopOne:s.bountyPenalties?.shopOne||0,
    repairLock:s.bountyPenalties?.repairLock||0,
    extraEvent:s.bountyPenalties?.extraEvent||0
  });
  const active=s=>Array.isArray(s.bounties)?s.bounties:[];
  const known=(s,definition)=>!definition.hidden||(s.discoveredGags||[]).includes('tank');
  function bountyOffer(s){
    if(s.phase!=='garage'||s.finished)return null;
    // Once accepted, the same displayed offer stays on the board until the next race.
    if(s.bountyAcceptedAt===s.raceIndex&&s.bountyOfferedId)return lookup(s.bountyOfferedId);
    const inUse=new Set(active(s).map(x=>x.id));
    const available=types.filter(t=>!inUse.has(t.id)&&(t.id!=='comeback'||s.history?.length));
    if(!available.length)return null;
    const total=available.reduce((n,t)=>n+t.weight,0);
    let roll=(hash(s.seed,s.raceIndex,0xB0A71E)/4294967296)*total;
    for(const t of available){roll-=t.weight;if(roll<0)return t;}
    return available.at(-1);
  }
  function visibleBounty(s,entry){
    const def=lookup(entry.id);if(!def)return null;
    const reveal=known(s,def);
    return {...def,title:reveal?def.title:'▞▓▒ CLASSIFIED ▒▓▚',
      goal:reveal?def.goal:'Requested vehicle: ▒▓???▓▒',
      revealed:reveal,remaining:entry.remaining??def.races,progress:entry.progress||0};
  }
  function acceptBounty(s,id){
    if(s.phase!=='garage'||s.finished)throw Error('Bounties are only available in the garage.');
    const offer=bountyOffer(s);
    if(!offer||offer.id!==id)throw Error('The offered bounty changed.');
    if(active(s).length>=3)throw Error('All three bounty slots are occupied.');
    if(s.bountyAcceptedAt===s.raceIndex)throw Error('Already accepted a bounty this race.');
    const next=clone(s);
    next.bounties=[...active(s),{id,remaining:offer.races,progress:0}];
    next.bountyAcceptedAt=s.raceIndex;
    next.bountyOfferedId=id;
    return next;
  }
  function damagePenalty(s,amount,slot){
    const target=slot||['engine','tyres','chassis'][hash(s.seed,s.raceIndex,0xD1A6)%3];
    s.durability[target]=Math.max(0,s.durability[target]-amount);
    return {kind:'damage',slot:target,amount};
  }
  function applyFailure(s,id){
    const p=penalties(s);let effect;
    if(id==='third'){p.shopOne=Math.max(p.shopOne,1);effect={kind:'shopOne',garages:1};}
    else if(id==='reckless')effect=damagePenalty(s,12,'engine');
    else if(id==='survivor'){p.repairLock=Math.max(p.repairLock,1);effect={kind:'repairLock',garages:1};}
    else if(id==='worn')effect=damagePenalty(s,10);
    else if(id==='comeback'){p.extraEvent=Math.max(p.extraEvent,1);effect={kind:'extraEvent',races:1};}
    else if(id==='tank'){p.repairLock=Math.max(p.repairLock,3);effect={kind:'repairLock',garages:3};}
    else throw Error('Unknown bounty');
    s.bountyPenalties=p;
    return effect;
  }
  function patchWeakest(s,amount){
    const slot=['engine','tyres','chassis'].sort((a,b)=>s.durability[a]-s.durability[b])[0];
    const restored=Math.min(amount,100-s.durability[slot]);
    s.durability[slot]+=restored;
    return{kind:'patch',slot,restored};
  }
  function applyReward(s,id){
    if(id==='third'||id==='worn')return patchWeakest(s,20);
    if(id==='reckless'||id==='survivor'||id==='comeback'){s.wrenches+=1;return{kind:'wrench',amount:1};}
    if(id==='tank'){
      // Three is an explicit capacity, not a save-corrupting hard limit.
      // Excess vouchers become one wrench so completing a valid contract never silently loses the reward.
      if((s.bountyCoupons||0)>=3){s.wrenches+=1;return{kind:'voucherOverflowWrench',amount:1,capacity:3};}
      s.bountyCoupons=(s.bountyCoupons||0)+1;return{kind:'replacementVoucher',amount:1};
    }
    throw Error('Unknown bounty');
  }
  function cancelBounty(s,id){
    if(s.phase!=='garage'||s.finished)throw Error('Cancel bounties in the garage.');
    const index=active(s).findIndex(b=>b.id===id);
    if(index<0)throw Error('That contract is not active.');
    const next=clone(s),def=lookup(id);
    next.bounties.splice(index,1);
    const consequence=applyFailure(next,id);
    next.bountyLastCancel={id,title:def.title,consequence};
    return next;
  }
  function finishedGoal(def,entry,result,previous){
    if(result.noStart||result.failedSlot)return false;
    if(def.id==='third')return result.place===3;
    if(def.id==='reckless')return result.place<=2&&result.approach==='reckless';
    if(def.id==='survivor')return false; // handled by progress in settle
    if(def.id==='worn')return ['engine','tyres','chassis'].some(x=>result.durabilityBefore[x]<=25);
    if(def.id==='comeback')return previous&&previous.place-result.place>=2;
    if(def.id==='tank')return result.gagId==='tank';
    return false;
  }
  const original={
    race:E.race,repair:E.repair,repairQuote:E.repairQuote,shopOffers:E.shopOffers,
    buy:E.buy,validateSave:E.validateSave,encodeSave:E.encodeSave,decodeSave:E.decodeSave
  };
  E.race=function(s,choices={}){
    const next=original.race(s,choices);
    if(!s.bounties&&!s.bountyPenalties)return next;
    const prior=penalties(s);
    const result=next.history.at(-1),previous=s.history?.at(-1)||null;
    // A no-start or a pre-incident wreck must not consume sabotage that never fired.
    const sabotageApplied=(result.laps||[]).some(l=>(l.effects||[]).some(e=>e.bountyPenalty===true));
    next.bountyPenalties={shopOne:Math.max(0,prior.shopOne-1),
      repairLock:Math.max(0,prior.repairLock-1),
      extraEvent:Math.max(0,prior.extraEvent-(sabotageApplied?1:0))};
    const settlements=[],pending=[];
    for(const entry of active(s)){
      const def=lookup(entry.id);
      let progress=entry.progress||0;
      if(def.id==='survivor')progress=!result.noStart&&!result.failedSlot?progress+1:0;
      const success=def.id==='survivor'?progress>=2:finishedGoal(def,entry,result,previous);
      const remaining=entry.remaining-1;
      if(success){const reward=applyReward(next,entry.id);settlements.push({id:entry.id,title:def.title,success:true,reward});}
      else if(remaining<=0){const consequence=applyFailure(next,entry.id);settlements.push({id:entry.id,title:def.title,success:false,consequence});}
      else pending.push({...entry,progress,remaining});
    }
    next.bounties=pending;
    if(settlements.length){
      result.bountyResults=settlements;
      next.bountyLastResults=settlements;
      // Preserve race-only condition and wrench drops for the lap history; report the post-contract garage state separately.
      result.bountyWrenches=settlements.reduce((sum,x)=>sum+(x.success&&['wrench','voucherOverflowWrench'].includes(x.reward?.kind)?x.reward.amount:0),0);
      result.bountyGarageDurabilityAfter={...next.durability};
      result.bountyGarageWrenches=next.wrenches;
    }
    return next;
  };
  E.repairQuote=function(s,slot){
    const q=original.repairQuote(s,slot);
    return penalties(s).repairLock>0?{...q,locked:true,reason:'Normal repairs suspended by bounty failure'}:q;
  };
  E.repair=function(s,slot){
    if(penalties(s).repairLock>0)throw Error('Normal repairs suspended by bounty failure.');
    return original.repair(s,slot);
  };
  // Restricted offers are now resolved by the engine itself, also used by Bodge and buy().
  E.shopOffers=original.shopOffers;
  E.buy=function(s,id){
    if(!E.shopOffers(s).some(o=>o.id===id))throw Error('This part is not on the restricted shop shelf.');
    return original.buy(s,id);
  };
  E.claimBountyReplacement=function(s,id){
    if(s.phase!=='garage'||s.finished)throw Error('Return to a garage first.');
    if(!nonneg(s.bountyCoupons||0,3)||!s.bountyCoupons)throw Error('No free replacement voucher available.');
    const offer=E.shopOffers(s).find(o=>o.id===id);
    if(!offer)throw Error('That replacement is not available in this shop.');
    if(s.garageAction)throw Error('The build action has already been used.');
    const funded=clone(s);funded.credits+=offer.price;
    const next=original.buy(funded,id);
    next.credits=s.credits;next.bountyCoupons=s.bountyCoupons-1;
    return next;
  };
  E.validateSave=function(input){
    const output=original.validateSave(input);
    if(input.bounties!==undefined){
      if(!Array.isArray(input.bounties)||input.bounties.length>3)throw Error('Invalid bounty slots.');
      const taken=new Set();
      output.bounties=input.bounties.map(x=>{
        if(!x||!lookup(x.id)||taken.has(x.id))throw Error('Invalid bounty contract.');
        taken.add(x.id);
        if(!nonneg(x.remaining,5)||x.remaining<1||!nonneg(x.progress,3))throw Error('Invalid bounty deadline.');
        return{id:x.id,remaining:x.remaining,progress:x.progress};
      });
    }
    if(input.bountyPenalties!==undefined){
      const p=input.bountyPenalties;
      if(!p||['shopOne','repairLock','extraEvent'].some(k=>!nonneg(p[k]||0,3)))throw Error('Invalid bounty penalty.');
      output.bountyPenalties={shopOne:p.shopOne||0,repairLock:p.repairLock||0,extraEvent:p.extraEvent||0};
    }
    if(input.bountyAcceptedAt!==undefined){
      if(!nonneg(input.bountyAcceptedAt,input.raceIndex))throw Error('Invalid bounty acceptance index.');
      output.bountyAcceptedAt=input.bountyAcceptedAt;
    }
    if(input.bountyOfferedId!==undefined){
      if(!lookup(input.bountyOfferedId)||input.bountyAcceptedAt===undefined)throw Error('Invalid current bounty offer.');
      output.bountyOfferedId=input.bountyOfferedId;
    }
    if(input.bountyCoupons!==undefined){
      if(!nonneg(input.bountyCoupons,3))throw Error('Invalid bounty voucher count.');
      output.bountyCoupons=input.bountyCoupons;
    }
    return output;
  };
  E.encodeSave=s=>JSON.stringify(E.validateSave(s),null,2);
  E.decodeSave=text=>{
    if(typeof text!=='string'||text.length>400000)throw Error('Save file exceeds 400 KB or is not text.');
    let value;try{value=JSON.parse(text);}catch{throw Error('This is not valid JSON.');}
    return E.validateSave(value);
  };
  // Small UI fragments. Keeping bounty display here avoids duplicating rules in the garage UI.
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function activeBountyMarkup(s){
    const owned=active(s),p=penalties(s);
    const warnings=[p.repairLock>0?'NO NORMAL REPAIRS: '+p.repairLock+' garage(s)':null,
      p.shopOne>0?'SHOP LIMITED TO ONE OFFER':null,p.extraEvent>0?'NEXT RACE HAS AN EXTRA BAD EVENT':null].filter(Boolean);
    return `<section class="bounty-ledger frame-light" aria-label="Active bounty contracts">
      <div class="bounty-ledger-head"><h3>ACTIVE BOUNTIES</h3><small>${owned.length}/3 SLOTS</small></div>
      ${warnings.map(t=>`<p class="bounty-warning">${esc(t)}</p>`).join('')}
      <div class="bounty-slots">${[0,1,2].map(i=>{
        const entry=owned[i];if(!entry)return '<div class="bounty-slot empty">EMPTY BOUNTY SLOT</div>';
        const d=visibleBounty(s,entry);
        return `<div class="bounty-slot"><b>${esc(d.title)}</b><small>${d.remaining} RACE(S) LEFT</small>
          <span>${esc(d.goal)}</span><small>WIN: ${esc(d.reward)}</small>
          <small class="bounty-loss">FAIL: ${esc(d.failure)}</small>
          <button data-action="cancel-bounty" data-id="${d.id}">CANCEL = FAILURE</button></div>`;
      }).join('')}</div>
    </section>`;
  }
  function shopBountyMarkup(s){
    const offer=bountyOffer(s);if(!offer)return '';
    const d=visibleBounty(s,{id:offer.id,remaining:offer.races});
    const full=active(s).length>=3,already=s.bountyAcceptedAt===s.raceIndex;
    return `<section class="bounty-shop" aria-label="One optional bounty offer in this shop">
      <header><h3>BOUNTY OF THE RACE</h3><small>ONE OFFER · ${3-active(s).length} SLOTS FREE</small></header>
      <b>${esc(d.title)}</b><p>${esc(d.goal)}</p><small>DEADLINE: ${offer.races} RACE(S)</small>
      <p class="bounty-win">SUCCESS: ${esc(offer.reward)}</p>
      <p class="bounty-loss">FAILURE / CANCELLATION: ${esc(offer.failure)}</p>
      ${offer.id==='tank'?`<small>FREE REPLACEMENT VOUCHERS: ${s.bountyCoupons||0}/3 · At capacity, an extra voucher becomes +1 wrench.</small>`:''}
      <button data-action="accept-bounty" data-id="${offer.id}" ${full||already?'disabled':''}>${already?'ALREADY ACCEPTED THIS RACE':full?'ALL SLOTS FULL':'ACCEPT BOUNTY'}</button>
    </section>`;
  }
  E.activeBountyMarkup=activeBountyMarkup;
  E.shopBountyMarkup=shopBountyMarkup;
  E.bountyDefinitions=types;
  E.bountyOffer=bountyOffer;
  E.bountyDisplay=visibleBounty;
  E.acceptBounty=acceptBounty;
  E.cancelBounty=cancelBounty;
})();