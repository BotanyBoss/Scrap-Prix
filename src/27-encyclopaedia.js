/* Scrap Prix: permanent, player-earned Encyclopaedia independent of run saves. */
(function(){
  'use strict';
  // Permanent, main-menu discoveries. Never store this data in an individual run save.
  const D=window.ScrapData,E=window.ScrapEngine;
  const KEY='scrap-prix-encyclopaedia-v1';
  const TABS=['events','weather','shortcuts','tracks','parts','bounties','gags'];
  const RARITY_ORDER=['Common','Uncommon','Rare','Epic','Legendary','Classified'];
  const blank=()=>({version:1,entries:Object.fromEntries(TABS.map(k=>[k,{}])),session:{id:'',tunes:{}},recorded:[],recordedThrough:{},eventStages:{}});
  const plain=o=>o&&typeof o==='object'&&!Array.isArray(o);
  const capped=(n,max=100000)=>Number.isInteger(n)&&n>=0&&n<=max?n:0;
  const matching=(list,id)=>list.find(x=>x.id===id);
  // The race engine calls rolled wildcards 'optional'; use a single stable key.
  const canonicalEventKind=kind=>kind==='optional'?'wildcard':kind;
  const eventDefinition=(kind,id)=>{
    kind=canonicalEventKind(kind);
    if(kind==='pass')return matching(D.PASS_EVENTS||[],id);
    if(kind==='fake')return matching(D.FAKE_PASS_EVENTS||[],id);
    if(!['signature','wildcard','anomaly','chain'].includes(kind))return null;
    return E.eventDefinition({kind,id});
  };
  const eventType=(key)=>{
    if(typeof key!=='string'||!key.includes(':'))return null;
    const at=key.indexOf(':'),kind=key.slice(0,at),id=key.slice(at+1);
    return eventDefinition(kind,id)?{kind,id,definition:eventDefinition(kind,id)}:null;
  };
  const isShortcut=(kind,id)=>{
    const def=eventDefinition(kind,id);
    if(!def)return false;
    return /shortcut|detour|ramp|bridge-jump|wormhole/i.test(id)||/shortcut|detour/i.test(def.title||'');
  };
  const valid=(tab,key)=>{
    if(typeof key!=='string'||key.length>100)return false;
    if(tab==='events')return !!eventType(key);
    if(tab==='shortcuts'){const x=eventType(key);return !!x&&isShortcut(x.kind,x.id);}
    if(tab==='weather')return !!matching(D.WEATHER,key);
    if(tab==='tracks')return !!matching(D.TRACKS,key);
    if(tab==='parts')return !!matching(D.PARTS,key);
    if(tab==='bounties')return !!E.bountyDefinitions.find(x=>x.id===key);
    if(tab==='gags')return !!matching(D.GAG_RECIPES,key);
    return false;
  };
  const cleanEntries=raw=>{
    const cleaned=blank().entries;
    for(const tab of TABS){
      if(!plain(raw?.[tab]))continue;
      for(const [key,value] of Object.entries(raw[tab])){
        if(!valid(tab,key)||!plain(value))continue;
        if(tab==='parts'){
          cleaned[tab][key]={state:value.state==='equipped'?'equipped':'spotted',
            level:capped(value.level,10),mostTunes:capped(value.mostTunes,10)};
        }else if(tab==='bounties'){
          cleaned[tab][key]={state:value.state==='completed'?'completed':'offered',count:capped(value.count)};
        }else{
          const states={events:['missed','discovered'],weather:['experienced'],
            shortcuts:['missed','discovered'],tracks:['attempted','won'],gags:['built']};
          if(states[tab]?.includes(value.state))cleaned[tab][key]={state:value.state};
        }
      }
    }
    return cleaned;
  };
  const load=()=>{
    const next=blank();
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!plain(raw)||raw.version!==1)return next;
      next.entries=cleanEntries(raw.entries);
      if(plain(raw.session)){
        next.session.id=typeof raw.session.id==='string'?raw.session.id.slice(0,80):'';
        if(plain(raw.session.tunes))for(const [id,n] of Object.entries(raw.session.tunes)){
          if(valid('parts',id))next.session.tunes[id]=capped(n,10);
        }
      }
      next.recorded=Array.isArray(raw.recorded)?raw.recorded.filter(x=>typeof x==='string'&&x.length<=110).slice(-200):[];
      if(plain(raw.eventStages))for(const [id,n] of Object.entries(raw.eventStages)){
        if(D.ANOMALIES.some(a=>a.id===id)&&Number.isInteger(n)&&n>=1&&n<=8)
          next.eventStages[id]=n;
      }
      if(plain(raw.recordedThrough))for(const [id,n] of Object.entries(raw.recordedThrough)){
        if(/^[-a-zA-Z0-9_]{1,80}$/.test(id)&&Number.isInteger(n)&&n>=0&&n<=9999999)
          next.recordedThrough[id]=n;
      }
    }catch(_){}
    return next;
  };
  let data=load();
  const persist=()=>{
    try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch(_){return false;}
  };
  const snapshot=()=>JSON.parse(JSON.stringify(data));
  // A source run ID lives in the run save. Re-importing or switching between
  // runs must not clear the permanent result ledger or count rewards twice.
  const startRun=id=>{
    const selected=typeof id==='string'&&/^[-a-zA-Z0-9_]{1,80}$/.test(id)
      ?id:'run-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*1e9).toString(36);
    if(data.session.id!==selected){data.session={id:selected,tunes:{}};persist();}
    return selected;
  };
  const currentRunId=()=>data.session.id;
  // Old exports have no ID. Identical legacy exports map to the same source;
  // once imported, all subsequent exports retain this ID.
  const legacyRunId=run=>{
    const value=JSON.stringify({seed:run.seed,raceIndex:run.raceIndex,
      history:run.history||[],loadout:run.loadout||{},points:run.points});
    const hash=offset=>{
      let h=offset>>>0;
      for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619)>>>0;
      return h.toString(16).padStart(8,'0');
    };
    return 'legacy-'+hash(2166136261)+hash(1483203911);
  };
  const markEvent=(kind,id,seen,stage=null)=>{
    kind=canonicalEventKind(kind);
    if(!eventDefinition(kind,id))return false;
    const key=kind+':'+id,tab=isShortcut(kind,id)?'shortcuts':'events';
    const old=data.entries[tab][key],state=seen?'discovered':'missed';
    // An anomaly/chain can be seen several times at different stages. Never
    // infer the finale merely from a generic chain discovery.
    const staged=seen&&['anomaly','chain'].includes(kind)&&Number.isInteger(stage)&&stage>=1&&stage<=8;
    const newStage=staged&&stage>(data.eventStages[id]||0);
    if(newStage)data.eventStages[id]=stage;
    if(old&&(old.state==='discovered'||old.state===state)){
      if(newStage)persist();
      return !!newStage;
    }
    data.entries[tab][key]={state};persist();return true;
  };
  const recordEventSeen=(kind,id,stage=null)=>markEvent(kind,id,true,stage);
  const recordEventMissed=(kind,id)=>markEvent(kind,id,false);
  const hasSeenEvent=(kind,id,stage=null)=>{
    kind=canonicalEventKind(kind);
    if(!eventDefinition(kind,id))return false;
    const tab=isShortcut(kind,id)?'shortcuts':'events';
    if(data.entries[tab][kind+':'+id]?.state!=='discovered')return false;
    return !Number.isInteger(stage)||stage<1||(data.eventStages[id]||0)>=stage;
  };
  const hasSeenWeather=id=>data.entries.weather[id]?.state==='experienced';
  const hasSeenLegendary=()=>D.ANOMALIES.some(def=>
    def.tags?.includes('legendary')&&hasSeenEvent('anomaly',def.id));
  // A saved result survives a closed/reloaded browser even though its replay
  // doesn't. Only actual engine-resolved effects become unwitnessed entries.
  const recordUnwitnessedResult=result=>{
    if(!result||!Array.isArray(result.laps))return false;
    let changed=false;
    for(const lap of result.laps)for(const e of lap.effects||[]){
      if(!e||e.kind==='wear'||!e.id)continue;
      changed=recordEventMissed(e.kind,e.id)||changed;
    }
    for(const e of result.passEvents||[])if(e?.id)
      changed=recordEventMissed('pass',e.id)||changed;
    for(const e of result.fakePassEvents||[])if(e?.id)
      changed=recordEventMissed('fake',e.id)||changed;
    return changed;
  };
  const recordWeather=id=>{
    if(!valid('weather',id)||data.entries.weather[id])return false;
    data.entries.weather[id]={state:'experienced'};persist();return true;
  };
  const recordTrack=(id,won)=>{
    if(!valid('tracks',id))return false;
    const old=data.entries.tracks[id];
    if(old&&(old.state==='won'||(!won&&old.state==='attempted')))return false;
    data.entries.tracks[id]={state:won?'won':'attempted'};persist();return true;
  };
  const recordPartSpotted=id=>{
    if(!valid('parts',id)||data.entries.parts[id])return false;
    data.entries.parts[id]={state:'spotted',level:0,mostTunes:0};persist();return true;
  };
  const recordPartEquipped=(id,level=0)=>{
    if(!valid('parts',id))return false;
    const old=data.entries.parts[id]||{state:'spotted',level:0,mostTunes:0};
    const next={state:'equipped',level:Math.max(old.level,capped(level,10)),mostTunes:old.mostTunes};
    if(JSON.stringify(old)===JSON.stringify(next))return false;
    data.entries.parts[id]=next;persist();return true;
  };
  const recordPartTuned=(id,level)=>{
    if(!valid('parts',id))return false;
    if(!data.session.id)startRun();
    const n=(data.session.tunes[id]||0)+1;
    data.session.tunes[id]=Math.min(10,n);
    const old=data.entries.parts[id]||{state:'spotted',level:0,mostTunes:0};
    data.entries.parts[id]={state:'equipped',level:Math.max(old.level,capped(level,10)),mostTunes:Math.max(old.mostTunes,n)};
    persist();return true;
  };
  const recordBountyOffered=id=>{
    if(!valid('bounties',id)||data.entries.bounties[id])return false;
    data.entries.bounties[id]={state:'offered',count:0};persist();return true;
  };
  const recordBountyCompleted=id=>{
    if(!valid('bounties',id))return false;
    const old=data.entries.bounties[id]||{state:'offered',count:0};
    data.entries.bounties[id]={state:'completed',count:Math.min(100000,old.count+1)};
    persist();return true;
  };
  const recordGag=id=>{
    if(!valid('gags',id)||data.entries.gags[id])return false;
    data.entries.gags[id]={state:'built'};persist();return true;
  };
  const isGagKnown=id=>!!data.entries.gags[id]&&data.entries.gags[id].state==='built';
  const hasGagTab=()=>Object.keys(data.entries.gags).length>0;
  const recordResult=(result)=>{
    if(!result||!Number.isInteger(result.race))return false;
    if(!data.session.id)startRun();
    const key=data.session.id+':'+result.race;
    if(data.recorded.includes(key)||(data.recordedThrough[data.session.id]||0)>=result.race)return false;
    data.recorded.push(key);if(data.recorded.length>200)data.recorded.shift();
    data.recordedThrough[data.session.id]=Math.max(data.recordedThrough[data.session.id]||0,result.race);
    if(!result.noStart)recordTrack(result.trackId,result.place===1&&!result.failedSlot);
    for(const x of result.bountyResults||[])if(x.success)recordBountyCompleted(x.id);
    if(result.gagId)recordGag(result.gagId);
    persist();return true;
  };
  const rarity=(kind,def)=>{
    if(!def)return 'Common';
    if(def.rarity)return def.rarity;
    if(def.tags?.includes('legendary'))return 'Legendary';
    if(kind==='anomaly'||kind==='chain')return (def.weight||1)<=.45?'Legendary':'Rare';
    if(typeof def.weight==='number'&&def.weight<=1)return 'Rare';
    if(typeof def.weight==='number'&&def.weight<=3)return 'Uncommon';
    return 'Common';
  };
  const details=(tab,key,entry)=>{
    let def,name,group,description='',artId=null;
    if(tab==='events'||tab==='shortcuts'){
      const parsed=eventType(key);def=parsed?.definition;
      name=def?.title||'Unknown event';group=rarity(parsed?.kind,def);
      description=def?.text||'';artId=def?.visual||key;
    }else if(tab==='weather'){
      def=matching(D.WEATHER,key);name=def?.name||'Weather';group=key==='blizzard'?'Rare':['snowfall','fog'].includes(key)?'Uncommon':'Common';
      description='Weather and traction conditions encountered during a race.';
    }else if(tab==='tracks'){
      def=matching(D.TRACKS,key);name=def?.name||'Track';group='Tracks';
      description=def?.blurb||'';
    }else if(tab==='parts'){
      def=matching(D.PARTS,key);name=def?.name||'Part';group=def?.slot||'parts';
      description=def?.note||'';artId=key;
    }else if(tab==='bounties'){
      def=E.bountyDefinitions.find(x=>x.id===key);name=def?.title||'Contract';group=def?.rarity||'Common';
      description=def?.goal||'';
    }else if(tab==='gags'){
      def=matching(D.GAG_RECIPES,key);name=def?.name||'Vehicle';group='Discovered';
      description='Exact four-part transformation recipe discovered.';artId=key;
    }
    const revealed=['discovered','experienced','won','equipped','completed','built'].includes(entry.state);
    return {key,tab,state:entry.state,known:revealed,name:revealed?name:'?',group:tab==='parts'?(def?.slot||'parts'):group,
      description:revealed?description:'',artId,level:entry.level||0,mostTunes:entry.mostTunes||0,count:entry.count||0,
      recipe:tab==='gags'&&revealed?def.requires:null,category:tab==='bounties'&&revealed?def.category:null};
  };
  const list=tab=>{
    if(!TABS.includes(tab)||(tab==='gags'&&!hasGagTab()))return [];
    const items=Object.entries(data.entries[tab]).map(([key,entry])=>details(tab,key,entry));
    return items.sort((a,b)=>{
      const ra=RARITY_ORDER.indexOf(a.group),rb=RARITY_ORDER.indexOf(b.group);
      if(ra!==rb&&ra>=0&&rb>=0)return ra-rb;
      return a.group.localeCompare(b.group)||Number(b.known)-Number(a.known)||a.name.localeCompare(b.name);
    });
  };
  const tabs=()=>TABS.filter(t=>t!=='gags'||hasGagTab());
  window.ScrapEncyclopaedia={KEY,snapshot,startRun,currentRunId,legacyRunId,recordEventSeen,recordEventMissed,hasSeenEvent,hasSeenWeather,hasSeenLegendary,recordUnwitnessedResult,recordWeather,
    recordTrack,recordPartSpotted,recordPartEquipped,recordPartTuned,recordBountyOffered,
    recordBountyCompleted,recordGag,isGagKnown,hasGagTab,recordResult,list,tabs,details};
})();
