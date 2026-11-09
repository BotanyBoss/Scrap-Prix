/* Scrap Prix 3D garage integration: opt-in view, live equipped loadout, no gameplay changes. */
(function module(){
  'use strict';
  // Opt-in preview only. The 2D garage remains the default and offline fallback.
  const THREE_CDN='https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
  let library=null,live=null,serial=0;
  const slots=['engine','tyres','chassis','gadget'];
  const snapshot=value=>Object.fromEntries(slots.map(k=>[k,String(value?.[k]||'stock-'+k)]));
  const shapeHints=loadout=>{
    const s=snapshot(loadout);
    return {
      chassis:/hauler|longbody|wobble|armoured|boilerplate/.test(s.chassis)?'long':/needle|aero|carbon/.test(s.chassis)?'light':'standard',
      engine:/rocket|reactor/.test(s.engine)?'rocket':/boiler|diesel/.test(s.engine)?'heavy':'block',
      tyres:/monster|balloon|track-rollers/.test(s.tyres)?'large':/skinny|speed-slicks|rail/.test(s.tyres)?'small':'normal',
      gadget:/rocket|exhaust/.test(s.gadget)?'thrust':/plough|armour|impact/.test(s.gadget)?'defence':/aero|stability/.test(s.gadget)?'aero':'fan'
    };
  };
  const loadLibrary=()=>library||(library=import(THREE_CDN).catch(err=>{library=null;throw err;}));
  function createView(THREE,canvas,loadout){
    const owned=[],materials=[],scene=new THREE.Scene();
    scene.background=new THREE.Color('#253b43');
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.15;
    const camera=new THREE.PerspectiveCamera(41,1,.1,90);
    camera.position.set(7.9,5.4,9.7);camera.lookAt(0,1.04,0);
    scene.add(new THREE.HemisphereLight('#e8f0eb','#5e4c43',2.35));
    const spot=new THREE.DirectionalLight('#ffd7a6',3.0);spot.position.set(-6,12,8);scene.add(spot);
    const fill=new THREE.DirectionalLight('#9ddae5',1.5);fill.position.set(8,7,-6);scene.add(fill);
    const m=(color,other={})=>{const item=new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.15,...other});materials.push(item);return item;};
    const paint=m('#4aa8a3',{metalness:.5,roughness:.45});
    const trim=m('#d4c6a3',{metalness:.35}),dark=m('#26383e',{metalness:.18}),
      rubber=m('#1c2529',{roughness:.94}),steel=m('#71888f',{metalness:.7,roughness:.36}),
      copper=m('#c58250',{metalness:.55}),gold=m('#e0bb65',{metalness:.42}),red=m('#a74f3c');
    const wall=m('#55757c'),brick=m('#885f51'),floor=m('#566067',{roughness:.93}),
      cabinet=m('#913f34',{metalness:.58}),shadow=m('#273b42'),warm=m('#e9be71',{emissive:'#92601f',emissiveIntensity:.65}),
      green=m('#638876'),black=m('#141d20');
    const make=(geo,mat,parent,x=0,y=0,z=0)=>{
      const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);parent.add(mesh);owned.push(geo);return mesh;
    };
    const box=(parent,w,h,d,mat,x=0,y=0,z=0)=>make(new THREE.BoxGeometry(w,h,d),mat,parent,x,y,z);
    const cylinder=(parent,top,bottom,height,mat,x,y,z,segments=12)=>make(new THREE.CylinderGeometry(top,bottom,height,segments),mat,parent,x,y,z);
    // Whole-scene geometry is purposefully restrained; keep a separate artistic review gate.
    const ground=make(new THREE.PlaneGeometry(28,23),floor,scene,0,-.13,0);ground.rotation.x=-Math.PI/2;
    box(scene,22,8,.30,wall,0,4,-8.3);box(scene,.30,8,18,wall,-10.7,4,-.4);
    for(let i=0;i<10;i++){
      const x=-9.6+i*2.12;
      box(scene,2.0,.08,.08,brick,x,2,-8.09);
      box(scene,2.0,.08,.08,brick,x,4,-8.09);
      box(scene,.06,2.0,.07,dark,x,3,-8.04);
    }
    box(scene,3.3,2.0,.85,cabinet,-7.4,1.0,-5.6);
    for(const y of [.55,1.02,1.52])box(scene,2.95,.06,.95,gold,-7.4,y,-5.06);
    box(scene,2.1,3,.40,shadow,7.1,1.65,-6.5);
    for(let i=0;i<5;i++)box(scene,.22,1.15,.27,[copper,green,gold,red,steel][i],6.4+i*.35,2.65,-6.15);
    // Wide workshop lift, visible in a three-quarter camera.
    const platform=cylinder(scene,3.62,3.62,.19,dark,0,.10,0,44);
    cylinder(scene,3.48,3.48,.06,steel,0,.23,0,44);
    const rim=cylinder(scene,3.28,3.28,.06,gold,0,.27,0,44);
    cylinder(scene,3.09,3.09,.09,shadow,0,.31,0,44);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const mark=box(scene,.48,.04,.18,gold,Math.cos(a)*3.05,.37,Math.sin(a)*3.05);
      mark.rotation.y=-a;
    }
    const car=new THREE.Group();scene.add(car);
    car.position.set(0,.37,0);
    const groups={chassis:new THREE.Group(),engine:new THREE.Group(),tyres:new THREE.Group(),gadget:new THREE.Group()};
    slots.forEach(k=>car.add(groups[k]));
    const shape=shapeHints(loadout);
    const length=shape.chassis==='long'?4.15:shape.chassis==='light'?3.3:3.65;
    const width=shape.chassis==='long'?2.58:2.34;
    // Chassis: vehicle silhouette is one whole body; module boundaries are still real.
    box(groups.chassis,width,.47,length,paint,0,.80,0);
    box(groups.chassis,width*.95,.18,length*.92,trim,0,.57,0);
    box(groups.chassis,width*.80,.50,length*.38,paint,0,1.18,-.37);
    box(groups.chassis,width*.56,.30,.64,dark,0,1.42,-.58);
    box(groups.chassis,width*.92,.12,.2,steel,0,.62,length/2+.09);
    box(groups.chassis,width*.92,.12,.2,steel,0,.62,-length/2-.09);
    for(const side of [-1,1]){
      box(groups.chassis,.16,.82,.15,steel,side*.78,1.4,-.95);
      const bar=box(groups.chassis,.14,.12,1.4,steel,side*.78,1.81,-.30);
      bar.rotation.x=.25;
      box(groups.chassis,.19,.33,length*.38,paint,side*(width/2+.02),.91,-.28);
    }
    // Engine, visible as a separate bolt-on assembly at the front.
    const engine=groups.engine,heavy=shape.engine==='heavy';
    box(engine,heavy?1.55:1.30,.63,.93,shape.engine==='rocket'?copper:steel,0,1.35,length/2-.72);
    for(const x of [-.42,.42]){
      const pipe=cylinder(engine,heavy?.23:.16,heavy?.23:.16,heavy?1.02:.65,steel,x,1.82,length/2-.72);
      pipe.rotation.z=heavy?0:.07;
    }
    if(shape.engine==='rocket'){
      for(const x of [-.38,.38]){
        const jet=cylinder(engine,.28,.38,1.02,copper,x,1.27,length/2-.15);
        jet.rotation.x=Math.PI/2;
      }
    }
    // Wheels: four independent tyre/wheel meshes in the tyre module.
    const rad=shape.tyres==='large'?.78:shape.tyres==='small'?.49:.61;
    for(const side of [-1,1])for(const z of [length*.36,-length*.36]){
      const x=side*(width/2+.10);
      const t=cylinder(groups.tyres,rad,rad,shape.tyres==='large'?.52:.40,rubber,x,.72,z,16);
      t.rotation.z=Math.PI/2;
      const hub=cylinder(groups.tyres,rad*.47,rad*.47,.035,steel,x+side*.26,.72,z,12);hub.rotation.z=Math.PI/2;
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2;
        const stud=box(groups.tyres,.035,rad*.48,.07,gold,x+side*.29,.72,z);
        stud.rotation.x=a;
      }
    }
    // Gadget gets its own actual group with visibly different design families.
    const rear=-length/2+.18;
    if(shape.gadget==='thrust'){
      for(const x of [-.52,.52]){
        const j=cylinder(groups.gadget,.23,.34,.95,copper,x,1.25,rear);
        j.rotation.x=Math.PI/2;
      }
    }else if(shape.gadget==='defence'){
      box(groups.gadget,width*1.15,.40,.30,steel,0,.65,length/2+.31);
      for(const x of [-1,1])box(groups.gadget,.12,.23,.54,gold,x*width*.38,.80,length/2+.49);
    }else if(shape.gadget==='aero'){
      box(groups.gadget,width*1.12,.13,.44,gold,0,1.75,rear);
      for(const x of [-.85,.85])box(groups.gadget,.11,.55,.14,steel,x,1.50,rear);
    }else{
      const fan=cylinder(groups.gadget,.38,.38,.22,copper,0,1.73,rear);
      fan.rotation.x=Math.PI/2;
      for(let i=0;i<4;i++){
        const b=box(groups.gadget,.14,.57,.07,trim,0,1.72,rear-.16);
        b.rotation.z=i*Math.PI/4;
      }
    }
    let start=0,drag=null,angle=-.47,raf=0,disposed=false;
    const down=e=>{drag=e.clientX;canvas.setPointerCapture?.(e.pointerId);};
    const move=e=>{if(drag!==null){angle+=(e.clientX-drag)*.01;drag=e.clientX;}};
    const up=()=>{drag=null;};
    canvas.addEventListener('pointerdown',down);
    canvas.addEventListener('pointermove',move);
    canvas.addEventListener('pointerup',up);
    canvas.addEventListener('pointercancel',up);
    let w=0,h=0;
    function resize(){
      const rect=canvas.getBoundingClientRect();
      const nw=Math.max(1,Math.round(rect.width)),nh=Math.max(1,Math.round(rect.height));
      if(nw===w&&nh===h)return;
      w=nw;h=nh;renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
      renderer.setSize(nw,nh,false);camera.aspect=nw/nh;
      camera.position.set(nw/nh<1.35?9.5:7.9,5.4,nw/nh<1.35?12.4:9.7);
      camera.updateProjectionMatrix();
    }
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
    observer?.observe(canvas);
    function frame(time){
      if(disposed)return;
      resize();
      if(!document.hidden){
        car.rotation.y=angle+Math.sin(time*.0003)*.045;
        car.position.y=.39+Math.sin(time*.0014)*.012;
        renderer.render(scene,camera);
      }
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);
    return {parts:snapshot(loadout),groups,renderer,dispose(){
      if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer?.disconnect();
      canvas.removeEventListener('pointerdown',down);
      canvas.removeEventListener('pointermove',move);
      canvas.removeEventListener('pointerup',up);
      canvas.removeEventListener('pointercancel',up);
      owned.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();
    }};
  }
  function dispose(){serial++;if(live){live.dispose();live=null;}}
  async function mount(canvas,loadout,report=()=>{}){
    dispose();
    if(!canvas||!canvas.isConnected)throw Error('The 3D preview canvas is unavailable.');
    const token=serial;
    report('LOADING THREE.JS');
    try{
      const THREE=await loadLibrary();
      if(token!==serial||!canvas.isConnected)return false;
      const view=createView(THREE,canvas,snapshot(loadout));
      if(token!==serial||!canvas.isConnected){view.dispose();return false;}
      live=view;report('3D TEST · PROCEDURAL PARTS');return true;
    }catch(err){if(token===serial)report('3D UNAVAILABLE · USING ORIGINAL GARAGE');throw err;}
  }
  window.ScrapThreeGarage={mount,dispose,shapeHints,parts:()=>live?.parts||null,sourceVersion:'three@0.162.0'};
})();
