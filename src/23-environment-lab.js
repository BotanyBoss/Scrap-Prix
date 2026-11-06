/* DEV-ONLY environment construction bench. Never writes game saves, never
   calls ScrapEngine, and is not bundled in the standalone PLAY version. */
(function(){
  'use strict';
  const Env=window.ScrapEnvironments,Review=window.ScrapArtFeedback;
  if(!window.SCRAP_PRIX_DEV_MODE||!Env||!Review)return;
  let cleanup=null;
  const labels={road:'ROAD TYPE',landscape:'LANDSCAPE',sky:'SKYSCAPE',scenery:'ROADSIDE SCENERY',atmosphere:'ATMOSPHERE'};
  let previewIndex=0;
  const reviewManager=Review.createManager({kind:'environment',items:Object.entries(Env.RECIPES).map(([id,recipe])=>({id:'env:'+id,name:recipe.name,group:'Environment',description:`${recipe.road} / ${recipe.landscape} / ${recipe.sky} / ${recipe.scenery} / ${recipe.atmosphere}`}))});
  function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function opts(items){return Object.entries(items).map(([k,v])=>`<option value="${escape(k)}">${escape(v.name||v)}</option>`).join('');}
  function markup(){return `
    <div class="environment-lab">
      <header class="env-banner"><span class="env-stamp">DEV / ENVIRONMENT LAB</span><div><strong>BUILD A TRACK. NOT A NEW ENGINE.</strong><p>Independent environmental layers, rendered using the real race camera.</p></div><b>36 TRACK RECIPES</b></header>
      <section class="env-layout">
        <div class="env-preview-col">
          <div class="env-preview-header"><span class="env-dot"></span><strong id="env-preview-name">CITY</strong><span class="env-badge" id="env-custom-label">CURATED RECIPE</span></div>
          <div class="art-stage-comparison env-stage-comparison"><div class="env-preview-wrap"><canvas id="env-preview" role="img" aria-label="Rendered race environment"></canvas><span class="env-watermark">ENVIRONMENT DESIGN / ACTUAL GAME RENDERER</span></div><figure class="art-pinned-frame" id="env-pinned-frame" hidden><img id="env-pinned-image" alt="Pinned environment frame for comparison"><figcaption>PINNED REFERENCE</figcaption></figure></div>
          <div class="art-preview-controls"><label>WEATHER <select data-env-weather><option value="clear">CLEAR</option><option value="rain">RAIN</option><option value="fog">FOG</option><option value="blizzard">BLIZZARD</option><option value="dust">DUST</option><option value="hot">HEAT</option><option value="cold">COLD</option></select></label><button type="button" data-env-action="pin">PIN CURRENT FRAME</button><button type="button" data-env-action="clear-pin">CLEAR PIN</button><button type="button" data-env-action="download-frame">SAVE PREVIEW PNG</button></div>
          <div class="env-canvas-footer"><span>REAR CAMERA · PLAYER AND RIVALS SHOWN FOR SCALE</span><label><input type="checkbox" id="env-animation"> ANIMATE ROAD</label></div>
          ${Review.markup('ENVIRONMENT','Rate the curated environment shown above. For custom component mixtures, restore the original recipe before voting; export custom blends separately.')}
          <div class="env-notice"><b>FOUNDATION PASS</b> · These are previewable track art recipes, not 36 finished or playable tracks. Road geometry is still the shared straight perspective ribbon. The campaign's existing nine tracks and physics remain unchanged.</div>
          <section class="env-shuffle"><div><b>REALITY SHUFFLE PROTOTYPE</b><p>Independent rerolls. Occasionally a combination looks completely normal. No notification is sent to the player; this button is DEV-only.</p></div><div class="env-shuffle-actions"><label>Slots<select data-env-count><option value="1">1 of 5</option><option value="2">2 of 5</option><option value="3" selected>3 of 5</option><option value="4">4 of 5</option><option value="5">All 5</option></select></label><button data-env-action="shuffle">SHUFFLE</button></div></section>
        </div>
        <aside class="env-controls"><div class="env-control-head"><b>TRACK RECIPE</b><small>Pick a location to load its starting parts.</small></div><label class="env-field"><span>TRACK CONCEPT</span><select data-env-preset>${opts(Env.RECIPES)}</select></label>
          <div class="env-slot-title">ENVIRONMENT COMPONENTS <span>5 SLOTS</span></div>
          ${Env.SLOTS.map((slot,i)=>`<label class="env-field"><span><em>${String(i+1).padStart(2,'0')}</em> ${labels[slot]}</span><select data-env-slot="${slot}">${opts(Env.KINDS[slot])}</select></label>`).join('')}
          <div class="env-control-actions"><button data-env-action="restore">RESTORE RECIPE</button><button data-env-action="save">EXPORT RECIPE JSON</button></div>
          <div class="env-status" id="env-status" role="status" aria-live="polite">Selection changes the preview only. Your active run remains untouched.</div>
        </aside>
      </section>
      <footer class="env-footer">DEVELOPMENT SANDBOX ONLY <span>NO NEW PHYSICS · NO NEW SAVE FIELDS · NO CAMPAIGN RANDOMISATION</span></footer>
    </div>`;}
  function dispose(){if(cleanup){const done=cleanup;cleanup=null;done();}}
  function mount(root,loadout){
    dispose();
    const control=new AbortController(),signal=control.signal;
    const canvas=root.querySelector('#env-preview');
    if(!canvas)return;
    let preset='city';let components={...Env.RECIPES[preset]};
    let animated=false,raf=0,clock=0,lastTick=0,feedback=null,weather='clear';
    const renderer=window.ScrapScene.create(canvas,{style:'chunky',camera:'rear'});
    function message(v){root.querySelector('#env-status').textContent=v;}
    function assignPreset(id){
      preset=Env.RECIPES[id]?id:'city';components={};
      for(const k of Env.SLOTS)components[k]=Env.RECIPES[preset][k];
    }
    function render(time=0){
      if(!renderer)return;
      renderer.drawRace({track:preset,time,motion:animated,weather,loadout,
        environment:{preset,overrides:components}});
    }
    function sync(){
      root.querySelector('[data-env-preset]').value=preset;
      for(const k of Env.SLOTS)root.querySelector(`[data-env-slot="${k}"]`).value=components[k];
      const custom=Env.SLOTS.some(k=>components[k]!==Env.RECIPES[preset][k]);
      root.querySelector('#env-custom-label').textContent=custom?'CUSTOM MIX':'CURATED RECIPE';
      root.querySelector('#env-preview-name').textContent=Env.RECIPES[preset].name.toUpperCase();
      canvas.setAttribute('aria-label',`${Env.RECIPES[preset].name}: ${Env.SLOTS.map(k=>components[k]).join(', ')}`);
      render(clock);
      feedback?.refresh();
    }
    function animate(t){
      if(!animated)return;
      if(lastTick)clock+=Math.min(60,t-lastTick);lastTick=t;
      render(clock);raf=requestAnimationFrame(animate);
    }
    function turnMotion(on){
      if(raf)cancelAnimationFrame(raf);raf=0;lastTick=0;animated=on;
      if(animated)raf=requestAnimationFrame(animate);else {clock=0;render(0);}
    }
    function downloadFrame(){
      const url=canvas.toDataURL('image/png');const a=document.createElement('a');
      a.href=url;a.download=`{{GAME_NAME_FILE}}-Environment-${preset}-${weather}.png`;
      document.body.appendChild(a);a.click();a.remove();message('PNG preview exported from the current game renderer.');
    }
    function pinFrame(){
      const frame=root.querySelector('#env-pinned-frame');
      root.querySelector('#env-pinned-image').src=canvas.toDataURL('image/png');
      frame.hidden=false;root.querySelector('.env-stage-comparison').dataset.pinned='true';
      message('Pinned reference frame. Change the recipe, weather or scenery to compare live.');
    }
    function clearPin(){
      root.querySelector('#env-pinned-frame').hidden=true;root.querySelector('#env-pinned-image').removeAttribute('src');
      delete root.querySelector('.env-stage-comparison').dataset.pinned;
      message('Reference frame cleared.');
    }
    function shuffle(){
      const count=Number(root.querySelector('[data-env-count]').value)||3;
      const order=[...Env.SLOTS];
      for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
      for(const slot of order.slice(0,count)){
        const candidates=Object.keys(Env.KINDS[slot]);
        components[slot]=candidates[Math.floor(Math.random()*candidates.length)];
      }
      sync();message(`Reality Shuffle: ${count} components rerolled. The result may look perfectly ordinary.`);
    }
    function exportRecipe(){
      const payload={format:'scrap-prix-environment-recipe',version:1,basePreset:preset,
        name:Env.RECIPES[preset].name+' (Custom)',components:{...components},
        note:'Visual-only DEV recipe. Not a saved run or gameplay track.'};
      const text=JSON.stringify(payload,null,2),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`{{GAME_NAME_FILE}}-environment-${preset}-${++previewIndex}.json`;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1800);
      message('Environment JSON download requested. This does not affect your saved game.');
    }
    root.addEventListener('change',e=>{
      const el=e.target;
      if(el.hasAttribute('data-env-preset')){
        assignPreset(el.value);sync();message(`Loaded ${Env.RECIPES[preset].name} preview. Choose any component to make a custom mix.`);
      } else if(el.hasAttribute('data-env-slot')){
        const key=el.dataset.envSlot;
        if(Env.SLOTS.includes(key)&&Env.KINDS[key][el.value]){components[key]=el.value;sync();message(`${labels[key]} updated; gameplay state unchanged.`);}
      } else if(el.id==='env-animation'){turnMotion(el.checked);}
      else if(el.hasAttribute('data-env-weather')){weather=el.value;render(clock);feedback?.refresh();message('Weather preview: '+weather+'. No gameplay changes.');}
    },{signal});
    root.addEventListener('click',e=>{
      const b=e.target.closest('button[data-env-action]');if(!b)return;
      if(b.dataset.envAction==='restore'){assignPreset(preset);sync();message('Restored the selected track recipe.');}
      else if(b.dataset.envAction==='shuffle')shuffle();
      else if(b.dataset.envAction==='save')exportRecipe();
      else if(b.dataset.envAction==='pin')pinFrame();
      else if(b.dataset.envAction==='clear-pin')clearPin();
      else if(b.dataset.envAction==='download-frame')downloadFrame();
    },{signal});
    feedback=reviewManager.attach(root,{
      current:()=>Env.SLOTS.some(k=>components[k]!==Env.RECIPES[preset][k])?null:{
       id:'env:'+preset,name:Env.RECIPES[preset].name,group:'Environment',
       context:{preset,...components,animated,weather}},
      candidates:()=>Object.keys(Env.RECIPES).map(id=>'env:'+id),
      onNavigate:id=>{const selected=id.slice(4);if(Env.RECIPES[selected]){assignPreset(selected);sync();message('Reviewing '+Env.RECIPES[preset].name+'.');}}
    });
    assignPreset('city');sync();
    cleanup=()=>{control.abort();feedback?.dispose();turnMotion(false);};
  }
  window.ScrapEnvironmentLab=Object.freeze({markup,mount,dispose});
})();
