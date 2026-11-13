/* DEV-only composition. The scene supplies its actual track palette and sky. */
(function(){
  const frame=createRaceFrames();
  function vehicle(ctx,shot,loadout,x,y,zoom,motion,time){
    const damage=shot.family==='consequence'?shot.source.damageBySlot:{};
    const wear=Object.keys(damage).sort((a,b)=>damage[b]-damage[a])[0];
    const pixels=frame(loadout,shot.camera,damage[wear]>0?wear:null);
    ctx.save();
    ctx.translate(Math.round(x),Math.round(y));ctx.scale(zoom,zoom);
    if(pixels)ctx.drawImage(pixels,-82,-84);
    else ScrapVehicleArt.draw(ctx,{x:0,y:0,w:164,h:113,loadout,comboBodywork:true,
      view:shot.camera==='front'?'garage':shot.camera,style:'chunky',motion,time});
    ctx.restore();
  }
  function trackside(ctx,style,shot,options){
    const stopped=shot.stationary||['dnf','dns'].includes(shot.family);
    const t=options.motion&&!stopped?options.time:0;
    ctx.fillStyle=style.road;ctx.fillRect(0,139,480,102);
    ctx.fillStyle=style.curb;ctx.fillRect(0,137,480,4);
    ctx.fillStyle=style.mark;
    for(let x=-64+(t*.14)%96;x<480;x+=96)ctx.fillRect(x,215,52,3);
    const finish=shot.family==='finish',grid=shot.family==='grid';
    if(finish||grid){
      ctx.fillStyle=style.ink;ctx.fillRect(52,90,5,106);
      for(let i=0;i<24;i++){
        ctx.fillStyle=(i%8+Math.floor(i/8))%2?'#18292e':'#eee5bd';
        ctx.fillRect(57+i%8*5,90+Math.floor(i/8)*5,5,5);
      }
    }
    const close=shot.family==='consequence', zoom=close?2.1:1.45;
    const x=options.motion&&!stopped?220+28*Math.sin(t*.0008):235;
    ctx.fillStyle='#19252b80';ctx.beginPath();ctx.ellipse(x,211,45*zoom,5,0,0,Math.PI*2);ctx.fill();
    vehicle(ctx,shot,options.loadout,x,211+(t&&!stopped?Math.sin(t*.016):0),zoom,options.motion,t);
  }
  function applyHUD(shot,wrap,finish){
    const key=shot.startMs+'/'+shot.family;
    if(wrap.dataset.shotKey!==key){
      wrap.dataset.shotKey=key;
      wrap.dataset.shot=shot.family;
      const strip=wrap.querySelector('.race-condition-strip');
      strip.setAttribute('aria-label','Component condition');
      for(const row of strip.children){
        const slot=row.dataset.slot,value=(shot.finish?.conditionAfterRace||shot.condition)[slot];
        row.title=ScrapPresentation.pretty(slot)+' '+value+'%';
        row.querySelector('progress').value=value;
        row.querySelector('progress').setAttribute('aria-label',row.title);
        row.querySelector('b').textContent=value+'%';
      }
    }
    if(!finish){
      document.getElementById('position-label').textContent='CAMERA';
      document.getElementById('position-value').textContent=shot.camera.toUpperCase();
    }
    if(shot.family==='consequence'){
      const e=shot.source;
      document.getElementById('event-label').textContent='COMPONENT REPORT';
      document.getElementById('event-copy').textContent=Object.entries(e.damageBySlot)
        .map(([slot,n])=>ScrapPresentation.pretty(slot)+' -'+n).join(' / ')+
        ' | Performance '+(e.scoreDelta>0?'+':'')+e.scoreDelta+' | Sponsorship \u00a3'+e.credits;
    }
  }
  window.ScrapOrdinaryFilm={vehicle,trackside,applyHUD};
})();
