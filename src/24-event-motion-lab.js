/* DEV-only event stage: preview modular effect timelines on the REAL race scene. */
(function(){
 'use strict';
 if(!window.SCRAP_PRIX_DEV_MODE||!window.ScrapEventMotion||!window.ScrapEventEffects||!window.ScrapEventEnergy||!window.ScrapEventPortals||!window.ScrapEventGhosts||!window.ScrapEventClones||!window.ScrapEventTiming)return;
 const MOVIE=window.ScrapTransformCinematics,STAGES=window.ScrapEventMultistage;
 const TIMING=window.ScrapEventTiming, M=window.ScrapEventMotion, FX=window.ScrapEventEffects, ENERGY=window.ScrapEventEnergy, PORTAL=window.ScrapEventPortals, GHOST=window.ScrapEventGhosts,CLONE=window.ScrapEventClones;
 const catalogue=window.ScrapData;
 const allSpecials=Object.freeze(Object.fromEntries((catalogue.PASS_EVENTS||[]).filter(e=>e.motion!=='shortcut').map(e=>[e.visual,e.id])));
 const allFakes=Object.freeze(Object.fromEntries((catalogue.FAKE_PASS_EVENTS||[]).map(e=>[e.visual,e.id])));
 const legacyPreview=Object.freeze(Object.fromEntries([...catalogue.PASS_EVENTS.filter(e=>e.motion!=='shortcut'),...catalogue.FAKE_PASS_EVENTS].map(e=>[e.visual,Object.freeze({id:e.visual,family:allFakes[e.visual]?'fake':'special',duration:1000})])));
 // v0.7.23 QA extension: previously the studio showed curated motion recipes,
 // not the entire existing race catalogue. Include the older inline-rendered
 // events as PREVIEWS ONLY; this neither changes how races choose events nor
 // changes the shipped PLAY build. A legacy visual uses the normal event clock.
 const catalogEntries=[
  ...catalogue.SIGNATURES.map(e=>({...e,category:'Classic'})),
  ...catalogue.WILDCARDS.map(e=>({...e,category:'Classic'})),
  ...catalogue.ANOMALIES.flatMap(e=>e.stages?.length?
    e.stages.map((stage,i)=>({...e,...stage,title:`${e.title} · ${i+1}/${e.stages.length}`,category:'Anomaly'})):
    [{...e,category:'Anomaly'}]),
  ...catalogue.PASS_EVENTS.map(e=>({...e,category:'Overtake'})),
  ...catalogue.FAKE_PASS_EVENTS.map(e=>({...e,category:'Fake Pass'}))
 ];
 const cataloguePreview=Object.freeze(Object.fromEntries(catalogEntries.filter(e=>e.visual)
  .map(e=>[e.visual,Object.freeze({id:e.visual,family:'legacy',duration:3400})])));
 const configuration=id=>STAGES?.recipe(id)||M.recipe(id)||FX.recipe(id)||ENERGY.recipe(id)||PORTAL.recipe(id)||GHOST.recipe(id)||CLONE.recipe(id)||MOVIE?.recipe(id)||legacyPreview[id]||cataloguePreview[id]||null;
 const pose=(id,ms,opt)=>STAGES?.recipe(id)?STAGES.sample(id,ms,opt):M.recipe(id)?M.sample(id,ms,opt):FX.recipe(id)?FX.sample(id,ms,opt):ENERGY.recipe(id)?ENERGY.sample(id,ms,opt):PORTAL.recipe(id)?PORTAL.sample(id,ms,opt):GHOST.recipe(id)?GHOST.sample(id,ms,opt):CLONE.recipe(id)?CLONE.sample(id,ms,opt):MOVIE?.recipe(id)?MOVIE.sample(id,ms,opt):({stage:TIMING.sample(id,ms)?.label||'overtake'});
 const baselineChoices=[
  ['transformation','Mid-Race Transformation (same car)','Cinematic','Flash, side-view film, dramatic unchanged reveal, launch and camera return'],
  ['transform-rocketcar','Rocket Car Transformation','Cinematic','Rocket ignition, transformation to bespoke gag form and launch'],
  ['transform-fossil','Mechanical Fossil Transformation','Cinematic','Mechanical dinosaur unfurls, roars, and accelerates away'],
  ['transform-icecream','Ice Cream Van Transformation','Cinematic','Silly sweetness, reveal, giant sugar-rush departure'],
  // Extra DEV-ONLY films use the existing 17 exact gag recipes. They do not
  // become random race events or grant effects / unlocks in PLAY.
  ...(window.ScrapVehicleCombos?.RECIPES||[]).filter(r=>!['rocketcar','fossil','icecream'].includes(r.id))
    .map(r=>['transform-'+r.id,r.name+' Reveal Rehearsal','Cinematic','DEV ONLY: source car, exact-recipe bespoke reveal, launch and camera return']),
  ['storm-1','Storm Front I · Warning','Multistage','Darkening horizon and distant approaching storm'],
  ['storm-2','Storm Front II · Arrival','Multistage','First hard rain, stronger cloud wall and crosswind'],
  ['storm-3','Storm Front III · Lightning','Multistage','Violent storm with a deterministic lightning hit'],
  ['tremor-1','Tremors I · Pebbles','Multistage','Small stones jump along the projected road'],
  ['tremor-2','Tremors II · Cracks','Multistage','Visible cracks form and expand in road perspective'],
  ['tremor-3','Tremors III · Collapse','Multistage','Road slabs break away around a jagged chasm'],
  ['crack-ice-1','Cracking Ice I · Hairlines','Multistage','Frozen road develops shallow branching fractures'],
  ['crack-ice-2','Cracking Ice II · Plates','Multistage','Whole ice sheets begin separating'],
  ['crack-ice-3','Cracking Ice III · Open Water','Multistage','A dark water gap opens in the frozen roadway'],
  ['lab-1','Instability I · Alarm','Multistage','Test facility warning lights illuminate'],
  ['lab-2','Instability II · Sparks','Multistage','Containment coil flashes with uncontrolled sparks'],
  ['lab-3','Instability III · Failure','Multistage','Explosive breakthrough, heat and shockwave'],
  ['lab-4','Instability IV · Silence','Multistage','Everything stops, leaving only residue and dead machinery'],
  ['deja-vu-1','Déjà Vu I · The Tree','Multistage','Distinctive forked tree and an almost hidden stranger'],
  ['deja-vu-2','Déjà Vu II · Again','Multistage','The same landmark returns; someone is closer'],
  ['deja-vu-3','Déjà Vu III · Watching','Multistage','The stranger no longer tries to hide'],
  ['deja-vu-4','Déjà Vu IV · Waiting','Multistage','Final-encounter only: the watcher lunges towards the camera'],
  ['lights-1','Suspicious Lights I · A Dot','Multistage','An impossible distant pinpoint follows the road'],
  ['lights-2','Suspicious Lights II · Formation','Multistage','Lights dance in a shifting unnatural formation'],
  ['lights-3','Suspicious Lights III · Craft','Multistage','Low hovering craft resolves from the lights'],
  ['lights-4','Suspicious Lights IV · Encounter','Multistage','A full silent saucer approaches, illuminates the road and vanishes'],
  ['mountain-1','The Mountain Moved I · Breath','Multistage','The distant rocky outline subtly expands and contracts'],
  ['mountain-2','The Mountain Moved II · Eyes','Multistage','The supposed mountain reveals a face and moves'],
  ['mountain-3','The Mountain Moved III · Rise','Multistage','A colossal creature stands, with legs unfolding behind the skyline'],
  ['clone-fake','The Clone Was Better','Clone','An inferior duplicate is passed, then a superior clone surges ahead'],
  ['mirror-fake','Mirror Rival','Clone','Reflective glass peels off a mirrored twin, which merges back into the rival ahead'],
  ['ghost-fake','Ghost Car Overtake','Ghost','Pass a spectral duplicate, then discover the real rival never left the lead'],
  ['possessed-fake','Possessed Rival','Ghost','A real modular rival twitches, lights up and claws back ahead'],
  ['shadow-pass','Shadow Takes the Rival','Ghost','A ground shadow grows arms and drags an earned-pass rival sideways'],
  ['teleporter','Experimental Teleporter','Portal','Mechanical arch, ionised entry, exit flash, car disappearance and return'],
  ['wormhole','Wormhole Shortcut','Portal','Violet spacetime vortex and a distinct exit portal'],
  ['haunted-road','Haunted Shortcut','Portal','Crooked cemetery branch with physical road fork, ghost lamps, grave markers and camera-follow return'],
  ['lightning-pass','Direct Hit!','Energy','Bolt telegraphs the real rival; impact and smoke before the rival swerves'],
  ['beam','Beam Across the Horizon','Energy','Warm charge, enormous distant beam and expanding blast ring'],
  ['slash-pass','Impossible Slash','Energy','A unique diagonal arc, delayed cut in the road and rival reaction'],
  ['mini-sun','Miniature Sun Experiment','Energy','A tiny laboratory star swells into a dangerous bright sphere'],
  ['sun-gaze',"Ra's Gaze",'Energy','Solar disc focuses its energy into a hot ray over the track'],
  ['lab-2','Containment Warning','Energy','Alarm lamps and erratic sparks around the test facility'],
  ['lab-3','Containment Failure','Energy','A burst from the test facility, followed by smoke and shockwave'],
  ['aura','True Potential','Energy','Restrained power aura around the racing line'],
  ['ducks','Duck Crossing','Crossing','Waddling flock with a late straggler and proper road-space depth'],
  ['deer','Deer Crossing','Crossing','Leaping deer with antlers and springing legs'],
  ['cow','Cow in the Road','Crossing','Chews, holds the middle of the road and ignores the horn'],
  ['sheep','Sheep Stampede','Crossing','Bouncy woolly herd at staggered depths'],
  ['goose-pass','Goose Panic','Crossing','Wings out, furious charge, rival panics'],
  ['boar-pass','Boar Charge','Crossing','Tusks, dust and very poor road etiquette'],
  ['bull-pass','Bull Run','Crossing','Heavy hooves, horns and charging silhouette'],
  ['duck-pass','Duck Passing Variant','Crossing','A last-minute duck detour'],
  ['meteor','Meteoric Near Miss','Falling','Road warning, depth-aware fireball, crater, sparks and fading shockwave'],
  ['meteor-pass','Meteor Passing Variant','Falling','Meteor falls alongside actual rival; delayed evasive swerve and dust'],
  ['foot-pass','Giant Footstep','Falling','Growing shadow, colossal boot, impact, delayed rival escape and boot withdrawal'],
  ['spring-trap','Spring Trap','Launching','Road hatch tension, coil release, airborne rival and falling bolt'],
  ['trebuchet-pass','Trebuchet Accuracy','Launching','Working wooden siege engine, swinging arm, flying stone and road impact'],
  ['tornado-pass','Tornado Touchdown','Lifting','Funnel arrives, wheels struggle, rival spirals upwards, dust settles'],
  ['ufo-pass','UFO Abduction','Lifting','Saucer locks on, rival fights the beam, then ascends'],
  ['tentacle-pass','Tentacle Grab','Lifting','Searching tentacle coils around the rival, then whips it away'],
  ['crab-pass','Crab Claw','Lifting','Enormous claw lines up, pincers clamp, then yank sideways'],
  ['ramp','Suspicious Ramp','Route','Jump ramp with yellow hazard paint, braced approach and perspective movement'],
  ['bridge','Broken Bridge Jump','Route','Open bridge gap, snapped rails and dangling timber'],
  ['wreckage-shortcut','Wreckage Shortcut','Shortcut','Long right detour around wrecks, then a gradual merge'],
  ['overgrown-shortcut','Overgrown Shortcut','Shortcut','Left fork to a parallel overgrown service track'],
  ['flooded-shortcut','Flooded Shortcut','Shortcut','Right fork through a shallow parallel flooded route'],
  ['dune-shortcut','Dune Shortcut','Shortcut','Left sandy cut-through with a visible lengthy parallel stretch'],
  ['frozen-lake-shortcut','Frozen Lake Shortcut','Shortcut','Right side road out onto a frozen lake then rejoining'],
  ['crater','Crater Where Road Used to Be','Destruction','Fractured crater rim, deep centre and radiating cracks'],
  ['tremor-1','Tremors I','Destruction','Pebbles hop on the roadway'],
  ['tremor-2','Tremors II','Destruction','Branching fault lines crack the road'],
  ['tremor-3','Tremors III','Destruction','Road slabs split, sink and raise dust'],
  ['cargo','Cargo Spill','Obstacle','Crates and drums strewn across the racing line'],
  ['pileup','Massive Pile-up','Obstacle','Distinct wrecked cars in road-space perspective'],
  ['grass','Long Grass','Obstacle','Overgrown lanes with moving grass blades'],
  ['roadworks','Roadworks','Obstacle','Cones, barricade, and a sign narrowing the roadway'],
  ['debris','Flying Spare Parts','Obstacle','Loose metal, wheels, and smaller animated scraps'],
  ['bins','Urban Chicane','Obstacle','Wayward wheelie bins across an improvised chicane'],
  ['gravel','Loose Gravel','Obstacle','Scattered pebbles and road grit'],
  ['clearline','Lucky Gap','Obstacle','Cones and scraps split aside to reveal an open lane'],
  ['delivery','Sponsor Delivery','Obstacle','Parcels and a sign from a misaddressed shipment'],
  ['downpour','Torrential Downpour','Weather','Depth-layered slant rain, road sheen, little splashes'],
  ['fog','Dense Fog Bank','Weather','Rolling banks, stronger in distance than near cars'],
  ['heatwave','Freak Heatwave','Weather','Soft heat ripples and warm colour accents'],
  ['crosswind','Crosswind Blast','Weather','Visible sideways gusts carrying dust'],
  ['hail','Hailstorm','Weather','Falling ice grains with ground rebounds'],
  ['storm-1','Storm Front I','Weather','A dark ceiling approaches the race'],
  ['storm-2','Storm Front II','Weather','Clouds thicken and rain begins'],
  ['storm-3','Storm Front III','Weather','Full storm with rain and distant lightning from the energy module'],
  ['oil','Oil Spill','Surface','Irregular black slick with oily highlights'],
  ['flood','Flash Flood','Surface','Shallow road water, reflections and rare fish gag'],
  ['ice','Black Ice','Surface','Subtle frozen strip and little glints'],
  ['potholes','Pothole Chain','Surface','Perspective-correct holes with dark centres'],
  ['sand','Sand Drift','Surface','Bands of wind-blown sand across the road'],
  ['snow','Deep Snow','Surface','Roadway snow drifts and flurries']
 ];
 // Expose every supported pass, including the previously hidden plain/comedy
 // passes; the scene still uses the same production event renderer.
 const covered=new Set(baselineChoices.map(x=>x[0]));
 const extraChoices=[...catalogue.PASS_EVENTS.filter(x=>x.motion!=='shortcut'),...catalogue.FAKE_PASS_EVENTS]
  .filter(e=>!covered.has(e.visual))
  .map(e=>[e.visual,e.title,allFakes[e.visual]?'Fake Pass':'Overtake',e.text]);
 // Last-mile visual audit: expose all catalogue visuals, not just the ones
 // already converted into standalone cinematic modules. Existing curated cards
 // stay first; unlisted classic/anomaly events are added afterwards.
 const extraCatalogueChoices=catalogEntries.filter(e=>e.visual&&!covered.has(e.visual)&&!extraChoices.some(x=>x[0]===e.visual))
  .map(e=>[e.visual,e.title,e.category,e.text||'Existing in-race event illustration']);
 const choices=[...baselineChoices,...extraChoices,...extraCatalogueChoices]
  .filter((item,i,all)=>all.findIndex(x=>x[0]===item[0])===i);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 // DEV feedback lives with the catalogue, never inside run saves or gameplay.
 // Stable visual IDs mean individual multistage encounters receive separate reviews.
 const REVIEW_KEY='scrap-prix.dev.event-feedback.v1';
 const REVIEW_FORMAT='scrap-prix-event-feedback';
 const REVIEW_OPTIONS=Object.freeze([
  Object.freeze({id:'not-ready',label:'NOT READY',hint:'Needs a first proper art pass'}),
  Object.freeze({id:'rework',label:'REWORK',hint:'Concept or presentation needs rebuilding'}),
  Object.freeze({id:'polish',label:'POLISH',hint:'Promising, but needs improvement'}),
  Object.freeze({id:'good',label:'GOOD',hint:'Ready to show testers'}),
  Object.freeze({id:'standout',label:'STANDOUT',hint:'Memorable, keep this'})
 ]);
 const validReviewIds=new Set(choices.map(x=>x[0]));
 const validReviewRatings=new Set(REVIEW_OPTIONS.map(x=>x.id));
 const reviewOptionById=Object.fromEntries(REVIEW_OPTIONS.map(x=>[x.id,x]));
 const choiceById=Object.fromEntries(choices.map(x=>[x[0],x]));
 const cleanNote=note=>typeof note==='string'?note.slice(0,4000):'';
 function normalizeReviews(raw){
  // Accept the internal browser map or a versioned, user-exported JSON review list.
  const result=Object.create(null);
  const source=raw&&typeof raw==='object'?raw:null;
  if(!source)return result;
  const list=Array.isArray(source.reviews)?source.reviews.map(x=>[x?.eventId||x?.id,x]):Object.entries(source);
  for(const [id,record] of list){
   if(!validReviewIds.has(id)||!record||typeof record!=='object')continue;
   const rating=validReviewRatings.has(record.rating)?record.rating:null;
   const notes=cleanNote(record.notes);
   if(!rating&&!notes.trim())continue;
   const savedAt=typeof record.savedAt==='string'?record.savedAt.slice(0,40):'';
   const context=record.context&&typeof record.context==='object'&&!Array.isArray(record.context)?{
    backdrop:typeof record.context.backdrop==='string'?record.context.backdrop.slice(0,50):'city',
    variant:record.context.variant==='rare'?'rare':'normal',
    speed:[1,2,3,4].includes(record.context.speed)?record.context.speed:1,
    route:typeof record.context.route==='string'?record.context.route.slice(0,30):'risk',
    portal:typeof record.context.portal==='string'?record.context.portal.slice(0,30):'risk',
    outcome:record.context.outcome==='fail'?'fail':'success'
   }:null;
   result[id]={rating,notes,savedAt,context};
  }
  return result;
 }
 function createReviewExport(records,at=new Date().toISOString()){
  const normalized=normalizeReviews(records);
  const counts=Object.fromEntries(REVIEW_OPTIONS.map(x=>[x.id,0]));
  const reviews=[];
  for(const [eventId,name,category,description] of choices){
   const item=normalized[eventId];if(!item)continue;
   if(item.rating)counts[item.rating]++;
   reviews.push({eventId,name,category,description,rating:item.rating,notes:item.notes,savedAt:item.savedAt||null,context:item.context||null});
  }
  const reviewed=Object.values(counts).reduce((a,b)=>a+b,0);
  return {format:REVIEW_FORMAT,schemaVersion:1,build:'v0.7.23n',exportedAt:at,
   catalogueSize:choices.length,reviewed,unreviewed:choices.length-reviewed,counts,reviews};
 }
 function textReviewExport(records){
  const report=createReviewExport(records);
  const lines=[`{{GAME_NAME_UPPER}} EVENT VISUAL FEEDBACK / ${report.build}`,
   `Reviewed ${report.reviewed}/${report.catalogueSize} | Not ready ${report.counts['not-ready']} | Rework ${report.counts.rework} | Polish ${report.counts.polish} | Good ${report.counts.good} | Standout ${report.counts.standout}`,''];
  for(const review of report.reviews){
   lines.push(`[${review.rating?reviewOptionById[review.rating].label:'NOTE ONLY'}] ${review.name} (${review.eventId}) / ${review.category}`);
   if(review.notes)lines.push(review.notes);
   lines.push('');
  }
  return lines.join('\n');
 }

 const shortcutPassByVisual={'wreckage-shortcut':'wreckage-shortcut-pass','overgrown-shortcut':'overgrown-shortcut-pass','flooded-shortcut':'flooded-shortcut-pass','dune-shortcut':'dune-shortcut-pass','frozen-lake-shortcut':'frozen-lake-shortcut-pass'};
 const idByVisual={'lightning-pass':'lightning-strike','slash-pass':'impossible-sword','spring-trap':'spring-trap','tornado-pass':'tornado-touchdown','duck-pass':'duck-crossing','meteor-pass':'meteor-pass','goose-pass':'goose-panic','boar-pass':'boar-charge','bull-pass':'bull-run','foot-pass':'giant-footstep','trebuchet-pass':'trebuchet-pass','ufo-pass':'ufo-abduction','tentacle-pass':'tentacle-grab','crab-pass':'crab-claw'};
 let cleanup=null;
 function markup(){return `<section class="motion-lab">
  <div class="motion-banner"><span>DEV / EVENT MOTION LAB</span><div><h3>MAKE THE CHAOS MODULAR.</h3><p>Full catalogue inspection with shared motion timelines, older classic effects and side-camera transformation cutaways. Filters show every existing race-event visual, including rare anomalies.</p></div></div>
  <div class="motion-layout">
   <section class="motion-stage">
    <div class="motion-stage-head"><strong id="motion-scene-title">SPRING TRAP</strong><small id="motion-family">LAUNCHING / 1000 ms</small></div>
    <canvas id="motion-canvas" aria-label="Event animation preview on {{GAME_NAME}}'s race track"></canvas>
    <div class="motion-timeline"><label for="motion-timeline-slider">FRAME / TIMELINE</label><input id="motion-timeline-slider" type="range" min="0" max="1000" step="10" value="0"><output id="motion-time-value">0 / 1000 ms</output></div>
    <section class="motion-beat-editor" id="motion-beat-editor" hidden aria-label="Event timing beat editor">
      <div class="motion-beat-heading"><strong>FAMILY TIMING / FIVE BEATS</strong><button type="button" data-motion-action="beats-reset">RESTORE DEFAULTS</button></div>
      <div id="motion-beat-sliders"></div>
      <p class="motion-beat-note">Development preview only. Changing these sliders does not modify race saves, scoring or the shipped timing presets.</p>
    </section>
    <div class="motion-buttons"><label>PREVIEW SPEED <select id="motion-preview-speed"><option value="1">1×</option><option value="2">2×</option><option value="3">3×</option><option value="4">4×</option></select></label><button data-motion-action="play">▶ PLAY</button><button data-motion-action="reset">↺ RESTART</button><button data-motion-action="stage-prev">◀ STAGE</button><button data-motion-action="stage-next">NEXT STAGE ▶</button><label><input type="checkbox" id="motion-rare"> RARE VARIANT</label><label><input type="checkbox" id="motion-reduced"> REDUCED MOTION</label><label>ROUTE <select id="motion-shortcut-mode"><option value="risk">CHOICE: TAKE SHORTCUT</option><option value="safe">CHOICE: STAY ON ROAD</option><option value="preview">FORK ONLY</option><option value="forced">FORCED DETOUR</option><option value="pass">GAG OVERTAKE</option></select></label><label>PORTAL <select id="motion-portal-mode"><option value="risk">ENTER PORTAL</option><option value="safe">STAY ON ROAD</option><option value="preview">OFFER ONLY</option></select></label><label>RESULT <select id="motion-portal-outcome"><option value="success">SUCCESS</option><option value="fail">FAILED EXIT</option></select></label></div>
    <section class="motion-feedback" aria-label="Feedback for selected event">
      <div class="motion-feedback-header"><div><span>EVENT FEEDBACK</span><strong id="motion-feedback-title">STORM FRONT I</strong></div><small id="motion-feedback-count">0 / ${choices.length} REVIEWED</small></div>
      <p class="motion-feedback-intro">Vote once per preview. <b>NOT READY</b> is for placeholders that need a first art pass, not a bad score. Notes save as you type.</p>
      <div class="motion-feedback-votes" role="group" aria-label="Rate the current event visual">
       ${REVIEW_OPTIONS.map(o=>`<button type="button" data-review-vote="${o.id}" aria-pressed="false" title="${esc(o.hint)}"><span>${esc(o.label)}</span><small>${esc(o.hint)}</small></button>`).join('')}
      </div>
      <label class="motion-feedback-notes-label" for="motion-feedback-notes">WHAT SHOULD WE CHANGE?</label>
      <textarea id="motion-feedback-notes" rows="2" maxlength="4000" placeholder="e.g. Creature looks like a grey blob; give it a distinct silhouette and a stronger entrance."></textarea>
      <div class="motion-feedback-actions"><button type="button" data-review-action="next">NEXT UNREVIEWED ▶</button><button type="button" data-review-action="clear">CLEAR THIS VOTE</button><button type="button" data-review-action="export">⬇ EXPORT FEEDBACK JSON</button><button type="button" data-review-action="copy">COPY REPORT</button><button type="button" data-review-action="import">IMPORT JSON</button></div>
      <input id="motion-feedback-import" type="file" accept=".json,application/json" hidden>
      <div class="motion-feedback-bottom"><small id="motion-feedback-save" role="status" aria-live="polite">Saved locally in this browser. Export a JSON backup before changing devices or folders.</small><small>Nothing is sent to ChatGPT automatically. Upload the exported JSON here for review.</small></div>
    </section>
    <p class="motion-hint">v0.7.22: family timing presets drive visuals and rival positions together. Fake overtakes never award a position; Shadow Takes the Rival only appears after the race earns a real pass. Preview, enter, decline and compare failure results. Scrubbing, slow motion and reduced-motion previews never change gameplay.</p>
   </section>
   <aside class="motion-choices"><h4>VISUAL MOTION RECIPES</h4>
   <div class="motion-family-tabs" role="group" aria-label="Filter animation families">
   ${['All','Cinematic','Clone','Ghost','Multistage','Portal','Crossing','Falling','Launching','Lifting','Weather','Surface','Obstacle','Route','Shortcut','Destruction','Energy','Overtake','Fake Pass','Classic','Anomaly'].map(f=>`<button type="button" data-motion-filter="${f.toLowerCase()}" aria-pressed="${f==='All'}">${f}</button>`).join('')}
   </div>
   <label class="motion-review-filter-label" for="motion-review-filter">REVIEW STATUS</label><select id="motion-review-filter"><option value="all">ALL EVENTS</option><option value="unreviewed">UNREVIEWED ONLY</option>${REVIEW_OPTIONS.map(o=>`<option value="${o.id}">${esc(o.label)}</option>`).join('')}</select>
   ${choices.map(([id,label,family,description],i)=>`<button data-motion-id="${id}" data-motion-category="${family.toLowerCase()}" aria-pressed="${id==='teleporter'}"><span>${esc(label)}</span><em>${esc(family)} · ${esc(description)}</em><small data-review-indicator>UNREVIEWED</small></button>`).join('')}
   <label><input type="checkbox" id="motion-auto-backdrop" checked> AUTO-MATCH EVENT BACKDROP</label><label for="motion-environment">BACKDROP (MANUAL OVERRIDE)</label><select id="motion-environment"><option value="city">City</option><option value="desert">Desert</option><option value="forest">Forest</option><option value="snow">Snow</option><option value="ice">Ice</option><option value="junkyard">Junkyard</option><option value="moon">Moon</option><option value="beach">Beach</option><option value="jungle">Jungle</option><option value="prehistoric">Prehistoric</option><option value="space">Space</option></select>
   <div class="motion-system-note"><strong>FULL CATALOGUE / ${new Set(catalogEntries.map(e=>e.visual)).size} VISUALS</strong><p>All established race-event visuals are now selectable, including older inline effects under CLASSIC and ANOMALY. Previewing never changes odds, outcomes or standings. Unconverted effects keep their earlier artwork.</p></div>
   </aside>
  </div>
 </section>`;}
 function mount(root,loadout){
  if(cleanup){cleanup();cleanup=null;}
  const c=root.querySelector('#motion-canvas');if(!c)return;
  const scene=window.ScrapScene.create(c,{style:'chunky',camera:'rear',comboBodywork:true});
  const abort=new AbortController(),signal=abort.signal;
  let id='storm-1',elapsed=0,playing=false,rare=false,reduced=false,env='city',autoBackdrop=true,familyFilter='all',reviewFilter='all',shortcutMode='risk',portalMode='risk',portalOutcome='success',raf=0,last=0,previewSpeed=1;
  const customBeats=Object.create(null);
  const $=sel=>root.querySelector(sel);
  let reviews=Object.create(null),canPersist=true;
  try{reviews=normalizeReviews(JSON.parse(localStorage.getItem(REVIEW_KEY)||'{}'));}catch(err){
   canPersist=false;console.warn('Event feedback could not load browser storage',err);
  }
  function announce(message){$('#motion-feedback-save').textContent=message;}
  function persistReviews(){
   try{localStorage.setItem(REVIEW_KEY,JSON.stringify(reviews));canPersist=true;return true;}
   catch(err){canPersist=false;announce('Browser storage unavailable. EXPORT your feedback JSON before closing this window.');return false;}
  }
  function reviewContext(){return {backdrop:env,variant:rare?'rare':'normal',speed:previewSpeed,route:shortcutMode,portal:portalMode,outcome:portalOutcome};}
  function updateReviewUI(){
   const entry=reviews[id]||{},exported=createReviewExport(reviews);
   $('#motion-feedback-title').textContent=choiceById[id]?.[1]||id;
   $('#motion-feedback-count').textContent=`${exported.reviewed} / ${exported.catalogueSize} REVIEWED · ${exported.counts['not-ready']} NOT READY`;
   const textarea=$('#motion-feedback-notes');if(textarea.value!==(entry.notes||''))textarea.value=entry.notes||'';
   for(const button of root.querySelectorAll('[data-review-vote]'))button.setAttribute('aria-pressed',String(button.dataset.reviewVote===entry.rating));
   for(const button of root.querySelectorAll('[data-motion-id]')){
    const rating=reviews[button.dataset.motionId]?.rating||null;
    button.dataset.reviewRating=rating||'unreviewed';
    const marker=button.querySelector('[data-review-indicator]');if(marker)marker.textContent=rating?reviewOptionById[rating].label:'UNREVIEWED';
   }
  }
  function saveReview(patch){
   const previous=reviews[id]||{};
   const rating=Object.prototype.hasOwnProperty.call(patch,'rating')?patch.rating:previous.rating||null;
   const notes=Object.prototype.hasOwnProperty.call(patch,'notes')?cleanNote(patch.notes):previous.notes||'';
   if(!rating&&!notes.trim())delete reviews[id];
   else reviews[id]={rating,notes,savedAt:new Date().toISOString(),context:reviewContext()};
   const saved=persistReviews();updateReviewUI();
   if(saved)announce('Saved locally. Export JSON to share your feedback with ChatGPT.');
  }
  function exportFile(){
   const body=JSON.stringify(createReviewExport(reviews),null,2)+'\n';
   const blob=new Blob([body],{type:'application/json'}),url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download=`{{GAME_NAME_FILE}}-Event-Feedback-${new Date().toISOString().slice(0,10)}.json`;
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
   announce('Feedback JSON exported. Upload that file in our chat so I can read your votes.');
  }
  async function copyReport(){
   const report=textReviewExport(reviews);
   try{await navigator.clipboard.writeText(report);announce('Report copied. Paste it into our chat.');}
   catch(err){
    const textarea=document.createElement('textarea');textarea.value=report;textarea.setAttribute('readonly','');textarea.style.position='fixed';textarea.style.opacity='0';
    document.body.appendChild(textarea);textarea.select();const ok=document.execCommand('copy');textarea.remove();
    announce(ok?'Report copied. Paste it into our chat.':'Copy blocked. Use EXPORT FEEDBACK JSON instead.');
   }
  }
  const currentBeats=()=>customBeats[id]||null;
  const currentDuration=()=>TIMING.duration(id,currentBeats())||configuration(id).duration;
  function updateBeatControls(){
   const p=TIMING.profile(id),panel=$('#motion-beat-editor'),container=$('#motion-beat-sliders');
   if(!p){panel.hidden=true;return;}
   panel.hidden=false;
   const heading=panel.querySelector('.motion-beat-heading strong');
   if(heading)heading.textContent=`${p.formula==='bespoke'?'CUSTOM EVENT':'FAMILY: '+p.formula.toUpperCase()} / FIVE BEATS`;
   const beatValues=TIMING.beatsFor(id,currentBeats());
   if(container.dataset.forId!==id){
    container.dataset.forId=id;
    container.innerHTML=p.labels.map((label,i)=>`<label class="motion-beat-row"><span>${esc(label)}</span><input type="range" data-motion-beat="${i}" min="200" max="4000" step="50" value="${beatValues[i]}"><output data-motion-beat-output="${i}">${(beatValues[i]/1000).toFixed(2)}s</output></label>`).join('');
   }
   for(let i=0;i<p.beats.length;i++){
    const control=container.querySelector(`[data-motion-beat="${i}"]`);
    if(document.activeElement!==control)control.value=beatValues[i];
    container.querySelector(`[data-motion-beat-output="${i}"]`).textContent=(beatValues[i]/1000).toFixed(2)+'s';
   }
  }
  function render(){
   const cfg=configuration(id);if(!cfg||!scene)return;
   const duration=currentDuration();
   const mappedMs=TIMING.profile(id)?TIMING.mapTime(id,elapsed,currentBeats()):elapsed;
   const selected=allSpecials[id]||idByVisual[id]||(shortcutMode==='pass'?shortcutPassByVisual[id]:null),special=!!selected;
   const q=M.clamp(mappedMs/cfg.duration);
   const ghostFake=GHOST.recipe(id)?.role==='fake';
   const cloneFake=CLONE.recipe(id)?.role==='fake';
   const scriptedFake=allFakes[id]||null;
   const shadow=GHOST.recipe(id)?.role==='special';
   const overtakes=(ghostFake||cloneFake||scriptedFake)?{total:1,crossings:[.95],progress:.52+q*.30,
     fake:{id:scriptedFake,index:0,local:q}}:
     shadow?{total:1,crossings:[.95],progress:.82+q*.13,
       specialByIndex:{0:'shadow-pass'},special:{id:'shadow-pass',index:0,local:q}}:
     special?{total:1,crossings:[.93],progress:.80+q*.128,specialByIndex:{0:selected},special:{id:selected,index:0,local:q}}:null;
   const previewLoadout=MOVIE?.recipe(id)?MOVIE.loadoutFor(id,loadout):loadout;
   scene.drawRace({event:id,eventPhaseTime:mappedMs,eventVariant:rare?'rare':'normal',
     track:env,time:reduced?0:elapsed*2,motion:!reduced,loadout:previewLoadout,overtakes,
     environment:{preset:env},shortcutMode,portalMode,portalOutcome});
   $('#motion-scene-title').textContent=choices.find(c=>c[0]===id)?.[1].toUpperCase()||id.toUpperCase();
   const motionSample=pose(id,mappedMs,{variant:rare?'rare':'normal',motion:!reduced,mode:portalMode,outcome:portalOutcome});
   $('#motion-family').textContent=cfg.family.toUpperCase()+' / '+duration+' ms'+(TIMING.profile(id)?' / '+TIMING.sample(id,elapsed,currentBeats()).label.toUpperCase():motionSample?.stage?' / '+String(motionSample.beat||motionSample.stage).toUpperCase():'');
   $('#motion-timeline-slider').max=duration;
   $('#motion-timeline-slider').value=elapsed;
   $('#motion-time-value').textContent=`${Math.round(elapsed)} / ${duration} ms`;
   updateBeatControls();
   c.setAttribute('aria-label',`${id} animation at ${Math.round(elapsed)} milliseconds, ${env} backdrop`);
   for(const b of root.querySelectorAll('[data-motion-id]')){b.setAttribute('aria-pressed',String(b.dataset.motionId===id));const rating=reviews[b.dataset.motionId]?.rating||null;b.hidden=(familyFilter!=='all'&&b.dataset.motionCategory!==familyFilter)||(reviewFilter==='unreviewed'?!!rating:(reviewFilter!=='all'&&rating!==reviewFilter));}
   for(const b of root.querySelectorAll('[data-motion-filter]'))b.setAttribute('aria-pressed',String(b.dataset.motionFilter===familyFilter));
   root.querySelectorAll('[data-motion-action^="stage-"]').forEach(b=>{b.disabled=!STAGES?.recipe(id);});
   $('#motion-portal-mode').disabled=!PORTAL.recipe(id);
   $('#motion-portal-outcome').disabled=!PORTAL.recipe(id)||portalMode!=='risk';
   $('[data-motion-action="play"]').textContent=playing?'Ⅱ PAUSE':'▶ PLAY';
  }
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;playing=false;}
  function tick(t){if(!playing)return;if(last)elapsed=Math.min(currentDuration(),elapsed+Math.max(0,Math.min(80,t-last))*previewSpeed);last=t;
   render();if(elapsed>=currentDuration()){stop();render();return;}raf=requestAnimationFrame(tick);}
  function suggestedBackdrop(eventId){
  if(eventId.startsWith('crack-ice-'))return 'ice';
  if(eventId.startsWith('deja-vu-'))return 'forest';
  if(eventId.startsWith('lab-'))return 'junkyard';
  return 'city';
 }
 function choose(next){if(!configuration(next))return;stop();id=next;elapsed=0;
  if(autoBackdrop){env=suggestedBackdrop(id);$('#motion-environment').value=env;}
  render();updateReviewUI();}
  root.addEventListener('click',e=>{
   const vote=e.target.closest('[data-review-vote]');if(vote){saveReview({rating:vote.dataset.reviewVote});render();return;}
   const reviewAction=e.target.closest('[data-review-action]');
   if(reviewAction){
    const action=reviewAction.dataset.reviewAction;
    if(action==='clear'){saveReview({rating:null,notes:''});render();return;}
    if(action==='export'){exportFile();return;}
    if(action==='copy'){copyReport();return;}
    if(action==='import'){$('#motion-feedback-import').click();return;}
    if(action==='next'){
     const start=choices.findIndex(x=>x[0]===id);
     const next=Array.from({length:choices.length},(_,n)=>choices[(start+n+1)%choices.length]).find(x=>!reviews[x[0]]?.rating);
     if(!next){announce('All previews have ratings. Export your feedback or update earlier votes.');return;}
     reviewFilter='all';$('#motion-review-filter').value='all';familyFilter='all';choose(next[0]);return;
    }
   }
   const familyBtn=e.target.closest('[data-motion-filter]');if(familyBtn){familyFilter=familyBtn.dataset.motionFilter;render();return;}
   const chooseBtn=e.target.closest('[data-motion-id]');if(chooseBtn){choose(chooseBtn.dataset.motionId);return;}
   const b=e.target.closest('[data-motion-action]');if(!b)return;
   if(b.dataset.motionAction==='reset'){stop();elapsed=0;render();}
   if(b.dataset.motionAction==='stage-prev'||b.dataset.motionAction==='stage-next'){
    const chain=STAGES?.chainFor(id);if(chain){const ix=chain.indexOf(id),delta=b.dataset.motionAction==='stage-next'?1:-1;choose(chain[Math.max(0,Math.min(chain.length-1,ix+delta))]);}return;
   }
   if(b.dataset.motionAction==='beats-reset'){stop();delete customBeats[id];elapsed=0;render();}
   if(b.dataset.motionAction==='play'){
    if(playing)stop();else {if(elapsed>=currentDuration())elapsed=0;playing=true;raf=requestAnimationFrame(tick);}render();}
  },{signal});
  root.addEventListener('input',e=>{
   if(e.target.id==='motion-feedback-notes'){saveReview({notes:e.target.value});return;}
   if(e.target.id==='motion-timeline-slider'){stop();elapsed=Number(e.target.value);render();}
   if(e.target.hasAttribute('data-motion-beat')){
    stop();const before=currentDuration(),ratio=elapsed/before;
    const values=TIMING.beatsFor(id,currentBeats());values[Number(e.target.dataset.motionBeat)]=Number(e.target.value);
    customBeats[id]=values;elapsed=Math.round(ratio*currentDuration());render();
   }
  },{signal});
  root.addEventListener('change',async e=>{
   if(e.target.id==='motion-feedback-import'){
    const file=e.target.files?.[0];if(!file)return;
    try{
     if(file.size>2_000_000)throw Error('File exceeds 2 MB');
     const incoming=JSON.parse(await file.text());
     if(incoming.format!==REVIEW_FORMAT||incoming.schemaVersion!==1||!Array.isArray(incoming.reviews))throw Error('Not a {{GAME_NAME}} event-feedback export');
     const imported=normalizeReviews(incoming);
     Object.assign(reviews,imported);persistReviews();updateReviewUI();render();
     announce(`Imported ${Object.keys(imported).length} event reviews. Export JSON again after changes.`);
    }catch(err){announce('Import failed: '+String(err.message||err).slice(0,120));}
    e.target.value='';return;
   }
   if(e.target.id==='motion-review-filter'){reviewFilter=e.target.value;render();return;}
   if(e.target.id==='motion-environment'){env=e.target.value;autoBackdrop=false;$('#motion-auto-backdrop').checked=false;}
   if(e.target.id==='motion-auto-backdrop'){autoBackdrop=e.target.checked;if(autoBackdrop){env=suggestedBackdrop(id);$('#motion-environment').value=env;}}
   if(e.target.id==='motion-preview-speed')previewSpeed=Number(e.target.value);
   if(e.target.id==='motion-rare')rare=e.target.checked;
   if(e.target.id==='motion-reduced')reduced=e.target.checked;
   if(e.target.id==='motion-shortcut-mode')shortcutMode=e.target.value;
   if(e.target.id==='motion-portal-mode')portalMode=e.target.value;
   if(e.target.id==='motion-portal-outcome')portalOutcome=e.target.value;
   render();
  },{signal});
  render();updateReviewUI();if(!persistReviews())announce('Browser storage unavailable. Export your feedback JSON before closing this window.');cleanup=()=>{stop();abort.abort();};
 }
 function dispose(){if(cleanup){cleanup();cleanup=null;}}
 window.ScrapEventMotionLab=Object.freeze({markup,mount,dispose,feedbackTools:Object.freeze({normalizeReviews,createReviewExport,textReviewExport,reviewKey:REVIEW_KEY})});
})();
