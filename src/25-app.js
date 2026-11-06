

/* Screen-based application adapter. Gameplay stays in engine.js.
   Replay speed, scenery and menus cannot modify the resolved result. */
(function () {
  'use strict';
  const D=window.ScrapData,E=window.ScrapEngine,P=window.ScrapPresentation;
  const DEV_MODE=window.SCRAP_PRIX_DEV_MODE===true&&!!window.ScrapVisualLab;
  const normalizeSettings=(value,reduced=false)=>{const settings=P.settings(value,reduced);if(Number(value?.speed)===3)settings.speed=3;return settings;};
  const ENV_LAB=DEV_MODE&&!!window.ScrapEnvironmentLab;
  const rendererPreferences=()=>({... (DEV_MODE?window.ScrapVisualLab.preferences():{style:'chunky',camera:'rear'}),permanentFossil:true});
  const $=id=>document.getElementById(id);
  // Presentation mapping. Existing forced route events retain their exact
  // engine IDs, odds, damage and outcome; only their road scenery changes.
  const FORCED_DETOURS=Object.freeze({
    'massive-pileup':'wreckage-shortcut',
    'long-grass':'overgrown-shortcut',
    'flooded-section':'flooded-shortcut',
    'deep-sand':'dune-shortcut'
  });
  const SHORTCUT_RE=/^(wreckage|overgrown|flooded|dune|frozen-lake)-shortcut$/;
  const KEY='scrap-prix-v0400-systems-run-v21',RECORDS='scrap-prix-v0400-records',SETTINGS='scrap-prix-v0320-visual-options';
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>Number(n).toLocaleString('en-GB');
  const signed=n=>n>0?'+'+n:String(n);
  const icons={
    wrench:'M10 1h4v2h-3v3h3V3h2v5h-5L5 14H1v-4l7-6V1h2z',
    engine:'M4 2h7v2H4zM2 5h10v2h3v6h-3v2H2v-3H0V7h2zM4 7v5h6V7z',
    tyres:'M5 0h6v2h3v12h-3v2H5v-2H2V2h3zM6 4v8h4V4z',
    chassis:'M4 1h8v3h2v3h2v7h-3v2h-2v-2H5v2H3v-2H0V7h2V4h2zM5 4v3h6V4zM3 9v2h3V9zM10 9v2h3V9z',
    gadget:'M5 1h6v3h3v2h2v5h-3v3h-2v2H6v-3H3v-2H0V6h3V3h2zM6 6v4h4V6z',
    flag:'M2 1h2v14H2zM5 1h9v2h-3v2h3v2h-3V5H8v2H5V5h3V3H5z',
    trophy:'M4 1h8v2h3v6h-3v2h-2v2h3v3H3v-3h3v-2H4V9H1V3h3zM3 5v2h1V5zM12 5v2h1V5z',
    money:'M3 1h10v2h2v10h-2v2H3v-2H1V3h2zM5 4v3h5v2H5v2h7V6H7V4h5V3H5z',
    weather:'M5 2h5v2h3v2h2v5H1V6h2V4h2zM4 12h2v3H4zM10 12h2v3h-2z',
    road:'M5 0h2L4 16H1zM9 0h2l4 16h-3zM8 2h1v3H8zM7 8h2v5H7z',
    menu:'M2 3h12v2H2zM2 7h12v2H2zM2 11h12v2H2z',
    screen:'M0 0h6v2H2v4H0zM10 0h6v6h-2V2h-4zM0 10h2v4h4v2H0zM14 10h2v6h-6v-2h4z'
  };
  function icon(id){return `<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges"><path fill-rule="evenodd" d="${icons[id]||icons.gadget}"/></svg>`;}
  // Original 5x7 display-letter geometry, not a bundled font file.
  const glyph={S:'01111/10000/10000/01110/00001/00001/11110',C:'01111/10000/10000/10000/10000/10000/01111',R:'11110/10001/10001/11110/10100/10010/10001',A:'01110/10001/10001/11111/10001/10001/10001',P:'11110/10001/10001/11110/10000/10000/10000',I:'111/010/010/010/010/010/111',X:'10001/10001/01010/00100/01010/10001/10001',W:'10001/10001/10001/10101/10101/10101/01010',E:'11111/10000/10000/11110/10000/10000/11111',K:'10001/10010/10100/11000/10100/10010/10001',D:'11110/10001/10001/10001/10001/10001/11110',N:'10001/11001/11001/10101/10011/10011/10001',T:'11111/00100/00100/00100/00100/00100/00100',H:'10001/10001/10001/11111/10001/10001/10001',F:'11111/10000/10000/11110/10000/10000/10000',O:'01110/10001/10001/10001/10001/10001/01110',V:'10001/10001/10001/10001/10001/01010/00100',U:'10001/10001/10001/10001/10001/10001/01110',L:'10000/10000/10000/10000/10000/10000/11111','0':'01110/10011/10101/10101/11001/10001/01110','1':'010/110/010/010/010/010/111','2':'01110/10001/00001/00110/01000/10000/11111','3':'11110/00001/00001/01110/00001/00001/11110','4':'10010/10010/10010/11111/00010/00010/00010','5':'11111/10000/10000/11110/00001/00001/11110'};
  function pixelWord(word,label=word){let x=0,path='';for(const c of word){if(c===' '){x+=3;continue;}const rows=(glyph[c]||glyph.X).split('/');rows.forEach((r,y)=>[...r].forEach((v,j)=>{if(v==='1')path+=`M${x+j} ${y}h1v1h-1z`;}));x+=rows[0].length+1;}return `<svg class="pixel-word" viewBox="0 0 ${Math.max(1,x-1)} 7" role="img" aria-label="${esc(label)}"><path d="${path}"/></svg>`;}
  let state=E.newRun(20261017),hasRun=false,blocked=false,startConfirmed=false;
  let records={bestRaces:0,bestPoints:0};
  let prefs=normalizeSettings({},window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let screen='title',replay=null,raf=0,renderer=null,lastTick=null,lastPhase=-1,lastRaceDisplay='';
  let raceBefore=null,raceChoices={};
  let modalKind=null,shopFilter='all',pendingConfirm=null,returnFocus=null,resumePause=false,resultTab='finish';
  let storageNotice='WORK IN PROGRESS';
  const survived=s=>Math.max(0,s.raceIndex-(s.noStartStrikes||0)-(s.finished==='wrecked'?1:0));
  function notify(text,error=false){$('status').textContent=text;$('status').dataset.error=error?'true':'false';}
  function readRecords(raw){try{const v=JSON.parse(raw);if(Number.isInteger(v?.bestRaces)&&Number.isInteger(v?.bestPoints)&&v.bestRaces>=0&&v.bestRaces<=9999999&&v.bestPoints>=0&&v.bestPoints<=1000000000)return {bestRaces:v.bestRaces,bestPoints:v.bestPoints};}catch(_){}return {bestRaces:0,bestPoints:0};}
  // High scores live under a separate storage key. A corrupt run must not
  // prevent their loading (or cause the next new run to overwrite them with 0).
  try {records=readRecords(localStorage.getItem(RECORDS));}catch(_){}
  try {const v=localStorage.getItem(KEY);if(v){
    state=E.decodeSave(v);hasRun=true;storageNotice='SAVE LOADED';
    // A race is saved at replay start, but its records normally settle at
    // the results screen. Recover that score if the browser closed mid-replay.
    if(state.phase==='result'&&state.history.length){
      const oldRaces=records.bestRaces,oldPoints=records.bestPoints;
      updateRecords();
      if(records.bestRaces!==oldRaces||records.bestPoints!==oldPoints){
        try{localStorage.setItem(RECORDS,JSON.stringify(records));}catch(_){}
      }
    }
  }}catch(_){blocked=true;storageNotice='SAVE UNAVAILABLE';}
  try {prefs=normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS)||'{}'),!prefs.motion);}catch(_){}
  function persist(){
    if(blocked){storageNotice='AUTO-SAVE PAUSED';$('save-status').textContent=storageNotice;return;}
    try{if(hasRun)localStorage.setItem(KEY,E.encodeSave(state));localStorage.setItem(RECORDS,JSON.stringify(records));storageNotice='SAVED LOCALLY';}
    catch(_){storageNotice='EXPORT TO KEEP RUN';}
    $('save-status').textContent=storageNotice;
  }
  function persistPrefs(){try{localStorage.setItem(SETTINGS,JSON.stringify(prefs));}catch(_){notify('Settings work for this session; browser storage is unavailable.');}}
  function header(){
    const v=P.visibleState(replay,state);
    const inRun=hasRun&&screen!=='title'&&screen!=='records';
    $('topbar').innerHTML=`<div class="brand"><div class="checkered" aria-hidden="true"></div>${pixelWord('{{GAME_NAME_UPPER}}','{{GAME_NAME}}')}</div>
      ${inRun?`<div class="top-resources"><span class="resource" aria-label="Money ${v.credits}">${icon('money')}<b id="money-value">£${money(v.credits)}</b></span><span class="resource" aria-label="${v.wrenches} wrenches">${icon('wrench')}<b id="wrench-value">${v.wrenches}</b></span><span class="resource score-resource"><small>SCORE</small><b>${money(v.points)}</b></span></div>`:`<div class="caption">BUILD / RACE / SURVIVE</div>`}
      <div class="top-actions"><button class="quiet icon-button fullscreen-button" data-action="fullscreen" aria-label="${document.fullscreenElement?'Leave fullscreen':'Enter fullscreen'}" title="Fullscreen · F">${icon('screen')}</button><button class="quiet" data-action="settings" aria-label="Open settings">${screen==='title'?'OPTIONS':'MENU'}</button></div>`;
  }
  function titleMarkup(){return `<div class="title-screen"><section class="title-hero" aria-label="{{GAME_NAME}} racing artwork"><canvas id="title-canvas" aria-hidden="true"></canvas><h1 class="title-logo">${pixelWord('SCRAP')}${pixelWord('PRIX')}</h1><p class="title-slogan">BUILD &gt; RACE &gt; SURVIVE &gt; REPEAT</p></section><section class="title-menu"><p class="caption">A CAR-BUILDING ROGUELIKE</p><h2>ONE MORE RACE.</h2><p class="title-note">Build something unreasonable.<br>See how long it holds together.</p><nav class="menu-buttons" aria-label="Main menu">${hasRun?`<button class="primary" data-action="continue-title">${state.finished?'LAST RUN REPORT':'CONTINUE RUN'} <span class="arrow" aria-hidden="true">▶</span></button>`:''}<button ${hasRun?'':'class="primary"'} data-action="new">${hasRun?'NEW RUN':'START RUN'} <span class="arrow" aria-hidden="true">▶</span></button>${DEV_MODE?`<button data-action="visual-lab">PARTS LAB ${icon('gadget')}</button>${ENV_LAB?`<button data-action="environment-lab">ENVIRONMENT LAB ${icon('road')}</button><button data-action="event-motion-lab">EVENT MOTION LAB ${icon('flag')}</button>`:''}`:''}<button data-action="records">RECORDS ${icon('trophy')}</button><button data-action="settings">OPTIONS / SAVES ${icon('gadget')}</button></nav><div class="title-records"><div><small>BEST SCORE</small><b>${money(records.bestPoints)}</b></div><div><small>LONGEST RUN</small><b>${records.bestRaces} <small>RACES</small></b></div></div><p class="seed-note">${hasRun?`SAVED RUN · SEED ${state.seed}`:'No run started. Your first bad idea awaits.'}</p></section></div>`;}
  function slotMarkup(slot){
    const p=E.part(state.loadout[slot]),q=E.repairQuote(state,slot),v=state.durability[slot],critical=D.CRITICAL.includes(slot)&&v<=25;
    const efficiency=Math.round(E.conditionEfficiency(v)*100),up=E.partUpgradeQuote(state,slot),level=E.equipmentLevel(state.levels[slot]);
    const mark=p.price?`LV ${level}`:'STARTER / LV 0';
    const upgrading=!up.purchased?'FIND A REAL PART':up.atCap?'MAX LV 10':up.marketLocked?`MARKET LV ${up.marketLevel} · TUNE LOCKED`:up.alreadyUsed?'BUILD ACTION USED':up.affordable?`TUNE TO LV ${up.targetLevel} / £${money(up.cost)}`:`LV ${up.targetLevel} NEED £${money(up.cost)}`;
    const control=`<button class="tune-button" data-action="upgrade-part" data-id="${slot}" ${up.affordable?'':'disabled'} title="Tune this exact part +1 level. Condition and repair history stay unchanged.">${upgrading}</button>`;
    return `<article class="part-slot ${critical?'critical':''} ${v===0&&['engine','tyres'].includes(slot)?'no-start':''}" data-slot="${slot}"><div class="slot-headrow"><canvas class="part-mini" data-part-art="${slot}" aria-hidden="true"></canvas><div class="slot-copy"><div class="slot-title"><b>${icon(slot)}${P.pretty(slot)}</b><small>${mark}</small></div><p class="part-name" title="${esc(p.name)}">${esc(p.name)}</p></div></div><div class="condition-label"><span>${v===0?(['engine','tyres'].includes(slot)?'NO START':'BROKEN'):critical?'CRITICAL':'CONDITION'}</span><b>${v}%</b></div><div class="output-status ${efficiency<95?'worn-output':''}">${v===0?'NO OUTPUT':efficiency===100?'FULL PERFORMANCE':`POSITIVE STATS ${efficiency}% EFFECTIVE`}</div><progress max="100" value="${v}" aria-label="${P.pretty(slot)} durability ${v}%"></progress><button class="repair-button" data-action="repair" data-id="${slot}" ${q.amount===0||state.wrenches<q.cost?'disabled':''}>${q.amount?`REPAIR +${q.amount} / ${q.cost} W`:'FULL CONDITION'}</button>${control}<p>${['engine','tyres'].includes(slot)?'0% means no start, automatic 5th and +1 strike': '0% = 0 stats + no perks, still fitted'} · Next repair ${q.amount?q.cost:state.repairs[slot]+1} W · Tuning never repairs</p></article>`;
  }
  function garageMarkup(){
    const card=E.raceCard(state.seed,state.raceIndex),t=E.track(card.trackId),surf=E.surface(card.surfaceId),sig=E.signature(card.signatureId),w=E.weather(card.weatherId),st=E.effectiveStats(state),market=E.marketLevel(state.raceIndex),gag=E.resolveGag(state),outlook=E.raceOutlook(state.seed,state.raceIndex);
    const cannotStart=['engine','tyres'].filter(slot=>state.durability[slot]===0),strikes=state.noStartStrikes||0;
    const showcase=E.showcaseForRace(state.seed,state.raceIndex,card),nextSpotlight=(Math.floor(state.raceIndex/10)+1)*10;
    const candidates=D.SLOTS.map(slot=>E.partUpgradeQuote(state,slot)).filter(q=>q.purchased&&!q.atCap&&!q.marketLocked),affordable=candidates.filter(q=>state.credits>=q.cost).length,cheapest=candidates.length?Math.min(...candidates.map(q=>q.cost)):null;
    const income=state.history.length?`LAST RACE +£${money(state.history.at(-1).prize)}`:'NO RACES YET',affordability=state.garageAction?'BUILD ACTION SPENT':candidates.length?`${affordable}/${candidates.length} TUNES AFFORDABLE · LOWEST £${money(cheapest)}`:`MARKET LV ${market} · SHOP FOR REPLACEMENTS`;
    const course=t.course;
    return `<div class="screen-heading"><div class="section-title">${icon('wrench')}<h2>GARAGE</h2>${DEV_MODE?`<button class="garage-lab-button" data-action="visual-lab">PARTS LAB</button>${ENV_LAB?`<button class="garage-lab-button" data-action="environment-lab">ENVIRONMENT LAB</button><button class="garage-lab-button" data-action="event-motion-lab">EVENT MOTION LAB</button>`:''}`:''}</div><p class="caption">RACE ${String(state.raceIndex+1).padStart(2,'0')} / MARKET LV ${market} / SEED ${state.seed} / NO-START STRIKES ${strikes}/3</p></div><div class="screen-body"><div class="garage-top"><div class="garage-art"><canvas id="garage-canvas" aria-label="Your equipped chassis, engine, tyres and gadget assembled in the garage"></canvas><span class="art-tag">${cannotStart.length?`${cannotStart.map(slot=>P.pretty(slot).toUpperCase()).join(' + ')} BROKEN · NO START` :gag?`GAG FOUND: ${esc(gag.name.toUpperCase())}`:`READY FOR RACE ${state.raceIndex+1}`}</span><div class="stat-strip">${Object.entries(st).map(([k,v])=>`<div><strong>${v}</strong><span>${D.STAT_NAMES[k]}</span></div>`).join('')}<div><strong>${E.vehicleWeight(state)}</strong><span>WEIGHT</span></div></div></div><aside class="next-race frame-light"><div class="track-summary">${icon('road')}<div><p class="caption">UP NEXT / RACE ${state.raceIndex+1}</p><h3>${esc(t.name)}</h3></div></div><p class="track-blurb">${esc(t.blurb)}</p><p class="track-favours"><b>SURFACE:</b> ${esc(surf.name.toUpperCase())}<br><b>COURSE:</b> STRAIGHT ${course.straight} / CORNERS ${course.cornering} / ACCEL ${course.acceleration} / ENDURANCE ${course.endurance} / IMPACT ${course.impact}</p><div class="hazard-line"><small>KNOWN HAZARD / LAP ${card.signatureLap} OF ${card.lapCount}</small><b>${esc(sig.title)}</b></div><p class="race-conditions">${icon('weather')}${esc(w.name)} · ${esc(surf.name)} · <b>${card.lapCount} LAPS</b></p><p class="showcase-countdown"><b>RACE AFTER:</b> ${esc(outlook)}</p>${showcase?`<div class="showcase-card"><b>★ SHOWCASE: ${esc(showcase.title)}</b><span>${esc(showcase.goal)}</span><small>BONUS £${showcase.bonusCredits} + ${showcase.bonusPoints} SCORE</small></div>`:`<p class="showcase-countdown">NEXT SHOWCASE / RACE ${nextSpotlight}</p>`}<p class="lap-wear-note">Parts scale +5% per level. Correct terrain matters more than a few levels. Fresh replacements arrive at 100% condition and reset repair escalation; tuning preserves every scar.</p><div class="approach-control" aria-label="Driving approach">${Object.entries(D.APPROACHES).map(([id,a])=>`<button data-action="approach" data-id="${id}" aria-pressed="${state.approach===id}">${a.name}</button>`).join('')}</div><p class="approach-info">${esc(D.APPROACHES[state.approach].note)}</p></aside></div><div class="garage-decision" role="status"><b>${strikes?`STRIKES ${strikes}/3 · `:''}${state.garageAction?`USED: ${state.garageAction.kind.toUpperCase()} ${P.pretty(state.garageAction.slot).toUpperCase()}`:'ONE BUILD CHOICE THIS STOP'}</b><span>${state.garageAction?'Race to reset the build action. Repairs still work.':'Tune ONE installed part or buy ONE replacement. Repairs use wrenches separately.'}<small class="garage-economy">${affordability} · ${income}${gag?` · ${esc(gag.name.toUpperCase())} ACTIVE`:''}</small></span></div>${cannotStart.length?`<div class="start-warning" role="alert"><b>WON'T START</b><span>${cannotStart.map(slot=>P.pretty(slot).toUpperCase()).join(' + ')} at 0%. Racing now is an automatic 5th and strike ${Math.min(3,strikes+1)} of 3${strikes+1>=3?' (ends the run)':''}. Repair or replace first.</span></div>`:''}<section class="parts-grid" aria-label="Installed equipment and repairs">${D.SLOTS.map(slotMarkup).join('')}</section></div><div class="big-actions"><button data-action="shop">${icon('engine')} SHOP / REPLACE</button><button class="primary ${cannotStart.length?'danger':''}" data-action="race">${icon('flag')} ${cannotStart.length?`TRY TO START · STRIKE ${Math.min(3,strikes+1)}/3 ▶`:'START RACE ▶'}</button></div>`;
  }
  function raceMarkup(){
    const surf=E.surface(replay.result.surfaceId),track=E.track(replay.result.trackId),weather=E.weather(replay.result.weatherId),condition=replay.result.durabilityBefore||raceBefore?.durability||state.durability;
    return `<div id="race-wrap" class="race-wrap" data-paused="false"><canvas id="race-canvas" aria-hidden="true"></canvas><div class="race-hud-top"><div class="race-weather-chip">${icon('weather')}<div><strong>${esc(track.name)}</strong><small id="race-weather-label">${esc(weather.name)} · ${esc(surf.name)} · ${esc(D.APPROACHES[replay.result.approach].name)}</small></div></div><div class="race-lap-position"><div><small>${[8,9,10,11,12,13,14,15,16].includes(replay.result.rulesVersion)?'LAP':'STAGE'}</small><b id="stage-counter">1 / ${replay.result.lapCount||3}</b></div><div><small id="position-label">POSITION</small><b id="position-value">05</b></div></div></div><div class="race-condition-strip" aria-label="Starting component condition">${D.SLOTS.map(slot=>`<div data-slot="${slot}" title="${P.pretty(slot)} ${condition[slot]}%">${icon(slot)}<progress max="100" value="${condition[slot]}" aria-label="${P.pretty(slot)} starting condition ${condition[slot]}%"></progress><b>${condition[slot]}%</b></div>`).join('')}</div><section id="event-box" class="race-event compact" aria-live="polite"><canvas id="event-choice-visual" class="event-choice-visual" hidden aria-hidden="true"></canvas><div class="event-copy-wrap"><span id="event-label" class="caption"></span><h3 id="event-title"></h3><p id="event-copy"></p><div id="event-choice-actions" class="race-choice-actions" hidden></div></div></section><div class="paused-label">PAUSED</div><div class="race-progress-hud"><span id="phase-label">AUTO-RACE / START</span><progress id="race-progress" value="0" max="1" aria-label="Race replay progress"></progress></div></div><div class="race-controls"><div><button data-action="pause" id="pause-control" aria-label="Pause race">PAUSE</button><button data-action="next-phase">NEXT ›</button></div><div aria-label="Replay speed">${[1,2,3,4].map(n=>`<button data-action="speed" data-id="${n}" aria-pressed="${prefs.speed===n}">${n}×</button>`).join('')}<button class="primary" data-action="skip">SKIP ▶</button></div></div>`;
  }
  function lapReport(r) {
    if(r.noStart)return `<div class="lap-report-summary"><span class="caption">DID NOT START · STRIKE ${r.noStartStrike}/3</span><p>No laps were driven. ${(r.noStartSlots||['engine']).map(slot=>P.pretty(slot)).join(' and ')} at 0% condition; each part remains fitted.</p><p>${r.noStartStrike>=3?'Three no-starts. The run has ended.':'Repair or replace the engine and tyres to get another chance.'} Every installed part retains its physical weight and identity.</p></div>`;
    if(![8,9,10,11,12,13,14,15,16].includes(r.rulesVersion)) {
      const sig=E.signature(r.signatureId),wild=window.ScrapLegacyEngine.wildcard(r.wildcardId);
      return `<div class="lap-report-summary"><span class="caption">LEGACY V2 REPORT</span><p><b>${esc(sig.title)}</b> · ${esc(sig.text)}</p><p>${wild?esc(wild.title):'No secondary incident.'} This race used the old rules.</p></div>`;
    }
    const reached=new Set(r.laps.flatMap(l=>l.effects.map(e=>e.key).filter(Boolean))),missed=r.events.filter(e=>!reached.has(e.key));
    const cards=r.laps.map(l=>{
      const wear=l.effects.find(e=>e.kind==='wear'),incidents=l.effects.filter(e=>e.kind!=='wear');
      const body=incidents.length?incidents.map((e,j)=>{const d=E.eventDefinition(e);return `<div class="lap-event-card ${e.damage?'damaging':''}"><canvas class="incident-visual-canvas" data-lap="${l.lap}" data-event="${esc(e.id||e.key||'')}" data-event-index="${j}" aria-hidden="true"></canvas><div class="lap-event-copy"><h3>${esc(d.title)}</h3><p>${esc(e.choiceEvent?(e.outcomeText||d.text):(d.text||'Something happened out there.'))}</p>${e.choiceEvent?`<small>ROUTE: ${esc((e.choice||'safe').toUpperCase())} · ${esc((e.outcome||'safe').toUpperCase())}</small>`:''}<small>${e.damage?`DAMAGE −${e.damage}`:'NO DAMAGE'}${e.scoreDelta?` · PERFORMANCE ${signed(e.scoreDelta)}`:''}${e.credits?` · £${e.credits}`:''}</small></div></div>`}).join(''):`<p class="lap-clear">No incident on this lap.</p>`;
      return `<article class="lap-card"><div class="lap-card-head"><b>LAP ${l.lap}</b>${l.failedSlot?'<span class="lap-alert">FAILURE</span>':''}</div><div class="lap-wear-line">${icon('flag')}<span>Racing wear: <b>−${wear?.damage||0}</b></span></div>${body}</article>`;
    }).join('');
    return `<div class="lap-report-summary"><span class="caption">LAP HISTORY</span><p>${r.lapsCompleted} / ${r.lapCount} laps · ordinary wear ×${r.wearMultiplier.toFixed(2)}</p><p>Normal wear <b>${r.normalWear}</b> · incident damage <b>${r.incidentDamage}</b></p></div>${cards}${missed.length?`<p class="missed-events">Not reached after failure: ${missed.map(e=>esc(E.eventDefinition(e).title)).join(', ')}.</p>`:''}`;
  }
  function resultsMarkup(){
    const r=state.history.at(-1),t=E.track(r.trackId),wrecked=!!r.failedSlot,noStart=!!r.noStart,runOver=!!state.finished;
    const header=`<div class="screen-heading result-heading"><div class="section-title"><div class="checkered" aria-hidden="true"></div><h2>${noStart?(runOver?'THREE STRIKES · RUN OVER':'NO START'):wrecked?'RACE RETIRED':'RACE COMPLETE'}</h2></div><p class="caption">RACE ${r.race} / ${esc(t.name.toUpperCase())}</p></div>`;
    const tabs=`<div class="result-tabs" role="tablist" aria-label="Race report views"><button id="result-tab-finish" role="tab" aria-controls="result-tab-panel" aria-selected="${resultTab==='finish'}" data-action="result-tab" data-id="finish">${icon('flag')} FINISH</button><button id="result-tab-details" role="tab" aria-controls="result-tab-panel" aria-selected="${resultTab==='details'}" data-action="result-tab" data-id="details">${icon('wrench')} BREAKDOWN</button></div>`;
    const ranking=r.standings.map((x,i)=>`<div class="leaderboard-entry ${x.player?'is-player':''} ${i===0?'is-leader':''}"><span class="leaderboard-rank">${x.player&&noStart?'DNS':x.player&&wrecked?'DNF':String(i+1).padStart(2,'0')}</span><canvas class="leaderboard-car" data-standing-index="${i}" aria-hidden="true"></canvas><span class="leaderboard-driver">${x.player?'YOUR CAR':esc(x.name)}${!x.player&&x.archetype?`<small class="rival-type">${esc(x.archetype.toUpperCase())}</small>`:''}</span><span class="leaderboard-score">${x.score.toFixed(1)}</span></div>`).join('');
    const podium=`<div class="podium-stage"><section class="podium-hero frame-light"><p class="podium-kicker">${noStart?'STARTING GRID DISASTER':wrecked?'ENGINE / TYRE FAILURE':'CHEQUERED FLAG'}</p><div class="podium-art"><div class="podium-result" data-place="${noStart?'DNS':wrecked?'5TH / DNF':P.ordinal(r.place).toUpperCase()}">${icon(wrecked?'wrench':'trophy')}</div><canvas id="result-car-canvas" aria-hidden="true"></canvas><div class="podium-circuit">${esc(t.name)} · ${r.lapsCompleted}/${r.lapCount} LAPS</div></div><div class="podium-rewards"><div class="reward-money">${icon('money')}<small>MONEY</small><b>+£${money(r.prize)}</b></div><div class="reward-points">${icon('trophy')}<small>POINTS</small><b>+${money(r.pointsEarned)}</b></div><div class="reward-wrenches">${icon('wrench')}<small>WRENCHES</small><b>+${r.wrenchDrop}</b></div></div>${r.showcase?`<div class="podium-showcase ${r.showcase.success?'cleared':'missed'}"><strong>★ ${r.showcase.success?'SHOWCASE CLEARED':'SHOWCASE MISSED'}</strong><small>${esc(r.showcase.title)}${r.showcase.success?` · +${r.showcase.points} points`:''}</small></div>`:''}<div class="podium-footer">${noStart?(runOver?'DNS · 5TH · STRIKE 3/3 · RUN ENDED':`DNS · 5TH · STRIKE ${r.noStartStrike}/3 · REPAIR TO AVOID STRIKE-OUT`):wrecked?'CAR RETIRED · NO RACE REWARDS':`${money(state.points)} TOTAL POINTS · RACE ${r.race}`}</div></section><section class="podium-standings frame-light"><h3>FINISH ORDER</h3><p class="caption">YOUR RESULT IS HIGHLIGHTED</p><div class="leaderboard-list">${ranking}</div></section></div>`;
    const condition=D.SLOTS.map(slot=>`<div class="condition-row" data-slot="${slot}"><div class="condition-part">${icon(slot)}<b>${P.pretty(slot)}</b></div><span>${r.durabilityBefore[slot]}%</span><span class="condition-loss">−${r.damageBySlot[slot]}%</span><div class="condition-now"><b>${r.durabilityAfter[slot]}%</b><progress max="100" value="${r.durabilityAfter[slot]}"></progress></div></div>`).join('');
    const details=`<div class="result-layout"><section class="result-main frame-light scroll-panel"><div class="report-band">COMPONENT CONDITION</div><div class="condition-head"><b>PART</b><b>BEFORE</b><b>LOST</b><b>NOW</b></div>${condition}<div class="detail-facts compact-facts"><p><b>${icon('flag')} FINISH</b><span>${noStart?'DNS · 5th':wrecked?'DNF · 5th':P.ordinal(r.place)} / 5 · ${r.lapsCompleted}/${r.lapCount} laps</span></p><p><b>${icon('money')} REWARDS</b><span>£${r.prize} · +${r.pointsEarned} score · +${r.wrenchDrop} wrench${r.wrenchDrop===1?'':'es'}</span></p><p><b>${icon('gadget')} MODIFIERS</b><span>Position ×${r.positionMultiplier} · Low damage ×${r.cleanMultiplier}</span></p><p><b>${icon('road')} MARKET</b><span>Lv ${r.marketLevel} · rivals arrive fresh each race</span></p><p><b>${icon('engine')} RIVALS</b><span>${r.rivalBuilds.map(b=>esc(b.name)+' ('+esc(b.archetype)+', Lv '+b.budget+')').join(' · ')}</span></p><p><b>${icon('weather')} ENVIRONMENT</b><span>${esc(E.surface(r.surfaceId).name)} · terrain/heat resolved separately from direct damage</span></p></div></section><section class="result-events frame-light scroll-panel"><div class="report-band">LAP HISTORY</div>${lapReport(r)}</section></div>`;
    return `${header}${tabs}<section class="result-switchboard" id="result-tab-panel" role="tabpanel" aria-labelledby="result-tab-${resultTab==='finish'?'finish':'details'}">${resultTab==='finish'?podium:details}</section><div class="big-actions result-actions"><button data-action="menu">${icon('menu')} MAIN MENU</button><button class="primary" data-action="${runOver?'replay-seed':'continue'}">${icon('chassis')} ${runOver?'RETRY THIS SEED':'CONTINUE TO GARAGE'} ▶</button></div>`;
  }
  function recordsMarkup(){return `<div class="screen-heading"><div class="section-title">${icon('trophy')}<h2>RECORDS</h2></div><p class="caption">LOCAL TO THIS BUILD / NO ONLINE LEADERBOARD</p></div><div class="records-grid"><div class="record-card frame-light"><p class="caption">HIGHEST SCORE</p><b>${money(records.bestPoints)}</b></div><div class="record-card frame-light"><p class="caption">LONGEST RUN</p><b>${records.bestRaces} <small>RACES</small></b></div></div><section class="records-history frame-light scroll-panel"><h3>LATEST RUN / ${hasRun?'SEED '+state.seed:'NO RUN YET'}</h3>${hasRun&&state.history.length?`<table class="results-table"><thead><tr><th>RACE</th><th>CIRCUIT</th><th>POS</th><th>SCORE</th></tr></thead><tbody>${state.history.slice().reverse().map(r=>`<tr><td>${r.race}</td><td>${esc(E.track(r.trackId).name)}</td><td>${r.noStart?'DNS (5TH)':r.failedSlot?'DNF':P.ordinal(r.place)}</td><td>+${r.pointsEarned}</td></tr>`).join('')}</tbody></table><p class="caption">Last ${state.history.length} results retained. Records update as you race.</p>`:'<p class="record-empty">No racing history yet. Start a run to set the first record.</p>'}</section><div class="big-actions"><button data-action="menu">◀ MAIN MENU</button>${hasRun?'<button class="primary" data-action="continue-title">BACK TO RUN ▶</button>':''}</div>`;}
  function stopRenderer(){cancelAnimationFrame(raf);raf=0;renderer=null;lastTick=null;lastPhase=-1;}
  function paintStatic(kind){const canvas=$(kind+'-canvas');if(!canvas)return;const r=window.ScrapScene.create(canvas,rendererPreferences());if(!r)return;renderer=r;const draw=()=>kind==='title'?r.drawTitle():r.drawGarage(state.loadout);draw();r.ready.then(()=>{if(canvas.isConnected)draw();});}
  function paintPartArt(root=document){
    if(!window.ScrapVehicleArt?.drawPart)return;
    root.querySelectorAll('canvas[data-part-art]').forEach(c=>{const slot=c.dataset.partArt;c.width=180;c.height=90;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);window.ScrapVehicleArt.drawPart(ctx,{x:90,y:45,w:166,h:78,slot,loadout:state.loadout,view:'garage'});});
    root.querySelectorAll('canvas[data-offer-art]').forEach(c=>{
      const id=c.dataset.offerArt,o=E.shopOffers(state).find(x=>x.id===id);if(!o)return;
      const loadout={...state.loadout,[o.slot]:o.id};c.width=640;c.height=290;
      const ctx=c.getContext('2d');
      const colour={engine:'#b35445',tyres:'#537e8b',chassis:'#429082',gadget:'#bb9651'}[o.slot]||'#668b8b';
      const bg=ctx.createLinearGradient(0,0,0,290);
      bg.addColorStop(0,'#e0e8dc');bg.addColorStop(.68,'#eee9d7');bg.addColorStop(1,'#d2d8c8');
      ctx.fillStyle=bg;ctx.fillRect(0,0,640,290);
      // A simple display surface and shadow, not an unrelated stock image.
      ctx.fillStyle='#c6cec2';ctx.fillRect(0,226,640,64);
      ctx.fillStyle='#aab9af';ctx.fillRect(0,227,640,3);
      ctx.fillStyle='#f6f1df';ctx.fillRect(0,236,640,2);
      ctx.fillStyle='rgba(18,45,51,.22)';ctx.beginPath();ctx.ellipse(320,237,234,19,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=colour;ctx.fillRect(0,0,640,8);
      ctx.fillStyle='rgba(21,51,55,.12)';ctx.fillRect(28,27,2,48);ctx.fillRect(28,27,44,2);
      ctx.fillRect(612,27,2,48);ctx.fillRect(570,27,44,2);
      window.ScrapVehicleArt.drawPart(ctx,{x:320,y:140,w:572,h:220,slot:o.slot,loadout,view:o.id==='aero-kit'?'rear':'garage'});
      ctx.fillStyle=colour;ctx.fillRect(20,261,65,5);ctx.fillRect(555,261,65,5);
    });
  }
  function paintResultArt(){
    if(screen!=='result'||!state.history.length||!window.ScrapVehicleArt)return;
    const r=state.history.at(-1),hero=$('result-car-canvas');
    if(hero){hero.width=520;hero.height=230;const ctx=hero.getContext('2d');ctx.clearRect(0,0,hero.width,hero.height);window.ScrapVehicleArt.draw(ctx,{x:260,y:210,w:475,h:195,loadout:r.loadoutBefore,view:'garage',style:'illustrated',comboBodywork:true});}
    document.querySelectorAll('.leaderboard-car').forEach(c=>{const i=Number(c.dataset.standingIndex),standing=r.standings[i];let loadout=r.loadoutBefore;if(!standing?.player){const rb=r.rivalBuilds.find(b=>b.name===standing?.name);if(rb)loadout=rb.loadout;}c.width=148;c.height=76;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);window.ScrapVehicleArt.draw(ctx,{x:74,y:70,w:132,h:60,loadout,view:'rear',style:'chunky',comboBodywork:true});});
    document.querySelectorAll('.incident-visual-canvas').forEach(c=>{const lap=Number(c.dataset.lap),record=r.laps.find(x=>x.lap===lap),effect=record?.effects.filter(x=>x.kind!=='wear')[Number(c.dataset.eventIndex)||0];if(!effect)return;c.width=300;c.height=160;const scene=window.ScrapScene.create(c,{style:'chunky',camera:'rear',comboBodywork:true});scene?.drawRace({time:2200,track:r.trackId,surface:r.surfaceId,weather:r.weatherId,event:effect.id||effect.key,eventVariant:'normal',eventPhaseTime:800,motion:false,loadout:r.loadoutBefore,rivalLoadouts:r.rivalBuilds?.map(b=>b.loadout)||[]});});
  }
  function render(focus=true){
    stopRenderer();$('game').dataset.screen=screen;$('screen').className='screen'+(screen==='race'?' race-screen':'');
    header();$('screen').innerHTML=screen==='title'?titleMarkup():screen==='garage'?garageMarkup():screen==='race'?raceMarkup():screen==='result'?resultsMarkup():recordsMarkup();
    $('save-status').textContent=storageNotice;
    if(screen==='race'){renderer=window.ScrapScene.create($('race-canvas'),rendererPreferences());lastTick=null;updateRace();raf=requestAnimationFrame(tick);}
    else if(screen==='garage')paintStatic('garage');else if(screen==='title')paintStatic('title');
    paintPartArt($('screen'));
    paintResultArt();
    if(focus)$('screen').focus({preventScroll:true});
  }
  function updateRace(){
    if(!replay||screen!=='race')return;
    const f=P.frame(replay,replay.elapsed),fin=f.step.id==='finish',passing=window.ScrapEventTiming.overtakeState(P.overtakeState,replay,replay.elapsed);
    const unresolvedChoice=!!(f.step.choice&&!Object.hasOwn(raceChoices,f.step.choice.key));
    const director=window.ScrapEventTiming;
    if(passing.presentation&&director?.profile(passing.presentation.visual)){
      const normalized=director.sample(passing.presentation.visual,f.local*f.step.duration).visualProgress;
      if(passing.presentation.kind==='fake'&&passing.fake)passing.fake.local=normalized;
      if(passing.presentation.kind==='special'&&passing.special)passing.special.local=normalized;
    }
    if(unresolvedChoice)replay.paused=true;
    const special=!unresolvedChoice&&passing.special?E.passEvent(passing.special.id):null;
    const fake=!unresolvedChoice&&!special&&passing.fake?E.fakePassEvent(passing.fake.id):null;
    const displayKey=special?`pass:${special.id}:${passing.special.index}`:fake?`fake:${fake.id}:${passing.fake.index}`:`step:${f.index}:${unresolvedChoice?'prompt':f.step.resolvedChoice||''}`;
    if(lastRaceDisplay!==displayKey){
      lastRaceDisplay=displayKey;lastPhase=f.index;
      const actions=$('event-choice-actions'),choiceVisual=$('event-choice-visual');
      if(choiceVisual)choiceVisual.hidden=!unresolvedChoice;
      if(special){
        $('event-label').textContent=special.motion==='shortcut'?'GAG SHORTCUT PASS':'SPECIAL OVERTAKE';$('event-title').textContent=special.title;$('event-copy').textContent=special.text;$('event-box').className='race-event compact';actions.hidden=true;actions.innerHTML='';
      }else if(fake){
        $('event-label').textContent='RIVAL COMEBACK';$('event-title').textContent=fake.title;$('event-copy').textContent=fake.text;$('event-box').className='race-event compact fake-pass';actions.hidden=true;actions.innerHTML='';
      }else if(unresolvedChoice){
        $('event-label').textContent='ROUTE CHOICE';$('event-title').textContent=f.step.title;$('event-copy').textContent=`${f.step.choice.prompt} Build fit: ${f.step.choice.riskRating}.`;$('event-box').className='race-event has-choice';
        actions.hidden=false;actions.innerHTML=`<button data-action="event-choice" data-id="safe"><b>${esc(f.step.choice.safeLabel)}</b><small>Safer route</small></button><button class="primary" data-action="event-choice" data-id="risk"><b>${esc(f.step.choice.riskLabel)}</b><small>${esc(f.step.choice.riskRating)} build fit</small></button>`;requestAnimationFrame(()=>paintChoiceEvent(f));
      }else{
        $('event-label').textContent=f.step.label;$('event-title').textContent=f.step.title;$('event-copy').textContent=f.step.copy;$('event-box').className='race-event'+(f.step.id==='opening'?' compact':'')+(f.step.jumpScare?' jump-scare':'');actions.hidden=true;actions.innerHTML='';
      }
      $('stage-counter').textContent=fin?'END':replay.result.noStart?'GRID':`${f.step.lap||Math.min(3,f.index+1)} / ${replay.result.lapCount||3}`;$('phase-label').textContent=special?'SPECIAL OVERTAKE':fake?'RIVAL COMEBACK':f.step.label;$('race-weather-label').textContent=E.weather(f.step.weatherId||replay.result.weatherId).name+' · '+E.surface(replay.result.surfaceId).name+' · '+D.APPROACHES[replay.result.approach].name;header();
    }
    // Never show the usual event card/HUD across an actual transformation movie.
    // Race controls (pause, speed and skip) remain visible and fully functional.
    const cinematicActive=!unresolvedChoice&&!special&&!fake&&f.step.event==='transformation';
    $('race-wrap').dataset.cinematic=String(cinematicActive);
    $('race-wrap').dataset.cinematicStage=cinematicActive?(window.ScrapTransformCinematics?.sample('transformation',f.local*f.step.duration,{loadout:replay.result.loadoutBefore})?.stage||'none'):'none';
    $('race-progress').value=f.progress;$('position-label').textContent=fin?'FINAL POS':'POSITION';$('position-value').textContent=fin?(replay.result.failedSlot?'DNF':`${replay.result.place}/5`):`${passing.position}/5`;$('race-wrap').dataset.paused=String(replay.paused);const pausedLabel=document.querySelector('.paused-label');if(pausedLabel)pausedLabel.textContent=unresolvedChoice?'CHOOSE ROUTE':'PAUSED';$('pause-control').textContent=replay.paused?'RESUME':'PAUSE';$('pause-control').setAttribute('aria-label',replay.paused?'Resume race':'Pause race');
    if(renderer){
      const isShortcut=id=>!!id&&SHORTCUT_RE.test(id);
      const passIsShortcut=isShortcut(special?.visual);
      const choiceShortcut=!special&&!fake&&isShortcut(f.step.sourceId)?f.step.sourceId:null;
      const forcedShortcut=!special&&!fake&&!f.step.choice?FORCED_DETOURS[f.step.sourceId]:null;
      const shortcutVisual=choiceShortcut||forcedShortcut;
      const shortcutMode=passIsShortcut?'pass':choiceShortcut?(unresolvedChoice?'preview':raceChoices[f.step.choice?.key]||'safe'):forcedShortcut?'forced':'preview';
      const eventVisual=special?.visual||fake?.visual||shortcutVisual||f.step.event;
      const portalEvent=!special&&!fake&&!!window.ScrapEventPortals?.recipe(eventVisual);
      const portalMode=portalEvent?(unresolvedChoice?'preview':f.step.choice?(raceChoices[f.step.choice.key]||'safe'):'preview'):'preview';
      const portalOutcome=portalEvent?(f.step.outcome||'success'):'success';
      const passDuration=passIsShortcut?window.ScrapEventEffects.recipe(special.visual).duration:1000;
      const elapsedStep=f.local*f.step.duration;
      const eventTime=passing.presentation&&director?.profile(eventVisual)
        ?director.mapTime(eventVisual,elapsedStep)
        :special?passing.special.local*passDuration:fake?passing.fake.local*1000
        :director?.profile(eventVisual)?director.mapTime(eventVisual,elapsedStep)
        :(prefs.motion?elapsedStep:0);
      renderer.drawRace({time:replay.elapsed,track:replay.result.trackId,surface:replay.result.surfaceId,weather:f.step.weatherId||replay.result.weatherId,event:eventVisual,eventVariant:f.step.rareVisual?'rare':'normal',eventPhaseTime:cinematicActive?elapsedStep:eventTime,finish:fin,wreck:fin&&!!replay.result.failedSlot,motion:prefs.motion,approach:replay.result.approach,loadout:replay.result.loadoutBefore,overtakes:passing,rivalLoadouts:replay.result.rivalBuilds?.map(b=>b.loadout)||[],shortcutMode,portalMode,portalOutcome});
    }
  }
  function tick(time){
    if(screen!=='race'||!replay)return;
    const delta=lastTick===null?0:Math.min(100,Math.max(0,time-lastTick));lastTick=time;
    if(!document.hidden&&!replay.paused&&prefs.autoplay)replay.elapsed=Math.min(replay.total,replay.elapsed+delta*prefs.speed);
    updateRace();if(replay.elapsed>=replay.total){showResult();return;}raf=requestAnimationFrame(tick);
  }
  // Replay pacing: chosen and forced detours take 9.5s at 1x, allowing
  // the vehicle to leave, travel alongside and rejoin the main road. Staying
  // the normal road retains the existing 5.2s choice timing. Purely visual.
  function paceShortcutReplay(view,choices={}){
    if(!view)return view;
    for(const step of view.steps){
      if(step.sourceId==='transformation-sequence')
        step.duration=window.ScrapTransformCinematics.DURATION;
      else if(step.choice&&choices[step.choice.key]==='risk'&&SHORTCUT_RE.test(step.sourceId||''))
        step.duration=9500;
      else if(!step.choice&&Object.hasOwn(FORCED_DETOURS,step.sourceId))
        step.duration=9500;
      else if(step.choice&&choices[step.choice.key]==='risk'&&step.sourceId==='haunted-shortcut')
        step.duration=9000;
      else if(step.choice&&choices[step.choice.key]==='risk'&&['teleporter','wormhole'].includes(step.sourceId))
        step.duration=6500;
    }
    view.total=view.steps.reduce((n,step)=>n+step.duration,0);
    return window.ScrapEventTiming?.prepareReplay(view,E)||view;
  }
  function showResult(){replay=null;raceBefore=null;raceChoices={};lastRaceDisplay='';updateRecords();persist();resultTab='finish';screen='result';render();notify(state.finished?'Run over. Your records are saved.':state.history.at(-1)?.noStart?`No start: fifth place, zero rewards, strike ${state.noStartStrikes}/3.`:state.history.at(-1)?.failedSlot?'Car retired. Return to the garage for repairs.':'Race complete. Check whether you can afford another upgrade or replacement.');}
  function updateRecords(){records.bestRaces=Math.max(records.bestRaces,survived(state));records.bestPoints=Math.max(records.bestPoints,state.points);}
  function closeAll(){if($('confirm-modal').open){pendingConfirm=null;$('confirm-modal').close();}if($('modal').open)$('modal').close();modalKind=null;}
  function changeScreen(next){closeAll();if(next!=='race')replay=null;screen=next;render();}
  function mutate(next,text){state=next;hasRun=true;persist();render(false);notify(text);}
  function freshSeed(){if(window.crypto?.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0];}return Math.floor(Math.random()*4294967296);}
  function newRun(seed){state=E.newRun(seed);resultTab='finish';hasRun=true;blocked=false;replay=null;persist();changeScreen('garage');notify('New run started. Restored events and modular animations are active.');}
  function ask(title,html,callback,label='CONFIRM'){
    if($('confirm-modal').open)return;
    pendingConfirm=callback;$('confirm-content').innerHTML=`<h2 id="confirm-title">${esc(title)}</h2>${html}<div class="confirm-actions"><button data-action="confirm-cancel" autofocus>CANCEL</button><button class="primary" data-action="confirm-ok">${esc(label)}</button></div>`;$('confirm-modal').showModal();
  }
  function askNew(seed){if(hasRun)ask('REPLACE CURRENT RUN?',`<p>Your current run will be replaced. Your records stay. Export it from Options first to keep a separate copy.</p><p>New seed: <b>${seed}</b></p>`,()=>newRun(seed),'START RUN');else newRun(seed);}
  function modalHeading(title,extra=''){return `<div class="modal-heading">${icon(modalKind==='shop'?'engine':'menu')}<h2 id="modal-title">${esc(title)}</h2>${extra}<button class="close-button" data-action="close-modal" aria-label="Close ${esc(title.toLowerCase())}">×</button></div>`;}
  function openModal(kind){
    if($('modal').open){modalKind=kind;renderModal();return;}
    modalKind=kind;returnFocus=document.activeElement;resumePause=replay?replay.paused:false;if(replay){replay.paused=true;updateRace();}
    renderModal();$('modal').showModal();
  }
  // Compare the *actual* output at current and post-purchase durability,
  // not fictional full-condition stats for a worn component.
  function effectivePartStats(item,tier,condition) {
    const raw=E.partStats(item,tier),efficiency=E.conditionEfficiency(condition);if(condition===0)return Object.fromEntries(Object.keys(raw).map(k=>[k,0]));
    return Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,v>0?Math.round(v*efficiency*10)/10:v]));
  }
  function installedStats(slot){if(state.durability[slot]===0)return {power:0,grip:0,armour:0,cooling:0};const p=E.part(state.loadout[slot]);return effectivePartStats(p,state.levels[slot],state.durability[slot]);}
  function proposedStats(o){const p=E.part(o.id);return effectivePartStats(p,o.level,100);}
  function statsDL(st){return `<dl>${Object.entries(st).map(([k,v])=>`<dt>${D.STAT_NAMES[k]}</dt><dd>${signed(v)}</dd>`).join('')}</dl>`;}
  function offerMarkup(o){
    const p=E.part(o.id),used=!!state.garageAction,can=!used&&state.credits>=o.price,diff=o.level-o.marketLevel;
    const levelTag=diff>=2?'JACKPOT +2':diff===1?'LUCKY +1':diff===0?'MARKET LEVEL':'OLDER STOCK';
    return `<article class="offer" data-offer="${o.id}" data-slot="${o.slot}"><div class="offer-top">${icon(o.slot)}<span>${P.pretty(o.slot)} / LV ${o.level}</span><em>${levelTag}</em></div><canvas class="offer-art" data-offer-art="${o.id}" aria-hidden="true"></canvas><h3>${esc(p.name)}</h3><p class="offer-note">${esc(p.note)}</p><p class="caption">MARKET LV ${o.marketLevel}</p>${statsDL(proposedStats(o))}<p class="weight-note">WEIGHT: ${E.part(state.loadout[o.slot]).weight} → ${p.weight} · TOTAL: ${E.vehicleWeight(state)} → ${E.vehicleWeight(state)-E.part(state.loadout[o.slot]).weight+p.weight}</p><p class="replace-note">Replaces ${esc(E.part(state.loadout[o.slot]).name)} (LV ${E.equipmentLevel(state.levels[o.slot])}, ${state.durability[o.slot]}%).<br>New part: <b>100% condition</b>. Repair escalation resets.</p><button data-action="buy" data-id="${o.id}" ${can?'':'disabled'}>${used?'BUILD ACTION USED':can?`REPLACE / £${money(o.price)}`:`NEED £${money(o.price)}`}</button></article>`;
  }
  function paintChoiceEvent(frame){
    const canvas=$('event-choice-visual');if(!canvas||canvas.hidden||!frame?.step?.choice||!window.ScrapScene)return;
    const preview=window.ScrapScene.create(canvas,{style:'illustrated',camera:'rear',comboBodywork:true});if(!preview)return;
    preview.drawRace({time:0,track:replay.result.trackId,surface:replay.result.surfaceId,weather:frame.step.weatherId||replay.result.weatherId,event:(/^((wreckage|overgrown|flooded|dune|frozen-lake)-shortcut)$/.test(frame.step.sourceId||'')?frame.step.sourceId:frame.step.event),eventVariant:frame.step.rareVisual?'rare':'normal',eventPhaseTime:650,finish:false,wreck:false,motion:false,approach:replay.result.approach,loadout:replay.result.loadoutBefore,rivalLoadouts:replay.result.rivalBuilds?.map(b=>b.loadout)||[],shortcutMode:'preview',portalMode:'preview'});
  }
  function renderModal(){
    if(DEV_MODE)window.ScrapVisualLab.dispose();
    if(ENV_LAB)window.ScrapEnvironmentLab.dispose();
    if(DEV_MODE)window.ScrapEventMotionLab?.dispose();
    $('modal').classList.toggle('environment-lab-dialog',ENV_LAB&&(modalKind==='environment-lab'||modalKind==='event-motion-lab'));
    $('modal').classList.toggle('visual-lab-dialog',DEV_MODE&&modalKind==='visual-lab');
    $('modal').classList.toggle('shop-dialog',modalKind==='shop');
    if(modalKind==='environment-lab'){
      if(!ENV_LAB)throw Error('Environment Lab is only available in development builds.');
      $('modal-content').innerHTML=modalHeading('ENVIRONMENT LAB')+window.ScrapEnvironmentLab.markup();
      window.ScrapEnvironmentLab.mount($('modal-content'),state.loadout);
      return;
    }
    if(modalKind==='event-motion-lab'){
      if(!DEV_MODE||!window.ScrapEventMotionLab)throw Error('Event Motion Lab is only available in development builds.');
      $('modal-content').innerHTML=modalHeading('EVENT MOTION LAB')+window.ScrapEventMotionLab.markup();
      window.ScrapEventMotionLab.mount($('modal-content'),state.loadout);
      return;
    }
    if(modalKind==='visual-lab'){
      if(!DEV_MODE)throw Error('Parts Lab is available only in development builds.');
      $('modal-content').innerHTML=modalHeading('PARTS LAB')+window.ScrapVisualLab.markup();
      window.ScrapVisualLab.mount($('modal-content'),state.loadout,{motion:prefs.motion});
      return;
    }
    if(modalKind==='shop'){
      const offers=E.shopOffers(state),filtered=offers.filter(o=>shopFilter==='all'||o.slot===shopFilter),quote=E.shopRefreshQuote(state);
      $('modal-content').innerHTML=modalHeading('PARTS SHOP',`<span class="modal-money">£${money(state.credits)} / ${state.wrenches} W</span>`)+`<div class="modal-main"><nav class="filter-tabs" aria-label="Equipment categories">${['all',...D.SLOTS].map(k=>`<button data-action="filter-shop" data-id="${k}" aria-pressed="${shopFilter===k}">${k==='all'?'ALL':P.pretty(k).toUpperCase()} (${k==='all'?offers.length:offers.filter(o=>o.slot===k).length})</button>`).join('')}</nav><section class="shop-offers" data-count="${filtered.length}" aria-label="Available upgrades">${filtered.length?filtered.map(offerMarkup).join(''):'<div class="empty-shop">NO OFFERS IN THIS CATEGORY<br>Keep your current part. New stock arrives after the next race.</div>'}</section><div class="shop-refresh"><div><strong>CHANGE THIS SHOP'S STOCK</strong><small>One paid refresh maximum · price £${money(quote.cost)} · resets next race.<br>Stock rolls around Market Lv ${quote.marketLevel}: 10% -1 / 67% market / 20% +1 / 3% +2.</small></div><button data-action="refresh-shop" ${quote.affordable?'':'disabled'}>${!quote.available?(state.shopRefreshes?'REFRESH USED':'BUILD ACTION USED'):quote.affordable?`REFRESH / £${money(quote.cost)}`:`NEED £${money(quote.cost)}`}</button></div></div><div class="modal-footer"><span>${state.shopRefreshes ? 'PAID REFRESH USED THIS STOP' : 'THREE RANDOM OFFERS'}</span><span>LV 1–10 · One TUNE OR REPLACEMENT per stop. Repairs are separate.</span></div>`;
    }else if(modalKind==='settings'){
      $('modal-content').innerHTML=modalHeading('SETTINGS')+`<div class="modal-main settings-polish"><section class="settings-section"><h3>RACE PRESENTATION</h3><div class="settings-row"><label for="setting-speed">Replay speed<small>Changes presentation time, never results.</small></label><select id="setting-speed">${[1,2,3,4].map(n=>`<option value="${n}" ${prefs.speed===n?'selected':''}>${n}× speed</option>`).join('')}</select></div><div class="settings-row"><label for="setting-motion">Moving scenery<small>Turn off to use a static road and weather. Event text still advances.</small></label><input id="setting-motion" type="checkbox" ${prefs.motion?'checked':''}></div><div class="settings-row"><label for="setting-autoplay">Automatic replay<small>Off: use Next to step through events. Skip is always available.</small></label><input id="setting-autoplay" type="checkbox" ${prefs.autoplay?'checked':''}></div></section><section class="settings-section"><h3>DISPLAY & HELP</h3><div class="settings-actions"><button data-action="fullscreen">${document.fullscreenElement?'LEAVE':'ENTER'} FULLSCREEN</button><button data-action="help">HOW TO PLAY</button></div></section><section class="settings-section"><h3>SAVE YOUR RUN</h3><p class="warning-note">Save schema v0.4 and remains compatible with v0.4.0 exports. Older pre-v0.4 exports remain intentionally rejected. Export before moving this HTML or changing browsers.</p><div class="settings-actions"><button data-action="export" ${hasRun?'':'disabled'}>EXPORT SAVE</button><button data-action="import">IMPORT SAVE</button></div><div class="settings-row"><label for="seed-input">Run seed<small>Recreates race and shop offers. A new run still needs confirmation.</small></label><input id="seed-input" type="number" min="0" max="4294967295" step="1" value="${state.seed}"></div><div class="settings-actions"><button data-action="seed">START THIS SEED</button><button data-action="new">NEW RANDOM RUN</button><button data-action="menu">MAIN MENU</button></div></section><p class="caption settings-caption">TAB / ENTER: MENUS · SPACE: PAUSE · F: FULLSCREEN<br>Transformation Cutaways v0.7.21f. Save schema v0.4 compatible. Straight Rear is normal race view; side camera is for cutaways only.</p></div><div class="modal-footer"><span>${esc(storageNotice)}</span><span>Settings affect presentation only.</span></div>`;
    }else if(modalKind==='breakdown'){
      const r=state.history.at(-1);$('modal-content').innerHTML=modalHeading('WHY THIS RESULT?')+`<div class="modal-main help-copy"><table class="results-table"><tbody><tr><td>Environment-adjusted pace</td><td>${r.base.toFixed(1)}</td></tr><tr><td>Existing wear penalty</td><td>−${r.conditionPenalty.toFixed(1)}</td></tr><tr><td>Heat fade</td><td>−${r.heatPenalty.toFixed(1)}</td></tr><tr><td>Mass/acceleration penalty</td><td>−${r.weightPenalty.toFixed(1)}</td></tr><tr><td>Terrain momentum penalty</td><td>−${(r.terrainPenalty||0).toFixed(1)}</td></tr><tr><td>Hazard time loss</td><td>−${(r.hazardDamage*.18).toFixed(1)}</td></tr><tr><td>Seeded luck</td><td>${signed(r.fortune)}</td></tr><tr><td>Final score, including weather/event</td><td>${r.score.toFixed(1)}</td></tr></tbody></table><p>Position compares your score with four rivals fitted with seeded random equipment. Their full-condition power, grip, armour, cooling, heat and weight affect their scores. Early opponents can lose performance from harmful race incidents. That risk fades to zero by race 46; their damage does not persist between races. The animated cars are presentation, not physics.</p><p>Money and points reward position and low damage. A 3–7 lap race adds ordinary wear with race length. Incidents resolve separately, once each.</p></div>`;
    }else{
      $('modal-content').innerHTML=modalHeading('HOW TO PLAY')+`<div class="modal-main help-copy"><h3>BUILD → RACE → ADAPT</h3><p>You see the exact next course, surface, weather and race length, plus a vague clue for the race after that. The shop is random. Build for what is actually coming rather than marrying four numbers forever.</p><h3>FORTY PARTS / TEN LEVELS</h3><p>Four slots: Engine, Tyres, Chassis and Gadget. Each starts with a Lv0 fallback and has nine proper Lv1–10 families. Positive stats improve by 5% per level. Weight, drawbacks and terrain traits do not scale away. A higher-level wrong part can still be worse for the next environment.</p><p>Each workshop allows one major action: TUNE one installed part +1 level, or REPLACE one part from the shop. Tuning costs about 30% of a fresh target-level part and cannot exceed Market Level; it keeps condition and repair history. A replacement destroys the old part, arrives at 100% condition and resets that slot's repair escalation.</p><h3>MARKET & SHOP</h3><p>Market Level rises through the run toward Lv10. Three random offers roll around it: 10% one level below, 67% at market, 20% +1 and 3% +2. One paid refresh is allowed per workshop. There is no inventory, buyback or guaranteed build path.</p><h3>CONDITION & WRENCHES</h3><p>Repairs restore up to 20 condition. The first repair on a part costs 1 wrench, then 2, 3, 4 and so on. Tuning does not reset this. Replacing does. Credits change the car; wrenches preserve it. Broken parts remain fitted and contribute literally 0 positive or negative stats and no special traits; their physical weight stays. A car with 0% chassis or gadget may race, but those parts contribute exactly zero stats or traits. At 0% engine OR tyres, it cannot start: automatic fifth place, zero rewards, zero laps and one cumulative no-start strike (even if both are broken). Three no-start strikes end the run; successful races do not clear strikes. Engine or tyres failing mid-race cause a fifth-place DNF, but no no-start strike; repair or replace them before the next race.</p><h3>COURSE + SURFACE + WEATHER</h3><p>Course layout determines whether Power, Grip, acceleration, endurance or impact resistance matter. Surface determines traction, roughness, softness and tyre stress. Weather shifts those pressures again. F1 Circuit and Airstrip can both be smooth roads while favouring very different cars.</p><h3>GAG BUILDS</h3><p>Exact four-part combinations can unexpectedly transform the vehicle. They are discoveries, not guaranteed classes. Gags receive small thematic synergies and occasional special event interactions, but adaptive non-gag builds should usually be stronger overall. Break a gag whenever the shop offers a better decision; maybe the missing part comes back stronger later.</p><h3>ENDLESS</h3><p>Part levels stop at 10. After that, rivals and race stress keep escalating until the machine or economy finally loses the argument.</p><h3>CONTROLS</h3><p>Tab / Enter navigate menus. Space pauses a race. F requests fullscreen. The race resolves when you commit; replay controls cannot alter the result.</p></div>`;
    }
    paintPartArt($('modal'));
  }
  function buyConfirmation(id){
    const o=E.shopOffers(state).find(o=>o.id===id);if(!o)throw Error('That offer is no longer available.');
    const previous=E.part(state.loadout[o.slot]),next=E.part(o.id);
    ask('PERMANENT REPLACEMENT',`<div class="comparison"><div><small>DISCARD</small><strong>${esc(previous.name)}</strong><small>LV ${E.equipmentLevel(state.levels[o.slot])} / ${state.durability[o.slot]}% condition</small>${statsDL(installedStats(o.slot))}<small>WEIGHT ${previous.weight}</small></div><div><small>INSTALL</small><strong>${esc(next.name)}</strong><small>LV ${o.level} / 100% condition</small>${statsDL(proposedStats(o))}<small>WEIGHT ${next.weight}</small></div></div><p>Costs <b>£${o.price}</b>. The old part is gone for good. The replacement is fresh and its next repair costs 1 wrench. This uses your one build action.</p>`,()=>{const nextState=E.buy(state,id);mutate(nextState,next.name+' installed fresh at Lv '+o.level+'. Previous part discarded.');renderModal();$('modal').querySelector('[data-action="close-modal"]').focus();},'REPLACE PART');
  }
  function upgradeConfirmation(slot){
    const q=E.partUpgradeQuote(state,slot);if(!q.available)throw Error(q.marketLocked?'Tuning cannot exceed Market Level.':'That tune is not available this stop.');if(!q.affordable)throw Error('Not enough money to tune the part.');
    const item=E.part(state.loadout[slot]),before=installedStats(slot),after=effectivePartStats(item,q.targetLevel,state.durability[slot]);
    ask('TUNE INSTALLED '+P.pretty(slot).toUpperCase(),`<div class="comparison"><div><small>BEFORE</small><strong>${esc(item.name)}</strong><small>LV ${q.currentLevel} / ${state.durability[slot]}% condition</small>${statsDL(before)}<small>NEXT REPAIR ${state.repairs[slot]+1} W</small></div><div><small>AFTER</small><strong>${esc(item.name)}</strong><small>LV ${q.targetLevel} / ${state.durability[slot]}% condition</small>${statsDL(after)}<small>NEXT REPAIR STILL ${state.repairs[slot]+1} W</small></div></div><p>Spend <b>£${money(q.cost)}</b> for +1 level. Condition and repair history do not improve. This uses your one build action.</p>`,()=>{const upgraded=E.upgradePart(state,slot);mutate(upgraded,`${item.name} tuned to Level ${q.targetLevel}. Condition and repair history unchanged.`);},'TUNE PART');
  }
  function downloadSave(){const blob=new Blob([E.encodeSave(state)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`{{GAME_NAME_FILE}}-${state.seed}-race-${state.raceIndex}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('Save download requested. Check your downloads folder.');}
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw Error('unavailable');}catch(_){notify('Fullscreen was not available. The framed game still fits this window.',true);}header();if(modalKind==='settings'&&$('modal').open)renderModal();}
  function setSpeed(n){prefs.speed=n;persistPrefs();if(screen==='race')document.querySelectorAll('[data-action="speed"]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.id)===n)));}
  document.addEventListener('click',event=>{
    const b=event.target.closest('button[data-action]');if(!b||b.disabled)return;
    const a=b.dataset.action,id=b.dataset.id;
    try{
      switch(a){
        case 'new':askNew(freshSeed());break;
        case 'seed':{const raw=$('seed-input').value.trim();if(!/^\d+$/.test(raw)||Number(raw)>4294967295)throw Error('Seed must be an integer from 0 to 4294967295.');askNew(Number(raw));break;}
        case 'continue-title':if(hasRun)changeScreen(state.phase==='garage'?'garage':'result');break;
        case 'menu':changeScreen('title');notify('Run saved. Continue whenever you are ready.');break;
        case 'records':changeScreen('records');break;
        case 'settings':openModal('settings');break;
        case 'visual-lab':if(DEV_MODE)openModal('visual-lab');break;
        case 'environment-lab':if(ENV_LAB)openModal('environment-lab');break;
        case 'event-motion-lab':if(DEV_MODE)openModal('event-motion-lab');break;
        case 'help':openModal('help');break;
        case 'breakdown':openModal('breakdown');break;
        case 'result-tab':if(screen==='result'&&['finish','details'].includes(id)){resultTab=id;render(false);const tab=document.querySelector(`[data-action="result-tab"][data-id="${id}"]`);if(tab)tab.focus();}break;
        case 'close-modal':$('modal').close();break;
        case 'confirm-cancel':pendingConfirm=null;$('confirm-modal').close();break;
        case 'confirm-ok':{const f=pendingConfirm;pendingConfirm=null;$('confirm-modal').close();if(f)f();break;}
        case 'shop':if(screen==='garage'){shopFilter='all';openModal('shop');}break;
        case 'filter-shop':if(['all',...D.SLOTS].includes(id)){shopFilter=id;renderModal();$('modal').querySelector(`[data-action="filter-shop"][data-id="${id}"]`).focus();}break;
        case 'refresh-shop': {
          if(screen!=='garage'||modalKind!=='shop')return;
          const quote=E.shopRefreshQuote(state);
          if(!quote.affordable)throw Error('That shop refresh is not available or affordable.');
          ask('PAY TO REFRESH STOCK?',`<p>Spend <b>£${money(quote.cost)}</b> to replace the current shop offers?</p><p>There is no guarantee of a better or higher-level part. Refreshing does not use your build action, and this is the only refresh allowed before the next race.</p>`,()=>{
            const next=E.refreshShop(state);
            shopFilter='all';mutate(next,`Workshop refreshed for £${money(quote.cost)}. These offers remain until your next purchase or refresh.`);
            renderModal();$('modal').querySelector('[data-action="refresh-shop"]').focus();
          },'PAY & REFRESH');break;
        }
        case 'buy':buyConfirmation(id);break;
        case 'upgrade-part':if(screen==='garage')upgradeConfirmation(id);break;
        case 'repair':{const q=E.repairQuote(state,id);mutate(E.repair(state,id),`${P.pretty(id)} repaired +${q.amount} for ${q.cost} wrenches.`);const replacement=document.querySelector(`[data-action="repair"][data-id="${id}"]`);if(replacement&&!replacement.disabled)replacement.focus();else $('screen').focus();break;}
        case 'approach':mutate(E.setApproach(state,id),D.APPROACHES[id].note);document.querySelector(`[data-action="approach"][data-id="${id}"]`).focus();break;
        case 'race':{if(screen!=='garage')return;const broken=['engine','tyres'].filter(slot=>state.durability[slot]===0);if(broken.length&&!startConfirmed){const strike=Math.min(3,(state.noStartStrikes||0)+1);ask('THIS CAR WILL NOT START',`<p><b>${broken.map(slot=>P.pretty(slot).toUpperCase()).join(' + ')}</b> ${broken.length>1?'are':'is'} at 0%. Racing now is an automatic 5th with no rewards and costs a strike.</p><p>This would be strike <b>${strike} of 3</b>${strike>=3?' and <b>ends the run</b>':''}. Repair or replace the part first.</p>`,()=>{startConfirmed=true;document.querySelector('[data-action="race"]')?.click();},'RACE ANYWAY');break;}startConfirmed=false;const before=state,next=E.race(before,{});raceBefore=before;raceChoices={};state=next;hasRun=true;persist();if(next.history.at(-1)?.noStart){replay=null;raceBefore=null;updateRecords();persist();resultTab='finish';screen='result';render();notify(next.finished?'Three no-starts: run over. Fifth place, zero rewards.':`No start: engine or tyres broken. Fifth place, zero rewards, strike ${next.noStartStrikes}/3.`);break;}replay=paceShortcutReplay(P.createReplay(before,next),raceChoices);lastRaceDisplay='';screen='race';render();notify('Build committed. Route choices can change the result; Skip leaves unresolved choices on the safe route.');break;}
        case 'event-choice':{
          if(!replay||!raceBefore)return;const f=P.frame(replay,replay.elapsed),choice=f.step.choice;if(!choice||Object.hasOwn(raceChoices,choice.key)||!['safe','risk'].includes(id))return;
          const elapsedInScene=f.local*f.step.duration,sceneId=f.step.id;raceChoices[choice.key]=id;const next=E.race(raceBefore,raceChoices);state=next;persist();replay=paceShortcutReplay(P.createReplay(raceBefore,next),raceChoices);replay.elapsed=window.ScrapEventTiming.reanchorScene(replay,sceneId,elapsedInScene);replay.paused=false;lastRaceDisplay='';lastTick=null;updateRace();notify(id==='risk'?'Risky route committed. Whatever happens next was technically your idea.':'Safe route chosen. Sensible behaviour has been documented.');break;
        }
        case 'pause':if(replay){const f=P.frame(replay,replay.elapsed);if(f.step.choice&&!Object.hasOwn(raceChoices,f.step.choice.key)){notify('Choose a route before continuing.',true);return;}replay.paused=!replay.paused;updateRace();}break;
        case 'next-phase':if(replay){const f=P.frame(replay,replay.elapsed);if(f.step.choice&&!Object.hasOwn(raceChoices,f.step.choice.key)){notify('Choose a route before continuing.',true);return;}replay.elapsed=P.nextTime(replay,replay.elapsed);if(replay.elapsed>=replay.total)showResult();else updateRace();}break;
        case 'skip':if(screen==='race')showResult();break;
        case 'speed':if([1,2,3,4].includes(Number(id)))setSpeed(Number(id));break;
        case 'continue':state=E.continueRun(state);persist();changeScreen('garage');notify('New shop stock and your build action is available again.');break;
        case 'replay-seed':askNew(state.seed);break;
        case 'export':if(hasRun)downloadSave();break;
        case 'import':$('save-file').click();break;
        case 'fullscreen':fullscreen();break;
      }
    }catch(error){notify(error.message||'That action could not be completed.',true);}
  });
  $('modal').addEventListener('close',()=>{const wasLab=DEV_MODE&&modalKind==='visual-lab';if(DEV_MODE)window.ScrapVisualLab.dispose();if(ENV_LAB)window.ScrapEnvironmentLab.dispose();if(DEV_MODE)window.ScrapEventMotionLab?.dispose();$('modal').classList.remove('visual-lab-dialog','environment-lab-dialog');modalKind=null;if(wasLab){if(screen==='garage')paintStatic('garage');else if(screen==='race')renderer=window.ScrapScene.create($('race-canvas'),rendererPreferences());}if(replay){replay.paused=resumePause;lastTick=null;updateRace();}if(returnFocus?.isConnected&&!returnFocus.disabled)returnFocus.focus();else $('screen').focus({preventScroll:true});returnFocus=null;});
  $('confirm-modal').addEventListener('cancel',()=>{pendingConfirm=null;});
  document.addEventListener('change',e=>{
    if(e.target.id==='setting-speed')prefs.speed=Number(e.target.value);
    else if(e.target.id==='setting-motion')prefs.motion=e.target.checked;
    else if(e.target.id==='setting-autoplay')prefs.autoplay=e.target.checked;
    else return;
    prefs=normalizeSettings(prefs);persistPrefs();if(screen==='race'){document.querySelectorAll('[data-action="speed"]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.id)===prefs.speed)));updateRace();}
  });
  $('save-file').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>400000)throw Error('Save exceeds 400 KB.');const loaded=E.decodeSave(await file.text());ask('IMPORT THIS RUN?',`<p>Seed <b>${loaded.seed}</b>, ${survived(loaded)} completed races, ${money(loaded.points)} points.</p><p>This replaces the run in this experimental build only. Other builds and their saves are untouched.</p>`,()=>{state=loaded;hasRun=true;blocked=false;replay=null;updateRecords();persist();changeScreen(state.phase==='garage'?'garage':'result');notify('Compatible run imported.');},'IMPORT RUN');}
    catch(error){notify(error.message||'Unable to import this save.',true);}
    finally{e.target.value='';}
  });
  document.addEventListener('keydown',e=>{
    const editing=e.target.matches('input,select,textarea');
    if(e.key==='Escape'&&!$('modal').open&&!$('confirm-modal').open){e.preventDefault();openModal('settings');return;}
    if(editing||$('confirm-modal').open)return;
    if(e.key.toLowerCase()==='f'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();fullscreen();}
    else if(e.code==='Space'&&screen==='race'&&!$('modal').open&&!e.target.closest('button')){e.preventDefault();replay.paused=!replay.paused;updateRace();}
  });
  document.addEventListener('visibilitychange',()=>{lastTick=null;});
  document.addEventListener('fullscreenchange',header);
  window.addEventListener('beforeunload',()=>{stopRenderer();if(DEV_MODE)window.ScrapVisualLab.dispose();if(ENV_LAB)window.ScrapEnvironmentLab.dispose();});
  render(false);notify(blocked?'A previous save could not be read. It has not been overwritten. Use Options to import or start a new run.':'Your decisions in the garage. The consequences on the track.',blocked);
})();


