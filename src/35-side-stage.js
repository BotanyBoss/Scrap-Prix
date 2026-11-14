/* Pure motion sampling plus a small 2D stage. No engine, RNG or persistent clock. */
(function(root){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=q=>q*q*(3-2*q);
  const defaults={duration:8000,speed:100,easing:1,bounce:2,follow:900,lead:24};
  function config(input={}){
    const out={};
    for(const [key,min,max] of [['duration',800,16000],['speed',0,180],['easing',0,1],
      ['bounce',0,6],['follow',100,2400],['lead',-50,50]]){
      const n=Number(input[key]??defaults[key]);
      if(!Number.isFinite(n))throw Error('Invalid '+key);
      out[key]=clamp(n,min,max);
    }
    return out;
  }
  // The same donor hubs/sockets used by the accepted pipeline. Geometry is
  // reduced to mounting data once; no mesh is rasterised for this stage.
  function createRig(loadout,pipeline){
    if(!Object.entries(pipeline.choices).every(([slot,ids])=>ids.includes(loadout[slot])))return null;
    const source=pipeline.assemble(loadout);
    const unit=22,centre=(Math.min(...source.axles)+Math.max(...source.axles))/2;
    const radius=source.wheels[0][1]*unit;
    const socket=([x,y,z])=>({x:-(z-centre)*unit,y:-y*unit});
    const wheels=source.wheels.map(([x,y,z])=>({...socket([x,y,z]),far:x<0,radius}));
    const xs=wheels.map(w=>w.x);
    return {loadout:{...loadout},wheels,radius,front:Math.min(...xs),rear:Math.max(...xs),
      engine:socket(source.engine),gadget:socket(source.gadget)};
  }
  function preset(name,input={},illustrative=true){
    const c=config(input),d=c.duration;
    const cue=(subject,action,start,duration,extra={})=>({subject,action,start,duration,...extra});
    const cues=[cue('road','speed',0,0,{from:c.speed,to:c.speed}),
      cue('camera','settle',0,c.follow,{intensity:c.lead})];
    if(name==='idle')cues[0]={...cues[0],from:0,to:0};
    if(name==='accelerate'||name==='accelerate-brake'){
      cues[0]=cue('road','speed',0,d*.38,{from:0,to:c.speed});
      if(name==='accelerate-brake')cues.push(cue('road','speed',d*.62,d*.30,{from:c.speed,to:0}));
    }
    const actions={bump:'bounce',jump:'jump',impact:'impact'};
    if(actions[name]){
      if(!illustrative)throw Error('Event motion requires an explicit illustrative stage preset');
      cues.push(cue('body',actions[name],d*.30,d*.48,{intensity:name==='jump'?42:name==='impact'?5:c.bounce*2,
        source:{kind:'illustration',key:name,outcome:'motion-study'}}));
    }
    return {version:1,name,config:c,duration:d,cues,illustrative};
  }
  function sample(plan,elapsed,reduced=false){
    const c=plan.config,t=clamp(Number.isFinite(elapsed)?elapsed:0,0,plan.duration);
    // Integrate each velocity ramp analytically, so wheel angle and road offset
    // are independent of frame rate and seek history.
    let distance=0,speed=0,previous=0,lastSpeed=0;
    const ramps=plan.cues.filter(cue=>cue.subject==='road').sort((a,b)=>a.start-b.start);
    for(const cue of ramps){
      if(t<cue.start)break;
      distance+=lastSpeed*Math.max(0,cue.start-previous)/1000;
      const length=Math.min(t-cue.start,cue.duration),q=cue.duration?length/cue.duration:1;
      const ease=(1-c.easing)*q+c.easing*smooth(q);
      const integral=(1-c.easing)*q*q/2+c.easing*(q*q*q-q*q*q*q/2);
      distance+=(cue.from*length+(cue.to-cue.from)*cue.duration*integral)/1000;
      speed=cue.from+(cue.to-cue.from)*ease;
      previous=cue.start+length;lastSpeed=speed;
    }
    distance+=lastSpeed*(t-previous)/1000;
    let bodyY=-Math.sin(distance*.11)*c.bounce*Math.min(1,speed/40),roll=Math.sin(distance*.07)*.012;
    let lift=0,shudder=0,squash=1,action=speed?'travel':'hold',camera=0;
    for(const cue of plan.cues){
      const q=clamp((t-cue.start)/Math.max(1,cue.duration),0,1);
      if(cue.subject==='camera')camera=cue.intensity*smooth(q);
      if(cue.subject!=='body'||t<cue.start||t>=cue.start+cue.duration)continue;
      action=cue.action;
      if(cue.action==='bounce'){bodyY-=Math.sin(q*Math.PI*2)*cue.intensity*(1-q);roll+=Math.sin(q*Math.PI*2)*.035;}
      if(cue.action==='impact'){
        shudder=Math.sin(q*Math.PI*12)*cue.intensity*(1-q)*(1-q);
        bodyY+=Math.sin(q*Math.PI*6)*cue.intensity*(1-q);
      }
      if(cue.action==='jump'){
        if(q<.18){const p=Math.sin(q/.18*Math.PI);bodyY+=p*4;squash=1-p*.12;action='anticipation';}
        else if(q<.70){const p=(q-.18)/.52;lift=4*p*(1-p)*cue.intensity;roll+=Math.sin(p*Math.PI*2)*.08;action='airborne';}
        else{const p=(q-.70)/.30,w=Math.sin(p*Math.PI*3)*(1-p);bodyY+=w*6;squash=1-w*.12;action='landing';}
      }
    }
    if(reduced){distance=0;speed=0;bodyY=0;roll=0;lift=0;shudder=0;squash=1;camera=c.lead;action='reduced motion';}
    return {time:t,distance,speed,bodyY,roll,lift,shudder,squash,camera,action,
      x:238+camera+shudder,ground:211,road:distance+camera,
      middle:distance*.32+camera,far:distance*.09+camera};
  }
  function wheelPose(rig,pose){
    return rig.wheels.map(w=>({...w,x:pose.x+w.x+(w.far?4:0),
      y:pose.ground-w.radius-pose.lift-(w.far?3:0),angle:-pose.distance/w.radius}));
  }
  function draw(ctx,rig,plan,time,{reduced=false,guides=false}={}){
    const p=sample(plan,time,reduced),wheels=wheelPose(rig,p);
    const ink='#253e48',cream='#f2e7c9';
    function line(x,y,xx,yy,colour,width=1){
      ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();
    }
    function poly(points,fill){
      ctx.fillStyle=fill;ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.beginPath();
      points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();
    }
    function wheel(w){
      ctx.save();ctx.translate(w.x,w.y);
      ctx.fillStyle=w.far?'#61737a':ink;ctx.beginPath();ctx.arc(0,0,w.radius,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=cream;ctx.lineWidth=rig.loadout.tyres==='speed-slicks'?1:2;
      ctx.beginPath();ctx.arc(0,0,w.radius-3,0,Math.PI*2);ctx.stroke();
      ctx.rotate(w.angle);
      const spokes=rig.loadout.tyres==='skinny-spokes'?8:4;
      for(let i=0;i<spokes;i++){const a=i*Math.PI*2/spokes;line(0,0,Math.cos(a)*(w.radius-4),Math.sin(a)*(w.radius-4),cream,1.5);}
      ctx.fillStyle='#d5a958';ctx.fillRect(-2,-2,4,4);ctx.restore();
    }
    ctx.save();
    ctx.fillStyle='#dfebe6';ctx.fillRect(0,0,480,270);
    ctx.fillStyle='#afc3bd';ctx.fillRect(0,135,480,135);
    for(let x=-180+p.far%180;x<480;x+=180){
      ctx.fillStyle='#becfc7';ctx.beginPath();ctx.moveTo(x-45,135);ctx.lineTo(x+40,85);ctx.lineTo(x+145,135);ctx.fill();
    }
    for(let x=-110+p.middle%110;x<480;x+=110){
      ctx.fillStyle='#789893';ctx.fillRect(x,123,3,31);ctx.fillRect(x,124,52,3);
    }
    ctx.fillStyle='#52696c';ctx.fillRect(0,166,480,68);
    line(0,211,480,211,'#d8d3b8',1);
    for(let x=-80+p.road%80;x<480;x+=80){ctx.fillStyle=cream;ctx.fillRect(x,227,28,2);}
    ctx.fillStyle='#31464b35';ctx.beginPath();ctx.ellipse(p.x,213,(rig.rear-rig.front)/2+19,4,0,0,Math.PI*2);ctx.fill();
    wheels.filter(w=>w.far).forEach(wheel);
    // Suspension links move between fixed hubs and the bouncing chassis.
    for(const w of wheels.filter(w=>!w.far)){
      line(w.x,w.y,p.x+w.x-p.x,p.ground-rig.radius-8+p.bodyY-p.lift,cream,3);
    }
    ctx.save();ctx.translate(p.x,p.ground-rig.radius-7+p.bodyY-p.lift);ctx.rotate(p.roll);ctx.scale(1,p.squash);
    const f=rig.front-13,r=rig.rear+14,needle=rig.loadout.chassis==='needle-frame',long=rig.loadout.chassis==='longbody';
    poly([[f,0],[f+7,-(needle?8:17)],[f+33,-(needle?14:22)],[r-20,-(long?27:20)],[r,-15],[r,4],[f,4]],'#69a6a2');
    line(f+9,-3,r-5,-3,cream,3);
    // Equipment remains mounted to the body, with separate recognizable cues.
    const ex=rig.engine.x,ey=rig.engine.y+rig.radius+7;
    ctx.fillStyle='#cc805e';ctx.strokeStyle=ink;ctx.lineWidth=2;
    const engineWidth={'stock-engine':17,'inline-four':25,v8:31}[rig.loadout.engine];
    ctx.fillRect(ex-engineWidth/2,ey-14,engineWidth,14);ctx.strokeRect(ex-engineWidth/2,ey-14,engineWidth,14);
    for(let i=0;i<(rig.loadout.engine==='v8'?4:2);i++)line(ex-engineWidth/2+4+i*6,ey-11,ex-engineWidth/2+4+i*6,ey-4,cream,2);
    const gx=rig.gadget.x,gy=rig.gadget.y+rig.radius+7;
    if(rig.loadout.gadget==='impact-foam'){ctx.fillStyle='#dfb65e';ctx.fillRect(gx-11,gy-14,22,14);ctx.strokeRect(gx-11,gy-14,22,14);}
    else{
      line(gx,gy,gx,gy-13,ink,3);ctx.strokeStyle=ink;ctx.beginPath();ctx.arc(gx,gy-19,9,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<3;i++){const a=i*Math.PI*2/3;line(gx,gy-19,gx+Math.cos(a)*7,gy-19+Math.sin(a)*7,'#c39543',3);}
      if(rig.loadout.gadget==='cooling-fan')line(gx-11,gy-29,gx+11,gy-29,ink,3);
    }
    ctx.restore();
    wheels.filter(w=>!w.far).forEach(wheel);
    if(guides){
      line(0,p.ground,480,p.ground,'#d67358');
      for(const w of wheels){line(w.x-3,w.y,w.x+3,w.y,'#e36f53');line(w.x,w.y-3,w.x,w.y+3,'#e36f53');}
      line(p.x,146,p.x,217,'#234651',1);
    }
    ctx.fillStyle=ink;ctx.font='10px monospace';ctx.fillText('TEMPORARY MOTION STUDY',12,254);
    ctx.restore();
    return p;
  }
  root.ScrapSideStage=Object.freeze({defaults,config,createRig,preset,sample,wheelPose,draw});
})(globalThis);
