

/* Pure view model. This module never rolls gameplay RNG or changes a race result. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'), require('./engine.js'), require('./event-flavour.js'));
  else root.ScrapPresentation = factory(root.ScrapData, root.ScrapEngine, root.ScrapEventFlavour);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (D, E, F) {
  'use strict';
  const WIDTH = 480, HEIGHT = 270, HORIZON = 82, DEPTH = 148;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  // Distinguish existing visual families without altering the gameplay event pool.
  const visualOverrides = { shortcut: 'bins', gravel: 'gravel', clearline: 'clearline', tailwind: 'tailwind' };
  function project(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z) || z <= 0) throw Error('Projection requires finite coordinates and positive depth.');
    return { x: WIDTH / 2 + x * 60 / z, y: HORIZON + DEPTH / z, scale: 1 / z };
  }
  function roadHalfWidth(y) { return Math.max(0, (y - HORIZON) * 216 / DEPTH); }
  function pretty(slot) { return ({ engine: 'Engine', tyres: 'Tyres', chassis: 'Chassis', gadget: 'Gadget' })[slot] || slot; }
  function ordinal(n) { return `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`; }
  function createReplay(before, after) {
    const r = after.history.at(-1);
    if (!r || after.raceIndex !== before.raceIndex + 1 || before.seed !== after.seed) throw Error('A replay needs one completed engine transition.');
    if(r.noStart){
      const steps=[
        {id:'no-start',lap:0,label:'STARTING GRID',duration:3600,title:r.noStartSlots?.includes('engine')?'ENGINE SAYS NO':'TYRES SAY NO',
         copy:r.noStartSlots?.includes('engine')?'The lights go green. You turn the key. Nothing.':'The lights go green. The tyres are completely unusable.',event:null,weatherId:r.weatherId},
        {id:'finish',lap:0,label:'DID NOT START',duration:2400,title:'5TH PLACE',
         copy:`No laps, no rewards. No-start strike ${r.noStartStrike}/3. ${r.noStartStrike>=3?'Run over.':'Back to the garage.'}`,event:null,weatherId:r.weatherId}
      ];
      return {steps,total:steps.reduce((n,step)=>n+step.duration,0),before,result:r,elapsed:0,paused:false};
    }
    if([8,9,10,11,12,13,14,15,16].includes(r.rulesVersion)) {
      const steps=[];
      for(const lap of r.laps) {
        const wear=lap.effects.find(e=>e.kind==='wear');
        steps.push({id:lap.lap===1?'opening':`lap-${lap.lap}`,lap:lap.lap,label:`LAP ${lap.lap} / ${r.lapCount}`,
          duration:2400,title:lap.lap===1?'LIGHTS OUT':lap.lap===r.lapCount?'FINAL LAP':`LAP ${lap.lap}`,
          copy:`${E.weather(r.weatherId).name}. Normal wear this lap: ${wear.damage}.`,event:null,weatherId:r.weatherId});
        let shownWeather=r.weatherId;
        for(const effect of lap.effects.filter(e=>e.kind!=='wear')) {
          const def=E.eventDefinition(effect);
          if(effect.kind==='anomaly'||effect.kind==='chain')shownWeather=def.weatherId||shownWeather;
          const flourish=F.pick(before.seed,r.race,lap.lap,effect.kind,effect.id);
          const reward=effect.credits?` £${effect.credits} sponsorship if you finish.`:'';
          const score=effect.scoreDelta?` Race performance ${effect.scoreDelta>0?'+':''}${effect.scoreDelta}.`:'';
          const choice=def.delivery==='choice'?{key:effect.key,prompt:def.choice.prompt,safeLabel:def.choice.safeLabel,riskLabel:def.choice.riskLabel,riskRating:effect.riskRating||'UNKNOWN'}:null;
          const damage=effect.damage?` Damage: ${effect.damage}.`:'';
          const copy=effect.choiceEvent?`${effect.outcomeText||def.text}${damage}${score}${reward}`:`${flourish.line||def.text}${damage}${score}${reward}`;
          steps.push({id:effect.kind==='signature'?'hazard':`${effect.key}-${lap.lap}`,lap:lap.lap,
            label:effect.kind==='signature'?'SIGNATURE HAZARD':choice?'ROUTE CHOICE':effect.kind==='chain'?'ONGOING EVENT':effect.kind==='anomaly'?'RARE EVENT':effect.key==='opening'?'OPENING EVENT':'LATE EVENT',
            duration:effect.kind==='signature'?4800:choice?5200:3400,title:flourish.headline||def.title.toUpperCase(),
            copy,choice,resolvedChoice:effect.choice||null,outcome:effect.outcome||null,
            event:visualOverrides[effect.id]||def.visual||effect.id,weatherId:shownWeather,sourceId:effect.id,sourceKind:effect.kind,
            rareText:flourish.rareText,rareVisual:flourish.rareVisual,jumpScare:!!def.jumpScare});
        }
      }
      steps.push({id:'finish',lap:r.failureLap||r.lapCount,label:r.failedSlot?'CAR RETIRED':'CHEQUERED FLAG',duration:2200,
        title:r.failedSlot?'5TH PLACE · DNF':`${ordinal(r.place).toUpperCase()} PLACE`,
        copy:r.failedSlot?`${pretty(r.failedSlot)} failed on lap ${r.failureLap}. No race rewards. Repair it at the garage.`:`+£${r.prize} · +${r.pointsEarned} points · ${r.wrenchDrop} wrenches.`,
        event:null,weatherId:r.laps.at(-1).weatherId});
      return {steps,total:steps.reduce((n,s)=>n+s.duration,0),before,result:r,elapsed:0,paused:false};
    }
    const sig = E.signature(r.signatureId), wild = E.wildcard(r.wildcardId);
    const steps = [
      { id:'opening', label:'START', duration:4500, title:'LIGHTS OUT', copy:`${E.weather(r.weatherId).name}. ${D.APPROACHES[r.approach].name} approach. Your build is committed.`, event:null },
      { id:'hazard', label:'SIGNATURE HAZARD', duration:6000, title:sig.title.toUpperCase(), copy:`${sig.text} ${D.STAT_NAMES[r.method]} is your strongest protection.`, event:r.signatureId },
      { id:'runin', label:'FINAL STRETCH', duration:4500, title:wild ? wild.title.toUpperCase() : 'HOLD IT TOGETHER', copy:wild ? wild.text : 'No secondary incident. Bring the car home.', event:r.wildcardId },
      { id:'finish', label:r.failedSlot ? 'CRITICAL FAILURE' : 'CHEQUERED FLAG', duration:2200, title:r.failedSlot ? 'WRECKED' : `${ordinal(r.place).toUpperCase()} PLACE`, copy:r.failedSlot ? `${pretty(r.failedSlot)} destroyed. No race rewards.` : `+£${r.prize} · +${r.pointsEarned} points · ${r.wrenchDrop} wrenches.`, event:null }
    ];
    return { steps, total:steps.reduce((n,s)=>n+s.duration,0), before, result:r, elapsed:0, paused:false };
  }
  function frame(replay, elapsed) {
    const t = clamp(Number.isFinite(elapsed) ? elapsed : 0, 0, replay.total);
    let start = 0, index = replay.steps.length - 1;
    for (let i=0;i<replay.steps.length;i++) { if (t < start + replay.steps[i].duration || i === replay.steps.length - 1) { index=i;break; } start += replay.steps[i].duration; }
    return { index, step:replay.steps[index], elapsed:t, progress:t/replay.total,
      local:clamp((t-start)/replay.steps[index].duration,0,1), done:t>=replay.total };
  }
  // This is a *visual* progression only. Finish position was already decided by
  // engine.race(); here we animate passing 5 - place rivals, with no physics.
  // During a DNF there is no completed placing, so no victory overtakes occur.
  function overtakeState(replay, elapsed) {
    const result = replay.result;
    const finalPlace = result.failedSlot ? 5 : result.place;
    const total = clamp(5 - finalPlace, 0, 4);
    const finishDuration = replay.steps.at(-1).duration;
    const drivingDuration = Math.max(1, replay.total - finishDuration);
    const progress = clamp(elapsed / drivingDuration, 0, 1);
    // Entries are distributed through the drive and do not depend on event RNG.
    const crossings = Array.from({ length: total }, (_, i) => .09 + .84 * (i + 1) / (total + 1));
    const specialByIndex=Object.fromEntries((result.passEvents||[]).map(e=>[e.index,e.id]));
    const fakeByIndex=Object.fromEntries((result.fakePassEvents||[]).map(e=>[e.index,e.id]));
    let special=null,fake=null,shortcutSegment=null;
    // Gag passes should play DURING the triggering side-route event, not as a
    // two-second generic pass arbitrarily inserted somewhere in the replay.
    const gated=(result.passEvents||[]).find(e=>E.passEvent(e.id)?.motion==='shortcut'&&e.triggerKey);
    if(gated){
      let startMs=0;
      for(const step of replay.steps){
        if(step.sourceId===gated.triggerId&&step.id.startsWith(gated.triggerKey+'-')){
          shortcutSegment={index:gated.index,id:gated.id,start:startMs,end:startMs+step.duration};break;
        }
        startMs+=step.duration;
      }
    }
    if(shortcutSegment&&total>0){
      const i=shortcutSegment.index,anchor=clamp((shortcutSegment.start+(shortcutSegment.end-shortcutSegment.start)*.80)/drivingDuration,.08,.96);
      // The passage order must stay monotonic even when the route occurs very
      // early or late. Move ONLY the visual pass timeline; race score is final.
      for(let j=0;j<total;j++)crossings[j]=j<i?anchor*(j+1)/(i+1):j===i?anchor:anchor+(1-anchor)*(j-i)/(total-i);
      if(elapsed>=shortcutSegment.start&&elapsed<shortcutSegment.end){
        special={id:shortcutSegment.id,index:i,
          local:clamp((elapsed-shortcutSegment.start)/(shortcutSegment.end-shortcutSegment.start),0,1)};
      }
    }
    const passed=crossings.filter(crossing=>progress>=crossing).length;
    if(!special)for(let i=0;i<crossings.length;i++){
      const fakeId=fakeByIndex[i];
      if(fakeId){const start=crossings[i]-.34,end=crossings[i]-.19;if(progress>=start&&progress<end){fake={id:fakeId,index:i,local:clamp((progress-start)/(end-start),0,1)};break;}}
    }
    if(!fake&&!special)for(let i=0;i<crossings.length;i++){
      const id=specialByIndex[i];if(!id||id===shortcutSegment?.id)continue;
      const start=crossings[i]-.13,end=crossings[i]+.025;
      if(progress>=start&&progress<end){special={id,index:i,local:clamp((progress-start)/(end-start),0,1)};break;}
    }
    return { position: 5 - passed, passed, total, crossings, progress, specialByIndex, fakeByIndex, special, fake };
  }
  function nextTime(replay, elapsed) {
    const f=frame(replay,elapsed);
    return Math.min(replay.total,replay.steps.slice(0,f.index+1).reduce((n,s)=>n+s.duration,0));
  }
  function visibleState(replay, after) { return replay && frame(replay,replay.elapsed).step.id !== 'finish' ? replay.before : after; }
  function settings(value, reducedMotion=false) {
    const v=value && typeof value==='object' ? value : {};
    return { speed:[1,2,4].includes(v.speed)?v.speed:1,
      motion:typeof v.motion==='boolean'?v.motion:!reducedMotion,
      autoplay:typeof v.autoplay==='boolean'?v.autoplay:true };
  }
  return { WIDTH,HEIGHT,HORIZON,DEPTH,project,roadHalfWidth,pretty,ordinal,createReplay,frame,nextTime,visibleState,settings,clamp,overtakeState };
});


