/* Compile shot boundaries against the already paced replay. No second clock. */
(function(root){
  function plan(manifest,replay,choices={}){
    const shots=[];
    let startMs=0;
    const cursors=new Map();
    for(const step of replay.steps){
      const lap=manifest.laps.find(l=>l.lap===step.lap);
      const events=lap?.effects.filter(e=>e.kind!=='wear')||[];
      let effect=null;
      if(step.sourceKind){
        const index=cursors.get(step.lap)||0;
        effect=events[index];
        if(effect?.id!==step.sourceId||effect.kind!==step.sourceKind)throw Error('Replay occurrence mismatch: '+step.id);
        cursors.set(step.lap,index+1);
      }
      function add(family,camera,durationMs,details={}){
        shots.push({id:step.id,lap:step.lap,family,camera,startMs,endMs:startMs+durationMs,durationMs,
          weatherId:step.weatherId,source:effect||step.presentationPass||null,...details});
        startMs+=durationMs;
      }
      if(step.id==='finish'){
        add(manifest.finish.noStart?'dns':manifest.finish.failedSlot?'dnf':'finish','front',step.duration,{finish:manifest.finish});
      }else if(step.id==='no-start')add('grid','side',step.duration);
      else if(step.choice&&!Object.hasOwn(choices,step.choice.key)){
        add('decision','rear',step.duration,{choice:step.choice});
      }else if(effect){
        const cut=Math.round(step.duration*.67);
        add('event','rear',cut);
        add('consequence','side',step.duration-cut);
      }else if(step.presentationPass)add('event','rear',step.duration);
      else if(step.id==='opening'){
        const cut=Math.round(step.duration*.45);
        add('grid','front',cut);
        add('drive','rear',step.duration-cut);
      }else add('drive',step.lap%2?'rear':'side',step.duration);
    }
    return {version:1,setting:manifest.setting,vehicle:manifest.vehicle,shots,totalMs:startMs};
  }
  root.ScrapOrdinaryTimeline={plan};
})(globalThis);
