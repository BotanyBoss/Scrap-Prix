/* Scrap Prix v0.7.21 Batch 1: reusable portal, wormhole and spectral-road visuals.
 * Pure presentation. No gameplay RNG, event selection, rewards or save changes.
 * Canvas coordinates are 480 x 270; stage progression uses replay-local time.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapEventPortals=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
 const smooth=n=>{const q=clamp(n);return q*q*(3-2*q);};
 const phase=(t,a,b)=>smooth((t-a)/(b-a));
 const peak=(t,a,b,c,d)=>phase(t,a,b)*(1-phase(t,c,d));
 const defs={
  teleporter:['Experimental Teleporter','A humming mechanical arch opens, swallows the car, and spits it back onto the track','#61dce5','#f6dea6',6500],
  wormhole:['Wormhole Shortcut','An unstable violet vortex bends the road, briefly removes the car from existence, and opens elsewhere','#b990f5','#ffd099',6500],
  'haunted-road':['Haunted Shortcut','A real side road veers left through crooked grave markers, skeletal trees and an impossible old gate before rejoining the circuit','#a9e7cd','#b9acd8',9000]
 };
 const RECIPES=Object.freeze(Object.fromEntries(Object.entries(defs).map(([id,[title,description,primary,secondary,duration]])=>[id,Object.freeze({id,family:'portal',title,description,primary,secondary,duration})])));
 const recipe=id=>RECIPES[id]||null;
 function sample(id,elapsedMs=0,{mode='preview',outcome='success',motion=true,variant='normal'}={}){
  const r=recipe(id);if(!r)return null;
  const route=mode==='risk'?'risk':mode==='safe'?'safe':'preview';
  // Still previews always show a clear portal without hiding the vehicle.
  const time=!motion?r.duration*.22:route==='preview'?r.duration*.36:clamp(elapsedMs,0,r.duration);
  const t=clamp(time/r.duration),fail=outcome==='fail'||outcome==='failure';
  const stage=id==='haunted-road'?
   route==='preview'?'offered':route==='safe'?'bypass':t<.16?'fork':t<.35?'depart':t<.71?'haunted':t<.91?'rejoin':'aftermath':
   route==='preview'?'offered':t<.27?'approach':route==='safe'?'bypass':t<.46?'enter':t<.65?'transit':t<.84?'exit':'aftermath';
  const strength=route==='safe'?1-phase(t,.25,.79):route==='preview'?.84:peak(t,.01,.16,.89,1);
  return {id,r,time,t,motion,mode:route,fail,rare:variant==='rare',stage,strength,
   charge:phase(t,.05,.32),open:peak(t,.08,.29,.84,.99),
   disappearance:route==='risk'&&motion?phase(t,.29,.45)*(1-phase(t,.64,.80)):0,
   transport:route==='risk'&&motion?peak(t,.36,.49,.63,.75):0,
   entrance:route==='risk'&&motion?peak(t,.20,.36,.43,.60):0,
   exit:route==='risk'&&motion?peak(t,.60,.69,.86,.97):0};
 }
 const line=(c,x,y,X,Y,col,w=1)=>{c.beginPath();c.strokeStyle=col;c.lineWidth=w;c.moveTo(x,y);c.lineTo(X,Y);c.stroke();};
 const ellipse=(c,x,y,rx,ry,col)=>{c.beginPath();c.fillStyle=col;c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.fill();};
 const ring=(c,x,y,rx,ry,col,w=2)=>{c.beginPath();c.strokeStyle=col;c.lineWidth=w;c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.stroke();};
 function polygon(c,points,col){c.beginPath();c.fillStyle=col;points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 function drawArch(c,x,y,scale,r,s){
  const w=40*scale,h=83*scale;
  c.save();c.globalAlpha*=s.strength;
  // Dark heavy metal frame, two visible struts and an identifiable portal opening.
  polygon(c,[[x-w-10,y+5],[x-w-10,y-h+21],[x-w+4,y-h],[x+w-4,y-h],[x+w+10,y-h+21],[x+w+10,y+5],[x+w-1,y+5],[x+w-1,y-h+23],[x-w+1,y-h+23],[x-w+1,y+5]],'#17343f');
  polygon(c,[[x-w-5,y],[x-w-5,y-h+20],[x-w+5,y-h+5],[x+w-5,y-h+5],[x+w+5,y-h+20],[x+w+5,y],[x+w-1,y],[x+w-1,y-h+22],[x-w+1,y-h+22],[x-w+1,y]],'#74979e');
  line(c,x-w+2,y-h+18,x+w-2,y-h+18,r.primary,3*scale);
  for(const side of [-1,1]){
   c.fillStyle='#d2ac64';c.fillRect(x+side*(w+5)-4*scale,y-17*scale,8*scale,5*scale);
   c.fillStyle=r.primary;c.fillRect(x+side*(w+4)-3*scale,y-42*scale,6*scale,8*scale);
  }
  const active=s.mode!=='safe'?s.open:1-phase(s.t,.34,.67);
  if(active>0){c.globalAlpha*=active*.9;
   ellipse(c,x,y-h*.33,w*.78,h*.36,`rgba(49,174,194,${(.24+.28*s.charge).toFixed(3)})`);
   ring(c,x,y-h*.33,w*.75,h*.36,'#bcf9ef',2*scale);
   for(let i=0;i<7;i++){
    const xx=x+(i-3)*w*.19,yy=y-h*.32+Math.sin(i*2.7+s.t*25)*h*.17;
    line(c,xx,yy,xx+Math.sin(s.t*12+i)*7*scale,yy-12*scale,i%2?r.primary:r.secondary,1.1*scale);
   }
  }
  c.restore();
 }
 function drawWormhole(c,x,y,scale,r,s){
  const rx=39*scale,ry=56*scale,angle=s.t*4.9;
  c.save();c.globalAlpha*=s.strength;
  ellipse(c,x,y,rx*.95,ry*.93,'#1d2048');ellipse(c,x,y,rx*.78,ry*.8,'#493579');
  for(let i=0;i<5;i++){
   c.beginPath();c.strokeStyle=['#d9b5ff','#9f80e2','#6cdcea','#ffd498','#cc9fff'][i];c.lineWidth=(4-i*.43)*scale;
   c.ellipse(x,y,rx*(1.08-i*.16),ry*(1.03-i*.145),-0.35+angle*(i%2?-.08:.09),0,Math.PI*2);c.stroke();
  }
  const a=angle*2;for(let i=0;i<9;i++){const theta=i*Math.PI*2/9+a,dist=rx*(.44+.14*Math.sin(s.t*18+i));
   const px=x+Math.cos(theta)*dist,py=y+Math.sin(theta)*dist*1.3;
   line(c,px,py,px+Math.cos(theta+1)*14*scale,py+Math.sin(theta+1)*13*scale,i%3?r.primary:r.secondary,1.2*scale);
  }
  ellipse(c,x,y,rx*.20,ry*.15,'#111c42');
  c.restore();
 }
 // The ghost road is NOT a third teleporter. It branches physically away from
 // the main straight, passes through its own scenery and merges back. The car
 // and camera follow this fixed route, with no steering, physics or RNG changes.
 const HAUNT_SIDE=-1,HAUNT_LATERAL=8.15,HAUNT_DISTANCE=30,HAUNT_DEPTH=.92;
 function hauntAmount(u){
  if(u<=.065||u>=.935)return 0;
  if(u<.30)return smooth((u-.065)/.235);
  if(u<.73)return 1;
  return 1-smooth((u-.73)/.205);
 }
 const hauntLane=u=>HAUNT_SIDE*HAUNT_LATERAL*hauntAmount(u);
 const hauntWidth=u=>2.2*smooth((u-.055)/.125)*(1-smooth((u-.825)/.135));
 function hauntedRoute(id,elapsedMs=0,{mode='preview',motion=true}={}){
  if(id!=='haunted-road')return null;
  const duration=RECIPES['haunted-road'].duration;
  const t=clamp(elapsedMs/duration);
  const progress=mode==='risk'&&motion?t:0;
  return Object.freeze({id,mode,t,progress,cameraLane:mode==='risk'&&motion?hauntLane(progress):0,stage:mode==='safe'?'bypass':mode==='preview'?'offered':t<.16?'fork':t<.35?'depart':t<.71?'haunted':t<.91?'rejoin':'aftermath'});
 }
 // Deterministic artwork helpers are intentionally simple: the same fixed
 // road-space objects can be rendered at any DEV timeline position.
 function drawGravestone(c,x,y,scale,index){
  const w=(9+(index%3)*3)*scale,h=(13+(index%4)*3)*scale;
  ellipse(c,x,y+1,9*scale,2.1*scale,'rgba(11,24,32,.47)');
  polygon(c,[[x-w*.55,y],[x-w*.55,y-h*.74],[x-w*.36,y-h],[x+w*.36,y-h],[x+w*.55,y-h*.74],[x+w*.55,y]],'#253a45');
  polygon(c,[[x-w*.36,y-1.7*scale],[x-w*.36,y-h*.77],[x-w*.20,y-h*.88],[x+w*.18,y-h*.9],[x+w*.37,y-h*.76],[x+w*.37,y-1.7*scale]],'#829c9a');
  line(c,x,y-h*.72,x,y-h*.39,'#344e55',1.4*scale);
  line(c,x-3.2*scale,y-h*.56,x+3.2*scale,y-h*.56,'#344e55',1.3*scale);
 }
 function drawDeadTree(c,x,y,scale,index){
  const h=(37+index%4*11)*scale;
  ellipse(c,x,y,17*scale,3*scale,'rgba(9,18,29,.45)');
  line(c,x,y,x+(index%2?5:-5)*scale,y-h,'#1b2938',6*scale);
  const top=x+(index%2?5:-5)*scale;
  line(c,top,y-h*.88,top-16*scale,y-h*1.12,'#223344',3*scale);
  line(c,top,y-h*.63,top+20*scale,y-h*.86,'#223344',3*scale);
  line(c,top-11*scale,y-h*1.03,top-13*scale,y-h*1.24,'#273748',2*scale);
  line(c,top+15*scale,y-h*.79,top+20*scale,y-h*.98,'#273748',2*scale);
 }
 function drawCrookedGate(c,x,y,scale){
  const w=38*scale,h=61*scale;
  // An actual crooked stone arch over the SIDE road, not a floating green door.
  polygon(c,[[x-w-7*scale,y+3*scale],[x-w-10*scale,y-h],[x-w+2*scale,y-h-10*scale],[x-w+11*scale,y+1*scale]],'#263642');
  polygon(c,[[x+w-10*scale,y+1*scale],[x+w-2*scale,y-h-10*scale],[x+w+10*scale,y-h],[x+w+7*scale,y+3*scale]],'#263642');
  polygon(c,[[x-w-13*scale,y-h+6*scale],[x-w+5*scale,y-h-13*scale],[x+w-4*scale,y-h-17*scale],[x+w+13*scale,y-h+7*scale],[x+w-1*scale,y-h+2*scale],[x+w-3*scale,y-h-5*scale],[x-w+6*scale,y-h-2*scale],[x-w+2*scale,y-h+7*scale]],'#41525b');
  line(c,x-w+5*scale,y-h+1*scale,x+w+4*scale,y-h-7*scale,'#9cbea9',1.6*scale);
  for(const side of [-1,1]){
   const px=x+side*w;
   line(c,px,y-h*.9,px,y-h*.57,'#728a86',1.3*scale);
   ellipse(c,px,y-h*.59,5.3*scale,7*scale,'rgba(115,222,177,.40)');
   ellipse(c,px,y-h*.59,2.5*scale,4.3*scale,'#c8f4ce');
  }
 }
 function drawHaunted(c,project,r,s,layer){
  if(typeof project!=='function')return;
  const route=hauntedRoute('haunted-road',s.time,{mode:s.mode,motion:s.motion});
  const progress=route.progress;
  const at=(q)=>HAUNT_DEPTH+(q-progress)*HAUNT_DISTANCE;
  const path=(lane,z)=>project(lane+hauntLane(progress+(z-HAUNT_DEPTH)/HAUNT_DISTANCE),z);
  const visibility=s.mode==='safe'?s.strength:s.mode==='preview'?.96:1;
  c.save();c.globalAlpha*=visibility;
  if(layer==='under'){
   // Passing the cemetery gate temporarily turns the ordinary race into an
   // impossible twilight road. This is only a render overlay, never weather.
   const twilight=s.mode==='risk'?peak(s.t,.09,.32,.72,.96):0;
   if(twilight>0){
    c.save();c.globalAlpha*=twilight*.66;
    c.fillStyle='#15182d';c.fillRect(0,0,480,270);
    c.fillStyle='rgba(32,44,74,.27)';c.fillRect(0,0,480,105);
    c.restore();
   }
   // Full perspective-projected road ribbon. Its centreline forms a long S-turn;
   // the normal road still continues straight beneath it.
   const step=.23;
   for(let i=131;i>=0;i--){
    const zn=.80+i*step,zf=zn+step+.007;
    const u=progress+(zn-HAUNT_DEPTH)/HAUNT_DISTANCE,v=progress+(zf-HAUNT_DEPTH)/HAUNT_DISTANCE;
    const a=hauntWidth(u),b=hauntWidth(v);
    if(a<.02&&b<.02)continue;
    const p1=path(-a,zn),p2=path(a,zn),p3=path(b,zf),p4=path(-b,zf);
    polygon(c,[[p1.x,p1.y],[p2.x,p2.y],[p3.x,p3.y],[p4.x,p4.y]],'#192b38');
    const p5=path(-a*.89,zn),p6=path(a*.89,zn),p7=path(b*.89,zf),p8=path(-b*.89,zf);
    polygon(c,[[p5.x,p5.y],[p6.x,p6.y],[p7.x,p7.y],[p8.x,p8.y]],'#344a53');
    if(i%5===0&&a>1&&b>1){
     const e=path(-a*.80,zn),f=path(-b*.80,zf),g=path(a*.80,zn),h=path(b*.80,zf);
     line(c,e.x,e.y,f.x,f.y,'#a4d9c9',Math.max(.65,1.8/zn));
     line(c,g.x,g.y,h.x,h.y,'#a4d9c9',Math.max(.65,1.8/zn));
    }
   }
   // Uneven cobblestones make it obviously old and haunted, not a recoloured
   // section of the racing tarmac.
   for(let i=0;i<50;i++){
    const q=.15+i*.013,z=at(q);if(z<.9||z>22)continue;
    const w=hauntWidth(q);if(w<.9)continue;
    const k=i%3-1,p=path(k*.69,z),sc=clamp(3.1/z,.22,1.35);
    line(c,p.x-5*sc,p.y,p.x+5*sc,p.y-1*sc,i%5===0?'rgba(169,235,204,.48)':'rgba(123,148,155,.59)',Math.max(.65,sc));
   }
   // World-anchored headstones / leafless trees scroll past with road depth.
   for(let i=21;i>=0;i--){
    const q=.17+i*.029,z=at(q);if(z<.9||z>24)continue;
    const sc=clamp(3.7/z,.20,2.1),side=i%2===0?-1:1;
    const lane=side*(2.6+(i%3)*.24),p=path(lane,z);
    if(i%5===0)drawDeadTree(c,p.x,p.y,sc,i);
    else drawGravestone(c,p.x,p.y,sc,i);
    if(i%3===0){const glow=path(side*2.15,z);
     ellipse(c,glow.x,glow.y-10*sc,2.9*sc,4.4*sc,'rgba(166,252,213,.58)');}
   }
   const gateZ=at(.14);
   if(gateZ>.9&&gateZ<23){const gate=path(0,gateZ);drawCrookedGate(c,gate.x,gate.y,clamp(3.5/gateZ,.20,1.6));}
   // The fork is lit by small, unnatural lamps; no sign is necessary to tell
   // the driver this is an actual diverging route.
   c.restore();return;
  }
  // Thin screen-space mist is an atmosphere layer, not the road itself.
  // Keep car silhouettes readable and allow the side route to fade away on Safe.
  const intensity=s.mode==='risk'?(peak(s.t,.13,.35,.73,.94)):.25*s.strength;
  c.globalAlpha*=.9;
  for(let i=0;i<15;i++){
   const q=.15+i*.043,z=at(q);
   if(z<.95||z>22)continue;
   const p=path(Math.sin(i*2.1)*1.3,z),sc=clamp(3.6/z,.20,1.7);
   const sway=s.motion?Math.sin(s.time*.0015+i*1.9)*4*sc:0;
   ellipse(c,p.x+sway,p.y-11*sc,13*sc,4*sc,`rgba(161,214,200,${(.10+.07*intensity).toFixed(3)})`);
   if(i%4===0){ellipse(c,p.x+sway+4*sc,p.y-13*sc,3.1*sc,5*sc,`rgba(192,235,219,${(.16+.12*intensity).toFixed(3)})`);}
  }
  // One silent roadside onlooker gives the scene an unsettling cartoon beat.
  // It grows as the car approaches, then vanishes behind the player.
  if(s.mode==='risk'&&s.t>.29&&s.t<.73){
   const q=.61,z=at(q);
   if(z>.96&&z<15){
    const p=path(2.62,z),sc=clamp(4.1/z,.24,1.6);
    c.save();c.globalAlpha*=peak(s.t,.28,.40,.61,.73)*.90;
    polygon(c,[[p.x-9*sc,p.y],[p.x-7*sc,p.y-19*sc],[p.x-4*sc,p.y-30*sc],
      [p.x+5*sc,p.y-29*sc],[p.x+8*sc,p.y-18*sc],[p.x+10*sc,p.y]],'#172535');
    ellipse(c,p.x,p.y-33*sc,7*sc,9*sc,'#253e48');
    for(const side of [-1,1])ellipse(c,p.x+side*2.5*sc,p.y-34*sc,1.25*sc,1.1*sc,'#bff2cf');
    c.restore();
   }
  }
  // Success is a clean escape. Failure produces spectral hands and a short
  // final jolt, representing the existing deterministic penalty, not adding it.
  if(s.mode==='risk'&&s.fail&&s.t>.72&&s.t<.93){
   const a=peak(s.t,.72,.78,.86,.94);
   const hand=path(0,1.9);c.globalAlpha*=a;
   for(const offset of [-23,18]){
    line(c,hand.x+offset,hand.y+10,hand.x+offset-3,hand.y-14,'#9ccebd',4);
    for(let k=-1;k<=1;k++)line(c,hand.x+offset-3,hand.y-14,hand.x+offset-3+k*7,hand.y-22-((k+2)%2)*3,'#c8efdc',2);
   }
  }
  c.restore();
 }
 function render(c,{id,elapsedMs=0,variant='normal',motion=true,mode='preview',outcome='success',project=null,layer='over'}={}){
  const s=sample(id,elapsedMs,{variant,motion,mode,outcome});if(!s)return false;
  if(layer!=='over'&&layer!=='under')return true;
  const r=s.r,p=project||((lane,z)=>({x:240+60*lane/z,y:82+148/z}));
  c.save();
  if(id==='haunted-road'){drawHaunted(c,p,r,s,layer);c.restore();return true;}
  const pos=p(0,2.3),x=pos.x,y=pos.y+9,scale=.85;
  if(layer==='under'){
   c.save();c.globalAlpha*=s.strength*.7;
   ellipse(c,x,y,42*scale,9*scale,`rgba(36,42,62,.43)`);
   ring(c,x,y,46*scale,12*scale,r.primary,2);
   if(s.mode==='risk'&&s.exit>0){const out=p(s.fail?1.45:-.65,2.05);ring(c,out.x,out.y,39*s.exit,10*s.exit,s.fail?'#f3a775':r.secondary,2.5);}
   c.restore();
  }else{
   if(id==='teleporter')drawArch(c,x,y,scale,r,s);else drawWormhole(c,x,y-32*scale,scale,r,s);
   if(s.mode==='risk'){
    c.save();c.globalAlpha*=s.transport*.44;
    // Screen-space streaks imply high speed without modifying deterministic car/race state.
    for(let i=0;i<16;i++){
     const xx=(i*37)%480,yy=76+(i*17)%150;
     line(c,xx,yy,xx+(xx<240?-1:1)*(12+i%4*7),yy+10,r.primary,1+(i%3)*.6);
    }
    c.restore();
    if(s.exit>0){const exit=p(s.fail?1.45:-.65,2.05),ex=exit.x,ey=exit.y-31;
     c.save();c.globalAlpha*=s.exit;
     if(id==='teleporter')ring(c,ex,ey,30,45,s.fail?'#ef9775':r.secondary,3);
     else ring(c,ex,ey,33,47,s.fail?'#f0a06b':r.primary,3);
     for(let j=0;j<7;j++){const a=j*Math.PI*2/7+s.t*6;line(c,ex+Math.cos(a)*19,ey+Math.sin(a)*28,ex+Math.cos(a)*36,ey+Math.sin(a)*43,s.fail?'#f6a473':r.secondary,1.6);}
     c.restore();
    }
   }
  }
  c.restore();return true;
 }
 function playerPose(id,elapsedMs,{mode='preview',outcome='success',motion=true}={}){
  const s=sample(id,elapsedMs,{mode,outcome,motion});if(!s)return null;
  if(s.mode!=='risk'||!motion)return {alpha:1,scale:1,x:0,y:0};
  if(id==='haunted-road'){
   // The haunted shortcut is physically travelled, not teleported. Keep the
   // car visible through the full fork/parallel/rejoin sequence.
   const mist=peak(s.t,.18,.38,.77,.94),jolt=s.fail?peak(s.t,.72,.77,.83,.91):0;
   return {alpha:1-.20*mist,scale:1,x:jolt*Math.sin(s.t*70)*3,y:-2*mist+Math.sin(s.t*22)*1.2*mist};
  }
  const t=s.t,vanish=phase(t,.31,.45),returning=phase(t,.62,.80);
  const alpha=clamp(1-vanish+returning);
  const scale=clamp(1-.45*vanish+.45*returning,.5,1);
  const dir=id==='wormhole'?1:-1;
  const offset=dir*18*peak(t,.28,.43,.68,.89)*(s.fail?1.45:1);
  const hop=-12*peak(t,.3,.42,.63,.79);
  return {alpha,scale,x:offset,y:hop};
 }
 return Object.freeze({RECIPES,recipe,sample,render,playerPose,hauntedRoute});
});
