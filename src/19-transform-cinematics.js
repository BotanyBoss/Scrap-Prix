/* Scrap Prix v0.7.21f: in-engine transformation cutaways.
 * Pure presentation. No racing statistics, event weights, RNG or save mutations.
 * Rear-view flash -> side-profile gag reveal -> launch -> camera return.
 */
(function(root,factory){
 'use strict';const api=factory(typeof module==='object'&&module.exports?require('./07-gag-recipes.js'):root.ScrapVehicleCombos);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapTransformCinematics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G){
 'use strict';
 const DURATION=8400;
 // Every *existing* exact recipe is previewable in DEV. This does not add
 // any gameplay event or change how a completed gag recipe is discovered.
 const PREVIEWS=Object.freeze({transformation:null,'transform-generic':null,
  ...Object.fromEntries((G?.RECIPES||[]).map(r=>['transform-'+r.id,r.id]))});
 const BEATS=Object.freeze([
  Object.freeze({stage:'flash',start:0,end:450,title:'FLASH'}),
  Object.freeze({stage:'cutaway',start:450,end:1350,title:'SIDE-VIEW CUTAWAY'}),
  Object.freeze({stage:'transform',start:1350,end:4500,title:'TRANSFORMATION REVEAL'}),
  Object.freeze({stage:'launch',start:4500,end:6600,title:'ACCELERATE'}),
  Object.freeze({stage:'return',start:6600,end:8400,title:'RETURN TO REAR VIEW'})
 ]);
 // Cinematic accents identify the FORM. The gameplay recipe and rendered
 // vehicle are still obtained from the existing catalogue and art modules.
 const EFFECTS=Object.freeze({
  train:['#c79b56','#fae6ae','FULL STEAM AHEAD'],fossil:['#a8d19d','#eaf3c0','PREDATOR ONLINE'],
  mower:['#89c85d','#ebf3ad','GARDENING INTENSIFIES'],truck:['#df8b5c','#ffe0a1','HEAVY HAUL'],
  monster:['#b89be0','#f6d38b','MONSTER MODE'],muscle:['#e17d62','#ffe2a1','HORSEPOWER'],
  tank:['#aabf79','#eddda9','ARMOURED'],f1:['#f47b64','#ffe3b8','POLE POSITION'],
  rocketcar:['#ff9347','#ffe5aa','IGNITION OVERRIDE'],burger:['#e8b65a','#fff0b5','UNEXPECTED LUNCH'],
  boat:['#7bcae4','#e3f7ed','ALL ABOARD'],dune:['#deba6b','#fff0b3','SAND STORM'],
  snowmobile:['#a7e1ed','#ecfaff','COLD START'],plane:['#a7d0d0','#fff0d2','TAKE OFF'],
  house:['#b8d3a6','#fff0d0','HOME SWEET HOME'],icecream:['#f9abd4','#fff3c5','SUGAR RUSH'],
  spaceship:['#7de2d6','#f7d2eb','COSMIC DRIVE']
 });
 const PALETTES=Object.freeze({
  ...Object.fromEntries((G?.RECIPES||[]).map(r=>{
   const e=EFFECTS[r.id];return [r.id,Object.freeze({name:r.name.toUpperCase(),accent:e[0],pale:e[1],dark:'#304853',tag:e[2]})];
  })),
  generic:{name:'TRANSFORMATION?!',accent:'#58c8d5',pale:'#e0f6e3',dark:'#354f62',tag:'DRAMATIC REVEAL'}
 });
 const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:0));
 const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
 // The side-view road is horizontal: the wheel-contact y never changes during
 // launch. Keep this pose pure so DEV scrubbing and 1–4x playback agree.
 function launchPose(progress){
  const p=clamp(progress),e=smooth(p);
  // Side projection uses +Z (car nose) to SCREEN LEFT. Travel LEFT. The
  // previous rightward launch made every car accelerate backwards.
  return Object.freeze({x:220-475*Math.pow(p,1.42),y:228,scale:1-.38*e});
 }
 function cameraReturnPose(progress){
  // Complete the orbit while the cutaway is opaque; fade over the final 22%
  // ONLY after its camera faces rear. This prevents two overlapping cars.
  const p=clamp(progress),e=smooth(clamp(p/.78));
  const step=Math.min(8,Math.floor(clamp(p/.78)*8+.00001));
  return Object.freeze({x:240,y:229+29*e,w:303-139*e,h:154-41*e,view:'orbit-'+step});
 }
 const returnOpacity=progress=>1-smooth(clamp((progress-.78)/.22));
 const recipe=id=>Object.hasOwn(PREVIEWS,id)?Object.freeze({id,family:'cinematic',duration:DURATION,kind:'cutaway'}):null;
 function loadoutFor(id,base,catalogue){
  const gagId=PREVIEWS[id];
  if(!gagId)return base||null;
  const data=catalogue?{GAG_RECIPES:catalogue}:(typeof window==='undefined'?null:window.ScrapData);
  return data?.GAG_RECIPES?.find(r=>r.id===gagId)?.requires?{...data.GAG_RECIPES.find(r=>r.id===gagId).requires}:base||null;
 }
 function formOf(loadout,id){
  // The original joke is an unchanged-car event, even when a gag recipe is
  // equipped. A temporary special creature form is a SEPARATE event/rehearsal.
  if(id==='transformation'||id==='transform-generic')return 'generic';
  if(PREVIEWS[id])return PREVIEWS[id];
  const art=typeof window==='undefined'?null:window.ScrapVehicleArt;
  return art?.resolveForm?.(art.fromLoadout(loadout||{}))?.id||'generic';
 }
 function sample(id,elapsed,{loadout=null}={}){
  if(!recipe(id))return null;
  const t=clamp(elapsed,0,DURATION),beat=BEATS.find(b=>t<b.end)||BEATS.at(-1);
  return Object.freeze({id,stage:beat.stage,local:clamp((t-beat.start)/(beat.end-beat.start)),elapsed:t,duration:DURATION,progress:t/DURATION,
   form:formOf(loadout,id),title:beat.title});
 }
 const fill=(ctx,c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 function word(ctx,text,x,y,size=16,color='#f7eac7',align='left'){
  ctx.save();ctx.font=`900 ${size}px Impact, 'Arial Black', sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';
  ctx.lineWidth=2.5;ctx.strokeStyle='#172a32';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();
 }
 function backdrop(ctx,pal,t,motion){
  const sky=ctx.createLinearGradient(0,0,0,217);
  sky.addColorStop(0,pal.dark);sky.addColorStop(.73,'#6f8390');sky.addColorStop(1,'#d5cfb3');
  ctx.fillStyle=sky;ctx.fillRect(0,0,480,270);
  // Side-view scenery with a distinct horizon, not the rear-view road overlay.
  fill(ctx,'#30454c',0,164,480,38);
  const farShift=motion?((t*.028)%612):0;
  const nearShift=motion?((t*.070)%560):0;
  for(let i=-2;i<11;i++){
   const x=((i*68-20-farShift+680)%612)-68;
   fill(ctx,'#536972',x,139+(i+12)%3*7,32+(i+12)%2*15,42);
   fill(ctx,'#96a6a2',x+7,154+(i+12)%3*7,8,3);
  }
  // Foreground roadside scenery slides faster than the distant skyline.
  for(let i=-1;i<9;i++){
   const x=((i*90-nearShift+600)%560)-50;
   fill(ctx,'#4f675f',x,179,11,18);fill(ctx,'#a6b5a2',x+2,174,7,6);
  }
  fill(ctx,'#8a9d96',0,198,480,7);fill(ctx,'#283d46',0,205,480,65);
  fill(ctx,'#e8dec2',0,209,480,2);fill(ctx,'#768c8f',0,244,480,2);
  const shift=motion?Math.floor(t*.19)%88:0;
  for(let i=-1;i<7;i++)fill(ctx,'#dfd6ba',i*88-shift,253,44,4);
  fill(ctx,pal.accent,0,0,480,5);
 }
 function particles(ctx,pal,ms,stage,motion){
  if(!motion)return;
  const t=ms*.001;
  for(let i=0;i<12;i++){
   const x=17+((i*53+Math.floor(t*95))%468),y=43+(i*29)%134;
   if(stage==='launch'){
    const tail=35+i%4*19;
    fill(ctx,i%3===0?pal.pale:'#dce6df',x-tail,y,tail,1+(i%2));
   }else if(stage==='transform'){
    ctx.globalAlpha=.18+Math.sin(t*5+i*1.7)**2*.5;
    fill(ctx,i%2?pal.accent:pal.pale,x,y,3+i%3,3+i%2);
    ctx.globalAlpha=1;
   }
  }
 }
 function drawCar(ctx,{x=215,y=225,w=305,h=155,loadout,view='side',full=true,time=0,motion=true,alpha=1}={}){
  const art=typeof window==='undefined'?null:window.ScrapVehicleArt;
  if(!art)return;
  ctx.save();ctx.globalAlpha*=clamp(alpha);
  ctx.fillStyle='rgba(11,25,31,.45)';ctx.beginPath();ctx.ellipse(x,y+2,w*.34,6.5,0,0,Math.PI*2);ctx.fill();
  art.draw(ctx,{x,y,w,h,loadout,view,style:'chunky',time,motion,comboBodywork:full});
  ctx.restore();
 }
 function gagFX(ctx,form,pal,t,progress,motion,x=215,y=215,scale=1){
  if(!motion)return;
  ctx.save();const p=clamp(progress);
  if(form==='rocketcar'){
   // Plume grows to the RIGHT, from the rocket's REAR nozzle, and extends
   // opposite the car's leftward movement. Never put fire on the pointed nose.
   if(p<.38){ctx.restore();return;}
   const len=(16+Math.sin(t*.022)**2*23+115*p)*scale;
   const rear=x+111*scale,centreY=y-16*scale;
   ctx.fillStyle='#ed8748';ctx.beginPath();ctx.moveTo(rear,centreY-10*scale);ctx.lineTo(rear+len,centreY-7*scale);
   ctx.lineTo(rear+len*.74,centreY+9*scale);ctx.lineTo(rear,centreY+11*scale);ctx.closePath();ctx.fill();
   ctx.fillStyle='#ffe8ad';ctx.beginPath();ctx.moveTo(rear,centreY-6*scale);ctx.lineTo(rear+len*.68,centreY);
   ctx.lineTo(rear,centreY+6*scale);ctx.closePath();ctx.fill();
   for(let i=0;i<5;i++)fill(ctx,'#e27b47',rear+len+(i*9*scale),centreY-4*scale+(i%3)*5*scale,6*scale,3*scale);
  }else if(form==='fossil'){
   ctx.strokeStyle=pal.pale;ctx.lineWidth=2;
   for(let i=0;i<4;i++){
    const spread=(27+p*49)+i*9;
    ctx.beginPath();ctx.moveTo(x-12,y-89);ctx.lineTo(x-13-spread,y-91-i*5);ctx.stroke();
   }
   word(ctx,p>.7?'RAAAWR!':'* CLANK *',x+92,y-98,14,pal.pale);
  }else if(form==='icecream'){
   for(let i=0;i<9;i++){
    const theta=i*Math.PI*2/9+t*.003,r=48+p*32;
    const dx=Math.cos(theta)*r,dy=Math.sin(theta)*r*.65;
    fill(ctx,i%2?'#ffeeb5':'#ffc7e0',x+dx,y-83+dy,4,4);
   }
   if(p>.6)word(ctx,'SWEET!',x+107,y-100,15,'#fff6c4');
  }else if(form==='train'){
   // Rhythmic stack puffs and wheel-motion hints. The whole locomotive moves
   // as a solid vehicle; smoke is a detached atmospheric effect above it.
   for(let i=0;i<5;i++){
    const h=(t*.00055+i/5)%1,r=4+h*10;
    ctx.globalAlpha=.58*(1-h);
    ctx.fillStyle=i%2?'#fff0ca':'#b8c3b3';ctx.beginPath();ctx.ellipse(x+16*scale-i*6*scale,y-(103+47*h)*scale,r*scale,r*.67*scale,0,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=1;
   for(const side of [-1,1]){
    const q=Math.sin(t*.009+side)*8*scale;
    fill(ctx,pal.pale,x-51*scale,y-17*scale+q,52*scale,3*scale);
   }
  }else if(form==='plane'){
   // Visible rotating propeller flashes and compact air-trails.
   ctx.strokeStyle=pal.pale;ctx.lineWidth=2*scale;
   const cx=x-109*scale,cy=y-70*scale;
   for(let i=0;i<4;i++){
    const th=t*.024+i*Math.PI/2;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(th)*4*scale,cy+Math.sin(th)*4*scale);
    ctx.lineTo(cx+Math.cos(th)*28*scale,cy+Math.sin(th)*28*scale);ctx.stroke();
   }
   for(let i=0;i<5;i++)fill(ctx,'#f2f2d8',x+52*scale+i*19*scale,y-(74+i%3*12)*scale,22*scale,2*scale);
  }else if(form==='boat'){
   // A wave wake on a perfectly dry road: this is, regrettably, a boat-car.
   ctx.strokeStyle=pal.pale;ctx.lineWidth=2.5*scale;
   for(let i=0;i<5;i++){
    const left=x+24*scale+i*19*scale;
    const wave=Math.sin(t*.015+i)*4*scale;
    ctx.beginPath();ctx.moveTo(left,y-8*scale+wave);ctx.quadraticCurveTo(left+10*scale,y-18*scale+wave,left+19*scale,y-8*scale+wave);ctx.stroke();
   }
  }else if(form==='snowmobile'){
   // Powder sprays from the rear track, not a generic cloud round the car.
   for(let i=0;i<14;i++){
    const f=((i*27+t*.10)%170)*scale;
    ctx.globalAlpha=.75-i%3*.13;
    fill(ctx,i%2?'#d9f3f1':'#f3f7ea',x+52*scale+f,y-12*scale-(i%5)*8*scale,3.5*scale,2.5*scale);
   }
   ctx.globalAlpha=1;
  }else if(form==='spaceship'){
   // Retro magnetic drive: twin engine pulses and delicate neon streaks.
   for(let i=0;i<7;i++){
    const f=((i*37+t*.06)%205)*scale;
    ctx.globalAlpha=.25+.5*Math.sin(t*.004+i)**2;
    fill(ctx,i%2?'#edafd0':'#a4e9db',x+55*scale+f,y-(29+i%4*14)*scale,10*scale,2*scale);
   }
   ctx.globalAlpha=1;
   ctx.strokeStyle='#9edcd2';ctx.lineWidth=1.5*scale;
   for(const yy of [-25,-42]){ctx.beginPath();ctx.arc(x+65*scale,y+yy*scale,(8+Math.sin(t*.01)*3)*scale,-Math.PI/2,Math.PI/2);ctx.stroke();}
  }else if(form==='mower'){
   // Lawn shavings flutter behind the deck; a physical little lawnmower gag.
   for(let i=0;i<14;i++){
    const f=((i*18+t*.08)%145)*scale;
    fill(ctx,i%3?'#88c46d':'#d8e59d',x+45*scale+f,y-(7+(i%7)*6)*scale,5*scale,2.4*scale);
   }
   fill(ctx,'#8ea56a',x-105*scale,y-7*scale,42*scale,3*scale);
  }else if(form==='truck'){
   // Heavy diesel exhaust from the stacks and suspension bouncing the load.
   for(let i=0;i<7;i++){
    const h=((i*17+t*.036)%95)*scale;
    ctx.globalAlpha=.18+(1-h/(100*scale))*.33;
    ctx.fillStyle='#a4b2a3';ctx.beginPath();ctx.ellipse(x-12*scale+i%3*9*scale,y-94*scale-h,5*scale,3.5*scale,0,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=1;
   if(p>.66&&p<.9)word(ctx,'RUMBLE!',x+92*scale,y-113*scale,11,pal.pale);
  }else if(form==='monster'){
   // The absurd lifted truck should feel heavy: compress/recoil and dust.
   for(let i=0;i<10;i++){
    const v=((i*17+t*.08)%115)*scale;
    fill(ctx,i%2?pal.accent:pal.pale,x+55*scale+v,y-(5+i%4*5)*scale,5*scale,3*scale);
   }
   if(p>.58&&p<.84)word(ctx,'BOING!',x-95*scale,y-133*scale,17,pal.pale);
  }else if(form==='muscle'){
   // Exhaust smoke and burnout lines trail its wide rear wheels.
   for(let i=0;i<9;i++){
    const h=((i*23+t*.05)%135)*scale;
    fill(ctx,i%3?'#d5b2a0':'#f1d7ba',x+61*scale+h,y-(13+i%4*6)*scale,11*scale,2*scale);
   }
   if(p>.5)fill(ctx,'#dd7c57',x+76*scale,y-42*scale,17*scale,3*scale);
  }else if(form==='tank'){
   // The treads grind, muzzle vents pulse and a short recoil flash breaks the
   // outline at the right beat. Never imply it is a functional projectile.
   for(let i=0;i<8;i++){
    const q=((i*31+t*.055)%170)*scale;
    fill(ctx,i%2?'#c6c49c':'#758b67',x+55*scale+q,y-(9+i%4*7)*scale,7*scale,4*scale);
   }
   if(p>.6&&p<.74){fill(ctx,'#f5d99c',x-135*scale,y-92*scale,15*scale,7*scale);fill(ctx,'#ffe8be',x-144*scale,y-89*scale,10*scale,3*scale);}
  }else if(form==='f1'){
   // Slipstream ribbons and a mini chequered flicker, not a generic explosion.
   for(let i=0;i<9;i++)fill(ctx,i%2?'#f0ede0':'#df6955',x+58*scale+i*20*scale,y-(17+i%3*11)*scale,17*scale,1.6*scale);
   if(p>.62&&p<.85)for(let i=0;i<6;i++)fill(ctx,i%2?'#f7f1dc':'#31414a',x-119*scale+i*7*scale,y-129*scale+(i%2)*7*scale,7*scale,7*scale);
  }else if(form==='burger'){
   // Temporary visual WIP. A small sizzle cue distinguishes its animation
   // without implying the rejected concept has been design-approved.
   for(let i=0;i<5;i++){
    const h=((i*13+t*.024)%73)*scale;
    ctx.globalAlpha=.5*(1-h/(75*scale));
    ctx.strokeStyle='#fff1ca';ctx.lineWidth=2*scale;
    ctx.beginPath();ctx.moveTo(x-34*scale+i*16*scale,y-89*scale-h);
    ctx.quadraticCurveTo(x-45*scale+i*16*scale,y-98*scale-h,x-30*scale+i*16*scale,y-105*scale-h);ctx.stroke();
   }
   ctx.globalAlpha=1;
  }else if(form==='dune'){
   // Coarse sandy fan kicked up from the rear balloon tyres.
   for(let i=0;i<16;i++){
    const h=((i*27+t*.074)%150)*scale;
    fill(ctx,i%2?'#d3aa6d':'#e9d09b',x+62*scale+h,y-(8+i%8*4)*scale,6*scale,3*scale);
   }
  }else if(form==='house'){
   // Silly house on wheels: chimney smoke and rattling roof shingles.
   for(let i=0;i<6;i++){
    const h=((i*18+t*.03)%100)*scale;
    ctx.globalAlpha=.45*(1-h/(105*scale));
    ctx.fillStyle='#e7e2ca';ctx.beginPath();ctx.ellipse(x+16*scale,y-136*scale-h,5*scale,4*scale,0,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=1;
  }else if(form==='icecream'){
   // handled by the dedicated sugar-rush reveal above.
  }else{
   // Generic unchanged-car gag remains understated by design.
   for(let i=0;i<5;i++)fill(ctx,pal.pale,x-88*scale+i*35*scale,y-110*scale+Math.sin(t*.008+i)*9*scale,5*scale,3*scale);
  }
  ctx.restore();
 }
 // Mechanical Fossil's temporary special event is NOT the gag recipe reveal.
 // Its running form has articulated bone legs, no wheels, and a matching skull,
 // ribcage, tail and mechanical core. All poses are deterministic per elapsed ms.
 // These images are cropped from the user's approved Mechanical Fossil
 // sheet, with alpha preserved. The temporary RUNNING CREATURE is distinct
 // from the permanent wheeled gag form and from recipe unlock logic.
 const FOSSIL_RUNNER_REFERENCE='{{ASSET:assets/embedded/259c60f3162da5c5.png}}';
 const FOSSIL_AWAKENING_REFERENCE='{{ASSET:assets/embedded/3111847322aca9c0.png}}';
 const FOSSIL_FILM_IMAGES={};
 if(typeof Image!=='undefined')for(const [id,uri] of Object.entries({runner:FOSSIL_RUNNER_REFERENCE,awakening:FOSSIL_AWAKENING_REFERENCE})){
   const im=new Image();im.src=uri;FOSSIL_FILM_IMAGES[id]=im;
 }
 function fossilFrame(ctx,id,{x=226,y=230,scale=1,t=0,motion=true,alpha=1}={}){
   const im=FOSSIL_FILM_IMAGES[id];if(!im||!im.complete||!im.naturalWidth)return false;
   ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);
   const gait=motion?Math.sin(t*.018):0;
   // Motion is deliberately modest because the sheet supplies the approved
   // anatomy; the separate limb rig will be judged only after art approval.
   if(id==='runner'){
     ctx.translate(0,-4+gait*2.8);
     ctx.rotate(gait*.014);
   }else if(motion){ctx.translate(0,-Math.sin(t*.013)*1.7);}
   const dw=(id==='runner'?340:307)*scale,dh=dw*(im.naturalHeight/im.naturalWidth);
   ctx.imageSmoothingEnabled=true;
   ctx.drawImage(im,-dw/2,-dh,dw,dh);
   ctx.restore();return true;
 }
 function fossilRunner(ctx,{x=226,y=229,scale=1,t=0,motion=true,forming=1}={}){
  if(fossilFrame(ctx,'runner',{x,y,scale,t,motion}))return;
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const ink='#17282e',bone='#f1dec0',shade='#c9b691',metal='#6c584a',core='#ef8a54';
  const progress=clamp(forming),run=motion?t*.014:0,bob=motion?Math.sin(run*2)*2.7:0;
  const P=(ps,col,stroke=ink,width=2.8)=>{
   ctx.beginPath();ctx.moveTo(ps[0][0],ps[0][1]);for(const q of ps.slice(1))ctx.lineTo(q[0],q[1]);ctx.closePath();
   ctx.fillStyle=col;ctx.fill();if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
  };
  const L=(a,b,w,col)=>{ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineWidth=w+2.8;ctx.strokeStyle=ink;ctx.stroke();ctx.lineWidth=w;ctx.strokeStyle=col;ctx.stroke();};
  const O=(px,py,rad,c)=>{ctx.beginPath();ctx.arc(px,py,rad,0,2*Math.PI);ctx.fillStyle=c;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=ink;ctx.stroke();};
  const leg=(hip,far,phase,front)=>{
   const off=motion?Math.sin(run+phase):.28;
   const knee=[hip[0]+(front?-10:18)+off*16,hip[1]+37];
   const foot=[knee[0]-16-off*29,(far?-8:1)-Math.max(0,off)*11];
   L(hip,knee,front?9:13,far?shade:bone);O(knee[0],knee[1],front?5:7,metal);
   L(knee,[foot[0]+8,foot[1]-6],front?7:10,far?metal:shade);
   L([foot[0]+8,foot[1]-6],foot,6,bone);
   P([[foot[0]-21,foot[1]+3],[foot[0]+7,foot[1]+3],[foot[0]-2,foot[1]-7]],far?shade:bone,ink,2);
   for(const k of [0,1,2])L([foot[0]-21+k*8,foot[1]+2],[foot[0]-25+k*9,foot[1]+6],2.4,shade);
  };
  // Small gripping forearms are distinct from the TWO powerful running
  // hind legs. This should read as a bipedal prehistoric predator, not a dog.
  const arm=(phase,far)=>{
   const twitch=motion?Math.sin(run+phase)*6:0;
   const shoulder=[-49,-104+bob],elbow=[-63,-75+bob+twitch*.4],wrist=[-78,-81+bob+twitch];
   L(shoulder,elbow,far?5.4:7,far?shade:bone);
   O(elbow[0],elbow[1],4,metal);
   L(elbow,wrist,far?4.5:5.5,far?shade:bone);
   for(let i=0;i<3;i++)L(wrist,[wrist[0]-8-i*4,wrist[1]+3+i*4],2,shade);
  };
  // Far hind leg first; it tucks behind the ribcage during the stride.
  leg([43,-92+bob],true,Math.PI-.55,false);arm(.6,true);
  // Vertebral tail curves up and behind the running animal, swaying with stride.
  const tail=[[54,-116+bob],[83,-112+bob],[109,-105+bob],[135,-96+bob+Math.sin(run*.65)*6],
              [154,-92+bob+Math.sin(run*.65)*9],[170,-101+bob+Math.sin(run*.65)*11]];
  for(let i=0;i<tail.length-1;i++){
   L(tail[i],tail[i+1],Math.max(3,12-i*1.8),i%2?shade:bone);
   const v=tail[i];L([v[0],v[1]-2],[v[0]+4,v[1]-14+i*.8],Math.max(2,4-i*.3),shade);
   L([v[0],v[1]+3],[v[0]+3,v[1]+10-i*.5],Math.max(1,3-i*.2),shade);
  }
  // Exposed steel midline keeps this recognisably the same mechanical fossil.
  L([-58,-100+bob],[58,-108+bob],12,metal);
  P([[-57,-96+bob],[-38,-122+bob],[41,-124+bob],[66,-108+bob],
     [51,-82+bob],[-42,-77+bob]],ink,shade,2.8);
  // Ribs arch around a hollow belly. Their dark gaps are real negative space.
  for(let i=0;i<5;i++){
   const cx=-37+i*17;
   L([cx,-117+bob],[cx-5,-82+bob],8,bone);
   L([cx-5,-82+bob],[cx+6,-70+bob],5,shade);
   L([cx,-119+bob],[cx+10,-135+bob],5,shade);
  }
  // Distinctive mechanical heart from the donor gag vehicle.
  O(5,-104+bob,16,metal);O(5,-104+bob,10,core);O(5,-104+bob,5,'#ffe7a6');
  L([21,-105+bob],[40,-117+bob],5,metal);L([-11,-105+bob],[-35,-98+bob],4,metal);
  // Upright short mechanical exhausts attach to the torso.
  L([34,-124+bob],[38,-155+bob],8,metal);
  L([50,-124+bob],[57,-150+bob],7,metal);
  // Near hind leg plants, then the small near forearm reaches forward.
  leg([43,-92+bob],false,0,false);arm(Math.PI+.5,false);
  // Heavy cranium: distinct back of skull, separate upper jaw and mandible.
  // The raised neck joins the same skull geometry as the wheeled form.
  L([-60,-104+bob],[-82,-121+bob],12,shade);
  L([-77,-116+bob],[-93,-123+bob],9,metal);
  P([[-93,-149+bob],[-114,-151+bob],[-134,-137+bob],[-146,-124+bob],
     [-137,-111+bob],[-102,-105+bob],[-89,-120+bob]],bone,ink,3.3);
  P([[-116,-140+bob],[-134,-136+bob],[-148,-128+bob],[-153,-120+bob],
     [-148,-112+bob],[-119,-112+bob],[-105,-121+bob]],shade,ink,2.8);
  // Hollow black eye socket, a broad nose hole and large teeth (not stickers).
  P([[-113,-138+bob],[-126,-136+bob],[-130,-123+bob],[-117,-117+bob],
     [-107,-124+bob]],ink,shade,2.3);
  O(-149,-118+bob,3,ink);
  const gape=3+(motion?Math.sin(run*.8)*2:0);
  P([[-97,-103+bob],[-117,-103+bob],[-146,-106+bob-gape],
     [-150,-98+bob-gape],[-138,-91+bob-gape],[-104,-95+bob]],shade,ink,2.6);
  for(let i=0;i<5;i++){
   const xx=-139+i*9;
   P([[xx,-112+bob],[xx+5,-111+bob],[xx+2,-103+bob]],bone,ink,.8);
   P([[xx,-100+bob-gape],[xx+5,-101+bob-gape],[xx+2,-109+bob-gape]],bone,ink,.8);
  }
  // The transformation actually stands on legs; no wheel sprite underneath.
  if(motion){
   for(let i=0;i<7;i++){
    const q=(t*.105+i*29)%147;
    ctx.globalAlpha=.30+i%3*.14;ctx.fillStyle=i%2?'#d7bb8c':'#f4dfb3';
    ctx.fillRect(70+q,0-(i%4)*6,6+(i%3)*4,2+(i%3));
   }
   ctx.globalAlpha=1;
  }
  // Raise the torso while legs unfold; this does not turn the wheeled form
  // into a second identical vehicle with a coloured particle effect.
  if(progress<1){
   ctx.globalAlpha=1-progress;
   ctx.strokeStyle=bone;ctx.lineWidth=3;
   for(let i=0;i<4;i++){
    ctx.beginPath();ctx.moveTo(-50+i*35,-84+bob);ctx.lineTo(-54+i*35,-84+bob+24*progress);ctx.stroke();
   }
  }
  ctx.restore();
 }
 function fossilUnfold(ctx,progress,t,loadout,motion){
  const p=clamp(progress);
  // Original reference-derived art: wheeled racer -> awakening intermediate
  // -> fully running skeletal creature, without a generic donor-car swap.
  if(p<.24){
   const shake=motion?Math.sin(t*.038)*p*8:0;
   drawCar(ctx,{loadout,full:true,time:t,motion,x:222+shake,y:229,w:307,h:157});
   ctx.save();ctx.globalAlpha=.36*p/.24;fill(ctx,'#ef9d55',0,0,480,270);ctx.restore();
  }else if(p<.58){
   const u=smooth((p-.24)/.34);
   drawCar(ctx,{loadout,full:true,time:t,motion,x:222,y:228,w:307,h:157,alpha:1-u});
   fossilFrame(ctx,'awakening',{x:225,y:230,scale:.99,t,motion,alpha:u});
  }else if(p<.79){
   const u=smooth((p-.58)/.21);
   fossilFrame(ctx,'awakening',{x:225,y:230,scale:1.0,t,motion,alpha:1-u});
   fossilFrame(ctx,'runner',{x:230,y:231,scale:.93+u*.07,t,motion,alpha:u});
   ctx.save();ctx.globalAlpha=.15+.2*Math.sin(Math.PI*u);fill(ctx,'#f8e4b7',0,0,480,270);ctx.restore();
  }else fossilFrame(ctx,'runner',{x:230,y:231,scale:1.0,t,motion})||
      fossilRunner(ctx,{x:230,y:231,scale:1,t,motion});
 }

 function render(ctx,{id='transformation',elapsedMs=0,loadout=null,motion=true}={}){
  const s=sample(id,elapsedMs,{loadout});if(!s||!ctx)return false;
  const form=s.form,pal=PALETTES[form]||PALETTES.generic,t=s.elapsed,p=s.local;
  ctx.save();
  if(s.stage==='flash'){
   const alpha=motion?.2+.8*Math.sin(Math.PI*p):.12;
   fill(ctx,`rgba(251,247,224,${alpha.toFixed(3)})`,0,0,480,270);
   word(ctx,'TRANSFORMATION!',240,130,29,'#fcfbdf','center');
   ctx.restore();return true;
  }
  if(s.stage==='return'&&p>=.999){ctx.restore();return true;}
  // Rebuild a complete alternate camera scene in the current race canvas.
  const alpha=s.stage==='return'?returnOpacity(form==='fossil'?clamp((p-.20)/.80):p):1;
  ctx.globalAlpha*=alpha;
  backdrop(ctx,pal,t,motion);
  const amp=s.stage==='launch'&&motion?Math.pow(p,2):0;
  if(s.stage==='cutaway'){
   word(ctx,'SIDE CAMERA',14,29,12,pal.pale);
   word(ctx,'A VERY NORMAL RACE EVENT',14,49,10,'#e0e5df');
   drawCar(ctx,{loadout,full:form==='fossil',time:t,motion,x:218+15*smooth(p),y:229,w:290,h:153});
  }else if(s.stage==='transform'){
   const reveal=smooth((p-.42)/.25),shudder=motion?Math.sin(t*.06)*Math.max(0,1-reveal)*3:0;
   word(ctx,pal.name,240,29,23,pal.pale,'center');
   word(ctx,pal.tag,240,52,12,pal.accent,'center');
   if(form==='fossil')fossilUnfold(ctx,p,t,loadout,motion);
   else {
    drawCar(ctx,{loadout,full:false,time:t,motion,x:219+shudder,y:228,w:305,h:159,alpha:1-reveal});
    drawCar(ctx,{loadout,full:true,time:t,motion,x:219+shudder,y:228,w:305,h:159,alpha:reveal});
   }
   if(form!=='fossil'&&p>.45&&p<.8&&motion){
    ctx.save();ctx.globalAlpha*=.52*Math.sin(Math.PI*clamp((p-.45)/.35));
    fill(ctx,pal.pale,0,0,480,270);ctx.restore();
   }
   if(form!=='fossil')gagFX(ctx,form,pal,t,p,motion,219,225);
   if(form==='generic'&&p>.76)word(ctx,'... THE SAME CAR.',240,94,19,pal.pale,'center');
  }else if(s.stage==='launch'){
   particles(ctx,pal,t,'launch',motion);
   const {x,y,scale}=launchPose(p);
   if(form==='fossil')fossilRunner(ctx,{x,y,scale,t,motion});
   else {
    gagFX(ctx,form,pal,t,p,motion,x,y,scale);
    drawCar(ctx,{loadout,full:true,time:t,motion,x,y,w:303*scale,h:154*scale});
   }
   word(ctx,form==='generic'?'ABSOLUTELY NO UPGRADE':'FULL THROTTLE!',240,35,24,pal.pale,'center');
  }else if(s.stage==='return'){
   // The real rear-view car is ALREADY rendered below this cutaway.
   // Camera sweeps around the moving car from side to rear in eight stable,
   // scrub-safe 3D projections. The real race image remains underneath the
   // dissolving cutaway: no second car flying back onto the road.
   if(form==='fossil'&&p<.20){
    // The creature folds back into a wheeled skeleton BEFORE camera orbit.
    if(p<.10)fossilRunner(ctx,{x:233,y:229,scale:1,t,motion});
    else {
     ctx.save();ctx.globalAlpha=1-smooth((p-.10)/.10);
     fossilRunner(ctx,{x:233,y:229,scale:1,t,motion});ctx.restore();
     drawCar(ctx,{loadout,full:true,time:t,motion,x:233,y:229,w:305,h:154,alpha:smooth((p-.10)/.10)});
     ctx.save();ctx.globalAlpha=.65*Math.sin(Math.PI*smooth((p-.10)/.10));
     fill(ctx,'#f4e5c3',0,0,480,270);ctx.restore();
    }
   }else{
    const pose=cameraReturnPose(form==='fossil'?clamp((p-.20)/.8):p);
    drawCar(ctx,{loadout,full:true,time:t,motion,view:pose.view,x:pose.x,y:pose.y,w:pose.w,h:pose.h,alpha:1});
   }
   word(ctx,'BACK TO THE RACE',240,39,22,pal.pale,'center');
   const sweep=smooth(p);
   ctx.strokeStyle=pal.pale;ctx.lineWidth=1.5;ctx.globalAlpha*=.3;
   for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(240+sign*14,155);ctx.quadraticCurveTo(240+sign*(80+sweep*30),187,240+sign*(145+sweep*65),270);ctx.stroke();}
  }
  if(s.stage!=='return'&&s.stage!=='launch')particles(ctx,pal,t,s.stage,motion);
  ctx.restore();return true;
 }
 return Object.freeze({DURATION,BEATS,PREVIEWS,recipe,sample,render,launchPose,cameraReturnPose,returnOpacity,loadoutFor,formOf});
});
