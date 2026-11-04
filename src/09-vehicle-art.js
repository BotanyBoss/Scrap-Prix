

/* Scrap Prix v0.4.0 modular vehicle illustration and gag-form renderer.
   Original procedural 2D art: projected faces are painted to a Canvas, not game
   physics or a 3D engine. No gameplay state, RNG, stats, prices or saves change.
   Existing catalogue items use provisional family mappings, not final assets. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./data.js'),require('./vehicle-raster.js'),require('./vehicle-combos.js'));
  else root.ScrapVehicleArt=factory(root.ScrapData,root.ScrapVehicleRaster,root.ScrapVehicleCombos);
})(typeof globalThis!=='undefined'?globalThis:this,function(D,R,G){
  'use strict';
  const PALETTE=Object.freeze({ink:'#17282e',deep:'#263d45',dark:'#435b64',mid:'#839da5',pale:'#afc3c7',light:'#d4e1df',paper:'#ecf0e9'});
  /* Slot-specific material ramps. Original faces and part ownership remain authoritative.
     The palette changes paint only, not geometry or combo matching. */
  const PART_RAMPS=Object.freeze({
    chassis:['#17282e','#24464a','#37666a','#4c9593','#83c9b2','#d9e5bd','#f6ead0'],
    engine: ['#17282e','#442c2a','#7d3e36','#b85c43','#e69568','#f0cd9b','#f9e8ca'],
    tyres:  ['#17282e','#202b2f','#3a484d','#65757a','#9fadb0','#d7d9d2','#f2e9d6'],
    gadget: ['#17282e','#4d3b27','#80612f','#b89348','#e0be74','#f1dda9','#f8edcc']
  });
  // Race-only chassis paint. The other three actual components keep their
  // identifiable materials; exact gag reveal art retains its approved palette.
  const RACE_LIVERIES=Object.freeze([
    null,
    ['#17282e','#343e53','#4f6482','#6e8fae','#92bbd6','#d0dfec','#f4ebd9'], // cobalt
    ['#17282e','#57352e','#8c453b','#bd6c4b','#d99669','#f4d09d','#fff0d0'], // vermilion
    ['#17282e','#463e2a','#746136','#a58a45','#c9ae64','#e5d6a4','#f6ebce'], // ochre
    ['#17282e','#3e3550','#66517b','#927ca8','#b7a4d0','#ddd0e8','#f2e7db']  // violet
  ]);

  // Exact-recipe gag vehicles have their OWN small paint palettes. The old
  // resolved-form renderer flattened every bespoke vehicle into the same four
  // grey shades, masking the approved vehicle personalities. This is art only:
  // palette changes never affect how a recipe is recognised or what it does.
  // Each entry: body, machinery, trim, wheels. Wheel rubber stays neutral
  // except for genuinely bone / rail recipes.
  const GAG_PAINT=Object.freeze({
    train:      ['#416950','#b38648','#d7b56e','#60717b'],
    fossil:     ['#ccbd97','#596b58','#a58b61','#d7c49c'],
    mower:      ['#6ca14e','#b56439','#e4bd61','#485451'],
    truck:      ['#bc6048','#59737b','#ddb26f','#384449'],
    monster:    ['#8065a3','#ba6741','#e3ad52','#354048'],
    muscle:     ['#b34f4c','#69828b','#e7bd7a','#303d42'],
    tank:       ['#718155','#596b59','#bcaa79','#3b4a3f'],
    f1:         ['#c64d44','#4d626b','#ecd1a0','#303943'],
    rocketcar:  ['#4f949d','#c6664b','#f0ad63','#334454'],
    burger:     ['#d8a65f','#68483a','#71974e','#434c49'],
    boat:       ['#79b7c2','#53768d','#e4bd73','#3b4a52'],
    dune:       ['#d2a752','#b2764c','#60958c','#414b46'],
    snowmobile: ['#8cc6d1','#6188ad','#d78a63','#435866'],
    plane:      ['#c7d2c1','#527e8b','#b87561','#3f5058'],
    house:      ['#94ad94','#b66d57','#d8c48d','#475158'],
    icecream:   ['#edb5bc','#ddd2ac','#cf6781','#414e59'],
    spaceship:  ['#55a9a4','#d6c69a','#bc6d9e','#3c5360']
  });
  const PALETTE_KEYS=Object.values(PALETTE);
  const hexRGB=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  function mixColour(a,b,amount){
    const u=hexRGB(a),v=hexRGB(b);
    return '#'+u.map((n,i)=>Math.round(n*(1-amount)+v[i]*amount).toString(16).padStart(2,'0')).join('');
  }
  function gagTones(colour){return [PALETTE.ink,mixColour(colour,'#07151a',.64),mixColour(colour,'#07151a',.35),colour,
    mixColour(colour,'#fff2d8',.28),mixColour(colour,'#fff2d8',.56),mixColour(colour,'#fff2d8',.80)];}
  const GAG_RAMPS=Object.freeze(Object.fromEntries(Object.entries(GAG_PAINT).map(([id,c])=>[id,Object.freeze({
    chassis:gagTones(c[0]),engine:gagTones(c[1]),gadget:gagTones(c[2]),tyres:gagTones(c[3])
  })])));
  function paintFaceForGag(face,form){
    const ramp=GAG_RAMPS[form]?.[face.slot];
    if(!ramp)return face;
    const shade=hex=>{const i=PALETTE_KEYS.indexOf(hex);return i<0?hex:ramp[i];};
    return {...face,fill:shade(face.fill),stroke:shade(face.stroke)};
  }
  const SHADE_INDEX=new Map(Object.values(PALETTE).map((hex,i)=>[hex,i]));
  function paintFaceInColour(f,livery=0){
    const ramp=f.slot==='chassis'&&RACE_LIVERIES[livery]?RACE_LIVERIES[livery]:PART_RAMPS[f.slot];if(!ramp)return f;
    const colour=hex=>hex&&SHADE_INDEX.has(hex)?ramp[SHADE_INDEX.get(hex)]:hex;
    return {...f,fill:colour(f.fill),stroke:colour(f.stroke)};
  }

  const OPTIONS=Object.freeze({
    chassis:Object.freeze([
      {id:'soapbox',name:'Soapbox Frame',note:'Short, open and extremely light'},
      {id:'needle',name:'Needle Frame',note:'Long, tapered speed chassis'},
      {id:'brick',name:'Boilerplate Chassis',note:'Wide, plated heavy body'},
      {id:'wagon',name:'Wobble Wagon',note:'Rugged wagon platform'},
      {id:'longbody',name:'Longbody Frame',note:'Stable stretched chassis'},
      {id:'hauler',name:'Hauler Frame',note:'Long industrial platform'},
      {id:'tub',name:'Armoured Tub',note:'Low, heavily protected frame'},
      {id:'pod',name:'Aero Pod Frame',note:'Low, wide capsule platform'},
      {id:'gt',name:'Carbon-Lite Monocoque',note:'Light performance shell'}
    ]),
    engine:Object.freeze([
      {id:'motor',name:'Clunker Motor',note:'Tiny block, oversized air filter'},
      {id:'boiler',name:'Steam Boiler',note:'Oversized pressure vessel'},
      {id:'v8',name:'Exposed V8',note:'Wide block and side pipes'},
      {id:'race',name:'Race Block',note:'Compact high-rev racing engine'},
      {id:'rocket',name:'Rocket Drivetrain',note:'Long finned thrust unit'},
      {id:'twin',name:'Twin Cylinder',note:'Paired cylinders and compact drive'},
      {id:'inline4',name:'Inline Four',note:'Simple upright four-cylinder motor'},
      {id:'reactor',name:'Reactor',note:'Exposed stacked core'},
      {id:'diesel',name:'Heavy Diesel',note:'Industrial block and flywheel'}
    ]),
    tyres:Object.freeze([
      {id:'road',name:'Scrap Racer Wheels',note:'Compact road rubber and steel rims'},
      {id:'spokes',name:'Skinny Spokes',note:'Open spokes, thin rubber'},
      {id:'monster',name:'Monster Treads',note:'Huge tyres and raised stance'},
      {id:'balloon',name:'Balloon Tyres',note:'Round inflated sidewalls'},
      {id:'speed',name:'Speed Slicks',note:'Low-profile dry-speed rubber'},
      {id:'bone',name:'Bone Wheels',note:'Open bone spokes and rib treads'},
      {id:'rail',name:'Rail Wheels',note:'Flanged steel drivers'},
      {id:'track',name:'Track Rollers',note:'Industrial rollers and bands'},
      {id:'groove',name:'Steel-belt Survival',note:'Heavy reinforced grooved rubber'}
    ]),
    gadget:Object.freeze([
      {id:'fan',name:'Cooling Fan',note:'Large rear cooling mount'},
      {id:'rockets',name:'Rocket Pack',note:'Twin rear thrusters'},
      {id:'plough',name:'Ram Plough',note:'Wide front blade and guide rods'},
      {id:'exhaust',name:'Exhaust Array',note:'Tall staggered pipes'},
      {id:'wing',name:'Aero Kit',note:'Front wing and rear spoiler'},
      {id:'handle',name:'Tubular Brace',note:'Tubular structural framework'},
      {id:'armour',name:'Bolt-on Armour',note:'Plate bundle and bumper bars'},
      {id:'fins',name:'Stability Fins',note:'Paired stabilising fins'},
      {id:'tank',name:'Impact Foam Canister',note:'Emergency impact canister'}
    ])
  });
  const DEFAULT=Object.freeze({chassis:'soapbox',engine:'boiler',tyres:'spokes',gadget:'fan'});
  const VALID={chassis:['soapbox','needle','gt','brick','wagon','longbody','hauler','tub','pod'],engine:['boiler','v8','race','motor','rocket','twin','inline4','reactor','diesel'],tyres:['spokes','monster','road','speed','slick','groove','balloon','bone','rail','track'],gadget:['fan','rockets','deskfan','tank','fins','radiator','plough','exhaust','wing','handle','armour']};
  const CAMERA=Object.freeze({garage:{yaw:.94,pitch:.36},rear:{yaw:Math.PI,pitch:.16},side:{yaw:Math.PI/2,pitch:.14}});
  const CATALOG=Object.freeze(Object.fromEntries((D?.PARTS||[]).map(p=>[p.id,p])));
  function normalise(input={}){
    const out={};
    for(const slot of Object.keys(DEFAULT))out[slot]=VALID[slot].includes(input?.[slot])?input[slot]:DEFAULT[slot];
    return out;
  }
  function fromLoadout(loadout={}){
    const selected=slot=>CATALOG[loadout?.[slot]]?.slot===slot?CATALOG[loadout[slot]]:CATALOG['stock-'+slot];
    const chassis=selected('chassis'),engine=selected('engine'),tyres=selected('tyres'),gadget=selected('gadget');
    const chassisMap={
      'stock-chassis':'gt','soapbox':'soapbox','needle-frame':'needle','boilerplate':'brick','wobble-wagon':'wagon',
      'longbody':'longbody','hauler':'hauler','armoured-tub':'tub','aero-pod':'pod','carbon-lite':'gt'
    };
    const engineMap={
      'stock-engine':'motor','clunker':'motor','boiler':'boiler','v8':'v8','race-block':'race','rocket-drive':'rocket',
      'twin-cylinder':'twin','inline-four':'inline4','reactor':'reactor','heavy-diesel':'diesel'
    };
    const tyreMap={
      'stock-tyres':'road','scrap-racer':'road','skinny-spokes':'spokes','monster-treads':'monster','balloon-tyres':'balloon',
      'speed-slicks':'speed','bone-wheels':'bone','rail-wheels':'rail','track-rollers':'track','steel-belt':'groove'
    };
    const gadgetMap={
      'stock-gadget':'deskfan','cooling-fan':'fan','rocket-pack':'rockets','ram-plough':'plough','exhaust-array':'exhaust',
      'aero-kit':'wing','tubular-brace':'handle','bolt-armour':'armour','stability-fins':'fins','impact-foam':'tank'
    };
    return normalise({chassis:chassisMap[chassis?.id],engine:engineMap[engine?.id],tyres:tyreMap[tyres?.id],gadget:gadgetMap[gadget?.id]});
  }
  function project(p,view='garage'){
    // Eight deterministic camera steps let the cinematic pan naturally from
    // side profile to straight rear without requiring a real 3D engine.
    const orbit=typeof view==='string'?/^orbit-(\d)$/.exec(view):null;
    const q=orbit?Math.min(8,Number(orbit[1]))/8:null;
    const c=q===null?(CAMERA[view]||CAMERA.garage):{yaw:Math.PI/2+q*Math.PI/2,pitch:.14+q*.02};
    const sy=Math.sin(c.yaw),cy=Math.cos(c.yaw),sp=Math.sin(c.pitch),cp=Math.cos(c.pitch);
    const d=p[0]*sy+p[2]*cy;
    return [p[0]*cy-p[2]*sy,-p[1]*cp+d*sp,d*cp+p[1]*sp];
  }
  const add=(a,b)=>a.map((v,i)=>v+b[i]);
  function geometry(input={},phase=0,{comboBodywork=true}={}){
    const m=normalise(input),out=[],recipe=G.resolve(m);
    const form=comboBodywork&&recipe?recipe.id:null;
    // Every component contributes primitives with its own slot ownership. The
    // rasteriser resolves depth per pixel, including long/intersecting faces.
    let slot='chassis';
    function face(pts,fill=PALETTE.mid,stroke=PALETTE.ink,width=1){out.push({pts,fill,stroke,width,slot});}
    function path(pts,stroke=PALETTE.ink,width=1){out.push({pts,fill:null,stroke,width,open:true,slot});}
    function box(x,y,z,w,h,d,colour=PALETTE.mid){
      const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];
      const up=p=>[p[0],p[1]+h,p[2]];
      face([a,b,c,e],PALETTE.deep);face([a,b,up(b),up(a)],PALETTE.dark);
      face([b,c,up(c),up(b)],colour);face([c,e,up(e),up(c)],colour);face([e,a,up(a),up(e)],PALETTE.dark);
      face([up(a),up(b),up(c),up(e)],PALETTE.light);
    }
    function ringPoint(center,r,angle,axis){
      const c=Math.cos(angle)*r,s=Math.sin(angle)*r;
      return add(center,axis==='x'?[0,c,s]:axis==='y'?[c,0,s]:[c,s,0]);
    }
    function circle(center,r,axis,fill=PALETTE.mid,n=18,stroke=PALETTE.ink){
      face(Array.from({length:n},(_,i)=>ringPoint(center,r,i/n*Math.PI*2,axis)),fill,stroke,.8);
    }
    function cylinder(center,r,len,axis='z',col=PALETTE.mid,n=16,r2=r,cap=true){
      const v=axis==='x'?[len/2,0,0]:axis==='y'?[0,len/2,0]:[0,0,len/2];
      const a=add(center,v.map(x=>-x)),b=add(center,v);
      for(let i=0;i<n;i++){
        const t=i/n*Math.PI*2,u=(i+1)/n*Math.PI*2;
        const rubber=col===PALETTE.deep||col===PALETTE.ink;
        const shade=Math.sin((t+u)/2)>.42?(rubber?PALETTE.dark:PALETTE.light):Math.sin((t+u)/2)<-.4?(rubber?PALETTE.ink:PALETTE.dark):col;
        face([ringPoint(a,r,t,axis),ringPoint(a,r,u,axis),ringPoint(b,r2,u,axis),ringPoint(b,r2,t,axis)],shade,null);
      }
      if(cap){circle(a,r,axis,col,n);circle(b,r2,axis,col,n);}
    }
    function pipe(a,b,r=.045,col=PALETTE.light){
      // A rounded screen stroke plus its ink outline is enough for small pipes.
      path([a,b],PALETTE.ink,r*70);path([a,b],col,r*43);
    }
    const long=m.chassis==='needle',longbody=m.chassis==='longbody',heavy=m.chassis==='brick',gt=m.chassis==='gt',wagon=m.chassis==='wagon',hauler=m.chassis==='hauler',tub=m.chassis==='tub',pod=m.chassis==='pod';
    const bodyW=pod?1.02:tub?.94:hauler?1.06:longbody?.82:heavy?1.0:gt?.91:wagon?.90:.68,front=pod?1.72:tub?1.62:hauler?2.06:longbody?1.96:long?2.35:heavy?1.65:wagon?1.50:1.35,back=pod?-1.62:tub?-1.46:hauler?-1.78:longbody?-1.76:long?-1.65:wagon?-1.48:-1.28;
    const radius=m.tyres==='monster'?.91:m.tyres==='spokes'?.53:m.tyres==='balloon'?.76:m.tyres==='speed'?.45:m.tyres==='bone'?.80:m.tyres==='rail'?.66:m.tyres==='track'?.72:.47;
    const tyreWidth=m.tyres==='spokes'?.12:m.tyres==='monster'?.56:m.tyres==='balloon'?.76:m.tyres==='speed'?.24:m.tyres==='bone'?.60:m.tyres==='rail'?.24:m.tyres==='track'?.52:.30;
    // Keep the inner tyre sidewall clear of plated / flared chassis sides.
    // This is cosmetic track width, not the gameplay's weight or grip.
    const bodyOuter=bodyW+(pod?.08:tub?.13:hauler?.10:longbody?.08:heavy?.14:wagon?.14:long?.03:.075);
    const deck=radius+.09+(pod?.04:tub?.08:hauler?.11:longbody?.10:heavy?.2:wagon?.13:0),axle=Math.max(bodyW+(m.tyres==='balloon'?.45:.29),bodyOuter+tyreWidth/2+.06);
    // Attachment coordinates are derived once from the chassis and tyres.
    const mounts={deck,engine:[0,deck+.10,pod?.22:long?.68:longbody?.46:hauler?.64:tub?.12:.47],gadget:[.36,deck+.97,back+.05],frontAxle:front-.13,rearAxle:back+.07,axle,bodyOuter,tyreWidth};
    slot='chassis';
    for(const s of [-1,1])box(s*(bodyW-.09),deck, (front+back)/2,.12,.16,front-back+.22,PALETTE.dark);
    for(const z of [back+.07,front-.13])pipe([-axle-.05,radius,z],[axle+.05,radius,z],.085,PALETTE.mid);
    box(0,deck+.05,(front+back)/2,bodyW*2,.12,front-back,PALETTE.dark);
    if(long){
      const y=deck+.12;
      face([[-bodyW,y,back],[bodyW,y,back],[.49,y,.9],[.12,y,front+.62],[-.12,y,front+.62],[-.49,y,.9]],PALETTE.mid);
      face([[bodyW,y,back],[.49,y,.9],[.12,y,front+.62],[.08,y+.32,front+.25],[.36,y+.44,.7],[bodyW,y+.44,back]],PALETTE.dark);
      face([[-bodyW,y,back],[-.49,y,.9],[-.12,y,front+.62],[-.08,y+.32,front+.25],[-.36,y+.44,.7],[-bodyW,y+.44,back]],PALETTE.mid);
      face([[-.08,y+.32,front+.25],[.08,y+.32,front+.25],[.36,y+.44,.7],[-.36,y+.44,.7]],PALETTE.light);
      face([[-bodyW,y+.44,back],[bodyW,y+.44,back],[.36,y+.44,.7],[-.36,y+.44,.7]],PALETTE.pale);
      path([[0,y+.46,.8],[0,y+.36,front+.2]],PALETTE.dark,1.7);
    }else if(longbody){
      const y=deck+.10;
      face([[-bodyW,y,back],[bodyW,y,back],[bodyW*.90,y,.66],[bodyW*.70,y,front-.12],[-bodyW*.70,y,front-.12],[-bodyW*.90,y,.66]],PALETTE.mid);
      face([[bodyW,y,back],[bodyW*.90,y,.66],[bodyW*.70,y,front-.12],[bodyW*.38,y+.34,front+.20],[bodyW*.52,y+.54,.46],[bodyW*.74,y+.58,back+.04]],PALETTE.dark);
      face([[-bodyW,y,back],[-bodyW*.90,y,.66],[-bodyW*.70,y,front-.12],[-bodyW*.38,y+.34,front+.20],[-bodyW*.52,y+.54,.46],[-bodyW*.74,y+.58,back+.04]],PALETTE.mid);
      face([[-bodyW*.38,y+.34,front+.20],[bodyW*.38,y+.34,front+.20],[bodyW*.52,y+.54,.46],[-bodyW*.52,y+.54,.46]],PALETTE.light);
      face([[-bodyW*.54,y+.56,back+.12],[bodyW*.54,y+.56,back+.12],[bodyW*.52,y+.54,.46],[-bodyW*.52,y+.54,.46]],PALETTE.pale);
      // Recessed central tub so the chassis already feels like something with a body.
      face([[-.26,y+.44,.24],[.26,y+.44,.24],[.20,y+.72,-.16],[-.20,y+.72,-.16]],PALETTE.ink,PALETTE.dark,.82);
      face([[-.18,y+.70,.26],[.18,y+.70,.26],[.14,y+.82,.36],[-.14,y+.82,.36]],PALETTE.paper,PALETTE.dark,.72);
      face([[-.14,y+.46,-.32],[.14,y+.46,-.32],[.18,y+.64,-.52],[-.18,y+.64,-.52]],PALETTE.dark,PALETTE.ink,.72);
      path([[0,y+.58,.56],[0,y+.48,front-.02]],PALETTE.dark,1.3);
    }else if(heavy||gt){
      for(const s of [-1,1]){
        box(s*bodyW,deck+.14,(front+back)/2,.15,heavy?.65:.4,front-back+.1,heavy?PALETTE.dark:PALETTE.mid);
        if(heavy)for(const z of [back+.15,0,front-.2])box(s*(bodyW+.08),deck+.17,z,.12,.54,.48,PALETTE.mid);
      }
      box(0,deck-.06,front+.12,bodyW*2+.3,heavy?.36:.17,.21,PALETTE.mid);
      box(0,deck+.12,back,bodyW*1.9,.3,.18,PALETTE.mid);
      if(gt){for(const s of [-1,1])pipe([s*bodyW,deck+.45,back+.3],[s*bodyW,deck+1.25,back+.3],.055);pipe([-bodyW,deck+1.25,back+.3],[bodyW,deck+1.25,back+.3],.055);}
    }else if(pod){
      // Low generic pod platform: broad, shallow and reusable without already
      // looking like a spaceship before a combo completes.
      const y=deck+.08;
      face([[-.72,y,back],[.72,y,back],[.92,y,.18],[.62,y,front],[-.62,y,front],[-.92,y,.18]],PALETTE.mid,PALETTE.dark,.82);
      for(const side of [-1,1]){
        face([[side*.72,y,back],[side*.92,y,.18],[side*.62,y,front],[side*.50,y+.32,front-.18],[side*.72,y+.38,.12],[side*.62,y+.34,back+.10]],side<0?PALETTE.dark:PALETTE.pale,PALETTE.dark,.78);
      }
      face([[-.50,y+.32,front-.18],[.50,y+.32,front-.18],[.72,y+.38,.12],[-.72,y+.38,.12]],PALETTE.light,PALETTE.dark,.76);
      face([[-.62,y+.34,back+.10],[.62,y+.34,back+.10],[.72,y+.38,.12],[-.72,y+.38,.12]],PALETTE.pale,PALETTE.dark,.74);
      face([[-.28,y+.36,.32],[.28,y+.36,.32],[.22,y+.62,-.16],[-.22,y+.62,-.16]],PALETTE.ink,PALETTE.dark,.76);
    }else if(tub){
      // Low-sided bathtub-like industrial chassis. The base part is deliberately
      // odd but not a tank by itself: open middle, blunt nose, exposed rails.
      for(const side of [-1,1]){
        const x=side*bodyW;
        face([[x,deck+.10,back],[x,deck+.10,front-.12],[side*(bodyW+.16),deck+.56,front-.28],[side*(bodyW+.20),deck+.62,back+.16]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.ink,.85);
        pipe([side*(bodyW+.20),deck+.62,back+.16],[side*(bodyW+.16),deck+.56,front-.28],.05,PALETTE.pale);
        for(const z of [back+.30,-.34,.46,front-.42])circle([side*(bodyW+.18),deck+.36,z],.045,'x',PALETTE.light,8);
      }
      box(0,deck+.02,(front+back)/2,bodyW*1.94,.14,front-back-.10,PALETTE.dark);
      box(0,deck+.08,front+.02,bodyW*2.18,.28,.30,PALETTE.pale);
      box(0,deck+.10,back+.04,bodyW*1.82,.34,.26,PALETTE.mid);
      // Slightly crooked central spine and tiny front crash bar preserve racer DNA.
      path([[-.18,deck+.20,back+.34],[.12,deck+.26,.18],[-.10,deck+.20,front-.34]],PALETTE.pale,2.2);
      pipe([-.72,deck+.14,front+.22],[.72,deck+.14,front+.22],.06,PALETTE.light);
    }else if(hauler){
      // Neutral long industrial chassis. It reads as a hauler frame on its own,
      // then later resolves into either a cartoon truck or a monster truck.
      for(const side of [-1,1]){
        const x=side*bodyW;
        box(x,deck+.10,(front+back)/2,.16,.26,front-back+.45,PALETTE.dark);
        path([[side*(bodyW+.10),deck+.34,back+.18],[side*(bodyW+.10),deck+.22,1.05]],PALETTE.dark,.95);
      }
      box(0,deck+.03,front+.14,bodyW*2+.32,.22,.32,PALETTE.pale);
      box(0,deck+.04,.06,bodyW*2.06,.14,1.10,PALETTE.mid);
      box(0,deck+.10,back+.22,bodyW*1.78,.26,.70,PALETTE.dark);
      for(const z of [front-.30,.38,back+.28])for(const side of [-1,1])circle([side*(bodyW+.10),deck+.30,z],.05,'x',PALETTE.light,10);
      for(const side of [-1,1])pipe([side*.56,deck+.24,back+.02],[side*.92,deck+1.00,back-.26],.05,PALETTE.pale);
      pipe([-.92,deck+1.00,back-.26],[.92,deck+1.00,back-.26],.05,PALETTE.light);
    }else if(wagon){
      // A flared wagon body and open, skewed canopy remain part of the chassis.
      // There is no baked-in engine, wheel set or gadget in this silhouette.
      for(const side of [-1,1]){
        const x=side*bodyW,top=side*(bodyW+.13);
        face([[x,deck+.15,back],[x,deck+.15,front-.18],[top,deck+.64,front-.18],[top,deck+.80,back]],side>0?PALETTE.mid:PALETTE.dark);
        pipe([top,deck+.80,back],[top,deck+.64,front-.18],.055,PALETTE.light);
        for(const z of [back+.24,-.35,.55]){
          pipe([x,deck+.18,z],[top,deck+.70,z],.035,PALETTE.pale);
          circle([top+side*.012,deck+.52,z],.04,'x',PALETTE.ink,8);
        }
        // Tall rear canopy stays behind the engine mount, leaving an open cab.
        pipe([side*.74,deck+.22,back+.30],[side*.85+.09,deck+1.43,back+.30],.055,PALETTE.dark);
        pipe([side*.74,deck+.22,-.58],[side*.85+.09,deck+1.43,-.58],.055,PALETTE.dark);
      }
      box(0,deck+.18,back,bodyW*2,.45,.12,PALETTE.mid);
      for(const x of [-.55,0,.55])box(x,deck+.19,back-.071,.035,.40,.022,PALETTE.dark);
      // Broad bent roof: four facets, not an opaque block around the cockpit.
      const roof=[[-1.04,1.39],[-.53,1.66],[.12,1.75],[.74,1.64],[1.10,1.40]];
      for(let i=0;i<roof.length-1;i++){
        const [x,y]=roof[i],[xx,yy]=roof[i+1];
        face([[x,deck+y,back+.16],[xx,deck+yy,back+.16],[xx,deck+yy,-.50],[x,deck+y,-.50]],i<2?PALETTE.pale:PALETTE.mid);
      }
      for(const z of [back+.16,-.50])path(roof.map(([x,y])=>[x,deck+y,z]),PALETTE.ink,1.5);
      box(0,deck+.03,front+.08,bodyW*2+.2,.22,.22,PALETTE.pale);
    }else{
      for(const s of [-1,1]){
        box(s*bodyW,deck+.12,-.18,.13,.29,1.85,PALETTE.mid);
        path([[s*(bodyW+.07),deck+.32,-.9],[s*(bodyW+.07),deck+.21,.65]],PALETTE.dark,.8);
        for(const z of [-.85,.2,.65])circle([s*(bodyW+.075),deck+.28,z],.035,'x',PALETTE.light,8);
      }
      box(0,deck+.04,front+.05,bodyW*2+.12,.18,.22,PALETTE.pale);
    }
    // Seat and cockpit belong to the body, never the engine or gadget artwork.
    box(0,deck+.15,-.64,.61,.14,.54,PALETTE.dark);
    box(0,deck+.26,-.93,.63,.65,.14,PALETTE.mid);
    for(const x of [-.2,0,.2])path([[x,deck+.32,-.847],[x,deck+.84,-.847]],PALETTE.dark,.75);
    pipe([-.28,deck+.4,-.3],[-.28,deck+.84,-.1],.03);
    circle([-.28,deck+.88,-.08],.17,'z',PALETTE.deep,16);
    circle([-.28,deck+.88,-.069],.12,'z',PALETTE.pale,16);
    if(!form){
    // A small chassis-owned rear body panel unifies the open frame. It stays
    // below the engine and gadget, and behind the separate wheels. No part is
    // hidden by a generic full-car sprite. Shapes differ with the frame.
    const rearFaceZ=back-.135;
    const fasciaW=bodyW*(pod?1.04:heavy?1.16:hauler?1.14:wagon?1.12:tub?1.13:long?.92:1.03);
    const fasciaBottom=deck-.085;
    const fasciaTop=deck+(heavy?.43:hauler?.34:tub?.38:wagon?.36:gt?.31:pod?.25:.23);
    const inset=fasciaW*(pod?.10:long?.17:hauler?.04:tub?.035:.075);
    face([[-fasciaW,fasciaBottom,rearFaceZ],[fasciaW,fasciaBottom,rearFaceZ],
      [fasciaW-inset,fasciaTop,rearFaceZ],[-fasciaW+inset,fasciaTop,rearFaceZ]],PALETTE.mid,PALETTE.ink,1.2);
    // Chunky tail shelf and readable lights are part of the frame, not stickers
    // floating over the composited car. Red survives the slot-colour remap.
    face([[-fasciaW+inset,fasciaTop,rearFaceZ-.009],[fasciaW-inset,fasciaTop,rearFaceZ-.009],
      [fasciaW-inset-.06,fasciaTop+.07,rearFaceZ+.03],[-fasciaW+inset+.06,fasciaTop+.07,rearFaceZ+.03]],PALETTE.pale,PALETTE.dark,.8);
    for(const side of [-1,1]){
      const x=side*(fasciaW*.73),z=rearFaceZ-.016;
      face([[x-.18,fasciaTop-.07,z],[x+.18,fasciaTop-.07,z],
        [x+.17,fasciaTop+.065,z],[x-.17,fasciaTop+.065,z]],'#e2694b',PALETTE.ink,.75);
      face([[x-.12,fasciaTop-.036,z-.006],[x+.04,fasciaTop-.036,z-.006],
        [x+.04,fasciaTop+.015,z-.006],[x-.12,fasciaTop+.015,z-.006]],'#ffda91',null);
    }
    face([[-.18,fasciaBottom+.08,rearFaceZ-.019],[.18,fasciaBottom+.08,rearFaceZ-.019],
      [.18,fasciaBottom+.23,rearFaceZ-.019],[-.18,fasciaBottom+.23,rearFaceZ-.019]],PALETTE.paper,PALETTE.ink,.55);
    pipe([-fasciaW*.87,fasciaBottom-.055,rearFaceZ-.04],[fasciaW*.87,fasciaBottom-.055,rearFaceZ-.04],.045,PALETTE.dark);
    }
    // Four interchangeable wheels. Spoked wheels have genuinely open centres.
    slot='tyres';
    for(const rear of [false,true])for(const side of [-1,1]){
      const rr=radius*(rear&&m.tyres==='monster'?1.10:!rear&&m.tyres==='monster'?.89:1);
      const cx=side*axle,cy=rr,cz=rear?back+.07:front-.13;
      const width=m.tyres==='spokes'?.12:m.tyres==='monster'?.56:m.tyres==='balloon'?.76:m.tyres==='speed'?.24:m.tyres==='bone'?.60:m.tyres==='rail'?.24:m.tyres==='track'?.52:.30;
      const centre=[cx,cy,cz],capX=cx+side*width/2;
      if(m.tyres==='spokes'){
        const inner=rr*.85,n=20;
        for(let i=0;i<n;i++){
          const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;
          for(const sign of [-1,1]){
            const cc=[cx+sign*width/2,cy,cz];
            face([ringPoint(cc,rr,a,'x'),ringPoint(cc,rr,b,'x'),ringPoint(cc,inner,b,'x'),ringPoint(cc,inner,a,'x')],sign===side?PALETTE.mid:PALETTE.dark,PALETTE.ink,.55);
          }
          face([ringPoint([cx-width/2,cy,cz],rr,a,'x'),ringPoint([cx-width/2,cy,cz],rr,b,'x'),ringPoint([cx+width/2,cy,cz],rr,b,'x'),ringPoint([cx+width/2,cy,cz],rr,a,'x')],PALETTE.dark,null);
        }
        for(let i=0;i<10;i++){
          const a=i/10*Math.PI*2+phase*.32;
          path([[capX,cy,cz],ringPoint([capX,cy,cz],inner,a,'x')],PALETTE.light,1.15);
          path([[capX,cy,cz],ringPoint([capX,cy,cz],inner,a+.03,'x')],PALETTE.dark,.5);
        }
        cylinder(centre,.13,width+.08,'x',PALETTE.mid,12);
      }else if(m.tyres==='bone'){
        // Open-centred skeletal wheel: a structural bone rim and knuckled
        // spokes, not a decal on the monster tyre. Tread ribs wrap its width.
        const inner=rr*.58,outer=rr*.92,n=24;
        for(let j=0;j<n;j++){
          const a=j/n*Math.PI*2,b=(j+1)/n*Math.PI*2;
          for(const sign of [-1,1]){
            const cc=[cx+sign*width/2,cy,cz];
            face([ringPoint(cc,outer,a,'x'),ringPoint(cc,outer,b,'x'),ringPoint(cc,inner,b,'x'),ringPoint(cc,inner,a,'x')],j%4===0?PALETTE.mid:PALETTE.pale,PALETTE.ink,.55);
          }
          for(const r of [inner,outer])face([ringPoint([cx-width/2,cy,cz],r,a,'x'),ringPoint([cx-width/2,cy,cz],r,b,'x'),ringPoint([cx+width/2,cy,cz],r,b,'x'),ringPoint([cx+width/2,cy,cz],r,a,'x')],r===inner?PALETTE.dark:PALETTE.mid,null);
        }
        for(let j=0;j<12;j++){
          const a=j/12*Math.PI*2+phase*.14,b=a+.15;
          // Chevron-like vertebral ribs. Maximum radius is the nominal radius,
          // so tread and ground contact agree, including the static phase.
          for(const sign of [-1,1]){
            const c1=[cx,cy,cz],c2=[cx+sign*width*.52,cy,cz];
            face([ringPoint(c1,rr,a,'x'),ringPoint(c1,rr,b,'x'),ringPoint(c2,rr*.96,b+.18,'x'),ringPoint(c2,rr*.96,a+.18,'x')],j%3?PALETTE.light:PALETTE.pale,PALETTE.dark,.6);
            face([ringPoint(c1,outer,a,'x'),ringPoint(c1,rr,a,'x'),ringPoint(c2,rr*.96,a+.18,'x'),ringPoint(c2,outer,a+.18,'x')],PALETTE.dark,null);
          }
        }
        for(const sign of [-1,1]){
          const cc=[cx+sign*(width/2+.012),cy,cz];
          for(let j=0;j<6;j++){
            const a=j/6*Math.PI*2+phase*.14;
            const lo=ringPoint(cc,rr*.17,a,'x'),hi=ringPoint(cc,inner*.98,a+.11,'x');
            pipe(lo,hi,.065,PALETTE.light);
            for(const joint of [lo,hi])circle(joint,.062,'x',PALETTE.pale,8);
          }
          circle(cc,rr*.20,'x',PALETTE.mid,12);
          circle([cc[0]+sign*.012,cy,cz],rr*.095,'x',PALETTE.ink,10);
        }
      }else if(m.tyres==='rail'){
        // Compact steel drivers with a visible flange and coupling hub. These
        // are ordinary modular tyres first; the locomotive reveal later wraps
        // them into a fuller undercarriage.
        cylinder(centre,rr*.88,width,'x',PALETTE.dark,22,rr*.88,true);
        for(const sidewall of [-1,1]){
          const cc=[cx+sidewall*width/2,cy,cz];
          circle(cc,rr*.90,'x',PALETTE.mid,22);
          circle([cc[0]+sidewall*.012,cy,cz],rr*.78,'x',PALETTE.paper,20,PALETTE.light);
          circle([cc[0]+sidewall*.018,cy,cz],rr*.57,'x',PALETTE.dark,18);
          circle([cc[0]+sidewall*.028,cy,cz],rr*.15,'x',PALETTE.light,12);
          for(let j=0;j<6;j++){
            const a=j/6*Math.PI*2+phase*.06;
            pipe([cc[0]+sidewall*.018,cy,cz],ringPoint([cc[0]+sidewall*.018,cy,cz],rr*.54,a,'x'),.036,PALETTE.pale);
          }
        }
        for(let j=0;j<10;j++){
          const a=j/10*Math.PI*2+phase*.04,b=a+.12;
          const c1=[cx-width*.48,cy,cz],c2=[cx+width*.48,cy,cz];
          face([ringPoint(c1,rr*.98,a,'x'),ringPoint(c1,rr*.98,b,'x'),ringPoint(c2,rr*.95,b+.04,'x'),ringPoint(c2,rr*.95,a+.04,'x')],j%2?PALETTE.light:PALETTE.pale,PALETTE.dark,.5);
        }
      }else if(m.tyres==='track'){
        // Standalone roller assembly: still a tyre item, not yet a full tread.
        cylinder(centre,rr*.58,width,'x',PALETTE.dark,20);
        for(const sidewall of [-1,1]){
          const cc=[cx+sidewall*width/2,cy,cz];
          circle(cc,rr*.60,'x',PALETTE.mid,18);
          circle([cc[0]+sidewall*.012,cy,cz],rr*.30,'x',PALETTE.dark,14);
        }
        for(const dx of [-width*.28,0,width*.28]){
          cylinder([cx+dx,cy,cz],rr*.32,.05,'x',PALETTE.pale,12);
          circle([cx+dx+.01,cy,cz],rr*.11,'x',PALETTE.dark,10);
        }
        for(let j=0;j<12;j++){
          const a=j/12*Math.PI*2+phase*.05,b=a+.17;
          const c1=[cx-width*.52,cy,cz],c2=[cx+width*.52,cy,cz];
          face([ringPoint(c1,rr*.74,a,'x'),ringPoint(c1,rr*.74,b,'x'),ringPoint(c2,rr*.74,b,'x'),ringPoint(c2,rr*.74,a,'x')],j%2?PALETTE.dark:PALETTE.mid,PALETTE.ink,.45);
        }
      }else if(m.tyres==='speed'){
        // Low-profile speed tyre: narrow sidewall, smooth outer band and a more
        // precise race-wheel hub than the generic road wheel.
        cylinder(centre,rr*.96,width,'x',PALETTE.deep,22,rr*.93,true);
        for(const sidewall of [-1,1]){
          const cc=[cx+sidewall*width/2,cy,cz];
          circle(cc,rr*.86,'x',PALETTE.deep,22,PALETTE.dark);
          circle([cc[0]+sidewall*.010,cy,cz],rr*.64,'x',PALETTE.pale,18);
          circle([cc[0]+sidewall*.018,cy,cz],rr*.47,'x',PALETTE.mid,16);
          circle([cc[0]+sidewall*.028,cy,cz],rr*.15,'x',PALETTE.dark,12);
          for(let j=0;j<5;j++){
            const a=j/5*Math.PI*2+phase*.04;
            pipe([cc[0]+sidewall*.014,cy,cz],ringPoint([cc[0]+sidewall*.014,cy,cz],rr*.44,a,'x'),.028,PALETTE.light);
          }
        }
        for(let j=0;j<14;j++){
          const a=j/14*Math.PI*2+phase*.03,b=a+.08,ra=rr*.99;
          const c1=[cx-width*.49,cy,cz],c2=[cx+width*.49,cy,cz];
          face([ringPoint(c1,ra,a,'x'),ringPoint(c1,ra,b,'x'),ringPoint(c2,ra,b,'x'),ringPoint(c2,ra,a,'x')],j%2?PALETTE.dark:PALETTE.ink,null);
        }
      }else if(m.tyres==='balloon'){
        // Rounded cross-section, not a larger flat-sided monster wheel.
        const profile=[[-.5,.58],[-.43,.79],[-.26,.96],[0,1],[.26,.96],[.43,.79],[.5,.58]];
        for(let k=0;k<profile.length-1;k++)for(let j=0;j<20;j++){
          const [u,r1]=profile[k],[v,r2]=profile[k+1],a=j/20*Math.PI*2,b=(j+1)/20*Math.PI*2;
          const c1=[cx+u*width,cy,cz],c2=[cx+v*width,cy,cz];
          const shade=Math.cos((a+b)/2)>.35?PALETTE.dark:PALETTE.ink;
          face([ringPoint(c1,rr*r1,a,'x'),ringPoint(c1,rr*r1,b,'x'),ringPoint(c2,rr*r2,b,'x'),ringPoint(c2,rr*r2,a,'x')],shade,null);
        }
        for(const sidewall of [-1,1]){
          const cc=[cx+sidewall*width/2,cy,cz];
          circle(cc,rr*.58,'x',PALETTE.deep,20);
          circle([cc[0]+sidewall*.009,cy,cz],rr*.36,'x',PALETTE.pale,16);
          circle([cc[0]+sidewall*.018,cy,cz],rr*.21,'x',PALETTE.dark,14);
          circle([cc[0]+sidewall*.025,cy,cz],rr*.10,'x',PALETTE.light,10);
        }
        const seam=[cx+side*width*.41,cy,cz];
        path(Array.from({length:25},(_,i)=>ringPoint(seam,rr*.81,i/24*Math.PI*2,'x')),PALETTE.mid,.7);
      }else{
        cylinder(centre,rr,width,'x',PALETTE.deep,20);
        circle([capX+side*.012,cy,cz],rr*.59,'x',PALETTE.mid,20);
        circle([capX+side*.018,cy,cz],rr*.42,'x',PALETTE.dark,16);
        circle([capX+side*.027,cy,cz],rr*.17,'x',PALETTE.light,12);
        for(let j=0;j<6;j++)circle(ringPoint([capX+side*.025,cy,cz],rr*.48,j/6*Math.PI*2,'x'),.028,'x',PALETTE.light,6);
        if(m.tyres==='monster'||m.tyres==='groove')for(let j=0;j<12;j++){
          const a=j/12*Math.PI*2+phase*.10,b=a+.17,ra=rr+.02;
          const c1=[cx-width*.49,cy,cz],c2=[cx+width*.49,cy,cz];
          face([ringPoint(c1,ra,a,'x'),ringPoint(c1,ra,b,'x'),ringPoint(c2,ra,b+.08,'x'),ringPoint(c2,ra,a+.08,'x')],m.tyres==='monster'?PALETTE.dark:PALETTE.pale,PALETTE.ink,.65);
        }
      }
    }
    // Engine mounts and body are shared; each engine supplies separate geometry.
    slot='engine';
    const [ex,ey,ez]=mounts.engine;
    box(ex,ey,ez,.86,.14,1.1,PALETTE.dark);
    if(m.engine==='boiler'){
      const r=.63,by=ey+.75,bz=ez+.08;
      cylinder([0,by,bz],r,1.87,'z',PALETTE.mid,22);
      for(const z of [bz-.62,bz+.58]){
        cylinder([0,by,z],r+.035,.11,'z',PALETTE.pale,22);
        for(const offset of [-.055,.055])path(Array.from({length:29},(_,i)=>[Math.cos(i/28*Math.PI*2)*(r+.04),by+Math.sin(i/28*Math.PI*2)*(r+.04),z+offset]),PALETTE.dark,1.1);
      }
      // A few structural seams survive reduction better than surface noise.
      for(const a of [.18,2.75])path([[Math.cos(a)*(r+.015),by+Math.sin(a)*(r+.015),bz-.88],[Math.cos(a)*(r+.015),by+Math.sin(a)*(r+.015),bz+.88]],PALETTE.dark,.85);
      circle([0,by,bz+.948],r*.9,'z',PALETTE.dark,22);
      circle([0,by,bz+.957],r*.70,'z',PALETTE.mid,22);
      circle([0,by,bz+.965],.15,'z',PALETTE.dark,14);
      for(let i=0;i<10;i++)circle([Math.cos(i/10*Math.PI*2)*r*.79,by+Math.sin(i/10*Math.PI*2)*r*.79,bz+.974],.034,'z',PALETTE.light,7);
      // Tall stack, top rim, dome and pressure gauge give a readable rear profile.
      cylinder([0,by+r+.44,bz+.39],.155,.91,'y',PALETTE.dark,14);
      cylinder([0,by+r+.89,bz+.39],.215,.10,'y',PALETTE.mid,16);
      circle([0,by+r+.947,bz+.39],.16,'y',PALETTE.ink,16);
      cylinder([0,by+r+.09,bz-.51],.23,.25,'y',PALETTE.mid,14);
      pipe([-.42,by+.46,bz+.1],[-.64,by+.91,bz+.12],.033);
      circle([-.64,by+.94,bz+.14],.18,'z',PALETTE.ink,18);
      circle([-.64,by+.94,bz+.151],.145,'z',PALETTE.paper,18);
      path([[-.64,by+.94,bz+.16],[-.68,by+1.02,bz+.16]],PALETTE.ink,1.2);
      for(const s of [-1,1]){
        pipe([s*.56,ey+.17,bz+.72],[s*.76,ey+.17,bz+.72],.065);
        pipe([s*.76,ey+.17,bz+.72],[s*.76,by+.10,bz+.72],.065);
        pipe([s*.76,by+.10,bz+.72],[s*.57,by+.10,bz+.72],.065);
      }
      // Short discrete puffs are cosmetic. Static/reduced-motion uses phase 0.
      for(let i=0;i<3;i++){
        const y=by+r+1.10+i*.19,xx=.08+i*.12+(phase%4)*.015;
        const pts=Array.from({length:12},(_,j)=>[xx+Math.cos(j/12*Math.PI*2)*(.13+i*.035),y+Math.sin(j/12*Math.PI*2)*(.085+i*.025),bz+.39]);
        face(pts,PALETTE.pale,null);out[out.length-1].effect=true;
      }
    }else if(m.engine==='v8'){
      box(0,ey+.14,ez,.85,.45,1.02,PALETTE.dark);
      for(const s of [-1,1]){
        box(s*.38,ey+.50,ez,.43,.20,1.13,PALETTE.mid);
        for(let i=0;i<4;i++){
          const z=ez-.42+i*.28;
          cylinder([s*.58,ey+.48,z],.105,.28,'x',PALETTE.pale,10);
          pipe([s*.66,ey+.46,z],[s*.86,ey+.22,z-.12],.05);
          pipe([s*.86,ey+.22,z-.12],[s*.9,ey+.22,z-.40],.05);
        }
        cylinder([s*.90,ey+.22,ez-.62],.11,.55,'z',PALETTE.mid,12);
        circle([s*.90,ey+.22,ez-.905],.074,'z',PALETTE.ink,12);
      }
      box(0,ey+.72,ez,.56,.18,.66,PALETTE.dark);
      box(0,ey+.90,ez+.04,.70,.25,.48,PALETTE.pale);
      for(const x of [-.22,0,.22])circle([x,ey+1.02,ez+.287],.088,'z',PALETTE.ink,12);
      cylinder([0,ey+.4,ez+.54],.24,.08,'z',PALETTE.mid,18);
      circle([0,ey+.4,ez+.59],.14,'z',PALETTE.dark,16);
    }else if(m.engine==='race'){
      // Compact open-wheel engine: narrower than the V8, with a visible plenum
      // and intake trumpets that still read cleanly in the retro renderer.
      box(0,ey+.18,ez,.74,.34,.84,PALETTE.dark);
      box(0,ey+.48,ez+.04,.58,.18,.58,PALETTE.mid);
      for(const x of [-.18,0,.18])cylinder([x,ey+.74,ez+.06],.08,.22,'y',PALETTE.pale,10);
      box(0,ey+.86,ez+.02,.44,.16,.34,PALETTE.pale);
      circle([0,ey+.94,ez+.17],.09,'z',PALETTE.ink,12);
      for(const side of [-1,1]){
        pipe([side*.28,ey+.32,ez-.22],[side*.52,ey+.20,ez-.46],.045,PALETTE.mid);
        pipe([side*.52,ey+.20,ez-.46],[side*.56,ey+.20,ez-.74],.045,PALETTE.mid);
        for(const z of [ez-.20,ez+.10])cylinder([side*.42,ey+.48,z],.08,.18,'x',PALETTE.pale,10);
      }
      box(0,ey+.12,ez-.36,.52,.10,.34,PALETTE.mid);
    }else if(m.engine==='rocket'){
      cylinder([0,ey+.50,ez],.42,1.45,'z',PALETTE.pale,18);
      cylinder([0,ey+.50,ez-.92],.30,.42,'z',PALETTE.dark,18,.48);
      circle([0,ey+.50,ez-1.14],.23,'z',PALETTE.ink,18);
      for(const s of [-1,1])face([[s*.37,ey+.5,ez-.45],[s*.78,ey+.28,ez-.78],[s*.37,ey+.28,ez+.28]],PALETTE.mid);
      cylinder([0,ey+.5,ez+.84],.37,.26,'z',PALETTE.mid,18,.08);
    }else if(m.engine==='diesel'){
      // Heavy industrial diesel: compact, ugly, and mechanically obvious. It
      // stays reusable outside the Tank and never becomes a hidden hull block.
      box(0,ey+.16,ez,.92,.58,.92,PALETTE.dark);
      box(0,ey+.52,ez+.02,.80,.40,.78,PALETTE.mid);
      for(const side of [-1,1]){
        cylinder([side*.52,ey+.46,ez+.05],.25,.18,'x',PALETTE.pale,16);
        circle([side*.62,ey+.46,ez+.05],.12,'x',PALETTE.dark,12);
        pipe([side*.42,ey+.32,ez-.30],[side*.72,ey+.62,ez-.50],.055,PALETTE.light);
      }
      // Giant flywheel / belt case on one side gives the motor asymmetry.
      cylinder([-.58,ey+.42,ez+.30],.34,.12,'x',PALETTE.mid,18);
      circle([-.66,ey+.42,ez+.30],.22,'x',PALETTE.ink,16);
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;path([[-.67,ey+.42,ez+.30],[-.67,ey+.42+Math.sin(a)*.20,ez+.30+Math.cos(a)*.20]],PALETTE.pale,.9);}
      // Tall intake and stubby rear exhaust.
      pipe([.24,ey+.64,ez-.20],[.24,ey+1.24,ez-.38],.075,PALETTE.pale);
      cylinder([.24,ey+1.34,ez-.41],.12,.20,'y',PALETTE.mid,12,.08);
      pipe([-.28,ey+.42,ez-.44],[-.44,ey+.62,ez-.78],.07,PALETTE.dark);
      cylinder([-.44,ey+.68,ez-.86],.105,.30,'z',PALETTE.pale,12,.07);
    }else if(m.engine==='twin'){
      // Compact paired-cylinder engine family. It is deliberately generic on its
      // own, then becomes a prop-plane nose unit in the completed aircraft gag.
      cylinder([0,ey+.44,ez+.28],.26,.52,'z',PALETTE.mid,18);
      circle([0,ey+.44,ez+.56],.18,'z',PALETTE.dark,16);
      for(const side of [-1,1]){
        box(side*.34,ey+.50,ez+.16,.26,.22,.44,side<0?PALETTE.dark:PALETTE.mid);
        for(const z of [ez+.02,ez+.30])cylinder([side*.48,ey+.50,z],.08,.24,'x',PALETTE.pale,10);
        pipe([side*.44,ey+.44,ez-.04],[side*.64,ey+.32,ez-.24],.036,PALETTE.dark);
      }
      box(0,ey+.70,ez+.04,.34,.14,.28,PALETTE.pale);
      cylinder([0,ey+.44,ez+.72],.07,.22,'z',PALETTE.light,12);
      circle([0,ey+.44,ez+.84],.05,'z',PALETTE.ink,10);
    }else if(m.engine==='inline4'){
      // Upright vintage inline-four. Broad enough for old-car gags, generic
      // enough to remain useful outside the House recipe.
      box(0,ey+.22,ez,.64,.34,.88,PALETTE.dark);
      for(let i=0;i<4;i++){
        const z=ez-.30+i*.20;
        cylinder([0,ey+.58,z],.12,.42,'x',i%2?PALETTE.pale:PALETTE.mid,12);
        circle([.23,ey+.58,z],.065,'x',PALETTE.dark,10);
      }
      box(0,ey+.78,ez,.54,.16,.72,PALETTE.pale);
      cylinder([-.22,ey+.48,ez-.50],.09,.36,'z',PALETTE.mid,12);
      cylinder([.22,ey+.48,ez-.50],.09,.36,'z',PALETTE.mid,12);
      for(const side of [-1,1])pipe([side*.30,ey+.44,ez+.28],[side*.46,ey+.24,ez+.04],.034,PALETTE.light);
    }else if(m.engine==='reactor'){
      cylinder([0,ey+.55,ez],.57,.8,'y',PALETTE.mid,20);
      for(const y of [ey+.22,ey+.44,ey+.66,ey+.90])cylinder([0,y,ez],.62,.055,'y',PALETTE.pale,20);
      cylinder([0,ey+1.02,ez],.24,.2,'y',PALETTE.dark,16);
    }else{
      box(0,ey+.14,ez,.63,.42,.62,PALETTE.mid);
      cylinder([0,ey+.65,ez],.33,.11,'y',PALETTE.pale,16);
      cylinder([0,ey+.37,ez+.33],.22,.12,'z',PALETTE.dark,16);
      pipe([.31,ey+.25,ez],[.51,ey+.48,ez],.05);
      pipe([.51,ey+.48,ez],[.51,ey+.77,ez],.05);
    }
    slot='gadget';
    const gz=back-.10;
    if(['fan','deskfan'].includes(m.gadget)){
      // Keep the full-size fan recognisable, but mount it on a rear-side
      // outrigger instead of painting it directly over the central engine.
      // This is ordinary modular art; exact gag models remain WIP/unchanged.
      const small=m.gadget==='deskfan',r=small?.35:.61;
      const x=small?.4:.78,y=deck+(small?.54:1.06),z=gz;
      for(const s of [-1,1]){
        const rootX=small?x+s*r*.72:Math.max(-bodyW*.78,Math.min(bodyW*.78,x+s*r*.72));
        pipe([rootX,deck+.12,z+.1],[x+s*r*.5,y-r*.6,z],.045);
      }
      box(x,deck+.04,z,r*1.6,.12,.36,PALETTE.dark);
      cylinder([x,y,z+.10],r*.24,.42,'z',PALETTE.dark,16);
      // Blade faces sit behind the open front cage, not an opaque fan sprite.
      for(let j=0;j<4;j++){
        const a=j/4*Math.PI*2+phase*Math.PI/8;
        const pts=[[.13,a],[r*.83,a+.18],[r*.91,a+.56],[r*.56,a+.91],[.12,a+.55]].map(([rr,aa])=>[x+rr*Math.cos(aa),y+rr*Math.sin(aa),z-.05]);
        face(pts,j%2?PALETTE.mid:PALETTE.pale,PALETTE.ink,.85);
      }
      for(const ring of [1,.89]){
        const pts=Array.from({length:33},(_,j)=>[x+r*ring*Math.cos(j/32*Math.PI*2),y+r*ring*Math.sin(j/32*Math.PI*2),z-.14]);
        path(pts,PALETTE.ink,ring===1?2.7:1.1);
        if(ring===1)path(pts,PALETTE.pale,.9);
      }
      for(let j=0;j<10;j++){
        const a=j/10*Math.PI*2;
        path([[x,y,z-.15],[x+r*Math.cos(a),y+r*Math.sin(a),z-.15]],PALETTE.ink,1.15);
      }
      circle([x,y,z-.17],r*.14,'z',PALETTE.light,16);
      circle([x,y,z-.18],r*.055,'z',PALETTE.dark,12);
    }else if(m.gadget==='rockets'){
      box(0,deck+.13,gz,.95,.12,.55,PALETTE.dark);
      for(const s of [-1,1]){
        const x=s*.40,y=deck+1.16,z=gz;
        pipe([x,deck+.24,gz],[x,y-.18,gz],.065);
        pipe([x,deck+.24,gz+.35],[x,y-.18,gz+.20],.045);
        cylinder([x,y,z],.22,1.00,'z',PALETTE.light,16);
        cylinder([x,y,z+.60],.22,.2,'z',PALETTE.mid,16,.025);
        cylinder([x,y,z-.59],.16,.19,'z',PALETTE.dark,16,.26);
        circle([x,y,z-.70],.14,'z',PALETTE.ink,16);
        face([[x+s*.19,y,z-.1],[x+s*.46,y-.18,z-.48],[x+s*.19,y-.18,z+.16]],PALETTE.mid);
        for(const z2 of [z-.23,z+.21])cylinder([x,y,z2],.231,.045,'z',PALETTE.dark,16);
      }
    }else if(m.gadget==='plough'){
      // One reusable toothed blade. It can read as a cowcatcher or lower jaw,
      // but the component itself does not depend on a recipe match.
      const half=axle+tyreWidth/2+.16;
      const low=Math.max(.14,deck-.40),high=deck+.43,tip=front+.88,edge=front+.35;
      for(const side of [-1,1]){
        pipe([side*bodyW*.72,deck+.08,front-.32],[side*half*.68,deck+.05,edge],.09,PALETTE.dark);
        pipe([0,high,tip-.18],[side*half,high,edge-.18],.09,PALETTE.light);
        pipe([0,low+.08,tip],[side*half,low+.08,edge],.10,PALETTE.dark);
        // Separate tapered blade segments keep real gaps between their ribs.
        for(let j=0;j<4;j++){
          const u0=j/4+.025,u1=(j+1)/4-.025;
          const z0=tip+(edge-tip)*u0,z1=tip+(edge-tip)*u1;
          const x0=side*half*u0,x1=side*half*u1;
          face([[x0,low,z0+.08],[x1,low,z1+.08],[x1,high,z1-.18],[x0,high,z0-.18]],side<0?PALETTE.pale:PALETTE.mid);
          const mx=(x0+x1)/2,mz=(z0+z1)/2;
          // Cast points make the blade deliberately cartoonish, not a weapon.
          face([[x0,high,z0-.18],[x1,high,z1-.18],[mx,high+.20,mz-.11]],PALETTE.light,PALETTE.dark,.8);
          path([[mx,low+.09,mz+.05],[mx,high-.07,mz-.17]],PALETTE.dark,.9);
        }
        pipe([side*half*.94,high,edge-.17],[side*half*.94,deck+.92,edge-.17],.045,PALETTE.dark);
        cylinder([side*half*.94,deck+.92,edge-.17],.095,.14,'y',PALETTE.pale,10);
      }
    }else if(m.gadget==='exhaust'){
      // Rear side rails support two banks of three visibly staggered stacks.
      // Entire assembly belongs to the gadget, independent of the engine.
      for(const side of [-1,1]){
        const x=side*(bodyW+.10);
        box(x,deck+.12,back+.38,.27,.17,1.0,PALETTE.dark);
        for(let i=0;i<3;i++){
          const z=back+.04+i*.34,height=1.08+i*.43,r=.12;
          pipe([side*(bodyW-.1),deck+.16,z],[x,deck+.26,z],.065,PALETTE.mid);
          cylinder([x,deck+.22+height/2,z],r,height,'y',PALETTE.pale,12);
          cylinder([x,deck+.22+height,z],r*1.35,.15,'y',PALETTE.mid,12);
          circle([x,deck+.30+height,z],r*.94,'y',PALETTE.ink,12);
          cylinder([x,deck+.49,z],r*1.12,.07,'y',PALETTE.dark,12);
        }
        pipe([x,deck+.77,back-.04],[x,deck+.77,back+.83],.035,PALETTE.dark);
      }
    }else if(m.gadget==='wing'){
      // Neutral reusable aero kit. Keep it low and compact so full gag forms
      // can build their own silhouette without a giant donor spoiler poking out.
      const frontZ=front+.70,rearZ=back-.02;
      box(0,deck+.07,frontZ,.92,.05,.18,PALETTE.pale);
      face([[-.46,deck+.09,frontZ-.10],[.46,deck+.09,frontZ-.10],[.36,deck+.15,frontZ+.04],[-.36,deck+.15,frontZ+.04]],PALETTE.light,PALETTE.dark,.68);
      for(const side of [-1,1]){
        face([[side*.42,deck+.06,frontZ-.10],[side*.52,deck+.12,frontZ-.08],[side*.48,deck+.24,frontZ+.04],[side*.38,deck+.16,frontZ+.02]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.62);
        pipe([side*.34,deck+.16,rearZ+.02],[side*.38,deck+.52,rearZ-.04],.032,PALETTE.pale);
      }
      box(0,deck+.54,rearZ-.06,.90,.07,.20,PALETTE.dark);
      face([[-.45,deck+.59,rearZ-.14],[.45,deck+.59,rearZ-.14],[.38,deck+.66,rearZ+.02],[-.38,deck+.66,rearZ+.02]],PALETTE.pale,PALETTE.dark,.65);
    }else if(m.gadget==='tank'){
      cylinder([0,deck+.55,gz],.36,1.15,'x',PALETTE.mid,18);
      for(const x of [-.35,.35])cylinder([x,deck+.55,gz],.38,.09,'x',PALETTE.light,18);
      pipe([.59,deck+.55,gz],[.79,deck+.3,gz-.3],.05);
    }else if(m.gadget==='radiator'){
      box(0,deck+.18,gz,1.10,.88,.17,PALETTE.dark);
      for(let i=0;i<7;i++)box(0,deck+.26+i*.09,gz-.1,.92,.035,.06,PALETTE.light);
      pipe([.55,deck+.35,gz],[.79,deck+.35,gz+.7],.06);
    }else if(m.gadget==='armour'){
      // A reusable plate pack and bumper bundle. It is not truck-shaped on its
      // own; the full reveal later spreads the armour across the vehicle.
      box(0,deck+.26,gz+.12,1.12,.24,.48,PALETTE.dark);
      box(0,deck+.47,gz+.24,.92,.18,.24,PALETTE.mid);
      for(const side of [-1,1]){
        face([[side*.62,deck+.18,gz-.06],[side*.88,deck+.28,gz-.02],[side*.84,deck+.62,gz+.16],[side*.56,deck+.54,gz+.12]],side<0?PALETTE.pale:PALETTE.mid,PALETTE.dark,.8);
        pipe([side*.64,deck+.22,gz-.18],[side*.94,deck+.22,gz-.18],.05,PALETTE.light);
        pipe([side*.72,deck+.18,gz-.18],[side*.72,deck+.58,gz+.10],.04,PALETTE.pale);
      }
      pipe([-.95,deck+.28,gz-.22],[.95,deck+.28,gz-.22],.06,PALETTE.light);
    }else if(m.gadget==='handle'){
      // Compact yard-handle module: readable on its own, but still ordinary
      // until the full mower recipe adds the deck and bodywork around it.
      for(const side of [-1,1]){
        pipe([side*.34,deck+.18,gz+.22],[side*.58,deck+1.06,gz-.34],.055,PALETTE.dark);
        pipe([side*.21,deck+.18,gz+.34],[side*.42,deck+.82,gz+.10],.042,PALETTE.mid);
      }
      pipe([-.58,deck+1.06,gz-.34],[.58,deck+1.06,gz-.34],.06,PALETTE.pale);
      pipe([-.49,deck+.92,gz-.15],[.49,deck+.92,gz-.15],.038,PALETTE.light);
      box(0,deck+.26,gz+.16,.96,.28,.42,PALETTE.mid);
      box(0,deck+.43,gz+.24,.76,.18,.24,PALETTE.pale);
      for(const side of [-1,1])pipe([side*.36,deck+.30,gz+.04],[side*.24,deck+.18,gz-.20],.045,PALETTE.dark);
    }else{
      for(const s of [-1,1]){
        pipe([s*.59,deck+.18,gz],[s*.59,deck+.82,gz],.045);
        face([[s*.75,deck+.47,gz+.32],[s*.75,deck+1.14,gz-.33],[s*.75,deck+.49,gz-.40]],PALETTE.pale);
      }
      box(0,deck+.88,gz,1.65,.09,.42,PALETTE.mid);
    }
    let treatmentStart=out.length;
    // Some gag forms are full-body transformations rather than additive dress-up.
    // F1 now treats all donor geometry as scaffolding. The exact recipe still
    // matters, but the completed gag draws its own Formula body and proportioned
    // front/rear slicks so the silhouette can work properly from every camera.
    if(form==='f1'||form==='rocketcar'||form==='burger'||form==='boat'||form==='plane'||form==='house'||form==='muscle'||form==='icecream'||form==='spaceship'||form==='fossil'){
      out.length=0;treatmentStart=0;
    }
    if(form==='train'){
      // Full locomotive reveal. The Wobble wagon, Steam boiler and shared Ram
      // plough remain untouched underneath. Only the complete three-part recipe
      // gets this connecting bodywork, so each ingredient still looks ordinary
      // and reusable everywhere else.
      slot='chassis';
      const cabRear=back-.12,cabFront=-.48,cabHalf=bodyW+.19,cabLow=deck+.30,cabTop=deck+1.72;
      // Deep running boards and side skirts turn the crooked wagon into one
      // continuous locomotive frame without covering the selected tyres.
      for(const side of [-1,1]){
        const x=side*(bodyW+.13);
        box(x,deck+.02,.28,.20,.14,front-back+.48,PALETTE.pale);
        box(side*(bodyW+.20),deck+.22,-.03,.15,.33,1.45,side<0?PALETTE.dark:PALETTE.mid);
        // Cab lower quarter, corner posts and sill. The large centre aperture is
        // real empty space, not a painted black rectangle.
        box(side*cabHalf,cabLow,(cabRear+cabFront)/2,.10,.48,cabFront-cabRear,side<0?PALETTE.dark:PALETTE.mid);
        for(const z of [cabRear,cabFront])box(side*cabHalf,cabLow+.43,z,.10,1.00,.12,PALETTE.mid);
        box(side*cabHalf,cabTop-.07,(cabRear+cabFront)/2,.10,.15,cabFront-cabRear+.14,PALETTE.pale);
        // Big circular rear-side porthole and handrail survive straight-rear reduction.
        cylinder([side*(cabHalf+.01),deck+.93,cabRear+.12],.25,.055,'x',PALETTE.dark,16);
        circle([side*(cabHalf+.045),deck+.93,cabRear+.12],.17,'x',PALETTE.paper,16,PALETTE.pale);
        pipe([side*(cabHalf+.10),deck+.34,cabRear-.03],[side*(cabHalf+.10),deck+1.50,cabRear-.03],.038,PALETTE.light);
        // Wheel-linkage rods make any fitted tyre set read as locomotive running
        // gear, but the original wheel geometry remains fully present.
        const rodX=side*(axle+tyreWidth/2+.075),rodY=Math.max(.25,radius*.73);
        pipe([rodX,rodY,mounts.rearAxle],[rodX,rodY,mounts.frontAxle],.055,PALETTE.pale);
        pipe([rodX,rodY+.16,mounts.rearAxle+.10],[rodX,rodY-.04,mounts.frontAxle-.06],.035,PALETTE.mid);
        for(const z of [mounts.rearAxle,mounts.frontAxle]){
          cylinder([rodX,rodY,z],.105,.055,'x',PALETTE.light,12);
          circle([rodX+side*.032,rodY,z],.045,'x',PALETTE.dark,10);
        }
        // Squared steam chest in front of the wheelbase.
        box(side*(bodyW+.12),deck+.17,front-.40,.25,.44,.50,PALETTE.dark);
        pipe([side*(bodyW+.15),deck+.47,front-.34],[side*(bodyW+.15),deck+.17,front+.02],.05,PALETTE.light);
      }
      // Tall roof and rear beam make the silhouette change obvious from behind.
      box(0,cabTop,cabRear+(cabFront-cabRear)/2,cabHalf*2+.28,.18,cabFront-cabRear+.34,PALETTE.dark);
      face([[-cabHalf-.18,cabTop+.18,cabRear-.12],[cabHalf+.18,cabTop+.18,cabRear-.12],[cabHalf+.08,cabTop+.38,cabFront+.08],[-cabHalf-.08,cabTop+.38,cabFront+.08]],PALETTE.pale,PALETTE.dark,1);
      box(0,deck+.22,cabRear-.07,cabHalf*2+.20,.26,.15,PALETTE.dark);
      // Open rear window framed by a heavy arch.
      for(const x of [-.72,.72])pipe([x,deck+.70,cabRear-.16],[x,deck+1.55,cabRear-.16],.075,PALETTE.pale);
      pipe([-.72,deck+1.55,cabRear-.16],[.72,deck+1.55,cabRear-.16],.075,PALETTE.light);
      // Front pilot beam visually locks onto, rather than replaces, the selected plough.
      box(0,deck+.06,front+.27,bodyW*2+.58,.24,.16,PALETTE.dark);
      for(const side of [-1,1]){
        pipe([side*.74,deck+.15,front+.23],[side*(axle+tyreWidth/2+.06),deck+.35,front+.51],.06,PALETTE.pale);
        cylinder([side*.72,deck+.16,front+.39],.11,.18,'z',PALETTE.mid,12);
      }

      if(m.tyres==='rail'){
        // Support-tyre enhancement: Rail Wheels let the locomotive read more
        // coherently without being a separate vehicle system.
        for(const side of [-1,1]){
          const sx=side*(axle+tyreWidth/2+.08);
          box(sx,deck+.38,(mounts.rearAxle+mounts.frontAxle)/2,.11,.18,mounts.frontAxle-mounts.rearAxle+.62,PALETTE.dark);
          for(const z of [mounts.rearAxle,mounts.frontAxle]){
            face([[side*(axle+tyreWidth/2+.02),deck+.70,z-.31],[side*(axle+tyreWidth/2+.34),deck+.62,z-.18],[side*(axle+tyreWidth/2+.34),deck+.62,z+.18],[side*(axle+tyreWidth/2+.02),deck+.70,z+.31]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.8);
          }
        }
        box(0,deck+.12,(mounts.rearAxle+mounts.frontAxle)/2,bodyW*2+.72,.12,mounts.frontAxle-mounts.rearAxle+.78,PALETTE.mid);
      }

      // Boiler dressing: the selected engine remains fully present, but a large
      // smokebox collar, headlamp, dome and funnel resolve it as a locomotive.
      slot='engine';
      const by=ey+.75,bz=ez+.08,smokeFront=bz+.985;
      cylinder([0,by,smokeFront],.70,.16,'z',PALETTE.dark,22);
      circle([0,by,smokeFront+.09],.59,'z',PALETTE.mid,22);
      circle([0,by,smokeFront+.105],.18,'z',PALETTE.dark,16);
      for(let i=0;i<12;i++)circle([Math.cos(i/12*Math.PI*2)*.51,by+Math.sin(i/12*Math.PI*2)*.51,smokeFront+.12],.035,'z',PALETTE.light,7);
      // Central headlamp and bracket above the smokebox.
      box(0,by+.70,smokeFront+.02,.40,.28,.27,PALETTE.dark);
      circle([0,by+.84,smokeFront+.17],.15,'z',PALETTE.paper,16,PALETTE.pale);
      pipe([0,by+.66,smokeFront-.05],[0,by+.52,smokeFront-.28],.045,PALETTE.mid);
      // Exaggerated flared funnel. It extends the existing boiler stack rather
      // than replacing it, and is intentionally tall enough to change silhouette.
      const stackZ=bz+.39;
      cylinder([0,by+.63+.90,stackZ],.18,.42,'y',PALETTE.dark,16,.25);
      cylinder([0,by+.63+1.11,stackZ],.34,.12,'y',PALETTE.mid,18,.24);
      circle([0,by+.63+1.18,stackZ],.25,'y',PALETTE.ink,18);
      // Steam dome and whistle pair behind the funnel.
      cylinder([0,by+.71,bz-.38],.28,.26,'y',PALETTE.mid,16,.20);
      for(const x of [-.22,.22]){
        pipe([x,by+.73,bz-.72],[x,by+1.18,bz-.72],.035,PALETTE.pale);
        cylinder([x,by+1.22,bz-.72],.07,.14,'y',PALETTE.light,10,.045);
      }
      // Boiler-side bands and handrails visually tie the engine into the wagon cab.
      for(const side of [-1,1]){
        pipe([side*.69,by+.25,bz-.70],[side*.69,by+.25,bz+.70],.035,PALETTE.pale);
        pipe([side*.66,by-.12,bz-.80],[side*.90,deck+.57,cabFront+.05],.05,PALETTE.mid);
      }
    }else if(form==='truck'){
      // Permanent exact-recipe hauler only. Native primitives; no reference pixels.
      // Refine the previous model: cargo 3.41, cab 1.10, bonnet 1.74 after local length remap.
      out.length=0;
      const tail=-3.30,bedFront=-.20,cabFront=.90,nose=2.90;
      const red='#c24332',redLight='#ec6944',redDark='#792d29';
      const blue='#285a83',blueLight='#528da9',blueDark='#19354c';
      const steel='#8b9697',steelDark='#44545d',rubber='#202b30',gold='#dcac55';
      const floor=1.12,bedTop=2.22,cabTop=2.96,track=1.36;
      function solid(x,y,z,w,h,d,col,top=steel,shade=steelDark){
        const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];
        const up=p=>[p[0],p[1]+h,p[2]];
        face([a,b,c,e],shade);face([a,b,up(b),up(a)],col);
        face([b,c,up(c),up(b)],col);face([c,e,up(e),up(c)],col);
        face([e,a,up(a),up(e)],shade);face([up(a),up(b),up(c),up(e)],top);
      }
      slot='chassis';
      solid(0,.77,-.20,1.95,.34,6.20,redDark,steelDark,redDark);
      for(const s of [-1,1]){
        solid(s*.95,.70,-.20,.18,.25,6.34,steelDark,steelDark);
        solid(s*1.08,1.01,.22,.28,.15,1.40,steel,steel);
      }
      const bedStart=out.length;
      // Open load well: lower stepped panels expose the recessed floor and inner ribs.
      slot='engine';
      solid(0,floor,(tail+bedFront)/2,2.42,.17,3.10,blueDark,'#192f39');
      for(const z of [-2.95,-2.30,-1.65,-1.0,-.35]){
        solid(0,floor+.18,z,2.08,.065,.09,steelDark,steelDark);
        solid(0,.55,z,2.65,.20,.17,steelDark,steel);
      }
      for(const s of [-1,1]){
        // Three broad overlapping plates, with a broken rim instead of a box lid.
        for(const [z,h] of [[-2.78,.60],[-1.76,.75],[-.73,.87]]){
          solid(s*1.16,1.28,z,.22,h,1.07,blue,blueLight,blueDark);
          solid(s*1.16,1.28+h,z,.30,.13,1.10,steelDark,steel);
          solid(s*1.295,1.35,z,.06,.28,.86,'#294958',blue);
          pipe([s*1.34,1.43,z-.37],[s*1.34,1.24+h,z+.37],.065,steel);
          for(const zz of [z-.38,z+.38])circle([s*1.34,1.51,zz],.065,'x',gold,8,steelDark);
        }
        for(const z of [-3.23,-2.25,-1.23,-.25]){
          solid(s*1.18,1.05,z,.30,1.10,.17,steelDark,steel);
          solid(s*1.00,1.30,z,.10,.65,.16,steelDark,steel);
        }
        for(const z of [-2.78,-.73]){
          const y=z<-2?2.01:2.28;
          face([[s*1.03,y,z-.15],[s*1.29,y,z+.15],[s*1.22,y+.32,z]],steel,steelDark,.7);
          face([[s*1.29,y,z-.15],[s*1.03,y,z+.15],[s*1.22,y+.32,z]],steelDark,steelDark,.7);
        }
        // Rusty brackets connect the load bed to the chassis, clearly below its floor.
        for(const z of [-2.72,-.88]){
          pipe([s*.88,.78,z],[s*1.23,1.35,z],.10,'#85523c');
          cylinder([s*1.10,.80,z],.17,.34,'z',steelDark,10);
        }
      }
      // Reinforced open rear gate: chamfered silhouette, broad chevrons, hinge blocks.
      face([[-1.20,1.26,tail-.15],[1.20,1.26,tail-.15],[1.20,1.78,tail-.15],[.90,1.98,tail-.15],[-.90,1.98,tail-.15],[-1.20,1.78,tail-.15]],blue,steel,.9);
      solid(0,1.88,tail-.10,1.82,.12,.26,steelDark,steel);
      for(const s of [-1,1]){
        solid(s*1.10,1.22,tail-.14,.20,.63,.23,steelDark,steel);
        pipe([0,1.35,tail-.22],[s*.91,1.81,tail-.22],.09,steel);
        solid(s*.75,1.25,tail-.24,.38,.16,.20,'#85523c',steel);
        solid(s*.94,1.03,tail-.22,.32,.18,.17,red,redLight);
        solid(s*.97,1.61,tail-.28,.19,.14,.12,gold,gold);
      }
      solid(0,.82,tail-.24,2.82,.23,.30,steelDark,steel);
      solid(0,.65,tail-.40,.42,.25,.30,'#85523c',steel);
      // Broad corner hardware and an oversized latch remain readable at race scale.
      for(const side of [-1,1]){
        solid(side*1.08,1.72,tail-.24,.25,.40,.22,'#85523c',steel);
        circle([side*1.08,1.93,tail-.36],.10,'z',gold,10,steelDark);
        pipe([side*.82,.78,-1.40],[side*1.24,1.28,-1.40],.14,steel);
      }
      solid(0,1.58,tail-.27,.36,.23,.18,steelDark,steel);
      // Widen the open bed and raise its existing stepped walls, keeping floor depth.
      for(const p of new Set(out.slice(bedStart).flatMap(primitive=>primitive.pts))){
        p[0]*=1.10;
        if(p[1]>1.28)p[1]=1.28+(p[1]-1.28)*1.24;
      }
      // Compact tall red cab, separate glazing and rear window above the bed.
      slot='chassis';
      solid(0,1.15,.35,1.90,1.58,1.10,red,redLight,redDark);
      solid(0,2.76,.35,2.04,.20,1.28,red,redLight,redDark);
      face([[-.79,2.05,.917],[.79,2.05,.917],[.76,2.65,.917],[-.76,2.65,.917]],'#142a34',steelDark,.8);
      pipe([0,2.06,.93],[0,2.65,.93],.028,steel);
      face([[-.68,2.32,-.212],[.68,2.32,-.212],[.68,2.65,-.212],[-.68,2.65,-.212]],'#142a34',steel,.7);
      for(const s of [-1,1]){
        face([[s*.963,2.02,-.06],[s*.963,2.65,-.06],[s*.963,2.65,.73],[s*.963,2.02,.73]],'#142a34',steel,.8);
        solid(s*.98,1.84,.05,.06,.07,.23,gold,gold);
        pipe([s*.96,2.42,.68],[s*1.22,2.43,.80],.035,steel);
        solid(s*1.25,2.30,.80,.16,.28,.14,steelDark,steel);
      }
      for(const x of [-.70,-.35,0,.35,.70]){
        solid(x,2.97,.68,.20,.14,.20,steelDark,steelDark);
        circle([x,3.04,.79],.075,'z',gold,10,steelDark);
      }
      // Short, deep bonnet and large upright grille.
      solid(0,1.20,1.90,1.60,.72,2.00,red,redLight,redDark);
      solid(0,1.14,nose+.025,1.60,1.03,.16,steelDark,steel);
      for(let x=-.57;x<=.58;x+=.19)solid(x,1.20,nose+.11,.085,.89,.08,steel,steel);
      for(const s of [-1,1]){
        for(const z of [1.30,1.60,1.90])path([[s*.81,1.77,z],[s*.81,1.40,z+.08]],steelDark,1.7);
        solid(s*.99,1.47,2.81,.36,.39,.26,redDark,redLight);
        circle([s*.99,1.67,2.96],.14,'z','#f5df9f',12,steel);
      }
      // Wide armoured shovel with a restrained set of teeth.
      slot='gadget';
      face([[-1.52,.40,3.28],[1.52,.40,3.28],[1.35,1.26,3.03],[-1.35,1.26,3.03]],steelDark,steel,1);
      for(const x of [-1.0,-.5,0,.5,1.0]){
        face([[x-.13,.53,3.25],[x+.13,.53,3.25],[x,1.10,3.11]],steel,steelDark,.7);
        circle([x,1.14,3.075],.045,'z',gold,8);
      }
      // Exposed twin diesel stacks stand clear of both cab and cargo rails.
      slot='engine';
      for(const s of [-1,1]){
        cylinder([s*1.30,2.42,-.36],.19,2.18,'y',steelDark,12);
        cylinder([s*1.30,3.53,-.36],.23,.20,'y',steel,12);
        circle([s*1.30,3.62,-.36],.16,'y',rubber,12);
        for(const y of [1.53,2.35,3.22])cylinder([s*1.30,y,-.36],.22,.10,'y',steel,12);
        cylinder([s*1.02,.89,.20],.23,.82,'z',steelDark,12);
      }
      // Shorten the existing nose 13%, extend the existing bed 10%; cab unchanged.
      // Apply to body primitives only so tyres retain their circular profiles.
      for(const p of new Set(out.flatMap(primitive=>primitive.pts))){
        if(p[2]>.90)p[2]=.90+(p[2]-.90)*.87;
        else if(p[2]<-.20)p[2]=-.20+(p[2]+.20)*1.10;
      }
      // Large road-going wheels: rear axle moved beneath the dominant load bed.
      slot='tyres';
      for(const s of [-1,1])for(const z of [-2.62,1.8831]){
        const x=s*track,r=.78;
        pipe([0,.78,z],[s*1.42,.78,z],.12,steelDark);
        cylinder([x,r,z],r,.52,'x',rubber,18);
        circle([s*(track+.27),r,z],.43,'x',redDark,18,steelDark);
        circle([s*(track+.28),r,z],.29,'x',steelDark,14,steel);
        circle([s*(track+.30),r,z],.13,'x',steel,12);
        for(let j=0;j<12;j++){
          const a=(j+phase*.18)/12*Math.PI*2;
          const yy=r+Math.cos(a)*.785,zz=z+Math.sin(a)*.785;
          pipe([x-.24,yy,zz],[x+.24,yy,zz],.033,steelDark);
        }
        slot='chassis';
        // Three-dimensional fender cap follows the tyre arc, not a vertical fin.
        for(let j=0;j<6;j++){
          const a=.18+j*(Math.PI-.36)/6,b=.18+(j+1)*(Math.PI-.36)/6;
          const p=(xx,t)=>[xx,.78+Math.sin(t)*1.08,z+Math.cos(t)*1.08];
          face([p(s*1.02,a),p(s*1.95,a),p(s*1.95,b),p(s*1.02,b)],z>0?red:redDark,steelDark,.6);
        }
        // Deep outer lip gives each arch real mass in rear and three-quarter views.
        for(let j=0;j<6;j++){
          const a=.12+j*(Math.PI-.24)/6,b=.12+(j+1)*(Math.PI-.24)/6;
          const p=(r,t)=>[s*1.95,.78+Math.sin(t)*r,z+Math.cos(t)*r];
          face([p(.87,a),p(1.08,a),p(1.08,b),p(.87,b)],red,steelDark,.7);
        }
        slot='tyres';
      }
    }else if(form==='monster'){
      // Real monster-truck silhouette: one compact pickup shell floats high
      // above the chassis. The empty space BELOW the body is deliberate lift /
      // suspension; the body itself is continuous from bed through cab to hood.
      slot='chassis';
      const lift=1.42,bodyY=deck+lift,bodyRear=back-.18,cabRear=-.58,cabFront=.24,hoodFront=front+.46;
      // Central ladder-frame bridge: makes the suspension gap intentional rather
      // than looking like the vehicle is missing its middle.
      box(0,deck+.36,(bodyRear+hoodFront)/2,1.18,.22,hoodFront-bodyRear,PALETTE.dark);
      for(const side of [-1,1]){
        const sx=side*(axle+.22);
        // Four triangulated suspension links and huge shocks.
        for(const z of [mounts.rearAxle,mounts.frontAxle]){
          pipe([side*.48,deck+.42,z-.20],[sx,bodyY-.04,z-.12],.075,PALETTE.pale);
          pipe([side*.48,deck+.42,z+.20],[sx,bodyY-.04,z+.12],.075,PALETTE.dark);
          cylinder([sx,deck+.84,z],.11,.88,'y',PALETTE.light,12,.085);
          cylinder([sx,deck+1.20,z],.15,.16,'y',PALETTE.mid,12);
        }
      }

      // One continuous pickup rocker / floor from rear bed to front nose.
      box(0,bodyY,(bodyRear+hoodFront)/2,1.88,.26,hoodFront-bodyRear,PALETTE.dark);
      for(const side of [-1,1])box(side*.92,bodyY+.18,(bodyRear+hoodFront)/2,.12,.30,hoodFront-bodyRear,side<0?PALETTE.dark:PALETTE.mid);

      // Rear pickup bed, cab and hood all touch the same rocker line.
      box(0,bodyY+.28,(bodyRear+cabRear)/2,1.78,.56,cabRear-bodyRear+.08,PALETTE.mid);
      face([[-.86,bodyY+.52,bodyRear],[.86,bodyY+.52,bodyRear],[.78,bodyY+.84,bodyRear-.02],[-.78,bodyY+.84,bodyRear-.02]],PALETTE.dark,PALETTE.ink,.9);
      box(0,bodyY+.36,(cabRear+cabFront)/2,1.54,.96,cabFront-cabRear,PALETTE.pale);
      face([[-.72,bodyY+1.30,cabRear-.04],[.72,bodyY+1.30,cabRear-.04],[.58,bodyY+1.48,cabFront+.02],[-.58,bodyY+1.48,cabFront+.02]],PALETTE.light,PALETTE.dark,.9);
      // Windscreen and side windows.
      face([[-.56,bodyY+.92,cabFront+.012],[.56,bodyY+.92,cabFront+.012],[.48,bodyY+1.32,cabFront+.012],[-.48,bodyY+1.32,cabFront+.012]],PALETTE.ink,PALETTE.dark,.7);
      for(const side of [-1,1])face([[side*.775,bodyY+.78,cabRear+.12],[side*.775,bodyY+1.20,cabRear+.14],[side*.775,bodyY+1.26,cabFront-.12],[side*.775,bodyY+.80,cabFront-.10]],PALETTE.deep,PALETTE.dark,.7);

      // Short aggressive bonnet, tied directly to cab.
      face([[-.76,bodyY+.22,cabFront],[.76,bodyY+.22,cabFront],[.64,bodyY+.30,hoodFront],[-.64,bodyY+.30,hoodFront]],PALETTE.mid,PALETTE.dark,.9);
      face([[-.70,bodyY+.72,cabFront],[.70,bodyY+.72,cabFront],[.52,bodyY+.62,hoodFront-.02],[-.52,bodyY+.62,hoodFront-.02]],PALETTE.light,PALETTE.dark,.9);
      for(const side of [-1,1])face([[side*.76,bodyY+.22,cabFront],[side*.70,bodyY+.72,cabFront],[side*.52,bodyY+.62,hoodFront-.02],[side*.64,bodyY+.30,hoodFront]],side<0?PALETTE.dark:PALETTE.pale,PALETTE.dark,.85);
      // Big face-like grille and lamps.
      face([[-.52,bodyY+.30,hoodFront+.02],[.52,bodyY+.30,hoodFront+.02],[.46,bodyY+.60,hoodFront+.10],[-.46,bodyY+.60,hoodFront+.10]],PALETTE.dark,PALETTE.ink,1);
      for(const side of [-1,1])circle([side*.48,bodyY+.70,hoodFront+.10],.16,'z',PALETTE.paper,14,PALETTE.dark);
      pipe([-.92,bodyY+.10,hoodFront+.18],[.92,bodyY+.10,hoodFront+.18],.10,PALETTE.light);

      // Huge fender brows float above each tyre but no longer create a broken
      // body centre. They attach directly to the continuous rocker shell.
      for(const side of [-1,1])for(const z of [mounts.rearAxle,mounts.frontAxle]){
        face([[side*.86,bodyY+.10,z-.42],[side*(axle+.46),bodyY+.42,z-.28],[side*(axle+.54),bodyY+.66,z],[side*(axle+.46),bodyY+.42,z+.28],[side*.86,bodyY+.10,z+.42]],side<0?PALETTE.pale:PALETTE.mid,PALETTE.dark,1);
      }

      // External cage emphasises competition monster-truck proportions.
      for(const side of [-1,1]){
        pipe([side*.70,bodyY+.30,cabRear-.02],[side*.88,bodyY+1.42,cabRear-.26],.075,PALETTE.dark);
        pipe([side*.88,bodyY+1.42,cabRear-.26],[side*.70,bodyY+1.68,-.06],.065,PALETTE.pale);
        pipe([side*.70,bodyY+1.68,-.06],[side*.62,bodyY+1.28,cabFront+.16],.055,PALETTE.light);
      }
      pipe([-.70,bodyY+1.68,-.06],[.70,bodyY+1.68,-.06],.065,PALETTE.light);

      slot='engine';
      // Visible V8/supercharger punching through the hood.
      face([[-.56,ey+.92,ez+.18],[.56,ey+.92,ez+.18],[.42,ey+1.46,ez-.30],[-.42,ey+1.46,ez-.30]],PALETTE.light,PALETTE.dark,1);
      box(0,ey+1.26,ez-.10,.76,.34,.44,PALETTE.mid);

      slot='gadget';
      // Existing exhaust remains, with absurd vertical extensions behind cab.
      for(const side of [-1,1]){
        const x=side*(bodyW+.36);
        for(let i=0;i<3;i++){
          const z=back+.02+i*.32;
          pipe([side*(bodyW+.12),deck+.70,z],[x,bodyY+1.28+i*.14,z-.06],.075,PALETTE.pale);
          cylinder([x,bodyY+1.48+i*.14,z-.06],.11,.42,'y',PALETTE.light,12,.075);
        }
      }
    }else if(form==='muscle'){
      // Reference-driven 70s muscle car pass. Keep the silhouette low, wide
      // and enclosed: long bonnet, chopped rearward cabin, swollen rear
      // quarters and a hood-mounted V8. Exhaust array becomes long side pipes
      // that sweep upward around the rear wheel arches.
      const frontZ=1.68,rearZ=-1.28;
      const frontR=.41,rearR=.47,frontW=.27,rearW=.34;
      const frontX=.91,rearX=.96;

      slot='tyres';
      for(const side of [-1,1]){
        for(const spec of [
          {z:frontZ,r:frontR,w:frontW,x:frontX},
          {z:rearZ,r:rearR,w:rearW,x:rearX}
        ]){
          const cx=side*spec.x,cy=spec.r,capX=cx+side*spec.w/2;
          cylinder([cx,cy,spec.z],spec.r,spec.w,'x',PALETTE.deep,22,spec.r*.98,true);
          circle([capX+side*.010,cy,spec.z],spec.r*.68,'x',PALETTE.mid,18);
          circle([capX+side*.018,cy,spec.z],spec.r*.48,'x',PALETTE.pale,16);
          circle([capX+side*.026,cy,spec.z],spec.r*.15,'x',PALETTE.dark,12);
          for(let j=0;j<5;j++){
            const a=j/5*Math.PI*2+phase*.04;
            pipe([capX+side*.020,cy,spec.z],ringPoint([capX+side*.020,cy,spec.z],spec.r*.44,a,'x'),.024,PALETTE.light);
          }
        }
      }

      slot='chassis';
      // Low full-length rocker/floor keeps the body visually planted.
      face([[-.82,.20,-1.70],[.82,.20,-1.70],[.76,.20,2.50],[-.76,.20,2.50]],PALETTE.deep,PALETTE.ink,.88);
      box(0,.28,.18,1.72,.28,4.04,PALETTE.dark);

      // Charger/Mach-1 style bonnet: broad, almost flat and visually heavy.
      // Keep the centre only slightly raised so the blower looks like it is
      // punching through a real hood rather than sitting on a tented wedge.
      face([[-.80,.48,.10],[.80,.48,.10],[.76,.48,2.50],[-.76,.48,2.50]],PALETTE.mid,PALETTE.dark,.92);
      face([[-.76,.48,2.50],[.76,.48,2.50],[.72,.64,2.61],[-.72,.64,2.61]],PALETTE.pale,PALETTE.dark,.86);
      // Flat hood shoulders.
      face([[-.76,.64,.18],[-.26,.70,.18],[-.26,.70,2.43],[-.72,.64,2.54]],PALETTE.light,PALETTE.dark,.72);
      face([[.26,.70,.18],[.76,.64,.18],[.72,.64,2.54],[.26,.70,2.43]],PALETTE.pale,PALETTE.dark,.72);
      // Low central cowl around the supercharger opening.
      face([[-.26,.70,.26],[.26,.70,.26],[.30,.78,1.60],[-.30,.78,1.60]],PALETTE.dark,PALETTE.ink,.76);
      face([[-.30,.78,1.60],[.30,.78,1.60],[.24,.74,2.38],[-.24,.74,2.38]],PALETTE.mid,PALETTE.dark,.72);
      // Shallow side shoulders tie the hood into the front arches.
      for(const side of [-1,1]){
        face([[side*.80,.48,.10],[side*.76,.48,2.50],[side*.72,.64,2.61],[side*.76,.64,.18]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.ink,.82);
        face([[side*.74,.50,1.88],[side*.98,.52,1.78],[side*1.02,.70,1.55],[side*.80,.72,1.44]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.68);
      }

      // Wide square face, twin lamps and chin spoiler.
      face([[-.84,.34,2.54],[.84,.34,2.54],[.80,.68,2.62],[-.80,.68,2.62]],PALETTE.dark,PALETTE.ink,.92);
      for(let x=-.50;x<=.50;x+=.125)path([[x,.39,2.625],[x,.63,2.625]],PALETTE.pale,1.0);
      for(const side of [-1,1]){
        circle([side*.63,.70,2.64],.12,'z',PALETTE.paper,14,PALETTE.dark);
        circle([side*.39,.70,2.64],.095,'z',PALETTE.pale,12,PALETTE.dark);
      }
      face([[-.90,.18,2.50],[.90,.18,2.50],[.98,.28,2.66],[-.98,.28,2.66]],PALETTE.deep,PALETTE.ink,.80);

      // Rearward chopped coupe cabin. The side glass is intentionally large so
      // it reads as a proper enclosed muscle car rather than a hot-rod tub.
      const cabFront=.00,cabRear=-1.12;
      for(const side of [-1,1]){
        face([[side*.72,.52,cabFront+.05],[side*.76,.54,cabRear-.02],[side*.64,.96,cabRear+.06],[side*.52,1.00,cabFront-.18]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.90);
        face([[side*.705,.70,cabFront-.03],[side*.72,.74,cabRear+.06],[side*.61,.91,cabRear+.12],[side*.50,.96,cabFront-.18]],PALETTE.ink,PALETTE.dark,.76);
      }
      // Windscreen, roof and rear glass.
      face([[-.50,.78,cabFront+.02],[.50,.78,cabFront+.02],[.45,.98,cabFront-.18],[-.45,.98,cabFront-.18]],PALETTE.paper,PALETTE.dark,.78);
      face([[-.46,.98,cabFront-.18],[.46,.98,cabFront-.18],[.58,1.02,cabRear+.06],[-.58,1.02,cabRear+.06]],PALETTE.pale,PALETTE.dark,.84);
      face([[-.58,1.02,cabRear+.06],[.58,1.02,cabRear+.06],[.66,.76,cabRear-.16],[-.66,.76,cabRear-.16]],PALETTE.dark,PALETTE.ink,.76);

      // Fat integrated rear quarters instead of an open rear tray.
      box(0,.48,-1.38,1.66,.46,.86,PALETTE.mid);
      face([[-.78,.52,-.88],[.78,.52,-.88],[.88,.72,-1.58],[-.88,.72,-1.58]],PALETTE.pale,PALETTE.dark,.82);
      for(const side of [-1,1]){
        face([[side*.68,.42,-.76],[side*1.02,.48,-.88],[side*1.11,.80,-1.50],[side*.82,.88,-1.62],[side*.70,.76,-1.08]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.86);
        // Wheel-arch brow joins the quarter panel into the rear tyre.
        face([[side*.72,.48,-.92],[side*1.11,.62,-1.04],[side*1.14,.92,-1.30],[side*.96,1.02,-1.46],[side*.76,.82,-1.56]],side<0?PALETTE.pale:PALETTE.light,PALETTE.dark,.72);
      }
      // Rear bumper and spoiler lip.
      box(0,.30,-1.82,1.70,.17,.18,PALETTE.dark);
      face([[-.80,.90,-1.56],[.80,.90,-1.56],[.70,.98,-1.74],[-.70,.98,-1.74]],PALETTE.pale,PALETTE.dark,.72);

      slot='engine';
      // Blown V8 inspired by the Charger reference. Most of the engine sits
      // below the hood; only the blower case, pulleys and three-hole scoop
      // punch through the centre opening.
      face([[-.27,.706,.76],[.27,.706,.76],[.27,.706,1.44],[-.27,.706,1.44]],PALETTE.ink,PALETTE.dark,.84);
      // Engine banks barely visible beneath the blower.
      for(const side of [-1,1]){
        face([[side*.10,.72,.82],[side*.30,.74,.86],[side*.30,.86,1.34],[side*.10,.84,1.38]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.68);
        for(const z of [.92,1.08,1.24])circle([side*.34,.80,z],.045,'x',PALETTE.pale,9,PALETTE.dark);
      }
      // Low supercharger case, longer than tall.
      box(0,.78,1.08,.50,.18,.54,PALETTE.mid);
      box(0,.94,1.10,.42,.18,.40,PALETTE.pale);
      // Pulley hardware on both sides to stop it reading as a plain cube.
      for(const side of [-1,1]){
        cylinder([side*.27,.89,1.04],.105,.10,'x',PALETTE.dark,14);
        circle([side*.33,.89,1.04],.058,'x',PALETTE.light,12,PALETTE.dark);
        cylinder([side*.25,.93,1.22],.075,.10,'x',PALETTE.mid,12);
      }
      // Big forward scoop. Three intake throats are the key reference read.
      face([[-.25,1.05,.96],[.25,1.05,.96],[.23,1.30,1.32],[-.23,1.30,1.32]],PALETTE.light,PALETTE.dark,.80);
      face([[-.23,1.30,1.32],[.23,1.30,1.32],[.22,1.14,1.44],[-.22,1.14,1.44]],PALETTE.dark,PALETTE.ink,.82);
      for(const x of [-.125,0,.125])circle([x,1.215,1.448],.060,'z',PALETTE.ink,10,PALETTE.pale);

      slot='gadget';
      // Exhaust array becomes long triple side pipes. They run visibly along
      // the rocker then climb around the rear wheel and finish high on the rear
      // quarter, borrowing the custom street-machine / interceptor reference.
      for(const side of [-1,1]){
        for(let j=0;j<3;j++){
          const dy=j*.065;
          const dz=j*.045;
          pipe([side*.62,.48,.42-dz],[side*.90,.33+dy,.12-dz],.050,PALETTE.pale);
          pipe([side*.90,.33+dy,.12-dz],[side*1.05,.33+dy,-.58-dz],.052,PALETTE.light);
          pipe([side*1.05,.33+dy,-.58-dz],[side*1.12,.52+dy,-.88-dz],.055,PALETTE.pale);
          pipe([side*1.12,.52+dy,-.88-dz],[side*1.10,.76+dy,-1.14-dz],.058,PALETTE.light);
          pipe([side*1.10,.76+dy,-1.14-dz],[side*.98,.92+dy,-1.48-dz],.060,PALETTE.pale);
          // short rear-facing exit tip
          pipe([side*.98,.92+dy,-1.48-dz],[side*.90,.92+dy,-1.66-dz],.062,PALETTE.light);
        }
        // Bright sill/heat shield under the long pipe run.
        face([[side*.82,.20,.20],[side*1.11,.22,.04],[side*1.11,.40,-.66],[side*.84,.40,-.56]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.68);
      }
    }else if(form==='tank'){

      // The full Tank is intentionally ridiculous: a low racer nose trapped
      // under a huge armoured body, continuous track housings, exposed diesel
      // machinery and an oversized upper turret. Nothing here changes gameplay.
      slot='chassis';
      const trackX=axle+tyreWidth/2+.12,trackFront=mounts.frontAxle+.46,trackRear=mounts.rearAxle-.46;
      const trackLow=.10,trackMid=radius*.88,trackTop=deck+.66;
      // Continuous side track housings wrap around the ordinary Track Rollers.
      // The original roller geometry remains untouched underneath.
      for(const side of [-1,1]){
        const x=side*trackX;
        face([[x,trackLow,trackRear+.20],[x,trackLow,trackFront-.20],[x,trackMid,trackFront],[x,trackTop,trackFront-.28],[x,trackTop,trackRear+.28],[x,trackMid,trackRear]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.ink,1.1);
        // Inner band makes it read as one track rather than a giant solid slab.
        face([[x+side*.015,trackLow+.18,trackRear+.38],[x+side*.015,trackLow+.18,trackFront-.38],[x+side*.015,trackMid,trackFront-.20],[x+side*.015,trackTop-.18,trackFront-.42],[x+side*.015,trackTop-.18,trackRear+.42],[x+side*.015,trackMid,trackRear+.20]],PALETTE.deep,PALETTE.dark,.8);
        // Chunky tread plates along upper/lower runs.
        for(let i=0;i<8;i++){
          const z=trackRear+.42+i*(trackFront-trackRear-.84)/7;
          box(x,trackTop-.02,z,.16,.10,.32,i%2?PALETTE.light:PALETTE.pale);
          box(x,trackLow+.03,z,.16,.09,.32,i%2?PALETTE.pale:PALETTE.mid);
        }
        // Side armour skirt leaves the roller centres peeking through below.
        face([[side*(bodyW+.08),deck+.36,trackRear+.20],[side*(bodyW+.08),deck+.36,trackFront-.18],[side*(trackX-.12),trackTop+.20,trackFront-.42],[side*(trackX-.12),trackTop+.20,trackRear+.44]],side<0?PALETTE.pale:PALETTE.light,PALETTE.dark,.9);
      }

      // Lower hull, central armour box and stupidly tall upper body.
      box(0,deck+.32,.04,bodyW*2.18,.54,front-back-.18,PALETTE.dark);
      box(0,deck+.74,.02,bodyW*2.00,.78,2.18,PALETTE.mid);
      // Sloped front and rear armour keep the giant box cartoonish.
      face([[-.96,deck+.72,1.12],[.96,deck+.72,1.12],[.74,deck+1.42,1.40],[-.74,deck+1.42,1.40]],PALETTE.pale,PALETTE.dark,1);
      face([[-.88,deck+.72,-1.10],[.88,deck+.72,-1.10],[.70,deck+1.34,-1.38],[-.70,deck+1.34,-1.38]],PALETTE.dark,PALETTE.ink,.9);
      // Tiny little race-car nose survives at the very front like someone built
      // the tank around an existing machine instead of designing sensibly.
      box(0,deck+.22,front+.34,.92,.30,.54,PALETTE.pale);
      face([[-.38,deck+.52,front+.58],[.38,deck+.52,front+.58],[.32,deck+.74,front+.44],[-.32,deck+.74,front+.44]],PALETTE.light,PALETTE.dark,.8);
      for(const side of [-1,1])circle([side*.32,deck+.50,front+.62],.11,'z',PALETTE.paper,12,PALETTE.dark);
      for(let x=-.24;x<=.24;x+=.12)path([[x,deck+.24,front+.63],[x,deck+.47,front+.63]],PALETTE.ink,1.1);
      pipe([-.56,deck+.16,front+.70],[.56,deck+.16,front+.70],.07,PALETTE.light);

      // Big turret ring and lopsided turret shell.
      cylinder([0,deck+1.72,.04],.78,.24,'y',PALETTE.dark,22);
      cylinder([0,deck+1.88,.04],.70,.18,'y',PALETTE.mid,22,.62);
      face([[-.64,deck+1.94,-.46],[.66,deck+1.94,-.42],[.78,deck+2.42,.08],[.38,deck+2.64,.46],[-.42,deck+2.58,.48],[-.76,deck+2.34,.04]],PALETTE.pale,PALETTE.dark,1);
      // Large main barrel, intentionally offset and oversized.
      cylinder([-.14,deck+2.24,1.52],.17,2.20,'z',PALETTE.mid,18,.24);
      cylinder([-.14,deck+2.24,2.66],.26,.18,'z',PALETTE.dark,18,.18);
      circle([-.14,deck+2.24,2.76],.17,'z',PALETTE.ink,18);
      // Smaller absurd side tube for asymmetry.
      cylinder([.72,deck+1.62,1.18],.095,1.18,'z',PALETTE.pale,14,.14);
      circle([.72,deck+1.62,1.80],.10,'z',PALETTE.ink,12);

      // Low commander hatch: deliberately squat so the giant cannon remains
      // the dominant top silhouette instead of a mystery tower.
      cylinder([.06,deck+2.60,-.10],.30,.12,'y',PALETTE.dark,16,.26);
      cylinder([.06,deck+2.69,-.10],.34,.08,'y',PALETTE.mid,16,.30);
      circle([.06,deck+2.74,-.10],.24,'y',PALETTE.pale,16,PALETTE.dark);
      // One crooked antenna/periscope is enough junk on top.
      pipe([.22,deck+2.72,-.04],[.38,deck+3.08,-.18],.035,PALETTE.pale);
      pipe([.38,deck+3.08,-.18],[.48,deck+3.01,-.29],.035,PALETTE.light);

      slot='engine';
      // Keep the Heavy Diesel visible at the rear with a crude cage and taller
      // intake/exhaust, rather than burying the selected engine inside the hull.
      for(const side of [-1,1]){
        pipe([side*.58,ey+.30,ez-.38],[side*.82,ey+1.18,ez-.72],.055,PALETTE.pale);
        pipe([side*.82,ey+1.18,ez-.72],[side*.64,ey+1.42,ez-.92],.045,PALETTE.light);
      }
      cylinder([-.52,ey+1.18,ez-.82],.12,.62,'y',PALETTE.dark,12,.08);
      cylinder([.48,ey+1.26,ez-.72],.13,.78,'y',PALETTE.pale,12,.085);
      // Rear access hatch framing.
      face([[-.72,deck+.72,-1.41],[.72,deck+.72,-1.41],[.60,deck+1.38,-1.39],[-.60,deck+1.38,-1.39]],PALETTE.deep,PALETTE.dark,.8);
      for(const x of [-.42,0,.42])circle([x,deck+1.06,-1.42],.045,'z',PALETTE.light,8);

      slot='gadget';
      // Bolt-on Armour spreads into mismatched skirts, corner guards and a
      // reinforced prow. Base armour remains exactly present underneath.
      for(const side of [-1,1]){
        face([[side*.96,deck+.62,.96],[side*1.18,deck+.74,.84],[side*1.16,deck+1.42,.36],[side*.94,deck+1.30,.48]],side<0?PALETTE.pale:PALETTE.mid,PALETTE.dark,.85);
        face([[side*.96,deck+.60,-.96],[side*1.16,deck+.72,-.82],[side*1.10,deck+1.28,-.34],[side*.92,deck+1.20,-.46]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.85);
      }
      pipe([-1.08,deck+.50,front+.32],[1.08,deck+.50,front+.32],.10,PALETTE.light);
      pipe([-.96,deck+1.10,front+.18],[.96,deck+1.10,front+.18],.055,PALETTE.pale);
    }else if(form==='f1'){
      // Reference-driven Formula rebuild. The recipe is only the trigger; the
      // completed gag becomes one coherent single-seater. Keep it simple:
      // narrow nose, broad low sidepods, cockpit cut into the tub, full rear
      // engine body, exposed fronts and slightly larger/wider rear slicks.
      const frontZ=mounts.frontAxle,rearZ=mounts.rearAxle;
      const frontR=.44,rearR=.50,frontW=.25,rearW=.42,frontX=.92,rearX=.95;
      const frontInner=frontX-frontW/2,rearInner=rearX-rearW/2;
      const nose=front+1.08,wingZ=nose+.08,tail=rearZ-.18;

      slot='tyres';
      for(const side of [-1,1]){
        for(const spec of [
          {z:frontZ,r:frontR,w:frontW,x:frontX},
          {z:rearZ,r:rearR,w:rearW,x:rearX}
        ]){
          const cx=side*spec.x,cy=spec.r,cz=spec.z,centre=[cx,cy,cz],capX=cx+side*spec.w/2;
          cylinder(centre,spec.r,spec.w,'x',PALETTE.deep,24,spec.r*.98,true);
          circle([capX+side*.010,cy,cz],spec.r*.70,'x',PALETTE.ink,20,PALETTE.dark);
          circle([capX+side*.018,cy,cz],spec.r*.54,'x',PALETTE.pale,18);
          circle([capX+side*.026,cy,cz],spec.r*.18,'x',PALETTE.dark,14);
          for(let j=0;j<5;j++){
            const a=j/5*Math.PI*2+phase*.035;
            pipe([capX+side*.020,cy,cz],ringPoint([capX+side*.020,cy,cz],spec.r*.49,a,'x'),.024,PALETTE.light);
          }
        }
      }

      slot='chassis';
      // Flat floor and central survival cell.
      face([[-.34,.09,tail],[.34,.09,tail],[.22,.09,nose-.02],[-.22,.09,nose-.02]],PALETTE.deep,PALETTE.ink,.80);
      box(0,.14,-.08,.54,.34,1.56,PALETTE.mid);

      // Narrow nose cone and upper wedge.
      face([[-.10,.18,.50],[.10,.18,.50],[.045,.28,nose],[-.045,.28,nose]],PALETTE.light,PALETTE.dark,.86);
      face([[-.18,.11,.44],[.18,.11,.44],[.08,.14,nose-.04],[-.08,.14,nose-.04]],PALETTE.pale,PALETTE.dark,.78);
      face([[-.13,.26,.44],[.13,.26,.44],[.055,.33,nose-.10],[-.055,.33,nose-.10]],PALETTE.mid,PALETTE.dark,.76);

      // Clean low sidepods. Their outer edges sit almost on the inner tyre line.
      for(const side of [-1,1]){
        box(side*.52,.14,-.20,.40,.34,1.14,side<0?PALETTE.dark:PALETTE.mid);
        face([
          [side*.34,.42,.34],[side*.66,.44,.24],[side*.70,.54,-.10],
          [side*.68,.54,-.58],[side*.58,.44,-.76],[side*.34,.40,-.66]
        ],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.80);
        // Intake cut-out behind front wheel.
        face([[side*.62,.34,.24],[side*.72,.32,.14],[side*.68,.52,-.02],[side*.58,.52,.06]],PALETTE.ink,PALETTE.dark,.72);
        // Lower undercut / floor edge.
        face([[side*.46,.09,.34],[side*.73,.11,.22],[side*.72,.13,-.70],[side*.46,.09,-.82]],side<0?PALETTE.deep:PALETTE.dark,PALETTE.ink,.72);
      }

      // Broad upper body bridge ties the sidepods into the monocoque so the
      // car has real central mass instead of looking like a tray between tyres.
      face([[-.56,.42,.24],[.56,.42,.24],[.62,.50,-.46],[-.62,.50,-.46]],PALETTE.mid,PALETTE.dark,.80);
      face([[-.44,.50,-.40],[.44,.50,-.40],[.34,.60,-.72],[-.34,.60,-.72]],PALETTE.pale,PALETTE.dark,.76);

      // Cockpit is a real cut-out in the tub, with helmet, windscreen and halo.
      face([[-.22,.38,.08],[.22,.38,.08],[.17,.60,-.26],[-.17,.60,-.26]],PALETTE.ink,PALETTE.dark,.88);
      face([[-.18,.56,.12],[.18,.56,.12],[.13,.72,.25],[-.13,.72,.25]],PALETTE.paper,PALETTE.dark,.80);
      circle([0,.64,-.05],.15,'z',PALETTE.pale,18,PALETTE.dark);
      face([[-.13,.64,-.03],[.13,.64,-.03],[.10,.72,.04],[-.10,.72,.04]],PALETTE.deep,PALETTE.dark,.70);
      face([[-.16,.40,-.28],[.16,.40,-.28],[.14,.66,-.44],[-.14,.66,-.44]],PALETTE.dark,PALETTE.ink,.74);
      pipe([-.20,.50,-.24],[-.20,.78,-.40],.034,PALETTE.pale);
      pipe([.20,.50,-.24],[.20,.78,-.40],.034,PALETTE.pale);
      pipe([-.20,.78,-.40],[.20,.78,-.40],.034,PALETTE.light);
      pipe([-.20,.76,-.40],[0,.70,.03],.029,PALETTE.light);
      pipe([.20,.76,-.40],[0,.70,.03],.029,PALETTE.light);

      // Suspension arms show that the wheels are intentionally exposed.
      for(const side of [-1,1]){
        pipe([side*.16,.18,frontZ+.05],[side*(frontInner-.02),frontR*.70,frontZ],.029,PALETTE.dark);
        pipe([side*.13,.29,frontZ-.05],[side*(frontInner-.02),frontR*.91,frontZ],.029,PALETTE.mid);
        pipe([side*.54,.18,rearZ-.02],[side*(rearInner-.02),rearR*.64,rearZ],.031,PALETTE.dark);
        pipe([side*.44,.36,rearZ+.04],[side*(rearInner-.02),rearR*.84,rearZ],.031,PALETTE.mid);
      }

      slot='engine';
      // Full, low rear body / engine cover flowing into the rear shoulders.
      box(0,.26,-.76,.66,.38,.78,PALETTE.dark);
      face([[-.30,.54,-.38],[.30,.54,-.38],[.26,.80,-.88],[-.26,.80,-.88]],PALETTE.mid,PALETTE.dark,.80);
      face([[-.14,.70,-.58],[.14,.70,-.58],[.17,.92,-.84],[-.17,.92,-.84]],PALETTE.pale,PALETTE.dark,.76);
      // Compact airbox behind the driver's head.
      face([[-.09,.88,-.80],[.09,.88,-.80],[.07,1.02,-1.00],[-.07,1.02,-1.00]],PALETTE.light,PALETTE.dark,.70);
      // Rear shoulders fill almost all the gap to the inner rear tyres.
      for(const side of [-1,1]){
        box(side*.55,.18,-.92,.32,.34,.58,side<0?PALETTE.dark:PALETTE.mid);
        face([[side*.40,.44,-.60],[side*.67,.48,-.66],[side*.71,.62,-1.02],[side*.58,.62,-1.14],[side*.36,.52,-1.08]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.76);
      }
      // Wide rear floor / diffuser reads cleanly from behind.
      face([[-.74,.09,rearZ+.12],[.74,.09,rearZ+.12],[.58,.28,rearZ-.32],[-.58,.28,rearZ-.32]],PALETTE.deep,PALETTE.ink,.78);
      for(const x of [-.42,-.21,0,.21,.42])path([[x,.10,rearZ+.08],[x,.24,rearZ-.28]],PALETTE.pale,.85);

      slot='gadget';
      // Front wing approximately wheel-to-wheel, low and layered.
      box(0,.04,wingZ,2.04,.07,.30,PALETTE.dark);
      face([[-1.02,.06,wingZ-.16],[1.02,.06,wingZ-.16],[.80,.18,wingZ+.08],[-.80,.18,wingZ+.08]],PALETTE.pale,PALETTE.dark,.84);
      face([[-.82,.17,wingZ-.04],[.82,.17,wingZ-.04],[.66,.26,wingZ+.11],[-.66,.26,wingZ+.11]],PALETTE.light,PALETTE.dark,.74);
      for(const side of [-1,1]){
        face([[side*.96,.02,wingZ-.17],[side*1.10,.13,wingZ-.12],[side*1.02,.42,wingZ+.10],[side*.82,.22,wingZ+.08]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.78);
        pipe([side*.66,.10,wingZ-.02],[side*.22,.24,front+.24],.027,PALETTE.dark);
      }

      // Lower, wide rear wing behind the rear axle with obvious endplates.
      const rearWingZ=rearZ-.50;
      for(const side of [-1,1]){
        pipe([side*.44,.22,rearZ-.08],[side*.50,.74,rearWingZ+.12],.041,PALETTE.pale);
        pipe([side*.60,.20,rearZ-.10],[side*.66,.76,rearWingZ+.08],.043,PALETTE.mid);
        face([[side*.78,.66,rearWingZ-.17],[side*.98,.78,rearWingZ-.11],[side*.92,1.04,rearWingZ+.18],[side*.72,.88,rearWingZ+.12]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.78);
      }
      box(0,.76,rearWingZ,1.78,.10,.34,PALETTE.dark);
      face([[-.89,.83,rearWingZ-.18],[.89,.83,rearWingZ-.18],[.72,.97,rearWingZ+.12],[-.72,.97,rearWingZ+.12]],PALETTE.pale,PALETTE.dark,.84);
    }else if(form==='rocketcar'){
      // Full-body land-speed streamliner. The recipe is the trigger; the donor
      // Needle/Rocket/Slicks/Rocket-pack geometry is scaffolding and may be
      // completely hidden so the finished silhouette can read as one missile.
      const frontZ=mounts.frontAxle,rearZ=mounts.rearAxle;
      const nose=front+1.92,tail=rearZ-.88;
      const frontR=.30,rearR=.32,frontW=.18,rearW=.22;
      const frontX=.62,rearX=.58;

      slot='tyres';
      // Small high-speed support wheels, mostly tucked into fairings.
      for(const side of [-1,1])for(const spec of [
        {z:frontZ,r:frontR,w:frontW,x:frontX},
        {z:rearZ,r:rearR,w:rearW,x:rearX}
      ]){
        const cx=side*spec.x,cy=spec.r,cz=spec.z,capX=cx+side*spec.w/2;
        cylinder([cx,cy,cz],spec.r,spec.w,'x',PALETTE.deep,22,spec.r*.98,true);
        circle([capX+side*.010,cy,cz],spec.r*.64,'x',PALETTE.dark,18,PALETTE.dark);
        circle([capX+side*.018,cy,cz],spec.r*.44,'x',PALETTE.pale,16);
        circle([capX+side*.026,cy,cz],spec.r*.14,'x',PALETTE.dark,12);
      }

      slot='chassis';
      // Long low belly and needle-point nose.
      face([[-.26,.08,tail+.20],[.26,.08,tail+.20],[.08,.08,nose-.18],[-.08,.08,nose-.18]],PALETTE.deep,PALETTE.ink,.82);
      face([[-.16,.14,.72],[.16,.14,.72],[.035,.28,nose],[-.035,.28,nose]],PALETTE.light,PALETTE.dark,.88);
      face([[-.28,.10,.62],[.28,.10,.62],[.08,.12,nose-.10],[-.08,.12,nose-.10]],PALETTE.pale,PALETTE.dark,.80);

      // One smooth fuselage widening gently through the cockpit and tapering aft.
      for(const side of [-1,1]){
        face([[side*.08,.16,nose-.12],[side*.28,.24,.78],[side*.46,.44,.22],[side*.48,.52,-.52],[side*.40,.48,tail+.28],[side*.22,.18,tail+.16]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.86);
        face([[side*.18,.14,.62],[side*.46,.34,.28],[side*.56,.42,-.42],[side*.46,.36,tail+.18],[side*.20,.16,tail+.10]],side<0?PALETTE.pale:PALETTE.mid,PALETTE.dark,.82);
        // Low skirts visually swallow most of the wheel hardware.
        face([[side*.38,.08,frontZ+.34],[side*.62,.10,frontZ+.18],[side*.62,.12,rearZ-.16],[side*.40,.08,rearZ-.34]],side<0?PALETTE.deep:PALETTE.dark,PALETTE.ink,.74);
      }
      // Central upper spine keeps the top line uninterrupted.
      face([[-.34,.46,.26],[.34,.46,.26],[.30,.62,-.74],[-.30,.62,-.74]],PALETTE.mid,PALETTE.dark,.82);
      face([[-.26,.60,-.68],[.26,.60,-.68],[.20,.78,tail+.20],[-.20,.78,tail+.20]],PALETTE.pale,PALETTE.dark,.78);

      // Cockpit canopy buried into the body rather than sitting on it.
      face([[-.26,.46,.30],[.26,.46,.30],[.20,.70,.02],[-.20,.70,.02]],PALETTE.deep,PALETTE.dark,.84);
      face([[-.20,.68,.04],[.20,.68,.04],[.12,.86,-.20],[-.12,.86,-.20]],PALETTE.paper,PALETTE.dark,.82);
      face([[-.12,.84,-.20],[.12,.84,-.20],[.08,.72,-.42],[-.08,.72,-.42]],PALETTE.mid,PALETTE.dark,.76);

      // Wheel fairings cover the upper/outer wheel surfaces and integrate them
      // into the body, leaving only the lower tyre arcs obvious.
      for(const side of [-1,1])for(const spec of [
        {z:frontZ,r:frontR,x:frontX,half:.28},
        {z:rearZ,r:rearR,x:rearX,half:.30}
      ]){
        face([[side*(spec.x-.12),.08,spec.z-spec.half],[side*(spec.x+.18),.18,spec.z-spec.half*.72],[side*(spec.x+.28),.52,spec.z-.10],[side*(spec.x+.28),.56,spec.z+.10],[side*(spec.x+.18),.18,spec.z+spec.half*.72],[side*(spec.x-.12),.08,spec.z+spec.half]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.80);
      }

      // Small tailplanes and centre fin stabilise the missile silhouette.
      for(const side of [-1,1]){
        face([[side*.28,.18,tail+.18],[side*.60,.22,tail-.10],[side*.78,.40,tail-.30],[side*.34,.32,tail+.02]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.76);
      }
      face([[0,.42,tail+.10],[0,1.02,tail-.48],[.05,.40,tail+.18]],PALETTE.pale,PALETTE.dark,.72);

      slot='engine';
      // The power unit is now an internal centreline turbine, not a visible donor.
      for(const z of [-.58,-.92,-1.22])cylinder([0,.48,z],.26,.05,'z',PALETTE.dark,18,.26);
      face([[-.28,.22,-.48],[.28,.22,-.48],[.22,.56,tail+.28],[-.22,.56,tail+.28]],PALETTE.mid,PALETTE.dark,.74);

      slot='gadget';
      // Large dorsal intake / rocket shroud, inspired by land-speed record cars.
      // It is integrated into the rear body rather than looking like cargo.
      face([[-.28,.60,-.70],[.28,.60,-.70],[.40,1.18,tail+.10],[-.40,1.18,tail+.10]],PALETTE.dark,PALETTE.ink,.86);
      face([[-.40,1.18,tail+.10],[.40,1.18,tail+.10],[.32,1.48,tail-.16],[-.32,1.48,tail-.16]],PALETTE.pale,PALETTE.dark,.84);
      // Dark intake mouth.
      face([[-.30,1.20,tail+.06],[.30,1.20,tail+.06],[.24,1.39,tail-.10],[-.24,1.39,tail-.10]],PALETTE.ink,PALETTE.dark,.82);
      // One absurdly oversized central rocket turbine is the payoff of this
      // form: not a pair of ordinary modular Rocket Pack nozzles. In side
      // projection the rear is screen-right; cinema flame attaches here.
      face([[-.42,.12,tail+.24],[.42,.12,tail+.24],[.38,.76,tail-.27],[-.38,.76,tail-.27]],PALETTE.mid,PALETTE.dark,.86);
      cylinder([0,.42,tail-.34],.40,.40,'z',PALETTE.dark,24,.39);
      circle([0,.42,tail-.56],.33,'z',PALETTE.pale,24,PALETTE.dark);
      circle([0,.42,tail-.58],.25,'z',PALETTE.ink,24,PALETTE.dark);
      circle([0,.42,tail-.59],.12,'z',PALETTE.light,18);
      pipe([-.42,.17,tail+.12],[.42,.17,tail+.12],.055,PALETTE.light);
    }else if(form==='spaceship'){
      // Retro space-car pass 4: keep the readable road wheels, but restore vertical
      // body mass so the pod feels sculpted and toy-like rather than pressed flat.
      const nose=front+.08, tail=back-.08;
      const wheelR=.23, wheelW=.14, frontZ=.70, rearZ=-.72, wheelX=.95;

      slot='tyres';
      // Balloon-road wheels remain deliberately visible; this pass builds the body
      // upward around them instead of burying them again.
      for(const side of [-1,1])for(const z of [frontZ,rearZ]){
        const cx=side*wheelX, cy=.19, capX=cx+side*wheelW/2;
        cylinder([cx,cy,z],wheelR,wheelW,'x',PALETTE.deep,20,wheelR*.98,true);
        circle([capX+side*.008,cy,z],wheelR*.68,'x',PALETTE.pale,18,PALETTE.dark);
        circle([capX+side*.014,cy,z],wheelR*.24,'x',PALETTE.dark,14);
      }

      slot='chassis';
      // Fuller capsule body: low at the nose, swelling through the cockpit and
      // carrying real height into the rear shoulders before the final taper.
      const body=[
        {z:nose,w:.22,lo:.21,hi:.38},
        {z:1.46,w:.56,lo:.18,hi:.46},
        {z:1.04,w:.84,lo:.16,hi:.55},
        {z:.48,w:1.02,lo:.15,hi:.62},
        {z:-.28,w:1.04,lo:.15,hi:.65},
        {z:-.88,w:.88,lo:.17,hi:.62},
        {z:tail+.24,w:.68,lo:.18,hi:.58},
        {z:tail,w:.54,lo:.20,hi:.50}
      ];
      for(let i=0;i<body.length-1;i++){
        const a=body[i],b=body[i+1];
        face([[-a.w,a.hi,a.z],[a.w,a.hi,a.z],[b.w,b.hi,b.z],[-b.w,b.hi,b.z]],i<2?PALETTE.light:PALETTE.pale,PALETTE.dark,.84);
        face([[a.w,a.lo,a.z],[a.w,a.hi,a.z],[b.w,b.hi,b.z],[b.w,b.lo,b.z]],PALETTE.mid,PALETTE.dark,.82);
        face([[-a.w,a.lo,a.z],[-a.w,a.hi,a.z],[-b.w,b.hi,b.z],[-b.w,b.lo,b.z]],PALETTE.dark,PALETTE.ink,.82);
        face([[-a.w,a.lo,a.z],[a.w,a.lo,a.z],[b.w,b.lo,b.z],[-b.w,b.lo,b.z]],PALETTE.deep,PALETTE.ink,.70);
      }
      // Broad lower belt gives the toy-space-car two-tone body read while the
      // upper shoulder now rises clearly above it.
      for(const side of [-1,1]){
        face([[side*.48,.18,1.10],[side*.92,.18,.44],[side*.90,.18,-.46],[side*.52,.20,tail+.16],[side*.42,.39,tail+.10],[side*.74,.41,-.42],[side*.76,.39,.36],[side*.44,.36,1.00]],side<0?PALETTE.ink:PALETTE.deep,PALETTE.ink,.68);
      }
      // Raised cockpit shoulder / sill. This extra step is what stops the side
      // profile reading as one flat slab beneath the glass.
      face([[-.70,.55,.78],[.70,.55,.78],[.80,.63,-.56],[-.80,.63,-.56]],PALETTE.mid,PALETTE.dark,.74);
      face([[-.58,.49,1.00],[.58,.49,1.00],[.70,.55,.78],[-.70,.55,.78]],PALETTE.light,PALETTE.dark,.70);

      // Proud bubble canopy: still broad and retro, but visibly perched above the
      // body instead of being sunk almost flush into it.
      const dome=[
        {z:.94,w:.28,base:.58,peak:.70},
        {z:.72,w:.58,base:.60,peak:.88},
        {z:.40,w:.78,base:.62,peak:1.04},
        {z:.04,w:.84,base:.63,peak:1.10},
        {z:-.30,w:.80,base:.63,peak:1.06},
        {z:-.60,w:.64,base:.61,peak:.91},
        {z:-.78,w:.36,base:.59,peak:.73}
      ], seg=10;
      const arc=(s,j)=>{
        const a=Math.PI-j/seg*Math.PI;
        return [Math.cos(a)*s.w, s.base+Math.sin(a)*(s.peak-s.base), s.z];
      };
      for(let i=0;i<dome.length-1;i++){
        const a=dome[i],b=dome[i+1];
        for(let j=0;j<seg;j++){
          const p1=arc(a,j),p2=arc(a,j+1),p3=arc(b,j+1),p4=arc(b,j);
          face([p1,p2,p3,p4],j<seg/2?PALETTE.dark:PALETTE.paper,PALETTE.dark,.50);
        }
      }
      // Canopy framing follows the taller dome.
      face([[-.30,.58,.90],[.30,.58,.90],[.22,.70,.90],[-.22,.70,.90]],PALETTE.dark,PALETTE.dark,.58);
      face([[-.34,.59,-.82],[.34,.59,-.82],[.24,.72,-.82],[-.24,.72,-.82]],PALETTE.dark,PALETTE.dark,.58);
      pipe([-.11,.68,.84],[-.09,1.10,.06],.026,PALETTE.pale);
      pipe([-.09,1.10,.06],[-.09,.75,-.76],.026,PALETTE.pale);
      pipe([.11,.68,.84],[.09,1.10,.06],.026,PALETTE.pale);
      pipe([.09,1.10,.06],[.09,.75,-.76],.026,PALETTE.pale);
      // Seat and steering wheel remain visible beneath the glass rather than
      // floating at the old canopy height.
      face([[-.24,.58,-.18],[.24,.58,-.18],[.20,.78,-.38],[-.20,.78,-.38]],PALETTE.dark,PALETTE.ink,.70);
      circle([-.20,.69,.16],.085,'y',PALETTE.dark,12,PALETTE.dark);

      // Elevated rear deck and paired tail fins. The deck now climbs away from the
      // cabin so the tail has volume before the fins begin, rather than being a
      // flat plank with triangles stuck to it.
      face([[-.74,.57,-.64],[.74,.57,-.64],[.60,.68,tail+.12],[-.60,.68,tail+.12]],PALETTE.mid,PALETTE.dark,.78);
      face([[-.62,.62,-.42],[.62,.62,-.42],[.54,.74,tail+.10],[-.54,.74,tail+.10]],PALETTE.pale,PALETTE.dark,.68);
      for(const side of [-1,1]){
        face([[side*.46,.59,-.64],[side*.61,.68,tail+.14],[side*.59,.94,tail+.02],[side*.50,.78,-.40]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.80);
        pipe([side*.47,.61,-.62],[side*.59,.94,tail+.02],.018,side<0?PALETTE.dark:PALETTE.light);
      }

      slot='engine';
      // Rocket drivetrain disappears inside the fuller rear power spine.
      face([[-.20,.22,-.40],[.20,.22,-.40],[.18,.50,tail+.14],[-.18,.50,tail+.14]],PALETTE.mid,PALETTE.dark,.68);

      slot='gadget';
      // Twin rocket mouths remain integrated, now sitting inside a taller tail.
      face([[-.31,.22,tail+.14],[.31,.22,tail+.14],[.26,.52,tail-.02],[-.26,.52,tail-.02]],PALETTE.dark,PALETTE.ink,.74);
      for(const x of [-.17,.17]){
        cylinder([x,.40,tail-.01],.105,.10,'z',PALETTE.mid,16,.10);
        circle([x,.40,tail-.065],.078,'z',PALETTE.ink,14);
      }
    }else if(form==='burger'){
      // Full-body Burger Wagon. The recipe is merely the trigger; the finished
      // gag is allowed to completely bury the donor Brick/Motor/Fan geometry.
      const frontZ=mounts.frontAxle,rearZ=mounts.rearAxle,centreZ=(frontZ+rearZ)/2;
      const wheelR=.56,wheelW=.46,wheelX=.92;
      const ep=(rx,rz,y,a,z0=centreZ)=>[Math.cos(a)*rx,y,z0+Math.sin(a)*rz];
      function ovalShell(profile,colours){
        const n=24;
        for(let k=0;k<profile.length-1;k++){
          const [y1,rx1,rz1]=profile[k],[y2,rx2,rz2]=profile[k+1];
          for(let j=0;j<n;j++){
            const a=j/n*Math.PI*2,b=(j+1)/n*Math.PI*2;
            face([ep(rx1,rz1,y1,a),ep(rx1,rz1,y1,b),ep(rx2,rz2,y2,b),ep(rx2,rz2,y2,a)],colours[k%colours.length],PALETTE.dark,.72);
          }
        }
        const first=profile[0],last=profile.at(-1);
        face(Array.from({length:n},(_,j)=>ep(first[1],first[2],first[0],j/n*Math.PI*2)),colours[0],PALETTE.dark,.65);
        if(last[1]>.02&&last[2]>.02)face(Array.from({length:n},(_,j)=>ep(last[1],last[2],last[0],j/n*Math.PI*2)),colours.at(-1),PALETTE.dark,.65);
      }

      slot='tyres';
      // Puffy Balloon-tyre-inspired comedy wheels.
      for(const side of [-1,1])for(const z of [frontZ,rearZ]){
        const cx=side*wheelX,cy=wheelR,capX=cx+side*wheelW/2;
        cylinder([cx,cy,z],wheelR,wheelW,'x',PALETTE.deep,22,wheelR*.95,true);
        circle([capX+side*.010,cy,z],wheelR*.66,'x',PALETTE.mid,20);
        circle([capX+side*.020,cy,z],wheelR*.41,'x',PALETTE.pale,16);
        circle([capX+side*.028,cy,z],wheelR*.15,'x',PALETTE.dark,12);
      }

      slot='chassis';
      // Lower bun: rounded and clearly bread-like rather than a rectangular tray.
      ovalShell([
        [.36,.72,1.05],[.46,1.00,1.38],[.64,1.10,1.48],[.78,1.02,1.42],[.86,.84,1.24]
      ],['#b7743e','#dba45c','#efd29a']);

      // Patty: thick dark oval band.
      ovalShell([
        [.82,.92,1.34],[.88,1.06,1.46],[1.03,1.06,1.46],[1.10,.94,1.34]
      ],['#54332c','#79503b']);

      // Cheese slice as a broad square-ish layer with droopy corners.
      face([[-1.02,1.08,centreZ-1.24],[1.02,1.08,centreZ-1.24],[1.04,1.08,centreZ+1.24],[-1.04,1.08,centreZ+1.24]],'#f0c64c',PALETTE.dark,.75);
      for(const side of [-1,1]){
        face([[side*.72,1.09,centreZ+.45],[side*1.18,1.05,centreZ+.28],[side*.92,.88,centreZ+.10]],'#e8bf49',PALETTE.dark,.7);
        face([[side*.66,1.09,centreZ-.52],[side*1.14,1.05,centreZ-.72],[side*.88,.88,centreZ-.90]],'#e8bf49',PALETTE.dark,.7);
      }

      // Wavy lettuce / sauce band around the burger.
      for(const side of [-1,1]){
        path([[side*.86,1.18,centreZ-1.22],[side*1.06,1.25,centreZ-.78],[side*.90,1.30,centreZ-.32],[side*1.08,1.24,centreZ+.18],[side*.90,1.31,centreZ+.66],[side*1.02,1.22,centreZ+1.20]],'#5e9b43',4.0);
      }

      // Top bun: true rounded dome built from elliptical rings.
      ovalShell([
        [1.18,.88,1.28],[1.30,1.06,1.46],[1.48,1.12,1.50],[1.70,1.04,1.42],[1.90,.86,1.18],[2.06,.58,.82],[2.16,.18,.26]
      ],['#b67d40','#d9a35a','#f2c879','#eac187']);

      // Sesame marks across the dome.
      for(const [x,y,z] of [[-.42,1.96,centreZ+.28],[-.16,2.07,centreZ+.08],[.18,2.02,centreZ+.26],[.42,1.91,centreZ-.04],[-.34,1.88,centreZ+.70],[.02,1.98,centreZ+.76],[.32,1.86,centreZ+.58],[-.06,1.90,centreZ-.52]]){
        pipe([x-.035,y,z-.025],[x+.035,y+.018,z+.025],.012,PALETTE.dark);
      }

      // Driveable front: black split windscreen recessed into the burger face.
      const glassZ=centreZ+1.505;
      face([[-.36,1.22,glassZ],[.36,1.22,glassZ],[.31,1.56,glassZ],[-.31,1.56,glassZ]],PALETTE.ink,PALETTE.dark,.82);
      pipe([0,1.24,glassZ+.01],[0,1.54,glassZ+.01],.018,PALETTE.pale);
      // Little eyebrow/visor above the glass.
      face([[-.42,1.60,glassZ-.02],[.42,1.60,glassZ-.02],[.34,1.67,glassZ+.08],[-.34,1.67,glassZ+.08]],PALETTE.pale,PALETTE.dark,.72);

      // Tray-style bumper / lower lip.
      box(0,.28,centreZ+1.58,1.52,.12,.24,PALETTE.dark);
      for(const side of [-1,1])pipe([side*.66,.30,centreZ+1.54],[side*.80,.44,centreZ+1.28],.035,PALETTE.pale);

      slot='engine';
      // Rear vent / griddle exhaust hint. The actual Clunker is hidden.
      const rearFace=centreZ-1.50;
      box(0,.52,rearFace,.74,.18,.18,PALETTE.dark);
      for(const x of [-.22,0,.22])circle([x,.61,rearFace-.10],.055,'z',PALETTE.pale,10,PALETTE.dark);

      slot='gadget';
      // Cooling-fan influence becomes a tiny roof spinner/vent.
      cylinder([0,2.16,centreZ-.12],.14,.14,'y',PALETTE.dark,12,.10);
      for(let j=0;j<4;j++){
        const a=j/4*Math.PI*2+phase*.16;
        pipe([0,2.25,centreZ-.12],[Math.cos(a)*.22,2.25,centreZ-.12+Math.sin(a)*.22],.022,PALETTE.pale);
      }

    }else if(form==='boat'){
      // Pass 5: tighten the boat around the SpongeBob-style references. Make
      // it a cohesive little three-wheeled boat-car with a properly attached
      // nose wheel and a built-in cockpit/bench rather than loose shapes on
      // top of the hull.
      const bow=front+.10, stern=back-.14;
      const frontWheel={z:mounts.frontAxle+.08,r:.13,w:.10};
      const rearWheel={z:mounts.rearAxle-.02,r:.14,w:.09,x:.58};

      slot='tyres';
      // Centred nose wheel, now clearly attached with a proper fork/stem.
      cylinder([0,.18,frontWheel.z],frontWheel.r,frontWheel.w,'x',PALETTE.deep,16,frontWheel.r*.96,true);
      circle([frontWheel.w/2+.012,.18,frontWheel.z],frontWheel.r*.72,'x',PALETTE.mid,12);
      circle([frontWheel.w/2+.018,.18,frontWheel.z],frontWheel.r*.42,'x',PALETTE.pale,10);
      circle([frontWheel.w/2+.022,.18,frontWheel.z],frontWheel.r*.14,'x',PALETTE.dark,8);
      // Strong single front stem and fork so it no longer appears to float.
      pipe([0,.54,.74],[0,.22,frontWheel.z],.050,PALETTE.dark);
      face([[-.08,.56,.68],[.08,.56,.68],[.10,.40,frontWheel.z+.02],[0,.32,frontWheel.z+.12],[-.10,.40,frontWheel.z+.02]],PALETTE.dark,PALETTE.ink,.86);
      pipe([-.08,.42,frontWheel.z-.01],[0,.22,frontWheel.z],.030,PALETTE.dark);
      pipe([.08,.42,frontWheel.z-.01],[0,.22,frontWheel.z],.030,PALETTE.dark);

      // Paired rear wheels tucked near the stern.
      for(const side of [-1,1]){
        const cx=side*rearWheel.x,cy=.17,capX=cx+side*rearWheel.w/2;
        cylinder([cx,cy,rearWheel.z],rearWheel.r,rearWheel.w,'x',PALETTE.deep,16,rearWheel.r*.95,true);
        circle([capX+side*.008,cy,rearWheel.z],rearWheel.r*.70,'x',PALETTE.mid,12);
        circle([capX+side*.014,cy,rearWheel.z],rearWheel.r*.40,'x',PALETTE.pale,10);
        circle([capX+side*.018,cy,rearWheel.z],rearWheel.r*.14,'x',PALETTE.dark,8);
        pipe([side*.52,.38,rearWheel.z],[cx,.20,rearWheel.z],.036,PALETTE.dark);
      }

      slot='chassis';
      // Lower hull / keel.
      face([[-.90,.32,.94],[.90,.32,.94],[1.00,.38,.20],[.84,.40,stern+.04],[-.84,.40,stern+.04],[-1.00,.38,.20]],PALETTE.deep,PALETTE.ink,.84);
      face([[-.12,.18,stern+.04],[.12,.18,stern+.04],[.08,.18,.92],[-.08,.18,.92]],PALETTE.dark,PALETTE.ink,.66);

      // Smooth chunky boat hull.
      for(const side of [-1,1]){
        face([
          [side*.52,.84,bow],[side*.84,.66,.92],[side*1.06,.58,.30],[side*1.08,.58,-.18],[side*.98,.68,stern-.02],
          [side*.76,.90,stern-.12],[side*.42,1.02,stern-.14],[side*.28,1.00,.52]
        ],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.92);
        face([
          [side*.46,.52,.90],[side*.98,.44,.30],[side*.94,.46,stern-.02],[side*.40,.56,stern-.10]
        ],side<0?PALETTE.dark:PALETTE.deep,PALETTE.ink,.78);
        face([
          [side*.46,1.04,bow+.00],[side*.70,1.10,.50],[side*.76,1.12,-.04],[side*.72,1.10,stern-.12],[side*.40,1.08,stern-.14],[side*.28,1.04,.42]
        ],side<0?PALETTE.pale:PALETTE.light,PALETTE.dark,.78);
        // Door cut line on the flank.
        face([[side*.68,.74,.18],[side*.84,.73,.14],[side*.82,.54,-.08],[side*.64,.56,-.02]],PALETTE.paper,PALETTE.dark,.20);
        // Tiny winglet at the stern like the reference side fins.
        face([[side*.96,.84,stern-.00],[side*1.16,.74,stern-.06],[side*.96,.68,stern-.14]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.70);
        // Porthole / headlight-ish dot.
        circle([side*.90,.72,.14],.085,'x',PALETTE.paper,12,PALETTE.dark);
        circle([side*(.90+.026),.72,.14],.034,'x',PALETTE.light,10);
      }

      // Bow and stern closures.
      face([[-.94,.56,.86],[.94,.56,.86],[.58,.78,bow],[-.58,.78,bow]],PALETTE.light,PALETTE.dark,.84);
      face([[-.92,.60,stern-.06],[.92,.60,stern-.06],[.72,.98,stern-.16],[-.72,.98,stern-.16]],PALETTE.mid,PALETTE.dark,.84);
      // Clean foredeck.
      face([[-.66,.94,.84],[.66,.94,.84],[.40,1.02,bow+.02],[-.40,1.02,bow+.02]],PALETTE.pale,PALETTE.dark,.78);
      face([[-.46,1.00,.48],[.46,1.00,.48],[.30,1.02,-.10],[-.30,1.02,-.10]],PALETTE.paper,PALETTE.dark,.60);

      // Built-in cockpit tub, open through the middle/rear rather than a seat
      // perched on top.
      face([[-.52,.96,-.08],[.52,.96,-.08],[.46,.98,-1.12],[-.46,.98,-1.12]],PALETTE.ink,PALETTE.dark,.92);
      face([[-.40,.78,-.20],[.40,.78,-.20],[.36,.80,-1.00],[-.36,.80,-1.00]],PALETTE.deep,PALETTE.ink,.60);

      // Wraparound windshield at the front of the cockpit.
      face([[-.34,1.00,-.20],[.34,1.00,-.20],[.28,1.16,-.42],[-.28,1.16,-.42]],PALETTE.paper,PALETTE.dark,.82);
      for(const side of [-1,1]){
        face([[side*.34,1.00,-.20],[side*.28,1.16,-.42],[side*.24,1.12,-.78],[side*.26,.98,-.62]],side<0?PALETTE.pale:PALETTE.light,PALETTE.dark,.74);
      }
      pipe([-.24,1.16,-.42],[.24,1.16,-.42],.018,PALETTE.light);

      // Integrated rear bench seat with rounded back, sitting inside the hull.
      face([[-.38,.90,-.70],[.38,.90,-.70],[.36,.90,-1.06],[-.36,.90,-1.06]],PALETTE.dark,PALETTE.dark,.86);
      face([[-.40,.92,-1.00],[.40,.92,-1.00],[.36,1.18,-1.20],[-.36,1.18,-1.20]],PALETTE.mid,PALETTE.dark,.86);
      for(const x of [-.24,-.08,.08,.24]) path([[x,.93,-1.00],[x,1.15,-1.18]],PALETTE.pale,1.0);

      // Steering wheel just ahead of the bench.
      circle([-.12,.98,-.54],.080,'y',PALETTE.dark,12,PALETTE.dark);
      pipe([-.12,.88,-.54],[-.05,.78,-.62],.018,PALETTE.dark);

      slot='engine';
      // Simple rear motor cap/pod inspired by the reference outboard block.
      cylinder([-.44,1.06,stern-.00],.15,.14,'y',PALETTE.mid,14,.13);
      cylinder([-.44,1.14,stern-.00],.18,.08,'y',PALETTE.light,14,.16);
      face([[-.44,.92,stern+.02],[-.24,.92,stern+.02],[-.28,1.00,stern-.08],[-.42,1.00,stern-.08]],PALETTE.pale,PALETTE.dark,.70);

      slot='gadget';
      // Rear propeller and bow flag.
      pipe([-.44,.92,stern-.06],[-.44,.22,stern-.18],.034,PALETTE.dark);
      cylinder([-.44,.18,stern-.22],.034,.09,'y',PALETTE.light,10,.04);
      for(let j=0;j<3;j++){
        const a=j/3*Math.PI*2+phase*.16;
        pipe([-.44,.18,stern-.22],[-.44+Math.cos(a)*.11,.18+Math.sin(a)*.04,stern-.22+Math.sin(a)*.10],.014,PALETTE.pale);
      }
      pipe([.20,.98,.86],[.20,1.38,.86],.016,PALETTE.pale);
      face([[.20,1.30,.86],[.20,1.14,.86],[.38,1.22,.78]],PALETTE.mid,PALETTE.dark,.68);
    }else if(form==='mower'){




      // Full four-part reveal. The tiny Soapbox, Clunker motor, Scrap racer
      // wheels and Yard handle stay intact underneath; the treatment wraps
      // them into a squat cartoon mower only once every signature part is fit.
      slot='chassis';
      const deckTop=deck+.28,deckBottom=Math.max(.10,deck-.05),nose=front+.36,tail=back+.22,half=Math.max(.92,bodyW+.34);
      box(0,deckTop,(tail+nose)/2,half*2,.18,nose-tail,PALETTE.mid);
      face([[-half,deckBottom,tail+.10],[half,deckBottom,tail+.10],[half*.90,deckBottom,nose-.04],[-half*.90,deckBottom,nose-.04]],PALETTE.dark,PALETTE.ink,.9);
      face([[-half*.72,deckTop+.16,nose-.02],[half*.72,deckTop+.16,nose-.02],[half*.54,deckTop+.34,nose+.18],[-half*.54,deckTop+.34,nose+.18]],PALETTE.pale,PALETTE.dark,.8);
      face([[half*.62,deckTop+.03,front-.02],[half+.20,deckTop+.04,front+.07],[half+.12,deckTop+.24,front+.33],[half*.56,deckTop+.20,front+.21]],PALETTE.light,PALETTE.dark,.7);
      for(const side of [-1,1])for(const z of [mounts.rearAxle,mounts.frontAxle]){
        face([[side*(axle-.08),deck+.40,z-.21],[side*(axle+.18),deck+.64,z-.10],[side*(axle+.18),deck+.64,z+.10],[side*(axle-.08),deck+.40,z+.21]],side<0?PALETTE.dark:PALETTE.pale,PALETTE.dark,.65);
      }
      box(0,deck+.86,back-.04,.54,.09,.36,PALETTE.dark);
      face([[-.20,deck+.78,back-.12],[.20,deck+.78,back-.12],[.20,deck+1.18,back-.18],[-.20,deck+1.18,back-.18]],PALETTE.pale,PALETTE.dark,.8);
      box(0,deck+1.05,back-.23,.46,.22,.10,PALETTE.mid);

      slot='engine';
      face([[-.44,ey+.52,ez+.34],[.44,ey+.52,ez+.34],[.37,ey+.86,ez+.08],[-.37,ey+.86,ez+.08]],PALETTE.light,PALETTE.dark,.9);
      face([[-.37,ey+.86,ez+.08],[.37,ey+.86,ez+.08],[.25,ey+1.05,ez-.18],[-.25,ey+1.05,ez-.18]],PALETTE.pale,PALETTE.dark,.9);
      for(const x of [-.20,0,.20])path([[x,ey+.80,ez+.16],[x,ey+.96,ez-.05]],PALETTE.dark,1.1);
      pipe([-.39,ey+.64,ez+.26],[-.58,ey+.94,ez+.06],.04,PALETTE.dark);
      pipe([.39,ey+.64,ez+.26],[.58,ey+.94,ez+.06],.04,PALETTE.dark);

      slot='gadget';
      for(const side of [-1,1]){
        pipe([side*.56,deck+1.04,gz-.32],[side*.74,deck+1.52,gz-.88],.048,PALETTE.pale);
        pipe([side*.22,deck+.36,gz+.20],[side*.40,deck+.98,gz-.02],.045,PALETTE.dark);
      }
      pipe([-.74,deck+1.52,gz-.88],[.74,deck+1.52,gz-.88],.055,PALETTE.light);
      box(0,deck+.58,gz+.44,.92,.52,.40,PALETTE.pale);
      box(0,deck+.68,gz+.59,.64,.30,.17,PALETTE.mid);
      for(const side of [-1,1])pipe([side*.34,deck+.42,gz+.26],[side*.18,deck+.22,back+.12],.042,PALETTE.dark);

    }else if(form==='icecream'){
      // Full silhouette transform: a chunky vintage ice-cream van. Keep this
      // first pass structural and readable: old cab, tall serving box, hatch,
      // awning, roof cooler, giant ice-cream sign and ordinary road wheels.
      const frontZ=1.18,rearZ=-1.20,wheelX=.92,wheelR=.42,wheelW=.22;
      const cabFront=1.82,cabRear=.34,boxFront=.38,boxRear=-1.62;

      slot='tyres';
      for(const rear of [false,true])for(const side of [-1,1]){
        const z=rear?rearZ:frontZ,x=side*wheelX,capX=x+side*wheelW/2;
        cylinder([x,wheelR,z],wheelR,wheelW,'x',PALETTE.deep,20,wheelR*.98,true);
        circle([capX+side*.010,wheelR,z],wheelR*.66,'x',PALETTE.mid,18,PALETTE.dark);
        circle([capX+side*.018,wheelR,z],wheelR*.42,'x',PALETTE.pale,16);
        circle([capX+side*.024,wheelR,z],wheelR*.14,'x',PALETTE.dark,10);
        pipe([side*.70,.46,z],[x,wheelR,z],.032,PALETTE.dark);
      }

      slot='chassis';
      // Low floor and old commercial-van cab.
      box(0,.30,-.08,1.62,.22,3.34,PALETTE.dark);
      box(0,.46,1.18,1.58,.68,1.30,PALETTE.mid);
      // Blunt bonnet / grille face.
      face([[-.60,.54,cabFront],[.60,.54,cabFront],[.55,1.10,cabFront],[-.55,1.10,cabFront]],PALETTE.pale,PALETTE.dark,.86);
      face([[-.34,.62,cabFront+.012],[.34,.62,cabFront+.012],[.34,1.00,cabFront+.012],[-.34,1.00,cabFront+.012]],PALETTE.ink,PALETTE.dark,.78);
      for(let x=-.26;x<=.26;x+=.085)path([[x,.68,cabFront+.018],[x,.95,cabFront+.018]],PALETTE.mid,.7);
      for(const side of [-1,1])circle([side*.51,.84,cabFront+.02],.14,'z',PALETTE.paper,14,PALETTE.dark);
      // Cab upper shell and windscreen.
      face([[-.74,1.10,cabRear],[.74,1.10,cabRear],[.62,1.78,.72],[-.62,1.78,.72]],PALETTE.mid,PALETTE.dark,.82);
      face([[-.60,1.16,1.06],[.60,1.16,1.06],[.48,1.72,.72],[-.48,1.72,.72]],PALETTE.ink,PALETTE.dark,.82);
      pipe([0,1.18,1.05],[0,1.70,.74],.018,PALETTE.pale);
      // Small cab side window on visible side.
      face([[.78,1.16,.48],[.79,1.16,.86],[.79,1.66,.72],[.78,1.66,.42]],PALETTE.ink,PALETTE.dark,.72);

      // Tall rear ice-cream box.
      box(0,.48,(boxFront+boxRear)/2,1.78,1.48,boxFront-boxRear,PALETTE.mid);
      // Roof slab with rounded-ish overhang.
      box(0,1.94,(boxFront+boxRear)/2,1.92,.16,boxFront-boxRear+.14,PALETTE.pale);
      face([[-.84,1.88,boxFront],[.84,1.88,boxFront],[.70,2.08,.52],[-.70,2.08,.52]],PALETTE.light,PALETTE.dark,.72);

      // Large serving hatch cut into the visible side.
      face([[.895,.94,-1.28],[.905,.94,.12],[.905,1.74,.12],[.895,1.74,-1.28]],PALETTE.ink,PALETTE.dark,.88);
      // Counter shelf under the hatch.
      face([[.90,.90,-1.34],[1.24,.90,-1.34],[1.24,.96,.18],[.90,.96,.18]],PALETTE.pale,PALETTE.dark,.72);
      pipe([1.18,.88,-1.22],[1.18,.48,-1.12],.028,PALETTE.dark);
      pipe([1.18,.88,.06],[1.18,.48,-.04],.028,PALETTE.dark);

      // Striped awning. Alternating palette values survive monochrome well.
      const awnZ=[-1.34,-1.10,-.86,-.62,-.38,-.14,.10,.30];
      for(let i=0;i<awnZ.length-1;i++){
        const z0=awnZ[i],z1=awnZ[i+1];
        face([[.90,1.78,z0],[1.30,1.64,z0],[1.30,1.64,z1],[.90,1.78,z1]],i%2?PALETTE.mid:PALETTE.light,PALETTE.dark,.55);
      }
      for(const z of [-1.34,.30])pipe([.90,1.77,z],[1.28,1.62,z],.024,PALETTE.dark);

      // Rear double doors and little tail lamps.
      face([[-.72,.58,boxRear-.01],[-.02,.58,boxRear-.01],[-.02,1.74,boxRear-.01],[-.72,1.74,boxRear-.01]],PALETTE.dark,PALETTE.ink,.76);
      face([[.02,.58,boxRear-.01],[.72,.58,boxRear-.01],[.72,1.74,boxRear-.01],[.02,1.74,boxRear-.01]],PALETTE.mid,PALETTE.ink,.76);
      for(const x of [-.36,.36]){
        face([[x-.18,1.30,boxRear-.02],[x+.18,1.30,boxRear-.02],[x+.18,1.62,boxRear-.02],[x-.18,1.62,boxRear-.02]],PALETTE.ink,PALETTE.dark,.65);
        circle([x,.72,boxRear-.03],.055,'z',PALETTE.pale,10,PALETTE.dark);
      }

      // Giant roof ice-cream sign: simple cone + soft-serve stack.
      face([[-.24,2.04,.28],[.24,2.04,.28],[.07,2.62,.18],[-.07,2.62,.18]],PALETTE.mid,PALETTE.dark,.76);
      for(const y of [2.62,2.82,3.00]){
        const r=y<2.8?.22:y<2.95?.17:.11;
        cylinder([0,y,.18],r,.14,'y',PALETTE.light,14,r*.88,true);
      }
      face([[-.07,3.05,.18],[.07,3.05,.18],[0,3.20,.16]],PALETTE.pale,PALETTE.dark,.62);

      slot='engine';
      // Inline-four lives under the bonnet: four simple caps and a side manifold.
      for(let i=0;i<4;i++)cylinder([-.28+i*.18,1.08,1.24],.065,.16,'y',PALETTE.dark,10);
      box(0,.98,1.22,.72,.12,.52,PALETTE.pale);
      pipe([-.34,.86,1.08],[-.54,.72,.82],.028,PALETTE.dark);

      slot='gadget';
      // Cooling fan becomes the rooftop refrigeration unit.
      box(.34,2.06,-.74,.70,.34,.58,PALETTE.dark);
      for(const z of [-.94,-.82,-.70,-.58])path([[.00,2.20,z],[.68,2.20,z]],PALETTE.pale,.8);
      circle([.34,2.24,-.45],.16,'y',PALETTE.mid,14,PALETTE.dark);
      for(let j=0;j<4;j++){
        const a=j/4*Math.PI*2+phase*.10;
        pipe([.34,2.24,-.45],[.34+Math.cos(a)*.12,2.24,-.45+Math.sin(a)*.12],.018,PALETTE.light);
      }
    }else if(form==='house'){



      // Full silhouette transform: a tiny crooked house on an old jalopy chassis.
      // Keep the first pass deliberately structural: bonnet, house box, roof,
      // door, windows, chimney and skinny wheels. Final surface art comes later.
      const houseFront=.74,houseRear=-1.42,wallY=.50,wallTop=2.02,half=.88;

      slot='tyres';
      // Four narrow vintage road wheels, visibly attached beneath the house.
      for(const rear of [false,true])for(const side of [-1,1]){
        const z=rear?-1.18:.72, r=rear?.43:.46, w=.12, x=side*.93, capX=x+side*w/2;
        cylinder([x,r,z],r,w,'x',PALETTE.deep,22,r*.98,true);
        circle([capX+side*.008,r,z],r*.77,'x',PALETTE.paper,20,PALETTE.dark);
        circle([capX+side*.016,r,z],r*.18,'x',PALETTE.mid,12);
        for(let j=0;j<10;j++){
          const a=j/10*Math.PI*2;
          pipe([capX+side*.018,r,z],ringPoint([capX+side*.018,r,z],r*.70,a,'x'),.020,PALETTE.dark);
        }
        pipe([side*.72,.48,z],[x,r,z],.032,PALETTE.dark);
      }

      slot='chassis';
      // Old-car ladder frame and bonnet in front of the house.
      for(const side of [-1,1])pipe([side*.62,.34,-1.44],[side*.62,.34,1.72],.060,PALETTE.dark);
      pipe([-.62,.34,.72],[.62,.34,.72],.055,PALETTE.mid);
      pipe([-.62,.34,-1.18],[.62,.34,-1.18],.055,PALETTE.mid);
      box(0,.42,1.24,1.28,.46,1.06,PALETTE.mid);
      face([[-.64,.88,.72],[.64,.88,.72],[.50,1.02,1.75],[-.50,1.02,1.75]],PALETTE.pale,PALETTE.dark,.82);
      // Radiator and lamps make the front unmistakably an old jalopy.
      face([[-.42,.48,1.80],[.42,.48,1.80],[.42,.94,1.80],[-.42,.94,1.80]],PALETTE.ink,PALETTE.dark,.82);
      for(let x=-.32;x<=.32;x+=.08)path([[x,.54,1.805],[x,.88,1.805]],PALETTE.mid,.7);
      for(const side of [-1,1]){
        circle([side*.58,.74,1.68],.16,'z',PALETTE.paper,16,PALETTE.dark);
        face([[side*.68,.48,1.38],[side*1.06,.52,1.16],[side*1.08,.66,.52],[side*.72,.62,.62]],side<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.72);
      }

      // Main house walls.
      box(0,wallY,(houseFront+houseRear)/2,half*2,wallTop-wallY,houseFront-houseRear,PALETTE.mid);
      // Front gable wall / porch face.
      face([[-half,wallTop,houseFront],[half,wallTop,houseFront],[0,2.78,houseFront]],PALETTE.pale,PALETTE.dark,.90);
      // Rear gable ties the roof together.
      face([[-half,wallTop,houseRear],[half,wallTop,houseRear],[0,2.78,houseRear]],PALETTE.mid,PALETTE.dark,.86);

      // Roof: two broad pitched planes with small overhang.
      face([[-1.03,2.00,houseRear-.12],[0,2.82,houseRear-.12],[0,2.82,houseFront+.12],[-1.03,2.00,houseFront+.12]],'#9d4f42',PALETTE.ink,.92);
      face([[0,2.82,houseRear-.12],[1.03,2.00,houseRear-.12],[1.03,2.00,houseFront+.12],[0,2.82,houseFront+.12]],'#c8755a',PALETTE.dark,.92);
      pipe([0,2.83,houseRear-.14],[0,2.83,houseFront+.14],.035,PALETTE.light);

      // Side door and window on the visible wall.
      face([[.885,.62,-.90],[.895,.62,-.18],[.895,1.82,-.18],[.885,1.82,-.90]],PALETTE.deep,PALETTE.dark,.82);
      circle([.91,1.14,-.26],.035,'x',PALETTE.paper,8,PALETTE.dark);
      face([[.89,1.05,.00],[.90,1.05,.55],[.90,1.62,.55],[.89,1.62,.00]],PALETTE.paper,PALETTE.dark,.78);
      path([[.905,1.05,.275],[.905,1.62,.275]],PALETTE.dark,1.0);
      path([[.905,1.335,.00],[.905,1.335,.55]],PALETTE.dark,1.0);
      // Front-facing upper window.
      face([[-.34,1.48,houseFront+.006],[.34,1.48,houseFront+.006],[.34,2.12,houseFront+.006],[-.34,2.12,houseFront+.006]],PALETTE.paper,PALETTE.dark,.78);
      path([[0,1.48,houseFront+.012],[0,2.12,houseFront+.012]],PALETTE.dark,1.0);

      // Small porch canopy and step under the door.
      face([[.60,1.90,-.98],[1.12,1.90,-.98],[1.06,2.08,-.16],[.62,2.08,-.16]],PALETTE.pale,PALETTE.dark,.72);
      box(.92,.48,-.62,.30,.16,.48,PALETTE.dark);
      box(.92,.34,-.62,.42,.12,.62,PALETTE.mid);

      slot='engine';
      // Inline-four hint under the bonnet: four simple top caps.
      for(let i=0;i<4;i++){
        const z=.92+i*.18;
        cylinder([-.18,1.03,z],.07,.18,'x',PALETTE.dark,10);
      }
      box(0,.94,1.22,.72,.12,.68,PALETTE.pale);

      slot='gadget';
      // Utility-frame recipe element becomes house bracing / porch framing.
      for(const x of [-.74,.74]){
        pipe([x,.60,houseFront+.02],[x,2.02,houseFront+.02],.035,PALETTE.light);
        pipe([x,2.02,houseFront+.02],[0,2.78,houseFront+.02],.030,PALETTE.pale);
      }
      // Crooked chimney is the strongest house read from race scale.
      box(-.34,2.28,-.58,.34,.92,.36,PALETTE.dark);
      box(-.34,3.18,-.58,.44,.12,.46,PALETTE.pale);
    }else if(form==='plane'){
      // Reference-driven 3D Prop Plane / wing-car hybrid. Car first, aircraft
      // second: long boxy roadster, open cockpit, elevated rear wing-deck, broad
      // side wings, one large tail fin, and a parasol wing on visible struts.
      const bodyFront=1.92,bodyRear=-1.70,nose=2.18,tail=-2.18;
      const frontAx=1.24,rearAx=-1.26,wheelX=.84,frontR=.36,rearR=.34,wheelW=.13;
      const low=.26,bodyTop=.78,rearTop=1.08,half=.76,topHalf=.61;

      slot='tyres';
      // Skinny-spoke recipe wheels: narrow vintage road wheels tucked under the car.
      for(const side of [-1,1])for(const spec of [{z:frontAx,r:frontR},{z:rearAx,r:rearR}]){
        const x=side*wheelX,capX=x+side*wheelW/2;
        cylinder([x,spec.r,spec.z],spec.r,wheelW,'x',PALETTE.deep,20,spec.r*.98,true);
        circle([capX+side*.008,spec.r,spec.z],spec.r*.78,'x',PALETTE.paper,18,PALETTE.dark);
        circle([capX+side*.016,spec.r,spec.z],spec.r*.17,'x',PALETTE.mid,12);
        for(let j=0;j<10;j++){
          const a=j/10*Math.PI*2;
          pipe([capX+side*.016,spec.r,spec.z],ringPoint([capX+side*.016,spec.r,spec.z],spec.r*.70,a,'x'),.018,PALETTE.dark);
        }
      }

      slot='chassis';
      // Long low box-car body, slightly narrower at the top so it reads like a
      // vintage roadster rather than a rectangular plank.
      face([[-half,low,bodyRear],[half,low,bodyRear],[half,low,bodyFront],[-half,low,bodyFront]],PALETTE.deep,PALETTE.ink,.78);
      face([[-half,low,bodyFront],[-half,low,bodyRear],[-topHalf,bodyTop,bodyRear],[-topHalf,bodyTop,bodyFront]],PALETTE.dark,PALETTE.ink,.82);
      face([[half,low,bodyRear],[half,low,bodyFront],[topHalf,bodyTop,bodyFront],[topHalf,bodyTop,bodyRear]],PALETTE.mid,PALETTE.dark,.82);
      face([[-half,low,bodyFront],[half,low,bodyFront],[topHalf,bodyTop,bodyFront],[-topHalf,bodyTop,bodyFront]],PALETTE.mid,PALETTE.dark,.82);

      // Flat bonnet and a clearly open cockpit cut into the middle.
      face([[-topHalf,bodyTop,.30],[topHalf,bodyTop,.30],[topHalf,bodyTop,bodyFront],[-topHalf,bodyTop,bodyFront]],PALETTE.light,PALETTE.dark,.74);
      for(const side of [-1,1]){
        face([[side*topHalf,bodyTop,.24],[side*topHalf,bodyTop,-.60],[side*.55,.96,-.56],[side*.55,.94,.18]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.78);
      }
      face([[-.43,.78,.18],[.43,.78,.18],[.40,.78,-.54],[-.40,.78,-.54]],PALETTE.ink,PALETTE.dark,.92);
      for(const side of [-1,1])pipe([side*.55,.96,.18],[side*.55,1.00,-.54],.027,PALETTE.light);
      pipe([-.55,1.00,-.54],[.55,1.00,-.54],.027,PALETTE.pale);
      face([[-.32,.54,.10],[.32,.54,.10],[.30,.54,-.50],[-.30,.54,-.50]],PALETTE.deep,PALETTE.ink,.64);
      // High visible seat, so the cockpit reads immediately.
      box(0,.60,-.34,.58,.14,.26,PALETTE.dark);
      face([[-.29,.66,-.42],[.29,.66,-.42],[.26,1.18,-.66],[-.26,1.18,-.66]],PALETTE.pale,PALETTE.dark,.82);
      for(const sx of [-.18,0,.18])path([[sx,.68,-.44],[sx,1.14,-.63]],PALETTE.dark,.78);
      // Small steering wheel and low windscreen.
      circle([-.12,.86,.04],.10,'y',PALETTE.dark,12,PALETTE.dark);
      pipe([-.12,.76,.04],[-.05,.64,-.08],.016,PALETTE.dark);
      face([[-.22,.85,.16],[.22,.85,.16],[.15,1.08,.00],[-.15,1.08,.00]],PALETTE.paper,PALETTE.dark,.70);

      // Raise the entire rear half into an integrated wing-deck / tail base.
      face([[-topHalf,bodyTop,-.58],[topHalf,bodyTop,-.58],[.66,rearTop,bodyRear],[-.66,rearTop,bodyRear]],PALETTE.pale,PALETTE.dark,.78);
      for(const side of [-1,1]){
        face([[side*half,low,-.60],[side*half,low,bodyRear],[side*.66,rearTop,bodyRear],[side*.61,bodyTop,-.58]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.76);
      }
      // Taper underneath toward the tail.
      face([[-half,low,bodyRear],[half,low,bodyRear],[.34,.38,tail],[-.34,.38,tail]],PALETTE.dark,PALETTE.ink,.76);

      // Vintage fenders visually tie wheels into the roadster body.
      for(const side of [-1,1]){
        face([[side*.69,.50,frontAx-.40],[side*.92,.50,frontAx-.32],[side*.99,.75,frontAx],[side*.92,.90,frontAx+.27],[side*.69,.86,frontAx+.36]],side<0?PALETTE.dark:PALETTE.pale,PALETTE.dark,.68);
        face([[side*.68,.49,rearAx-.35],[side*.90,.49,rearAx-.27],[side*.96,.70,rearAx],[side*.90,.84,rearAx+.25],[side*.68,.80,rearAx+.34]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.68);
      }

      slot='engine';
      // Twin-cylinder hints on the bonnet, with the prop shaft attached directly
      // to the car's front face. No extra circular cowling stuck on the end.
      for(const side of [-1,1]){
        cylinder([side*.34,.82,1.48],.075,.18,'x',side<0?PALETTE.dark:PALETTE.mid,10);
        cylinder([side*.34,.82,1.24],.075,.18,'x',side<0?PALETTE.mid:PALETTE.pale,10);
      }
      pipe([0,.60,bodyFront],[0,.60,nose+.08],.055,PALETTE.light);
      // Small hub only; blades attach straight to the nose shaft.
      cylinder([0,.60,nose+.10],.08,.08,'z',PALETTE.mid,12,.07);
      const pz=nose+.16;
      face([[-.05,.69,pz],[.05,.69,pz],[.10,1.34,pz],[-.02,1.46,pz]],PALETTE.pale,PALETTE.dark,.70);
      face([[-.09,.56,pz],[-.03,.48,pz],[-.62,.14,pz],[-.72,.22,pz]],PALETTE.pale,PALETTE.dark,.70);
      face([[.03,.48,pz],[.09,.56,pz],[.72,.22,pz],[.62,.14,pz]],PALETTE.pale,PALETTE.dark,.70);

      slot='gadget';
      // Long side wings: roots are the elevated rear half of the car, so the back
      // body itself reads as part of the wing instead of tiny decorative flaps.
      for(const side of [-1,1]){
        face([[side*.56,.98,-.34],[side*1.78,.92,-.58],[side*1.92,1.00,-1.30],[side*.66,1.10,-1.42]],side<0?PALETTE.mid:PALETTE.light,PALETTE.dark,.84);
        face([[side*.66,1.02,-1.34],[side*1.92,.98,-1.30],[side*1.84,1.08,-1.44],[side*.68,1.14,-1.54]],side<0?PALETTE.dark:PALETTE.pale,PALETTE.dark,.68);
      }

      // Dominant parasol/top wing extends well beyond the body, with obvious
      // support bars from the cockpit/rear deck.
      face([[-1.30,1.88,-.62],[1.30,1.88,-.62],[1.24,1.98,.30],[-1.24,1.98,.30]],PALETTE.pale,PALETTE.dark,.86);
      face([[-1.24,1.98,.30],[1.24,1.98,.30],[1.18,2.04,.44],[-1.18,2.04,.44]],PALETTE.light,PALETTE.dark,.70);
      for(const side of [-1,1]){
        pipe([side*.34,.96,-.50],[side*.52,1.92,-.52],.040,PALETTE.dark);
        pipe([side*.30,.94,.14],[side*.48,1.96,.20],.040,PALETTE.pale);
      }

      // Large swept tail fin grown from the elevated rear deck, not a tiny vertical
      // stick. It leans back and has enough chord to read from the garage view.
      for(const x of [-.055,.055]){
        face([[x,1.04,-1.18],[x,1.10,-2.06],[x,1.74,-2.02],[x,2.02,-1.62],[x,1.34,-1.30]],x<0?PALETTE.mid:PALETTE.pale,PALETTE.dark,.84);
      }
      face([[-.055,1.10,-2.06],[.055,1.10,-2.06],[.055,1.74,-2.02],[-.055,1.74,-2.02]],PALETTE.light,PALETTE.dark,.68);
      // Broad tailplane extending from the elevated rear body.
      face([[-1.12,1.08,-1.42],[-.10,1.10,-1.44],[-.08,1.18,-1.94],[-1.02,1.18,-2.02]],PALETTE.light,PALETTE.dark,.72);
      face([[.10,1.10,-1.44],[1.12,1.08,-1.42],[1.02,1.18,-2.02],[.08,1.18,-1.94]],PALETTE.pale,PALETTE.dark,.72);
    }else if(form==='dune'){
      // Dune Buggy reference pass: classic beach-buggy proportions first.
      // The final art pass can exaggerate this later; for now favour a low,
      // rounded tub, open cockpit, upright screen, simple roll hoop and exposed V8.
      const nose=1.50,tail=-1.34,frontZ=.91,rearZ=-.91;
      const frontR=.50,rearR=.57,frontW=.38,rearW=.46;
      const frontX=1.00,rearX=1.04;

      slot='tyres';
      // Balloon tyres stay chunky enough to read as the recipe ingredient, but
      // they no longer overwhelm the body like a miniature monster truck.
      for(const side of [-1,1]){
        for(const spec of [
          {z:frontZ,r:frontR,w:frontW,x:frontX},
          {z:rearZ,r:rearR,w:rearW,x:rearX}
        ]){
          const cx=side*spec.x,cy=spec.r,capX=cx+side*spec.w/2;
          cylinder([cx,cy,spec.z],spec.r,spec.w,'x',PALETTE.deep,20,spec.r*.96,true);
          circle([capX+side*.012,cy,spec.z],spec.r*.68,'x',PALETTE.mid,18,PALETTE.dark);
          circle([capX+side*.020,cy,spec.z],spec.r*.40,'x',PALETTE.pale,16,PALETTE.dark);
          circle([capX+side*.027,cy,spec.z],spec.r*.13,'x',PALETTE.dark,12);
        }
      }

      slot='chassis';
      // Visible suspension keeps the buggy airy without turning the whole thing
      // into a bare sand rail.
      for(const side of [-1,1]){
        for(const [z,x,r] of [[frontZ,frontX,frontR],[rearZ,rearX,rearR]]){
          pipe([side*.58,.34,z-.16],[side*(x-.16),r*.92,z],.040,PALETTE.pale);
          pipe([side*.58,.34,z+.16],[side*(x-.16),r*.92,z],.040,PALETTE.dark);
        }
      }

      // Low floor pan and fuller one-piece tub. The side profile intentionally
      // rises over both axle lines and scoops down beside the open cockpit, like
      // a simple fibreglass beach buggy rather than an angular off-road cage.
      face([[-.62,.28,tail],[.62,.28,tail],[.68,.28,.62],[.45,.30,nose],[-.45,.30,nose],[-.68,.28,.62]],PALETTE.deep,PALETTE.ink,.88);
      for(const side of [-1,1]){
        face([
          [side*.62,.28,tail],[side*.71,.40,-1.18],[side*.77,.70,-.86],
          [side*.70,.72,-.58],[side*.62,.47,-.28],[side*.62,.45,.08],
          [side*.70,.69,.34],[side*.76,.72,.63],[side*.68,.48,.90],
          [side*.45,.30,nose]
        ],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.86);
      }

      // Rounded/faceted bonnet. Wide at the scuttle, tapered and lower at the
      // nose so the front reads as a classic buggy shell rather than a plough.
      face([[-.68,.72,.62],[.68,.72,.62],[.45,.58,nose],[-.45,.58,nose]],PALETTE.light,PALETTE.dark,.82);
      face([[-.45,.30,nose],[.45,.30,nose],[.45,.58,nose],[-.45,.58,nose]],PALETTE.mid,PALETTE.dark,.82);
      face([[-.68,.28,.62],[-.45,.30,nose],[-.45,.58,nose],[-.68,.72,.62]],PALETTE.dark,PALETTE.ink,.78);
      face([[.68,.28,.62],[.68,.72,.62],[.45,.58,nose],[.45,.30,nose]],PALETTE.mid,PALETTE.dark,.78);

      // Integrated fender shoulders wrap around the tops of the tyres while
      // leaving most of each balloon tyre exposed.
      for(const side of [-1,1]){
        const fx=side*.82;
        face([[fx,.46,frontZ-.48],[fx,.75,frontZ-.40],[fx,.90,frontZ-.18],[fx,.91,frontZ+.08],[fx,.76,frontZ+.37],[fx,.49,frontZ+.47]],side<0?PALETTE.dark:PALETTE.pale,PALETTE.dark,.66);
        const rx=side*.84;
        face([[rx,.46,rearZ-.46],[rx,.75,rearZ-.39],[rx,.94,rearZ-.15],[rx,.95,rearZ+.10],[rx,.79,rearZ+.38],[rx,.48,rearZ+.46]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.66);
      }

      // Open cockpit and low bucket seats.
      face([[-.49,.72,.42],[.49,.72,.42],[.49,.72,-.52],[-.49,.72,-.52]],PALETTE.ink,PALETTE.dark,.82);
      for(const side of [-1,1]){
        const sx=side*.22;
        face([[sx-.15,.72,.18],[sx+.15,.72,.18],[sx+.14,1.02,-.20],[sx-.14,1.02,-.20]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.72);
      }
      circle([-.13,.88,.25],.095,'y',PALETTE.dark,12,PALETTE.dark);
      pipe([-.13,.80,.25],[-.06,.69,.12],.014,PALETTE.dark);

      // Small upright windscreen with a simple frame, a much stronger classic
      // dune-buggy cue than the previous roof-like cage.
      face([[-.43,.78,.40],[.43,.78,.40],[.38,1.24,.30],[-.38,1.24,.30]],PALETTE.paper,PALETTE.dark,.40);
      pipe([-.43,.75,.40],[-.38,1.25,.30],.035,PALETTE.pale);
      pipe([.43,.75,.40],[.38,1.25,.30],.035,PALETTE.pale);
      pipe([-.38,1.25,.30],[.38,1.25,.30],.038,PALETTE.light);

      // Round headlights and a restrained front bumper make the face read like a
      // classic beach buggy without hard-coding any real-world model.
      for(const side of [-1,1]){
        cylinder([side*.42,.74,1.43],.115,.09,'z',side<0?PALETTE.mid:PALETTE.pale,14,.105);
        circle([side*.42,.74,1.485],.082,'z',PALETTE.light,14,PALETTE.dark);
      }
      pipe([-.52,.31,1.58],[.52,.31,1.58],.045,PALETTE.pale);
      for(const side of [-1,1])pipe([side*.52,.31,1.58],[side*.61,.36,1.32],.035,PALETTE.mid);

      slot='gadget';
      // Tubular Brace becomes one simple rear roll hoop plus two rear braces.
      // No roof rails: the open-top silhouette is the point.
      for(const side of [-1,1]){
        pipe([side*.48,.67,-.48],[side*.46,1.42,-.52],.050,PALETTE.pale);
        pipe([side*.46,1.42,-.52],[side*.52,.62,-1.10],.040,PALETTE.dark);
      }
      pipe([-.46,1.42,-.52],[.46,1.42,-.52],.052,PALETTE.light);

      slot='engine';
      // Compact rear-mounted exposed V8: obvious, but low enough that the body
      // remains the primary silhouette. The air cleaner peeks above the deck.
      box(0,.56,-.91,.68,.42,.60,PALETTE.dark);
      for(const side of [-1,1]){
        box(side*.30,.69,-.88,.28,.30,.52,side<0?PALETTE.mid:PALETTE.pale);
        for(const z of [-1.02,-.86,-.70])cylinder([side*.38,.82,z],.060,.14,'x',PALETTE.dark,10);
        pipe([side*.40,.66,-.88],[side*.68,.68,-1.24],.040,PALETTE.pale);
      }
      box(0,.96,-.78,.30,.22,.28,PALETTE.pale);
      cylinder([0,1.16,-.78],.15,.12,'y',PALETTE.dark,14,.13);
      circle([0,1.23,-.78],.105,'y',PALETTE.ink,12,PALETTE.dark);

      // Low rear deck/haunch ties the engine and rear fenders into the body.
      face([[-.66,.68,-.56],[.66,.68,-.56],[.62,.60,tail],[-.62,.60,tail]],PALETTE.mid,PALETTE.dark,.72);
      pipe([-.62,.35,tail],[.62,.35,tail],.045,PALETTE.light);
    }else if(form==='snowmobile'){
      // Snowmobile baseline pass: recognisable modern sled proportions first.
      // Final art direction can exaggerate later; for now make the recipe read as
      // one rear track, two front skis, a low pod shell and compact twin engine.
      const nose=1.62,tail=-1.48,trackFront=.16,trackRear=-1.46;

      slot='tyres';
      // Track Rollers resolve into one broad rear drive track. The belt is a
      // faceted continuous housing with visible internal rollers on both sides.
      const tx=.57, trackLow=.16, trackHigh=.54;
      face([[-tx,trackLow,trackRear],[tx,trackLow,trackRear],[tx,trackLow,trackFront],[-tx,trackLow,trackFront]],PALETTE.deep,PALETTE.ink,.90);
      for(const side of [-1,1]){
        const x=side*tx;
        face([[x,trackLow,trackRear],[x,trackHigh,trackRear+.14],[x,trackHigh,trackFront-.12],[x,trackLow,trackFront]],side<0?PALETTE.ink:PALETTE.dark,PALETTE.ink,.88);
        for(const z of [-1.16,-.76,-.36,-.02]){
          cylinder([x+side*.015,.34,z],.20,.07,'x',PALETTE.mid,14,.19);
          circle([x+side*.055,.34,z],.095,'x',PALETTE.pale,12,PALETTE.dark);
        }
        // Segmented top and bottom tread edges make the single-track identity
        // readable without drawing dozens of tiny noisy lugs.
        for(let i=0;i<7;i++){
          const z=trackRear+.10+i*((trackFront-trackRear-.20)/6);
          pipe([x,.18,z-.08],[x,.18,z+.08],.030,i%2?PALETTE.mid:PALETTE.pale);
        }
      }

      slot='gadget';
      // Stability Fins become the characteristic paired front skis. Long clean
      // runners, slightly upturned noses, and simple suspension struts.
      for(const side of [-1,1]){
        const x=side*.72;
        face([[x-.13,.12,.48],[x+.13,.12,.48],[x+.13,.12,1.48],[x-.13,.12,1.48]],side<0?PALETTE.dark:PALETTE.pale,PALETTE.dark,.82);
        face([[x-.13,.12,1.48],[x+.13,.12,1.48],[x+.10,.25,1.78],[x-.10,.25,1.78]],PALETTE.light,PALETTE.dark,.78);
        pipe([x,.16,.72],[side*.47,.66,.54],.045,PALETTE.pale);
        pipe([x,.16,1.04],[side*.42,.58,.82],.038,PALETTE.dark);
      }

      slot='chassis';
      // Low narrow pod shell: fuller around the engine/seat, tapered to a clean
      // nose so it reads as a snow sled rather than a car with tracks attached.
      face([[-.52,.48,tail],[.52,.48,tail],[.62,.48,.42],[.36,.42,nose],[-.36,.42,nose],[-.62,.48,.42]],PALETTE.deep,PALETTE.ink,.88);
      for(const side of [-1,1]){
        face([[side*.52,.48,tail],[side*.62,.48,.42],[side*.36,.42,nose],[side*.30,.68,1.30],[side*.46,.82,.40],[side*.48,.80,-.78]],side<0?PALETTE.dark:PALETTE.mid,PALETTE.dark,.84);
      }
      face([[-.30,.68,1.30],[.30,.68,1.30],[.46,.82,.40],[-.46,.82,.40]],PALETTE.light,PALETTE.dark,.82);
      face([[-.46,.82,.40],[.46,.82,.40],[.48,.80,-.78],[-.48,.80,-.78]],PALETTE.pale,PALETTE.dark,.78);
      // Long dark saddle and raised rear tunnel over the track.
      face([[-.31,.82,.18],[.31,.82,.18],[.34,.93,-.92],[-.34,.93,-.92]],PALETTE.ink,PALETTE.dark,.88);
      face([[-.44,.54,-.72],[.44,.54,-.72],[.48,.66,tail],[-.48,.66,tail]],PALETTE.mid,PALETTE.dark,.74);

      // Small upright windscreen and handlebars sell the snowmobile immediately.
      face([[-.32,.76,.55],[.32,.76,.55],[.26,1.18,.42],[-.26,1.18,.42]],PALETTE.paper,PALETTE.dark,.42);
      pipe([-.32,.74,.55],[-.26,1.18,.42],.030,PALETTE.pale);
      pipe([.32,.74,.55],[.26,1.18,.42],.030,PALETTE.pale);
      pipe([-.40,.94,.24],[.40,.94,.24],.036,PALETTE.light);
      for(const side of [-1,1])pipe([side*.40,.94,.24],[side*.48,.89,.14],.030,PALETTE.dark);

      slot='engine';
      // Twin Cylinder stays visible as two compact cylinder heads tucked just
      // behind the hood. Enough to preserve the ingredient without clutter.
      for(const side of [-1,1]){
        cylinder([side*.24,.82,.62],.105,.22,'x',side<0?PALETTE.dark:PALETTE.mid,12,.10);
        circle([side*.36,.82,.62],.075,'x',PALETTE.pale,10,PALETTE.dark);
        pipe([side*.26,.72,.55],[side*.34,.60,.20],.028,PALETTE.dark);
      }
      box(0,.70,.48,.44,.26,.34,PALETTE.mid);
      // Rear exhaust tucked beside the track tunnel.
      pipe([.34,.62,-.64],[.54,.66,-1.18],.032,PALETTE.pale);
      pipe([-.34,.62,-.64],[-.54,.66,-1.18],.032,PALETTE.dark);
    }else if(form==='fossil'){
      // Permanent four-wheeled predator; original native meshes, not reference pixels.
      out.length=0;treatmentStart=0;
      const bone='#d9bd8b',ivory='#f3dfb0',aged='#a58155',underside='#75523b',metal='#30404a',voidCol='#151b21',red='#a83b2d';
      const F=(x,y,z)=>[x,y,z];
      function tube(a,b,r,col=bone,n=8,r2=r){
        const d=b.map((v,i)=>v-a[i]),l=Math.hypot(...d),v=d.map(x=>x/l);
        const t=Math.abs(v[1])<.9?[0,1,0]:[1,0,0];
        let u=[v[1]*t[2]-v[2]*t[1],v[2]*t[0]-v[0]*t[2],v[0]*t[1]-v[1]*t[0]];
        const ul=Math.hypot(...u);u=u.map(x=>x/ul);const q=[v[1]*u[2]-v[2]*u[1],v[2]*u[0]-v[0]*u[2],v[0]*u[1]-v[1]*u[0]];
        const ring=(c,rad,j)=>c.map((x,k)=>x+rad*(u[k]*Math.cos(j/n*Math.PI*2)+q[k]*Math.sin(j/n*Math.PI*2)));
        for(let j=0;j<n;j++)face([ring(a,r,j),ring(a,r,j+1),ring(b,r2,j+1),ring(b,r2,j)],j<n/2?col:([bone,ivory,aged].includes(col)?aged:metal),null,.35);
        face(Array.from({length:n},(_,j)=>ring(b,r2,j)),col,null,.45);
      }
      slot='chassis';
      for(const side of [-1,1]){
        tube(F(side*.66,.65,-1.75),F(side*.66,.65,2.12),.12,red);
        for(const z of [-1.35,1.50]){
          tube(F(side*.55,.70,z),F(side*1.30,.73,z),.10,metal);
          tube(F(side*.72,1.10,z-.16),F(side*1.22,.73,z+.14),.10,aged);
        }
      }
      slot='tyres';
      for(const z of [-1.35,1.50])for(const side of [-1,1]){
        const x=side*1.36,y=.73,r=.73;
        tube(F(x-.27,y,z),F(x+.27,y,z),r,voidCol,18);
        circle(F(x+side*.28,y,z),.54,'x',aged,16,metal);
        circle(F(x+side*.29,y,z),.40,'x',voidCol,16,metal);
        for(let j=0;j<5;j++){
          const a=j*Math.PI*2/5+phase*.04;
          tube(F(x+side*.31,y+Math.cos(a)*.16,z+Math.sin(a)*.16),F(x+side*.31,y+Math.cos(a+.20)*.49,z+Math.sin(a+.20)*.49),.075,ivory,6);
        }
        circle(F(x+side*.34,y,z),.17,'x',metal,12,ivory);
        for(let j=0;j<12;j++){
          const a=j/12*Math.PI*2;
          pipe(F(x-.24,y+Math.cos(a)*.735,z+Math.sin(a)*.735),F(x+.24,y+Math.cos(a)*.735,z+Math.sin(a)*.735),.04,metal);
        }
      }
      slot='engine';
      tube(F(0,1.28,-1.46),F(0,1.28,.46),.43,red,12);
      for(const z of [-1.30,-.83,-.36,.11]){
        tube(F(0,1.28,z-.08),F(0,1.28,z+.08),.48,metal,12);
        for(const side of [-1,1])circle(F(side*.49,1.28,z),.17,'x','#db6332',10,metal);
      }
      circle(F(0,1.28,-1.57),.32,'z','#cf532c',12,metal);
      circle(F(0,1.28,-1.58),.16,'z','#ffb84d',12,metal);
      for(const side of [-1,1]){
        tube(F(side*.54,1.15,-1.10),F(side*.65,2.60,-1.35),.13,metal);
        tube(F(side*.65,2.50,-1.33),F(side*.68,2.72,-1.40),.17,metal);
        circle(F(side*.68,2.73,-1.40),.12,'y',voidCol,10,aged);
        tube(F(side*.50,.97,-1.40),F(side*.64,.98,.65),.11,metal);
      }
      slot='chassis';
      // Six broad curved ribs with open gaps and a visible red mechanical core.
      for(const z of [-1.28,-.91,-.54,-.17,.20,.57]){
        for(const side of [-1,1]){
          const arc=[F(side*.40,.94,z),F(side*.88,1.10,z-.05),F(side*1.03,1.52,z),F(side*.90,1.98,z+.08),F(side*.51,2.28,z+.13),F(0,2.35,z+.15)];
          for(let i=0;i<arc.length-1;i++)tube(arc[i],arc[i+1],.105,i===3?ivory:bone,8);
        }
        tube(F(0,2.29,z-.04),F(0,2.29,z+.22),.19,bone,8);
      }
      const skullStart=out.length;
      slot='chassis';
      // CRANIUM: a wide rounded skull behind the long toothed snout.
      // In contrast to the old wedge, big DARK EYE HOLES are actual cut-outs
      // in the lateral facades, and the lower mandible hangs well below.
      const sides=[-1,1];
      for(const side of sides){
        const x=v=>side*v;
        face([F(x(.73),1.32,.53),F(x(.77),1.77,.49),F(x(.67),2.09,.80),
          F(x(.60),2.05,1.23),F(x(.51),1.67,1.53),F(x(.62),1.34,1.35)],
          side<0?aged:bone,metal,1.2);
        face([F(x(.76),1.74,.66),F(x(.77),1.94,.83),F(x(.62),1.99,1.21),
          F(x(.54),1.74,1.40),F(x(.67),1.54,1.17)],voidCol,metal,1.15);
        // Ivory eyebrow makes the socket read at small 180x124 chunky size.
        pipe(F(x(.80),1.95,.65),F(x(.61),2.04,1.27),.110,ivory);
        // Wide cheek + rear crest keep skull readable from the straight rear.
        pipe(F(x(.69),1.54,.46),F(x(.89),1.30,.91),.095,aged);
        pipe(F(x(.89),1.30,.91),F(x(.69),1.14,1.44),.089,bone);
        // Thick upper jaw has organic slab contours, not an acute pointed nose.
        face([F(x(.55),1.51,1.34),F(x(.55),1.57,1.89),F(x(.43),1.40,2.48),
          F(x(.32),1.29,2.68),F(x(.39),1.12,2.65),F(x(.59),1.22,1.70)],
          side<0?bone:aged,metal,1.0);
        // Nasal cavity and cheek gap are bold open shapes.
        face([F(x(.48),1.39,2.20),F(x(.39),1.37,2.50),F(x(.34),1.21,2.49),
          F(x(.48),1.23,2.18)],voidCol,metal,.7);
        // Separate dropped lower jaw, hinged to rear cheek. Open black space
        // between the upper skull and this piece is the essential silhouette.
        face([F(x(.67),1.04,.96),F(x(.56),.92,1.50),F(x(.37),.77,2.51),
          F(x(.30),.89,2.62),F(x(.44),.91,1.75),F(x(.77),1.23,.77)],
          side<0?underside:aged,metal,1.0);
        cylinder(F(x(.69),1.13,.94),.16,.08,'x',aged,12);
        circle(F(x(.69+side*.015),1.13,.94),.067,'x',metal,10,aged);
        // Heavy triangular teeth in opposite directions: real bite gap.
        for(let j=0;j<6;j++){
          const f=j/5,z=1.62+f*.89,xx=x(.52-.17*f);
          face([F(xx,1.20-f*.055,z-.07),F(xx,1.20-f*.055,z+.09),
            F(xx, .96-f*.03,z+.015)],ivory,metal,.7);
          face([F(x(.46-.13*f),.96-f*.07,z-.07),F(x(.46-.13*f),.96-f*.07,z+.09),
            F(x(.46-.13*f),1.13-f*.07,z)],bone,metal,.7);
        }
      }
      // Temporal cavities on the back of the skull interrupt its broad pale
      // rear silhouette without hiding the ribcage or working wheels.
      for(const side of [-1,1]){
        face([F(side*.21,1.82,.46),F(side*.51,1.86,.46),
          F(side*.50,1.55,.46),F(side*.25,1.54,.46)],voidCol,aged,1.0);
      }
      // Curved top skull and a broad squared muzzle reinforce facial depth.
      face([F(-.68,2.05,.72),F(.68,2.05,.72),F(.59,2.09,1.18),F(-.59,2.09,1.18)],ivory,metal,1.0);
      face([F(-.59,2.09,1.18),F(.59,2.09,1.18),F(.52,1.58,1.79),F(-.52,1.58,1.79)],bone,metal,.96);
      face([F(-.52,1.58,1.79),F(.52,1.58,1.79),F(.36,1.43,2.66),F(-.36,1.43,2.66)],ivory,metal,.96);
      face([F(-.36,1.43,2.66),F(.36,1.43,2.66),F(.39,1.14,2.68),F(-.39,1.14,2.68)],aged,metal,.92);
      // Dark front-facing nasal sockets rather than a single painted nose.
      for(const side of sides)circle(F(side*.16,1.29,2.69),.074,'z',voidCol,10,metal);
      pipe(F(-.32,.90,2.57),F(.32,.90,2.57),.083,aged);
      // Flared bony temporal ridges, NO antlers or spike-horns.
      for(const side of sides){
        pipe(F(side*.66,2.01,.77),F(side*.88,1.89,.53),.092,aged);
        pipe(F(side*.88,1.89,.53),F(side*.78,1.60,.34),.083,bone);
      }

      // Paired dorsal nasal cavities break the broad skull planes into recognisable bone.
      for(const side of [-1,1]){
        face([F(side*.15,1.77,1.59),F(side*.38,1.77,1.59),F(side*.34,1.55,1.88),F(side*.16,1.55,1.88)],voidCol,aged,.6);
      }
      // Increase the open bite beneath the skull instead of a closed wedge.
      for(const p of new Set(out.slice(skullStart).flatMap(f=>f.pts))){
        if(p[1]<1.14 && p[2]>.95)p[1]-=.18;
      }
      // Enlarge the skull independently of the chassis: pronounced brow, real bite gap.
      for(const p of new Set(out.slice(skullStart).flatMap(f=>f.pts))){
        p[0]*=1.30;p[1]=.80+(p[1]-.80)*1.32;p[2]=.68+(p[2]-.46)*1.02;
      }
      // A thick articulated vertebral tail, not a cable; lateral sweep reads from rear.
      const tailStart=out.length;slot='gadget';
      const tail=[F(0,2.20,-1.40),F(.13,2.26,-1.87),F(.35,2.38,-2.36),F(.62,2.50,-2.77),F(.87,2.64,-3.16),F(1.25,2.72,-3.52),F(1.65,2.72,-3.85),F(1.98,2.59,-4.14),F(2.20,2.39,-4.40),F(2.29,2.16,-4.64)];
      for(let i=0;i<tail.length-1;i++){
        const a=tail[i],b=tail[i+1],r=.32-i*.029;
        tube(a,b,r*.82,metal,8,Math.max(.045,(r-.03)*.82));
        const c=a.map((v,k)=>v+(b[k]-v)*.12),e=a.map((v,k)=>v+(b[k]-v)*.86);
        tube(c,e,r*1.28,bone,8,r*1.12);
        for(const side of [-1,1])circle(F(c[0]+side*r*1.29,c[1],c[2]-.05),r*.30,'x',voidCol,8,aged);
        for(const side of [-1,1])tube(c,F(c[0]+side*(r+.16),c[1]-.10,c[2]-.06),Math.max(.035,r*.35),ivory,6);
        face([F(c[0]-r*.5,c[1]+r*.7,c[2]),F(c[0]+r*.5,c[1]+r*.7,c[2]),F(c[0],c[1]+r+.24*(1-i/10),c[2]-.12)],ivory,aged,.6);
      }
      for(let i=tailStart;i<out.length;i++)out[i].fossilTail=true;
    }
    for(let i=treatmentStart;i<out.length;i++)out[i].treatment=form;
    return {models:m,mounts,primitives:out,form,matchedForm:recipe?recipe.id:null};
  }
  function projected(input,view='garage',phase=0,options={}){
    const g=geometry(input,phase,options),faces=g.primitives.map((p,i)=>{
      const pts=p.pts.map(v=>project(v,view));
      return {...p,pts:pts.map(v=>v.slice(0,2)),depths:pts.map(v=>v[2]),depth:pts.reduce((n,v)=>n+v[2],0)/pts.length,order:i};
    }).sort((a,b)=>a.depth-b.depth||a.order-b.order);
    return {...g,faces};
  }
  const CACHE=new Map(),MAX_CACHE=96;
  function renderPlane2D(view='garage',style='illustrated',phase=0){
    const chunky=style==='chunky';
    const canvas=document.createElement('canvas');
    canvas.width=chunky?180:720;canvas.height=chunky?124:496;
    const ctx=canvas.getContext('2d');if(!ctx)return canvas;
    const sx=canvas.width/720,sy=canvas.height/496;
    ctx.save();ctx.scale(sx,sy);ctx.lineJoin='round';ctx.lineCap='round';
    const ink=PALETTE.ink,deep=PALETTE.deep,dark=PALETTE.dark,mid=PALETTE.mid,pale=PALETTE.pale,light=PALETTE.light,paper=PALETTE.paper;
    const lw=chunky?6.5:3.2;
    function shape(draw,fill,stroke=ink,width=lw){ctx.beginPath();draw(ctx);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
    function line(x1,y1,x2,y2,col=ink,width=lw){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=col;ctx.lineWidth=width;ctx.stroke();}
    function ellipse(x,y,rx,ry,fill,stroke=ink,width=lw){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
    function wheel(x,y,r,far=false){
      ellipse(x,y,r,r,far?dark:deep,ink,lw);
      ellipse(x,y,r*.70,r*.70,far?mid:pale,dark,lw*.72);
      ellipse(x,y,r*.30,r*.30,dark,ink,lw*.6);
      ellipse(x,y,r*.12,r*.12,light,null,0);
    }
    function garage(){
      // Far-side wheels first so the body naturally hides them.
      wheel(236,360,31,true);wheel(515,350,27,true);

      // Far winglet visible above the rear deck.
      shape(c=>{c.moveTo(420,271);c.bezierCurveTo(467,262,511,264,548,276);c.lineTo(538,288);c.bezierCurveTo(494,283,458,283,424,289);c.closePath();},mid,dark,lw*.85);

      // Main roadster body. This is deliberately ONE continuous silhouette.
      shape(c=>{
        c.moveTo(160,258);
        c.bezierCurveTo(188,234,228,222,280,220);
        c.bezierCurveTo(316,219,333,224,349,235);
        // cockpit front shoulder
        c.bezierCurveTo(356,240,361,246,366,249);
        // cockpit cut-out: clear U-shaped opening in the body
        c.bezierCurveTo(373,264,383,279,402,284);
        c.bezierCurveTo(421,288,441,280,452,261);
        // rear deck into tail
        c.bezierCurveTo(480,251,513,251,548,260);
        c.bezierCurveTo(573,268,591,281,603,296);
        c.bezierCurveTo(614,311,610,328,594,339);
        c.bezierCurveTo(571,355,535,360,488,360);
        c.lineTo(242,370);
        c.bezierCurveTo(205,370,177,359,161,339);
        c.bezierCurveTo(145,319,144,279,160,258);
        c.closePath();
      },mid,ink,lw);

      // Body highlight/upper shoulder, broad and simple.
      shape(c=>{c.moveTo(184,255);c.bezierCurveTo(230,234,298,232,346,243);c.bezierCurveTo(355,248,361,254,367,259);c.bezierCurveTo(378,273,390,280,404,282);c.bezierCurveTo(420,284,435,277,446,262);c.bezierCurveTo(483,257,527,260,561,273);c.lineTo(550,291);c.bezierCurveTo(516,280,475,279,447,285);c.bezierCurveTo(429,302,402,306,378,296);c.bezierCurveTo(357,287,344,268,330,261);c.bezierCurveTo(286,247,232,248,194,267);c.closePath();},pale,null,0);

      // Lower body band gives car-like weight without adding wedges.
      shape(c=>{c.moveTo(162,326);c.bezierCurveTo(230,346,320,349,405,345);c.bezierCurveTo(492,341,558,338,601,320);c.bezierCurveTo(609,331,602,342,590,349);c.bezierCurveTo(551,366,498,370,432,370);c.lineTo(240,379);c.bezierCurveTo(202,378,176,360,162,340);c.closePath();},dark,null,0);

      // Near lower wing is deliberately visible on TOP of the side body, like
      // the locked concept art, instead of disappearing behind the car mass.
      shape(c=>{
        c.moveTo(366,304);
        c.bezierCurveTo(418,292,486,294,558,316);
        c.bezierCurveTo(573,322,573,334,558,340);
        c.bezierCurveTo(494,347,432,345,374,330);
        c.bezierCurveTo(363,325,359,313,366,304);
        c.closePath();
      },light,dark,lw*.9);
      shape(c=>{c.moveTo(382,324);c.bezierCurveTo(437,334,493,335,548,331);c.lineTo(542,339);c.bezierCurveTo(486,345,430,342,382,333);c.closePath();},mid,null,0);

      // Short rounded bonnet / engine cowling integrated into the car body.
      // The references do not have a giant circular end-cap, so only the front
      // opening is rounded and the housing quickly blends into the roadster tub.
      shape(c=>{
        c.moveTo(103,254);
        c.bezierCurveTo(122,238,153,232,181,236);
        c.bezierCurveTo(198,239,211,246,220,258);
        c.lineTo(220,330);
        c.bezierCurveTo(203,340,180,345,151,344);
        c.bezierCurveTo(125,343,108,335,100,321);
        c.bezierCurveTo(91,304,92,272,103,254);
        c.closePath();
      },pale,ink,lw);
      // Small dark prop/engine opening only, not a full-body circle.
      ellipse(105,299,27,37,dark,ink,lw*.75);
      ellipse(105,299,15,22,deep,dark,lw*.55);

      // Cockpit opening and seat, clearly sunk into the body.
      shape(c=>{c.moveTo(350,242);c.bezierCurveTo(364,235,384,232,404,234);c.bezierCurveTo(428,236,450,246,460,260);c.bezierCurveTo(449,278,431,289,408,289);c.bezierCurveTo(383,289,363,276,350,258);c.closePath();},deep,ink,lw);
      // seat back
      shape(c=>{c.moveTo(397,244);c.bezierCurveTo(411,239,426,242,436,251);c.lineTo(432,281);c.bezierCurveTo(418,287,405,286,394,279);c.closePath();},dark,ink,lw*.8);
      for(const x of [404,416,428]) line(x,248,x-1,278,pale,lw*.45);
      // tiny windshield
      shape(c=>{c.moveTo(349,245);c.lineTo(362,225);c.lineTo(375,231);c.lineTo(366,251);c.closePath();},paper,dark,lw*.7);

      // Front and rear near-side wheels. Small, tucked and road-car-like.
      wheel(285,360,39,false);wheel(520,355,31,false);
      // wheel arches in body
      shape(c=>{c.moveTo(244,343);c.bezierCurveTo(249,318,267,307,287,307);c.bezierCurveTo(309,307,326,320,330,344);},null,pale,lw*1.25);
      shape(c=>{c.moveTo(488,342);c.bezierCurveTo(492,323,506,314,521,314);c.bezierCurveTo(538,314,551,324,554,343);},null,pale,lw*1.1);

      // Compact parasol wing above the cockpit, not a full real-aircraft wing.
      shape(c=>{c.moveTo(292,106);c.bezierCurveTo(337,88,410,86,482,99);c.bezierCurveTo(520,106,548,120,558,136);c.bezierCurveTo(549,150,526,155,497,153);c.bezierCurveTo(427,145,360,143,302,151);c.bezierCurveTo(281,146,276,120,292,106);c.closePath();},light,ink,lw);
      shape(c=>{c.moveTo(304,142);c.bezierCurveTo(364,134,430,136,502,145);c.lineTo(497,155);c.bezierCurveTo(423,149,357,150,304,158);c.closePath();},mid,dark,lw*.6);
      // four chunky struts
      line(325,146,355,240,dark,lw*1.2);line(351,145,370,238,pale,lw*.95);
      line(490,151,458,255,dark,lw*1.2);line(516,150,474,258,pale,lw*.95);

      // Rounded, slightly swept tail fin from the concept rather than a thin
      // aircraft rudder. Its base is broad and flows straight into the body.
      shape(c=>{
        c.moveTo(544,267);
        c.bezierCurveTo(554,216,571,169,600,139);
        c.bezierCurveTo(619,151,632,176,636,204);
        c.bezierCurveTo(639,231,632,256,617,279);
        c.bezierCurveTo(609,289,600,296,589,301);
        c.closePath();
      },pale,ink,lw);
      line(602,151,602,282,dark,lw*.55);
      // small tailplane
      shape(c=>{c.moveTo(557,289);c.bezierCurveTo(590,279,626,279,661,291);c.bezierCurveTo(671,296,671,306,659,311);c.bezierCurveTo(622,316,589,314,558,307);c.closePath();},light,dark,lw*.85);

      // Oversized cartoon propeller and spinner.
      ellipse(78,300,16,15,pale,ink,lw*.8);
      line(78,288,78,312,dark,lw*.6);
      shape(c=>{c.moveTo(70,289);c.bezierCurveTo(54,250,50,205,65,173);c.bezierCurveTo(78,180,85,221,84,267);c.lineTo(83,287);c.closePath();},pale,ink,lw*.8);
      shape(c=>{c.moveTo(86,312);c.bezierCurveTo(100,351,102,391,86,419);c.bezierCurveTo(73,408,67,367,72,329);c.lineTo(76,314);c.closePath();},pale,ink,lw*.8);
      line(94,300,112,300,dark,lw*1.1);
    }
    function rear(){
      // Far wheels
      wheel(255,372,28,true);wheel(465,372,28,true);
      // body from rear
      shape(c=>{c.moveTo(286,265);c.bezierCurveTo(318,240,402,240,434,265);c.bezierCurveTo(456,286,462,330,446,352);c.bezierCurveTo(420,374,300,374,274,352);c.bezierCurveTo(258,330,264,286,286,265);c.closePath();},mid,ink,lw);
      shape(c=>{c.moveTo(304,272);c.bezierCurveTo(326,252,394,252,416,272);c.bezierCurveTo(425,282,428,296,426,310);c.bezierCurveTo(398,298,322,298,294,310);c.bezierCurveTo(292,296,295,282,304,272);c.closePath();},pale,null,0);
      // open cockpit visible from behind
      shape(c=>{c.moveTo(324,255);c.bezierCurveTo(344,240,376,240,396,255);c.lineTo(390,292);c.bezierCurveTo(370,300,350,300,330,292);c.closePath();},deep,ink,lw);
      shape(c=>{c.moveTo(344,258);c.lineTo(376,258);c.lineTo(380,288);c.lineTo(340,288);c.closePath();},dark,ink,lw*.7);
      // upper wing
      shape(c=>{c.moveTo(166,102);c.bezierCurveTo(250,88,470,88,554,102);c.bezierCurveTo(566,111,566,126,554,134);c.bezierCurveTo(469,124,251,124,166,134);c.bezierCurveTo(154,126,154,111,166,102);c.closePath();},light,ink,lw);
      // struts
      line(230,130,310,258,dark,lw*1.1);line(274,128,332,250,pale,lw*.9);
      line(490,130,410,258,dark,lw*1.1);line(446,128,388,250,pale,lw*.9);
      // tailplane
      shape(c=>{c.moveTo(214,284);c.bezierCurveTo(270,270,450,270,506,284);c.bezierCurveTo(517,292,517,303,506,310);c.bezierCurveTo(448,302,272,302,214,310);c.bezierCurveTo(203,303,203,292,214,284);c.closePath();},pale,dark,lw*.85);
      // tail fin
      shape(c=>{c.moveTo(336,286);c.bezierCurveTo(338,230,345,172,360,136);c.bezierCurveTo(375,172,382,230,384,286);c.closePath();},pale,ink,lw);
      line(360,148,360,279,dark,lw*.55);
      // exhaust hints
      for(const side of [-1,1]){line(360+side*58,332,360+side*84,350,dark,lw*.9);line(360+side*52,342,360+side*80,361,pale,lw*.7);}
      // near wheels
      wheel(274,374,34,false);wheel(446,374,34,false);
    }
    if(view==='garage')garage();else rear();
    ctx.restore();
    if(chunky){
      // Keep the same intentionally crunchy presentation by scaling the already
      // simplified vector silhouette with nearest-neighbour behaviour later.
      ctx.imageSmoothingEnabled=false;
    }
    return canvas;
  }
  function renderWingCar2D(view='garage',style='illustrated',phase=0){
    const chunky=style==='chunky';
    const canvas=document.createElement('canvas');
    canvas.width=chunky?180:720;canvas.height=chunky?124:496;
    const ctx=canvas.getContext('2d');if(!ctx)return canvas;
    const sx=canvas.width/720,sy=canvas.height/496;
    ctx.save();ctx.scale(sx,sy);ctx.lineJoin='round';ctx.lineCap='round';
    const ink=PALETTE.ink,deep=PALETTE.deep,dark=PALETTE.dark,mid=PALETTE.mid,pale=PALETTE.pale,light=PALETTE.light,paper=PALETTE.paper;
    const lw=chunky?6.5:3.2;
    function shape(draw,fill,stroke=ink,width=lw){ctx.beginPath();draw(ctx);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
    function line(x1,y1,x2,y2,col=ink,width=lw){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=col;ctx.lineWidth=width;ctx.stroke();}
    function ellipse(x,y,rx,ry,fill,stroke=ink,width=lw){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
    function wheel(x,y,r,far=false){ellipse(x,y,r,r,far?dark:deep,ink,lw);ellipse(x,y,r*.67,r*.67,far?mid:pale,dark,lw*.7);ellipse(x,y,r*.24,r*.24,dark,ink,lw*.55);}
    function garage(){
      // Far wheels first.
      wheel(235,359,34,true); wheel(520,353,32,true);

      // Far wing projects away from the body so the gag reads immediately.
      shape(c=>{c.moveTo(356,272);c.bezierCurveTo(404,236,478,205,566,192);c.bezierCurveTo(586,191,594,200,580,212);c.bezierCurveTo(510,245,446,271,378,296);c.closePath();},mid,dark,lw*.85);

      // Low road-car body: bonnet, cabin shoulder and fastback rear.
      shape(c=>{
        c.moveTo(126,287);
        c.bezierCurveTo(160,254,216,235,283,232);
        c.bezierCurveTo(326,230,351,234,374,246);
        c.bezierCurveTo(394,218,432,201,478,204);
        c.bezierCurveTo(519,207,546,227,560,253);
        c.bezierCurveTo(591,258,613,270,624,291);
        c.bezierCurveTo(636,314,627,338,603,350);
        c.bezierCurveTo(574,365,530,370,469,369);
        c.lineTo(225,376);
        c.bezierCurveTo(183,375,150,363,132,342);
        c.bezierCurveTo(115,322,113,302,126,287);
        c.closePath();
      },mid,ink,lw);

      // Upper body / bonnet highlight.
      shape(c=>{c.moveTo(149,280);c.bezierCurveTo(205,248,292,243,363,255);c.bezierCurveTo(390,226,425,213,468,216);c.bezierCurveTo(506,219,529,237,543,259);c.bezierCurveTo(499,260,457,266,421,279);c.bezierCurveTo(338,267,247,269,164,294);c.closePath();},pale,null,0);

      // Windscreen/cockpit cut into the car body.
      shape(c=>{c.moveTo(382,247);c.bezierCurveTo(400,224,433,214,465,218);c.bezierCurveTo(490,221,510,234,520,252);c.lineTo(499,276);c.bezierCurveTo(461,268,423,268,389,278);c.closePath();},deep,ink,lw*.9);
      shape(c=>{c.moveTo(395,247);c.bezierCurveTo(409,230,430,223,452,224);c.bezierCurveTo(470,226,484,233,493,244);c.lineTo(479,261);c.bezierCurveTo(451,256,424,257,402,264);c.closePath();},paper,dark,lw*.65);
      line(447,224,443,260,dark,lw*.45);

      // Near wing sweeps dramatically toward the viewer. Big, obvious and
      // unmistakably attached to a normal road-car body.
      shape(c=>{c.moveTo(334,296);c.bezierCurveTo(400,301,470,327,552,371);c.bezierCurveTo(574,386,570,400,545,402);c.bezierCurveTo(468,383,397,353,341,324);c.bezierCurveTo(328,316,326,305,334,296);c.closePath();},light,dark,lw*.95);
      // Wing root plate and spar line make the attachment obvious.
      shape(c=>{c.moveTo(329,291);c.lineTo(398,287);c.lineTo(417,329);c.lineTo(344,334);c.closePath();},pale,dark,lw*.65);
      line(371,317,533,385,mid,lw*.55);

      // Twin vertical rear fins: aircraft language without turning it into a plane.
      shape(c=>{c.moveTo(535,259);c.bezierCurveTo(540,214,552,174,572,143);c.bezierCurveTo(588,155,599,179,603,205);c.bezierCurveTo(606,228,601,250,590,271);c.closePath();},pale,ink,lw);
      shape(c=>{c.moveTo(584,268);c.bezierCurveTo(591,229,605,194,624,168);c.bezierCurveTo(638,183,646,204,648,225);c.bezierCurveTo(649,244,643,261,632,278);c.closePath();},mid,dark,lw*.8);

      // Rear horizontal tail shelf.
      shape(c=>{c.moveTo(526,278);c.bezierCurveTo(568,268,615,268,657,282);c.bezierCurveTo(668,289,667,300,654,306);c.bezierCurveTo(609,311,569,309,529,301);c.closePath();},pale,dark,lw*.75);

      // Front fascia: still obviously a car, no propeller.
      shape(c=>{c.moveTo(113,289);c.bezierCurveTo(119,271,131,260,148,255);c.lineTo(169,264);c.lineTo(165,337);c.lineTo(140,347);c.bezierCurveTo(121,338,111,320,113,289);c.closePath();},dark,ink,lw*.9);
      ellipse(134,294,12,9,paper,dark,lw*.55); ellipse(149,294,10,8,paper,dark,lw*.55);
      line(124,329,155,329,pale,lw*.6);

      // Near wheels and simple arches.
      wheel(278,365,40,false); wheel(535,359,34,false);
      shape(c=>{c.moveTo(236,349);c.bezierCurveTo(241,322,259,309,280,309);c.bezierCurveTo(304,309,322,325,326,350);},null,pale,lw*1.15);
      shape(c=>{c.moveTo(498,345);c.bezierCurveTo(502,323,517,312,536,312);c.bezierCurveTo(556,312,571,324,574,346);},null,pale,lw*1.0);

      // Twin-cylinder hints through the bonnet vents.
      for(const x of [230,249]) ellipse(x,270,8,5,dark,null,0);
      line(216,258,265,254,dark,lw*.5);
    }
    function rear(){
      // Wide wing span carries the silhouette from behind.
      shape(c=>{c.moveTo(90,238);c.bezierCurveTo(180,210,270,205,360,215);c.bezierCurveTo(450,205,540,210,630,238);c.bezierCurveTo(643,246,641,258,625,263);c.bezierCurveTo(526,251,438,247,360,253);c.bezierCurveTo(282,247,194,251,95,263);c.bezierCurveTo(79,258,77,246,90,238);c.closePath();},light,ink,lw);
      // Body from rear.
      shape(c=>{c.moveTo(274,278);c.bezierCurveTo(301,254,333,244,360,246);c.bezierCurveTo(387,244,419,254,446,278);c.bezierCurveTo(462,294,466,328,451,348);c.bezierCurveTo(424,370,296,370,269,348);c.bezierCurveTo(254,328,258,294,274,278);c.closePath();},mid,ink,lw);
      // Rear glass.
      shape(c=>{c.moveTo(304,274);c.bezierCurveTo(321,258,341,253,360,254);c.bezierCurveTo(379,253,399,258,416,274);c.lineTo(404,305);c.bezierCurveTo(376,298,344,298,316,305);c.closePath();},deep,ink,lw*.8);
      // Twin fins.
      shape(c=>{c.moveTo(303,270);c.bezierCurveTo(305,218,313,174,329,142);c.bezierCurveTo(343,160,351,203,352,268);c.closePath();},pale,ink,lw);
      shape(c=>{c.moveTo(368,268);c.bezierCurveTo(369,203,377,160,391,142);c.bezierCurveTo(407,174,415,218,417,270);c.closePath();},pale,ink,lw);
      // Rear wing shelf.
      shape(c=>{c.moveTo(226,300);c.bezierCurveTo(270,286,450,286,494,300);c.bezierCurveTo(505,306,505,316,494,322);c.bezierCurveTo(447,314,273,314,226,322);c.bezierCurveTo(215,316,215,306,226,300);c.closePath();},pale,dark,lw*.75);
      wheel(277,372,34,false); wheel(443,372,34,false);
      // Rear lights.
      ellipse(303,334,10,7,paper,dark,lw*.5);ellipse(417,334,10,7,paper,dark,lw*.5);
    }
    if(view==='garage')garage();else rear();
    ctx.restore();
    if(chunky)ctx.imageSmoothingEnabled=false;
    return canvas;
  }
  function renderRaster(models,view,style,phase,comboBodywork,livery=0){
    const resolvedForm=comboBodywork?G.resolve(normalise(models))?.id:null;
    const chunky=style==='chunky',baseWidth=chunky?180:720,baseHeight=chunky?124:496;
    const source=projected(models,view,phase,{comboBodywork});
    const faces=resolvedForm?source.faces.map(f=>paintFaceForGag(f,resolvedForm)):source.faces.map(f=>paintFaceInColour(f,livery));
    const coords=faces.flatMap(f=>f.pts);
    const minX=Math.min(...coords.map(p=>p[0])),maxX=Math.max(...coords.map(p=>p[0]));
    const minY=Math.min(...coords.map(p=>p[1])),maxY=Math.max(...coords.map(p=>p[1]));
    const pad=chunky?7:28;
    // Engine-only protrusions must not shrink the entire rolling chassis.
    // Fit chassis/tyres/gadgets to the normal frame, then extend the raster
    // UPWARDS for tall boilers, preserving the full engine without clipping.
    // Finished gag forms keep their existing bespoke, full-body framing.
    const anchorFaces=resolvedForm==='fossil'?faces.filter(f=>!f.fossilTail):(resolvedForm||models.engine!=='boiler')?faces:faces.filter(f=>f.slot!=='engine');
    const anchorPoints=anchorFaces.flatMap(f=>f.pts);
    const anchorHeight=anchorPoints.length
      ?Math.max(...anchorPoints.map(p=>p[1]))-Math.min(...anchorPoints.map(p=>p[1]))
      :maxY-minY;
    const fitMinX=resolvedForm==='fossil'?Math.min(...anchorPoints.map(p=>p[0])):minX;
    const fitMaxX=resolvedForm==='fossil'?Math.max(...anchorPoints.map(p=>p[0])):maxX;
    const widthScale=(baseWidth-pad*2)/Math.max(.001,fitMaxX-fitMinX);
    const heightScale=(baseHeight-pad*2)/Math.max(.001,anchorHeight);
    // A modest cap prevents huge stacks from overwhelming the rear camera.
    // Other parts retain at least most of their established screen mass.
    const originalHeightScale=(baseHeight-pad*2)/Math.max(.001,maxY-minY);
    const scale=resolvedForm==='fossil'?Math.min(widthScale,heightScale):Math.min(widthScale,heightScale,originalHeightScale*1.32);
    const canvas=document.createElement('canvas');
    canvas.width=resolvedForm==='fossil'?Math.max(baseWidth,Math.ceil((maxX-minX)*scale+pad*2)):baseWidth;
    if(resolvedForm==='fossil')canvas.fossilOffset=((minX+maxX-fitMinX-fitMaxX)/2)*scale;
    const neededHeight=(maxY-minY)*scale+pad*2;
    canvas.height=neededHeight<=baseHeight+1e-6?baseHeight:Math.ceil(neededHeight);
    const ctx=canvas.getContext('2d');if(!ctx)return canvas;
    const ox=(canvas.width-(maxX-minX)*scale)/2-minX*scale;
    const oy=canvas.height-pad-maxY*scale;
    const surface=R.createSurface(canvas.width,canvas.height);
    R.paint(surface,faces,{scale,ox,oy,chunky});
    // Bespoke forms already use a controlled set of authored shades. Do NOT
    // desaturate them back to the shared monochrome ramp in chunky mode.
    R.edges(surface,{ink:PALETTE.ink,light:PALETTE.light,chunky});
    const image=ctx.createImageData(canvas.width,canvas.height);image.data.set(surface.pixels);ctx.putImageData(image,0,0);
    return canvas;
  }
  function displayScale(input={},view='garage',comboBodywork=true){
    const m=normalise(input),form=comboBodywork?G.resolve(m)?.id:null;
    if(form==='dune')return view==='garage'?1.12:1.10;
    if(form==='snowmobile')return view==='garage'?1.10:1.08;
    // Gag forms may intentionally have different physical presence on screen.
    // The mower is one of the smallest vehicles, not a tiny design enlarged to
    // fill the same display box as a locomotive or fossil.
    if(form==='mower')return view==='garage'?.76:.66;
    if(form==='truck')return view==='garage'?1.06:1.00;
    if(form==='monster')return view==='garage'?1.22:1.20;
    if(form==='tank')return view==='garage'?1.12:1.08;
    if(form==='f1')return view==='garage'?1.10:1.06;
    if(form==='rocketcar')return view==='garage'?1.12:1.08;
    if(form==='burger')return view==='garage'?1.14:1.08;
    if(form==='boat')return view==='garage'?1.08:1.02;
    if(form==='muscle')return view==='garage'?1.12:1.06;
    if(form==='plane')return view==='garage'?1.12:1.08;
    if(form==='icecream')return view==='garage'?1.10:1.06;
    if(form==='spaceship')return view==='garage'?1.12:1.08;
    return 1;
  }
  // Approved ORIGINAL illustrated Mechanical Fossil sprites (2026-11-03).
  // These are generated study originals, never concept-sheet or UI cutouts.
  const FOSSIL_ART_SOURCES=Object.freeze({garage:'{{ASSET:assets/vehicles/mechanical-fossil-garage.png}}',rear:'{{ASSET:assets/vehicles/mechanical-fossil-rear.png}}'});
  const fossilImages={},fossilSpriteCache=new Map(),fossilArtState={loaded:false,error:null};
  const fossilArtReady=typeof Image==='undefined'?Promise.resolve():Promise.all(Object.entries(FOSSIL_ART_SOURCES).map(async([view,src])=>{
    const image=new Image();image.src=src;await image.decode();fossilImages[view]=image;
  })).then(()=>{fossilArtState.loaded=true;}).catch(error=>{fossilArtState.error=String(error);throw error;});
  fossilArtReady.catch(()=>{});
  function drawFossilIllustration(ctx,{x,y,w,h,view,time=0,motion=false}){
    const source=fossilImages[view];
    if(!source)return; // Scene.ready waits for decoding; never flash the rejected model.
    const scale=Math.min(w/source.naturalWidth,h/source.naturalHeight);
    const width=Math.max(1,Math.round(source.naturalWidth*scale)),height=Math.max(1,Math.round(source.naturalHeight*scale));
    const key=view+':'+width+':'+height;
    let sprite=fossilSpriteCache.get(key);
    if(!sprite){
      sprite=document.createElement('canvas');sprite.width=width;sprite.height=height;
      const paint=sprite.getContext('2d');paint.imageSmoothingEnabled=true;paint.imageSmoothingQuality='high';
      paint.drawImage(source,0,0,width,height);
      // Author the cached game-size raster in the environment's chunky palette.
      // Sharpen before palette reduction; snap alpha to avoid soft matte fringes.
      const image=paint.getImageData(0,0,width,height),original=new Uint8ClampedArray(image.data);
      const palette=['#191e25','#30323a','#48424a','#60505a','#796354','#98784f','#b49763','#d0b17a','#e4cd99','#fae8b9','#562c2b','#79382e','#a44932','#c76438','#e38c40','#ffd074'].map(hex=>[1,3,5].map(k=>parseInt(hex.slice(k,k+2),16)));
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const i=(y*width+x)*4;if(original[i+3]<96){image.data[i+3]=0;continue;}
        const color=[0,1,2].map(k=>{let v=original[i+k]*1.4;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const j=(Math.max(0,Math.min(height-1,y+dy))*width+Math.max(0,Math.min(width-1,x+dx)))*4;v-=.1*(original[j+3]>=96?original[j+k]:original[i+k]);}return Math.max(0,Math.min(255,v));});
        let best=palette[0],distance=Infinity;for(const c of palette){const d=c.reduce((sum,v,k)=>sum+(v-color[k])**2,0);if(d<distance){distance=d;best=c;}}
        for(let k=0;k<3;k++)image.data[i+k]=best[k];image.data[i+3]=255;
      }
      paint.putImageData(image,0,0);
      if(fossilSpriteCache.size>=64)fossilSpriteCache.delete(fossilSpriteCache.keys().next().value);
      if(view==='rear'){
        const mask=c=>{c.beginPath();[[.48,.39],[.55,.40],[.58,.50],[.62,.60],[.68,.73],[.80,.86],[.98,.96],[.98,.99],[.84,.985],[.68,.92],[.56,.82],[.47,.70],[.41,.57],[.40,.44]].forEach(([x,y],i)=>i?c.lineTo(x*width,y*height):c.moveTo(x*width,y*height));c.closePath();};
        sprite.body=document.createElement('canvas');sprite.body.width=width;sprite.body.height=height;
        const body=sprite.body.getContext('2d');body.drawImage(sprite,0,0);body.globalCompositeOperation='destination-out';mask(body);body.fill();
        sprite.tail=document.createElement('canvas');sprite.tail.width=width;sprite.tail.height=height;
        const tail=sprite.tail.getContext('2d');mask(tail);tail.clip();tail.drawImage(sprite,0,0);
      }
      fossilSpriteCache.set(key,sprite);
    }
    // Attach the rear tyre contact line to the existing road shadow. The tail
    // sits slightly below it, as in the separately composed approved rear art.
    const wheelContact=view==='rear'?.94:.985;
    ctx.save();ctx.imageSmoothingEnabled=false;
    const left=Math.round(x-width/2),top=Math.round(y-height*wheelContact);
    if(view!=='rear'){ctx.drawImage(sprite,left,top,width,height);ctx.restore();return;}
    ctx.drawImage(sprite.body,left,top);
    // Scroll the ORIGINAL tyre tread inside fixed sidewalls. No added bars.
    if(motion)for(const cx of [.155,.805]){
      ctx.save();ctx.beginPath();ctx.ellipse(left+cx*width,top+.68*height,.083*width,.22*height,0,0,Math.PI*2);ctx.clip();
      const xx=Math.round(cx*width-.085*width),yy=Math.round(.46*height),ww=Math.ceil(.17*width),hh=Math.ceil(.44*height);
      const offset=Math.floor((time/28)%(hh));
      ctx.drawImage(sprite,xx,yy,ww,hh,left+xx,top+yy+offset,ww,hh);
      ctx.drawImage(sprite,xx,yy,ww,hh,left+xx,top+yy+offset-hh,ww,hh);
      ctx.restore();
    }
    // Only tail pixels move. Increasing displacement towards the tip leaves
    // the vertebral attachment and the entire rolling chassis stationary.
    const sway=motion?Math.sin(time/310)*width*.065:0;
    for(let row=0;row<height;row+=2){const progress=Math.max(0,(row/height-.39)/.61);ctx.drawImage(sprite.tail,0,row,width,Math.min(2,height-row),Math.round(left+sway*progress*progress),top+row,width,Math.min(2,height-row));}
    ctx.restore();
  }

  function draw(ctx,{x,y,w=200,h=140,models=null,loadout=null,view='garage',style='illustrated',time=0,motion=false,comboBodywork=true,livery=0}={}){
    if(!ctx||![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)return;
    const m=normalise(models||fromLoadout(loadout||{}));view=CAMERA[view]||/^orbit-[0-8]$/.test(view)?view:'garage';style=style==='chunky'?'chunky':'illustrated';
    if(comboBodywork&&G.resolve(m)?.id==='fossil'&&(view==='garage'||view==='rear')){
      drawFossilIllustration(ctx,{x,y,w,h,view,time,motion});return;
    }
    const phase=motion?Math.floor(Math.max(0,Number.isFinite(time)?time:0)/170)%4:0;
    livery=Number.isInteger(livery)&&livery>=1&&livery<=4?livery:0;
    const key=JSON.stringify([m,view,style,phase,!!comboBodywork,livery]);
    let img=CACHE.get(key);
    if(!img){img=renderRaster(m,view,style,phase,!!comboBodywork,livery);if(CACHE.size>=MAX_CACHE)CACHE.delete(CACHE.keys().next().value);CACHE.set(key,img);}
    const s=displayScale(m,view,!!comboBodywork),baseWidth=style==='chunky'?180:720,dw=w*s*(img.width/baseWidth);
    const fossilOffset=view==='garage'?0:(img.fossilOffset||0)*w*s/baseWidth;
    // A tall engine grows vertically in screen space instead of shrinking
    // every tyre and chassis panel. The wheel baseline stays at y.
    const dh=h*s*(img.height/(style==='chunky'?124:496));
    ctx.save();ctx.imageSmoothingEnabled=style!=='chunky';ctx.drawImage(img,x-dw/2+fossilOffset,y-dh,dw,dh);ctx.restore();
  }
  function renderPartRaster(models,slot,view='garage',style='illustrated',phase=0){
    const canvas=document.createElement('canvas');
    const chunky=style==='chunky';canvas.width=chunky?180:520;canvas.height=chunky?124:244;
    const ctx=canvas.getContext('2d');if(!ctx)return canvas;
    const all=projected(normalise(models),CAMERA[view]?view:'garage',phase,{comboBodywork:false}).faces;
    const faces=all.filter(f=>f.slot===slot).map(paintFaceInColour);
    if(!faces.length)return canvas;
    const coords=faces.flatMap(f=>f.pts),minX=Math.min(...coords.map(p=>p[0])),maxX=Math.max(...coords.map(p=>p[0])),minY=Math.min(...coords.map(p=>p[1])),maxY=Math.max(...coords.map(p=>p[1]));
    const pad=chunky?7:18,scale=Math.min((canvas.width-pad*2)/Math.max(1,maxX-minX),(canvas.height-pad*2)/Math.max(1,maxY-minY));
    const ox=(canvas.width-(maxX-minX)*scale)/2-minX*scale,oy=(canvas.height-(maxY-minY)*scale)/2-minY*scale;
    const surface=R.createSurface(canvas.width,canvas.height);R.paint(surface,faces,{scale,ox,oy,chunky});
    R.edges(surface,{ink:PALETTE.ink,light:PALETTE.light,chunky});
    const image=ctx.createImageData(canvas.width,canvas.height);image.data.set(surface.pixels);ctx.putImageData(image,0,0);return canvas;
  }
  const PART_RENDER_CACHE=new Map(),MAX_PART_RENDERS=36;
  function cachedPartRaster(models,slot,view,style){
    const key=JSON.stringify([models,slot,view,style]);
    if(PART_RENDER_CACHE.has(key))return PART_RENDER_CACHE.get(key);
    const image=renderPartRaster(models,slot,view,style,0),pixels=image.getContext('2d').getImageData(0,0,image.width,image.height).data;
    let left=image.width,top=image.height,right=-1,bottom=-1;
    for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
      if(pixels[(y*image.width+x)*4+3]<32)continue;
      if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;
    }
    const pad=style==='chunky'?4:9;
    const crop=right<left?{x:0,y:0,w:image.width,h:image.height}:{
      x:Math.max(0,left-pad),y:Math.max(0,top-pad),
      w:Math.min(image.width-1,right+pad)-Math.max(0,left-pad)+1,
      h:Math.min(image.height-1,bottom+pad)-Math.max(0,top-pad)+1
    };
    const result={image,crop};
    if(PART_RENDER_CACHE.size>=MAX_PART_RENDERS)PART_RENDER_CACHE.delete(PART_RENDER_CACHE.keys().next().value);
    PART_RENDER_CACHE.set(key,result);return result;
  }
  function drawPart(ctx,{x,y,w=180,h=100,slot,models=null,loadout=null,view='garage',style='illustrated'}={}){
    if(!ctx||!slot||![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)return;
    const m=normalise(models||fromLoadout(loadout||{})),asset=cachedPartRaster(m,slot,view,style);
    const {image:img,crop:c}=asset;
    const scale=Math.min(w/c.w,h/c.h)*.94,dw=c.w*scale,dh=c.h*scale;
    ctx.save();ctx.imageSmoothingEnabled=style!=='chunky';
    ctx.shadowColor='rgba(17,36,41,.3)';ctx.shadowBlur=6;ctx.shadowOffsetY=3;
    ctx.drawImage(img,c.x,c.y,c.w,c.h,x-dw/2,y-dh/2,dw,dh);
    ctx.restore();
  }
  function clearCache(){CACHE.clear();}
  return Object.freeze({ready:fossilArtReady,fossilArtStatus:()=>({...fossilArtState,cacheSize:fossilSpriteCache.size}),PALETTE,OPTIONS,DEFAULT,CAMERA,normalise,fromLoadout,geometry,project,projected,displayScale,draw,drawPart,recipes:G.RECIPES,resolveForm:G.resolve,clearCache,cacheSize:()=>CACHE.size});
});


