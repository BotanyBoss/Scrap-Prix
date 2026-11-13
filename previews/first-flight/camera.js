// Shot choreography only. Coordinates and easing describe the edit, never the outcome.
function firstFlightCamera(canvas){
  const ctx=canvas.getContext('2d'), back=document.createElement('canvas');
  const rear=ScrapScene.create(back,{camera:'rear',comboBodywork:true});
  const W=480,H=270,deck=155,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
  function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
  function shape(p,c){ctx.fillStyle=c;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
  function line(x,y,X,Y,c,n){ctx.strokeStyle=c;ctx.lineWidth=n;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.stroke()}
  function path(p,c,n){for(let i=1;i<p.length;i++)line(...p[i-1],...p[i],c,n)}
  function sign(x,y,label){rect(x+1,y,3,19,'#44392f');rect(x-18,y-9,42,12,'#342e2c');rect(x-17,y-8,40,10,'#eabb62');ctx.fillStyle='#312d29';ctx.font='bold 8px monospace';ctx.fillText(label,x-15,y)}
  function pier(x){
    shape([[x-14,163],[x+14,163],[x+17,241],[x-18,241]],'#554f50');
    rect(x-12,163,5,78,'#877466');rect(x-18,233,36,8,'#4b4647');
    for(let k=0;k<5;k++)line(x-13,179+k*12,x+12,177+k*12,'#6e625d',1);
  }
  function span(a,b,brokenEnd){
    rect(a,deck,b-a,7,'#d6a970');rect(a,deck+2,b-a,3,'#4b4746');
    rect(a,deck+7,b-a,14,'#3f4142');
    for(let x=a+1;x+14<b;x+=18){path([[x,deck+18],[x+8,deck+8],[x+16,deck+18]],'#ab7351',3);rect(x+7,deck+8,2,2,'#ebc68d')}
    rect(a,deck+20,b-a,3,'#9a6b51');
    for(let x=a+12;x<b-10;x+=30){rect(x,deck-9,3,9,'#735544');rect(x,deck-9,3,2,'#eece8a');line(x,deck-6,Math.min(x+30,b-3),deck-6,'#9c8b75',1)}
    const x=brokenEnd?b:a,dir=brokenEnd?1:-1;
    for(let i=0;i<3;i++)line(x-dir*6,deck+3+i*6,x+dir*(11-i*2),deck+8+i*9,'#9d7558',3);
  }
  const bypass=[[-30,151],[22,150],[78,172],[125,196],[189,202],[281,201],[350,188],[407,157],[445,150],[510,151]];
  function bypassY(x){let i=1;while(i<bypass.length-1&&x>bypass[i][0])i++;let [a,b]=bypass.slice(i-1,i+1);return mix(a[1],b[1],clamp((x-a[0])/(b[0]-a[0])))}
  function land(story,t){
    // Reuse the horizon painted by the game's track/weather renderer.
    ctx.drawImage(back,0,0,back.width,82*3,0,0,W,93);
    const wet=story.setting.weatherId==='rain';
    shape([[0,89],[58,87],[98,98],[142,91],[199,106],[287,98],[330,86],[396,94],[480,84],[480,270],[0,270]],wet?'#798581':'#9a9079');
    shape([[0,105],[84,103],[122,121],[166,136],[201,174],[258,177],[303,138],[352,114],[412,107],[480,110],[480,270],[0,270]],'#566c68');
    // Layered cut banks frame the lower maintenance crossing.
    shape([[-40,115],[55,126],[117,159],[141,190],[161,212],[216,219],[-40,234]],'#706756');
    shape([[493,118],[422,131],[378,158],[334,197],[297,215],[262,224],[493,231]],'#6e6555');
    for(let i=0;i<8;i++){
      path([[-9,140+i*9],[49,147+i*9],[88,159+i*7],[119,184+i*4]],i%2?'#817666':'#655e4e',2);
      path([[482,144+i*9],[439,148+i*8],[400,164+i*6],[366,186+i*4]],i%2?'#847868':'#665f51',2);
    }
    rect(-40,220,580,60,'#4c777a');
    for(let k=0;k<34;k++){const x=(k*73+t*.014)%530-25,y=224+(k*13)%48;rect(x,y,6+k%14,1,k%2?'#73999a':'#365e62')}
    path(bypass.map(([x,y])=>[x,y+8]),'#554a41',19);path(bypass,'#b58f68',17);path(bypass,'#70675a',12);
    for(let x=10;x<472;x+=16)rect(x,bypassY(x),5,1,'#e7be83');
    pier(97);pier(362);span(-60,171,true);span(315,540,false);
    path([[167,169],[185,196],[205,207],[215,210]],'#403f41',2);
    path([[318,168],[306,189],[298,191]],'#403f41',2);
    sign(38,142,'BYPASS');sign(389,146,'GAP 01');
  }
  function car(s,x,y,w,view,t,angle=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    // Native garage/side geometry faces left; stage travel runs left to right.
    if(view!=='rear')ctx.scale(-1,1);
    ScrapVehicleArt.draw(ctx,{x:0,y:0,w,h:w*.69,view,loadout:s.vehicleLoadout,motion:t>0,time:t,comboBodywork:true});
    ctx.restore();
  }
  function shadow(x,y,w){ctx.fillStyle='rgba(27,33,30,.45)';ctx.beginPath();ctx.ellipse(x,y,w,2.5,0,0,Math.PI*2);ctx.fill()}
  let cached=null;
  function game(s,t,motion){rear.drawRace({time:t,track:s.setting.trackId,surface:s.setting.surfaceId,weather:s.setting.weatherId,loadout:s.vehicleLoadout,approach:s.setting.approach,motion});}
  function paint(s,frame,reduced){
    const {shot,progress:p,elapsedMs:t}=frame,id=shot.id,fx=reduced?0:t;
    ctx.save();ctx.imageSmoothingEnabled=false;rect(0,0,W,H,'#82938c');
    if(['opening','rejoin','dnf','detourMerge'].includes(id)){
      game(s,t,!reduced&&id!=='dnf');ctx.drawImage(back,0,0,W,H);cached=null;
      if(id==='detourMerge'){sign(111-100*p,155+100*p,'MERGE')}
    }else{
      if(cached!==s){game(s,0,false);cached=s}
      let x=92,y=deck,width=72,view='side',angle=0,zoom=1,cx=240,cy=135,hit=0;
      if(id==='bridgeApproach'){x=mix(5,96,p);width=48;zoom=reduced?1:1.06-.06*p}
      if(id==='choice'){x=100;width=74;view='garage';zoom=1.5;cx=143;cy=145}
      if(id==='detour'){x=mix(16,447,p);y=bypassY(x);width=58}
      if(id==='lift'||id==='failureFlight'){
        const q=clamp((p-.22)/.78),win=id==='lift';
        x=p<.22?mix(100,159,p/.22):mix(159,win?325:303,q);
        y=deck-(win?77:58)*4*q*(1-q)+(win?0:14*q*q);
        if(!reduced)angle=q===0?0:(q-.44)*.55;
      }
      if(id==='landing'){x=mix(325,446,p);y=deck-(reduced?0:Math.abs(Math.sin(p*Math.PI*2))*9*(1-p));angle=reduced?0:.17*Math.cos(p*8)*(1-p)}
      if(id==='impact'){
        hit=1-p;zoom=1.72;cx=306;cy=151;x=303-10*Math.sin(p*Math.PI);y=deck+14+16*p;angle=.24+.30*Math.sin(p*Math.PI);
      }
      if(id==='mechanical'){
        // Cut to an inspection bench, not a platform floating in the gap.
        ctx.fillStyle='#233437';ctx.fillRect(0,0,W,H);
        for(let i=0;i<W;i+=16){line(i,0,i,H,'#2e4040',1);line(0,i,W,i,'#2e4040',1)}
        ctx.fillStyle='#d4c4a6';ctx.font='bold 12px monospace';ctx.fillText('SCRUTINEERING  /  BRIDGE CONTACT',15,23);
        rect(18,211,257,7,'#d79f53');rect(18,218,257,13,'#111e21');
        car(s,149,212,245,'garage',0);
        const r=s.readout;
        ctx.fillStyle='#ffd181';ctx.fillText('DAMAGE BY SLOT',298,78);
        Object.entries(s.vehicleLoadout).forEach(([slot],i)=>{
          ctx.fillStyle='#d4dfda';ctx.fillText(slot.toUpperCase(),298,101+i*21);
          ctx.fillText(String(r.damageBySlot[slot]||0),435,101+i*21);
        });
        ctx.fillStyle='#ffd181';ctx.fillText('SCORE  '+(r.scoreDelta>0?'+':'')+r.scoreDelta,298,207);
        ctx.restore();return;
      }
      ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-cx,-cy);
      land(s,fx);

      if(id==='detour'||id==='mechanical'||x<170||x>315)shadow(x,y+1,width*.33);
      car(s,x,y,width,view,fx,angle);
      if(hit&&!reduced){for(let i=0;i<14;i++){let a=i*2.4,d=9+p*38;line(316+Math.cos(a)*d,165+Math.sin(a)*d+p*p*18,316+Math.cos(a)*(d+hit*7),165+Math.sin(a)*(d+hit*7)+p*p*18,'#ffd88a',2*hit)}}
    }
    ctx.restore();
  }
  return {paint,ready:rear.ready};
}
