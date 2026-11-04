/* Scrap Prix v0.7.21c — deterministic cloning / duplication presentation.
 * Both recipes are fake passes, NEVER real gained positions.
 * Duplicate vehicles inherit the actual targeted rival's modular build.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ScrapEventClones=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:0));
 const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
 const transition=(t,a,b)=>ease((t-a)/(b-a));
 const pulse=(t,a,b,c,d)=>transition(t,a,b)*(1-transition(t,c,d));
 const RECIPES=Object.freeze({
  'clone-fake':Object.freeze({id:'clone-fake',title:'The Clone Was Better',family:'clone',role:'fake',duration:1000,primary:'#9de9dd',secondary:'#ffd675',description:'A flawed duplicate is passed. Then the upgraded one immediately proves superior.'}),
  'mirror-fake':Object.freeze({id:'mirror-fake',title:'Mirror Rival',family:'clone',role:'fake',duration:1000,primary:'#9ed5ec',secondary:'#eff8fb',description:'A mirrored copy peels out of reflective glass, then melts back into the rival ahead.'})
 });
 const recipe=id=>RECIPES[id]||null;
 function sample(id,elapsedMs=0,{motion=true,variant='normal'}={}){
  const r=recipe(id);if(!r)return null;
  const t=clamp((motion?elapsedMs:440)/r.duration),rare=variant==='rare';
  const stage=id==='clone-fake'?(t<.13?'scan':t<.40?'copy':t<.57?'false-overtake':t<.86?'upgrade':'afterimage'):
    (t<.19?'summon-mirror':t<.41?'reflection':t<.69?'peel-away':t<.85?'shatter':'merge');
  return {id,r,t,rare,stage,
    machine:pulse(t,.03,.22,.55,.83),
    mirror:pulse(t,.07,.20,.69,.89),
    decoy:pulse(t,.10,.27,.49,.75),
    ace:pulse(t,.46,.62,.82,.99),
    reflected:pulse(t,.18,.33,.66,.94),
    shatter:transition(t,.66,.82)*(1-transition(t,.91,1))};
 }
 // Rendering poses are relative to a *real* rival already in the scene.
 // Never adjust the source rival's position or award a real pass.
 function actors(id,q,{x=0,z=3.85}={}){
  const r=recipe(id);if(!r)return [];
  const t=clamp(q),adjacent=x<0?2.55:-2.55;
  if(id==='clone-fake'){
   const decoyNear=transition(t,.15,.55),upgradeFar=transition(t,.55,.92);
   return [
    {kind:'flawed',x:x+(adjacent-x)*transition(t,.09,.23),z:z-Math.min(1.70,z*.39)*decoyNear,
     alpha:pulse(t,.19,.32,.50,.71),scale:1+.03*decoyNear,mirror:false},
    {kind:'superior',x:adjacent,z:z+3.75*upgradeFar,
     alpha:pulse(t,.46,.64,.87,1),scale:1,mirror:false,boost:upgradeFar}
   ];
  }
  // Materialise only after separation, and dissolve before merging back.
  const split=transition(t,.14,.30),returning=transition(t,.78,.95);
  return [{kind:'reflection',x:x+(adjacent-x)*(split*(1-returning)),
   z:z-.50*transition(t,.28,.53)+3.1*transition(t,.62,.88),
   alpha:pulse(t,.27,.40,.68,.86),scale:1.03,mirror:true,boost:0}];
 }
 const ellipse=(ctx,x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);ctx.fill()};
 const line=(ctx,x,y,x1,y1,color,w=1)=>{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x1,y1);ctx.stroke()};
 const polygon=(ctx,points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()};
 function render(ctx,{id,elapsedMs=0,variant='normal',motion=true,layer='over',rivalAnchor=null,project=null}={}){
  const s=sample(id,elapsedMs,{motion,variant});if(!s)return false;
  const a=rivalAnchor||(typeof project==='function'?project(-1.55,3.85):{x:218,y:151});
  const x=a.x,y=a.y,t=s.t,amp=s.rare?1.20:1;
  ctx.save();
  if(id==='clone-fake'){
   if(layer==='under'){
    ctx.globalAlpha*=s.machine*.48;
    ellipse(ctx,x,y+4,25,6,'#57b9b7');ellipse(ctx,x+20,y+3,15,4,'#f9c764');
    for(let i=0;i<4;i++)line(ctx,x-25+i*13,y+7,x-21+i*13,y+10,'#c5f4e3',2);
   }else{
    ctx.globalAlpha*=s.machine;
    // A visibly mechanical copy process, not the supernatural ghost ribbon.
    const spin=t*20;
    for(let i=0;i<3;i++){
     const dx=Math.sin(spin+i*2.09)*18;
     const dy=Math.cos(spin+i*2.09)*8;
     line(ctx,x+dx-17,y-27+dy,x+dx+17,y-27+dy,i===1?'#ffdf8b':'#90e8de',2.4);
    }
    for(let i=0;i<7;i++){
     const xx=x-24+(i*13)%59,yy=y-10-(i*17)%39;
     ellipse(ctx,xx,yy,1.8+(i%2),1.2,i%3?'#a8f0df':'#fff0ae');
    }
    if(t>.55){
     const run=transition(t,.55,.92);
     ctx.globalAlpha*=s.ace*.9;
     for(let i=0;i<5;i++)line(ctx,x-40+i*13,y-22+i%2*6,
       x-50+i*13-16*run,y-22+i%2*6,'#ffe79a',2.5*amp);
    }
   }
  }else{
   const px=x+42,py=y-21;
   if(layer==='under'){
    ctx.globalAlpha*=s.mirror*.63;
    ellipse(ctx,px,y+2,20,5,'#a3d9e8');
    for(let i=0;i<4;i++)line(ctx,px-16+i*10,y+2,px-11+i*10,y+5,'#e7faff',1);
   }else{
    // Upright glass pane with an angled reflection. Once the copy escapes,
    // the pane fractures into independently moving deterministic shards.
    ctx.globalAlpha*=s.mirror;
    polygon(ctx,[[px-20,py-29],[px+12,py-34],[px+24,py+18],[px-12,py+22]],'#253d4e');
    polygon(ctx,[[px-17,py-26],[px+10,py-30],[px+20,py+16],[px-9,py+18]],'#99d4e4');
    polygon(ctx,[[px-14,py-23],[px-2,py-26],[px+7,py+15],[px-5,py+17]],'#d8f2f5');
    line(ctx,px-16,py-26,px+18,py+16,'#effcff',1.5);
    if(t>.60){
     ctx.globalAlpha*=s.shatter;
     for(let i=0;i<8;i++){
      const a=i*Math.PI/4,spread=13+transition(t,.63,.94)*35;
      const sx=px+Math.cos(a)*spread,sy=py+Math.sin(a)*spread;
      polygon(ctx,[[sx,sy],[sx+Math.cos(a)*6,sy-5],[sx-4,sy+5]],i%2?'#a8dce9':'#f4fdff');
     }
    }
   }
  }
  ctx.restore();return true;
 }
 return Object.freeze({RECIPES,recipe,sample,actors,render});
});
