/* Workshop coordinates: +Z nose, +X right, +Y up. Ground origin is the
   centreline under the donor chassis origin. All parts use one donor unit. */
const Pipeline = (() => {
  const art = ScrapVehicleArt;
  const choices = {
    chassis: ['stock-chassis','needle-frame','longbody'],
    engine: ['stock-engine','inline-four','v8'],
    tyres: ['stock-tyres','skinny-spokes','speed-slicks'],
    gadget: ['stock-gadget','impact-foam','cooling-fan']
  };
  const palette = {
    chassis:['#17282e','#24464a','#37666a','#4c9593','#83c9b2','#d9e5bd','#f6ead0'],
    engine:['#17282e','#442c2a','#7d3e36','#b85c43','#e69568','#f0cd9b','#f9e8ca'],
    tyres:['#17282e','#202b2f','#3a484d','#65757a','#9fadb0','#d7d9d2','#f2e9d6'],
    gadget:['#17282e','#4d3b27','#80612f','#b89348','#e0be74','#f1dda9','#f8edcc']
  };
  const cameras = {side:[Math.PI/2,.12],rear:[2.52,.30],front:[.82,.31]};
  const units = new Map(), shadeKeys = Object.values(art.PALETTE);
  const translate=(faces,delta)=>faces.map(f=>({...f,pts:f.pts.map(p=>p.map((v,i)=>v+delta[i]))}));
  function material(f,slot) {
    const tint=c=>palette[slot][shadeKeys.indexOf(c)]||c;
    return {...f,fill:tint(f.fill),stroke:tint(f.stroke)};
  }
  function asset(slot,id) {
    const key=slot+'/'+id;
    if(units.has(key))return units.get(key);
    const models=art.fromLoadout({[slot]:id});
    const {primitives,mounts:m}=art.geometry(models,0,{comboBodywork:false});
    let faces=primitives.filter(f=>f.slot===slot).map(f=>material(f,slot));
    let origin=[0,0,0], radius, width;
    if(slot==='tyres'){
      radius={'stock-tyres':.47,'skinny-spokes':.53,'speed-slicks':.45}[id];
      width=m.tyreWidth;
      // Isolate one outward-facing wheel from the donor's front-right hub.
      faces=faces.filter(f=>f.pts.every(p=>p[0]>0&&p[2]>0));
      origin=[m.axle,radius,m.frontAxle];
    }
    if(slot==='engine')origin=m.engine;
    if(slot==='gadget')origin=[0,m.deck+.04,m.rearAxle-.17];
    const part={faces:translate(faces,origin.map(v=>-v)),m,radius,width};
    units.set(key,part);return part;
  }
  function beam(a,b,slot,width=3){return {slot,open:true,pts:[a,b],stroke:'#81786a',width}}
  function axleBar(x,y,z){
    const faces=[],r=.064;
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,b=a+Math.PI/4;
      const at=(end,angle)=>[end*x,y+r*Math.cos(angle),z+r*Math.sin(angle)];
      faces.push({slot:'chassis',fill:i<2||i>5?'#839da5':'#435b64',
        pts:[at(-1,a),at(1,a),at(1,b),at(-1,b)]});
    }
    return faces;
  }
  function assemble(loadout,previous){
    for(const [slot,ids] of Object.entries(choices))if(!ids.includes(loadout[slot]))throw Error('Unsupported '+slot);
    const body=asset('chassis',loadout.chassis),wheel=asset('tyres',loadout.tyres),m=body.m;
    const tandem=loadout.chassis==='longbody',needle=loadout.chassis==='needle-frame';
    const axles=tandem?[m.frontAxle,m.rearAxle+1.17,m.rearAxle]:[m.frontAxle,m.rearAxle];
    const dy=wheel.radius-.47,x=Math.max(m.axle,m.bodyOuter+wheel.width/2+.07);
    const engine=[0,m.deck+dy+(needle?.55:tandem?.64:.18),m.engine[2]];
    const gadget=[0,m.deck+dy+.18,m.rearAxle-.17];
    const sameRig=previous && ['chassis','tyres'].every(k=>previous.loadout[k]===loadout[k]);
    const groups={}, wheels=sameRig?previous.wheels:[];
    for(const [slot,mount] of [['engine',engine],['gadget',gadget]]){
      groups[slot]=sameRig && previous.loadout[slot]===loadout[slot]?previous.groups[slot]:translate(asset(slot,loadout[slot]).faces,mount);
    }
    if(sameRig){
      groups.chassis=previous.groups.chassis; groups.tyres=previous.groups.tyres;
    }else{
      groups.chassis=translate(body.faces,[0,dy,0]); groups.tyres=[];
      for(const z of axles){
        groups.chassis.push(...axleBar(x,wheel.radius,z));
        for(const side of [-1,1]){
          const hub=[side*x,wheel.radius,z]; wheels.push(hub);
          for(const f of wheel.faces)groups.tyres.push({...f,pts:f.pts.map(([a,b,c])=>[hub[0]+side*a,hub[1]+b,z+c])});
        }
      }
      for(const [mount,span] of [[engine,.34],[gadget,.27]]){
        for(const side of [-1,1])groups.chassis.push(beam([side*span,m.deck+dy,mount[2]+.16],[side*span,mount[1],mount[2]],'chassis',5));
      }
      groups.chassis.push(...axleBar(.58,gadget[1]+.10,gadget[2]));
    }
    return {groups,wheels,axles,engine,gadget,bodyWidth:m.bodyOuter*2,loadout:{...loadout}};
  }
  function project([x,y,z],[yaw,pitch]){
    const d=x*Math.sin(yaw)+z*Math.cos(yaw);
    return [x*Math.cos(yaw)-z*Math.sin(yaw),-y*Math.cos(pitch)+d*Math.sin(pitch),d*Math.cos(pitch)+y*Math.sin(pitch)];
  }
  function wearColour(hex,worn){
    if(!hex||!worn)return hex;
    const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
    return '#'+rgb.map((c,i)=>Math.round(c*.63+[120,77,54][i]*.37).toString(16).padStart(2,'0')).join('');
  }
  return {choices,cameras,assemble,project,wearColour,units};
})();
