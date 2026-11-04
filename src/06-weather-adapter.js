/* Scrap Prix v0.7.23a: replay-weather continuity adapter.
 * Presentation-only. Preserves the byte-locked race rules and pure replay
 * model, and makes per-event weather changes visible in the actual replay.
 */
(function (root, factory) {
 'use strict';
 const api=factory(root.ScrapPresentation,root.ScrapEngine);
 if (typeof module==='object' && module.exports) module.exports=api;
 else root.ScrapWeatherReplay=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(P,E){
 'use strict';
 if (!P||!E) throw Error('Weather replay adapter requires the race engine and presentation module.');
 const original=P.createReplay;
 const apply=replay=>{
  if(!replay||!replay.result||!Array.isArray(replay.result.laps))return replay;
  const r=replay.result,lookup=new Map();
  for(const lap of r.laps)for(const effect of lap.effects||[]){
   if(effect.kind==='wear')continue;
   const key=effect.kind==='signature'?'hazard':`${effect.key}-${lap.lap}`;
   lookup.set(key,effect);
  }
  let ongoing=r.weatherId,current=ongoing;
  for(const step of replay.steps){
   if(step.id==='finish'){
    // Keep the finish weather consistent with the final visible event.
    step.weatherId=current;
    continue;
   }
   if(step.event===null && (step.id==='opening'||/^lap-\d+$/.test(step.id))){
    current=ongoing;
    step.weatherId=current;
    const initial=E.weather(r.weatherId)?.name,arrival=E.weather(current)?.name;
    if(initial&&arrival&&initial!==arrival && step.copy?.startsWith(initial+'. Normal wear'))
     step.copy=arrival+step.copy.slice(initial.length);
    continue;
   }
   const effect=lookup.get(step.id);
   if(!effect)continue;
   const def=E.eventDefinition(effect);
   if(def?.weatherId)current=def.weatherId;
   step.weatherId=current;
   // A moving storm that has arrived should not magically vanish at the lap line.
   // Short one-off showers, hail or heatwave events do NOT alter later laps.
   if(effect.id==='storm-front'&&effect.stage>=2&&def?.weatherId)ongoing=def.weatherId;
  }
  return replay;
 };
 if(!original.__scrapWeatherWrapped){
  const enhanced=function(before,after){return apply(original.call(this,before,after));};
  Object.defineProperty(enhanced,'__scrapWeatherWrapped',{value:true});
  P.createReplay=enhanced;
 }
 return Object.freeze({apply});
});
