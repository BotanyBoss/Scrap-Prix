/* v0.7.23n - DEV-only, shared art review for the existing Environment / Parts Labs.
 * No changes to campaign saves, catalogue, vehicle statistics, or race rendering.
 * Feedback stays local until a user explicitly exports and shares the JSON.
 */
(function(){
 'use strict';
 // Bundled only in DEV HTML, before either Lab is initialised.
 const FORMAT='scrap-prix-art-feedback',SCHEMA=1;
 const RATINGS=Object.freeze([
  {id:'not-ready',label:'NOT READY',hint:'First art pass needed'},
  {id:'rework',label:'REWORK',hint:'Rebuild the presentation'},
  {id:'polish',label:'POLISH',hint:'Good foundation, needs refinement'},
  {id:'good',label:'GOOD',hint:'Ready for playtesting'},
  {id:'standout',label:'STANDOUT',hint:'Especially memorable'}
 ]);
 const allowedRatings=new Set(RATINGS.map(x=>x.id));
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const note=v=>typeof v==='string'?v.slice(0,4000):'';
 const cleanContext=raw=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const clean=Object.create(null);
  for(const [k,v] of Object.entries(raw).slice(0,16)){
   if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,40}$/.test(k))continue;
   if(typeof v==='string')clean[k]=v.slice(0,180);
   else if(typeof v==='number'&&Number.isFinite(v))clean[k]=v;
   else if(typeof v==='boolean')clean[k]=v;
  }
  return clean;
 };
 function panelMarkup(title,intro){return `
  <section class="art-review" aria-label="${esc(title)} feedback" data-art-review-panel>
   <div class="art-review-heading"><div><span>DEV ART FEEDBACK</span><strong data-art-review-current>SELECT AN ASSET</strong></div><small data-art-review-count>0 REVIEWED</small></div>
   <p class="art-review-intro">${esc(intro)} Each rating belongs to the selected asset; changing preview styles does not delete its feedback.</p>
   <div class="art-review-votes" role="group" aria-label="Visual quality verdict">
    ${RATINGS.map(r=>`<button type="button" data-art-review-vote="${r.id}" aria-pressed="false" title="${esc(r.hint)}"><b>${r.label}</b><small>${esc(r.hint)}</small></button>`).join('')}
   </div>
   <label class="art-review-note-label">WHAT SHOULD CHANGE?<textarea data-art-review-notes rows="3" maxlength="4000" placeholder="e.g. Silhouette too flat; larger tyres, deeper roadside layers."></textarea></label>
   <div class="art-review-actions"><button type="button" data-art-review-action="next">NEXT UNREVIEWED ▶</button><label>FIND <select data-art-review-filter aria-label="Find reviewed assets"><option value="unreviewed">UNREVIEWED</option>${RATINGS.map(r=>`<option value="${r.id}">${r.label}</option>`).join('')}</select></label><button type="button" data-art-review-action="find">FIND NEXT</button><button type="button" data-art-review-action="clear">CLEAR THIS REVIEW</button></div>
   <div class="art-review-actions art-review-export"><button type="button" data-art-review-action="export">⬇ EXPORT FEEDBACK JSON</button><button type="button" data-art-review-action="import">IMPORT JSON</button><button type="button" data-art-review-action="copy">COPY REPORT</button></div>
   <input type="file" accept=".json,application/json" data-art-review-import hidden>
   <p data-art-review-status class="art-review-status" role="status" aria-live="polite">Saved locally when browser storage allows it. Export your JSON before switching devices or folders.</p>
   <p class="art-review-privacy">Nothing is sent to ChatGPT automatically. Upload the exported JSON to our chat to share your feedback.</p>
  </section>`;}
 function createManager({kind,items,resolveDynamic=null,build='v0.7.23n'}){
  if(!['environment','vehicle'].includes(kind))throw Error('Unsupported review group');
  const staticItems=Object.create(null);
  for(const item of items)if(item&&typeof item.id==='string'&&!staticItems[item.id])staticItems[item.id]={...item};
  const storageKey=`scrap-prix.dev.${kind}-art-feedback.v1`;
  const lookup=id=>typeof id==='string'?(staticItems[id]||(resolveDynamic&&resolveDynamic(id))||null):null;
  const ratingOf=(all,id)=>allowedRatings.has(all[id]?.rating)?all[id].rating:null;
  function normalize(raw){
   const out=Object.create(null);
   if(!raw||typeof raw!=='object')return out;
   if(raw.format&&raw.format!==FORMAT)return out;
   if(raw.kind&&raw.kind!==kind)return out;
   if(raw.schemaVersion&&raw.schemaVersion!==SCHEMA)return out;
   const records=Array.isArray(raw.reviews)?raw.reviews.map(x=>[x?.itemId,x]):Object.entries(raw);
   for(const [id,value] of records){
    if(!lookup(id)||!value||typeof value!=='object')continue;
    const rating=allowedRatings.has(value.rating)?value.rating:null;
    const notes=note(value.notes);
    if(!rating&&!notes.trim())continue;
    out[id]={rating,notes,savedAt:typeof value.savedAt==='string'?value.savedAt.slice(0,40):null,context:cleanContext(value.context)};
   }
   return out;
  }
  function serialize(all,now=new Date().toISOString()){
   const clean=normalize(all);
   const counts=Object.fromEntries(RATINGS.map(r=>[r.id,0]));
   const reviews=[];
   for(const [id,record] of Object.entries(clean)){
    const item=lookup(id);if(!item)continue;
    if(record.rating)counts[record.rating]++;
    reviews.push({itemId:id,name:item.name,category:item.group,description:item.description||'',rating:record.rating,notes:record.notes,savedAt:record.savedAt,context:record.context});
   }
   reviews.sort((a,b)=>a.itemId.localeCompare(b.itemId));
   return {format:FORMAT,schemaVersion:SCHEMA,kind,build,exportedAt:now,
    catalogueSize:Object.keys(staticItems).length,reviewed:reviews.filter(x=>x.rating).length,
    unreviewed:Math.max(0,Object.keys(staticItems).length-reviews.filter(x=>x.rating&&staticItems[x.itemId]).length),
    counts,reviews};
  }
  function report(all){
   const data=serialize(all);
   return [`SCRAP PRIX / ${kind.toUpperCase()} ART REVIEWS`,`${data.reviewed} rated · ${data.catalogueSize} core assets · ${data.exportedAt}`,
    ...data.reviews.map(r=>`[${(r.rating||'NOT RATED').toUpperCase()}] ${r.name} (${r.itemId})${r.notes?'\n'+r.notes:''}`)].join('\n\n');
  }
  function attach(root,{current,candidates,onNavigate}){
   const panel=root.querySelector('[data-art-review-panel]');
   if(!panel)throw Error('Art feedback panel was not mounted');
   const $=sel=>panel.querySelector(sel),controller=new AbortController(),signal=controller.signal;
   const status=message=>{$('[data-art-review-status]').textContent=message;};
   let reviews=Object.create(null),storeAvailable=true,activeId='';
   try{reviews=normalize(JSON.parse(localStorage.getItem(storageKey)||'{}'));}
   catch(err){storeAvailable=false;status('Browser storage unavailable or unreadable. Export your feedback before closing this page.');}
   function persist(){
    try{localStorage.setItem(storageKey,JSON.stringify(reviews));storeAvailable=true;return true;}
    catch(err){storeAvailable=false;status('Browser storage is unavailable. Use EXPORT FEEDBACK JSON before closing this page.');return false;}
   }
   function refresh(){
    const item=current(),id=lookup(item?.id)?item.id:'',entry=reviews[id]||{};
    activeId=id;
    const label=$('[data-art-review-current]');
    label.textContent=id?item.name:'SELECT A REVIEWABLE ASSET';
    label.title=item?.description||'';
    const exported=serialize(reviews);
    const ratedCore=exported.reviews.filter(x=>x.rating&&staticItems[x.itemId]).length;
    const extra=exported.reviewed-ratedCore;
    $('[data-art-review-count]').textContent=`${ratedCore} / ${exported.catalogueSize} CORE REVIEWED${extra?` · ${extra} MIXED BUILDS`:''}`;
    const input=$('[data-art-review-notes]');
    if(input.value!==(entry.notes||''))input.value=entry.notes||'';
    input.disabled=!id;
    for(const vote of panel.querySelectorAll('[data-art-review-vote]')){
     vote.disabled=!id;
     vote.setAttribute('aria-pressed',String(!!id&&vote.dataset.artReviewVote===entry.rating));
    }
    $('[data-art-review-action="clear"]').disabled=!id;
    panel.dataset.artReviewActiveId=id;
    if(typeof window.CustomEvent==='function')root.dispatchEvent(new CustomEvent('scrap-art-review-updated',{detail:{kind,reviews},bubbles:false}));
   }
   function edit(patch){
    const item=current();if(!item?.id||!lookup(item.id))return;
    const old=reviews[item.id]||{};
    const rating=Object.prototype.hasOwnProperty.call(patch,'rating')?patch.rating:(old.rating||null);
    const notes=Object.prototype.hasOwnProperty.call(patch,'notes')?note(patch.notes):old.notes||'';
    if(!rating&&!notes.trim())delete reviews[item.id];
    else reviews[item.id]={rating,notes,savedAt:new Date().toISOString(),context:cleanContext(item.context)};
    const ok=persist();refresh();if(ok)status('Saved locally. Export JSON to share your feedback.');
   }
   function nextMatching(target){
    const choices=candidates().map(x=>typeof x==='string'?x:x?.id).filter(id=>lookup(id));
    if(!choices.length){status('No selectable assets in this category.');return;}
    const active=current()?.id,start=choices.indexOf(active);
    for(let offset=1;offset<=choices.length;offset++){
     const id=choices[(Math.max(-1,start)+offset)%choices.length];
     const hit=target==='unreviewed'?!ratingOf(reviews,id):ratingOf(reviews,id)===target;
     if(hit){onNavigate(id);refresh();status('Jumped to '+lookup(id).name+'.');return;}
    }
    status(`No ${target.toUpperCase()} assets found in the current review category.`);
   }
   function download(){
    const body=JSON.stringify(serialize(reviews),null,2)+'\n';
    const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=`Scrap-Prix-${kind==='vehicle'?'Vehicle':'Environment'}-Art-Feedback-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    status('Feedback exported. Upload the JSON to our chat for review.');
   }
   async function copy(){
    const body=report(reviews);
    try{await navigator.clipboard.writeText(body);status('Report copied. Paste it into our chat.');}
    catch(_){
     const textarea=document.createElement('textarea');textarea.value=body;textarea.style.position='fixed';textarea.style.opacity='0';
     document.body.appendChild(textarea);textarea.select();const ok=document.execCommand('copy');textarea.remove();
     status(ok?'Report copied. Paste it into our chat.':'Clipboard blocked. Use EXPORT FEEDBACK JSON.');
    }
   }
   panel.addEventListener('click',e=>{
    const vote=e.target.closest('[data-art-review-vote]');
    if(vote){edit({rating:vote.dataset.artReviewVote});return;}
    const action=e.target.closest('[data-art-review-action]')?.dataset.artReviewAction;
    if(action==='next')nextMatching('unreviewed');
    else if(action==='find')nextMatching($('[data-art-review-filter]').value);
    else if(action==='clear')edit({rating:null,notes:''});
    else if(action==='export')download();
    else if(action==='copy')copy();
    else if(action==='import')$('[data-art-review-import]').click();
   },{signal});
   panel.addEventListener('input',e=>{if(e.target.matches('[data-art-review-notes]'))edit({notes:e.target.value});},{signal});
   panel.addEventListener('change',async e=>{
    if(!e.target.matches('[data-art-review-import]'))return;
    const file=e.target.files?.[0];if(!file)return;
    try{
     if(file.size>2_000_000)throw Error('Feedback file is too large');
     const incoming=JSON.parse(await file.text());
     if(incoming.format!==FORMAT||incoming.schemaVersion!==SCHEMA||incoming.kind!==kind||!Array.isArray(incoming.reviews))throw Error('Choose a matching Scrap Prix art feedback JSON');
     const normalized=normalize(incoming),n=Object.keys(normalized).length;
     if(!n)throw Error('No recognised reviews in that file');
     Object.assign(reviews,normalized);const ok=persist();refresh();
     status(ok?`Imported ${n} reviews. Existing matching IDs were updated; export a backup when finished.`:`Imported ${n} reviews into this session only. Export before closing.`);
    }catch(err){status('Import failed: '+err.message);}
    finally{e.target.value='';}
   },{signal});
   refresh();
   if(!storeAvailable)status('Browser storage unavailable. Export feedback before closing.');
   return {refresh,dispose:()=>controller.abort(),export:()=>serialize(reviews),records:()=>reviews};
  }
  return Object.freeze({attach,normalize,serialize,report,storageKey});
 }
 window.ScrapArtFeedback=Object.freeze({markup:panelMarkup,createManager,ratings:RATINGS,format:FORMAT,schemaVersion:SCHEMA});
})();
