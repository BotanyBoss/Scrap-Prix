/* DEV-only composition. The scene supplies its actual track palette and sky. */
(function(){
  const frame=createRaceFrames();
  let stageRig=null,stagePlan=null,stageKey='';
  function ordinarySide(ctx,shot,options){
    if(shot.camera!=='side'||!['grid','drive'].includes(shot.family))return false;
    const key=JSON.stringify(options.loadout);
    if(stageKey!==key){
      stageKey=key;stageRig=ScrapSideStage.createRig(options.loadout,Pipeline);
    }
    if(!stageRig)return false;
    const name=shot.stationary?'idle':shot.family==='grid'?'accelerate':'cruise';
    if(!stagePlan||stagePlan.name!==name||stagePlan.duration!==shot.durationMs)
      stagePlan=ScrapSideStage.preset(name,{duration:shot.durationMs,speed:86,bounce:1.6,lead:16,follow:700},false);
    const pose=ScrapSideStage.draw(ctx,stageRig,stagePlan,options.time-shot.startMs,{reduced:!options.motion});
    ctx.canvas.dataset.sideStage=JSON.stringify({loadout:stageRig.loadout,wheels:stageRig.wheels.length,pose});
    return true;
  }
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
  // Reuse the live scene's painted skyline (including the venue and weather).
  // Mirror at tile boundaries so a long tracking move has no exposed edges.
  const skyline=document.createElement('canvas');
  skyline.width=480;skyline.height=92;
  const skylineCtx=skyline.getContext('2d');
  function horizon(ctx,distance){
    skylineCtx.drawImage(ctx.canvas,0,0,ctx.canvas.width,ctx.canvas.height*92/270,0,0,480,92);
    const tile=Math.floor(distance/480),offset=distance%480;
    for(let i=-1;i<=0;i++){
      ctx.save();ctx.translate(offset+i*480,0);
      if((tile-i)%2){ctx.translate(480,0);ctx.scale(-1,1);}
      ctx.drawImage(skyline,0,0);ctx.restore();
    }
  }
  function shape(ctx,colour,points){
    ctx.fillStyle=colour;ctx.beginPath();ctx.moveTo(...points[0]);
    for(const p of points.slice(1))ctx.lineTo(...p);
    ctx.closePath();ctx.fill();
  }
  function sideTrack(ctx,s,t){
    horizon(ctx,t*.019);
    ctx.fillStyle=s.road;ctx.fillRect(0,133,480,106);
    ctx.fillStyle=s.curb;ctx.fillRect(0,132,480,4);
    ctx.fillStyle=s.ink;ctx.fillRect(0,240,480,4);
    for(let x=-130+(t*.083)%130;x<480;x+=130){
      ctx.fillStyle=s.near;ctx.fillRect(x,110,3,22);
      ctx.fillStyle=s.mark;ctx.fillRect(x,110,66,4);
    }
    for(let x=-90+(t*.20)%90;x<480;x+=90){
      ctx.fillStyle=s.mark;ctx.fillRect(x,205,33,3);
      ctx.fillStyle=s.curb;ctx.fillRect(x,235,45,4);
    }
    // Close shoulder dashes cross the lens faster than the far rail.
    for(let x=-140+(t*.31)%140;x<480;x+=140){
      shape(ctx,s.near,[[x,258],[x+47,258],[x+41,262],[x-6,262]]);
    }
  }
  // Front camera looks back down the road over the left shoulder of the car.
  // All paint and shoulder posts converge behind the subject at the same point.
  function frontTrack(ctx,s,t,finish,progress){
    horizon(ctx,t*.004);
    const point=(lane,depth)=>[338+(-180+lane*350)*depth,87+197*depth];
    function strip(colour,left,right,near,far){
      shape(ctx,colour,[point(left,near),point(right,near),point(right,far),point(left,far)]);
    }
    strip(s.road,-1,1,1.6,0);
    for(const edge of [-1,1])strip(s.curb,edge-.018,edge+.018,1.5,0);
    for(let i=16;i>=0;i--){
      // The world recedes in a forward-facing tracking shot.
      const spacing=.77;
      const z=.66+i*spacing+(t*.002)%spacing,near=1/z,far=1/(z+.28);
      strip(s.mark,.14,.16,near,far);
      for(const edge of [-1,1]){
        const [x,y]=point(edge*1.08,near);
        ctx.fillStyle=s.ink;ctx.fillRect(x,y-22*near,3*near,22*near);
        ctx.fillStyle=s.mark;ctx.fillRect(x,y-21*near,3*near,6*near);
      }
    }
    if(finish){
      const depth=1/(.7+progress*2.2);
      for(let i=0;i<16;i++)for(let j=0;j<2;j++)
        strip((i+j)%2?s.ink:'#f7efd8',-1+i/8,-1+(i+1)/8,depth+j*.025,depth+(j+1)*.025);
    }
  }
  function trackside(ctx,style,shot,options){
    delete ctx.canvas.dataset.sideStage;
    if(ordinarySide(ctx,shot,options))return;
    const moving=options.motion&&!shot.stationary&&!['dnf','dns'].includes(shot.family);
    const t=moving?options.time:0;
    const progress=moving?Math.max(0,Math.min(1,(t-shot.startMs)/shot.durationMs)):.5;
    const launch=shot.family==='grid',side=shot.camera==='side';
    if(side)sideTrack(ctx,style,launch?t*progress:t);
    else frontTrack(ctx,style,t,shot.family==='finish',progress);
    if(shot.source?.id==='heatwave'){
      // Refract the actual distant track behind the car as the heat arrives.
      const intensity=shot.family==='approach'?progress:1;
      ctx.fillStyle='rgba(249,164,72,'+(.16*intensity)+')';
      ctx.fillRect(0,79,480,47);
      for(let band=0;band<8;band++){
        const y=85+band*4,offset=Math.round(Math.sin(t*.005+band)*3*intensity);
        ctx.drawImage(ctx.canvas,4,y,472,2,4+offset,y,472,2);
      }
    }
    const x=side?(launch?340-135*progress:223+15*Math.sin(t*.0009)):190+8*Math.sin(t*.0008);
    const zoom=side?(launch?1.45+progress*.24:1.82):2.24;
    const y=side?204:210;
    ctx.fillStyle='#19252b80';ctx.beginPath();ctx.ellipse(x,y,43*zoom,4*zoom,0,0,Math.PI*2);ctx.fill();
    vehicle(ctx,shot,options.loadout,x,y+Math.sin(t*.018)*.8,zoom,moving,t);
  }
  function applyHUD(shot,wrap,finish){
    const key=shot.startMs+'/'+shot.family;
    if(wrap.dataset.shotKey!==key){
      wrap.dataset.shotKey=key;
      wrap.dataset.shot=shot.family;
      wrap.dataset.camera=shot.camera;
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
