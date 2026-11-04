/* Scrap Prix v0.7.15 Gate D: anchored descent, comic impacts and rival reactions.
 * Gate A crossing, Gate B launching, Gate C lifting improvements remain unchanged.
 * Inputs: visual id, elapsed presentation time, cosmetic variant, reduced-motion.
 * Never consults RNG, gameplay state, saves or finish standings.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapEventMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
 const mix=(a,b,t)=>a+(b-a)*t;
 const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
 function approachAnchor(anchor,progress,project,{side=false}={}){
  if(!anchor||typeof project!=='function'||anchor.y<=82.01)return {x:anchor?.x??240,y:anchor?.y??165,scale:1};
  const z=148/(anchor.y-82),relativeLane=(anchor.x-240)*z/60;
  const q=smooth(clamp(progress/.31));
  const approachZ=z+3.7*(1-q),lane=side?-7.2:relativeLane;
  const p=project(lane,approachZ);
  return Object.freeze({x:p.x,y:p.y,scale:z/approachZ});
 }
 // Passing animals must cross the road AHEAD of the rival they frighten,
 // not closer to the player than the rival. Normal crossings keep the
 // previously approved fixed world depth.
 function crossingPose(id,actor,anchor,project){
  if(!id.endsWith('-pass')||!anchor||typeof project!=='function'||anchor.y<=82.01)return actor;
  const targetZ=148/(anchor.y-82),depth=Math.max(actor.z,targetZ+.95);
  const point=project(actor.lane,depth);
  return {...actor,z:depth,x:point.x,y:point.y,scale:actor.scale*actor.z/depth};
 }
 const R=(r)=>Object.freeze(r);
 const RECIPES=Object.freeze({
  ducks:R({family:'crossing',duration:3400,actor:'duck',count:4,mode:'waddle',depth:2.80,spacing:.57}),
  'duck-pass':R({family:'crossing',duration:1000,actor:'duck',count:5,mode:'hurry',depth:2.80,spacing:.48}),
  deer:R({family:'crossing',duration:3400,actor:'deer',count:1,mode:'bound',depth:2.65}),
  cow:R({family:'crossing',duration:3400,actor:'cow',count:1,mode:'pause',depth:2.82}),
  sheep:R({family:'crossing',duration:3400,actor:'sheep',count:7,mode:'flock',depth:2.96,spacing:.32}),
  'goose-pass':R({family:'crossing',duration:1000,actor:'goose',count:1,mode:'charge',depth:2.75}),
  'boar-pass':R({family:'crossing',duration:1000,actor:'boar',count:1,mode:'charge',depth:2.72}),
  'bull-pass':R({family:'crossing',duration:1000,actor:'bull',count:1,mode:'charge',depth:2.67}),
  // Gate D: all falling recipes share a depth-aware descent, shadow, impact and aftermath.
  // A standalone meteor uses the track's own road contact; special passes use the
  // ACTUAL projected rival anchor supplied by the scene renderer.
  meteor:R({family:'falling',duration:3400,actor:'meteor',fromX:407,fromY:-74,toX:273,toY:157,warning:.10,impact:.73,offset:0}),
  'meteor-pass':R({family:'falling',duration:1000,actor:'meteor',fromX:405,fromY:-74,toX:309,toY:165,warning:.08,impact:.67,offset:32}),
  'foot-pass':R({family:'falling',duration:1000,actor:'foot',fromX:304,fromY:-158,toX:295,toY:169,warning:.09,impact:.65,offset:10}),
  'spring-trap':R({family:'launching',duration:1000,actor:'spring',x:250,y:176}),
  'trebuchet-pass':R({family:'launching',duration:1000,actor:'trebuchet',x:288,y:174,fromX:34,fromY:122,impact:.75}),
  'tornado-pass':R({family:'lifting',duration:1000,actor:'tornado',x:333,y:183}),
  'ufo-pass':R({family:'lifting',duration:1000,actor:'ufo',x:315,y:170}),
  'tentacle-pass':R({family:'lifting',duration:1000,actor:'tentacle',x:318,y:170}),
  'crab-pass':R({family:'lifting',duration:1000,actor:'crab',x:318,y:170})
 });
 const recipe=id=>RECIPES[id]||null;
 function sample(id,elapsedMs=0,{variant='normal',motion=true}={}){
  const r=recipe(id);if(!r)return null;
  const elapsed=clamp(elapsedMs,0,r.duration);
  const t=motion?elapsed/r.duration:.62,rare=variant==='rare';
  if(r.family==='crossing'){
   // These are ROAD-SPACE positions, using the same projection constants as
   // ScrapPresentation.project(). No screen-height sprite tracks over the hood.
   // Keep the sampled data pure, so scrubbing, pause and reduced motion agree.
   const gait={duck:.66,goose:.69,deer:.76,cow:.76,sheep:.61,boar:.71,bull:.76};
   const n=r.count+(rare&&r.actor==='duck'?1:0);
   const actors=Array.from({length:n},(_,i)=>{
    const lag=n>1?i*(r.mode==='flock'?.033:.045):0;
    const q=clamp((t-lag)/(1-lag));
    const pause=r.mode==='pause'&&q>=.34&&q<.68;
    let p;
    if(r.mode==='pause')p=q<.34?.50*smooth(q/.34):q<.68?.50:.50+.50*smooth((q-.68)/.32);
    else {
     const start=r.mode==='charge'?.11:r.mode==='bound'?.13:r.mode==='flock'?.08:.10;
     const finish=r.mode==='charge'?.91:r.mode==='bound'?.91:.93;
     p=smooth(clamp((q-start)/(finish-start)));
    }
    // Slight perspective spacing for the herd, not separate floating rows.
    const z=r.depth+(r.mode==='flock'?(i%3-1)*.14:r.actor==='duck'?(i%2)*.08:0);
    const startLane=-8.75-(r.spacing||0)*i*.46;
    const endLane=9.05+(r.spacing||0)*i*.18;
    const lane=mix(startLane,endLane,p);
    const roadX=240+lane*60/z,groundY=82+148/z;
    const moving=motion&&!pause&&p>0&&p<1;
    const cadence=r.mode==='charge'?.055:r.mode==='bound'?.025:r.mode==='flock'?.031:r.mode==='hurry'?.045:.021;
    const stride=moving?Math.sin(elapsed*cadence+i*1.8):0;
    const airborne=r.mode==='bound'?Math.abs(Math.sin(p*3*Math.PI))*19:
     r.mode==='flock'?Math.abs(Math.sin(elapsed*.020+i*1.4))*4:
     r.mode==='charge'?Math.abs(Math.sin(elapsed*.048))*3.5:
     r.actor==='duck'||r.actor==='goose'?Math.abs(Math.sin(elapsed*.025+i))*2.4:0;
    const scale=(gait[r.actor]||.7)*(2.82/z);
    return {x:roadX,y:groundY,z,scale,lane,progress:p,stage:pause?'pause':q<.12?'anticipation':p>.97?'exit':r.mode==='charge'?'charge':'cross',
     stride,bob:motion?airborne:0,chew:pause&&motion?Math.sin(elapsed*.021):0,tail:motion?Math.sin(elapsed*.013+i):0};
   });
   const reactionCenter=r.actor==='cow'?.53:r.mode==='charge'?.49:.47;
   const reaction=motion?Math.max(0,1-Math.abs(t-reactionCenter)/(r.actor==='cow'?.24:.23)):0;
   return {family:'crossing',actor:r.actor,t,actors,rare,reaction,
    honk:r.actor==='cow'&&t>.4&&t<.68,charge:r.mode==='charge'};
  }
  if(r.family==='falling'){
   // The warning silhouette/shadow appears before the descent. Ease on the
   // *time* axis so each frame can be sampled independently in the DEV lab.
   const descent=smooth(clamp((t-r.warning)/(r.impact-r.warning)));
   const last=smooth(clamp((t-.075-r.warning)/(r.impact-r.warning)));
   const after=clamp((t-r.impact)/(1-r.impact));
   const retreat=r.actor==='foot'?smooth(clamp((t-(r.impact+.13))/(1-r.impact-.13))):0;
   const stage=t<r.warning?'warning':t<r.impact?'descent':t<r.impact+.105?'impact':'aftermath';
   const x=mix(r.fromX,r.toX,descent);
   const y=mix(r.fromY,r.toY,descent)-retreat*(r.actor==='foot'?199:0);
   return {family:'falling',actor:r.actor,t,stage,rare,x,y,
    prevX:mix(r.fromX,r.toX,last),prevY:mix(r.fromY,r.toY,last),
    fall:descent,impact:after,retreat,
    warning:smooth(clamp(t/Math.max(.01,r.warning))),
    shadow:smooth(clamp((t-.025)/(r.impact-.025)))*(1-retreat*.86),
    flash:after>0?Math.max(0,1-after*(r.actor==='foot'?6.2:9)):0,
    dust:after>0?Math.sin(Math.PI*clamp(after))**.65:0};
  }
  if(r.family==='launching'){
   if(r.actor==='trebuchet'){
    // Four clean cartoon beats: crank -> release -> flying stone -> dust/aftermath.
    const crank=smooth(clamp(t/.17)),release=smooth(clamp((t-.16)/.14));
    const flight=smooth(clamp((t-.28)/.40)),post=clamp((t-.68)/.32);
    return {family:'launching',actor:r.actor,t,rare,
     stage:t<.16?'windup':t<.28?'release':t<.68?'flight':t<.89?'impact':'aftermath',
     crank,release,flight,arm:release,
     x:mix(r.fromX,r.x,flight),y:mix(r.fromY,r.y,flight)-83*Math.sin(flight*Math.PI),
     shadow:flight,burst:post,aftermath:smooth(clamp((t-.86)/.14))};
   }
   const tension=smooth(clamp((t-.08)/.22));
   const fire=smooth(clamp((t-.32)/.18));
   const coast=smooth(clamp((t-.53)/.29));
   const after=smooth(clamp((t-.80)/.20));
   const lift=fire*(1-coast)*65;
   return {family:'launching',actor:r.actor,t,rare,
    stage:t<.10?'hidden':t<.32?'windup':t<.53?'launch':t<.80?'hang-and-exit':'aftermath',
    x:r.x,y:r.y,tension,fire,coast,after,lift,
    plateRise:fire*23*(1-after*.30),coilStretch:1-fire*.25+fire*2.25*(1-after),
    burst:smooth(clamp((t-.35)/.42))*(1-after),
    rattle:t<.32?Math.sin(t*210)*2.3*tension:0};
  }
  // Gate C: four distinct choreographies driven by ONE shared lifting family.
  // Every value is a pure function of t; scrubbing and replay produce identical frames.
  const timings={
   tornado:[.07,.29,.41,.81],
   ufo:[.04,.34,.44,.81],
   tentacle:[.08,.34,.48,.81],
   crab:[.05,.34,.47,.81]
  }[r.actor];
  const [arrival,contact,pull,exit]=timings;
  const reach=smooth(clamp((t-arrival)/(contact-arrival)));
  const grip=smooth(clamp((t-contact)/(pull-contact)));
  const depart=smooth(clamp((t-pull)/(exit-pull)));
  const retreat=smooth(clamp((t-exit)/(1-exit)));
  const stage=t<arrival?'warning':t<contact?'approach':t<pull?'grab':t<exit?'departure':'aftermath';
  const struggle=r.actor==='ufo'?Math.sin(t*125)*Math.sin(Math.PI*clamp((t-.27)/.20))*(1-depart):
   Math.sin(t*87)*grip*(1-depart);
  return {family:'lifting',actor:r.actor,t,stage,rare,reach,grip,depart,retreat,
   // Legacy fields retained for existing tests and old lab consumers.
   rise:depart,rotation:t*Math.PI*3.8,x:r.x,y:r.y,
   struggle,swirl:t*Math.PI*10,
   beam:r.actor==='ufo'?smooth(clamp((t-.18)/.12))*(1-smooth(clamp((t-.81)/.16))):0,
   dust:smooth(clamp((t-.12)/.20))*(1-smooth(clamp((t-.81)/.18)))};
 }
 // Presentation only. This determines how a rival leaves the frame *after* the
 // race engine has fixed whether and when that rival is overtaken.
 function rivalTransform(kind,q,{x,z}){
  const e=smooth(q),sign=Math.sign(x||1);
  const end=kind==='spring'?1.20:kind==='swerve'?1.25:kind==='lift'?1.32:kind==='suck'?1.28:1.25;
  const delta=kind==='spring'?3.5:kind==='swerve'?3:kind==='lift'?2.2:kind==='suck'?4:3.6;
  if(kind==='spring'){
   // At 100% passing progress the rival is already gone. The visible pass
   // overlay runs through 83.87% of its own timeline before that happens.
   // Align the car's takeoff to the trap plate rather than launching it while
   // the spring is still compressing. No standings or pass timings change.
   const phase=q*(.13/.155),launch=smooth(clamp((phase-.26)/.57));
   const wobble=phase>.12&&phase<.32?Math.sin(phase*160)*.11:0;
   return {z:mix(z,z*.92,launch),x:x+sign*(14.5*launch+wobble),
    lift:launch*57+Math.sin(launch*Math.PI)*78, ...(launch>0?{angle:sign*launch*2.6}:{})};
  }
  if(kind==='meteor'||kind==='foot'){
   // An actual special pass has only ~84% of its effect timeline before
   // the rival disappears at the predetermined crossing. Nothing moves until
   // the impact has occurred, then the car escapes sideways without inflating.
   const id=kind==='meteor'?'meteor-pass':'foot-pass';
   const phase=clamp(q*(.13/.155));
   const f=sample(id,phase*1000);
   const react=smooth(clamp((phase-recipe(id).impact)/.145));
   const side=x<0?-1:1;
   const stagger=phase>recipe(id).impact-.065&&phase<recipe(id).impact?
    Math.sin(phase*141)*(kind==='foot'?.13:.07):0;
   return {x:x+side*Math.max(21,z*4.85+3)*react+stagger,
    z:z*(1+.025*react),
    lift:(kind==='foot'?11:19)*Math.sin(Math.PI*react),
    angle:side*(kind==='foot'?.74:.52)*react};
  }
  if(kind==='trebuchet'){
   // Rival stays by the impact point until the shot actually lands.
   const phase=q*(.13/.155),react=smooth(clamp((phase-.68)/.16));
   const jitter=phase>.61&&phase<.68?Math.sin(phase*135)*.10:0;
   return {z:mix(z,z*.93,react),x:x+sign*(15*react+jitter),
    lift:Math.sin(react*Math.PI)*19,...(react>0?{angle:sign*react*.55}:{})};
  }
  // Gate C: all four removals use the SAME original projected rival. Their
  // different paths are purely presentational; the overtake was precomputed.
  const actorByKind={tornado:'tornado-pass',ufo:'ufo-pass',tentacle:'tentacle-pass',crab:'crab-pass'};
  if(actorByKind[kind]){
   // The rival leaves at 83.87% of the effect timeline, after which the visual
   // continues briefly to show the effect retracting / dust settling.
   const phase=clamp(q*(.13/.155));
   const f=sample(actorByKind[kind],1000*phase);
   const d=f.depart;
   const side=x<0?-1:1;
   if(kind==='tornado')return {x:x+Math.sin(phase*38)*1.35*d+side*.8*d,
    z:z*(1+.13*d),lift:201*d,angle:side*5.3*d};
   if(kind==='ufo'){
    const fight=f.beam>0&&f.grip<1?f.struggle*.17:0;
    return {x:x+fight,z:z+1.8*d,lift:195*d,angle:side*.19*d};
   }
   if(kind==='tentacle')return {x:x+side*Math.max(20.8,z*4.8+3)*d,z:z*(1+.025*d),
    lift:34*d+18*Math.sin(d*Math.PI),angle:side*.92*d};
   return {x:x+side*Math.max(20.6,z*4.8+3)*d,z:z*(1+.015*d),
    lift:26*d+9*Math.sin(d*Math.PI),angle:side*.47*d};
  }
  if(kind==='shortcut'){
   // Gag shortcut passes occur because the player's side route beats the main
   // road, NOT because the rival drives off into the scenery. Keep the rival
   // in its lane while it recedes in depth; normal overtakeState owns exit.
   return {z:z+e*2.5,x,lift:0,angle:0};
  }
  if(kind==='slow'||kind==null)return {z:mix(z,.78,e),x:x+sign*2.14*e,lift:0};
  return {z:mix(z,end,e),x:x+sign*delta*e,
   lift:kind==='spring'?Math.sin(q*Math.PI)*64+e*34:
    kind==='lift'?e*116:kind==='swerve'?Math.sin(q*Math.PI)*12:
    kind==='suck'?Math.sin(q*Math.PI)*24:Math.sin(q*Math.PI)*29};
 }
 const ink='#152c37',cream='#fff0d4',white='#f8f7e6',gold='#f4c35f',orange='#e78349',dust='#bba481';
 const fill=(ctx,x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
 const line=(ctx,pts,c,w=2)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
 const ellipse=(ctx,x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);ctx.fill();};
 const poly=(ctx,pts,c)=>{ctx.fillStyle=c;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
 const ring=(ctx,x,y,rx,ry,col,w=2)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);ctx.stroke();};
 const body=(ctx,x,y,rx,ry,base,edge=ink)=>{ellipse(ctx,x,y,rx+2,ry+2,edge);ellipse(ctx,x,y,rx,ry,base);};
 function paintAnimalBody(ctx,actor,d,i,rare,motion){
  const x=0,y=0,step=d.stride*3;
  if(actor==='duck'||actor==='goose'){
   const g=actor==='goose';
   body(ctx,x+4,y+2,g?16:11,g?8:6,g?'#e7eaeb':i%2?cream:'#e8f0f0');
   poly(ctx,[[x-9,y],[x-18,y-6],[x-16,y+5]],g?'#d8e2e5':'#c6d2d5');
   body(ctx,x+12,y-7,g?5:4,g?14:9,g?'#e2ecee':cream);
   body(ctx,x+15,y-(g?19:13),g?6:5,5,g?'#f4f5e8':cream);
   ellipse(ctx,x+18,y-(g?21:15),1.5,1.5,ink);
   poly(ctx,[[x+19,y-19+(g?0:5)],[x+31,y-17+(g?0:5)],[x+20,y-12+(g?0:5)]],g?'#eb9147':gold);
   line(ctx,[[x-1,y+8],[x-1+step,y+14],[x-7+step,y+14]],orange,2.5);
   line(ctx,[[x+8,y+8],[x+8-step,y+14],[x+14-step,y+14]],orange,2.5);
   if(g&&d.stage==='charge'){
    // The goose throws out its wings mid-charge, as though it owns the road.
    poly(ctx,[[x-3,y+3],[x-9,y-9-d.bob*.4],[x+3,y-13-d.bob*.4],[x+9,y+1]],'#d8e4e4');
    line(ctx,[[x+17,y-25],[x+21,y-24]],ink,1.5);
   }
   if(actor==='duck'){
    // Small flapping wing and tail feathers respond to the brisk little gait.
    ellipse(ctx,x-1,y+1+d.stride,5,3,i%2?white:'#fbf0dd');
    if(rare&&i===0)poly(ctx,[[x+9,y-27],[x+12,y-34],[x+15,y-29],[x+19,y-35],[x+23,y-27]],gold);
   }
   return;
  }
  if(actor==='sheep'){
   // Wool drawn as clean overlapping puffs, not a featureless rectangle.
   for(const [a,b,r] of [[-10,-2,10],[-1,-6,11],[12,-2,10],[4,4,10]])body(ctx,x+a,y+b,r,r*.82,i%3===0?'#e8d9ae':'#f4eee1');
   for(const xx of [-7,9]){
    line(ctx,[[x+xx,y+8],[x+xx+step,y+16]],'#5c4946',3.5);
   }
   body(ctx,x+20,y+0,8,7,'#6d5148');
   ellipse(ctx,x+23,y-2,1.7,1.7,white);
   ellipse(ctx,x+24,y-2,1,1,ink);
   ellipse(ctx,x+16,y-6,6,2,'#a68b7e');
   // A tiny tail and free swinging ears make each sheep more than a wool-ball.
   ellipse(ctx,x-18,y-4,4,5,white);
   return;
  }
  if(actor==='deer'){
   // Slender, airborne silhouette and little split hooves.
   body(ctx,x+1,y-8,19,9,'#a46d43');
   poly(ctx,[[x-13,y-9],[x-23,y-14],[x-17,y-1]],'#e6cb97');
   line(ctx,[[x-9,y-2],[x-10-step,y+16],[x-16-step,y+25]],'#654636',3.2);
   line(ctx,[[x+9,y-2],[x+14+step,y+16],[x+19+step,y+25]],'#654636',3.2);
   line(ctx,[[x+14,y-6],[x+20,y-25]],'#84563a',5);
   body(ctx,x+22,y-25,8,6,'#bb8b56');
   poly(ctx,[[x+18,y-29],[x+13,y-37],[x+22,y-34]],'#9b704d');
   ellipse(ctx,x+27,y-27,1.4,1.4,ink);
   for(const dx of [-5,3]){line(ctx,[[x+22+dx,y-32],[x+18+dx,y-44],[x+12+dx,y-48]],'#584436',2);line(ctx,[[x+18+dx,y-42],[x+24+dx,y-49]],'#584436',1.7);}
   return;
  }
  if(actor==='cow'){
   body(ctx,x+2,y-8,27,17,'#f5eddc');
   for(const [xx,yy,rx,ry] of [[-14,-13,7,7],[9,-5,9,6],[0,-18,5,4]])ellipse(ctx,x+xx,y+yy,rx,ry,'#3c4650');
   for(const xx of [-13,15]){
    line(ctx,[[x+xx,y+4],[x+xx+step*.55,y+18],[x+xx+step*.55,y+21]],'#424b50',5);
   }
   line(ctx,[[x-24,y-15],[x-37,y-29],[x-41,y-21]],'#3c4650',2);
   body(ctx,x+27,y-13,14,13,'#eee8d9');
   poly(ctx,[[x+16,y-22],[x+9,y-30],[x+19,y-28]],'#b78c82');
   poly(ctx,[[x+38,y-22],[x+45,y-30],[x+35,y-28]],'#b78c82');
   ellipse(ctx,x+34,y-8,11,7,'#daa7a0');ellipse(ctx,x+29,y-9,1.8,2,ink);ellipse(ctx,x+38,y-9,1.8,2,ink);
   ellipse(ctx,x+30,y-20,2,2,ink);
   if(d.stage==='pause'){
    // Unbothered chewing face and a flick of the tail while the rival waits.
    const jaw=d.chew*2;
    line(ctx,[[x+27,y-1],[x+35,y+1+jaw]],ink,1.7);
    ellipse(ctx,x+31,y-20,1.4,Math.abs(d.chew)>.8?.35:1.5,ink);
   }
   line(ctx,[[x-23,y-15],[x-34,y-28+d.tail*7]],'#424b50',2.4);
   return;
  }
  const bull=actor==='bull',boar=actor==='boar';
  const base=bull?'#aa543d':'#875944',head=bull?'#c06b4d':'#a66d4d';
  body(ctx,x+2,y-8,bull?29:24,bull?18:13,base);
  for(const xx of [-17,16]){
   line(ctx,[[x+xx,y+3],[x+xx+step,y+20],[x+xx+step*1.25,y+22]],'#4b3934',bull?6:4);
  }
  poly(ctx,[[x-22,y-17],[x-33,y-28],[x-35,y-20]],base);
  body(ctx,x+27,y-10,bull?16:13,bull?15:12,head);
  body(ctx,x+39,y-5,bull?11:10,8,bull?'#e7a07c':'#d89b79');
  ellipse(ctx,x+42,y-6,2,2,ink);
  ellipse(ctx,x+26,y-18,2.4,2.4,white);ellipse(ctx,x+27,y-18,1.1,1.1,ink);
  if(bull){
   poly(ctx,[[x+17,y-19],[x+12,y-34],[x+18,y-39],[x+22,y-24]],cream);
   poly(ctx,[[x+34,y-21],[x+42,y-36],[x+46,y-39],[x+42,y-19]],cream);
  } else {poly(ctx,[[x+40,y+1],[x+46,y-4],[x+45,y+8]],cream);}
  for(let j=0;j<3;j++)if(d.stage==='charge')ellipse(ctx,x-25-j*9,y+10+(j%2)*4,3+j,2,dust);
 }
 function paintAnimal(ctx,actor,d,i,rare,motion){
  ctx.save();ctx.translate(d.x,d.y);ctx.scale(d.scale,d.scale);
  // Foot-shadow remains pinned to the road even on the deer's airborne frames.
  const radius=actor==='bull'?33:actor==='cow'?31:actor==='deer'?22:actor==='sheep'?20:16;
  ellipse(ctx,8,15,radius,3,'rgba(13,33,38,.33)');
  ctx.save();ctx.translate(0,-d.bob);
  paintAnimalBody(ctx,actor,d,i,rare,motion);
  ctx.restore();ctx.restore();
 }
 function paintCrossingReaction(ctx,f,anchor){
  if(f.reaction<.06||!anchor)return;
  const k=f.reaction,x=anchor.x,y=anchor.y;
  // Cosmetic brake/dust pulse on the actual projected rival road contact.
  ctx.save();ctx.globalAlpha=.6*k;
  for(let i=0;i<3;i++){
   const xx=x+(i-1)*11,yy=y+8+i%2*3;
   ellipse(ctx,xx,yy,2+5*k,1+3*k,i===1?cream:dust);
  }
  ctx.restore();
  if(f.honk){
   ctx.save();ctx.font='bold 11px sans-serif';ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.fillStyle='#ffe28d';
   ctx.strokeText('HONK!',x-13,y-38);ctx.fillText('HONK!',x-13,y-38);
   ring(ctx,x+9,y-13,14,9,gold,1.4);
   ctx.restore();
  }else if(f.charge&&k>.35){
   for(let i=0;i<3;i++)line(ctx,[[x-15-i*5,y-15-i*3],[x-21-i*5,y-16-i*3]],cream,1.6);
  }
 }
 function impactDust(ctx,x,y,progress,scale=1){
  if(progress<=0||progress>=1)return;
  ring(ctx,x,y,9+65*progress*scale,3+15*progress*scale,cream,Math.max(.7,4*(1-progress)));
  ring(ctx,x,y,5+49*progress*scale,2+9*progress*scale,ink,Math.max(.7,2.8*(1-progress)));
  for(let i=0;i<11;i++){
   const a=i*.57,d=progress*(17+(i%4)*11)*scale;
   ellipse(ctx,x+Math.cos(a)*d,y-5-Math.abs(Math.sin(a))*progress*36,Math.max(1,5*(1-progress)),Math.max(1,3*(1-progress)),i%3===0?cream:dust);
  }
 }
 // Gate D is deliberately painted as ROAD / OBJECT / IMPACT layers. The road
 // warning belongs behind the selected rival; the falling object and shockwave
 // can overlap it. Both are fed the same fixed projected contact, so the object
 // never chases the vehicle as it reacts to the precomputed race outcome.
 function paintFalling(ctx,f,id,anchor,layer='all'){
  const r=recipe(id),hasAnchor=anchor&&Number.isFinite(anchor.x)&&Number.isFinite(anchor.y);
  const baseX=hasAnchor?anchor.x:r.toX,ground=hasAnchor?anchor.y:r.toY;
  const side=baseX<240?1:-1;
  const hitX=baseX+(r.offset||0)*side;
  const hitY=ground;
  const dx=hitX-r.toX,dy=hitY-r.toY;
  const x=f.x+dx,y=f.y+dy;
  const under=layer==='all'||layer==='under',over=layer==='all'||layer==='over';
  const foot=f.actor==='foot',big=f.rare?1.23:1;
  if(under){
   // Contact shadow grows before anything lands. A foot has an enormous tread
   // shadow; meteor shadows tighten towards the impact point.
   ctx.save();
   ctx.globalAlpha=Math.max(.09,.16+.42*f.shadow);
   if(foot){
    ellipse(ctx,hitX,hitY+2,(27+40*f.shadow)*big,5+13*f.shadow,'#17282d');
    for(let i=0;i<4;i++)ellipse(ctx,hitX-25+i*16,hitY-3-i%2*2,(5+6*f.shadow)*big,2+3*f.shadow,'#17282d');
   }else{
    ellipse(ctx,hitX,hitY+1,(5+26*f.shadow)*big,2+6*f.shadow,'#13262a');
    ring(ctx,hitX,hitY+2,8+23*f.shadow,2+5*f.shadow,'#584f48',1.5);
   }
   ctx.restore();
   if(f.impact>0){
    // Permanent-looking road scuff during the aftermath, fades before next beat.
    ctx.save();ctx.globalAlpha=Math.max(0,.65*(1-f.impact*.8));
    if(foot){
     ellipse(ctx,hitX,hitY-1,53*big,7*big,'#30363a');
     for(let i=0;i<4;i++)fill(ctx,hitX-39+i*24,hitY-3,11,3,'#8d7662');
    }else{
     ellipse(ctx,hitX,hitY-1,26*big,7*big,'#533c35');
     ring(ctx,hitX,hitY-1,20*big,6*big,'#dc864e',2.3);
    }
    ctx.restore();
   }
  }
  if(!over)return;
  // The object stays present for a little while after impact rather than
  // instantly teleporting away. The giant boot visibly withdraws upwards.
  if(foot&&f.t<.975){
   ctx.save();ctx.translate(x,y);ctx.scale(big,big);
   // Leg vanishes off the top of screen. Oversized boot uses clear major forms.
   poly(ctx,[[-26,-192],[35,-192],[40,-59],[35,-32],[-25,-32]],ink);
   poly(ctx,[[-19,-190],[29,-190],[34,-61],[28,-36],[-20,-36]],'#876b58');
   // Black sole and exaggerated toe sticking out to the right.
   poly(ctx,[[-39,-54],[29,-54],[38,-25],[69,-16],[75,-2],[69,12],[-47,12],[-50,-3]],ink);
   poly(ctx,[[-33,-50],[24,-50],[36,-19],[66,-9],[69,2],[-42,2]],'#a77551');
   poly(ctx,[[28,-18],[48,-13],[65,-7],[68,2],[24,2]],'#c48c60');
   // Heavy treads plus large stitching/laces make the foot recognizable.
   poly(ctx,[[-49,3],[69,3],[67,12],[-48,12]],'#34434a');
   for(let i=0;i<6;i++)fill(ctx,-38+i*17,7,10,3,i%2?'#f4bd76':'#65767b');
   for(let i=0;i<4;i++){
    line(ctx,[[-19,-45+i*10],[19,-47+i*10]],cream,2.7);
    ellipse(ctx,-22,-45+i*10,2.2,2.2,ink);ellipse(ctx,22,-47+i*10,2.2,2.2,ink);
   }
   poly(ctx,[[27,-53],[37,-53],[45,-29],[39,-26]],'#efc17d');
   ctx.restore();
  }else if(!foot&&f.t<r.impact){
   // Direction-dependent meteor tail. Its trail is drawn from a previous
   // *sampled position*, not as an independently sliding decoration.
   const sz=((f.rare?12:8)+20*f.fall)*big;
   const tailX=f.prevX+dx,tailY=f.prevY+dy;
   const vx=x-tailX,vy=y-tailY;
   if(f.fall>.005){
    line(ctx,[[tailX-vx*.32,tailY-vy*.32],[x,y]],'#db6d3d',Math.max(4,sz*.95));
    line(ctx,[[tailX,tailY],[x,y]],'#ffbc60',Math.max(3,sz*.52));
    line(ctx,[[mix(tailX,x,.38),mix(tailY,y,.38)],[x,y]],'#fff0a0',Math.max(1.5,sz*.21));
    for(let i=0;i<4;i++){
     const q=.15+i*.16;
     ellipse(ctx,mix(tailX,x,q)+(i%2?6:-5),mix(tailY,y,q)-i*2,1.3+i*.4,1+i*.3,i%2?'#f9d67a':'#e97e41');
    }
   }
   poly(ctx,[[x-sz,y-sz*.35],[x-sz*.75,y-sz*.91],[x+sz*.15,y-sz],[x+sz*.92,y-sz*.23],[x+sz*.75,y+sz*.70],[x-sz*.55,y+sz*.72]],ink);
   poly(ctx,[[x-sz*.68,y-sz*.22],[x-sz*.45,y-sz*.7],[x+sz*.17,y-sz*.66],[x+sz*.61,y-sz*.11],[x+sz*.43,y+sz*.44],[x-sz*.35,y+sz*.37]],'#e46d35');
   poly(ctx,[[x-sz*.30,y-sz*.24],[x+sz*.24,y-sz*.43],[x+sz*.48,y-.5],[x+sz*.16,y+sz*.25]],'#ffdb75');
  }
  if(f.impact>0){
   // Shared impact system with personalised scale and colour. Never uses
   // global RNG: different timeline samples are perfectly reproducible.
   const p=f.impact,spread=smooth(clamp(p/.8)),fade=Math.max(0,1-p);
   if(p<.93){
    ctx.save();ctx.globalAlpha=Math.max(0,.82*(1-spread*.75));
    ring(ctx,hitX,hitY+1,(10+75*spread)*big,(3+17*spread)*big,foot?'#e8cf9a':'#ffd88b',Math.max(.8,4.5*(1-spread)));
    ring(ctx,hitX,hitY,(6+54*spread)*big,(2+10*spread)*big,foot?'#a48063':'#d77d46',Math.max(.7,2.8*(1-spread)));
    for(let i=0;i<15;i++){
     const a=i*2.39996,d=(7+(i%4)*9+60*spread)*big;
     const px=hitX+Math.cos(a)*d;
     const py=hitY-6-Math.abs(Math.sin(a))*(9+28*Math.sin(p*Math.PI));
     ellipse(ctx,px,py,(3+(i%3))*fade+.7,Math.max(.7,3.3*fade),i%3===0?cream:foot?'#c6a68b':'#bd9d82');
    }
    ctx.restore();
   }
   if(f.flash>.01){
    ctx.save();ctx.globalAlpha=f.flash*.65;
    ellipse(ctx,hitX,hitY-8,(foot?78:53)*big,(foot?28:20)*big,foot?'#fff1ce':'#ffe7a0');
    ctx.restore();
   }
   // A playful secondary beat: meteor sparks dribble into the crater while
   // the foot withdraws with a little last cloud of road dust.
   if(!foot&&p>.32&&p<.96){
    for(let i=0;i<5;i++){
     const q=clamp((p-.32)*1.7),xx=hitX+(i-2)*12;
     line(ctx,[[xx,hitY-27+q*10],[xx+3,hitY-20+q*16]],i%2?'#e89556':'#ffd17c',1.2);
    }
   }
  }
 }
 // All launching art is rendered in two layers: road mechanism BEFORE
 // the rival car, animated impact and particles AFTER it. The four-part
 // vehicle renderer stays the source of truth for the flying rival.
 function paintLaunching(ctx,f,r,anchor,layer='all',project=null){
  const ax=anchor&&Number.isFinite(anchor.x)?anchor.x:r.x;
  const ay=anchor&&Number.isFinite(anchor.y)?anchor.y:r.y;
  const under=layer==='all'||layer==='under',over=layer==='all'||layer==='over';
  if(r.actor==='trebuchet'){
   const approach=approachAnchor(anchor,f.t,project,{side:true});
   const baseX=typeof project==='function'?approach.x:Math.max(38,Math.min(95,ax-154));
   const baseY=typeof project==='function'?approach.y-8:Math.min(150,Math.max(126,ay+21));
   const baseScale=typeof project==='function'?approach.scale:1;
   const pivotX=baseX+17,pivotY=baseY-23;
   const x0=baseX+61*baseScale,y0=baseY-50*baseScale;
   const p=f.flight;
   const sx=mix(x0,ax,p),sy=mix(y0,ay,p)-75*Math.sin(p*Math.PI);
   const angle=-2.45+1.9*f.arm;
   const tipX=pivotX+Math.cos(angle)*52,tipY=pivotY+Math.sin(angle)*52;
   if(under){
    // Draw the siege engine in the roadside's projected scale. The machine
    // approaches along the SIDE of the road, instead of travelling along a
    // fixed horizontal screen row while the track moves behind it.
    ctx.save();ctx.translate(baseX,baseY);ctx.scale(baseScale,baseScale);ctx.translate(-baseX,-baseY);
    // Wooden field trebuchet, large enough to have an identifiable silhouette.
    ellipse(ctx,baseX+13,baseY+3,38,6,'rgba(13,23,28,.36)');
    poly(ctx,[[baseX-26,baseY-7],[baseX+54,baseY-7],[baseX+49,baseY+1],[baseX-31,baseY+1]],ink);
    poly(ctx,[[baseX-21,baseY-9],[baseX+51,baseY-9],[baseX+46,baseY-4],[baseX-25,baseY-4]],'#ad774c');
    for(const xx of [baseX-8,baseX+36]){
     body(ctx,xx,baseY+2,9,9,'#42484a');ellipse(ctx,xx,baseY+2,3.8,3.8,gold);}
    line(ctx,[[baseX-6,baseY-11],[pivotX,pivotY],[baseX+40,baseY-10]],ink,10);
    line(ctx,[[baseX-6,baseY-11],[pivotX,pivotY],[baseX+40,baseY-10]],'#d09b5c',6);
    line(ctx,[[baseX-17,baseY-12],[pivotX,pivotY]],'#f0c181',3);
    line(ctx,[[pivotX,pivotY],[tipX,tipY]],ink,12);
    line(ctx,[[pivotX,pivotY],[tipX,tipY]],'#bd8150',7);
    body(ctx,baseX+8,baseY-14,10,10,'#766451');
    // Sling and counterweight swing with the throwing arm.
    line(ctx,[[tipX,tipY],[tipX+6,tipY+9]],'#3b4e4b',2);
    poly(ctx,[[pivotX-12,pivotY+5],[pivotX+4,pivotY+6],[pivotX+10,pivotY+24],[pivotX-7,pivotY+25]],'#6e6559');
    ellipse(ctx,pivotX,pivotY,4.5,4.5,gold);
    if(f.t<.28){body(ctx,tipX,tipY,10,9,'#656966');ellipse(ctx,tipX-3,tipY-3,3,2,'#b2b2a4');}
    // A perspective shadow predicts WHERE the shot will land.
    ctx.restore();
    ellipse(ctx,ax,ay+1,7+26*f.shadow,2+3*f.shadow,'rgba(13,25,29,.38)');
   }
   if(over){
    if(f.t>=.28&&f.t<.68){
     // The stone travels forward on a real arc. A short dotted trail follows
     // its previous positions instead of sliding as a rigid sideway streak.
     for(let i=4;i>=1;i--){const q=clamp(p-i*.055);
      if(q<=0)continue;
      const tx=mix(x0,ax,q),ty=mix(y0,ay,q)-75*Math.sin(q*Math.PI);
      ellipse(ctx,tx,ty,Math.max(1,4-i*.5),Math.max(1,3-i*.4),i%2?'#ead1a5':dust);
     }
     ctx.save();ctx.translate(sx,sy);ctx.rotate(p*7);
     body(ctx,0,0,11+(f.rare?3:0),10+(f.rare?3:0),'#6a7774');
     poly(ctx,[[-8,-4],[-1,-9],[5,-7],[9,2],[0,6],[-6,4]],'#9b9d8b');
     for(const [px,py] of [[-5,-2],[4,-4],[3,4]])line(ctx,[[px,py],[px+2,py+2]],ink,1.5);
     ctx.restore();
    }
    if(f.burst>0){
     impactDust(ctx,ax,ay,f.burst,1.25);
     // A chunky dust mushroom makes the impact legible even at 480x270.
     const power=Math.sin(Math.PI*clamp(f.burst*1.15)),size=Math.max(0,power);
     if(size>.02){
      for(let j=0;j<7;j++){
       const dx=(j-3)*8.5,dy=Math.abs(j-3)*1.6;
       const px=ax+dx*(.40+f.burst*.65),py=ay-7-8*size-dy;
       const radius=3+size*(j%2?12:14);
       ellipse(ctx,px,py,radius+2,radius*.70+2,ink);
       ellipse(ctx,px,py,radius,radius*.70,j%3===0?'#edd3a0':j%2?'#b6aa91':'#d8c4a5');
      }
      for(let j=0;j<5;j++){
       const dx=(j-2)*13;
       ellipse(ctx,ax+dx,ay+3-size*3,Math.max(2,5+size*7),2+size*2,'#a99b82');
      }
     }
     if(f.burst<.74){
      // Wood chips, pebbles and ridiculous impact speed streaks.
      for(let i=0;i<9;i++){
       const a=i*Math.PI*2/9,p=f.burst,dx=Math.cos(a)*p*38,dy=Math.sin(a)*p*19;
       ellipse(ctx,ax+dx,ay-10+dy-p*9,Math.max(1,3-p*2.2),Math.max(1,2-p),i%3===0?gold:'#9d9176');
      }
     }
     if(f.aftermath>0&&f.aftermath<1)ellipse(ctx,ax+26*f.aftermath,ay+2,3,2,'#777970');
    }
   }
   return;
  }
  // Spring Trap: move a road-space hatch forward from the horizon until it
  // reaches the target rival on launch. During collision it stays EXACTLY at
  // that rival's projected tyre contact and does not chase the flying car.
  const spring=approachAnchor(anchor,f.t,project);
  const x=spring.x,y=spring.y,w=41,h=11,shake=f.rattle;
  ctx.save();ctx.translate(x,y);ctx.scale(spring.scale,spring.scale);ctx.translate(-x,-y);
  if(under){
   ellipse(ctx,x,y+3,w+8,6,'rgba(9,22,27,.36)');
   poly(ctx,[[x-w,y-h],[x+w,y-h],[x+w+7,y+5],[x-w-7,y+5]],ink);
   poly(ctx,[[x-w+4,y-h+3],[x+w-4,y-h+3],[x+w+1,y+1],[x-w-1,y+1]],'#57747b');
   for(const xx of [x-32,x+32]){fill(ctx,xx,y-7,5,4,gold);fill(ctx,xx+1,y-6,2,2,ink);}
   // Before release the hatch lies flush with the road, under the rival.
   // Once the coil fires, the mechanism must rise IN FRONT of the car or
   // it becomes completely hidden by a full-size vehicle sprite.
   if(f.t<.30){
    poly(ctx,[[x-w+shake,y-13],[x+w+shake,y-13],
      [x+w+6+shake,y-3],[x-w+6+shake,y-3]],'#d3c2a4');
   }
  }
  if(over){
   if(f.t>=.30){
    const rise=f.plateRise;
    for(let i=0;i<2;i++){
     const xx=x+(i?18:-18),coilHeight=10+rise*.75;
     const pts=[[xx-10,y-7],[xx+10,y-7]];
     for(let j=1;j<=6;j++)pts.push([xx+(j%2?-9:9),y-7-j*coilHeight/7]);
     line(ctx,pts,ink,7);line(ctx,pts,gold,4.5);
    }
    poly(ctx,[[x-w+shake,y-13-rise],[x+w+shake,y-13-rise],
      [x+w+6+shake,y-3-rise],[x-w+6+shake,y-3-rise]],ink);
    poly(ctx,[[x-w+4+shake,y-12-rise],[x+w-4+shake,y-12-rise],
      [x+w+1+shake,y-5-rise],[x-w+7+shake,y-5-rise]],'#d3c2a4');
    line(ctx,[[x-19+shake,y-9-rise],[x+20+shake,y-9-rise]],'#62777a',3);
   }
   if(f.stage==='windup')for(let i=0;i<4;i++){
    const xx=x-18+i*12;
    line(ctx,[[xx,y-16],[xx+Math.sin(f.t*150+i)*2,y-20]],i%2?gold:cream,2);
   }
   if(f.fire>.02&&f.fire<1){
    for(let i=0;i<7;i++){
     const xx=x+(i-3)*12,q=f.fire;
     line(ctx,[[xx,y-9],[xx*1.0+(xx-x)*.34,y-13-25*q]],i%2?cream:gold,Math.max(1,3*(1-q)));
    }
   }
   if(f.burst>0&&f.burst<1)impactDust(ctx,x,y,f.burst*.8,.55);
   if(f.after>0){
    const p=f.after,px=x+42*p,py=y-64*p+60*p*p;
    ctx.save();ctx.translate(px,py);ctx.rotate(p*8);
    fill(ctx,-5,-3,10,5,'#a8b7ad');fill(ctx,-2,-1,4,2,gold);
    ctx.restore();
    if(p>.68)ellipse(ctx,x+43,y+2,10*(p-.68),2*(p-.68),'rgba(9,22,27,.2)');
   }
  }
  ctx.restore();
 }
 // Lifting is a two-layer *actor-linked* scene, just like Gate B launching:
 // beam/road dust/creature roots UNDER the true rival car, grasping parts and
 // overhead spectacle OVER it. All geometry is aligned to the same original
 // projected target and its evolving (purely visual) animated position.
 function paintLifting(ctx,f,r,anchor,actorAnchor,layer='all'){
  const tx=anchor?.x??r.x,ty=anchor?.y??r.y;
  const under=layer==='all'||layer==='under',over=layer==='all'||layer==='over';
  const side=tx<240?-1:1,edge=side<0?-28:508;
  const cx=actorAnchor?.x??tx+side*320*f.depart;
  const cy=actorAnchor?.y??ty-30*f.depart;
  // Road-contact shadow shrinks at the actual moment of removal.
  if(under&&f.grip>.02){
   ellipse(ctx,tx,ty+1,24*(1-f.depart*.88),4*(1-f.depart*.72),'rgba(10,25,30,.39)');
  }
  if(r.actor==='tornado'){
   const bx=mix(tx+side*105,tx,f.reach)+side*70*f.retreat;
   if(under){
    // Low rolling cloud of dust and a visible pull toward the rival's wheels.
    for(let i=0;i<9;i++){
     const spin=f.swirl+i*2.4,rad=10+31*f.reach+i%3*6;
     const dx=Math.cos(spin)*rad,dy=Math.sin(spin)*6;
     ellipse(ctx,bx+dx,ty+dy,3+(i%3)*2,2+(i%2),i%3===0?'#ead6ad':'#a5a49b');
    }
    if(f.grip>.1){
     const p=f.grip*(1-f.retreat);
     ring(ctx,tx,ty,12+38*p,3+9*p,'#e8cda4',3-p);
     for(let i=0;i<5;i++){
      const a=f.swirl+i*1.3,rad=8+21*p;
      ellipse(ctx,tx+Math.cos(a)*rad,ty-3-Math.sin(a)*9,2.5,2,'#eed8b0');
     }
    }
   }
   if(over){
    // Conical column made from curved bands, not a stack of horizontal lines.
    const birth=smooth(clamp((f.t-.02)/.24)),fade=1-f.retreat*.96;
    const top=ty-114*birth*fade,height=ty-top;
    for(let i=0;i<15;i++){
     const frac=i/14,yy=top+height*frac;
     const radius=(29*(1-frac)+8+Math.sin(frac*8+f.swirl)*2)*fade;
     const swirl=Math.sin(f.swirl+frac*11)*radius*.58;
     const col=i%3===0?'#dce4d7':i%3===1?'#688c95':'#2c505e';
     ctx.save();ctx.globalAlpha=(.93-f.retreat*.40)*birth;
     line(ctx,[[bx-radius*.85+swirl,yy+2],[bx+swirl,yy-5],[bx+radius*.84+swirl,yy]],ink,7-frac*2);
     line(ctx,[[bx-radius*.85+swirl,yy+1],[bx+swirl,yy-5],[bx+radius*.84+swirl,yy]],col,4.8-frac*1.5);
     ctx.restore();
    }
    for(let i=0;i<(f.rare?12:7);i++){
     const v=.16+(i%5)*.15,a=f.swirl*(.60+i%3*.15)+i*2.17;
     const rad=14+(1-v)*30;
     const x=bx+Math.sin(a)*rad,y=ty-113*v+Math.cos(a)*3-8*f.depart;
     ctx.save();ctx.translate(x,y);ctx.rotate(a*.6);
     fill(ctx,-3,-2,6,4,i%3?'#dcc39b':'#b7c0bb');ctx.restore();
    }
    if(f.retreat>.2)for(let i=0;i<6;i++){
     const t=f.retreat,yy=ty-5-(i%3)*4;
     ellipse(ctx,bx+(i-3)*14*t,yy,Math.max(.4,8*(1-t)),Math.max(.4,4*(1-t)),'#b0a9a0');
    }
   }
   return;
  }
  if(r.actor==='ufo'){
   const shipX=tx+Math.sin(f.swirl*.16)*3+side*55*f.retreat;
   const sy=Math.max(22,ty-102)-9*f.retreat;
   if(under){
    if(f.beam>.015){
     ctx.save();ctx.globalAlpha=.28+.18*f.beam;
     poly(ctx,[[shipX-17,sy+18],[shipX+17,sy+18],[tx+31*f.beam,ty+1],[tx-31*f.beam,ty+1]],'#78f6d3');
     ctx.restore();
     ring(ctx,tx,ty,10+24*f.beam,4+5*f.beam,'#8af6da',1.8);
    }
    if(f.beam>.25&&f.grip<1){
     // Exhaust streaks go downward while the terrified rival floors it.
     for(let i=0;i<4;i++){
      const dx=(i-1.5)*8+f.struggle*2;
      line(ctx,[[tx+dx,ty-3],[tx+dx+side*7,ty+13+i%2*5]],i%2?gold:cream,2);
     }
    }
   }
   if(over){
    // Cartoon flying saucer: dark hull, prominent dome and alternating bulbs.
    ellipse(ctx,shipX,sy+22,51,12,ink);
    ellipse(ctx,shipX,sy+21,46,9,'#52747a');
    ellipse(ctx,shipX,sy+13,28,17,ink);
    ellipse(ctx,shipX,sy+12,25,14,'#7bc2bd');
    ellipse(ctx,shipX-7,sy+8,11,5,'#c7e5cf');
    line(ctx,[[shipX-24,sy+24],[shipX+22,sy+24]],'#dce6d8',2);
    for(let i=-3;i<=3;i++)ellipse(ctx,shipX+i*13,sy+25,3,2.7,(Math.floor(f.t*20)+i)%2?gold:'#ee8e6d');
    if(f.beam>.05){
     for(let i=0;i<5;i++){
      const q=(f.t*.85+i*.23)%1;
      ellipse(ctx,tx+(i-2)*9+Math.sin(f.swirl+i)*2,ty-q*(ty-sy-28),1.6,4,'#baf5e4');
     }
    }
    if(f.retreat>.05){
     for(let i=0;i<3;i++){
      const p=f.retreat;
      ellipse(ctx,tx+(i-1)*17,ty-3,Math.max(.5,11*(1-p)),3*(1-p)+.5,'#bcebe3');
     }
    }
   }
   return;
  }
  // A thick articulated/smooth creature arm comes from the nearest ROAD edge.
  // During the snatch the tip tracks the ACTUAL transformed rival car.
  const ax=tx+side*50*f.depart;
  const fromX=mix(edge,tx,f.reach);
  const tipX=f.depart>.01?(actorAnchor?.x??tx+side*340*f.depart):fromX;
  const tipY=(f.depart>.01?(actorAnchor?.y??ty-32*f.depart):mix(ty-48,ty-8,f.reach))-14*f.grip;
  if(r.actor==='tentacle'){
   const stemEndX=tipX-side*8,stemEndY=tipY+5;
   const c1x=edge-side*105,c1y=ty-86-20*Math.sin(f.swirl*.5);
   const c2x=mix(edge,stemEndX,.72),c2y=ty+41+12*Math.sin(f.swirl*.38);
   if(under){
    // Wet entrance, large curling limb and distinct suction cups.
    if(f.reach>.05){for(let i=0;i<6;i++){
     const xx=edge-side*i*21;
     ellipse(ctx,xx,ty+14+Math.sin(i*2)*4,10,2.5,i%2?'#9ac1bc':'#c5e9dd');
    }}
    ctx.lineCap='round';
    const limb=(col,width)=>{ctx.strokeStyle=col;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(edge,ty-58);ctx.bezierCurveTo(c1x,c1y,c2x,c2y,stemEndX,stemEndY);ctx.stroke();};
    limb(ink,34);limb('#417f7b',27);limb('#64a69b',12);
    for(let j=1;j<=6;j++){
     const p=j/7,x=mix(edge,stemEndX,p),y=mix(ty-58,stemEndY,p)+Math.sin(p*Math.PI)*19;
     ellipse(ctx,x,y+7,3.5,2.5,'#e7b5aa');
    }
    if(f.grip>.25){ellipse(ctx,tx,ty+5,7+14*f.grip,2.5,'#8fd2c5');}
   }
   if(over){
    // Curl passes in FRONT of the rival and stays attached during withdrawal.
    if(f.grip>.04){
     const a=Math.max(.05,f.grip),rad=16+4*(1-a);
     ctx.save();ctx.globalAlpha=a;
     ring(ctx,tipX,tipY,rad,12+2*f.struggle,ink,10);
     ring(ctx,tipX,tipY,rad,12+2*f.struggle,'#70afa2',6);
     for(let i=0;i<5;i++){
      const angle=i*Math.PI*2/5+f.swirl*.12;
      ellipse(ctx,tipX+Math.cos(angle)*rad,tipY+Math.sin(angle)*12,3.5,2.8,'#f3c4b1');
     }
     ctx.restore();
    }
    if(f.depart>.2)for(let i=0;i<4;i++){
     const p=f.depart,xx=tx+side*(i*12+p*18),yy=ty+10;
     ring(ctx,xx,yy,6+12*p,2+3*p,'#c4ebe2',Math.max(1.2,3*(1-p)));
    }
   }
   return;
  }
  // Crab: segmented, heavily armoured limb and TWO snapping jaws, not a tentacle.
  const hx=tipX+side*37,hy=tipY;
  if(under){
   line(ctx,[[edge,ty-62],[edge-side*73,ty-27],[hx+side*31,hy+7]],ink,31);
   line(ctx,[[edge,ty-62],[edge-side*73,ty-27],[hx+side*31,hy+7]],'#b9584b',24);
   for(let i=0;i<3;i++){
    const px=mix(edge,hx,i/3),py=mix(ty-62,hy,i/3);
    line(ctx,[[px-side*9,py-6],[px+side*7,py+10]],'#f6ac82',2.6);
   }
   for(let i=0;i<5;i++){
    const a=i*1.5+f.swirl*.2;
    ellipse(ctx,tx+side*Math.cos(a)*22,ty+5+Math.sin(a)*2,2.5,1.7,'#c0d7c7');
   }
  }
  if(over){
   ctx.save();ctx.translate(hx,hy);ctx.rotate(side*.08+side*.20*f.depart);
   body(ctx,side*15,0,30,24,'#d9775c');
   ellipse(ctx,side*13,-8,17,9,'#f0a283');
   // Pincer gap visibly closes during contact; tip encloses target, then pulls.
   const gap=23-18*f.grip;
   const s=side;
   const top=[[s*2,-7],[s*-14,-gap-9],[s*-35,-gap-14],[s*-43,-gap-6],[s*-17,-2]];
   const bot=[[s*2,8],[s*-14,gap+9],[s*-35,gap+14],[s*-43,gap+6],[s*-17,3]];
   poly(ctx,top,ink);poly(ctx,top.map(([x,y])=>[x+s*3,y+2]),'#e48967');
   poly(ctx,bot,ink);poly(ctx,bot.map(([x,y])=>[x+s*3,y-2]),'#e48967');
   // Small triangular teeth make the clamp read rather than generic orange blobs.
   for(let i=0;i<3;i++){
    const xx=-s*(15+i*9);
    poly(ctx,[[xx,-gap+1],[xx+s*5,-gap+1],[xx+s*2, -gap+6]],cream);
    poly(ctx,[[xx,gap-1],[xx+s*5,gap-1],[xx+s*2,gap-6]],cream);
   }
   ellipse(ctx,side*17,-12,4,3,'#f4c49c');
   ctx.restore();
   if(f.grip>.4&&f.depart<.9){
    // Flash of the ridiculous mechanical-sounding pinch.
    for(let i=0;i<4;i++){
     const a=i*Math.PI/2+Math.PI/4,rr=32+7*f.grip;
     line(ctx,[[hx+Math.cos(a)*rr,hy+Math.sin(a)*rr],
      [hx+Math.cos(a)*(rr+6),hy+Math.sin(a)*(rr+6)]],gold,2.5);
    }
   }
  }
 }
 function render(ctx,{id,elapsedMs=0,variant='normal',motion=true,anchorX=null,rivalAnchor=null,actorAnchor=null,layer='all',project=null}={}){
  const r=recipe(id),f=sample(id,elapsedMs,{variant,motion});if(!f)return false;
  ctx.save();
  if(f.family==='crossing'){
   paintCrossingReaction(ctx,f,rivalAnchor);
   for(let i=f.actors.length-1;i>=0;i--)paintAnimal(ctx,r.actor,crossingPose(id,f.actors[i],rivalAnchor,project),i,f.rare,motion);
   if(f.rare&&r.actor==='duck'){
    const d=f.actors[0];ctx.save();ctx.translate(d.x,d.y);ctx.scale(d.scale,d.scale);
    line(ctx,[[-20,-16],[-20,-44]],ink,2);
    fill(ctx,-20,-44,37,12,cream);fill(ctx,-16,-40,29,3,ink);ctx.restore();
   }
  }else if(f.family==='falling')paintFalling(ctx,f,id,rivalAnchor||(Number.isFinite(anchorX)?{x:anchorX,y:r.toY}:null),layer);
  else if(f.family==='launching')paintLaunching(ctx,f,r,rivalAnchor||(Number.isFinite(anchorX)?{x:anchorX,y:r.y}:null),layer,project);
  else paintLifting(ctx,f,r,rivalAnchor||(Number.isFinite(anchorX)?{x:anchorX,y:r.y}:null),actorAnchor,layer);
  ctx.restore();return true;
 }
 return Object.freeze({RECIPES,recipe,sample,rivalTransform,render,approachAnchor,crossingPose,clamp,smooth});
});
