/* Scrap Prix v0.7.23: cumulative environmental and mystery spectacles.
 * Rendering-only. Stages come exclusively from the deterministic engine.
 * Pure timelines support scrubbing, playback speed, Skip and reduced motion.
 * Each stage includes the earlier visual vocabulary, even if a later lap
 * never occurs. No stage is invented or artificially completed here.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapEventMultistage=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DURATION=3400;
 const CHAINS=Object.freeze({
  storm:Object.freeze(['storm-1','storm-2','storm-3']),
  tremor:Object.freeze(['tremor-1','tremor-2','tremor-3']),
  ice:Object.freeze(['crack-ice-1','crack-ice-2','crack-ice-3']),
  lab:Object.freeze(['lab-1','lab-2','lab-3','lab-4']),
  deja:Object.freeze(['deja-vu-1','deja-vu-2','deja-vu-3','deja-vu-4']),
  lights:Object.freeze(['lights-1','lights-2','lights-3','lights-4']),
  mountain:Object.freeze(['mountain-1','mountain-2','mountain-3'])
 });
 const DESCRIPTIONS={
  'storm-1':'Black cloud bank begins swallowing the horizon',
  'storm-2':'First rain and wind arrive under heavy approaching clouds',
  'storm-3':'Full storm, lightning and visible wet road',
  'tremor-1':'The first loose stones jump on the road',
  'tremor-2':'Fault lines branch into the racing surface',
  'tremor-3':'Road fractures into subsiding slabs and a chasm',
  'crack-ice-1':'Thin hairlines appear across a pale frozen surface',
  'crack-ice-2':'Large ice plates separate and flex',
  'crack-ice-3':'The frozen road splits, revealing deep open water',
  'lab-1':'Laboratory warning lights flash in a distant structure',
  'lab-2':'Containment coil sparks and alarms pulse',
  'lab-3':'Containment bursts with shockwave and smoking machine',
  'lab-4':'Sudden silence, dead warning lamps and lingering smoke',
  'deja-vu-1':'A stranger hides beside a forked tree with a pale ribbon',
  'deja-vu-2':'The same unmistakable tree returns with the figure closer',
  'deja-vu-3':'The tree repeats, now with an unobscured watcher',
  'deja-vu-4':'The recurring figure finally lunges toward the camera',
  'lights-1':'A lone impossible light tracks the distant road',
  'lights-2':'Multiple strange lights slide in unnatural formation',
  'lights-3':'A low saucer resolves from the lights over the road shoulder',
  'lights-4':'A silent craft descends, sweeps the road, then vanishes',
  'mountain-1':'A distant rocky peak appears to breathe',
  'mountain-2':'The rocky outline moves and reveals a pair of eyes',
  'mountain-3':'The mountain stands, exposing a colossal body and legs'
 };
 const RECIPES=Object.freeze(Object.fromEntries(Object.entries(CHAINS).flatMap(([family,ids])=>ids.map((id,i)=>[id,Object.freeze({id,family,stage:i+1,totalStages:ids.length,duration:DURATION,description:DESCRIPTIONS[id]})]))));
 const recipe=id=>RECIPES[id]||null;
 const chainFor=id=>{const r=recipe(id);return r?CHAINS[r.family]:null;};
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 const hash=n=>{const s=Math.sin(n*67.731+24.83)*43758.545312;return s-Math.floor(s);};
 function sample(id,elapsedMs=0,{motion=true,variant='normal'}={}){
  const r=recipe(id);if(!r)return null;
  const elapsed=motion?clamp(elapsedMs,0,r.duration):r.duration*.57;
  const t=elapsed/r.duration;
  const beat=t<.17?'warning':t<.49?'build':t<.78?'payoff':'aftermath';
  return {id,family:r.family,stage:r.stage,totalStages:r.totalStages,duration:r.duration,time:elapsed,t,beat,
   progress:smooth((t-.08)/.64),rare:variant==='rare',motion};
 }
 function line(c,x,y,x2,y2,color,width=1){c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
 function ellipse(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.fill();}
 function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
 function poly(c,points,col){c.fillStyle=col;c.beginPath();for(let i=0;i<points.length;i++){const p=points[i];i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);}c.closePath();c.fill();}
 const pt=(project,lane,z)=>project(lane,z);
 function strip(c,project,outer,near,far,col){
  const points=[pt(project,-outer,near),pt(project,outer,near),pt(project,outer,far),pt(project,-outer,far)];
  poly(c,points.map(p=>[p.x,p.y]),col);
 }
 function roadCrack(c,project,lane,z,extent,color,width=1.5){
  const points=[[-.75,-.14],[-.27,.10],[.10,-.05],[.42,.14],[.89,-.03]].map(([a,d])=>pt(project,lane+a*extent,z+d));
  for(let i=1;i<points.length;i++)line(c,points[i-1].x,points[i-1].y,points[i].x,points[i].y,color,width);
  return points;
 }
 // Fractures are made from the actual road projection, not screen-space
 // rectangles.  The near and far lips move apart on the same world road.
 const FRACTURE_NEAR=Object.freeze([[3.18,3.07],[2.54,3.24],[1.78,3.02],[.94,3.21],[.22,3.03],[-.61,3.25],[-1.46,3.06],[-2.30,3.25],[-3.20,3.08]]);
 const FRACTURE_FAR=Object.freeze([[-3.23,5.10],[-2.49,5.31],[-1.65,5.10],[-.89,5.27],[-.09,5.06],[.73,5.30],[1.55,5.08],[2.40,5.28],[3.23,5.11]]);
 function fractureGeometry(project,opening){
  const spread=clamp(opening),middle=4.13;
  const near=FRACTURE_NEAR.map(([lane,z])=>pt(project,lane,middle+(z-middle)*spread));
  const far=FRACTURE_FAR.map(([lane,z])=>pt(project,lane,middle+(z-middle)*spread));
  return {near,far,outline:[...near,...far],opening:spread};
 }
 function drawFracture(c,project,opening,ice=false,time=0){
  if(opening<=.025)return;
  const g=fractureGeometry(project,opening),depth=4.2*opening;
  const col=ice?{hole:'#0e4054',wall:'#286e7c',rim:'#d4f1ee',slab:'#7aaeb8',lit:'#edf7ed'}
               :{hole:'#101c25',wall:'#5a564f',rim:'#c3ae87',slab:'#777469',lit:'#adab9c'};
  // A single jagged void with visibly exposed vertical walls.  A black box
  // hid all of this depth in the previous renderer.
  poly(c,g.outline.map(p=>[p.x,p.y+depth*.4]),col.wall);
  poly(c,g.outline.map(p=>[p.x,p.y]),col.hole);
  for(const edge of [g.near,g.far]){
   for(let i=1;i<edge.length;i++){
    const a=edge[i-1],b=edge[i];
    poly(c,[[a.x,a.y],[b.x,b.y],[b.x,b.y+depth],[a.x,a.y+depth*.62]],col.wall);
    line(c,a.x,a.y,b.x,b.y,col.rim,2+opening*.9);
    line(c,a.x,a.y+depth*.55,b.x,b.y+depth,ice?'rgba(24,118,142,.55)':'rgba(15,21,25,.48)',1);
   }
  }
  // Detached fractured plates lift and tilt at the tear.  Drawn as irregular
  // slabs, never four-corner painted boxes.
  for(let i=0;i<7;i++){
   const a=g.near[i],b=g.near[i+1],side=i%2?1:-1,off=depth*(1.4+(i%3)*.55);
   const m={x:(a.x+b.x)*.5+(i%2?1:-2),y:(a.y+b.y)*.5+off*side};
   poly(c,[[a.x,a.y],[b.x,b.y],[m.x,m.y],[a.x-2,a.y+off*.40]],i%3===0?col.lit:col.slab);
   line(c,a.x,a.y,b.x,b.y,ice?'#e5f9fa':'#ddd0b1',1.3);
  }
  if(ice){
   // Water catches a moving highlight within the gap, and broken triangular
   // floes carry the same projected depth as the lake surface.
   for(let i=0;i<7;i++){
    const p=pt(project,-2.15+i*.70,3.70+Math.sin(i*1.76)*.26);
    const shimmer=(Math.sin(time*.004+i*1.9)+1)*.5;
    line(c,p.x,p.y,p.x+2.5+shimmer*4,p.y-.6,'rgba(140,221,229,.54)',1);
   }
   for(let i=0;i<4;i++){
    const p=pt(project,-1.5+i*1.13,4.05+Math.sin(i*2.4)*.23),r=2.8+opening*2;
    poly(c,[[p.x-r,p.y],[p.x+2*r,p.y+1],[p.x+.4*r,p.y-r*.68]],i%2?'#b9e7e9':'#79bdcb');
   }
  }
  return g;
 }
 function drawStorm(c,s,layer,project){
  const {stage,t,time}=s;
  if(layer==='under'){
   if(stage>=2&&project){
    for(let i=0;i<6+stage;i++){
     const p=pt(project,Math.sin(i*1.7)*2.2,3.1+i*.57),w=4+(i%3)*2;
     ellipse(c,p.x,p.y,w,1.7,stage===3?'rgba(103,164,176,.36)':'rgba(123,158,165,.23)');
     line(c,p.x-w,p.y,p.x+w,p.y,'rgba(221,239,237,.32)',.8);
    }
   }
   return;
  }
  // Storm front actually approaches from the skyline; it does not appear
  // suddenly as a uniform full-screen colour filter.
  const dark=smooth(t/.42),base=.07+stage*.055;
  rect(c,0,0,480,86,`rgba(17,33,54,${base+dark*.08})`);
  for(let i=0;i<10+stage*4;i++){
   const x=(hash(i+8)*590-55)+Math.sin(time*.00042+i)*5;
   const y=12+(i%4)*16+Math.sin(i*1.8)*4;
   const w=42+hash(i+23)*74;
   ellipse(c,x,y,w*.54,7+stage*2+(i%3)*3,`rgba(29,42,62,${.24+stage*.13})`);
  }
  if(stage>=2){
   for(let i=0;i<(stage===2?27:55);i++){
    const x=((hash(i+301)*520+time*(.018+(i%5)*.008))%520)-16;
    const y=((hash(i+509)*250+time*(.10+(i%4)*.026))%250)+2;
    line(c,x,y,x-3-stage,y+7+stage*2,'rgba(216,232,245,.61)',i%7===0?1.5:1);
   }
  }
  if(stage===3){
   // A short deterministic strike happens only in the final storm stage.
   const flash=t>.48&&t<.65?smooth((t-.48)/.06)*(1-smooth((t-.59)/.06)):0;
   if(flash){
    rect(c,0,0,480,235,`rgba(228,239,249,${flash*.14})`);
    const points=[[333,12],[319,40],[330,46],[305,76],[312,89]];
    for(let i=1;i<points.length;i++)line(c,...points[i-1],...points[i],'rgba(253,251,221,.93)',3.3);
    line(c,330,46,346,70,'rgba(252,246,202,.75)',1.6);
    line(c,319,40,307,53,'rgba(252,246,202,.67)',1.5);
   }
   for(let i=0;i<10;i++){
    const y=90+i*15,x=((hash(i+90)*510+time*.036)%510)-10;
    line(c,x,y,x+18,y-3,'rgba(205,225,233,.23)',1);
   }
  }
 }
 function drawTremor(c,s,layer,project,worldRate=.0033){
  if(typeof project!=='function')return;
  const {stage,time,t}=s;
  // Road damage belongs to one fixed WORLD patch, not a fixed camera-depth
  // patch. Follow the same 0.0033 world-units/ms timeline as road markings
  // while a stage plays; keep reduced-motion previews stationary.
  const worldShift=10.0-(s.motion?time*worldRate:0);
  const roadProject=(lane,z)=>project(lane,z+worldShift);
  const exitFade=1-smooth((t-.82)/.18);
  c.globalAlpha*=exitFade;
  if(layer==='under'){
   // Light stones hop before the fault becomes visible.
   for(let i=0;i<14+stage*3;i++){
    const z=3.1+(i%8)*.57,lane=Math.sin(i*2.4)*2.6,p=pt(roadProject,lane,z);
    const pulse=smooth(t/.34)*(1-.72*smooth((t-.62)/.38));
    const bounce=(stage===1?3.1:1.5)*Math.abs(Math.sin(time*.007+i*2.91))*(s.motion?1:0)*pulse;
    ellipse(c,p.x,p.y-bounce,1.7+(i%3)*.75,1.1,'rgba(203,183,139,.87)');
   }
   if(stage>=2){
    const count=stage===2?4:8;
    for(let i=0;i<count;i++){
     const z=3.03+(i%6)*.49,lane=Math.sin(i*2.26)*.8;
     const strength=smooth((t-.10-i*.025)/.23);
     if(strength<.02)continue;
     const points=roadCrack(c,roadProject,lane,z,2.15*strength,'rgba(25,30,31,.94)',stage===3?2.1:1.6);
     for(let k=1;k<4;k++){
      const end=pt(roadProject,lane+Math.sin(i*4+k)*1.3,z+(k%2?.35:-.22));
      line(c,points[k].x,points[k].y,end.x,end.y,'rgba(57,48,40,.68)',.9);
     }
    }
   }
   if(stage===3){
    const open=smooth((t-.40)/.23);
    drawFracture(c,roadProject,open,false,time);
   }
  }else if(stage>=2){
   // Dust and loose material linger ABOVE the road after the ground falls.
   const collapse=stage===3?smooth((t-.40)/.23):0;
   for(let i=0;i<10+stage*3;i++){
    const z=3.0+(i%8)*.42,lane=Math.sin(i*2.13)*3,p=pt(roadProject,lane,z);
    const lift=s.motion?Math.abs(Math.sin(time*.004+i))*(stage===3?6:2):0;
    ellipse(c,p.x+Math.sin(time*.002+i)*2,p.y-2-lift-collapse*3,2.2+(i%3),1.3,
     `rgba(211,171,123,${(stage===3?.30:.19)*(1-collapse*.22)})`);
   }
  }
 }
 function drawIce(c,s,layer,project){
  if(typeof project!=='function')return;
  const {stage,t,time}=s;
  if(layer==='under'){
   // An irregular shallow frozen stretch follows the ROAD footprint rather
   // than putting a floating aqua rectangle over the existing landscape.
   const shore=[[-3.34,2.90],[-3.46,3.55],[-3.22,4.65],[-3.48,5.70],[-3.22,7.42],
    [-3.29,9.15],[3.32,9.15],[3.28,7.51],[3.42,5.65],[3.18,4.70],[3.43,3.58],[3.28,2.90]];
   poly(c,shore.map(([lane,z])=>{const p=pt(project,lane,z);return [p.x,p.y]}),'rgba(127,195,212,.36)');
   for(const side of [-1,1])for(let i=0;i<5;i++){
    const a=pt(project,side*(3.22+hash(i+45)*.17),3.05+i*1.28);
    const b=pt(project,side*(3.35+hash(i+76)*.12),3.65+i*1.28);
    line(c,a.x,a.y,b.x,b.y,'rgba(218,250,248,.73)',1.5);
   }
   // Hairlines grow from a single epicentre.  They do not wander across the
   // screen as unrelated diagonal marks.
   const origin={lane:.12,z:4.22};
   for(let i=0;i<11+stage*2;i++){
    const angle=i*Math.PI*2/(11+stage*2)+.14;
    const strength=smooth((t-.07-(i%4)*.035)/.25);
    if(strength<=.01)continue;
    const extent=(stage===1?.58:stage===2?.96:1.16)*strength;
    const lengthLane=(1.4+(i%3)*.45)*extent*Math.cos(angle);
    const lengthZ=(.64+(i%3)*.18)*extent*Math.sin(angle);
    const a=pt(project,origin.lane,origin.z),b=pt(project,origin.lane+lengthLane*.48,origin.z+lengthZ*.44+.05);
    const e=pt(project,origin.lane+lengthLane,origin.z+lengthZ);
    line(c,a.x,a.y,b.x,b.y,'rgba(36,95,119,.82)',stage===1?1.3:2);
    line(c,b.x,b.y,e.x,e.y,'rgba(31,87,108,.9)',stage===1?1.1:1.7);
    line(c,a.x,a.y-1,b.x,b.y-1,'rgba(236,252,251,.87)',1);
    if(stage>=2){
     const branch=pt(project,origin.lane+lengthLane*.79+Math.sin(i*2)*.37,origin.z+lengthZ*.76+.12);
     line(c,b.x,b.y,branch.x,branch.y,'rgba(43,104,127,.77)',1);
    }
   }
   if(stage>=2){
    // Distinct triangular floating plates create a height cue before the lake
    // actually splits.  They remain attached to the frozen surface.
    for(let i=0;i<5;i++){
     const z=3.25+i*.36,lane=-1.6+(i%4)*1.06,p=pt(project,lane,z),r=1.5+1.3*smooth((t-.28)/.3);
     poly(c,[[p.x-2*r,p.y+1],[p.x+r,p.y-2*r],[p.x+2.3*r,p.y+.5]],'rgba(226,251,251,.49)');
     line(c,p.x-2*r,p.y+1,p.x+r,p.y-2*r,'rgba(56,126,142,.75)',1);
    }
   }
   if(stage===3){
    const open=smooth((t-.41)/.25);
    drawFracture(c,project,open,true,time);
   }
  }else if(stage>=2){
   for(let i=0;i<(stage===3?14:7);i++){
    const p=pt(project,-2+hash(i+61)*4.3,3.1+(i%8)*.47);
    const rise=s.motion?Math.sin(time*.005+i)*2:0;
    rect(c,p.x,p.y-4+rise,1.7,1.7,'rgba(240,254,255,.68)');
   }
  }
 }
 function drawLab(c,s,layer,project){
  const {stage,t,time,motion}=s;
  if(layer==='under'){
   if(stage===3&&typeof project==='function'){
    const strength=smooth((t-.45)/.21)*(1-smooth((t-.78)/.19));
    if(strength>.002){
     const p=pt(project,6,6.15),sz=11+strength*29;
     ellipse(c,p.x,p.y,sz,5+strength*8,`rgba(234,185,117,${strength*.23})`);
     ellipse(c,p.x,p.y,sz*.80,3+strength*5,'rgba(249,226,164,.17)');
    }
   }
   return;
  }
  // The set is an EXPERIMENTAL FACILITY, not a dark box: smokestacks,
  // conduits, warning strips, signed doors and a tall glass reactor.
  const x=345,base=151,reactorX=403,reactorY=105;
  const live=stage!==4,alarm=live&&(!motion||Math.sin(time*.010)>-.10);
  // Industrial outline and identifiable roofline.
  poly(c,[[x-23,111],[x+91,104],[x+111,114],[x+111,base],[x-23,base]],'#172a38');
  poly(c,[[x-23,111],[x-9,100],[x+77,100],[x+91,104]],'#59737a');
  poly(c,[[x-21,116],[x+37,113],[x+37,base-5],[x-21,base-5]],'#425c63');
  rect(c,x-10,84,12,29,'#344b54');rect(c,x-12,80,16,5,'#728589');
  rect(c,x+67,87,10,19,'#31434c');rect(c,x+64,83,17,6,'#71828a');
  for(let i=0;i<3;i++)rect(c,x-16+i*13,base-40,8,7,'#132a38');
  // LAB 07 sign makes the building legible even on the industrial backdrop.
  rect(c,x-13,117,45,15,'#182e38');line(c,x-13,117,x+32,117,'#9db5ae',1);
  if(typeof c.fillText==='function'){
   c.font='bold 11px monospace';c.textBaseline='top';c.fillStyle='#d6ebe4';c.fillText('LAB 07',x-10,119);
  }
  // Warning signage and painted hazard stripes at the access door.
  rect(c,x+6,135,22,16,'#162c37');
  for(let i=0;i<5;i++)line(c,x+5+i*6,147,x+12+i*6,138,'#dcb66b',2);
  poly(c,[[x+50,110],[x+56,100],[x+62,110]],'#f4c16d');
  line(c,x+56,103,x+56,107,'#342b20',1.5);rect(c,x+55,108,2,1,'#342b20');
  // An immense visible containment cylinder with clamps, horizontal rings,
  // and energy inside. It remains identifiable in each of the four stages.
  rect(c,reactorX-20,93,40,58,'#1a343f');
  rect(c,reactorX-15,97,30,47,live?'#397d8a':'#34434a');
  poly(c,[[reactorX-15,97],[reactorX-9,93],[reactorX+9,93],[reactorX+15,97]],'#82999c');
  ellipse(c,reactorX,94,20,6,'#96aaab');
  for(const y of [106,122,140]){
   ellipse(c,reactorX,y,22,5,'#1d3b4b');
   line(c,reactorX-21,y,reactorX+21,y,'#789296',2.5);
  }
  const pulse=motion?Math.sin(time*.009)*.18:0;
  if(live){
   ellipse(c,reactorX,reactorY+15,9+pulse*4,18+pulse*5,'rgba(141,240,227,.75)');
   ellipse(c,reactorX,reactorY+17,3.5,11,'#d8fff0');
  }else{
   poly(c,[[reactorX-11,98],[reactorX+7,98],[reactorX+2,118],[reactorX-14,125]],'#253940');
   line(c,reactorX-11,99,reactorX+6,123,'#9daba8',1.5);
   line(c,reactorX+11,101,reactorX-4,137,'#77878b',1);
  }
  for(const side of [-1,1]){
   line(c,reactorX+side*19,100,reactorX+side*26,90,'#849da1',3);
   line(c,reactorX+side*26,90,reactorX+side*26,82,'#849da1',2);
   rect(c,reactorX+side*23,79,6,6,alarm?'#f4b45e':'#596a6d');
  }
  // Two worker silhouettes leave the facility as the alarms escalate.
  if(stage>=2&&stage!==4){
   for(let i=0;i<2;i++){
    const shift=smooth((t-.14)/.65)*(17+i*10),bx=x+67+i*9+shift,by=153+i*3;
    ellipse(c,bx,by-12,2.2,3,'#1b2c32');
    line(c,bx,by-9,bx+1,by-2,'#1b2c32',3);
    line(c,bx+1,by-2,bx-4,by+3,'#1b2c32',1.7);
    line(c,bx+1,by-2,bx+6,by+3,'#1b2c32',1.7);
   }
  }
  if(stage===2||stage===3){
   const sparks=stage===2?9:14;
   for(let i=0;i<sparks;i++){
    const ang=i*2.4+time*.0003,burst=smooth((t-.14)/.28);
    const px=reactorX+Math.sin(ang)*(17+(i%3)*4),py=119+Math.cos(ang)*(13+(i%4)*4);
    const swing=motion?Math.sin(time*.014+i*7)*5:3;
    line(c,px,py,px+swing,py-5-6*burst,`rgba(252,224,135,${.68+.23*burst})`,1.3+(i%3)*.35);
   }
  }
  if(stage===3){
   const boom=smooth((t-.40)/.14)*(1-smooth((t-.74)/.17));
   if(boom>.005){
    const r=12+boom*58;
    ellipse(c,reactorX,119,r,r*.70,`rgba(255,140,72,${boom*.42})`);
    ellipse(c,reactorX,119,r*.52,r*.42,`rgba(252,240,157,${boom*.73})`);
    for(let i=0;i<15;i++){
     const angle=i*Math.PI*2/15+time*.00009;
     line(c,reactorX+Math.cos(angle)*r*.6,119+Math.sin(angle)*r*.44,
      reactorX+Math.cos(angle)*r*1.28,119+Math.sin(angle)*r*.78,
      'rgba(252,206,138,.75)',1.8);
    }
   }
  }
  if(stage===4){
   // Aftermath: dark dead machinery and slow smoke, not a second explosion.
   poly(c,[[reactorX-22,147],[reactorX-9,122],[reactorX+2,139],[reactorX+12,119],[reactorX+22,148]],'#263943');
   for(let i=0;i<9;i++){
    const drift=motion?time*.003:6,x=reactorX-24+i*6+Math.sin(i*2)*5;
    ellipse(c,x+Math.sin(time*.001+i)*3,107-(i%4)*8-drift,7+(i%3)*4,5+(i%3)*2,'rgba(105,123,127,.24)');
   }
  }
 }
 // The forked tree and pale ribbon recur in each genuine encounter.
 // Roadside scenery scrolls in projected DEPTH. The watcher is occluded by
 // near plants in early stages, and only the fourth event has the lunge.
 function drawDeja(c,s,layer,project){
  if(typeof project!=='function')return;
  const {stage,t,time,motion}=s;
  if(layer==='under'){
   const scroll=motion?time*.0035:0;
   // Layered distant silhouettes and foreground hedges make roadside hiding
   // possible. Independent depth gives parallax rather than screen translation.
   for(let i=10;i>=0;i--){
    const z=3.1+((i*3.27+33-scroll)%33),sc=3.2/z;
    for(const side of [-1,1]){
     const pos=pt(project,side*(4.40+.43*hash(i+side*17)),z);
     const h=(24+(i%4)*12)*sc,wood=side<0?'#243c3d':'#1c353a';
     line(c,pos.x,pos.y,pos.x+side*2*sc,pos.y-h,wood,Math.max(1.2,3*sc));
     poly(c,[[pos.x-15*sc,pos.y-h*.49],[pos.x-9*sc,pos.y-h*.98],
      [pos.x+7*sc,pos.y-h*1.22],[pos.x+16*sc,pos.y-h*.48]],
      i%2?'rgba(28,60,51,.86)':'rgba(22,49,46,.89)');
     const grassW=8*sc;
     poly(c,[[pos.x-grassW,pos.y],[pos.x-3*sc,pos.y-8*sc],
      [pos.x+grassW*.5,pos.y-4*sc],[pos.x+grassW,pos.y]],'#274c43');
    }
   }
   // Unlike a static landmark, the Y-tree approaches from the distant right
   // shoulder along the same vanishing-point projection as the roadside.
   const start=[0,8.6,7.1,5.8,5.0][stage];
   const z=start+3.5*(1-smooth(t/.78)),p=pt(project,4.36,z),sc=4.7/z;
   const tx=p.x,base=p.y,wind=motion?Math.sin(time*.0015)*1.35*sc:0;
   ellipse(c,tx-4*sc,base,25*sc,3.8*sc,'rgba(12,24,30,.43)');
   const figureOffset=[0,-8,10,26,36][stage]*sc;
   const fx=tx+figureOffset,feet=base-1*sc;
   const h=[0,29,39,54,65][stage]*sc;
   // The figure stands BEHIND the tree and thicket. Stage one is truly hidden.
   poly(c,[[fx-5*sc,feet],[fx-8*sc,feet-h+9*sc],[fx+3*sc,feet-h+9*sc],
    [fx+9*sc,feet]],stage===4?'#0e1d26':'#20343a');
   ellipse(c,fx,feet-h,stage===1?3.8*sc:5.4*sc,stage===1?4.8*sc:6.5*sc,'#17232a');
   if(stage>=2){
    line(c,fx-4*sc,feet-h*.61,fx-12*sc,feet-h*.36,'#1b2c32',2.6*sc);
    line(c,fx+5*sc,feet-h*.62,fx+11*sc,feet-h*.30,'#1b2c32',2.6*sc);
   }
   if(stage>=3){
    rect(c,fx-2.7*sc,feet-h-2*sc,2.1*sc,1.7*sc,stage===4?'#f2d6a2':'#abc3b9');
    rect(c,fx+2.2*sc,feet-h-2*sc,2.1*sc,1.7*sc,stage===4?'#f2d6a2':'#abc3b9');
   }
   // The unmistakable forked tree is always the same model.
   line(c,tx,base,tx+2*sc,base-77*sc,'#172b30',11*sc);
   line(c,tx,base-40*sc,tx-31*sc,base-89*sc,'#182f33',6.6*sc);
   line(c,tx+1*sc,base-40*sc,tx+29*sc,base-99*sc,'#172b30',7*sc);
   line(c,tx-21*sc,base-71*sc,tx-42*sc,base-94*sc,'#213d3c',3.5*sc);
   line(c,tx+24*sc,base-74*sc,tx+46*sc,base-87*sc,'#213d3c',3.7*sc);
   for(let i=0;i<6;i++){
    const x=tx+(i%2?1:-1)*(13+(i*7)%27)*sc;
    const y=base-(75+(i*13)%35)*sc;
    ellipse(c,x,y,(10+(i%3)*4)*sc,5*sc,'rgba(26,63,53,.86)');
   }
   // Pale fabric is a recognition marker visible across ALL encounters.
   const rx=tx+19*sc+wind,ry=base-51*sc;
   line(c,tx+14*sc,base-56*sc,rx,ry,'#eddfb5',2.3*sc);
   poly(c,[[rx,ry],[rx+10*sc,ry+2*sc],[rx+14*sc,ry+6*sc],
    [rx+2*sc,ry+4*sc]],'#f0e0b9');
   // Cover the figure's lower half with foliage only during the first two
   // sightings; later the player finally gets an unobstructed look.
   if(stage<=2){
    poly(c,[[fx-17*sc,base],[fx-12*sc,base-23*sc],
     [fx-1*sc,base-31*sc],[fx+15*sc,base-18*sc],[fx+19*sc,base]],'#1b463d');
   }
   return;
  }
  if(stage!==4||!motion)return;
  // Existing rare fourth-encounter scare is preserved, not made common.
  const burst=smooth((t-.51)/.105)*(1-smooth((t-.75)/.15));
  if(burst<=.001)return;
  const cy=155-16*burst;
  rect(c,0,0,480,270,`rgba(9,14,25,${burst*.25})`);
  poly(c,[[240-65*burst,241],[240-70*burst,cy+20],[240-40*burst,cy-33*burst],
   [240+40*burst,cy-33*burst],[240+70*burst,cy+20],[240+65*burst,241]],
   `rgba(10,17,27,${burst*.95})`);
  ellipse(c,240,cy-18*burst,16+36*burst,19+37*burst,
   `rgba(38,52,61,${Math.min(1,burst*.95)})`);
  ellipse(c,240,cy-13*burst,13+28*burst,16+31*burst,
   `rgba(12,21,29,${Math.min(1,burst*.98)})`);
  const eyeY=cy-27*burst;
  rect(c,240-20*burst,eyeY,5+7*burst,2+4*burst,`rgba(250,209,166,${burst})`);
  rect(c,240+9*burst,eyeY,5+7*burst,2+4*burst,`rgba(250,209,166,${burst})`);
  for(let i=0;i<5;i++){
   const y=48+i*34;
   line(c,10,y,10+42*burst,y,'rgba(226,231,211,.12)',1.1);
   line(c,470,y,470-42*burst,y,'rgba(226,231,211,.12)',1.1);
  }
 }
 function drawLights(c,s,layer,project){
  const {stage,t,time,motion}=s;
  const advance=smooth((t-.12)/.59);
  if(layer==='under'){
   if(stage>=3&&typeof project==='function'){
    const p=pt(project,2.4,4.55),strength=(stage===4?.27:.13)*smooth((t-.16)/.25);
    ellipse(c,p.x,p.y,10+advance*(stage===4?34:16),3+advance*7,`rgba(137,232,228,${strength})`);
    ellipse(c,p.x,p.y,4+advance*11,2+advance*3,'rgba(221,246,216,.16)');
    if(stage===4)for(let i=0;i<9;i++){
     const v=pt(project,2.4+(hash(i+69)-.5)*1.5,4.4+(i%4)*.38);
     ellipse(c,v.x,v.y,1.4,1,'rgba(206,255,243,.29)');
    }
   }
   return;
  }
  const drift=motion?Math.sin(time*.0013)*8:0;
  // Each further stage retains the telltale pinpricks before the full craft.
  for(let i=0;i<(stage===1?1:stage>=3?3:2);i++){
   const x=319+i*19+drift*(i%2?-1:1),y=53+(i%2?12:0)+(stage===2&&motion?Math.sin(time*.003+i*2)*6:0);
   ellipse(c,x,y,5+i*.8,3.6,'rgba(113,245,232,.13)');
   ellipse(c,x,y,2.1,1.7,'#d6f7de');
  }
  if(stage===2){
   // A geometrically impossible, reversible slide across the skyline.
   const x=320+advance*44,y=52+Math.sin(advance*Math.PI*2)*8;
   line(c,x,y,x+25,y+12,'rgba(134,240,220,.35)',1.1);
   ellipse(c,x+25,y+12,2.6,2.1,'#e7e9d0');
  }
  if(stage<3)return;
  const retreat=stage===4?smooth((t-.73)/.23):0;
  const size=stage===4?1.4:.70;
  const cx=(stage===4?286:335)+(stage===4?30*advance:0)+(retreat*154);
  const cy=(stage===4?43:69)-(retreat*88)+Math.sin(time*.002)*1.8*(motion?1:0);
  const w=(stage===4?85:66)*size*(1-retreat*.72),h=22*size*(1-retreat*.72);
  // Under-lit metal rim, central domed cockpit, spaced indicator lights.
  if(stage===4&&t>.18&&t<.78){
   poly(c,[[cx-11,cy+h*.8],[cx+11,cy+h*.8],[332,176],[279,174]],
    `rgba(126,232,219,${.08+.15*smooth((t-.18)/.25)*(1-retreat)})`);
  }
  poly(c,[[cx-w*.60,cy],[cx-w*.30,cy-h*.44],[cx+w*.33,cy-h*.44],[cx+w*.60,cy],
   [cx+w*.36,cy+h*.42],[cx-w*.32,cy+h*.42]],'#1a3341');
  ellipse(c,cx,cy-h*.21,w*.27,h*.70,'#537b83');
  ellipse(c,cx,cy-h*.34,w*.15,h*.40,'#9bc0b7');
  ellipse(c,cx,cy+h*.19,w*.51,h*.26,'#253d49');
  for(let i=0;i<7;i++){
   const x=cx-w*.39+i*w*.13;
   ellipse(c,x,cy+h*.30,Math.max(.9,w*.025),Math.max(.7,h*.10),i%2?'#9bddc3':'#e4da9c');
  }
  if(stage===4&&retreat>.02){
   for(let i=1;i<5;i++){
    line(c,cx-8-i*22,cy+i*4,cx-20-i*27,cy+i*8,`rgba(189,253,241,${.44*(1-retreat)})`,2);
   }
  }
 }
 function drawMountain(c,s,layer,project){
  const {stage,t,time,motion}=s;
  const rise=stage===3?smooth((t-.23)/.48):0;
  const breath=motion?Math.sin(time*.003)*(stage===1?2.5:stage===2?3.7:2):0;
  const mx=257,my=94-rise*27+breath;
  // The distant peak belongs BEHIND rival vehicles, with perspective size.
  // Each real encounter reveals it is much larger and closer than assumed.
  if(layer==='over')return;
  if(stage===3&&typeof project==='function'){
    const dust=smooth((t-.35)/.18)*(1-smooth((t-.82)/.17));
    const p=pt(project,0,11.4);
    for(let i=0;i<13;i++){
     const x=p.x-96+i*16,y=p.y-(i%4)*3;
     ellipse(c,x,y,8+(i%3)*4,2.8+(i%2)*2,`rgba(192,168,131,${dust*.14})`);
    }
  }
  c.save();
  const scale=stage===1?.49:stage===2?.67:1;
  const worldX=stage===1?336:stage===2?316:257;
  const worldY=stage===1?93:stage===2?90:my;
  c.translate(worldX,worldY);c.scale(scale,scale);c.translate(-mx,-my);
  // Keep the same characteristic split summit in every stage. This is a
  // single creature on a ridge, not a new mountain pasted on top each lap.
  if(stage===3){
   const ground=97;
   for(const [x,lean] of [[mx-61,-18],[mx-20,-9],[mx+29,13],[mx+65,18]]){
    const y=my+11;
    poly(c,[[x-11,y-3],[x+9,y-3],[x+14+lean*rise,ground+37*rise],
     [x-4+lean*rise,ground+37*rise]],'#283942');
    line(c,x-2+lean*rise,ground+31*rise,x+14+lean*rise,ground+32*rise,'#182934',3);
   }
  }
  // Massive irregular silhouette with two different peaks, identifiable
  // from first sighting to final standing form.
  poly(c,[[mx-116,my+9],[mx-97,my-11],[mx-77,my-24],[mx-51,my-48],
   [mx-21,my-32],[mx+8,my-57],[mx+37,my-27],[mx+65,my-19],
   [mx+84,my+2],[mx+113,my+10]],'#273c47');
  poly(c,[[mx-88,my-5],[mx-51,my-48],[mx-35,my-19],[mx-18,my-18],
   [mx+8,my-57],[mx+30,my-10],[mx+59,my-7],[mx+78,my+4]],'#475b60');
  poly(c,[[mx-57,my-37],[mx-51,my-48],[mx-40,my-31]],'#9ca8a2');
  poly(c,[[mx-1,my-44],[mx+8,my-57],[mx+18,my-35]],'#aeb7ae');
  for(let i=0;i<6;i++){
   const x=mx-80+i*33,y=my-14+(i%3)*5;
   line(c,x,y,x-5,y+7,'rgba(16,36,42,.45)',1.7);
  }
  if(stage>=2){
   const glow=stage===3?'#f6c579':'#dfc891';
   // Pairs of deliberate eyes rather than generic glowing windows.
   poly(c,[[mx-24,my-24],[mx-10,my-22],[mx-5,my-16],[mx-20,my-18]],'#182934');
   poly(c,[[mx+11,my-22],[mx+23,my-25],[mx+30,my-20],[mx+16,my-17]],'#182934');
   line(c,mx-21,my-21,mx-10,my-20,glow,2.4);
   line(c,mx+15,my-20,mx+25,my-22,glow,2.4);
   // What looked like a mountain path now opens into a craggy mouth.
   if(stage===3){
    const gape=smooth((t-.43)/.24);
    poly(c,[[mx-13,my-6],[mx+19,my-6],[mx+12,my+gape*9],[mx-7,my+gape*9]],'#182935');
    for(let i=0;i<4;i++)line(c,mx-7+i*7,my-6,mx-6+i*7,my-2,'#9ca8a2',1);
    for(let i=0;i<12;i++){
     const x=mx-104+hash(i+400)*198,y=97+hash(i+500)*9;
     ellipse(c,x,y+rise*(i%3)*1.7,4+(i%4)*3,2.2,`rgba(175,165,132,${.2*rise})`);
    }
   }
  }
  c.restore();
 }
 function cameraImpulse(id,elapsedMs=0,{motion=true}={}){
  const s=sample(id,elapsedMs,{motion});if(!s||!motion)return {x:0,y:0};
  const major=(s.family==='deja'&&s.stage===4)||(s.family==='mountain'&&s.stage===3)||(s.family==='tremor'&&s.stage>=2)||(s.family==='ice'&&s.stage===3)||(s.family==='lab'&&s.stage===3)||(s.family==='storm'&&s.stage===3);
  if(!major)return {x:0,y:0};
  const weight=s.family==='deja'?1.8:s.stage===3?2.1:.9;
  const amp=(s.family==='deja'?smooth((s.t-.51)/.07):s.family==='mountain'?smooth((s.t-.46)/.12):s.family==='tremor'?1:s.family==='ice'||s.family==='lab'?smooth((s.t-.43)/.10):smooth((s.t-.5)/.10))*(1-smooth((s.t-.83)/.15));
  return {x:Math.sin(s.time*.024)*weight*amp,y:Math.cos(s.time*.031)*weight*.48*amp};
 }
 function render(ctx,{id,elapsedMs=0,variant='normal',motion=true,layer='over',project=null,worldUnitsPerMs=.0033}={}){
  const s=sample(id,elapsedMs,{variant,motion});if(!s)return false;
  if(layer!=='under'&&layer!=='over')return true;
  ctx.save();
  const dispatch={storm:drawStorm,tremor:drawTremor,ice:drawIce,lab:drawLab,
   deja:drawDeja,lights:drawLights,mountain:drawMountain};
  dispatch[s.family](ctx,s,layer,project,Number.isFinite(worldUnitsPerMs)?clamp(worldUnitsPerMs,.0015,.006):.0033);
  ctx.restore();return true;
 }
 return Object.freeze({DURATION,CHAINS,RECIPES,recipe,chainFor,sample,render,cameraImpulse,fractureGeometry});
});
