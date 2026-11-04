/* Scrap Prix v0.7.20: composable energy / impact / light event visuals.
 * Pure, deterministic drawing only. No game simulation, RNG, save or DOM access.
 * All coordinates are the original race scene's 480 x 270 canvas.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapEventEnergy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:0));
 const smooth=n=>{const q=clamp(n);return q*q*(3-2*q);};
 const phase=(q,a,b)=>smooth((q-a)/(b-a));
 const peak=(q,a,b,c,d)=>phase(q,a,b)*(1-phase(q,c,d));
 const hash=n=>{const v=Math.sin(n*127.17+9.31)*45113.57;return v-Math.floor(v);};
 const def={
  'lightning-pass':['Lightning','A jagged bolt strikes the target rival, then the car recoils',1000,.53],
  'beam':['Beam','A beam charges beyond the horizon, sweeps across the scenery and leaves a shockwave',3400,.56],
  'slash-pass':['Slash','A suspended glowing cut lands across the rival lane with a delayed impact',1000,.53],
  'mini-sun':['Explosion','A laboratory star swells and pulses, casting heat and a radial blast',3400,.67],
  'sun-gaze':['Glow','Ra focuses a blazing ray on the road, followed by an expanding impact halo',3400,.64],
  'lab-2':['Glow','A test facility sparks and pulses as containment warnings escalate',3400,.72],
  'lab-3':['Explosion','Containment flashes, bursts, and collapses into smoke',3400,.62],
  'aura':['Glow','A restrained power-up aura intensifies around the racing line',3400,.65],
  'storm-3':['Lightning','Brief distant lightning, layered with the existing storm animation',3400,.74]
 };
 const RECIPES=Object.freeze(Object.fromEntries(Object.entries(def).map(([id,[family,description,duration,impact]])=>
  [id,Object.freeze({id,family,description,duration,impact})])));
 const recipe=id=>RECIPES[id]||null;
 function sample(id,elapsedMs=0,{variant='normal',motion=true}={}){
  const r=recipe(id);if(!r)return null;
  const time=motion?clamp(elapsedMs,0,r.duration):r.duration*.61;
  const t=time/r.duration;
  const stage=t<.2?'telegraph':t<r.impact?'charge':t<r.impact+.15?'impact':'afterglow';
  return {id,family:r.family,time,t,stage,rare:variant==='rare',impact:r.impact,
   charge:phase(t,.06,r.impact),strike:peak(t,r.impact-.04,r.impact+.025,r.impact+.095,r.impact+.22),
   residue:phase(t,r.impact,r.impact+.10)*(1-phase(t,.87,1))};
 }
 function line(c,x,y,X,Y,col,w=2){c.strokeStyle=col;c.lineWidth=w;c.lineCap='butt';c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();}
 function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
 function poly(c,points,col){c.fillStyle=col;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 function ellipse(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.fill();}
 function ring(c,x,y,rx,ry,col,w=2){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.stroke();}
 function rays(c,x,y,r1,r2,col,count=10,offset=0){for(let i=0;i<count;i++){const a=2*Math.PI*i/count+offset;line(c,x+Math.cos(a)*r1,y+Math.sin(a)*r1,x+Math.cos(a)*r2,y+Math.sin(a)*r2,col,i%3?2:3);}}
 function burst(c,x,y,size,strength,style='dust'){
  if(strength<=0)return;
  const palette=style==='electric'?['#d7faff','#72dbef','#fff4cb']:style==='fire'?['#f9e5a5','#fa9c48','#cf5d45']:['#f5dec0','#d9a46b','#6e7980'];
  c.save();c.globalAlpha*=clamp(strength);
  for(let i=0;i<15;i++){
   const a=i*Math.PI*2/15+.13*(i%3),dist=size*(.25+.72*hash(i+91));
   const x2=x+Math.cos(a)*dist,y2=y+Math.sin(a)*dist*.52;
   if(i%3===0)ellipse(c,x2,y2,Math.max(1,size*.075),Math.max(1,size*.029),palette[i%3]);
   else line(c,x+Math.cos(a)*size*.1,y+Math.sin(a)*size*.06,x2,y2,palette[i%3],1+i%3);
  }
  c.restore();
 }
 function arcBolt(c,start,end,strength=1,seed=0){
  if(strength<=0)return;
  const pts=[start],dx=end.x-start.x,dy=end.y-start.y;
  for(let i=1;i<9;i++){const u=i/9,dist=(hash(i*7+seed*13)-.5)*(6+9*(1-Math.abs(.5-u)));pts.push({x:start.x+dx*u+dist,y:start.y+dy*u});}
  pts.push(end);
  c.save();c.globalAlpha*=strength;
  for(const [col,w] of [['#173e5c',9],['#4bd2f2',5],['#fff7d1',2.1]]){
   c.strokeStyle=col;c.lineWidth=w;c.lineJoin='bevel';c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
  }
  for(let i of [3,5,7]){const p=pts[i],end2={x:p.x+(hash(i+seed)*2-1)*35,y:p.y+21+hash(i+19)*23};line(c,p.x,p.y,end2.x,end2.y,'#85e8fa',1.7);}
  c.restore();
 }
 function shock(c,x,y,q,size=45,col='#ffd38a',strength=1){
  if(q<=0||q>=1)return;
  c.save();c.globalAlpha*=clamp(strength*(1-q));ring(c,x,y,size*(.3+q*1.2),size*(.07+q*.18),col,2.5*(1-q)+.6);c.restore();
 }
 function spark(c,x,y,t,n=12,mag=30,palette='#ffd991'){
  for(let i=0;i<n;i++){
   const a=i*Math.PI*2/n+hash(i+31)*.13,dist=mag*(.2+.7*hash(i+23))*t;
   line(c,x+Math.cos(a)*dist,y+Math.sin(a)*dist*.55,x+Math.cos(a)*(dist+4),y+Math.sin(a)*(dist+4)*.55,palette,1+i%3);
  }
 }
 function labBase(c,warning=0){
  // Recognisable test facility, shared by the containment stages.
  rect(c,348,59,89,45,'#203943');rect(c,352,63,82,36,'#76888c');
  rect(c,358,68,24,22,'#22343b');rect(c,387,68,39,21,'#203943');
  rect(c,390,71,32,15,warning?'#f6a65a':'#78b5a9');
  rect(c,402,57,8,8,'#22343b');rect(c,403,58,6,6,warning?'#e36245':'#a4d6b5');
  for(let j=0;j<4;j++)rect(c,358+j*18,94,11,3,'#f1dab1');
 }
 function render(c,{id,elapsedMs=0,variant='normal',motion=true,layer='over',project=null,rivalAnchor=null}={}){
  const s=sample(id,elapsedMs,{variant,motion});if(!s)return false;
  if(layer!=='under'&&layer!=='over')return true;
  const q=s.t,under=layer==='under',rare=s.rare,hot='#ffdc88',bright='#fff4d7',blue='#7be0ff',tgt=rivalAnchor|| (project?project(1.55,3.9):{x:296,y:176});
  c.save();
  if(id==='lightning-pass'){
   const hit=s.strike,active=peak(q,.32,.37,.61,.72),p={x:tgt.x,y:tgt.y-11};
   if(under){ellipse(c,p.x,p.y+12,25*(.55+s.charge),3.8,'rgba(116,195,211,.25)');shock(c,p.x,p.y+7,phase(q,.53,.84),44,blue,hit+.15*s.residue);}
   else{
    if(active>0)arcBolt(c,{x:p.x-26,y:5},{x:p.x,y:p.y},active,7);
    if(hit>0){ellipse(c,p.x,p.y,17*hit,18*hit,`rgba(239,249,234,${(.28*hit).toFixed(3)})`);burst(c,p.x,p.y,30,hit,'electric');}
    if(s.residue>0){for(let i=0;i<5;i++){const x=p.x+(i-2)*7,y=p.y-9-13*s.residue-(i%2)*4;line(c,x,y,x-3,y-8*s.residue,blue,1.1);}}
   }
  }else if(id==='beam'){
   const y=118,x=235,charged=peak(q,.18,.36,.60,.73);
   if(under){shock(c,x,149,phase(q,.54,.94),110,hot,.86);}
   else{
    c.save();c.globalAlpha*=clamp(peak(q,.08,.26,.67,.91)*.35);
    rect(c,0,94,480,66,'#ffd78a');c.restore();
    if(charged>0){
     // Energy stays beyond the rivals, below most of the sky. Big but readable.
     poly(c,[[0,111],[480,133],[480,147],[0,122]],'#a34f51');
     poly(c,[[0,114],[480,135],[480,143],[0,119]],'#f2a35a');
     line(c,0,115,480,139,bright,4+charged*5);
     for(let i=0;i<10;i++){
      const xx=i*55+hash(i+19)*12,yy=115+(xx/480)*24;
      line(c,xx,yy-7,xx+6,yy-16,hot,1.5);
     }
    }
    if(s.residue>0)burst(c,x,y+23,75,s.residue*.8,'dust');
   }
  }else if(id==='slash-pass'){
   const strength=peak(q,.18,.30,.61,.74),p=tgt;
   if(under){
    const mark=phase(q,.54,.58)*(1-phase(q,.88,.99));
    if(mark>0){c.globalAlpha*=mark;line(c,p.x-70,p.y+13,p.x+68,p.y-15,'#222e32',4);line(c,p.x-71,p.y+16,p.x+67,p.y-12,'#e8c885',1.4);}
   }else{
    if(strength>0){
     c.save();c.globalAlpha*=strength;
     const x=p.x,y=p.y-18;
     line(c,x-131,y+45,x+115,y-79,'#643f84',17);
     line(c,x-131,y+45,x+115,y-79,'#e5aef7',9);
     line(c,x-131,y+45,x+115,y-79,'#f8fae8',3.5);
     for(let i=0;i<7;i++){const xx=x-115+i*34;line(c,xx,y+38-i*17,xx+18,y+43-i*17,'#b4e9ec',1.5);}
     c.restore();
    }
    if(s.residue>0){burst(c,p.x,p.y-8,42,s.residue,'electric');}
   }
  }else if(id==='mini-sun'||id==='sun-gaze'){
   const laboratory=id==='mini-sun',sx=laboratory?371:357,sy=laboratory?64:37;
   if(under){const x=laboratory?339:236;shock(c,x,149,phase(q,s.impact,.98),laboratory?110:150,hot,.9);}
   else{
    if(laboratory)labBase(c,1);
    const charge=peak(q,.08,.32,.76,1),rad=(laboratory?8:20)+(laboratory?28:17)*s.charge;
    if(charge>0){ellipse(c,sx,sy,rad+7,rad+7,`rgba(247,157,79,${(.16*charge).toFixed(3)})`);ellipse(c,sx,sy,rad,rad,'#e78d49');ellipse(c,sx,sy,rad*.75,rad*.75,'#f7ca67');ellipse(c,sx,sy,rad*.41,rad*.41,bright);rays(c,sx,sy,rad+2,rad+9,hot,12,q*.25);}
    if(id==='sun-gaze'){
     const ray=peak(q,.35,.54,.75,.87);
     if(ray>0){c.globalAlpha*=ray;poly(c,[[sx-11,sy+19],[sx+11,sy+19],[284,175],[198,175]],'#ffcf72');poly(c,[[sx-5,sy+19],[sx+5,sy+19],[259,170],[222,170]],bright);}
    }
    if(s.residue>0)burst(c,laboratory?340:240,156,65,s.residue,'fire');
   }
  }else if(id==='lab-2'||id==='lab-3'){
   if(under){if(id==='lab-3')shock(c,360,167,phase(q,.6,.97),90,hot,.9);}
   else{
    labBase(c,true);
    const fl=peak(q,.13,.29,.8,.94);
    for(let i=0;i<11;i++){
     const x=354+hash(i+47)*78,y=59+hash(i+22)*38;
     if(fl>0)line(c,x,y,x+Math.sin(i*3.1)*5,y-8-i%3,hot,(i%3===0?2.6:1.1));
    }
    if(id==='lab-3'){
     const blast=peak(q,.51,.61,.69,.84),r=4+70*phase(q,.55,.83);
     if(blast>0){ellipse(c,385,84,r,r*.72,`rgba(248,156,83,${(.49*blast).toFixed(3)})`);ellipse(c,385,84,r*.65,r*.49,'#f9d07c');ellipse(c,385,84,r*.32,r*.27,bright);burst(c,385,90,68,blast,'fire');}
     if(q>.73){const smoke=peak(q,.72,.78,.96,1);for(let i=0;i<5;i++)ellipse(c,351+i*16,59-i%3*7-10*smoke,10+i%3*4,7+i%2*4,`rgba(54,67,75,${(.37*smoke).toFixed(3)})`);}
    }
   }
  }else if(id==='aura'){
   if(!under){const str=peak(q,.08,.29,.74,1),p=project?project(0,4):tgt;
    c.globalAlpha*=str*.75;
    for(let i=0;i<9;i++){const x=p.x+(i-4)*9;line(c,x,p.y+3,x+Math.sin(q*20+i)*4,p.y-10-(i%4)*10, i%2?'#85e8ff':'#f9cc80',1.4+(i%3)*.4);}
    ellipse(c,p.x,p.y-7,17,13,'rgba(252,207,127,.18)');
   }
  }else if(id==='storm-3'){
   if(!under){const flash=peak(q,.50,.63,.69,.83);
    if(flash>0)arcBolt(c,{x:100,y:7},{x:146,y:95},flash*.73,3);
   }
  }
  if(rare&&!under&&s.strike>.08){c.globalAlpha*=.10*s.strike;rect(c,0,0,480,270,bright);}
  c.restore();return true;
 }
 // Short visual-only contact jolt for any car on the same road. The canvas
 // world shakes by a few pixels at impact; deterministic result data is untouched.
 function cameraImpulse(id,elapsedMs,{motion=true}={}){
  if(!motion||!recipe(id)||id==='aura'||id==='lab-2')return {x:0,y:0};
  const s=sample(id,elapsedMs),impact=s.impact;
  const k=peak(s.t,impact-.025,impact+.007,impact+.065,impact+.16);
  const intensity={'lightning-pass':2.0,'slash-pass':2.3,'beam':2.0,'mini-sun':2.7,
   'sun-gaze':1.6,'lab-3':2.9,'storm-3':.7}[id]||0;
  return {x:Math.sin(s.t*174)*k*intensity,y:Math.cos(s.t*137)*k*intensity*.55};
 }
 function rivalTransform(id,q,{x,z}){
  const r=recipe(id);if(!r||!['lightning-pass','slash-pass'].includes(id))return null;
  // Special-pass car disappears at ~84% of the visual's timeline. Don't begin
  // moving the car before the bolt/slash has actually landed.
  const phaseQ=clamp(q*.8387),reaction=phase(phaseQ,r.impact+.03,r.impact+.17),sign=x<0?-1:1;
  return {x:x+sign*(z*4.6+19)*reaction,z:z*(1+.025*reaction),
   lift:16*Math.sin(Math.PI*reaction),angle:sign*.48*reaction};
 }
 return Object.freeze({RECIPES,recipe,sample,render,cameraImpulse,rivalTransform});
});
