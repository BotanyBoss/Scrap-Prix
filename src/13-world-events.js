/* Scrap Prix v0.7.19d — modular weather, surface, obstacles, routes, destruction and branching shortcuts.
 * Presentation ONLY: no RNG calls, event selection, gameplay logic or saves.
 * All poses are pure functions of time; DEV scrubbing and reduced motion work.
 * The two layers draw under/over cars so puddles cannot float in mid-air.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapEventEffects=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
 const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
 const mod=(a,n)=>((a%n)+n)%n;
 const hash=n=>mod(Math.sin((n+1)*127.1)*43758.5453,1);
 const defs={
  downpour:['weather','Hard diagonal rain, wet-road glare and visible splashes'],
  fog:['weather','Layered rolling fog that reduces distance without hiding the cars'],
  heatwave:['weather','Heat ripples and warm glints without distorting vehicle geometry'],
  crosswind:['weather','Gusts and blown particles sweeping across the road'],
  hail:['weather','Sharp falling ice pellets and ground rebounds'],
  'storm-1':['weather','Distant cloud front approaching the horizon'],
  'storm-2':['weather','Thicker cloud ceiling and rising rain'],
  'storm-3':['weather','Full rainstorm with a brief distant lightning flash'],
  oil:['surface','A dark rainbow-sheened slick with irregular boundaries'],
  flood:['surface','A shallow flooded section with rippling reflections'],
  ice:['surface','An almost-invisible frozen strip with small icy glints'],
  potholes:['surface','Perspective-scaled holes with darker centres and raised edges'],
  sand:['surface','Accumulated sand bands and soft wind-blown grains'],
  snow:['surface','Snow banks spilling onto the roadway, plus light flurries'],
  cargo:['obstacle','Dropped wooden crates, rolling barrels, and a stray invoice'],
  pileup:['obstacle','Several distinctly wrecked cars blocking the road'],
  grass:['obstacle','Overgrown grass and tufts of weeds concealing the road'],
  roadworks:['obstacle','Traffic cones, striped barriers, and a narrow open lane'],
  debris:['obstacle','Loose wheels, snapped metal, and bouncing spare parts'],
  bins:['obstacle','Temporary urban chicane of runaway wheelie bins'],
  gravel:['obstacle','Loose gravel spreads over the racing line'],
  clearline:['obstacle','Road obstacles shift aside to reveal the perfect racing line'],
  delivery:['obstacle','A misaddressed sponsor shipment and loose parcels'],
  ramp:['route','An angled jump ramp with warning paint, bracing and an approach lane'],
  bridge:['route','A road bridge missing its centre deck, with broken rails and hanging planks'],
  crater:['destruction','A deep road crater with a fractured rim, rubble and dust'],
  'tremor-1':['destruction','Pebbles hop across the road as the first tremors arrive'],
  'tremor-2':['destruction','Branching cracks extend across the asphalt'],
  'tremor-3':['destruction','Road slabs subside to expose a jagged collapsing gap'],
  'wreckage-shortcut':['shortcut','A narrow passable lane between wrecked cars and mountains of scrap'],
  'overgrown-shortcut':['shortcut','An improvised path through thick grass and swaying foliage'],
  'flooded-shortcut':['shortcut','A water-covered service road framed by warning posts and ripple lines'],
  'dune-shortcut':['shortcut','A sandy off-road track through soft dunes with two tyre ruts'],
  'frozen-lake-shortcut':['shortcut','A broad frozen-lake crossing with a translucent ice sheet and stress cracks']
 };
 const RECIPES=Object.freeze(Object.fromEntries(Object.entries(defs).map(([id,[family,description]])=>[id,Object.freeze({id,family,description,duration:family==='shortcut'?9500:3400})])));
 const recipe=id=>RECIPES[id]||null;
 const particle=(id,i,time,axis=0)=>{const h=hash(i+id.length*23+axis*311);return mod(h*480+time,480);};
 const alpha=(t)=>smooth(t/.16)*(1-smooth((t-.84)/.16));
 function sample(id,elapsedMs=0,{variant='normal',motion=true}={}){
  const r=recipe(id);if(!r)return null;
  const time=motion?clamp(elapsedMs,0,r.duration):r.duration*.47;
  const t=time/r.duration;
  return {id,family:r.family,t,time,rare:variant==='rare',strength:motion?(.4+.6*alpha(t)):1,stage:t<.17?'approach':t<.8?'active':'settle'};
 }
 const line=(ctx,x,y,x2,y2,col,w=1)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();};
 const ellipse=(ctx,x,y,rx,ry,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
 const rect=(ctx,x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(x,y,w,h);};
 function polygon(ctx,points,col){ctx.fillStyle=col;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
 function rain(ctx,time,intensity=1){
  const count=Math.round(34*intensity);
  for(let i=0;i<count;i++){
   const x=particle('rain',i,time*.095*(.65+(i%3)*.13))-12;
   const y=mod(hash(i+302)*285+time*(.15+(i%5)*.013),278)-5;
   const size=4+(i%4)*1.5;
   line(ctx,x,y,x-size*.39,y+size,'rgba(216,236,244,.73)',i%7===0?1.5:.9);
   if(i%9===0&&y>135)ellipse(ctx,x+1,Math.min(268,y+size),3,.8,'rgba(231,243,242,.36)');
  }
 }
 function snow(ctx,time,intensity=1){
  const count=Math.round(30*intensity);
  for(let i=0;i<count;i++){
   const x=particle('snow',i,time*.015+Math.sin(time*.0005+i)*7);
   const y=mod(hash(i+412)*295+time*(.022+(i%4)*.007),280)-4;
   const size=(i%7===0?3:1.6);
   rect(ctx,x,y,size,size,'rgba(246,251,250,.78)');
  }
 }
 function dust(ctx,time,intensity=1){
  const count=Math.round(22*intensity);
  for(let i=0;i<count;i++){
   const x=particle('dust',i,time*(.015+(i%5)*.005));
   const y=107+hash(i+83)*148;
   rect(ctx,x,y,1+(i%3),1+(i%2),'rgba(228,185,123,.43)');
  }
 }
 function fog(ctx,time,intensity=1){
  // Continuous depth haze instead of conspicuous horizontal rectangles.
  // Concentrate around the horizon and feather to clear foreground where
  // cars, hazards and their contact shadows must stay legible.
  const strength=Math.min(2.2,Math.max(.2,intensity));
  const haze=ctx.createLinearGradient(0,57,0,196);
  haze.addColorStop(0,'rgba(211,226,229,0)');
  haze.addColorStop(.19,`rgba(211,226,229,${(.06+.055*strength).toFixed(3)})`);
  haze.addColorStop(.39,`rgba(211,226,229,${(.09+.09*strength).toFixed(3)})`);
  haze.addColorStop(.73,`rgba(211,226,229,${(.02+.035*strength).toFixed(3)})`);
  haze.addColorStop(1,'rgba(211,226,229,0)');
  ctx.fillStyle=haze;ctx.fillRect(0,57,480,139);
  // Sparse non-mirrored wisps drift naturally with soft radial boundaries.
  for(let i=0;i<3;i++){
   const drift=Math.sin(time*.00024+i*2.13)*17;
   const x=85+i*155+drift,y=107+i%2*17;
   ctx.save();ctx.translate(x,y);ctx.scale(115+(i%2)*27,17+i*5);
   const wisp=ctx.createRadialGradient(0,0,.02,0,0,1);
   wisp.addColorStop(0,`rgba(221,233,232,${(.10+.045*strength).toFixed(3)})`);
   wisp.addColorStop(1,'rgba(221,233,232,0)');
   ctx.fillStyle=wisp;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
  }
 }
 function wind(ctx,time,intensity=1){
  for(let i=0;i<9+Math.round(intensity*3);i++){
   const x=particle('gust',i,time*.1)-75;
   const y=92+hash(i+67)*148;
   const len=18+(i%4)*11;
   line(ctx,x,y,x+len,y-6,'rgba(244,235,203,.44)',i%4===0?2:1);
   line(ctx,x+len*.78,y-7,x+len+5,y-6,'rgba(244,235,203,.30)',1);
  }
 }
 function hail(ctx,time,intensity=1){
  for(let i=0;i<Math.round(21*intensity);i++){
   const x=particle('hail',i,time*.038);
   const y=mod(hash(i+117)*290+time*.18,282)-5;
   rect(ctx,x,y,2+(i%5===0?1:0),2,'rgba(234,248,250,.90)');
   if(i%5===0&&y>135){
    line(ctx,x-3,y+3,x+4,y+3,'rgba(224,243,245,.46)',1);
   }
  }
 }
 function heat(ctx,time,intensity=1){
  ctx.save();
  rect(ctx,0,101,480,130,`rgba(243,145,71,${.018*intensity})`);
  for(let i=0;i<8;i++){
   const x=72+i*48,base=119+(i%3)*19;
   for(let j=0;j<3;j++){
    const yy=base+j*11,drift=Math.sin(time*.0023+i*1.3+j*1.2)*3;
    line(ctx,x+drift,yy,x-1-drift,yy-6,'rgba(251,224,172,.26)',1.2);
   }
  }
  ctx.restore();
 }
 function cloud(ctx,time,stage){
  const alphaStage=.12+stage*.065;
  rect(ctx,0,0,480,85,`rgba(25,40,58,${alphaStage})`);
  for(let i=0;i<9+stage*2;i++){
   const x=mod(hash(i+609)*610+time*.007*(i%2?-1:1),610)-75;
   const y=10+(i%4)*15;
   rect(ctx,x,y,65+(i%3)*21,12+(i%3)*4,`rgba(41,58,78,${.25+stage*.09})`);
  }
  if(stage>=3){
   const flash=(Math.sin(time*.009)> .993)?1:0;
   if(flash) {rect(ctx,0,0,480,250,'rgba(234,240,247,.12)');line(ctx,357,24,344,44,'rgba(255,246,210,.60)',2);line(ctx,344,44,354,64,'rgba(255,246,210,.60)',2);}
  }
 }
 function patch(ctx,proj,lane,z,width,colour,shine){
  const a=proj(lane-width,z+.48),b=proj(lane+width,z+.48);
  const c=proj(lane+width,z),d=proj(lane-width,z);
  polygon(ctx,[[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]],colour);
  if(shine)line(ctx,(a.x+b.x)/2,(a.y+b.y)/2,(c.x+d.x)/2,(c.y+d.y)/2,shine,1.1);
 }
 function surface(ctx,id,time,rare,project){
  if(typeof project!=='function')return;
  if(id==='oil'){
   for(let i=0;i<5;i++){
    const z=2.1+i*.6,lane=Math.sin(i*1.37)*.45;
    patch(ctx,project,lane,z,1.6-(i%3)*.09,'rgba(16,27,34,.84)',i%2?'rgba(107,177,206,.40)':'rgba(197,146,177,.40)');
   }
   if(rare)for(let i=0;i<4;i++){const p=project(Math.sin(i*2)*.6,2.5+i*.45);ellipse(ctx,p.x,p.y,2.1,.8,'rgba(243,184,122,.69)');}
  }else if(id==='flood'){
   for(let i=0;i<8;i++){
    const z=2+i*.51;
    patch(ctx,project,Math.sin(i*.8)*.09,z,3.22,'rgba(94,178,196,.44)',i%2?'rgba(221,244,240,.60)':null);
    const p=project(Math.sin(i*.7)*1.5,z);line(ctx,p.x-6,p.y,p.x+7,p.y,'rgba(207,242,243,.54)',.9);
   }
   if(rare)for(let i=0;i<3;i++){
    const p=project(Math.sin(i*4)*1.2,2.8+i*.8),f=Math.sin(time*.005+i)*3;
    polygon(ctx,[[p.x-6,p.y+f],[p.x,p.y-2+f],[p.x+7,p.y+f],[p.x,p.y+3+f]],'rgba(26,69,82,.64)');
   }
  }else if(id==='ice'){
   for(let i=0;i<7;i++){
    const z=2.2+i*.57;
    patch(ctx,project,Math.sin(i*.7)*.3,z,2.35,'rgba(137,192,203,.38)',i%2?'rgba(238,251,247,.42)':null);
    const p=project(Math.cos(i*2)*.5,z);line(ctx,p.x-7,p.y-2,p.x+3,p.y+2,'rgba(248,250,245,.48)',.8);
   }
  }else if(id==='potholes'){
   for(let i=0;i<8;i++){
    const z=1.9+i*.52,lane=Math.sin(i*2.4)*2.3,p=project(lane,z);
    const scale=2.4/z;ellipse(ctx,p.x,p.y,Math.max(3,13*scale),Math.max(1.5,4.1*scale),'rgba(159,153,133,.55)');
    ellipse(ctx,p.x,p.y+Math.max(.3,scale*.3),Math.max(2.2,10*scale),Math.max(.9,2.8*scale),'rgba(23,30,34,.91)');
   }
  }else if(id==='sand'||id==='snow'){
   const isSnow=id==='snow';
   // Uneven shoulder drifts instead of full-width rectangular road stripes.
   // The route stays visually open and rival cars remain easy to read.
   for(let i=0;i<11;i++){
    const z=1.75+i*.40;
    for(const side of [-1,1]){
     const lane=side*(2.48+.14*Math.sin(i*1.75+side));
     patch(ctx,project,lane,z,.42+.13*(i%3),isSnow?'rgba(239,247,246,.76)':'rgba(226,185,124,.68)',null);
    }
    if(i%3===0){
     const lane=Math.sin(i*2.7)*1.23;
     patch(ctx,project,lane,z+.19,.29,isSnow?'rgba(221,237,239,.39)':'rgba(212,176,118,.40)',null);
    }
   }
  }
 }
 // v0.7.17: all roadside object recipes share perspective and stage timing.
 // Drawing is deterministic and never calls the race engine. Objects are
 // placed UNDER vehicles; only loose particles and smoke draw over them.
 function obstacleDepth(t,index=0){
  // Drive toward the obstacle, without teleporting from the horizon to the camera.
  return clamp(9.1-6.6*smooth(clamp((t+.09)/.96))+.38*(index%4),2.35,10);
 }
 function prop(ctx,project,lane,z,type,{time=0,variant=false,seed=0,angle=0}={}){
  const p=project(lane,z),sc=clamp(3.7/z,.36,1.65);
  ellipse(ctx,p.x,p.y+1,13*sc,3.3*sc,'rgba(13,26,31,.37)');
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(sc,sc);if(angle)ctx.rotate(angle);
  if(type==='crate'||type==='parcel'){
   const col=type==='parcel'?'#cf9b57':'#946545';
   rect(ctx,-11,-17,22,17,'#263c42');rect(ctx,-9,-16,18,15,col);
   rect(ctx,-9,-16,18,3,'#e5bd7e');line(ctx,-8,-13,8,-2,'rgba(73,47,38,.75)',1.5);
   if(type==='parcel'){rect(ctx,-4,-16,8,15,'#eee2ba');rect(ctx,-9,-9,18,3,'#eee2ba');}
  }else if(type==='barrel'){
   rect(ctx,-9,-17,18,17,'#a94f3b');ellipse(ctx,0,-17,9,3,'#d4774a');
   for(const y of [-13,-4])rect(ctx,-9,y,18,3,'#d5c195');
   ellipse(ctx,0,0,9,3,'#6b3b35');
  }else if(type==='cone'){
   polygon(ctx,[[-8,0],[-3,-19],[3,-19],[8,0]],'#e88738');
   rect(ctx,-5,-8,10,4,'#f7efd2');rect(ctx,-10,-2,20,4,'#263a43');
  }else if(type==='barrier'){
   rect(ctx,-26,-20,52,13,'#243943');rect(ctx,-24,-18,48,9,'#f2e5cb');
   for(let i=0;i<5;i++)polygon(ctx,[[-23+i*10,-9],[-16+i*10,-9],[-11+i*10,-18],[-18+i*10,-18]],'#d86443');
   rect(ctx,-18,-7,4,9,'#263940');rect(ctx,14,-7,4,9,'#263940');
  }else if(type==='sign'){
   rect(ctx,-2,-31,4,31,'#2a3d44');rect(ctx,-24,-37,48,21,'#f1ca66');
   rect(ctx,-20,-33,40,13,'#2b4149');
   polygon(ctx,[[-13,-27],[-2,-32],[-2,-29],[13,-29],[13,-25],[-2,-25],[-2,-22]],'#f1ca66');
  }else if(type==='wreck'){
   rect(ctx,-27,-13,54,12,'#26343b');
   rect(ctx,-23,-19,44,14,seed%2?'#b75e41':'#658c88');
   polygon(ctx,[[-17,-19],[-11,-28],[11,-28],[18,-19]],seed%2?'#e29c67':'#8ac1bf');
   rect(ctx,-8,-25,15,6,'#223a46');rect(ctx,-21,-8,42,4,'#d5b382');
   rect(ctx,-25,-5,12,8,'#17282e');rect(ctx,13,-5,12,8,'#17282e');
   line(ctx,12,-27,26,-34,'#263940',2);
  }else if(type==='grass'){
   for(let k=0;k<7;k++){
    const a=(k-3)*4,lean=Math.sin(time*.004+seed*2+k)*3;
    line(ctx,a,0,a+lean+(k-3)*1.5,-15-(k%3)*8,k%3?'#4a8a51':'#9ba75c',2.2);
   }
  }else if(type==='scrap'){
   if(seed%3===0){
    ellipse(ctx,0,-6,10,8,'#243d43');ellipse(ctx,0,-6,5,4,'#94a9a7');ellipse(ctx,0,-6,2,2,'#243d43');
   }else if(seed%3===1){
    polygon(ctx,[[-12,-3],[-4,-14],[6,-11],[11,-5],[9,0]],'#9d6150');
    line(ctx,-10,-4,9,-9,'#e0c18b',2);
   }else{
    rect(ctx,-12,-10,25,9,'#d4ab6f');rect(ctx,-9,-12,5,12,'#30444b');
   }
  }else if(type==='bin'){
   rect(ctx,-13,-25,26,25,'#203f48');rect(ctx,-10,-23,20,19,seed%2?'#4d8e79':'#47839a');
   rect(ctx,-16,-28,32,5,'#263940');rect(ctx,-9,-2,5,5,'#1b2a30');rect(ctx,5,-2,5,5,'#1b2a30');
   rect(ctx,-3,-18,6,9,'#e6d9ad');
  }else if(type==='stone'){
   polygon(ctx,[[-8,-1],[-5,-7],[3,-9],[9,-3],[6,0]],seed%2?'#7d8788':'#bdad91');
  }
  ctx.restore();
  return p;
 }
 function obstacles(ctx,id,s,project){
  if(typeof project!=='function')return;
  const t=s.t,z=obstacleDepth(t),time=s.time,rare=s.rare;
  // A small set of compatible object primitives is enough to make each
  // scene legible, while individual layouts retain event personality.
  if(id==='cargo'){
   for(let i=0;i<10;i++){
    const dz=z+(i-4)*.43,lane=2.35*Math.sin(i*2.8+.2);
    prop(ctx,project,lane,clamp(dz,1.4,12),i%3===0?'barrel':'crate',{seed:i,angle:i===3?Math.sin(t*12)*.28:0});
   }
  }else if(id==='pileup'){
   for(let i=0;i<5;i++)prop(ctx,project,[-1.8,.7,2.15,-.5,1.65][i],clamp(z+(i-2)*.67,1.3,12),'wreck',{seed:i});
   // A small piece of wreckage blocks the easy escape, but keeps lane markings visible.
   prop(ctx,project,-2.2,z+1.3,'scrap',{seed:2});
  }else if(id==='grass'){
   for(let i=0;i<25;i++){
    const row=Math.floor(i/5),lane=(i%5-2)*1.65+Math.sin(i*3)*.14;
    prop(ctx,project,lane,clamp(z+(row-2)*.75,1.3,12),'grass',{time,seed:i});
   }
  }else if(id==='roadworks'){
   for(let i=0;i<8;i++){
    const zc=clamp(z+(i-3)*.45,1.3,12);
    prop(ctx,project,i%2?-.25:1.9,zc,'cone',{seed:i});
   }
   prop(ctx,project,1.55,z+.65,'barrier',{seed:1});
   prop(ctx,project,3.75,z+2,'sign',{seed:1});
  }else if(id==='debris'){
   for(let i=0;i<14;i++)prop(ctx,project,Math.sin(i*2.31)*2.6,clamp(z+(i-6)*.26,1.3,12),'scrap',{seed:i,angle:.09*Math.sin(t*8+i)});
  }else if(id==='bins'){
   for(let i=0;i<4;i++)prop(ctx,project,[-2.25,.55,2.4,-.45][i]+Math.sin(t*4+i)*.14,clamp(z+(i-1.5)*.9,1.3,12),'bin',{seed:i,angle:i===1?Math.sin(t*5)*.09:0});
  }else if(id==='gravel'){
   for(let i=0;i<38;i++){
    const p=project(Math.sin(i*9.1)*3,clamp(z+(i%9-4)*.28,1.3,12));
    const sc=clamp(2.4/(z+(i%9-4)*.28),.3,1.7);
    ellipse(ctx,p.x,p.y,2.9*sc,1.2*sc,i%3?'#b6a385':'#627c7d');
   }
  }else if(id==='clearline'){
   // Move unwanted track clutter out to both shoulders; the open line is the gag.
   const clear=smooth(clamp((t-.17)/.58));
   for(let i=0;i<8;i++){
    const side=i%2?-1:1;
    const lane=side*(.38+3.05*clear)+.12*Math.sin(i*2);
    prop(ctx,project,lane,clamp(z+(i-3)*.55,1.3,12),i%3?'cone':'scrap',{seed:i});
   }
  }else if(id==='delivery'){
   for(let i=0;i<8;i++)prop(ctx,project,Math.sin(i*2.2)*1.8,clamp(z+(i-3)*.46,1.3,12),'parcel',{seed:i});
   prop(ctx,project,3.6,z+1.2,'sign',{seed:0});
  }
  if(rare&&(id==='cargo'||id==='bins')){
   prop(ctx,project,1.1,z+1.8,'barrel',{seed:8,angle:Math.sin(t*14)*.18});
  }
 }
 function obstacleAftermath(ctx,id,s){
  if(s.t<.18||s.t>.98)return;
  const shake=smooth(clamp((s.t-.19)/.17));
  for(let i=0;i<12;i++){
   const drift=hash(i+id.length*7),life=mod(s.t*.8+drift,1);
   const x=180+drift*130+(life-.5)*(id==='grass'?18:39);
   const y=105+hash(i+34)*38+life*36;
   if(id==='grass')line(ctx,x,y,x+3,y-5,'rgba(190,214,132,.48)',1);
   else if(id==='pileup')ellipse(ctx,x,y-life*25,4+life*8,2+life*4,'rgba(129,138,133,.20)');
   else if(id==='debris'||id==='cargo'||id==='bins'||id==='delivery'){
    const sz=2+(i%3);
    rect(ctx,x,y,sz,sz,id==='delivery'?'rgba(246,207,122,.78)':id==='cargo'?'rgba(211,167,108,.75)':'rgba(174,193,188,.62)');
   }else if(id==='roadworks'||id==='gravel'){
    ellipse(ctx,x,y,2+2*shake,1.5,'rgba(195,178,141,.32)');
   }else if(id==='clearline'&&i%4===0){
    line(ctx,x,y,x+7,y-2,'rgba(241,229,171,.42)',1);
   }
  }
 }
 // v0.7.18: modular route geometry. These are visual road-space props,
 // not physical course modifications; the seeded engine resolves all choices.
 const routeDepth=t=>clamp(6.25-4.20*smooth(clamp((t+.12)/.93)),2.05,6.5);
 function roadQuad(ctx,project,z,far,halfWidth,colour,lane=0,raiseFar=0){
  const a=project(lane-halfWidth,z),b=project(lane+halfWidth,z),
        c=project(lane+halfWidth,far),d=project(lane-halfWidth,far);
  polygon(ctx,[[a.x,a.y],[b.x,b.y],[c.x,c.y-raiseFar],[d.x,d.y-raiseFar]],colour);
  return {a,b,c,d};
 }
 function roadCrack(ctx,project,lane,z,span=1.5,ink='#1f3035',thick=1.8){
  const a=project(lane-span,z),b=project(lane-span*.35,z+.13),
        c=project(lane+span*.16,z-.17),d=project(lane+span,z+.12);
  line(ctx,a.x,a.y,b.x,b.y,ink,thick);
  line(ctx,b.x,b.y,c.x,c.y,ink,thick*.85);
  line(ctx,c.x,c.y,d.x,d.y,ink,thick*.65);
  return c;
 }
 function routeRoad(ctx,id,s,project){
  if(typeof project!=='function')return;
  const z=routeDepth(s.t),rise=smooth(clamp((s.t-.06)/.24)),rare=s.rare;
  if(id==='ramp'){
   // An elevated wedge, not a flat painted road stripe. Its lip sits ABOVE
   // the asphalt while both exposed sides fall back to the projected ground.
   const farLift=7+20*rise;
   const q=roadQuad(ctx,project,z,z+1.8,2.42,'#253d45',0,farLift);
   // Distinct shaded side walls and a vertical front lip sell the height.
   polygon(ctx,[[q.d.x,q.d.y-farLift],[q.c.x,q.c.y-farLift],
     [q.c.x,q.c.y+4],[q.d.x,q.d.y+4]],'#34454a');
   polygon(ctx,[[q.a.x,q.a.y],[q.d.x,q.d.y-farLift],
     [q.d.x,q.d.y+4],[q.a.x,q.a.y+3]],'#1c3037');
   polygon(ctx,[[q.b.x,q.b.y],[q.c.x,q.c.y-farLift],
     [q.c.x,q.c.y+4],[q.b.x,q.b.y+3]],'#3d5050');
   roadQuad(ctx,project,z+.11,z+1.72,2.22,'#cba46b',0,farLift-2);
   const crestLeft=project(-2.34,z+1.77),crestRight=project(2.34,z+1.77);
   line(ctx,crestLeft.x,crestLeft.y-farLift+1,crestRight.x,crestRight.y-farLift+1,'#f4dba3',3);
   // Repeated side braces reach DOWN to the roadway and stay perspective-scaled.
   for(const side of [-1,1])for(let j=0;j<3;j++){
    const depth=z+.55+j*.47,rail=project(side*2.37,depth);
    const height=farLift*(depth-z)/1.8;
    line(ctx,rail.x,rail.y-height,rail.x,rail.y+3,'#27393e',2.2);
   }
   // Caution panels are laid over the approach, never across the whole screen.
   for(let j=0;j<5;j++){
    const x=-1.83+j*.91;
    const n=project(x,z+.13),f=project(x+.37,z+.45);
    line(ctx,n.x,n.y-1,f.x,f.y-2,'#594b3a',2.2);
   }
   for(const side of [-1,1]){
    const a=project(side*2.35,z+.15),b=project(side*2.35,z+1.6);
    line(ctx,a.x,a.y-5,b.x,b.y-10*rise-2,'#253c42',3);
    line(ctx,a.x,a.y-7,b.x,b.y-10*rise-4,'#f2d18d',1.4);
    rect(ctx,a.x-2,a.y-4,4,5,'#283f44');
   }
   if(rare){const p=project(0,z+1.5);rect(ctx,p.x-9,p.y-14,18,6,'#df7759');}
  }else if(id==='bridge'){
   // A genuine negative-space bridge gap. Jagged broken road ends reveal
   // an underside, with side beams and hanging planks below the deck line.
   const outer=roadQuad(ctx,project,z,z+.97,3.34,'#12232b');
   const nearL=project(-3.25,z+.21),nearR=project(3.25,z+.21);
   const farL=project(-3.25,z+.77),farR=project(3.25,z+.77);
   // Deep canyon visible between the two EXTRUDED edges.
   polygon(ctx,[[nearL.x,nearL.y],[nearR.x,nearR.y],[farR.x,farR.y],
     [farL.x,farL.y]],'#051319');
   const nearTop=roadQuad(ctx,project,z+.02,z+.20,3.28,'#a5a19a');
   const farTop=roadQuad(ctx,project,z+.78,z+.97,3.28,'#a5a19a');
   polygon(ctx,[[nearL.x,nearL.y-1],[nearR.x,nearR.y-1],
     [nearR.x,nearR.y+9],[nearL.x,nearL.y+9]],'#665f57');
   polygon(ctx,[[farL.x,farL.y-1],[farR.x,farR.y-1],
     [farR.x,farR.y+7],[farL.x,farL.y+7]],'#6a6258');
   for(let i=0;i<7;i++){
    const x=-3.0+i;
    const a=project(x,z+.20),b=project(x+.11*((i%3)-1),z+.25);
    line(ctx,a.x,a.y,b.x,b.y+8,'#c5ae8c',1.8);
   }
   for(let side of [-1,1]){
    for(let n=0;n<3;n++){
     const p=project(side*3.2,z+.07+n*.39),e=project(side*(3.2+(n%2)*.32),z+.17+n*.43);
     line(ctx,p.x,p.y-12,e.x,e.y-3,'#a7aba0',2.3);
    }
   }
   // Hanging broken deck fragments below far edge.
   for(let i=0;i<5;i++){
    const p=project((i-2)*.97,z+.51),f=project((i-2)*.97+.2,z+.78);
    polygon(ctx,[[p.x-2,p.y-1],[p.x+3,p.y-1],[f.x+3,f.y+3+i%2*2],[f.x-3,f.y+4]],i%2?'#73675b':'#ad906f');
   }
   const q=project(-.9,z+.07),e=project(1.45,z+.77);
   line(ctx,q.x,q.y,e.x,e.y,'#dfb15d',1.3);
  }else if(id==='crater'){
   const mid=project(0,z+.30),span=(project(2.6,z).x-project(-2.6,z).x);
   const half=Math.max(9,span*.50),h=Math.max(3,half*.30);
   ellipse(ctx,mid.x,mid.y+3,half*1.18,h*1.14,'#927760');
   ellipse(ctx,mid.x,mid.y+4,half,h,'#24343a');
   ellipse(ctx,mid.x,mid.y+5,half*.78,h*.68,'#0c2028');
   for(let i=0;i<7;i++){
    const theta=(i+0.3)*Math.PI*2/7,dx=Math.cos(theta),dy=Math.sin(theta),
      x=mid.x+half*dx,y=mid.y+h*dy+3;
    line(ctx,x,y,x+dx*(6+i%3*4),y+dy*3,'#d2b08a',1.4);
   }
  }else if(id.startsWith('tremor-')){
   const stage=Number(id.at(-1));
   for(let i=0;i<(stage===1?6:stage===2?9:12);i++){
    const dz=z+.31*(i%7)-.25,lane=Math.sin(i*2.3)*2.75;
    const p=project(lane,dz);
    if(stage===1){
     // Small hopping stones are introduced before the larger road failure.
     const hop=2.7*Math.abs(Math.sin(s.time*.008+i*1.7));
     ellipse(ctx,p.x,p.y+1,2.9,1.0,'rgba(10,26,29,.34)');
     polygon(ctx,[[p.x-3,p.y-hop],[p.x,p.y-4-hop],[p.x+3,p.y-2-hop],[p.x+2,p.y-hop]],i%2?'#c5b9a0':'#7d8f8d');
    }else{
     roadCrack(ctx,project,lane,dz,stage===3?1.6:1.1,stage===3?'#0c1e24':'#26373b',stage===3?2.4:1.65);
     if(stage===3&&i%4===0){
      const p2=project(lane+.46,dz+.10);
      polygon(ctx,[[p.x-5,p.y],[p.x+10,p.y+1],[p2.x+12,p2.y+6],[p2.x-4,p2.y+6]],'#1c2930');
     }
    }
   }
   if(stage===3){
    roadQuad(ctx,project,z+.65,z+1.17,2.65,'#13252b');
    for(let i=0;i<6;i++){
     const lane=-2.1+i*.82,p=project(lane,z+.66),f=project(lane+.14,z+1.11);
     line(ctx,p.x,p.y,f.x,f.y,'#b9a18a',1.8);
    }
   }
  }
 }
 function routeAftermath(ctx,id,s,project){
  if(typeof project!=='function')return;
  const z=routeDepth(s.t),t=s.t,active=smooth(clamp((t-.19)/.23))*(1-smooth(clamp((t-.85)/.15)));
  if(id==='ramp'){
   // Two small, road-anchored tyres marks leading onto the ramp.
   for(const lane of [-.65,.65]){
    const a=project(lane,z-.28),b=project(lane,z+.18);
    line(ctx,a.x,a.y,b.x,b.y,'rgba(24,41,43,.46)',2.0);
   }
  }else if(id==='bridge'){
   for(let i=0;i<6;i++){
    const p=project(-2.3+i*.87,z+.52),fall=4+active*(4+i%3*4);
    rect(ctx,p.x,p.y+fall,2.2,1.5,'rgba(188,164,131,.78)');
   }
  }else if(id==='crater'||id==='tremor-3'){
   for(let i=0;i<15;i++){
    const p=project(Math.sin(i*2.7)*2.3,z+.65+(i%5)*.21),sp=active*(2+hash(i+81)*9);
    ellipse(ctx,p.x+(i%2?1:-1)*sp,p.y-sp*.62,3+sp*.33,1.5+sp*.10,
      `rgba(193,170,138,${.18+active*.23})`);
   }
  }else if(id==='tremor-2'){
   for(let i=0;i<5;i++){
    const p=project(Math.sin(i*3)*2.0,z+(i%4)*.42);
    line(ctx,p.x,p.y-3,p.x+2,p.y-4-active*2.5,'rgba(201,185,150,.42)',1);
   }
  }
 }

 // v0.7.19d: persistent, world-space side road. Choice, forced and pass roles
 // scripted detour: approach -> gradual entrance -> parallel stretch -> rejoin.
 // The main road stays straight; the camera follows the vehicle in perspective.
 // No simulated steering, modified event odds or new mechanical road types.
 const SHORTCUT_SIDE=Object.freeze({
  'wreckage-shortcut':1,'overgrown-shortcut':-1,'flooded-shortcut':1,
  'dune-shortcut':-1,'frozen-lake-shortcut':1
 });
 const SHORTCUT_SURFACE=Object.freeze({
  'wreckage-shortcut':['#545457','#c3a67d','#343c3e'],
  'overgrown-shortcut':['#687e4e','#ccca83','#334e38'],
  'flooded-shortcut':['#579cad','#cbeef0','#315e6d'],
  'dune-shortcut':['#c99b5e','#f0d39a','#876849'],
  'frozen-lake-shortcut':['#9ecfd9','#e7fcf7','#528e9e']
 });
 const SHORTCUT_DISTANCE=30; // world units of road visible in front of the car
 const SHORTCUT_CAR_DEPTH=.92;
 const SHORTCUT_LATERAL=8.4; // road-space units; main and shortcut do not overlap on the parallel stretch
 const shortcutStage=t=>t<.075?'approach':t<.27?'depart':t<.72?'parallel':t<.925?'rejoin':'home';
 function shortcutAmount(u){
  if(u<=.075||u>=.925)return 0;
  if(u<.27)return smooth((u-.075)/(.27-.075));
  if(u<.72)return 1;
  return 1-smooth((u-.72)/(.925-.72));
 }
 const shortcutWorldLane=(id,u)=>{const a=shortcutAmount(u);return a===0?0:(SHORTCUT_SIDE[id]||0)*SHORTCUT_LATERAL*a;};
 const shortcutUnit=(z,progress)=>progress+(z-SHORTCUT_CAR_DEPTH)/SHORTCUT_DISTANCE;
 const shortcutWidth=u=>2.28*smooth((u-.065)/.13)*(1-smooth((u-.83)/.135));
 function shortcutPose(id,elapsedMs=0,{mode='preview',motion=true}={}){
  if(!Object.hasOwn(SHORTCUT_SIDE,id))return null;
  const duration=RECIPES[id].duration,t=clamp(elapsedMs/duration);
  const progress=motion&&mode!=='preview'?t:0;
  const carLane=['risk','forced','pass'].includes(mode)&&motion?shortcutWorldLane(id,progress):0;
  // Pan is diagnostics only; camera rendering uses a depth-correct projection.
  const pan=carLane*60/SHORTCUT_CAR_DEPTH;
  return Object.freeze({id,mode,progress,pan,cameraLane:carLane,side:SHORTCUT_SIDE[id],t,stage:shortcutStage(t)});
 }
 function shortcutGeometry(id,elapsedMs=0,{mode='preview',motion=true}={}){
  const pose=shortcutPose(id,elapsedMs,{mode,motion});if(!pose)return null;
  const project=(original,lane,z)=>original(lane+shortcutWorldLane(id,shortcutUnit(z,pose.progress)),z);
  return {pose,project,worldOffset:z=>shortcutWorldLane(id,shortcutUnit(z,pose.progress))};
 }
 function shortcutRoad(ctx,id,s,project,mode='preview',motion=true){
  if(typeof project!=='function')return;
  const geometry=shortcutGeometry(id,s.time,{mode,motion});if(!geometry)return;
  const {pose}=geometry,branch=(lane,z)=>geometry.project(project,lane,z);
  const [surface,mark,edge]=SHORTCUT_SURFACE[id];
  // The real main ribbon was painted first. This adjoining ribbon has a clear
  // fork and merge and a long separate, straight segment, all in road space.
  const step=.22;
  for(let i=139;i>=0;i--){
   const zNear=.79+i*step,zFar=zNear+step+.008;
   const u0=shortcutUnit(zNear,pose.progress),u1=shortcutUnit(zFar,pose.progress);
   const w0=shortcutWidth(u0),w1=shortcutWidth(u1);
   if(w0<.025&&w1<.025)continue;
   const a=branch(-w0,zNear),b=branch(w0,zNear),c=branch(w1,zFar),d=branch(-w1,zFar);
   polygon(ctx,[[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]],edge);
   const in0=w0*.93,in1=w1*.93;
   const e=branch(-in0,zNear),f=branch(in0,zNear),g=branch(in1,zFar),h=branch(-in1,zFar);
   polygon(ctx,[[e.x,e.y],[f.x,f.y],[g.x,g.y],[h.x,h.y]],surface);
   if(i%3===0&&w0>.95&&w1>.95){
    for(const side of [-1,1]){
     const v=branch(side*w0*.83,zNear),w=branch(side*w1*.83,zFar);
     line(ctx,v.x,v.y,w.x,w.y,mark,Math.max(.75,2.1/zNear));
    }
   }
  }
  // Each prop lives at a FIXED world distance along the shortcut. As the car
  // progresses, its depth changes and it approaches/passes naturally.
  const props=[];
  for(let i=0;i<20;i++){
   const q=.23+i*.027,z=SHORTCUT_CAR_DEPTH+(q-pose.progress)*SHORTCUT_DISTANCE;
   if(z<.89||z>26)continue;
   props.push({i,q,z,side:i%2?-1:1,scale:clamp(3.2/z,.22,2.2)});
  }
  for(let j=props.length-1;j>=0;j--){
   const {i,z,side,scale}=props[j];
   if(id==='wreckage-shortcut'){
    prop(ctx,branch,side*(2.45+.22*(i%3)),z,i%3===0?'wreck':'scrap',{seed:i});
   }else if(id==='overgrown-shortcut'){
    prop(ctx,branch,side*(2.42+.25*(i%3)),z,'grass',{seed:i,time:s.time});
   }else if(id==='flooded-shortcut'){
    const p=branch(Math.sin(i*2.1)*.55,z);
    line(ctx,p.x-7*scale,p.y,p.x+10*scale,p.y,mark,Math.max(.7,1.3*scale));
    if(i%3===0){const post=branch(side*2.42,z);
     rect(ctx,post.x-1.5*scale,post.y-11*scale,3*scale,11*scale,'#263b48');
     rect(ctx,post.x-2*scale,post.y-11*scale,4*scale,3*scale,'#efb36c');}
   }else if(id==='dune-shortcut'){
    for(const lane of [-.73,.73]){const p=branch(lane,z);
     ellipse(ctx,p.x,p.y,2.5*scale,.8*scale,'rgba(99,71,43,.58)');}
    if(i%2===0){const h=branch(side*2.45,z);
     ellipse(ctx,h.x,h.y,10*scale,2.8*scale,'#dfb77a');}
   }else if(id==='frozen-lake-shortcut'){
    roadCrack(ctx,branch,Math.sin(i*2.3)*.7,z,.32+(i%3)*.23,'rgba(238,255,255,.87)',Math.max(.75,1.5/z));
    if(i%3===0){const p=branch(side*.65,z);
     line(ctx,p.x-4*scale,p.y,p.x+5*scale,p.y-2*scale,'rgba(53,130,154,.75)',1);}
   }
  }
  // Sign anchored to the FORK, not glued to the player's car.
  const q=.13,z=SHORTCUT_CAR_DEPTH+(q-pose.progress)*SHORTCUT_DISTANCE;
  if(z>.9&&z<18){
   const sign=branch(pose.side*2.4,z),sc=clamp(3.5/z,.36,1.65);
   rect(ctx,sign.x-1.2,sign.y-15*sc,2.4,15*sc,'#29383d');
   rect(ctx,sign.x-14*sc,sign.y-29*sc,28*sc,13*sc,'#e6c46d');
   ctx.save();ctx.font=`bold ${Math.round(6.1*sc)}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#213940';
   ctx.fillText?.(mode==='forced'?'DETOUR':mode==='pass'?'PASS LINE':'SHORTCUT',sign.x,sign.y-21.1*sc);ctx.restore();
   polygon(ctx,[[sign.x+pose.side*9*sc,sign.y-19*sc],
    [sign.x+pose.side*14*sc,sign.y-22*sc],[sign.x+pose.side*9*sc,sign.y-25*sc]],'#213940');
  }
 }
 function shortcutAftermath(ctx,id,s,project,mode='preview',motion=true){
  const geometry=shortcutGeometry(id,s.time,{mode,motion});if(!geometry)return;
  const branch=(lane,z)=>geometry.project(project,lane,z);
  for(let i=0;i<16;i++){
   const q=.24+i*.036,z=SHORTCUT_CAR_DEPTH+(q-geometry.pose.progress)*SHORTCUT_DISTANCE;
   if(z<.9||z>22)continue;
   const side=i%2?-1:1,p=branch(side*2.4,z),wave=Math.sin(s.time*.002+i*1.7)*2/z;
   if(id==='flooded-shortcut')line(ctx,p.x-3-wave,p.y,p.x+5+wave,p.y,'rgba(226,248,249,.65)',1);
   else if(id==='dune-shortcut')ellipse(ctx,p.x+wave,p.y-2,2.5/z,1,'rgba(246,219,168,.46)');
   else if(id==='overgrown-shortcut')line(ctx,p.x,p.y,p.x+wave,p.y-6/z,'rgba(181,212,118,.57)',1);
   else if(id==='frozen-lake-shortcut'&&i%2===0)line(ctx,p.x-1,p.y-4/z,p.x+3,p.y-7/z,'rgba(241,255,252,.64)',1);
   else if(id==='wreckage-shortcut'&&i%3===0)rect(ctx,p.x+wave,p.y-2,3/z,2/z,'rgba(229,183,130,.67)');
  }
 }

 function render(ctx,{id,elapsedMs=0,variant='normal',motion=true,layer='over',project=null,shortcutMode='preview'}={}){
  const s=sample(id,elapsedMs,{variant,motion});if(!s)return false;
  if(layer!=='under'&&layer!=='over')return true;
  ctx.save();ctx.globalAlpha=s.family==='shortcut'?1:s.strength;
  if(layer==='under'&&s.family==='surface')surface(ctx,id,s.time,s.rare,project);
  if(layer==='under'&&s.family==='obstacle')obstacles(ctx,id,s,project);
  if(layer==='under'&&(s.family==='route'||s.family==='destruction'))routeRoad(ctx,id,s,project);
  if(layer==='under'&&s.family==='shortcut')shortcutRoad(ctx,id,s,project,shortcutMode,motion);
  if(layer==='over'){
   if(s.family==='obstacle')obstacleAftermath(ctx,id,s);
   if(s.family==='route'||s.family==='destruction')routeAftermath(ctx,id,s,project);
   if(s.family==='shortcut')shortcutAftermath(ctx,id,s,project,shortcutMode,motion);
   if(id==='downpour')rain(ctx,s.time,3.4);
   else if(id==='fog')fog(ctx,s.time,2);
   else if(id==='heatwave')heat(ctx,s.time,1.8);
   else if(id==='crosswind')wind(ctx,s.time,2.1);
   else if(id==='hail')hail(ctx,s.time,2);
   else if(id==='sand')dust(ctx,s.time,2);
   else if(id==='snow')snow(ctx,s.time,1.8);
   else if(id.startsWith('storm-')){
    const stage=Number(id.at(-1));cloud(ctx,s.time,stage);
    if(stage>=2)rain(ctx,s.time,stage===2?1.1:3);
    if(stage>=3)wind(ctx,s.time,1.15);
   }
   else if(id==='flood'){
    for(let i=0;i<13;i++){const x=mod(hash(i+441)*480+s.time*.02,480),y=170+hash(i+511)*77;
     line(ctx,x-3,y,x+8,y,'rgba(196,235,241,.25)',1);}
   }
  }
  ctx.restore();return true;
 }
 function renderWeather(ctx,{weather='clear',time=0,motion=true}={}){
  // Existing ambient race weather; independent of event trigger odds.
  const t=motion?Math.max(0,time):550;
  ctx.save();
  if(weather==='rain')rain(ctx,t,1.05);
  else if(weather==='snowfall')snow(ctx,t,1);
  else if(weather==='blizzard'){snow(ctx,t,2.3);wind(ctx,t,1.4);fog(ctx,t,1.05);}
  else if(weather==='fog')fog(ctx,t,1.1);
  else if(weather==='wind')wind(ctx,t,1.1);
  else if(weather==='cold')snow(ctx,t,.32);
  else if(weather==='hot')heat(ctx,t,.7);
  else if(weather==='dust')dust(ctx,t,1.5);
  ctx.restore();
 }
 return Object.freeze({RECIPES,recipe,sample,render,renderWeather,shortcutPose,shortcutGeometry,shortcutWorldLane,shortcutAmount});
});
