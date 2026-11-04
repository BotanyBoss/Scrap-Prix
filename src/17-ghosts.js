/* Scrap Prix v0.7.21b: three deterministic ghost/phasing visual recipes.
 * Ghost Car and Possessed Rival are fake overtakes. Shadow Takes the Rival
 * is a real precomputed pass. None of these effects may change race outcomes.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapEventGhosts=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
 const smooth=t=>{const x=clamp(t);return x*x*(3-2*x);};
 const between=(t,a,b)=>smooth((t-a)/(b-a));
 const pulse=(t,a,b,c,d)=>between(t,a,b)*(1-between(t,c,d));
 const specs={
  'ghost-fake':['Ghost Car Overtake','A spectral copy appears to be overtaken, then dissolves. The real rival never left the lead.','#a9f8e8','#e8fffa','fake'],
  'possessed-fake':['Possessed Rival','Headlights ignite with impossible light; the car twitches and claws back ahead.','#c6a0f5','#f6d8a8','fake'],
  'shadow-pass':['Shadow Takes the Rival','The shadow rises, takes hold of the actual rival, then drags it sideways into darkness.','#9ca3d6','#d9d9ef','special']
 };
 const RECIPES=Object.freeze(Object.fromEntries(Object.entries(specs).map(([id,[title,description,primary,secondary,role]])=>[id,Object.freeze({id,family:'ghost',role,title,description,primary,secondary,duration:1000})])));
 const recipe=id=>RECIPES[id]||null;
 function sample(id,elapsedMs=0,{motion=true,variant='normal'}={}){
  const r=recipe(id);if(!r)return null;
  const t=clamp((motion?elapsedMs:480)/r.duration);
  const rare=variant==='rare';
  let stage,alpha=1;
  if(id==='ghost-fake'){
   stage=t<.13?'manifest':t<.43?'false-pass':t<.70?'vanish':'reveal';
   alpha=pulse(t,.05,.20,.47,.70);
  }else if(id==='possessed-fake'){
   stage=t<.18?'dormant':t<.40?'possession':t<.73?'comeback':'afterglow';
   alpha=pulse(t,.10,.26,.74,.98);
  }else{
   stage=t<.23?'shadow-stirs':t<.43?'reaches':t<.81?'drag':'aftermath';
   alpha=pulse(t,.07,.27,.77,.97);
  }
  return {id,r,t,stage,alpha,rare,
   spectral: id==='ghost-fake'?alpha:0,
   flare:id==='possessed-fake'?alpha:0,
   shadow:id==='shadow-pass'?alpha:0,
   struggle:id==='possessed-fake'?Math.sin(t*88)*pulse(t,.27,.38,.69,.80):0,
   pull:id==='shadow-pass'?between(t,.42,.79):0};
 }
 // These poses only affect a car already displayed by the replay. A fake pass
 // never grants a position, and the shadow pass only applies to an earned pass.
 function rivalTransform(id,q,{x=0,z=4}={}){
  const s=sample(id,q*1000);if(!s)return null;
  const side=x<0?-1:1;
  if(id==='ghost-fake'){
   // The *real* car stays ahead. Only the spectral duplicate is passed.
   return {x,z,lift:0,angle:0,alpha:1};
  }
  if(id==='possessed-fake'){
   const dive=between(q,.03,.35),comeback=between(q,.44,.83),shiver=s.struggle*.22;
   // Let the possessed rival swerve into the outside lane BEFORE surging
   // forward. Keeping it in the source lane while approaching the camera
   // made its full-size silhouette merge with the remaining traffic.
   const separation=between(q,.14,.32)*(1-between(q,.69,.92));
   return {x:x+side*(2.10*separation+.35*dive*(1-comeback)+shiver*.5),
    z:z-(z-2.65)*dive+(z-2.65+1.7)*comeback,
    lift:4*Math.sin(q*Math.PI)+Math.abs(shiver)*8,
    angle:side*(.10*Math.sin(q*61)*s.flare),alpha:1};
  }
  // The rival approaches its shadow, struggles, and is sucked aside *after*
  // contact. Keep car visible at early stages and fade only near the exit.
  const progress=clamp(q),pull=between(progress,.44,.81);
  return {x:x+side*(Math.max(17,z*4.65+2)*pull),z:z*(1+.04*pull),
   lift:6*Math.sin(Math.PI*pull)*(1-pull),angle:side*.25*pull,
   alpha:1-.9*between(progress,.67,.85)};
 }
 function ghostCopy(id,q,{x=0,z=4}={}){
  if(id!=='ghost-fake')return null;
  const s=sample(id,q*1000);
  // The false car is near enough to appear overtaken while its real twin
  // remains at the original depth further up the road.
  const emerge=between(q,.04,.28),leave=between(q,.42,.71);
  const adjacent=x<0?2.55:-2.55;
  return {x:x+(adjacent-x)*between(q,.04,.21),z:z-(z-2.20)*emerge,
   alpha:s.spectral*.83,scale:1+.04*emerge,
   fade:leave};
 }
 const ellipse=(c,x,y,rx,ry,color)=>{c.beginPath();c.fillStyle=color;c.ellipse(x,y,Math.max(.2,rx),Math.max(.2,ry),0,0,Math.PI*2);c.fill();};
 const line=(c,x,y,x2,y2,color,w=1)=>{c.beginPath();c.strokeStyle=color;c.lineWidth=w;c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();};
 const poly=(c,pts,color)=>{c.beginPath();c.fillStyle=color;pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 // Both layers use the same projected anchor. A glow never floats at an
 // arbitrary fixed screen x when the target changes lanes or distance.
 function render(ctx,{id,elapsedMs=0,variant='normal',motion=true,layer='over',rivalAnchor=null,project=null}={}){
  const s=sample(id,elapsedMs,{motion,variant});if(!s)return false;
  const a=rivalAnchor||(typeof project==='function'?project(-1.55,3.85):{x:210,y:145});
  const x=a.x,y=a.y;
  ctx.save();
  if(layer==='under'){
   if(id==='ghost-fake'){
    ctx.globalAlpha*=.44*s.alpha;
    ellipse(ctx,x-17,y+1,32,5,'#91dce0');
    for(let i=0;i<4;i++)ellipse(ctx,x-35-i*8,y-2+i*2,5+i*3,1.5,'#b3f4e6');
   }else if(id==='possessed-fake'){
    ctx.globalAlpha*=.85*s.alpha;
    ellipse(ctx,x,y,33+s.flare*10,5,'#6e4b95');
    ellipse(ctx,x,y,22,2,'#dc9cf3');
   }else{
    const spread=s.shadow,ext=9+65*s.pull;
    ctx.globalAlpha*=.72*spread;
    poly(ctx,[[x-17,y-2],[x+13,y-2],[x+ext,y-6],[x+ext+30,y+12],[x+ext+2,y+16],[x-26,y+6]],'#161326');
    ellipse(ctx,x+ext+10,y+7,12+16*s.pull,4.5,'#0e1020');
    line(ctx,x+14,y+2,x+ext+17,y+9,'#9292cb',1.6);
   }
  }else if(id==='ghost-fake'){
   ctx.globalAlpha*=s.alpha;
   // Spectral ribbon and face-like glints are only visible as the fake copy
   // breaks apart, not a generic blue flash across the whole race.
   for(let i=0;i<9;i++){
    const q=i/9,xx=x-42+q*84+Math.sin(q*23+s.t*24)*7;
    const yy=y-15-Math.sin(q*10+s.t*13)*9;
    ellipse(ctx,xx,yy,1.7+(i%3),1.4,'#c6fff2');
   }
   for(let i=0;i<3;i++)line(ctx,x-29+i*13,y-13-i*8,x-40+i*15,y-24-i*9,'#84e9df',1.8);
  }else if(id==='possessed-fake'){
   const p=s.flare;ctx.globalAlpha*=p;
   for(let i=0;i<5;i++){
    const dx=(i-2)*11;
    const flame=Math.sin(s.t*36+i*2)*6;
    poly(ctx,[[x+dx-4,y-11],[x+dx-6,y-22-flame],[x+dx-1,y-36-Math.abs(flame)],[x+dx+6,y-18]],i%2?'#b39af4':'#89dcca');
   }
   // Two headlights that stare at the player as the possessed car rebounds.
   ellipse(ctx,x-8,y-10,3.3,2.1,'#ffd9a0');ellipse(ctx,x+8,y-10,3.3,2.1,'#ffd9a0');
   if(s.rare){line(ctx,x-23,y-35,x-32,y-47,'#cfc1ff',1.3);line(ctx,x+23,y-35,x+32,y-47,'#cfc1ff',1.3);}
  }else{
   ctx.globalAlpha*=s.shadow;
   // Tendrils rise from the road, then clamp the rival as it is removed.
   for(let i=0;i<4;i++){
    const dx=i*13-17,rise=12+s.pull*23;
    line(ctx,x+dx,y+3,x+dx+Math.sin(i*5+s.t*14)*8,y-rise,'#222039',3.4);
    line(ctx,x+dx+Math.sin(i*5+s.t*14)*8,y-rise,x+dx+10,y-rise-8,'#8e8ab6',1.1);
   }
   if(s.t>.77){ctx.globalAlpha*=1-between(s.t,.79,.98);for(let i=0;i<6;i++){
    const xx=x+(i-3)*15,yy=y-13-i%3*8;
    ellipse(ctx,xx,yy,2+i%2,1.6,'#b9b1d6');
   }}
  }
  ctx.restore();return true;
 }
 return Object.freeze({RECIPES,recipe,sample,rivalTransform,ghostCopy,render});
});
