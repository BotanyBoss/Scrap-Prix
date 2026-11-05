

/* Low-resolution canvas scenery. Depth comes from projection, never CSS stripes.
   All motion is cosmetic; the deterministic engine owns damage, place and rewards. */
(function () {
  'use strict';
  const P=window.ScrapPresentation;
  const C=['#17282e','#435b64','#839da5','#d4e1df'];
  const car=new Image(); car.src='{{ASSET:assets/embedded/f6d969de51fe300a.png}}';
  const title=new Image(); title.src='{{ASSET:assets/embedded/ac3fad71725d4dc9.png}}';
  // Shared visual world-space timeline. Road markings, terrain details and
  // roadside props advance at the same rate. No gameplay code reads this.
  const WORLD_UNITS_PER_MS=.0033;
  const hashUnit=n=>{
    let h=Math.imul((n|0)^0x1c69b3f7,0x85ebca6b);
    h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;
    return (h>>>0)/4294967296;
  };
  function groundSamples(time,side,{spacing=4.2,count=9,salt=0}={}){
    const d=Math.max(0,Number.isFinite(time)?time:0)*WORLD_UNITS_PER_MS;
    const group=Math.floor(d/spacing),offset=d%spacing;
    return Array.from({length:count},(_,i)=>{
      // The same serial keeps the same silhouette while travelling from
      // the horizon to the camera. Only the nearest one leaves the frame.
      const serial=group+i,seed=serial*97+(side<0?19:71)+salt;
      return {serial,z:(i+1)*spacing-offset,
        lane:side*(5.65+.98*hashUnit(seed+7)),
        size:.76+.53*hashUnit(seed+17),
        detail:hashUnit(seed+31),side};
    });
  }
  function create(canvas, options={}) {
    canvas.width=P.WIDTH*3;canvas.height=P.HEIGHT*3;
    const ctx=canvas.getContext('2d',{alpha:false});
    if (!ctx) return null;
    ctx.setTransform(3,0,0,3,0,0);
    ctx.imageSmoothingEnabled=false;
    function rect(x,y,w,h,c) {ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
    function poly(points,c) {ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.closePath();ctx.fill();}
    function line(x1,y1,x2,y2,c,width=1) {ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(Math.round(x1),Math.round(y1));ctx.lineTo(Math.round(x2),Math.round(y2));ctx.stroke();}
    // The renderer now composes the actual four equipped components. Each
    // part is separate geometry; no shared car bitmap underneath the assembly.
    function sprite(x,y,w=140,h=96,loadout=null,motion=false,view='rear',models=null,time=0,livery=0,comboOverride=null) {
      if(window.ScrapVehicleArt)window.ScrapVehicleArt.draw(ctx,{x,y,w,h,loadout,models,motion,time,livery,
        view,style:options.style||'illustrated',comboBodywork:comboOverride===null?(options.comboBodywork===true||(options.permanentFossil===true&&window.ScrapVehicleArt.resolveForm(models||window.ScrapVehicleArt.fromLoadout(loadout||{}))?.id==='fossil')):comboOverride});
    }
    // Everything in this section draws pixels only. A visual preset cannot
    // change the course profile, physical surface, weather odds, or race RNG.
    const ENV=window.ScrapEnvironments;
    let sceneStyle=null;
    function depthTone(hex,amount){
      const rgb=[1,3,5].map(k=>parseInt(hex.slice(k,k+2),16));
      if(rgb.some(v=>!Number.isFinite(v)))return hex;
      return '#'+rgb.map(v=>Math.round(amount>0?v+(235-v)*amount:v*(1+amount)).toString(16).padStart(2,'0')).join('');
    }
    function pine(x,y,h=18,col='#294f47'){
      rect(x-1,y-h*.29,3,h*.29,'#5b5145');
      poly([[x,y-h],[x-h*.42,y-h*.28],[x+h*.42,y-h*.28]],col);
      poly([[x,y-h*.75],[x-h*.49,y-h*.12],[x+h*.49,y-h*.12]],col);
      // Two painted foliage values suggest overlapping branches, not a mesh.
      poly([[x,y-h],[x+h*.42,y-h*.28],[x+h*.07,y-h*.28]],depthTone(col,-.16));
      poly([[x,y-h*.75],[x+h*.49,y-h*.12],[x+h*.07,y-h*.12]],depthTone(col,-.16));
      line(x-h*.27,y-h*.38,x-h*.05,y-h*.70,depthTone(col,.10),1);
    }
    function palm(x,y,s=1){
      rect(x-1*s,y-33*s,3*s,33*s,'#77614b');
      poly([[x,y-32*s],[x-20*s,y-30*s],[x-10*s,y-39*s],[x,y-36*s],[x-7*s,y-49*s],[x+3*s,y-41*s],[x+19*s,y-46*s],[x+23*s,y-35*s],[x+8*s,y-37*s],[x+19*s,y-28*s]],'#317f63');
    }
    function skyline(x,y,w,h,col,lit=false){
      rect(x,y-h,w,h,col);
      rect(x+w*.76,y-h,Math.max(2,w*.24),h,depthTone(col,-.16));
      rect(x,y-h,w,1,depthTone(col,.20));
      rect(x,y-2,w,2,depthTone(col,-.14));
      if(lit)for(let iy=y-h+5;iy<y-4;iy+=9)for(let ix=x+4;ix<x+w-3;ix+=10)rect(ix,iy,3,3,'#f0d9a0');
    }
    function hills(col,base=87,peaks=20,shift=0){
      const pts=[[0,base]];
      for(let x=0;x<=480;x+=48){const y=base-6-((x*7+shift*19)%47)/47*peaks-((x%96)===0?5:0);pts.push([x,y]);}
      pts.push([480,base],[0,base]);poly(pts,col);
    }
    function mountain(x,base,size,col,snowcap=false){
      poly([[x-size,base],[x,base-size*.93],[x+size,base]],col);
      poly([[x,base-size*.93],[x+size,base],[x+size*.14,base]],depthTone(col,-.16));
      if(snowcap)poly([[x-size*.27,base-size*.68],[x,base-size*.93],[x+size*.27,base-size*.68],[x+size*.08,base-size*.72],[x-size*.08,base-size*.70]],'#eff6f3');
    }
    // Four release-track identities share the low-cost canvas vocabulary,
    // but never share one generic horizon. No game rules read this layer.
    function venueBackdrop(env){
      const l=env.landscape,p=l.profile;
      if(p==='city'){
        // Distant commercial towers: staggered rooflines, windows and aerials.
        for(let i=0;i<23;i++){
          const x=i*23-9,w=20+(i%3)*3,h=19+(i*17%48);
          skyline(x,91,w,h,i%4===0?'#75919a':l.far);
          if(i%5===0){rect(x+8,91-h-8,3,8,l.ink);rect(x+4,91-h-2,11,2,l.ink);}
          for(let wy=91-h+5;wy<88;wy+=10)for(let wx=x+4;wx<x+w-3;wx+=8)
            if((wx+wy+i)%4!==0)rect(wx,wy,3,4,'#d9d0ad');
        }
        // A few near rooflines frame the road, without obscuring opponents.
        for(const [x,w,h] of [[0,62,53],[66,39,39],[386,41,42],[430,55,58]]){
          rect(x,92-h,w,h,l.near);
          rect(x+w*.78,92-h,w*.22,h,depthTone(l.near,-.18));
          rect(x,90,w,2,depthTone(l.near,-.25));rect(x-1,92-h,w+2,4,l.ink);
          for(let yy=96-h;yy<84;yy+=12)for(let xx=x+7;xx<x+w-4;xx+=13){
            rect(xx,yy,5,6,'#d5bf9c');rect(xx+1,yy+1,3,4,'#7191a0');
          }
        }
        // Small overhead utility lines suggest a working, inhabited city.
        line(61,31,109,36,l.ink,1);line(388,26,433,31,l.ink,1);
        rect(16,48,32,8,'#e2b975');rect(19,50,26,3,l.ink);
        return;
      }
      if(p==='suburb'){
        // Distant, desaturated high street on either side of an OPEN vanishing
        // corridor. Nearby shops are projected separately in world space.
        const far=[
          [-24,38,13],[21,28,23],[54,35,16],[94,22,24],
          [122,20,18],[151,19,13],[174,13,9],
          [291,16,9],[314,19,14],[337,24,23],[367,31,18],
          [402,37,24],[443,42,17]
        ];
        ctx.save();ctx.globalAlpha*=.48;
        for(let i=0;i<far.length;i++){
          const [x,w,h]=far[i],col=['#84979d','#9ba2a4','#a3a7a0'][i%3];
          rect(x,88-h,w,h,col);
          rect(x+w*.78,88-h,Math.max(2,w*.22),h,depthTone(col,-.12));
          if(i%3===0)rect(x+3,88-h-3,Math.max(7,w-6),3,depthTone(col,-.13));
          for(let q=6;q<w-4;q+=9)rect(x+q,88-h+6,3,4,'#cfcdc0');
        }
        ctx.restore();
        // A nearer roofline frames the road but stops outside the central
        // sightline; there is deliberately no facade across the horizon.
        const mid=[
          [-35,57,30,'#b99485'],[24,46,35,'#93abb0'],
          [76,41,29,'#c7a68a'],[119,36,28,'#a7a4a2'],
          [324,37,27,'#afaaaa'],[367,44,32,'#8fa8a9'],
          [418,73,38,'#b69b90']
        ];
        for(let i=0;i<mid.length;i++){
          const [x,w,h,col]=mid[i],top=89-h;
          rect(x,top,w,h,col);
          rect(x+w-7,top,7,h,depthTone(col,-.18));
          rect(x,top,w,3,depthTone(col,-.28));
          if(i%3===0)poly([[x+3,top],[x+w*.50,top-8],[x+w-2,top]],'#676d71');
          if(i%3===1)rect(x+6,top-4,Math.max(10,w-12),4,depthTone(col,-.20));
          for(let q=8;q<w-5;q+=13){
            rect(x+q,top+10,7,8,'#6d8d96');
            rect(x+q,top+11,5,5,'#b0c9c7');
          }
          rect(x+3,81,w-6,4,['#b85f54','#61938e','#d4a668'][i%3]);
          rect(x+5,85,w-10,4,'#597276');
        }
        return;
      }
      if(p==='grandprix'){
        hills(l.far,91,9,3);
        // Purpose-built pit garages: open dark bays, timing box, a paddock roof.
        rect(0,49,143,42,'#7e9b98');rect(0,45,145,6,'#e5e5d8');
        rect(7,36,53,9,'#c75d4f');
        ctx.font='bold 7px monospace';ctx.fillStyle='#f5e9d6';ctx.fillText('PIT LANE',11,43);
        for(let i=0;i<6;i++){
          const x=7+i*22;rect(x,59,18,28,'#374e58');rect(x+2,63,14,12,'#738b96');
          rect(x,55,18,3,i%2?'#f0e4d3':'#d7645a');rect(x+2,78,14,2,'#d9c7a5');
        }
        // Tiered grandstand with a canopy, spectators and safety fencing.
        poly([[337,55],[477,43],[480,49],[343,62]],'#354a51');
        poly([[346,56],[480,49],[480,87],[342,87]],'#8da7a0');
        for(let tier=0;tier<3;tier++){
          const yy=63+tier*8;rect(348,yy,132,4,tier%2?'#506f74':'#d0d8c7');
          for(let k=0;k<15;k++){const xx=352+k*9+(tier%2)*3;rect(xx,yy-3,3,4,(k+tier)%3===0?'#d96e58':(k+tier)%3===1?'#ebd7a6':'#5b94ac');}
        }
        for(let x=348;x<480;x+=15){line(x,67,x,91,'#5c7776',1);}
        rect(382,30,57,16,'#303f49');rect(385,33,51,9,'#d9bc72');
        ctx.fillStyle='#263b44';ctx.font='bold 7px monospace';ctx.fillText('GRAND PRIX',387,40);
        for(let x of [19,121,460]){
          line(x,15,x,48,'#526b6b',1);poly([[x,17],[x+13,20],[x,23]],x%2?'#e36d5c':'#eee8d4');
        }
        return;
      }
      if(p==='circuit'){
        hills(l.far,91,14,5);
        // A small club circuit: grassy banks, marshal tower, tyre stacks and
        // compact spectator terrace instead of Formula One pit architecture.
        poly([[0,91],[0,72],[50,69],[94,78],[134,90]],l.near);
        poly([[357,91],[387,78],[441,69],[480,74],[480,91]],l.near);
        rect(15,58,105,29,'#697e6e');rect(13,53,110,6,'#d4d8c1');
        for(let tier=0;tier<3;tier++){
          rect(18,60+tier*8,99,3,tier%2?'#c8cebd':'#49665e');
          for(let i=0;i<10;i++)rect(21+i*9,57+tier*8,3,4,(tier+i)%2?'#d79d68':'#628a96');
        }
        rect(403,48,31,39,'#627f78');rect(399,45,39,6,'#d9dfd0');
        rect(410,55,17,12,'#aec9bb');rect(412,56,13,8,'#405f66');
        rect(417,39,2,7,l.ink);poly([[419,40],[431,43],[419,46]],'#df7865');
        // Trackside tyre wall is a recurring signature here, not F1 pit walls.
        for(const [x,yy] of [[4,81],[447,81]])for(let i=0;i<4;i++){
          ctx.fillStyle='#2f4442';ctx.beginPath();ctx.ellipse(x+i*9,yy,5,5,0,0,Math.PI*2);ctx.fill();
          rect(x+i*9-3,yy-2,6,2,i%2?'#e5be72':'#dce4dc');
        }
        rect(364,67,57,11,'#e4c46f');rect(367,70,51,5,'#46645f');
        return;
      }
      if(p==='paddock'){
        // Drag strip: a flat, cluttered speedway paddock with genuine timing
        // equipment. Unlike the airfield there are no aircraft or hangars.
        hills('#a6b1aa',91,6,2);
        // Low tent paddock and tool trailers form a horizontal silhouette.
        for(const [x,w,h,paint] of [[0,57,24,'#7f9c9b'],[62,47,19,'#79989a'],[371,52,22,'#8d9991'],[426,56,26,'#789094']]){
          rect(x,90-h,w,h,paint);rect(x-2,90-h,w+4,3,'#48565a');
          for(let d=x+7;d<x+w-7;d+=16){rect(d,90-h+6,10,11,'#344a52');rect(d+2,90-h+8,6,2,'#d5cab1');}
          rect(x+3,87,w-6,2,'#d1b58e');
        }
        // Two branded tyre-service tents and a tyre stack landmark.
        for(const [x,side] of [[22,-1],[442,1]]){
          const x0=x-19;
          poly([[x0-5,72],[x,57],[x0+43,72]],side<0?'#d9bd76':'#b95f50');
          rect(x0-1,72,40,18,'#4b6066');rect(x0+3,74,34,3,'#e3dcbf');
          for(const t of [7,22]){ctx.fillStyle='#303c42';ctx.beginPath();ctx.ellipse(x0+t,84,8,6,0,0,Math.PI*2);ctx.fill();rect(x0+t-3,83,6,2,'#838c89');}
        }
        // Scoreboard to one side; the lettering reads at normal race scale.
        rect(345,43,3,43,'#48545a');rect(393,43,3,43,'#48545a');
        rect(339,36,63,23,'#263942');rect(342,39,57,4,'#e7c669');
        ctx.font='bold 7px monospace';ctx.fillStyle='#f0e3bd';ctx.fillText('DRAG 1/4',345,49);
        rect(346,52,20,3,'#d0bc78');rect(374,52,21,3,'#d0bc78');
        // Tiny chequerboard pennants reinforce an organised meet.
        for(let x of [94,117,420]){line(x,37,x,74,'#4d5d60',1);for(let k=0;k<3;k++)rect(x+k*4,38+k%2*3,4,3,k%2?'#292e36':'#efece0');}
        return;
      }
      if(p==='airfield'){
        // Airstrip: large curved-roof hangars, a control tower, and stationary
        // aircraft parked clear of the runway. No racing grandstands.
        hills('#91acaa',91,7,0);
        const hangar=(x,y,w,h,c)=>{
          rect(x,y-h,w,h,c);
          poly([[x-4,y-h+3],[x+w*.22,y-h-9],[x+w*.78,y-h-9],[x+w+4,y-h+3]],'#465f65');
          rect(x+3,y-h+7,w-6,h-9,'#566e75');
          for(let k=0;k<4;k++){const dx=x+7+k*(w-14)/4;rect(dx,y-h+10,(w-18)/4,h-15,k%2?'#4c626c':'#607c80');line(dx,y-h+10,dx,y-5,'#9aada6',1);}
          rect(x+1,y-h+2,w-2,3,'#d7d8c7');
        };
        hangar(0,87,106,28,'#8d9f9c');hangar(376,87,105,31,'#839995');
        // Control tower with glass cab and simple antenna.
        rect(122,45,22,41,'#879e9d');rect(118,39,30,13,'#3e6573');
        rect(119,40,28,8,'#a5d3ce');
        for(let j=0;j<4;j++)line(126+j*7,40,126+j*7,49,'#4f7380',1);
        rect(114,36,37,3,'#d7dcce');line(134,25,134,37,'#485a5d',1);
        rect(131,24,6,3,'#d98f69');
        // Parked prop plane uses unmistakeable wing / tail silhouette.
        const airplane=(x,y,f=1)=>{
          ctx.save();ctx.translate(x,y);ctx.scale(f,f);
          poly([[-24,-5],[-9,-9],[15,-9],[27,-4],[11,0],[-13,0]],'#5d7983');
          poly([[-9,-8],[-32,-20],[-4,-13],[18,-14],[32,-20],[17,-8]],'#c7d2cb');
          rect(-18,-15,9,8,'#a9c2c0');poly([[-23,-9],[-27,-20],[-15,-14]],'#d6d5c7');
          rect(23,-8,3,7,'#374951');line(26,-11,26,3,'#404d55',2);
          ctx.restore();
        };
        airplane(65,89,.86);airplane(428,88,.91);
        // Windsock: a characteristic airfield landmark without obscuring cars.
        line(351,38,351,85,'#5a6d69',2);
        poly([[352,40],[365,43],[362,49],[351,46]],'#e7c39b');
        rect(354,41,4,5,'#d36e51');rect(360,43,3,5,'#d36e51');
        return;
      }
      if(p==='rally'){
        // Rally: winding ridgelines are distant, while taped spectator areas,
        // firs and a modest timing marshal hut establish a point-to-point stage.
        poly([[0,90],[0,72],[43,48],[76,63],[122,42],[165,70],[223,51],[282,71],[352,46],[401,61],[480,45],[480,90]],'#78978b');
        poly([[0,90],[0,80],[45,72],[85,78],[132,64],[171,82],[205,75],[283,87],[337,76],[382,69],[449,80],[480,76],[480,90]],l.near);
        for(let i=0;i<16;i++){
          const x=i*33-11,y=85+(i%3)*2;
          if(x>166&&x<327)continue;
          pine(x,y,19+(i%4)*6,i%2?'#31574f':'#426c57');
        }
        // Small marshal post and coloured boundary tape on both sides.
        rect(24,66,47,21,'#b7a58b');poly([[20,68],[47,54],[75,68]],'#5b6b60');
        rect(29,70,14,10,'#45636b');rect(49,70,16,10,'#45636b');
        rect(28,82,39,3,'#d8bd86');
        for(const [a,b,y] of [[78,159,79],[338,456,78]]){
          line(a,y,b,y-2,'#ece6cc',2);for(let x=a+5;x<b;x+=13){
            line(x,y-1,x,y+6,'#5f7069',1);
            rect(x-3,y-3,6,3,Math.floor(x/13)%2?'#d75d4f':'#e9e6d4');
          }
        }
        rect(371,54,67,14,'#2f514c');rect(375,57,59,8,'#e7d7ad');
        ctx.fillStyle='#3f5956';ctx.font='bold 7px monospace';ctx.fillText('RALLY STAGE',376,63);
        for(let x of [382,433])line(x,68,x,87,'#576c64',2);
        return;
      }
      if(p==='offroad'){
        // Off-road: distinctive fractured escarpment and boulder fields.
        // There is no pavement, architecture, or rally spectator infrastructure.
        poly([[0,90],[0,65],[32,52],[66,57],[85,38],[117,44],[133,69],[171,62],[201,81],[247,72],[301,48],[346,42],[378,62],[411,43],[453,51],[480,67],[480,90]],'#9e8b78');
        poly([[0,91],[0,71],[28,73],[53,62],[85,65],[118,56],[148,82],[197,81],[229,89],[289,83],[341,61],[375,70],[422,59],[457,75],[480,74],[480,91]],'#827461');
        // Rock faces, cracks, and embedded strata.
        for(const [x,y,scale] of [[8,62,1.1],[63,62,.8],[343,62,1],[423,61,1.13]]){
          poly([[x-14*scale,88],[x-9*scale,y+12*scale],[x,y],[x+19*scale,y+9*scale],[x+25*scale,89]],'#796958');
          poly([[x,y],[x+9*scale,y+5*scale],[x+1*scale,y+19*scale]],'#b5a18b');
          line(x+4*scale,y+16*scale,x+11*scale,y+24*scale,'#5f574f',1);
        }
        for(let i=0;i<14;i++){
          const x=i*39+(i%2)*11;
          if(x>150&&x<333)continue;
          rect(x,84-(i%3),7+(i%2)*6,3,i%2?'#6a7a58':'#758563');
          line(x+6,82,x+7,76,'#657653',1);
        }
        // A bent wooden hazard sign: terrain is rough, not a new game event.
        rect(411,59,3,29,'#675943');rect(399,60,30,14,'#d8ac63');
        poly([[404,67],[414,61],[423,67],[413,73]],'#725b47');
        return;
      }
      if(p==='pileup'){
        // Pile-up: wrecked elevated motorway interchange, broken road signs,
        // scattered abandoned cars beyond the playable straight ribbon.
        poly([[0,90],[0,77],[50,61],[113,75],[165,66],[218,82],[315,79],[367,68],[417,72],[480,58],[480,90]],'#8f9894');
        // A rear interchange crosses the distant skyline without reaching
        // into the playable road or changing a route choice.
        poly([[0,43],[90,38],[140,44],[179,46],[179,55],[94,51],[0,55]],'#667578');
        poly([[303,46],[349,42],[480,35],[480,48],[349,55],[303,55]],'#64757b');
        for(let x of [33,102,354,433]){rect(x,48,8,40,'#63706e');rect(x+2,50,4,35,'#98a39a');}
        // Crumpled motorway barriers and debris silhouettes on the shoulders.
        for(const [x,y,d] of [[-5,76,1],[70,81,.78],[384,81,.86],[447,76,1]]){
          poly([[x,y],[x+8*d,y-13*d],[x+28*d,y-12*d],[x+40*d,y]],'#6c7776');
          poly([[x+10*d,y-13*d],[x+18*d,y-19*d],[x+25*d,y-13*d]],'#b36357');
          rect(x+7*d,y-6*d,24*d,4*d,'#a38c76');
          for(const bx of [x+11*d,x+29*d]){rect(bx,y-3*d,7*d,3*d,'#313f43');}
          line(x+29*d,y-12*d,x+34*d,y-18*d,'#3d4849',2);
        }
        // Bent emergency gantry sign and a small plume of drifting haze.
        line(387,36,395,78,'#5d6966',2);rect(341,29,61,19,'#506967');
        rect(344,32,55,12,'#debf76');
        ctx.font='bold 7px monospace';ctx.fillStyle='#35494c';ctx.fillText('ROAD CLOSED',347,40);
        for(const [x,y,r] of [[34,39,9],[48,33,12],[62,29,9],[422,26,8],[431,17,11]]){
          ctx.fillStyle='rgba(96,106,105,.24)';ctx.beginPath();ctx.ellipse(x,y,r,r*.53,0,0,Math.PI*2);ctx.fill();
        }
        return;
      }
    }
    function landscapeBack(env){
      const l=env.landscape,s=sceneStyle,p=l.profile;
      // Campaign venue profiles take priority over the old generic silhouettes.
      if(['city','suburb','grandprix','circuit','paddock','airfield','rally','offroad','pileup'].includes(p)){
        venueBackdrop(env);
        return;
      }
      // Broad distant shapes help every track read even with the HUD hidden.
      if(!['space','moon','underwater','sewer','toyroom','cyber','city','suburb','utopia','rooftops','industry'].includes(p))hills(l.far,88,22,2);
      if(['city','cyber','utopia','rooftops'].includes(p)){
        for(let i=0;i<19;i++){
          const x=i*28-3,h=15+(i*29%43),w=19+i%3*4;
          skyline(x,89,w,h,l.near,p==='cyber');
          if(p==='cyber')rect(x+2,87-h,Math.max(6,w-4),2,i%2?'#eb72de':'#55dded');
          if(p==='utopia')poly([[x-2,89-h],[x+w/2,79-h],[x+w+2,89-h]],'#d7f0e8');
        }
        if(p==='rooftops'){
          line(75,27,75,78,l.ink,2);line(75,29,140,29,l.ink,2);line(131,30,131,53,l.ink,1);
          line(378,19,378,74,l.ink,2);line(378,20,455,20,l.ink,2);
        }
      } else if(p==='suburb'){
        for(let i=0;i<10;i++){
          const x=i*54-8,y=85-(i%2)*6;
          rect(x,y-18,41,19,l.near);poly([[x-3,y-18],[x+20,y-30],[x+44,y-18]],l.ink);
          rect(x+9,y-13,7,7,'#e2c694');rect(x+25,y-13,7,7,'#e2c694');
        }
      } else if(['airfield','paddock','grandprix','circuit'].includes(p)){
        for(const [x,y,w,h] of [[9,63,94,22],[366,65,100,24]]){
          rect(x,y,w,h,l.near);poly([[x-4,y],[x+w/2,y-11],[x+w+4,y]],l.ink);
          for(let j=0;j<4;j++)rect(x+9+j*22,y+7,14,7,'#c5d4c8');
        }
        if(p==='grandprix'||p==='circuit'){
          for(let x of [20,390]){rect(x,60,75,5,'#dfe9dc');for(let i=0;i<6;i++)rect(x+i*12,52,7,7,i%2?'#df7763':'#629ab1');}
        }
        if(p==='airfield'){
          rect(220,59,60,7,l.near);line(250,51,250,70,l.ink,2);
          poly([[220,59],[253,48],[283,59]],'#c8c8b6');
        }
      } else if(['forest','rally','jungle','prehistoric'].includes(p)){
        hills(depthTone(l.far,.06),90,22,4);
        // A muted middle tree row leaves the dark foreground silhouettes distinct.
        if(p==='forest')for(let i=0;i<18;i++)pine(i*29-5,88,16+(i%4)*5,depthTone(l.far,-.08));
        for(let i=0;i<19;i++){
          const x=(i*47)%486,y=86+(i%2)*4;
          if(p==='jungle'||p==='prehistoric')palm(x,y,.75+(i%3)*.19);
          else pine(x,y,22+(i%4)*9,l.ink);
        }
        if(p==='prehistoric'){
          // Distant long-neck silhouette, not a gameplay event.
          rect(40,66,24,14,l.ink);rect(53,43,7,24,l.ink);rect(54,41,12,5,l.ink);
          for(const x of [44,56])rect(x,78,5,11,l.ink);
        }
      } else if(['mountains','snow','ice'].includes(p)){
        for(let i=0;i<7;i++)mountain(i*85-20,95,45+i%3*15,l.near,p!=='mountains');
        if(p==='ice')for(let i=0;i<13;i++){
          const x=i*43;poly([[x-9,90],[x,49-i%3*6],[x+12,90]],i%2?'#c2eff0':'#76bed1');
        }
      } else if(['desert','wasteland','raiders','volcano','offroad'].includes(p)){
        hills(l.near,89,16,12);
        for(let i=0;i<5;i++){
          const x=i*115+3,y=72-i%2*6;
          poly([[x-24,88],[x-18,y+8],[x-5,y],[x+21,y],[x+31,88]],l.near);
          poly([[x+12,y],[x+21,y],[x+31,88],[x+14,88]],depthTone(l.near,-.18));
          line(x-4,y,x+20,y,depthTone(l.near,.22),1);
          if(p==='volcano'&&i===2){poly([[x-28,80],[x,y-34],[x+30,80]],l.ink);rect(x-13,y-17,25,3,'#e78a53');}
        }
        if(p==='raiders'){
          for(let x of [21,425]){rect(x,52,28,30,l.ink);poly([[x-12,55],[x+14,32],[x+42,55]],'#65433d');}
        }
      } else if(p==='beach'){
        rect(0,72,480,18,'#3898ab');for(let i=0;i<18;i++)rect((i*41)%480,81+i%3,20,2,'#b5e6df');
        palm(29,87,.8);palm(438,85,1);
        rect(397,61,6,24,'#ece5cf');poly([[393,61],[400,49],[407,61]],'#d85d4e');
      } else if(['swamp','haunted'].includes(p)){
        hills(l.near,91,17,8);
        for(let i=0;i<12;i++){
          const x=i*51+5,y=87-(i%3)*2;
          line(x,y,x-6,y-26,l.ink,3);line(x-5,y-17,x-15,y-24,l.ink,2);
        }
        if(p==='haunted'){
          rect(411,57,36,31,l.ink);poly([[407,57],[427,36],[451,57]],l.ink);rect(420,48,4,11,'#b7c69a');
        }
      } else if(['industry','junkyard','pileup','warzone'].includes(p)){
        for(let i=0;i<12;i++){
          const x=i*44,h=8+(i*37%32);skyline(x,91,24+i%3*9,h,l.near);
          if(p==='industry'&&i%3===0){rect(x+7,27,7,63,l.ink);rect(x+5,23,11,5,'#ccc5b2');}
          if(p==='warzone'&&i%3===1)poly([[x,91-h],[x+11,75-h],[x+24,91-h]],s.ground);
        }
        if(p==='junkyard'||p==='pileup')for(let x of [36,412]){
          poly([[x-35,89],[x-18,62],[x+4,72],[x+21,56],[x+37,90]],l.ink);
        }
        if(p==='industry'||p==='junkyard'){
          line(407,30,407,75,l.ink,2);line(407,31,465,31,l.ink,2);line(453,31,453,58,l.ink,1);
        }
      } else if(p==='sewer'){
        rect(0,0,480,14,l.ink);rect(0,14,20,110,l.ink);rect(460,14,20,110,l.ink);
        for(let x=39;x<480;x+=82){line(x,0,x,64,l.near,7);rect(x-8,62,16,7,l.near);}
        poly([[0,0],[0,73],[23,58],[56,44],[103,30],[156,24],[240,20],[324,24],[390,32],[447,49],[480,69],[480,0]],l.near);
      } else if(p==='space'){
        for(const [x,y,r,c] of [[74,42,19,'#7f8eac'],[404,51,27,'#bc827d'],[350,14,8,'#ecd1a2']]){
          ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
        }
        rect(0,82,480,11,'#1c3151');for(let x=0;x<480;x+=42)rect(x,82,24,3,'#4b6b92');
      } else if(p==='moon'){
        hills(l.near,86,11,1);
        rect(12,68,55,19,'#b5c2c8');poly([[8,68],[38,55],[70,68]],'#e6e7e3');
        for(let x of [24,51])rect(x,70,10,7,'#4f738e');
      } else if(p==='underwater'){
        for(let i=0;i<14;i++){
          const x=i*37-4,y=83+i%3*3;
          poly([[x-7,y],[x-9,y-22],[x-4,y-12],[x+1,y-29],[x+6,y]],i%2?'#e09a82':'#48b9ac');
        }
        for(let x of [62,417]){
          rect(x,18,8,72,'#83d0cb');rect(x-2,20,12,4,'#bfece5');
        }
        ctx.strokeStyle='#83d0cb';ctx.lineWidth=7;ctx.beginPath();ctx.arc(240,99,239,Math.PI*1.05,Math.PI*1.95);ctx.stroke();
      } else if(p==='toyroom'){
        rect(0,0,480,81,'#dfac81');rect(0,0,480,13,'#f2d5a6');
        for(const [x,y,w,h,c] of [[3,39,70,47,'#b44c52'],[393,26,88,59,'#6584b7']]){rect(x,y,w,h,c);rect(x+9,y+11,w-18,8,'#e7c37e');}
        for(let x of [78,365]){rect(x,67,17,22,'#785654');rect(x-6,61,30,8,'#b87c64');}
      } else if(p==='miniature'){
        for(let i=0;i<20;i++){
          const x=(i*31)%480;line(x,92,x+9,23+(i%6)*6,'#3d885a',2+i%3);
        }
        ctx.fillStyle='#e7a95d';ctx.beginPath();ctx.arc(34,54,18,0,Math.PI*2);ctx.fill();
      } else if(p==='alien'){
        hills(l.near,94,24,3);
        for(let i=0;i<9;i++){
          const x=i*59,y=83+(i%2)*6;rect(x,y-20,5,20,l.ink);
          ctx.fillStyle=i%2?'#f2b3de':'#76d0bb';ctx.beginPath();ctx.ellipse(x+2,y-21,16,7,0,0,Math.PI*2);ctx.fill();
        }
      } else if(p==='medieval'){
        for(const x of [18,409]){
          rect(x,51,55,37,l.near);rect(x-5,41,17,14,l.ink);rect(x+43,41,17,14,l.ink);
          for(let k=0;k<4;k++)rect(x+k*14,48,8,5,l.ink);
        }
        rect(398,46,7,42,'#8e514b');poly([[405,46],[427,52],[405,60]],'#eac46a');
      }
    }
    function sky(track,weather,surface,visual=null,cameraLane=0){
      const env=ENV.resolve({track,surface,preset:visual?.preset,overrides:visual?.overrides});
      const l=env.landscape,r=env.road,sk=env.sky;
      sceneStyle={...l,ink:l.ink,road:r.fill,ground:l.ground,mark:r.line,curb:r.curb,far:l.far,near:l.near,roadPart:r,skyPart:sk,atmosphere:env.atmosphere,scenery:env.scenery,tag:l.profile,env};
      const s=sceneStyle;
      C[0]=s.ink;C[1]=s.road;C[2]=s.ground;C[3]=s.mark;
      const lowLight=['rain','fog','blizzard'].includes(weather);
      const grad=ctx.createLinearGradient(0,0,0,92);
      grad.addColorStop(0,lowLight?'#415667':sk.top);grad.addColorStop(1,sk.bottom);
      ctx.fillStyle=grad;ctx.fillRect(0,0,480,92);
      if(sk.celestial==='stars'||sk.celestial==='earth'||sk.celestial==='planet'||sk.celestial==='moon'){
        for(let i=0;i<54;i++){const x=(i*139+17)%480,y=(i*47+11)%76;rect(x,y,i%7===0?2:1,1,i%3?'#c2dbe9':'#ecdfbd');}
      }
      if(sk.celestial==='sun'||sk.celestial==='moon'||sk.celestial==='planet'||sk.celestial==='earth'){
        const sizes={sun:14,moon:9,planet:19,earth:18};
        const cx=399,cy=24,rad=sizes[sk.celestial];
        ctx.fillStyle=sk.light;ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.fill();
        if(sk.celestial==='earth'){ctx.fillStyle='#5287a3';ctx.beginPath();ctx.ellipse(cx+3,cy+3,7,13,.6,0,Math.PI*2);ctx.fill();}
        if(sk.celestial==='planet'){ctx.strokeStyle='#efcaa6';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(cx,cy,28,8,-.4,0,Math.PI*2);ctx.stroke();}
      }
      if(sk.celestial==='rays')for(let i=0;i<5;i++)poly([[i*100-20,0],[i*100+8,0],[i*100+55,92],[i*100+2,92]],'rgba(142,245,246,.08)');
      if(!['stars','earth','rays'].includes(sk.celestial)&&!lowLight)for(let i=0;i<3;i++){
        const x=34+i*161,y=21+(i%2)*8;
        rect(x,y,43,5,sk.cloud);rect(x+10,y-5,24,5,sk.cloud);
      }
      // Only colour changes with depth: retain the flat ground and world layout.
      const groundWash=ctx.createLinearGradient(0,P.HORIZON,0,270);
      groundWash.addColorStop(0,depthTone(s.ground,.14));
      groundWash.addColorStop(.38,s.ground);
      groundWash.addColorStop(1,depthTone(s.ground,-.13));
      ctx.fillStyle=groundWash;ctx.fillRect(0,P.HORIZON,480,188);
      // Far skyline is effectively stationary as the car drives forward,
      // but moves gently when the camera takes a side route.
      ctx.save();ctx.translate(-cameraLane*1.25,0);
      landscapeBack(env);
      ctx.restore();
      if(s.atmosphere.overlay){ctx.fillStyle=s.atmosphere.overlay;ctx.fillRect(0,0,480,96);}
      // Track the exact chosen visual pieces for DEV tests and human review.
      canvas.dataset.environmentId=env.id;
      canvas.dataset.environmentComponents=JSON.stringify(env.components);
      return env;
    }
    function roadside(type,x,y,sc,side,idx){
      const s=sceneStyle,ink=s.ink,near=s.near,mark=s.mark;
      const pole=(height=35)=>{rect(x-sc,y-height*sc,2*sc,height*sc,ink);};
      const plate=(w=19,h=9,col=near)=>rect(x-w/2*sc,y-(h+24)*sc,w*sc,h*sc,col);
      switch(type){
        case 'pines':pine(x,y,52*sc,ink);break;
        case 'palms':palm(x,y,sc);break;
        case 'cactus':pole(26);rect(x-8*sc,y-18*sc,8*sc,5*sc,'#487b52');rect(x+1*sc,y-16*sc,7*sc,5*sc,'#487b52');break;
        case 'ferns':case 'vines':palm(x,y,.8*sc);break;
        case 'snowbanks':poly([[x-15*sc,y],[x-8*sc,y-11*sc],[x+12*sc,y-8*sc],[x+18*sc,y]],'#eff5ef');break;
        case 'crystals':poly([[x-12*sc,y],[x-6*sc,y-30*sc],[x+1*sc,y-15*sc],[x+6*sc,y-41*sc],[x+15*sc,y]],'#90d7e6');break;
        case 'guardrails':rect(x-14*sc,y-12*sc,28*sc,5*sc,'#e1ded2');pole(10);break;
        case 'boulders':{
          // Faceted rock, small shaded face, and scrub; no generic box sprite.
          poly([[x-17*sc,y],[x-12*sc,y-11*sc],[x-4*sc,y-19*sc],[x+9*sc,y-16*sc],[x+18*sc,y-7*sc],[x+19*sc,y]],'#6f685a');
          poly([[x-12*sc,y-11*sc],[x-4*sc,y-19*sc],[x+4*sc,y-11*sc],[x+1*sc,y]],'#b3a18a');
          poly([[x+4*sc,y-11*sc],[x+9*sc,y-16*sc],[x+18*sc,y-7*sc],[x+19*sc,y]],'#8a7966');
          if(idx%3===0){line(x-17*sc,y,x-20*sc,y-10*sc,'#6b7959',Math.max(1,sc));line(x-17*sc,y-4*sc,x-12*sc,y-10*sc,'#71845f',Math.max(1,sc));}
          break;
        }
        case 'wrecks':{
          // Wrecks are recognisably *abandoned* vehicles, pushed to shoulders;
          // they never masquerade as a moving rival or enter the race ribbon.
          const paint=['#a96855','#9b9b82','#647f82','#c59b65'][Math.abs(idx)%4];
          poly([[x-19*sc,y-5*sc],[x-14*sc,y-16*sc],[x-4*sc,y-21*sc],[x+10*sc,y-19*sc],[x+17*sc,y-8*sc],[x+20*sc,y-4*sc]],paint);
          poly([[x-9*sc,y-18*sc],[x+4*sc,y-18*sc],[x+11*sc,y-11*sc],[x-12*sc,y-11*sc]],'#364d50');
          poly([[x+3*sc,y-17*sc],[x+11*sc,y-11*sc],[x+2*sc,y-12*sc]],'#b4c6ba');
          rect(x-20*sc,y-7*sc,37*sc,3*sc,'#4b5553');
          for(const wheel of [-11,11]){
            ctx.fillStyle='#333a3e';ctx.beginPath();ctx.ellipse(x+wheel*sc,y-3*sc,4*sc,4*sc,0,0,Math.PI*2);ctx.fill();
            rect(x+(wheel-1)*sc,y-5*sc,2*sc,2*sc,'#a2a8a2');
          }
          line(x-16*sc,y-15*sc,x-24*sc,y-18*sc,'#747875',Math.max(.8,sc));
          if(idx%3===0){rect(x+20*sc,y-2*sc,5*sc,2*sc,'#b8a88b');rect(x-25*sc,y-1*sc,4*sc,2*sc,'#8c938e');}
          break;
        }
        case 'ruins':case 'scrap':case 'spikes':
          poly([[x-16*sc,y],[x-12*sc,y-18*sc],[x+4*sc,y-13*sc],[x+17*sc,y]],near);
          if(type==='spikes')for(let j=-1;j<=1;j++)poly([[x+j*8*sc,y-11*sc],[x+(j*8+4)*sc,y-27*sc],[x+(j*8+8)*sc,y-11*sc]],ink);
          if(type==='wrecks')rect(x-9*sc,y-10*sc,20*sc,8*sc,'#a45141');break;
        case 'lava':
          poly([[x-15*sc,y],[x-8*sc,y-15*sc],[x+11*sc,y-13*sc],[x+17*sc,y]],ink);
          rect(x-5*sc,y-4*sc,12*sc,3*sc,'#f48b43');break;
        case 'reeds':case 'grass':
          for(let j=-2;j<=2;j++)line(x+j*6*sc,y,x+(j*6+2)*sc,y-(type==='grass'?76:32)*sc,'#497a54',Math.max(.8,sc));break;
        case 'neon':plate(25,18,'#343455');rect(x-9*sc,y-38*sc,18*sc,3*sc,'#ed75d8');pole(35);break;
        case 'coral':
          for(let j=-1;j<=1;j++){line(x,y,x+j*10*sc,y-23*sc,j===0?'#ed9586':'#70d6be',3*sc);line(x+j*10*sc,y-23*sc,x+j*13*sc,y-33*sc,'#ed9586',2*sc);}break;
        case 'toys':
          rect(x-12*sc,y-26*sc,24*sc,26*sc,idx%2?'#df6655':'#6494c2');rect(x-8*sc,y-22*sc,5*sc,5*sc,'#f3d47a');break;
        case 'mushrooms':pole(22);ctx.fillStyle='#d986cf';ctx.beginPath();ctx.ellipse(x,y-24*sc,17*sc,10*sc,0,Math.PI,Math.PI*2);ctx.fill();break;
        case 'gravestones':rect(x-8*sc,y-19*sc,16*sc,19*sc,'#7c8e90');rect(x-4*sc,y-15*sc,8*sc,2*sc,'#283e4b');break;
        case 'lunar':pole(37);plate(17,7,'#e2e8e5');break;
        case 'starting':{
          // The start-light tree exists only at the launch line. Beyond it,
          // lightweight distance boards replace identical repeated trees.
          if(idx!==0){
            pole(22);rect(x-8*sc,y-26*sc,16*sc,10*sc,'#d7d5c6');
            rect(x-7*sc,y-24*sc,14*sc,2*sc,'#d2a65e');
            if(sc>.7){ctx.fillStyle='#3e5258';ctx.font=`bold ${Math.max(5,6*sc)}px monospace`;ctx.fillText(`${Math.abs(idx)*50}`,x-7*sc,y-18*sc);}
            break;
          }
          pole(43);rect(x-7*sc,y-40*sc,14*sc,30*sc,'#344851');
          rect(x-9*sc,y-41*sc,18*sc,3*sc,'#e7c66c');
          for(let k=0;k<5;k++){
            const cx=x+(k%2?-3:3)*sc,cy=y-(35-k*5)*sc;
            ctx.fillStyle=k<3?'#f1b75e':k===3?'#79b98c':'#cb6959';
            ctx.beginPath();ctx.arc(cx,cy,2.6*sc,0,Math.PI*2);ctx.fill();
          }
          rect(x-9*sc,y-10*sc,18*sc,3*sc,'#e5d5ab');
          break;
        }
        case 'cones':{
          // Runway threshold marker with a detachable beacon, alternating
          // with classic striped cones. Both stay in world projection.
          if(idx%3===0){
            rect(x-8*sc,y-6*sc,16*sc,6*sc,'#53696d');
            rect(x-6*sc,y-12*sc,12*sc,8*sc,'#d6b76b');
            rect(x-2*sc,y-15*sc,4*sc,4*sc,'#fff0c6');
          }else{
            poly([[x-7*sc,y],[x,y-21*sc],[x+7*sc,y]],'#db8857');
            rect(x-5*sc,y-8*sc,10*sc,4*sc,'#f8f0dd');
            rect(x-9*sc,y-2*sc,18*sc,3*sc,'#535f64');
          }
          break;
        }
        case 'tyres':{
          // Club-racing stacks, two courses tall with painted safety centres.
          rect(x-19*sc,y-14*sc,40*sc,13*sc,'#536d67');
          for(let tier=0;tier<2;tier++)for(let j=0;j<4;j++){
            const tx=x+(j-1.5)*10*sc,ty=y-(4+tier*8)*sc;
            ctx.fillStyle='#26383a';ctx.beginPath();ctx.ellipse(tx,ty,5.8*sc,4.9*sc,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=(j+tier)%3===0?'#e8d7b6':'#a95d51';ctx.beginPath();ctx.ellipse(tx,ty,2.1*sc,1.9*sc,0,0,Math.PI*2);ctx.fill();
          }
          break;
        }
        case 'pits':{
          // True one-sided pit lane: repeated PIT boards on both verges made
          // the scene look like a row of identical roadside kiosks.
          if(side<0){
            if(idx%6===0){pole(32);plate(25,11,'#d9bb6f');
              if(sc>.57){ctx.fillStyle='#30474d';ctx.font=`bold ${Math.max(5,7*sc)}px monospace`;ctx.fillText('PIT',x-8*sc,y-27*sc);}
            }else{
              rect(x-13*sc,y-6*sc,26*sc,5*sc,idx%2?'#cb6b5c':'#e9e8d9');
              rect(x-12*sc,y-5*sc,24*sc,1.5*sc,'#5c6a6a');
            }
          }else{
            pole(30);rect(x-3*sc,y-31*sc,6*sc,5*sc,'#d5c7a9');
            if(idx%3===0)plate(16,8,'#b9c4bc');
          }
          break;
        }
        case 'rally':{
          // Measured course-marker posts and safety tape with recognisable
          // striped check flags, anchored in the same roadside depth system.
          pole(33);rect(x-10*sc,y-37*sc,21*sc,14*sc,idx%2?'#dfc27c':'#e0dbce');
          for(let j=0;j<4;j++)rect(x+(-9+j*5)*sc,y-(36+(j%2)*3)*sc,5*sc,4*sc,j%2?'#d15e50':'#44625e');
          rect(x-7*sc,y-19*sc,14*sc,3*sc,'#465f60');
          if(idx%3===0)line(x+9*sc,y-20*sc,x+20*sc,y-14*sc,'#e9d6b0',Math.max(.7,sc));
          break;
        }
        case 'banners':case 'utopia':case 'beacons':
          pole(36);plate(18,11,type==='utopia'?'#b4e7dd':type==='beacons'?'#6b9ac1':'#e9bc71');break;
        case 'shops':{
          // A readable 3/4 street shop with wall depth, display windows,
          // painted awning and a storefront sign, anchored at pavement level.
          const facade=['#ba8c76','#a5a18c','#b29d90','#8fa39b'][Math.abs(idx)%4];
          const trim=['#ca6e58','#e1b76e','#699d95','#b68175'][Math.abs(idx)%4];
          const back=side<0?13:-13,front=side<0?-15:15;
          // Large front-facing sign plus a receding roof/side wall, not an
          // isolated kiosk pasted onto a featureless shoulder.
          poly([[x-19*sc,y],[x-19*sc,y-37*sc],[x+17*sc,y-37*sc],[x+17*sc,y]],facade);
          poly([[x+17*sc,y-37*sc],[x+(17+back)*sc,y-46*sc],[x+(17+back)*sc,y-9*sc],[x+17*sc,y]],'#68777a');
          poly([[x-20*sc,y-38*sc],[x+17*sc,y-38*sc],[x+(17+back)*sc,y-47*sc],[x+(-20+back)*sc,y-47*sc]],'#706b66');
          rect(x-21*sc,y-28*sc,39*sc,8*sc,trim);
          poly([[x-21*sc,y-20*sc],[x+18*sc,y-20*sc],[x+(18+back*.45)*sc,y-16*sc],[x+(-21+back*.45)*sc,y-16*sc]],'#e8d8b9');
          for(let j=0;j<4;j++)rect(x+(-16+j*9)*sc,y-25*sc,5*sc,4*sc,'#f3e5c7');
          rect(x-18*sc,y-17*sc,36*sc,4*sc,depthTone(facade,-.30));
          rect(x-15*sc,y-17*sc,11*sc,15*sc,'#8bb6b6');rect(x+3*sc,y-17*sc,10*sc,15*sc,'#8bb6b6');
          rect(x+0*sc,y-17*sc,3*sc,17*sc,'#4b5f62');
          rect(x-19*sc,y-2*sc,40*sc,3*sc,'#626c69');
          line(x-18*sc,y-37*sc,x+15*sc,y-37*sc,depthTone(facade,.28),Math.max(1,sc));
          if(sc>.73){ctx.fillStyle='#f6e8ca';ctx.font=`bold ${Math.max(5,6*sc)}px monospace`;ctx.fillText(['CAFE','TYRES','PARTS','TOOLS'][Math.abs(idx)%4],x-14*sc,y-22*sc);}
          break;
        }
        case 'pipes':case 'drains':case 'cranes':
          pole(39);rect(x-12*sc,y-40*sc,27*sc,4*sc,ink);if(type==='cranes')line(x+14*sc,y-40*sc,x+14*sc,y-14*sc,ink,sc);break;
        case 'bunkers':rect(x-14*sc,y-15*sc,29*sc,15*sc,ink);rect(x-9*sc,y-12*sc,18*sc,3*sc,'#b1b8b2');break;
        case 'lamps':{
          pole(45);
          rect(x-2*sc,y-45*sc,20*sc,2.5*sc,ink);
          rect(x+11*sc,y-44*sc,9*sc,5*sc,'#e4c785');
          rect(x-1*sc,y-8*sc,5*sc,4*sc,'#6c7775');
          break;
        }
        default:pole(37);rect(x-10*sc,y-37*sc,19*sc,4*sc,mark);break;
      }
    }
    const DETAILS_SCENERY=new Set(['pines','grass','ferns','vines','reeds','cactus','boulders','scrap','snowbanks','crystals','ruins','wrecks','spikes']);
    function drawGroundContact(type,point,scale,serial,side){
      // Shadows and nearby loose material share an anchor with the tree,
      // sign or prop. Without this, silhouettes float on blank ground.
      const dark=sceneStyle.ink,shoulder=sceneStyle.roadPart.shoulder;
      if(point.y<84||point.y>283||point.x<-55||point.x>535)return;
      const oldAlpha=ctx.globalAlpha;
      ctx.globalAlpha=oldAlpha*.16;
      ctx.fillStyle=dark;ctx.beginPath();
      ctx.ellipse(point.x+side*2*scale,point.y+1,Math.max(1,10*scale),Math.max(.5,2.3*scale),0,0,Math.PI*2);ctx.fill();
      if(DETAILS_SCENERY.has(type)&&scale>.42){
        const t=hashUnit(serial*53+(side<0?11:41));
        ctx.globalAlpha=oldAlpha*.40;
        const px=point.x+side*9*scale;
        line(px,point.y-1,px+(t-.5)*7*scale,point.y-4*scale,shoulder,Math.max(.7,scale));
      }
      ctx.globalAlpha=oldAlpha;
    }
    function roadwayGrain(project,time,roadPart,roadId){
      // Restrained world-anchored texture, stronger on rough roads. Each speck
      // advances through the same P.project transformation as the road.
      const dense=['gravel','dirt','mud','sand','snow','ice','broken','lunar','volcanic'].includes(roadId);
      const count=dense?24:10,spacing=1.65;
      const d=Math.max(0,time)*WORLD_UNITS_PER_MS;
      const cycle=Math.floor(d/spacing),phase=d%spacing;
      const oldAlpha=ctx.globalAlpha;ctx.globalAlpha*=dense?.20:.10;
      for(let i=0;i<count;i++){
        const serial=cycle+i,seed=serial*151+23;
        const z=(i+1)*spacing-phase;
        if(z<1.3||z>44)continue;
        const lane=(hashUnit(seed)*2-1)*3.1,pt=project(lane,z);
        const w=Math.max(.65,(dense?8:5)/z),h=Math.max(.55,(dense?3.1:2)/z);
        rect(pt.x-w/2,pt.y-h/2,w,h,hashUnit(seed+47)>.5?roadPart.line:roadPart.edge);
      }
      ctx.globalAlpha=oldAlpha;
    }
    function road(time,track,cameraLane=0){
      const project=(lane,z)=>P.project(lane-cameraLane,z);
      const s=sceneStyle,r=s.roadPart,distance=Math.max(0,time)*WORLD_UNITS_PER_MS;
      const travel=distance%1.8;
      // All geometry uses the same horizon and world projection; no floating
      // CSS strips or independently moving roadside objects.
      const ribbon=(lane,depth)=>project(lane,depth);
      const quad=(half)=>{
        const a=ribbon(-half,.72),b=ribbon(half,.72),c=ribbon(half,160),d=ribbon(-half,160);
        return [[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]];
      };
      // Subtle shoulder material grounds the roadside without obscuring the
      // clean ribbon. Physical surface and traction never change here.
      ctx.save();ctx.globalAlpha=.24;poly(quad(5.6),r.shoulder);ctx.restore();
      poly(quad(4.35),r.edge);
      poly(quad(3.95),r.fill);
      if(s.env.components.road==='streets'){
        // Pavements are road-relative rather than fixed screen strips.
        // High-street storefronts occupy the outer pavement; the generic
        // downtown layout keeps its original narrower kerb and shoulders.
        for(const side of [-1,1]){
          const strip=(inner,outer)=>{
            const a=project(side*inner,.72),b=project(side*outer,.72),
              c=project(side*outer,160),d=project(side*inner,160);
            return [[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]];
          };
          const highStreet=s.tag==='suburb';
          poly(strip(4.05,highStreet?7.12:4.55),highStreet?'#b2aaa0':'#9faaa4');
          if(highStreet){
            // A continuous facade line prevents little shop islands appearing
            // to float on the ground; slab joints recede with world depth.
            const outerA=project(side*6.93,.72),outerB=project(side*6.93,140);
            line(outerA.x,outerA.y,outerB.x,outerB.y,'#817e78',1.6);
          }
          for(let i=2;i<19;i+=2){
            const z=i*1.85+1.85-(distance%1.85),a=project(side*4.09,z),b=project(side*(highStreet?7.0:4.53),z);
            line(a.x,a.y,b.x,b.y,'#858883',Math.max(.7,2.5/z));
          }
        }
      }
      if(s.tag==='grandprix'){
        // One continuous pit-side safety wall follows the same perspective as
        // the road. Other side belongs to spectators, not a second pit lane.
        for(let i=24;i>=0;i--){
          const far=(i+1)*2.2+.8,near=i*2.2+.8;
          const a=project(-4.72,near),b=project(-4.72,far);
          const nearHeight=Math.min(16,30/near),farHeight=Math.min(16,30/far);
          poly([[a.x,a.y],[b.x,b.y],[b.x,b.y-farHeight],[a.x,a.y-nearHeight]],
            i%6===0?'#ba6a62':'#b7c2bd');
          line(a.x,a.y-nearHeight,b.x,b.y-farHeight,'#e4e6d7',Math.max(.8,2/near));
        }
      }
      roadwayGrain(project,time,r,s.env.components.road);
      for(let i=28;i>=0;i--){
        const z=i*1.8+1.8-travel;if(z<.66)continue;
        const near=Math.max(.66,z-.67),far=z;
        if(r.markings==='dashes'||r.markings==='double'||r.markings==='drag'||r.markings==='runway'){
          const lanes=r.markings==='drag'?[-1.8,1.8]:r.markings==='runway'?[-1.5,0,1.5]:[-1.2,1.2];
          for(const lane of lanes){
            if(r.markings==='dashes'&&i%2)continue;
            const a=project(lane-.045,far),b=project(lane+.045,far),c=project(lane+.045,near),d=project(lane-.045,near);
            poly([[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]],r.line);
          }
        } else if(r.markings==='tracks'){
          for(const lane of [-1.2,1.2]){
            const a=project(lane,far),b=project(lane,near);
            line(a.x,a.y,b.x,b.y,r.line,Math.max(1,2/far));
          }
        } else if(r.markings==='cobble'||r.markings==='metal'||r.markings==='cracks'){
          if(i%2===0){const a=project(-2.6,far),b=project(2.6,far);line(a.x,a.y,b.x,b.y,r.line,Math.max(.5,2/far));}
        }
        for(const side of [-1,1]){
          const a=project(side*3.62,far),b=project(side*3.87,far),c=project(side*3.87,near),d=project(side*3.62,near);
          const stripe=['grandprix','drag','circuit'].includes(s.env.components.road)&&i%2===0;
          poly([[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]],stripe?'#eee7d9':r.curb);
          const p=project(side*4.28,z),h=24/z,w=Math.max(1,3/z);
          if(p.y<285){rect(p.x-w/2,p.y-h,w,h,s.ink);rect(p.x-w/2,p.y-h,w,h*.25,s.mark);}
        }
      }
      for(const side of [-1,1]){
        const a=project(side*4.15,24),b=project(side*4.15,.7);
        line(a.x,a.y-1,b.x,b.y-16,r.edge,2);line(a.x,a.y+1,b.x,b.y-10,r.curb,2);
      }
      // Street is a connected frontage behind the pavement, not prop houses.
      if(s.tag==='suburb')drawStreetFrontage(time,cameraLane);
      // Procedural, repeatable roadside progression. Prop serial and size
      // remain stable from distant to near frames, and left/right are no longer
      // a mirrored pair of identical objects every 4 world units.
      for(const side of [-1,1]){
        if(s.tag==='suburb')continue;
        const objects=groundSamples(time,side);
        for(let i=objects.length-1;i>=0;i--){
          const item=objects[i],z=item.z;if(z<1.3)continue;
          const pt=project(item.lane,z),scale=Math.min(2.05,(3.65/z)*item.size);
          if(pt.y>279||pt.x<-65||pt.x>545)continue;
          drawGroundContact(s.scenery,pt,scale,item.serial,side);
          const oldAlpha=ctx.globalAlpha;
          ctx.globalAlpha*=z>32?.76:z>23?.90:1;
          roadside(s.scenery,pt.x,pt.y,scale,side,item.serial);
          ctx.globalAlpha=oldAlpha;
        }
      }
      if(s.tag==='underwater'){
        for(const x of [8,470])line(x,0,x,270,'rgba(118,215,212,.25)',7);
        for(let i=0;i<5;i++){
          const y=23+i*22;
          ctx.strokeStyle='rgba(126,223,224,.30)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(240,99,190+i*12,70+i*18,0,Math.PI,Math.PI*2);ctx.stroke();
        }
      }
      canvas.dataset.roadWorldDistance=String(Number(distance.toFixed(4)));
      canvas.dataset.roadsideFirstSerial=String(Math.floor(distance/4.2));
    }
    function streetLots(distance,side){
      const buildingWidth=3.8,gaps=[4,6,5,7,4.5,6.5,5.5,7];
      const houseCounts=[4,6,5,7,5,4,7,6];
      const housesPerCycle=houseCounts.reduce((a,b)=>a+b,0);
      const period=gaps.reduce((n,g,i)=>n+g+houseCounts[i]*buildingWidth,0);
      const cycle=Math.floor(distance/period),lots=[];
      for(let c=cycle-1;c<=cycle+1;c++){
        let cursor=c*period;
        for(let block=0;block<gaps.length;block++){
          const width=gaps[(block+(side<0?0:3))%gaps.length];
          const count=houseCounts[block];
          const serialStart=c*housesPerCycle+houseCounts.slice(0,block).reduce((a,b)=>a+b,0);
          for(let house=0;house<count;house++){
            const gap=house===0?width:0,near=cursor-distance;
            const buildingNear=near+gap,far=buildingNear+buildingWidth;
            if(far>.55&&near<72)lots.push({serial:serialStart+house,near,buildingNear,far,gap,span:buildingWidth});
            cursor+=gap+buildingWidth;
          }
        }
      }
      return lots.sort((a,b)=>b.near-a.near);
    }
    function drawStreetFrontage(time,cameraLane){
      const distance=Math.max(0,time)*WORLD_UNITS_PER_MS;
      const paint=['#c08c79','#94aeb0','#d0ae8d','#99a4b6','#b58e91','#afad97'];
      const awning=['#c66e5e','#4f938b','#d2a35f','#8398b2'];
      const glazing=['#a5c2c0','#d0c2aa','#a9bbca'];
      function gapFurniture(lot,side,seed){
        // Single roadside landmark per occasional group gap. All positions
        // derive from lot distance, so scenery moves with the road, never HUD.
        if(!lot.gap||seed%2!==0)return;
        const z=lot.near+lot.gap*.55;
        if(z<2.8||z>43)return;
        const base=P.project(side*5.45-cameraLane,z),sc=Math.min(1.65,4.3/z);
        if(base.x<3||base.x>477||base.y>272)return;
        const x=base.x,y=base.y;
        if(seed%6===0){
          // A streetlamp with clear silhouette but minimal road intrusion.
          const height=30*sc;
          line(x,y,x,y-height,'#354e57',Math.max(1,2*sc));
          rect(x-4*sc,y-height-2*sc,8*sc,3*sc,'#344952');
          rect(x-3*sc,y-height,6*sc,2*sc,'#f4dfab');
        }else if(seed%6===2){
          // A tiny planter/tree, not a towering foreground prop.
          rect(x-1.2*sc,y-10*sc,2.4*sc,10*sc,'#675b4a');
          poly([[x-9*sc,y-11*sc],[x-7*sc,y-24*sc],
            [x,y-29*sc],[x+8*sc,y-24*sc],[x+10*sc,y-11*sc]],
            '#638969');
          poly([[x,y-28*sc],[x+8*sc,y-24*sc],[x+10*sc,y-11*sc],
            [x+2*sc,y-11*sc]],'#43755f');
          rect(x-7*sc,y-3*sc,14*sc,3*sc,'#9c8779');
        }else{
          // Waste bin / pavement fixture with a grounded base.
          rect(x-5*sc,y-11*sc,10*sc,10*sc,'#50766e');
          rect(x-6*sc,y-11*sc,12*sc,2.5*sc,'#314f52');
          rect(x-4*sc,y-1.5*sc,8*sc,1.5*sc,'#746f68');
        }
      }
      for(const side of [-1,1])for(const lot of streetLots(distance,side)){
        const {serial,near,buildingNear,far,gap,span}=lot;
        const seed=Math.abs(serial*17+(side<0?3:9));
        const n=Math.max(.55,buildingNear),f=far,lane=side*7.55;
        const h=2.85+(seed%6)*.25,col=paint[seed%paint.length],motif=Math.floor(seed/3)%4;
        const p=(z,y=0,outer=0)=>{const q=P.project(lane+side*outer-cameraLane,z);return[q.x,q.y-y*60/z];};
        // Same lot widths, world-space positions and natural clipping as before.
        const panel=(z0,z1,y0,y1,c)=>poly([p(z0,y0),p(z1,y0),p(z1,y1),p(z0,y1)],c);
        if(gap&&near+gap>.55){const a=Math.max(.55,near),b=near+gap;
          poly([p(a,0),p(b,0),p(b,0,2.1),p(a,0,2.1)],'#778078');
        }
        panel(n,f,0,h,col);
        // Chunky foundation and cornice shading give these blocks depth.
        panel(n,f,0,.20,depthTone(col,-.32));
        panel(n,f,h-.17,h,depthTone(col,.29));
        if(motif===0)panel(n+.12,f-.12,h,h+.30,depthTone(col,-.29));
        if(motif===1)poly([p(n,h),p(f,h),p((n+f)/2,h+.45)],'#746e70');
        if(motif===2)panel(n,f,h-.24,h,depthTone(col,-.17));
        if(motif===3)panel(n+.22,f-.22,h,h+.12,depthTone(col,-.27));
        // Side return connects facade to a believable building volume.
        if(buildingNear>.55){
          poly([p(n,0),p(n,h),p(n,h,gap?1.10:.24),p(n,0,gap?1.10:.24)],depthTone(col,-.28));
          if(gap)poly([p(n,h),p(n,h+.09),p(n,h+.09,1.1),p(n,h,1.1)],depthTone(col,-.16));
        }
        const centers=motif===2?[.30,.72]:[.24,.68];
        for(const ratio of centers){
          const z=buildingNear+span*ratio;if(z-.34<n)continue;
          const w=motif===2?.29:.23;
          panel(z-w-.03,z+w+.03,h-1.50,h-.42,'#425c67');
          panel(z-w,z+w,h-1.40,h-.52,glazing[seed%3]);
          panel(z-.022,z+.022,h-1.40,h-.52,depthTone(col,-.27));
          panel(z-w-.04,z+w+.04,h-1.52,h-1.47,depthTone(col,.23));
          if(motif===1&&seed%4===1)panel(z-w-.04,z+w+.04,h-1.57,h-1.52,'#587c64');
        }
        if(motif===2){
          // Workshop: broad shutter instead of a row of generic shop windows.
          panel(n+.34,f-.34,.15,1.35,'#506973');
          for(let k=0;k<4;k++)panel(n+.36,f-.36,.37+k*.20,.41+k*.20,'#8da3a1');
          panel(n+.24,f-.24,1.36,1.47,'#d0b477');
        }else{
          // Shaded projecting canopy and colour band; deliberately bold at 480px.
          const color=awning[seed%awning.length];
          panel(n,f,1.14,1.32,color);
          poly([p(n,1.33),p(f,1.33),p(f,1.22,-.54),p(n,1.22,-.54)],
            depthTone(color,.19));
          panel(n,f,1.06,1.14,depthTone(color,-.27));
          const door=buildingNear+span*.51;
          if(door-.13>.55)panel(door-.13,door+.13,.12,1.07,'#3b585e');
          if(motif===3){
            panel(n+.32,f-.32,.36,.97,'#47666e');
            panel(n+.36,f-.36,.42,.91,glazing[(seed+1)%3]);
          }
        }
        gapFurniture(lot,side,seed);
      }
    }
    function weatherFX(weather,time,motion) {
      // Reusable weather particles; fallback retains old behaviour if module is absent.
      if(window.ScrapEventEffects){window.ScrapEventEffects.renderWeather(ctx,{weather,time,motion});return;}
      if(weather==='rain')for(let i=0;i<50;i++){const x=(i*83+17)%480;const y=(i*37+(motion?time*.075:0))%270;line(x,y,x-2,y+5,C[3]);}
    }
    let eventProjection=P.project,eventWorldRate=WORLD_UNITS_PER_MS;
    function hazardFX(event,time,variant="normal",motion=true,anchorX=null,rivalAnchor=null,layer="all",actorAnchor=null,shortcutMode="preview",portalMode="preview",portalOutcome="success") {
      // Portal choices keep their own presentation state. A declined portal
      // never swallows the car; all effects are purely visual.
      if(window.ScrapEventPortals?.recipe(event)){
        window.ScrapEventPortals.render(ctx,{id:event,elapsedMs:time,variant,motion,
          mode:portalMode,outcome:portalOutcome,layer:layer==='under'?'under':'over',project:eventProjection});
        return;
      }
      // v0.7.22: cumulative, stage-specific catastrophe visuals. A stage only
      // renders when the deterministic event chain really reaches that stage.
      if(window.ScrapEventMultistage?.recipe(event)){
        window.ScrapEventMultistage.render(ctx,{id:event,elapsedMs:time,variant,motion,
          layer:layer==='under'?'under':'over',project:eventProjection,worldUnitsPerMs:eventWorldRate});
        return;
      }
      // v0.7.21c: clones and mirror copies are presentation-only fake passes.
      if(window.ScrapEventClones?.recipe(event)){
        window.ScrapEventClones.render(ctx,{id:event,elapsedMs:time,variant,motion,
          layer:layer==='under'?'under':'over',project:eventProjection,rivalAnchor});
        return;
      }
      // v0.7.21b: ghost/fake-pass and shadow removal effects are visual only.
      if(window.ScrapEventGhosts?.recipe(event)){
        window.ScrapEventGhosts.render(ctx,{id:event,elapsedMs:time,variant,motion,
          layer:layer==='under'?'under':'over',project:eventProjection,rivalAnchor});
        return;
      }
      // v0.7.20: energy effects live in a separate deterministic visual layer.
      // Crater/storm retain their original terrain/weather and gain a modest overlay.
      const energy=window.ScrapEventEnergy;
      if(energy?.recipe(event)&&event!=='storm-3'){
        energy.render(ctx,{id:event,elapsedMs:time,variant,motion,layer:layer==='under'?'under':'over',project:eventProjection,rivalAnchor});
        return;
      }
      // Atmospheric and surface recipes take precedence over the old one-off sprites.
      if(window.ScrapEventEffects?.render(ctx,{id:event,elapsedMs:time,variant,motion,layer:layer==='under'?'under':'over',project:eventProjection,shortcutMode})){
        if(event==='storm-3')energy?.render(ctx,{id:event,elapsedMs:time,variant,motion,layer:layer==='under'?'under':'over',project:eventProjection,rivalAnchor});
        return;
      }
      // Composed timelines take precedence; legacy visuals remain a fallback.
      if(window.ScrapEventMotion?.render(ctx,{id:event,elapsedMs:time,variant,motion,anchorX,rivalAnchor,actorAnchor,layer,project:eventProjection}))return;
      const rare=variant==="rare";
      if(event==='meteor') {
        for(let i=0;i<3;i++){const x=83+i*157+Math.floor((time*.018)%30),y=38+i*13;line(x+31,y-26,x,y,C[0],4);line(x+25,y-22,x+1,y,C[3],2);rect(x-3,y-2,8,7,C[0]);rect(x-1,y,3,3,C[3]);}
        if(rare) { // An enormous, entirely cosmetic near-miss.
          const y=28+Math.min(105,time*.024),x=280-y*.18;
          poly([[x-24,y-32],[x+7,y-14],[x+17,y],[x-12,y+8],[x-34,y-5]],C[0]);
          poly([[x-18,y-26],[x+4,y-12],[x+6,y-2],[x-14,y+3]],C[3]);
          line(x+35,y-64,x-10,y-12,C[2],6);
          if(time>1750){for(let i=0;i<4;i++){const extent=11+i*10+(time*.01)%12;line(x-extent,150+i*6,x+extent,150+i*6,i%2?C[2]:C[3],3);}}
        }
      } else if(event==='ducks'||event==='snail') {
        const x=208+Math.sin(time*.001)*8,y=115;
        if(event==='ducks'){
          for(let i=0;i<4;i++){rect(x+i*13,y+2,8,4,C[3]);rect(x+6+i*13,y-2,3,6,C[3]);rect(x+9+i*13,y,3,1,C[0]);}
          if(rare){ // Marching picket line, with a crown on the lead duck.
            const m=170+time*.016;
            for(let i=0;i<5;i++){const a=m+i*18;rect(a,153,12,6,C[0]);rect(a+7,146,5,9,C[3]);rect(a+12,149,4,2,C[0]);}
            rect(m+81,139,3,18,C[0]);rect(m+83,138,27,10,C[3]);rect(m+84,142,22,3,C[0]);
            rect(m+6,142,2,3,C[0]);rect(m+10,142,2,3,C[0]);rect(m+8,139,2,2,C[3]);
          }
        } else {
          rect(x,y,29,6,C[0]);rect(x+4,y-9,18,13,C[1]);rect(x+8,y-6,9,6,C[2]);line(x+25,y,x+29,y-8,C[0]);
          if(rare){rect(x-15,103,8,13,C[0]);rect(x-14,104,6,8,C[3]);rect(x-14,102,3,3,C[0]);
            rect(x-17,99,14,3,C[3]);rect(x+2,93,23,3,C[0]);rect(x+9,95,3,16,C[3]);}
        }
      } else if(event==='spring-trap') {
        const q=Math.min(1,time/900),lift=Math.sin(q*Math.PI);
        rect(190,150-10*lift,100,30,C[0]);rect(194,154-10*lift,92,22,C[2]);
        for(let i=0;i<4;i++){const y=178-i*8*lift;line(222+i*8,y,232+i*8,y-7*lift,C[3],3);line(232+i*8,y-7*lift,222+i*8,y-14*lift,C[3],3);}
      } else if(event==='duck-pass') {
        const m=145+(time*.11)%220;for(let i=0;i<5;i++){const x=m+i*17,y=158+i%2*4;rect(x,y,11,5,C[3]);rect(x+7,y-5,4,7,C[3]);rect(x+11,y-2,4,2,C[0]);}
      } else if(event==='goose-pass') {
        const x=120+(time*.16)%280,y=156;rect(x,y,22,8,C[3]);rect(x+15,y-14,7,17,C[3]);line(x+21,y-12,x+30,y-8,C[0],3);line(x+4,y+6,x,y+19,C[0],2);line(x+15,y+6,x+18,y+19,C[0],2);
      } else if(event==='boar-pass'||event==='bull-pass') {
        const x=105+(time*.14)%300,y=150,scale=event==='bull-pass'?1.25:1;rect(x,y,34*scale,16*scale,C[0]);rect(x+28*scale,y-8*scale,14*scale,14*scale,C[0]);line(x+6*scale,y+13*scale,x+2*scale,y+31*scale,C[0],3);line(x+28*scale,y+13*scale,x+32*scale,y+31*scale,C[0],3);if(event==='bull-pass'){line(x+36*scale,y-8*scale,x+48*scale,y-18*scale,C[3],3);line(x+34*scale,y-7*scale,x+24*scale,y-18*scale,C[3],3);}
      } else if(event==='cargo') {
        for(let i=0;i<8;i++){const x=165+(i*37)%150,y=121+(i*19)%66;rect(x,y,12,10,C[0]);rect(x+2,y+2,8,6,C[2]);line(x,y,x+12,y+10,C[3],1);}
      } else if(event==='pileup') {
        for(let i=0;i<4;i++){const x=165+i*45,y=152+(i%2)*14;rect(x,y,35,10,C[0]);rect(x+5,y-7,18,8,C[2]);rect(x+4,y+8,8,7,C[0]);rect(x+24,y+8,8,7,C[0]);}
      } else if(event==='grass') {
        for(let i=0;i<45;i++){const x=130+(i*29)%220,y=118+(i*17)%100;line(x,y,x-2+(i%5),y-10-(i%7),i%3?C[2]:C[3],2);}
      } else if(event==='sand') {
        for(let i=0;i<36;i++){const x=120+(i*53+Math.floor(time*.04))%250,y=115+(i*23)%105;rect(x,y,3+i%3,2,C[i%2?2:3]);}
        for(let i=0;i<3;i++){const y=135+i*22,hw=P.roadHalfWidth(y);line(240-hw*.65,y,240+hw*.65,y,C[2],3);}
      } else if(event==='snow') {
        for(let i=0;i<55;i++){const x=(i*71+Math.floor(time*.025))%480,y=92+(i*31)%145;rect(x,y,2+(i%2),2+(i%2),C[3]);}
        for(let i=0;i<3;i++){const y=139+i*19,hw=P.roadHalfWidth(y);rect(240-hw*.72,y,hw*1.44,5,C[3]);}
      } else if(event==='potholes') {
        for(let i=0;i<7;i++){const x=175+(i*43)%135,y=125+(i*29)%82;ctx.fillStyle=C[0];ctx.beginPath();ctx.ellipse(x,y,10+i%4,4+i%3,0,0,Math.PI*2);ctx.fill();}
      } else if(event==='roadworks') {
        for(let i=0;i<5;i++){const x=155+i*42,y=151+(i%2)*18;poly([[x,y],[x+5,y-14],[x+10,y]],C[3]);rect(x+2,y-7,6,4,C[0]);}
        rect(205,126,72,8,C[0]);for(let i=0;i<6;i++)rect(209+i*11,128,6,3,i%2?C[2]:C[3]);
      } else if(event==='downpour') {
        for(let i=0;i<100;i++){const x=(i*47+13)%480,y=(i*29+time*.16)%250;line(x,y,x-5,y+10,C[3],1);}
      } else if(event==='fog') {
        for(let i=0;i<8;i++){const y=90+i*20,x=((i*61+time*.018)%80)-40;rect(x,y,520,10,i%2?C[2]:C[3]);}
      } else if(event==='ice') {
        for(let i=0;i<6;i++){const y=124+i*13,hw=P.roadHalfWidth(y);line(240-hw*.6,y,240+hw*.6,y,C[3],2);if(i%2===0)line(220,y-4,244,y+5,C[2],1);}
      } else if(event==='deer'||event==='cow'||event==='sheep') {
        const herd=event==='sheep'?7:1;for(let i=0;i<herd;i++){const x=155+((time*.045+i*39)%205),y=145+(i%3)*12,scale=event==='cow'?1.35:event==='deer'?1.05:.75;
          rect(x,y,22*scale,8*scale,C[0]);rect(x+17*scale,y-7*scale,8*scale,8*scale,C[0]);
          line(x+4*scale,y+6*scale,x+2*scale,y+17*scale,C[0],2);line(x+17*scale,y+6*scale,x+19*scale,y+17*scale,C[0],2);
          if(event==='deer'){line(x+22*scale,y-7*scale,x+27*scale,y-15*scale,C[0],2);line(x+23*scale,y-7*scale,x+19*scale,y-15*scale,C[0],2);}
        }
      } else if(event==='ramp') {
        poly([[190,176],[286,176],[266,145],[214,145]],C[0]);poly([[199,171],[278,171],[260,151],[217,151]],C[2]);
      } else if(event==='bridge') {
        rect(120,148,110,14,C[2]);rect(287,148,110,14,C[2]);for(let i=0;i<4;i++)line(230+i*15,147,242+i*15,166,C[3],2);
      } else if(event==='heatwave') {
        for(let i=0;i<4;i++)rect(212+i*18,185-((time*.008+i*5)%29),4,9,C[2]);
      } else if(event==='debris') {
        for(let i=0;i<6;i++){const y=106+((time*.025+i*13)%49),x=215+(i*29)%57;rect(x,y,3+i%3,2+i%2,C[i%2]);}
        if(rare){const x=155+(time*.038)%174,y=164;rect(x,y,28,7,C[0]);for(const wx of [x+3,x+19]){rect(wx,y+6,8,13,C[0]);rect(wx+2,y+8,4,8,C[3]);}}
      } else if(event==='bins') {
        const offset=(time*.032)%140;
        for(let i=0;i<3;i++){const x=165+offset+i*24,y=152+i%2*11;
          rect(x,y,16,15,C[0]);rect(x+2,y+2,12,10,C[2]);rect(x-2,y-3,20,4,C[3]);rect(x+2,y+13,4,3,C[0]);rect(x+11,y+13,4,3,C[0]);}
        if(rare){for(let i=0;i<4;i++){const x=170+((time*.064+i*41)%190),y=118+i*15;
          rect(x,y,16,14,C[0]);rect(x+2,y+2,12,8,C[3]);rect(x-2,y-4,20,5,C[2]);}}
      } else if(event==='gravel') {
        for(let i=0;i<16;i++){const x=165+(i*31+Math.floor(time*.025))%153,y=112+((i*17)%87);rect(x,y,2+i%3,1+i%2,C[i%2?0:3]);}
      } else if(event==='clearline') {
        for(let i=0;i<4;i++){const y=123+i*15,hw=P.roadHalfWidth(y);line(240-hw*.4,y,240+hw*.4,y,C[3],1);}
        for(let i=0;i<3;i++){const y=138+i*17,x=240;poly([[x,y-6],[x-9,y+3],[x-3,y+3],[x,y],[x+3,y+3],[x+9,y+3]],C[3]);}
      } else if(event==='tailwind') {
        for(let i=0;i<5;i++){const y=112+i*19,x=196+(time*.047+i*17)%110;
          line(x,y,x+22,y,C[3],2);line(x+18,y-4,x+23,y,C[3],2);line(x+18,y+4,x+23,y,C[3],2);} 
      } else if(event==='oil') {
        for(let i=0;i<4;i++){const y=122+i*6,hw=P.roadHalfWidth(y);rect(240-hw*.36,y,hw*.72,4,C[0]);}
        if(rare)for(let i=0;i<6;i++){const x=198+(i*17)%80,y=153+i*7;
          rect(x,y,7+i%4,3,C[0]);rect(x+2,y-3-(time*.008+i*4)%14,2,2,C[3]);}
      } else if(event==='flood') {
        for(let i=0;i<6;i++){const y=117+i*8,hw=P.roadHalfWidth(y);rect(240-hw*.75,y,hw*1.5,2,i%2?C[3]:C[2]);}
        if(rare){ // The fish insist they're eligible entrants.
          for(let i=0;i<3;i++){const x=210+i*27,y=137+Math.sin(time*.004+i)*9;
            poly([[x,y],[x+12,y-5],[x+20,y],[x+12,y+5]],C[0]);
            poly([[x-5,y-5],[x,y],[x-5,y+5]],C[0]);rect(x+14,y-2,2,2,C[3]);}
        }
      } else if(event==='delivery') {
        rect(320,99,28,15,C[0]);rect(323,102,22,9,C[3]);line(329,99,329,114,C[1],2);line(337,99,337,114,C[1],2);
        if(rare)for(let i=0;i<9;i++){const x=183+(i*33)%138,y=121+((i*19+time*.027)%48);
          rect(x,y,9,9,C[0]);rect(x+2,y+2,5,5,C[3]);rect(x+3,y+3,3,3,C[1]);}
      } else if(event==='hail') {
        for(let i=0;i<30;i++)rect((i*83)%480,(i*29+time*.07)%235,3,3,C[3]);
      } else if(event==='crosswind') {for(let i=0;i<5;i++)rect((time*.08+i*89)%480,99+i*15,27,2,C[3]);
      } else if(event==='aura') {
        for(let i=0;i<7;i++){const a=time*.004+i*.9,x=240+Math.cos(a)*35,y=206+Math.sin(a)*25;line(240,220,x,y,C[i%2?3:0],2);}
      } else if(event==='speedlines') {
        for(let i=0;i<18;i++){const y=92+i*9,x=(i*37+time*.18)%360;line(x,y,x+90,y,C[i%3?3:0],1+i%2);}
      } else if(event==='mentor') {
        rect(75,100,12,45,C[0]);rect(72,90,18,14,C[0]);line(81,145,68,164,C[0],4);line(81,145,94,164,C[0],4);line(74,112,59,132,C[0],3);
      } else if(event==='transformation') {
        for(let i=0;i<9;i++){const a=i*Math.PI*2/9+time*.002,r=25+(i%3)*11;line(240,210,240+Math.cos(a)*r,210+Math.sin(a)*r,C[i%2?3:0],2);}
        rect(226,191,28,38,C[3]);rect(232,184,16,11,C[0]);
      } else if(event==='budget') {
        for(let y=95;y<250;y+=18)for(let x=20;x<470;x+=32)if((x+y)%3)rect(x,y,18,8,C[(x+y)%2?0:3]);
      } else if(event==='beam') {
        line(0,75,480,155,C[3],8);line(0,70,480,150,C[0],3);for(let i=0;i<8;i++)rect(40+i*59,158+i%2*9,12,5,C[0]);
      } else if(event==='crater') {
        ctx.fillStyle=C[0];ctx.beginPath();ctx.ellipse(240,168,74,24,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=C[1];ctx.beginPath();ctx.ellipse(240,168,52,13,0,0,Math.PI*2);ctx.fill();
      } else if(event==='beach') {
        for(let i=0;i<30;i++){const x=130+(i*37)%220,y=120+(i*23)%90;rect(x,y,3,2,C[3]);}for(let i=0;i<4;i++){const x=80+i*110;line(x,85,x+12,112,C[0],3);rect(x+9,82,18,5,C[3]);}
      } else if(event==='monologue') {
        rect(315,78,120,44,C[3]);poly([[342,122],[354,122],[346,138]],C[3]);for(let i=0;i<3;i++)rect(326,88+i*10,88-i*11,3,C[0]);
      } else if(event==='ghost-fake') {
        for(let i=0;i<4;i++){ctx.strokeStyle=C[i%2?3:2];ctx.lineWidth=2;ctx.strokeRect(168+i*7,108+i*6,105-i*14,46-i*8);}line(176,156,260,115,C[3],2);
      } else if(event==='rival-awakening'||event==='possessed-fake') {
        for(let i=0;i<7;i++){const x=170+i*25,y=113+(i%2)*11;line(x,y,x+11,y-18,C[3],3);line(x+11,y-18,x+20,y,C[0],2);}
      } else if(event==='weighted-spoiler') {
        poly([[178,135],[270,135],[250,143],[190,143]],C[0]);line(194,144,187,160,C[3],3);line(248,144,255,160,C[3],3);
      } else if(event==='clone-fake'||event==='mirror-fake') {
        rect(165,112,135,2,C[3]);rect(175,118,115,2,C[2]);for(let i=0;i<4;i++)line(190+i*24,106,180+i*24,145,C[3],1);
      } else if(event==='ufo-fake'||event==='ufo-pass'||event==='ufo'||event.startsWith('lights-')) {
        const stage=event.startsWith('lights-')?Number(event.split('-').at(-1)):4;const y=50+Math.max(0,4-stage)*13,x=300;
        poly([[x-28,y],[x+28,y],[x+14,y+9],[x-16,y+9]],C[0]);rect(x-12,y-7,24,8,C[2]);
        if(stage>=3||event==='ufo-pass'||event==='ufo-fake'){poly([[x-11,y+9],[x+11,y+9],[x+42,185],[x-42,185]],C[3]);}
      } else if(event==='tornado-pass') {
        for(let i=0;i<8;i++){const y=55+i*15,w=46-i*5;line(240-w,y,240+w,y,C[i%2?0:3],3);}
      } else if(event==='lightning-pass') {
        line(300,34,278,80,C[3],5);line(278,80,296,93,C[3],5);line(296,93,250,157,C[3],5);
      } else if(event==='foot-pass') {
        rect(255,45,70,95,C[0]);for(let i=0;i<4;i++)rect(247+i*20,137,16,25,C[0]);
      } else if(event==='slash-pass') {
        line(80,180,410,70,C[3],8);line(84,184,414,74,C[0],2);
      } else if(event==='meteor-pass') {
        const x=335-time*.06,y=50+time*.05;line(x+50,y-45,x,y,C[3],7);poly([[x-9,y-4],[x+9,y-7],[x+16,y+5],[x,y+14],[x-13,y+7]],C[0]);
      } else if(event==='blackhole-pass') {
        ctx.fillStyle=C[0];ctx.beginPath();ctx.arc(350,108,28,0,Math.PI*2);ctx.fill();ctx.strokeStyle=C[3];ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(350,108,45,13,time*.003,0,Math.PI*2);ctx.stroke();
      } else if(event==='stone-pass') {
        const x=420-(time*.13)%330,y=155;rect(x,y,52,52,C[0]);line(x,y,x+52,y+52,C[3],2);line(x+52,y,x,y+52,C[3],2);
      } else if(event==='coffin-pass') {
        const x=420-(time*.15)%330,y=158;poly([[x,y],[x+35,y-9],[x+49,y+3],[x+39,y+28],[x+5,y+28],[x-5,y+7]],C[0]);rect(x+12,y+4,24,14,C[2]);
      } else if(event==='shadow-pass') {
        poly([[120,180],[210,160],[320,175],[410,145],[480,174],[480,205],[120,205]],C[0]);
      } else if(event==='tail-pass') {
        poly([[0,102],[120,116],[255,138],[410,160],[480,156],[480,178],[330,183],[180,157],[0,132]],C[0]);
      } else if(event==='tentacle-pass') {
        line(470,55,360,105,C[0],14);line(360,105,300,168,C[0],18);for(let i=0;i<4;i++)rect(337-i*12,113+i*12,5,5,C[3]);
      } else if(event==='crab-pass') {
        poly([[390,95],[430,70],[455,90],[434,110]],C[0]);poly([[430,70],[464,58],[475,70],[455,90]],C[0]);line(403,107,355,160,C[0],10);
      } else if(event==='web-pass'||event==='spider-web') {
        for(let i=0;i<6;i++)line(120+i*50,92,390-i*35,195,C[3],1);for(let y=115;y<190;y+=18)line(120,y,390,y,C[3],1);
      } else if(event==='trebuchet-pass') {
        const x=330-time*.1,y=65+time*.06;ctx.fillStyle=C[0];ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fill();line(x+30,y-25,x,y,C[3],3);
      } else if(event==='teleporter'||event==='wormhole') {
        for(let i=0;i<4;i++){ctx.strokeStyle=C[i%2?3:0];ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(240,148,28+i*10,44+i*5,time*.001+i,0,Math.PI*2);ctx.stroke();}
      } else if(event==='gravity') {
        for(let i=0;i<8;i++){const x=145+i*28,y=155-Math.abs(Math.sin(time*.003+i))*45;rect(x,y,8,5,C[i%2?0:3]);}
      } else if(event==='magnet') {
        rect(345,75,18,55,C[0]);rect(395,75,18,55,C[0]);rect(345,113,68,17,C[0]);rect(350,80,8,21,C[3]);rect(400,80,8,21,C[3]);
      } else if(event==='time-dilation') {
        for(let i=0;i<5;i++){ctx.strokeStyle=C[i%2?3:0];ctx.lineWidth=2;ctx.beginPath();ctx.arc(240,145,35+i*18,0,Math.PI*2);ctx.stroke();}
      } else if(event==='mini-sun'||event==='sun-gaze') {
        ctx.fillStyle=C[3];ctx.beginPath();ctx.arc(370,52,22,0,Math.PI*2);ctx.fill();for(let i=0;i<10;i++){const a=i*Math.PI/5;line(370+Math.cos(a)*28,52+Math.sin(a)*28,370+Math.cos(a)*45,52+Math.sin(a)*45,C[3],3);}
      } else if(event==='roman-road') {
        for(let y=110;y<215;y+=14){const hw=P.roadHalfWidth(y);line(240-hw*.75,y,240+hw*.75,y,C[3],2);}for(let i=0;i<5;i++)line(170+i*35,100,180+i*28,215,C[0],1);
      } else if(event==='aqueduct') {
        for(let i=0;i<5;i++){const x=65+i*76;rect(x,58,55,8,C[0]);ctx.strokeStyle=C[0];ctx.lineWidth=7;ctx.beginPath();ctx.arc(x+27,94,23,Math.PI,0);ctx.stroke();}
      } else if(event==='tomb') {
        poly([[160,165],[180,95],[240,55],[300,95],[320,165]],C[0]);rect(220,110,40,55,C[1]);
      } else if(event==='industrial') {
        for(let i=0;i<5;i++){const x=55+i*90;rect(x,55,48,33,C[1]);rect(x+8,28,11,34,C[0]);rect(x+28,42,9,20,C[0]);}
      } else if(event==='anubis') {
        poly([[240,52],[226,75],[230,112],[250,112],[254,75]],C[0]);poly([[229,69],[216,50],[233,58]],C[0]);poly([[251,69],[264,50],[247,58]],C[0]);
      } else if(event==='haunted-road'||event==='graveyard'||event==='crossroads') {
        for(let i=0;i<6;i++){const x=60+i*72;rect(x,66,8,30,C[0]);poly([[x-6,66],[x+4,52],[x+14,66]],C[0]);}if(event==='crossroads'){line(240,115,180,205,C[3],4);line(240,115,300,205,C[3],4);}
      } else if(event==='ghost-wind') {
        for(let i=0;i<5;i++){const x=80+(time*.06+i*83)%400,y=105+i*21;line(x,y,x+35,y,C[3],2);ctx.strokeStyle=C[3];ctx.beginPath();ctx.arc(x+35,y+4,8,Math.PI*1.2,Math.PI*2.1);ctx.stroke();}
      } else if(event==='possessed') {
        for(let i=0;i<6;i++){const x=190+i*20,y=115+(i%2)*13;line(x,y,x+7,y-16,C[0],3);rect(x+5,y-19,5,5,C[3]);}
      } else if(event.startsWith('deja-vu-')) {
        const stage=Number(event.split('-').at(-1)),treeX=330-stage*13;rect(treeX,73,9,82,C[0]);for(let i=0;i<6;i++)line(treeX+4,80+i*8,treeX+(i%2?30:-26),65+i*6,C[0],4);
        const fx=treeX-9-stage*4;rect(fx,100-stage*4,9+stage*2,35+stage*5,C[1]);rect(fx-2,91-stage*4,13+stage*2,12+stage*2,C[0]);
        if(stage>=4){rect(145,65,190,150,C[0]);rect(174,84,132,108,C[1]);rect(194,112,24,10,C[3]);rect(262,112,24,10,C[3]);}
      } else if(event.startsWith('storm-')) {
        const stage=Number(event.split('-').at(-1));for(let i=0;i<5+stage*3;i++){const x=(i*67+stage*23)%480,y=25+(i%3)*11;rect(x,y,55,11,C[stage>=2?0:2]);}if(stage>=2)for(let i=0;i<35*stage;i++){const x=(i*47+time*.08)%480,y=(i*29+time*.1)%240;line(x,y,x-4,y+8,C[3],1);}
      } else if(event.startsWith('tremor-')) {
        const stage=Number(event.split('-').at(-1));for(let i=0;i<stage*4;i++){const x=150+(i*47)%180,y=140+(i*23)%65;line(x,y,x+13,y+8,C[0],2);line(x+13,y+8,x+4,y+14,C[0],2);}
      } else if(event.startsWith('crack-ice-')) {
        const stage=Number(event.split('-').at(-1));for(let i=0;i<stage*5;i++){const x=150+(i*39)%190,y=132+(i*17)%75;line(x,y,x+16,y+10,C[0],2);line(x+16,y+10,x+8,y+17,C[0],1);}
      } else if(event.startsWith('lab-')) {
        const stage=Number(event.split('-').at(-1));rect(345,50,80,54,C[0]);for(let i=0;i<stage*4;i++){const x=350+(i*17)%65,y=58+(i*13)%35;rect(x,y,5,5,i%2?C[3]:C[2]);}if(stage>=3)for(let i=0;i<8;i++)line(345,105,290+i*17,165,C[i%2?3:0],2);
      } else if(event==='kaiju') {
        rect(350,30,72,120,C[0]);rect(335,45,28,70,C[0]);rect(402,45,40,80,C[0]);for(let i=0;i<3;i++)poly([[370+i*15,33],[377+i*15,18],[384+i*15,35]],C[0]);
      } else if(event==='sand-worm') {
        ctx.strokeStyle=C[0];ctx.lineWidth=34;ctx.beginPath();ctx.arc(330,155,70,Math.PI,Math.PI*1.72);ctx.stroke();for(let i=0;i<8;i++)line(327+i*5,91,330+i*3,111,C[3],2);
      } else if(event==='sea-serpent') {
        ctx.strokeStyle=C[0];ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(330,190);ctx.bezierCurveTo(390,150,310,105,390,65);ctx.stroke();ctx.fillStyle=C[0];ctx.beginPath();ctx.arc(392,62,16,0,Math.PI*2);ctx.fill();
      } else if(event==='dragon') {
        poly([[260,65],[330,32],[315,80],[390,60],[335,100],[270,88]],C[0]);poly([[315,79],[355,108],[307,98]],C[0]);
      } else if(event==='blob') {
        ctx.fillStyle=C[0];ctx.beginPath();ctx.ellipse(250,173,105,31,0,0,Math.PI*2);ctx.fill();for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(175+i*32,153+(i%2)*8,20,0,Math.PI*2);ctx.fill();}
      } else if(event==='sleeping-giant') {
        poly([[80,170],[140,125],[220,112],[310,138],[390,125],[470,170]],C[0]);rect(285,110,70,30,C[0]);
      } else if(event==='monster-stampede') {
        for(let i=0;i<5;i++){const x=80+((time*.05+i*91)%400),y=120+(i%2)*35;rect(x,y,42,20,C[0]);rect(x+30,y-18,18,20,C[0]);line(x+8,y+18,x+2,y+42,C[0],5);line(x+33,y+18,x+39,y+42,C[0],5);}
      } else if(event==='creature-fight') {
        rect(45,45,85,120,C[0]);rect(355,40,85,130,C[1]);line(120,90,360,115,C[3],5);for(let i=0;i<8;i++)rect(170+(i*37)%150,115+(i*13)%65,8,5,C[0]);
      } else if(event.startsWith('mountain-')) {
        const stage=Number(event.split('-').at(-1));poly([[240,26],[160,87],[320,87]],C[0]);if(stage>=2){rect(214,50,12,8,C[3]);rect(255,50,12,8,C[3]);}if(stage>=3){rect(180,82,25,70,C[0]);rect(278,82,25,70,C[0]);}
      }
    }
    function drawRace({time=0,track='harbour',surface=null,weather='clear',event=null,eventVariant='normal',eventPhaseTime=0,finish=false,wreck=false,motion=true,approach='balanced',loadout=null,overtakes=null,rivalLoadouts=[],models=null,environment=null,shortcutMode='preview',portalMode='preview',portalOutcome='success'}={}) {
      canvas.dataset.vehicleRecipe=JSON.stringify(models||window.ScrapVehicleArt.fromLoadout(loadout||{}));
      canvas.dataset.vehicleForm=options.comboBodywork===true?(window.ScrapVehicleArt.resolveForm(models||window.ScrapVehicleArt.fromLoadout(loadout||{}))?.id||'modular'):'modular';
      canvas.dataset.vehicleStyle=options.style||'illustrated';canvas.dataset.vehicleCamera=options.camera||'rear';
      const speed=approach==='reckless'?1.16:approach==='careful'?.86:1;
      const t=motion?time*speed:0;
      eventWorldRate=WORLD_UNITS_PER_MS*speed;
      const sideRoute=window.ScrapEventEffects?.shortcutPose(event,eventPhaseTime,{mode:shortcutMode,motion});
      const routePan=sideRoute?.pan||0;
      const hauntedRoad=window.ScrapEventPortals?.hauntedRoute(event,eventPhaseTime,{mode:portalMode,motion});
      const cameraLane=sideRoute?.cameraLane||hauntedRoad?.cameraLane||0;
      sky(track,weather,surface,environment,cameraLane);
      // Changing the camera's WORLD lane produces correct parallax: distant
      // road sections move less than near ones, while the player's car stays
      // centered in its own lane. Normal straight races still use cameraLane=0.
      eventProjection=(lane,z)=>P.project(lane-cameraLane,z);
      ctx.save();
      // A restrained shared reaction: nearby road and cars jolt together at
      // the seeded visual impact. Normal racing geometry stays unchanged.
      const energyJolt=window.ScrapEventEnergy?.cameraImpulse(event,eventPhaseTime,{motion});
      const stageJolt=window.ScrapEventMultistage?.cameraImpulse(event,eventPhaseTime,{motion});
      ctx.translate((energyJolt?.x||0)+(stageJolt?.x||0),(energyJolt?.y||0)+(stageJolt?.y||0));
      road(finish?t*.25:t,track,cameraLane);
      // Road effects belong physically beneath the rival and player vehicles.
      if(event&&(window.ScrapEventEffects?.recipe(event)||window.ScrapEventPortals?.recipe(event)||window.ScrapEventMultistage?.recipe(event)))hazardFX(event,eventPhaseTime,eventVariant,motion,null,null,'under',null,shortcutMode,portalMode,portalOutcome);
      const activeMotion=event&&window.ScrapEventMotion?.recipe(event);
      const activeGhost=event&&window.ScrapEventGhosts?.recipe(event);
      const activeClone=event&&window.ScrapEventClones?.recipe(event);
      const passRivals=[{z:10.8,x:1.75},{z:8.1,x:-1.62},{z:5.8,x:1.58},{z:3.85,x:-1.55}];
      const specialIndex=overtakes?.special?.index;
      const launchTarget=Number.isInteger(specialIndex)?passRivals[Math.max(0,passRivals.length-1-specialIndex)]:passRivals[passRivals.length-1];
      const launchAnchor=eventProjection(launchTarget.x,launchTarget.z);
      const ghostIndex=overtakes?.fake?.index??overtakes?.special?.index;
      const ghostTarget=Number.isInteger(ghostIndex)?passRivals[Math.max(0,passRivals.length-1-ghostIndex)]:passRivals[passRivals.length-1];
      const ghostAnchor=eventProjection(ghostTarget.x,ghostTarget.z);
      if(activeGhost)hazardFX(event,eventPhaseTime,eventVariant,motion,null,ghostAnchor,'under');
      if(activeClone)hazardFX(event,eventPhaseTime,eventVariant,motion,null,ghostAnchor,'under');
      const activeEnergy=event&&window.ScrapEventEnergy?.recipe(event);
      // Energy scorch, shockwaves and warning shadows belong beneath cars.
      if(activeEnergy&&event!=='storm-3')hazardFX(event,eventPhaseTime,eventVariant,motion,null,launchAnchor,'under');
      // The road hardware belongs below the car; flashes and loose parts above.
      if(activeMotion?.family==='launching'||activeMotion?.family==='lifting'||activeMotion?.family==='falling')
        hazardFX(event,eventPhaseTime,eventVariant,motion,null,activeMotion.family==='falling'&&!overtakes?.special?null:launchAnchor,'under');
      let liftingActorAnchor=null;
      // Actual seeded rival builds and four race-only chassis liveries.
      // Far cars stay smaller, while near cars are readable as cars rather
      // than ten-pixel machinery diagrams. No presentation affects standings.
      const rivals=[{z:10.8,x:1.75},{z:8.1,x:-1.62},{z:5.8,x:1.58},{z:3.85,x:-1.55}];
      for(let i=0;i<rivals.length;i++) {
        const r=rivals[i];
        const passIndex=rivals.length-1-i;
        let z=r.z,x=r.x,lift=0,tilt=0;
        if(overtakes && passIndex<overtakes.total) {
          const crossing=overtakes.crossings[passIndex];
          if(overtakes.progress>=crossing)continue;
          const reportedSpecialId=overtakes.specialByIndex?.[passIndex];
          // A scripted pass must not start its rival reaction during an unrelated
          // event just because the race progress is approaching its threshold.
          const specialId=reportedSpecialId&&window.ScrapEventTiming?.profile(window.ScrapEngine?.passEvent(reportedSpecialId)?.visual)
            &&overtakes?.special?.index!==passIndex?null:reportedSpecialId;
          const fake=overtakes.fake?.index===passIndex?overtakes.fake:null;
          if(fake&&motion){
            const ghostPose=activeGhost?.role==='fake'&&window.ScrapEventGhosts.rivalTransform(event,fake.local,{x:r.x,z:r.z});
            if(ghostPose){z=ghostPose.z;x=ghostPose.x;lift=ghostPose.lift;tilt=ghostPose.angle||0;}
            else{
              const q=fake.local,half=q<.5?q*2:(q-.5)*2,eased=half*half*(3-2*half);
              if(q<.5){z=r.z+(1.32-r.z)*eased;x=r.x+Math.sign(r.x||1)*.72*eased;}
              else{z=1.32+(r.z+2.8-1.32)*eased;x=(r.x+Math.sign(r.x||1)*.72)*(1-eased)+r.x*eased;lift=Math.sin(q*Math.PI)*10;}
            }
          }else{
            const begin=crossing-(specialId?.13:.16),q=motion?(overtakes?.presentation?.kind==='special'&&overtakes.special?.index===passIndex
              ?overtakes.special.local:P.clamp((overtakes.progress-begin)/(crossing-begin),0,1)):0;
            const eased=q*q*(3-2*q),kind=specialId==='trebuchet-pass'?'trebuchet':specialId==='meteor-pass'?'meteor':specialId==='giant-footstep'?'foot':(specialId?(window.ScrapEngine?.passEvent(specialId)?.motion||'blast'):null);
            const liftKind=activeMotion?.family==='lifting'&&window.ScrapEngine?.passEvent(specialId)?.visual===event?
              ({'tornado-pass':'tornado','ufo-pass':'ufo','tentacle-pass':'tentacle','crab-pass':'crab'}[event]||kind):kind;
            const energeticPass=(event==='lightning-pass'&&specialId==='lightning-strike')||(event==='slash-pass'&&specialId==='impossible-sword');
            const offset=(activeGhost?.role==='special'&&specialId==='shadow-pass'
              ?window.ScrapEventGhosts.rivalTransform(event,q,{x:r.x,z:r.z}):null)
              ||(energeticPass?window.ScrapEventEnergy?.rivalTransform(event,q,{x:r.x,z:r.z}):null)
              ||window.ScrapEventMotion.rivalTransform(liftKind,q,{x:r.x,z:r.z});
            z=offset.z;x=offset.x;lift=offset.lift;tilt=offset.angle||0;
          }
        }
        const sway=motion?.09*Math.sin(t*.0012+i*1.7):0;
        const p=eventProjection(x+sway,z);
        if(activeMotion?.family==='lifting'&&specialIndex===passIndex)
          liftingActorAnchor={x:p.x,y:p.y-lift};
        const width=Math.min(190,225/z),height=Math.min(128,155/z);
        const fakeGhost=overtakes?.fake?.index===passIndex&&event==='ghost-fake'&&motion
          ?window.ScrapEventGhosts?.ghostCopy(event,overtakes.fake.local,{x:r.x,z:r.z}):null;
        const shadowAlpha=event==='shadow-pass'&&specialIndex===passIndex&&motion
          ?window.ScrapEventGhosts.rivalTransform(event,(overtakes.special?.local||0),{x:r.x,z:r.z})?.alpha??1:1;
        const bouncing=motion?.36*Math.sin(t*.018+i*2.3):0;
        const modelsR=window.ScrapVehicleArt.fromLoadout(rivalLoadouts[i]||{});
        const live=motion&&i>=2;
        // Contact shadow and wheel-line dashes anchor the vehicle to the road.
        if(!(activeMotion?.family==='lifting'&&specialIndex===passIndex)){
          ctx.fillStyle='rgba(15,26,31,.40)';ctx.beginPath();ctx.ellipse(p.x,p.y-1,width*.35,Math.max(1,width*.075),0,0,Math.PI*2);ctx.fill();
        }
        if(motion&&p.y>95&&z>1.2) {
          ctx.save();ctx.globalAlpha=.45;
          for(const s of [-1,1])line(p.x+s*width*.27,p.y+2,p.x+s*width*.30,p.y+5+Math.min(10,5/z),sceneStyle.mark,Math.max(.5,width*.025));
          ctx.restore();
        }
        if(fakeGhost&&fakeGhost.alpha>.003){
          // A real duplicate of this exact rival build, not a generic ghost
          // silhouette. The original vehicle remains ahead throughout.
          const gp=eventProjection(fakeGhost.x,fakeGhost.z);
          ctx.save();ctx.globalAlpha*=fakeGhost.alpha;
          ctx.filter='sepia(.45) hue-rotate(95deg) saturate(1.4) brightness(1.45)';
          sprite(gp.x,gp.y,Math.min(190,225/fakeGhost.z)*fakeGhost.scale,
            Math.min(128,155/fakeGhost.z)*fakeGhost.scale,rivalLoadouts[i]||null,false,options.camera||'rear',modelsR,t,i+1);
          ctx.restore();
        }
        if(tilt){
          ctx.save();ctx.translate(p.x,p.y+bouncing-lift);ctx.rotate(tilt);ctx.translate(-p.x,-(p.y+bouncing-lift));
        }
        ctx.save();ctx.globalAlpha*=shadowAlpha;
        sprite(p.x,p.y+bouncing-lift,width,height,rivalLoadouts[i]||null,live,options.camera||'rear',modelsR,t,i+1);
        ctx.restore();
        if(tilt)ctx.restore();
        if(activeClone?.role==='fake'&&overtakes?.fake?.index===passIndex&&motion){
          // Additional on-screen actors use the EXACT same rival component build.
          // These copies can appear to be passed, but the original rival never
          // changes depth or position and no earned position is added.
          const cloned=window.ScrapEventClones.actors(event,overtakes.fake.local,{x:r.x,z:r.z});
          for(const actor of cloned){
            if(actor.alpha<=.002)continue;
            const cp=eventProjection(actor.x,actor.z);
            const cw=Math.min(190,225/actor.z)*(actor.scale||1),ch=Math.min(128,155/actor.z)*(actor.scale||1);
            ctx.save();ctx.globalAlpha*=actor.alpha;
            if(actor.kind==='reflection')ctx.filter='brightness(1.30) saturate(.85)';
            else if(actor.kind==='flawed')ctx.filter='brightness(1.20) saturate(.65)';
            else ctx.filter='brightness(1.3) saturate(1.45)';
            // Flip artwork itself for the mirror double; its road location and
            // contact anchor remain in normal scene coordinates.
            if(actor.mirror){ctx.translate(cp.x,0);ctx.scale(-1,1);}
            sprite(actor.mirror?0:cp.x,cp.y,cw,ch,rivalLoadouts[i]||null,false,
              options.camera||'rear',modelsR,t,i+1);
            ctx.restore();
            if(actor.boost>.05&&actor.alpha>.10){
              const trail=actor.boost*23;
              ctx.save();ctx.globalAlpha*=actor.alpha*.8;
              for(let n=0;n<3;n++)line(cp.x-18-n*7,cp.y-8+n*7,cp.x-18-n*7-trail,cp.y-8+n*7,
                n%2?'#ffd682':'#8cfff0',1.4+n*.3);
              ctx.restore();
            }
          }
        }
      }
      // Crossing creatures belong on the ROAD, behind the player's vehicle.
      // Use the same projected rival contact that the vehicle renderer uses,
      // instead of placing a honk/brake reaction at an invented screen x.
      if(activeMotion?.family==='crossing'){
        const specialIndex=overtakes?.special?.index;
        const target=Number.isInteger(specialIndex)?rivals[Math.max(0,rivals.length-1-specialIndex)]:rivals[rivals.length-1];
        const rivalAnchor=eventProjection(target.x,target.z);
        hazardFX(event,eventPhaseTime,eventVariant,motion,null,rivalAnchor);
      }
      const drift=motion&&!wreck?Math.sin(t*.0014)*1.7:0;
      const bounce=motion&&!wreck?Math.sin(t*.022)*.85+Math.sin(t*.008)*.65:0;
      const lean=motion&&!wreck?Math.sin(t*.0014+.2)*.012:0;
      const playerModels=models||window.ScrapVehicleArt.fromLoadout(loadout||{});
      const playerScale=window.ScrapVehicleArt.displayScale?window.ScrapVehicleArt.displayScale(playerModels,options.camera||'rear',options.comboBodywork===true):1;
      const portalPose=window.ScrapEventPortals?.playerPose(event,eventPhaseTime,{mode:portalMode,outcome:portalOutcome,motion});
      // Short dust/steam bursts are produced behind the vehicle, not painted
      // onto its component geometry. Disabled entirely in reduced-motion mode.
      if(motion&&!wreck){
        const grit=(surface==='sand'||surface==='dirt'||surface==='mud'||surface==='broken');
        const haze=surface==='snow'||surface==='ice';
        if(grit||haze||approach==='reckless')for(let i=0;i<7;i++){
          const age=(t*.0011+i*.153)%1;
          const sign=i%2?-1:1;
          const xx=240+drift+sign*(42+age*27)+Math.sin(i*7.2)*3;
          const yy=247+age*19;
          ctx.fillStyle=grit?'rgba(217,177,112,.24)':haze?'rgba(240,249,252,.33)':'rgba(214,225,217,.16)';
          ctx.beginPath();ctx.ellipse(xx,yy,(2+age*7)*(grit?1.25:1),1.2+age*3,0,0,Math.PI*2);ctx.fill();
        }
        // A few tiny sparks at full-throttle reckless pace.
        if(approach==='reckless')for(let i=0;i<3;i++){
          const q=(t*.021+i*.37)%1;
          line(237+(i-1)*4,249+q*17,238+(i-1)*6,251+q*20,'#ffd78a',1.4-q*.5);
        }
      }
      ctx.save();
      if(portalPose){
        ctx.globalAlpha*=portalPose.alpha;
        ctx.translate(240+drift+portalPose.x,238+portalPose.y);
        ctx.scale(portalPose.scale,portalPose.scale);
        ctx.translate(-(240+drift),-238);
      }
      ctx.fillStyle='rgba(9,24,29,.55)';ctx.beginPath();ctx.ellipse(240+drift,253,63*playerScale,Math.max(3,6*playerScale),0,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.translate(240+drift,258+bounce);ctx.rotate(lean);ctx.translate(-(240+drift),-(258+bounce));
      // Before the flash/cutaway reveal, show the original modular precursor
      // rather than exposing the finished gag in the opening rear-view shot.
      const movieIntro=window.ScrapTransformCinematics?.recipe(event)&&eventPhaseTime<1350;
      sprite(240+drift,258+bounce,164,113,loadout,motion&&!wreck,options.camera||'rear',models,t,0,movieIntro?false:null);
      ctx.restore();ctx.restore();
      if(wreck){for(let i=0;i<6;i++)rect(205+i*12,204-i%3*12,11,15,C[i%2]);}
      // Special-pass props are placed by the same lane as the target rival.
      // Index 0/2 is the left lane, 1/3 the right; no race logic changes.
      const eventAnchor=(activeMotion&&activeMotion.family!=='crossing'&&overtakes?.special)
        ?(overtakes.special.index%2===0?170:310):null;
      if(activeGhost)hazardFX(event,eventPhaseTime,eventVariant,motion,null,ghostAnchor,'over');
      if(activeClone)hazardFX(event,eventPhaseTime,eventVariant,motion,null,ghostAnchor,'over');
      if(event&&!activeGhost&&!activeClone&&activeMotion?.family!=='crossing')hazardFX(event,eventPhaseTime,eventVariant,motion,
        activeMotion?.family==='launching'||activeMotion?.family==='lifting'||activeMotion?.family==='falling'?null:eventAnchor,
        activeEnergy?launchAnchor:(activeMotion?.family==='launching'||activeMotion?.family==='lifting'||activeMotion?.family==='falling'?(activeMotion.family==='falling'&&!overtakes?.special?null:launchAnchor):null),
        activeMotion?.family==='launching'||activeMotion?.family==='lifting'||activeMotion?.family==='falling'||activeEnergy?'over':'all',
        liftingActorAnchor,shortcutMode,portalMode,portalOutcome);
      ctx.restore();
      weatherFX(weather,t,motion);
      // Transformation movies are a cut to a separately composed SIDE-VIEW
      // scene, then a camera dissolve back to the unmodified rear-view race.
      // Gameplay has already been resolved before this presentation runs.
      const cutaway=window.ScrapTransformCinematics;
      const movie=cutaway?.recipe(event)?cutaway.sample(event,eventPhaseTime,{loadout}):null;
      if(movie)cutaway.render(ctx,{id:event,elapsedMs:eventPhaseTime,loadout,motion});
      canvas.dataset.cinematicStage=movie?.stage||'none';
      const staged=window.ScrapEventMultistage?.sample(event,eventPhaseTime,{motion});
      canvas.dataset.multiStage=staged?`${staged.family}-${staged.stage}`:'none';
      canvas.dataset.multiBeat=staged?.beat||'none';
      canvas.dataset.cinematicForm=movie?.form||'none';
      canvas.dataset.shortcutCameraPan=String(Math.round(routePan));
      canvas.dataset.shortcutCameraLane=String(Number(cameraLane.toFixed(3)));
      canvas.dataset.shortcutStage=sideRoute?.stage||'none';
      canvas.dataset.shortcutMode=sideRoute?shortcutMode:'none';
      canvas.dataset.eventMotionFamily=event?(window.ScrapTransformCinematics?.recipe(event)?.family||window.ScrapEventClones?.recipe(event)?.family||window.ScrapEventGhosts?.recipe(event)?.family||window.ScrapEventPortals?.recipe(event)?.family||window.ScrapEventMotion?.recipe(event)?.family||window.ScrapEventEffects?.recipe(event)?.family||window.ScrapEventEnergy?.recipe(event)?.family||'legacy'):'none';
      canvas.dataset.portalStage=window.ScrapEventPortals?.sample(event,eventPhaseTime,{mode:portalMode,outcome:portalOutcome,motion})?.stage||'none';
      canvas.dataset.hauntedCameraLane=String(Number((hauntedRoad?.cameraLane||0).toFixed(3)));
      canvas.dataset.portalMode=window.ScrapEventPortals?.recipe(event)?portalMode:'none';
      canvas.dataset.portalCarAlpha=String(portalPose?.alpha??1);
      canvas.dataset.ghostStage=window.ScrapEventGhosts?.sample(event,eventPhaseTime,{motion,variant:eventVariant})?.stage||'none';
      canvas.dataset.ghostTargetIndex=activeGhost&&Number.isInteger(ghostIndex)?String(ghostIndex):'none';
      canvas.dataset.cloneStage=window.ScrapEventClones?.sample(event,eventPhaseTime,{motion,variant:eventVariant})?.stage||'none';
      canvas.dataset.cloneTargetIndex=activeClone&&Number.isInteger(ghostIndex)?String(ghostIndex):'none';
      if(finish&&!wreck){for(let i=0;i<24;i++){rect(i*20,89,10,5,C[3]);rect(i*20+10,94,10,5,C[3]);}}
    }
    function drawGarage(loadout=null,models=null) {
      canvas.dataset.vehicleRecipe=JSON.stringify(models||window.ScrapVehicleArt.fromLoadout(loadout||{}));
      canvas.dataset.vehicleForm=options.comboBodywork===true?(window.ScrapVehicleArt.resolveForm(models||window.ScrapVehicleArt.fromLoadout(loadout||{}))?.id||'modular'):'modular';
      canvas.dataset.vehicleStyle=options.style||'illustrated';canvas.dataset.vehicleCamera='garage';
      // Warm, readable workshop. Still procedural and cheap, but no longer a shutter with a car floating in it.
      rect(0,0,480,270,'#162830');rect(0,185,480,85,'#2b3435');
      // back wall brick courses
      for(let y=18;y<182;y+=18)for(let x=(Math.floor(y/18)%2?-24:0);x<480;x+=48){rect(x,y,45,15,'#9b5d38');rect(x+2,y+2,41,2,'#c98555');line(x,y+15,x+45,y+15,'#6b4636',1);}
      // central banner + tool wall
      rect(126,26,228,74,'#e2b968');rect(132,32,216,62,'#c98555');rect(145,43,190,40,'#e8d7ad');
      line(156,63,318,63,'#354a50',4);line(181,50,181,78,'#354a50',3);line(283,50,283,78,'#354a50',3);
      // overhead lamps
      for(const x of [170,310]){line(x,0,x,20,'#17282e',3);rect(x-18,20,36,5,'#17282e');poly([[x-18,25],[x+18,25],[x+11,35],[x-11,35]],'#d9b65c');rect(x-8,34,16,3,'#f0e2b9');}
      // left red tool chest and tyre stacks
      rect(10,102,74,69,'#6e2f2d');rect(15,108,64,58,'#b54d45');for(let y=115;y<158;y+=12){line(20,y,73,y,'#542c2d',2);rect(62,y+2,8,2,'#e0b45d');}
      for(let i=0;i<5;i++){ctx.strokeStyle='#18262a';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(103,166-i*13,27,8,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#536168';ctx.lineWidth=2;ctx.stroke();}
      // right shelves with bottles / trophy / spare parts
      rect(388,46,80,125,'#263d45');for(let y of [76,108,140])rect(392,y,72,4,'#839da5');
      for(let i=0;i<10;i++){const x=396+(i%5)*13,y=59+Math.floor(i/5)*32;rect(x,y,7,14,i%3===0?'#c95e5a':i%3===1?'#70b987':'#d9b65c');rect(x+2,y-3,3,3,'#d4e1df');}
      rect(430,115,15,12,'#d9b65c');rect(434,107,7,8,'#d9b65c');
      // service platform and floor markings
      ctx.fillStyle='#17282e';ctx.beginPath();ctx.ellipse(240,232,150,30,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d9b65c';ctx.lineWidth=5;ctx.stroke();
      ctx.strokeStyle='#435b64';ctx.lineWidth=1;for(let x=-50;x<530;x+=55)line(240+(x-240)*.33,190,x,270,'#435b64');for(let y=204;y<270;y+=17)line(0,y,480,y,'#435b64');
      // foreground bench / scattered tools
      rect(0,246,105,24,'#5f3d32');rect(367,245,113,25,'#5f3d32');line(26,252,72,252,'#d9b65c',3);line(405,254,450,248,'#839da5',3);rect(449,241,16,7,'#c95e5a');
      const garageModels=models||window.ScrapVehicleArt.fromLoadout(loadout||{}),garageScale=window.ScrapVehicleArt.displayScale?window.ScrapVehicleArt.displayScale(garageModels,'garage',options.comboBodywork===true):1;
      ctx.fillStyle='#0f1719aa';ctx.beginPath();ctx.ellipse(240,232,126*garageScale,Math.max(5,11*garageScale),0,0,Math.PI*2);ctx.fill();
      sprite(240,244,340,233,loadout,false,'garage',models);
    }
    function drawTitle() {
      if(title.complete&&title.naturalWidth) {ctx.drawImage(title,0,0,480,270);}
      else drawRace({time:0,track:'harbour',motion:false});
    }
    return { drawRace,drawGarage,drawTitle,ready:Promise.all([car.decode().catch(()=>{}),title.decode().catch(()=>{}),window.ScrapVehicleArt?.ready]) };
  }
  window.ScrapScene={create,palette:C,depthSamples:groundSamples,WORLD_UNITS_PER_MS};
})();


