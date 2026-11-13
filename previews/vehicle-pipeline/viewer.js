function startWorkshop(){
  const $=id=>document.getElementById(id),localCache=new Map(),stats={hits:0,misses:0,uploads:0,gpu:0,soft:0,draw:0};
  const garage=$('garage'), gpu=gpuView(garage),overlay=$('overlay'),ctx=overlay.getContext('2d');
  let rig,lastPair;
  const loadout={};
  for(const [slot,ids] of Object.entries(Pipeline.choices)){
    const label=document.createElement('label'),select=document.createElement('select');
    label.textContent=slot[0].toUpperCase()+slot.slice(1)+' ';select.id=slot;
    for(const id of ids)select.add(new Option(ScrapData.PARTS.find(p=>p.id===id).name,id));
    loadout[slot]=ids[0];label.append(select);$('loadout').append(label);$('wear').add(new Option('Worn '+slot,slot));
    select.onchange=()=>{loadout[slot]=select.value;update()};
  }
  function update(){
    rig=Pipeline.assemble(loadout,rig);stats.uploads=gpu.update(rig);
    $('layout').textContent=rig.wheels.length+' wheels · '+rig.axles.length+' axles · body width '+rig.bodyWidth.toFixed(2)+' units';
    refresh();
  }
  function metrics(){
    $('metrics').textContent='Last generated: 3D '+stats.gpu.toFixed(2)+' ms / raster '+stats.soft.toFixed(2)+' ms. Garage draw submit '+stats.draw.toFixed(2)+' ms. '+stats.uploads+' slot buffers replaced. Cache '+localCache.size+'/12 frame pairs · '+stats.hits+' hits / '+stats.misses+' misses. RGBA frames '+Math.round(localCache.size*164*113*8/1024)+' KiB · GPU vertex buffers '+Math.round(gpu.bytes()/1024)+' KiB.';
  }
  function inspect(){
    const angles=[$('orbit'),$('pitch')].map(el=>Number(el.value)*Math.PI/180);
    const t=performance.now();gpu.draw(angles,$('wear').value);stats.draw=performance.now()-t;
    ctx.clearRect(0,0,overlay.width,overlay.height);
    if($('sockets').checked){
      const mark=(p,label,color)=>{
        const [a,b]=Pipeline.project(p,angles),x=246+a*75,y=252+b*75;
        ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,5,0,2*Math.PI);ctx.stroke();
        ctx.fillStyle=color;ctx.font='bold 13px monospace';ctx.fillText(label,x+7,y-6);
      };
      rig.wheels.forEach((p,i)=>mark(p,String(i+1),'#ffe5a8'));
      mark(rig.engine,'ENGINE','#ffb589');mark(rig.gadget,'GADGET','#a8fff0');
    }
    metrics();
  }
  function refresh(){
    const view=$('view').value,wear=$('wear').value,key=JSON.stringify([loadout,view,wear]),angles=Pipeline.cameras[view];
    lastPair=localCache.get(key);
    if(lastPair){stats.hits++;localCache.delete(key)}else{
      const start=performance.now(),capture=gpu.snapshot(angles,wear);
      // Readback includes GPU completion in generation timing.
      capture.getContext('2d').getImageData(0,0,164,113);
      const split=performance.now(),raster=softwareFrame(rig,angles,wear);
      stats.gpu=split-start;stats.soft=performance.now()-split;stats.misses++;
      lastPair=[capture,raster];if(localCache.size===12)localCache.delete(localCache.keys().next().value);
    }
    localCache.set(key,lastPair);
    ['capture','raster'].forEach((id,i)=>{const c=$(id).getContext('2d');c.clearRect(0,0,164,113);c.drawImage(lastPair[i],0,0)});
    inspect();
  }
  for(const id of ['view','wear'])$(id).onchange=refresh;
  for(const id of ['orbit','pitch','sockets'])$(id).oninput=inspect;
  garage.onpointerdown=e=>{garage.setPointerCapture(e.pointerId)};
  garage.onpointermove=e=>{
    if(!garage.hasPointerCapture(e.pointerId))return;
    $('orbit').value=((Number($('orbit').value)+e.movementX+540)%360)-180;
    $('pitch').value=Number($('pitch').value)-e.movementY;inspect();
  };
  for(const [i,id] of ['export','export2'].entries())$(id).onclick=()=>{
    const link=document.createElement('a');link.download=[...Object.values(loadout),$('view').value,$('wear').value||'clean',i?'raster':'gpu'].join('_')+'.png';
    link.href=lastPair[i].toDataURL();link.click();
  };
  update();
}
try{startWorkshop()}catch(e){document.getElementById('error').textContent=e.message;console.error(e)}
