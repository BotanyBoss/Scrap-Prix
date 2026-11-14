/* Reproducible real race source. Not a visual-only fabricated scenario. */
(function(root){
 'use strict';
 function load(seed=18){
  if(seed!==18)throw Error('The reviewed fixture is seed 18.');
  const E=root.ScrapEngine;
  const before=E.newRun(seed),after=E.race(before,{});
  const manifest=root.ScrapRaceManifest.fromResolvedRace(before,after);
  const replay=root.ScrapEventTiming.prepareReplay(root.ScrapPresentation.createReplay(before,after),E);
  const storyboard=root.ScrapOrdinaryTimeline.plan(manifest,replay,{});
  const matching=storyboard.shots.filter(s=>s.debris&&s.source?.id==='debris');
  if(matching.length!==3||
     matching.map(s=>s.family).join(',')!=='approach,event,consequence'||
     matching.map(s=>s.debris.phase).join(',')!=='anticipation,reaction,recovery'||
     matching.some(s=>s.source.key!==matching[0].source.key))
    throw Error('Actual seed 18 no longer matches the approved Phase 3D fixture.');
  const source=matching[0].source;
  const event=manifest.laps.flatMap(l=>l.effects).find(e=>e.key===source.key&&e.id==='debris');
  if(!event||event.damage!==source.damage||event.kind!==source.kind)
    throw Error('Shot source no longer matches the actual engine occurrence.');
  const clipStartMs=matching[0].startMs,clipEndMs=matching[2].endMs;
  return {seed,manifest,storyboard,source,event,shots:matching,
    clipStartMs,clipEndMs,durationMs:clipEndMs-clipStartMs,
    result:after.history.at(-1)};
 }
 root.ScrapSeed18DebrisReview=Object.freeze({load});
})(globalThis);
