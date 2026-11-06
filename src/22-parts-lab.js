
window.SCRAP_PRIX_DEV_MODE=true;

/* In-game visual sandbox. Test selections are not purchases and never touch the
   engine or inventory. Only renderer style/camera preferences are persisted. */
(function(){
  'use strict';
  const A=window.ScrapVehicleArt,Review=window.ScrapArtFeedback,KEY='scrap-prix-v0401-dev-renderer-options';
  let prefs={style:'chunky'};
  try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');prefs={style:v.style==='illustrated'?'illustrated':'chunky'};}catch(_){}
  let cleanup=null;
  const labels={chassis:'CHASSIS',engine:'ENGINE',tyres:'TYRES',gadget:'GADGET'};
  function preferences(){return {...prefs,camera:'rear'};}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){/* Session preferences still work without browser storage. */}}
  const partCount=Object.values(A.OPTIONS).reduce((n,items)=>n+items.length,0);
  const slots=Object.keys(A.OPTIONS);
  const partItems=slots.flatMap(slot=>A.OPTIONS[slot].map(part=>({id:`part:${slot}:${part.id}`,name:part.name,group:labels[slot],description:part.note})));
  const gagItems=A.recipes.map(g=>({id:'gag:'+g.id,name:g.name,group:'Gag',description:g.note}));
  const validParts=Object.fromEntries(slots.map(s=>[s,new Set(A.OPTIONS[s].map(x=>x.id))]));
  function parseBuild(id){
    if(typeof id!=='string'||!id.startsWith('build:'))return null;
    const values=id.slice(6).split('|');if(values.length!==slots.length)return null;
    if(!values.every((part,i)=>validParts[slots[i]].has(part)))return null;
    return Object.fromEntries(slots.map((slot,i)=>[slot,values[i]]));
  }
  const reviewManager=Review.createManager({kind:'vehicle',items:[...partItems,...gagItems],resolveDynamic:id=>{
    const build=parseBuild(id);if(!build)return null;
    const names=slots.map(slot=>A.OPTIONS[slot].find(x=>x.id===build[slot])?.name||build[slot]);
    return {id,name:names.join(' + '),group:'Mixed Build',description:'Four-part visual combination'};
  }});
  const combinationCount=Object.values(A.OPTIONS).reduce((n,items)=>n*items.length,1);
  function markup(){return `
    <div class="lab-banner"><span class="lab-stamp">DEV PARTS LAB / v0.7.23n</span><p>Same parts. Sometimes a very different personality.</p><span class="lab-count">${partCount} PARTS / ${combinationCount} COMBINATIONS</span></div>
    <div class="lab-toolbar">
      <div class="lab-surface" role="group" aria-label="Large preview view"><button data-lab-surface="garage" aria-pressed="true">GARAGE</button><button data-lab-surface="race" aria-pressed="false">RACE PREVIEW</button></div>
      <label>RENDER STYLE<select data-lab-pref="style" aria-label="Vehicle rendering style"><option value="illustrated">Illustrated monochrome</option><option value="chunky">Chunky retro</option></select></label>
      <label>RACE BACKDROP<select data-lab-backdrop>${Object.entries(window.ScrapEnvironments?.RECIPES||{city:{name:'City'}}).map(([id,r])=>`<option value="${id}">${r.name}</option>`).join('')}</select></label>
      <label>RACE WEATHER<select data-lab-weather><option value="clear">CLEAR</option><option value="rain">RAIN</option><option value="fog">FOG</option><option value="blizzard">BLIZZARD</option><option value="dust">DUST</option><option value="hot">HEAT</option><option value="cold">COLD</option></select></label>
    </div>
    <div class="lab-layout">
      <div class="lab-visuals">
        <div class="art-stage-comparison lab-stage-comparison"><div class="lab-main-stage"><canvas id="lab-main" role="img" aria-label="Assembled modular vehicle"></canvas><div class="lab-view-label" id="lab-view-label">GARAGE / THREE-QUARTER</div><span class="lab-live-badge" id="lab-mode-badge">TEST PARTS</span></div><figure class="art-pinned-frame" id="lab-pinned-frame" hidden><img id="lab-pinned-image" alt="Pinned vehicle frame for comparison"><figcaption>PINNED REFERENCE</figcaption></figure></div>
        <div class="art-preview-controls"><button type="button" data-lab-action="pin">PIN CURRENT FRAME</button><button type="button" data-lab-action="clear-pin">CLEAR PIN</button><button type="button" data-lab-action="download-frame">SAVE PREVIEW PNG</button></div>
        <p id="lab-description" class="lab-build-description" aria-live="polite"></p>
        <div class="lab-review-scope"><label>REVIEW TYPE<select data-lab-review-scope><option value="part">INDIVIDUAL PART</option><option value="build">MIXED BUILD</option><option value="gag">GAG VEHICLE</option></select></label><span id="lab-review-hint">Click a part on the right to review it. Each part is rated separately.</span></div>
        <label class="lab-gag-quick" data-lab-gag-quick hidden>GAG VEHICLE <select data-lab-gag-preset>${A.recipes.map(g=>`<option value="${g.id}">${g.name}</option>`).join('')}</select></label>
        ${Review.markup('VEHICLE','Review parts, mixed builds, and gag forms separately. Select the review type above. Only your DEV feedback is saved; no equipment is bought or changed.')}
        <div class="lab-form-panel">
          <div><b id="lab-form-title">MODULAR BUILD</b><p id="lab-form-note" aria-live="polite"></p></div>
          <label><input type="checkbox" data-lab-combos checked> COMBO BODYWORK</label>
        </div>
        <div class="lab-camera-pair">
          <figure><canvas id="lab-rear" role="img" aria-label="Straight rear racing comparison"></canvas><figcaption>STRAIGHT REAR <span>RACE COMPOSITION</span></figcaption></figure>
        </div>
      </div>
      <aside class="lab-controls" aria-label="Visual-only part selection">
        <p class="lab-controls-title">FOUR SLOTS. ONE MACHINE.</p>
        ${Object.keys(A.OPTIONS).map((slot,i)=>`<section class="lab-part-group"><h3><span>0${i+1}</span> ${labels[slot]}</h3><div role="group" aria-label="${labels[slot]} visual model">${A.OPTIONS[slot].map(p=>`<button type="button" data-lab-slot="${slot}" data-lab-id="${p.id}" aria-pressed="false"><b>${p.name}</b><small>${p.note}</small></button>`).join('')}</div></section>`).join('')}
        <div class="lab-utilities"><button data-lab-action="fitted">MY FITTED PARTS</button><button data-lab-action="reset">RESET TEST BUILD</button></div>
        <p class="lab-isolation"><b>DEV REVIEW ONLY.</b> Gag recipes can be selected for artwork review. In normal play they remain hidden discoveries; the shop is never weighted toward a recipe.<br>Preview choices never buy, fit, upgrade or unlock equipment.</p>
      </aside>
    </div>
    <div class="lab-footer"><span>Development-only sandbox. Renderer style carries into this dev build; race camera is fixed to Straight Rear.</span><span>v0.7.23n / DEV-ONLY</span></div>`;}
  function dispose(){if(cleanup){cleanup();cleanup=null;}}
  function mount(root,loadout){
    dispose();
    const controller=new AbortController(),signal=controller.signal;
    let models={...A.DEFAULT},fitted=false,surface='garage',comboBodywork=true,reviewScope='part',focusSlot='chassis',feedback=null,backdrop='city',weather='clear';
    const actual={...loadout};
    root.querySelector('[data-lab-pref="style"]').value=prefs.style;
    function render(){
      const current=fitted?A.fromLoadout(actual):models;
      const main=window.ScrapScene.create(root.querySelector('#lab-main'),{...preferences(),comboBodywork:comboBodywork&&!fitted});
      if(surface==='garage')main.drawGarage(actual,current);
      else main.drawRace({time:3200,loadout:actual,models:current,motion:false,track:'harbour',weather,environment:{preset:backdrop}});
      {
        const scene=window.ScrapScene.create(root.querySelector('#lab-rear'),{style:prefs.style,camera:'rear',comboBodywork:comboBodywork&&!fitted});
        scene.drawRace({time:3200,loadout:actual,models:current,motion:false,track:'harbour',weather,environment:{preset:backdrop}});
      }
      root.querySelectorAll('[data-lab-slot]').forEach(b=>b.setAttribute('aria-pressed',String(current[b.dataset.labSlot]===b.dataset.labId)));
      root.querySelectorAll('[data-lab-surface]').forEach(b=>b.setAttribute('aria-pressed',String(surface===b.dataset.labSurface)));
      root.querySelector('#lab-mode-badge').textContent=fitted?'FITTED PARTS / ART FAMILIES':'TEST PARTS / NOT EQUIPPED';
      root.querySelector('#lab-view-label').textContent=surface==='garage'?'GARAGE / THREE-QUARTER':'RACE / STRAIGHT REAR';
      const names=Object.keys(A.OPTIONS).map(slot=>fitted?(window.ScrapData.PARTS.find(p=>p.id===actual[slot])?.name||slot):A.OPTIONS[slot].find(p=>p.id===current[slot])?.name||current[slot]);
      root.querySelector('#lab-description').textContent=names.join(' + ');
      const match=fitted?null:A.resolveForm(current),active=match&&comboBodywork;
      root.querySelector('#lab-form-title').textContent=active?'FORM / '+match.name.toUpperCase():match?'MATCHED / BODYWORK OFF':'MODULAR BUILD';
      root.querySelector('#lab-form-note').textContent=fitted?'Real equipped art only. Prototype recipes do not alter campaign equipment.':match?match.note:'No matching recipe. Each selected part keeps its individual appearance.';
      root.querySelector('[data-lab-combos]').disabled=fitted;
      root.querySelector('[data-lab-combos]').checked=comboBodywork;
      root.querySelector('.lab-form-panel').dataset.form=active?match.id:'modular';
      root.querySelector('#lab-main').setAttribute('aria-label',`${surface==='garage'?'Garage':'Race'} preview: ${names.join(', ')}`);
      const matchForReview=A.resolveForm(current);
      const gagSelector=root.querySelector('[data-lab-gag-preset]');
      root.querySelector('[data-lab-gag-quick]').hidden=reviewScope!=='gag';
      if(matchForReview)gagSelector.value=matchForReview.id;
      const hint=reviewScope==='part'?`Reviewing ${labels[focusSlot].toLowerCase()}: ${A.OPTIONS[focusSlot].find(x=>x.id===current[focusSlot])?.name||current[focusSlot]}.`:
       reviewScope==='gag'?(matchForReview?'Exact gag recipe selected.':'Choose a gag form from the selector to review it.'):
       'Reviewing this exact four-part combination. New combinations get separate reviews.';
      root.querySelector('#lab-review-hint').textContent=hint;
      feedback?.refresh();
    }
    function pinFrame(){
      const img=root.querySelector('#lab-pinned-image'),frame=root.querySelector('#lab-pinned-frame');
      img.src=root.querySelector('#lab-main').toDataURL('image/png');frame.hidden=false;
      root.querySelector('.lab-stage-comparison').dataset.pinned='true';
    }
    function clearPin(){
      root.querySelector('#lab-pinned-image').removeAttribute('src');root.querySelector('#lab-pinned-frame').hidden=true;
      delete root.querySelector('.lab-stage-comparison').dataset.pinned;
    }
    function downloadFrame(){
      const a=document.createElement('a');a.href=root.querySelector('#lab-main').toDataURL('image/png');
      a.download=`{{GAME_NAME_FILE}}-Vehicle-${surface}-${reviewScope}.png`;
      document.body.appendChild(a);a.click();a.remove();
    }
    root.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.labSlot){models={...(fitted?A.DEFAULT:models),[b.dataset.labSlot]:b.dataset.labId};focusSlot=b.dataset.labSlot;fitted=false;render();}
      else if(b.dataset.labSurface){surface=b.dataset.labSurface;render();}
      else if(b.dataset.labAction==='reset'){models={...A.DEFAULT};fitted=false;render();}
      else if(b.dataset.labAction==='fitted'){fitted=true;render();}
      else if(b.dataset.labAction==='pin')pinFrame();
      else if(b.dataset.labAction==='clear-pin')clearPin();
      else if(b.dataset.labAction==='download-frame')downloadFrame();
    },{signal});
    root.addEventListener('change',e=>{
      if(e.target.hasAttribute('data-lab-combos')){comboBodywork=e.target.checked;render();return;}
      if(e.target.hasAttribute('data-lab-backdrop')){backdrop=e.target.value;render();return;}
      if(e.target.hasAttribute('data-lab-weather')){weather=e.target.value;render();return;}
      if(e.target.hasAttribute('data-lab-review-scope')){
        reviewScope=e.target.value;root.querySelector('[data-lab-review-scope]').value=reviewScope;
        if(reviewScope==='gag'){comboBodywork=true;}
        if(reviewScope==='gag'&&!A.resolveForm(fitted?A.fromLoadout(actual):models)){
          const gag=A.recipes[0];models={...gag.requires};fitted=false;comboBodywork=true;
        }
        render();return;
      }
      if(e.target.hasAttribute('data-lab-gag-preset')){
        const gag=A.recipes.find(x=>x.id===e.target.value);
        if(gag){models={...gag.requires};fitted=false;comboBodywork=true;render();}
        return;
      }
      if(e.target.dataset.labPref==='style')prefs.style=e.target.value==='illustrated'?'illustrated':'chunky';
      else return;
      save();render();
    },{signal});
    const buildId=current=>`build:${slots.map(slot=>current[slot]).join('|')}`;
    feedback=reviewManager.attach(root,{
      current:()=>{
        const current=fitted?A.fromLoadout(actual):models,form=A.resolveForm(current);
        const id=reviewScope==='part'?`part:${focusSlot}:${current[focusSlot]}`:
          reviewScope==='gag'?(form?`gag:${form.id}`:null):buildId(current);
        return id?{id,name:reviewScope==='part'?(A.OPTIONS[focusSlot].find(x=>x.id===current[focusSlot])?.name||id):
            reviewScope==='gag'?form.name:'MIXED BUILD · '+slots.map(s=>current[s]).join(' / '),
          context:{scope:reviewScope,style:prefs.style,view:surface,backdrop,weather,comboBodywork, ...current}}:null;
      },
      candidates:()=>{
        if(reviewScope==='part')return partItems.map(x=>x.id);
        if(reviewScope==='gag')return gagItems.map(x=>x.id);
        const builds=[];
        for(const chassis of A.OPTIONS.chassis)for(const engine of A.OPTIONS.engine)
          for(const tyres of A.OPTIONS.tyres)for(const gadget of A.OPTIONS.gadget)
            builds.push(buildId({chassis:chassis.id,engine:engine.id,tyres:tyres.id,gadget:gadget.id}));
        return builds;
      },
      onNavigate:id=>{
        if(id.startsWith('part:')){
          const [_,slot,part]=id.split(':');models={...(fitted?A.DEFAULT:models),[slot]:part};focusSlot=slot;fitted=false;
        }else if(id.startsWith('gag:')){
          const recipe=A.recipes.find(g=>g.id===id.slice(4));if(recipe){models={...recipe.requires};fitted=false;comboBodywork=true;}
        }else{
          const match=parseBuild(id);if(match){models={...match};fitted=false;}
        }
        render();
      }
    });
    render();cleanup=()=>{controller.abort();feedback?.dispose();};
  }
  window.ScrapVisualLab=Object.freeze({preferences,markup,mount,dispose});
})();


