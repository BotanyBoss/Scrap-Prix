const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({});ctx.window=ctx;
for(const file of ['src/02-catalogue.js','src/07-raster.js','src/08-gag-recipes.js','src/09-vehicle-art.js',
  'previews/vehicle-pipeline/assembly.js','src/35-side-stage.js'])
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),ctx);
const stage=ctx.ScrapSideStage,pipeline=vm.runInContext('Pipeline',ctx);
const loadout={chassis:'stock-chassis',engine:'stock-engine',tyres:'stock-tyres',gadget:'stock-gadget'};
let rigs=0;
for(const chassis of pipeline.choices.chassis)for(const tyres of pipeline.choices.tyres)
for(const engine of pipeline.choices.engine)for(const gadget of pipeline.choices.gadget){
  const gear={chassis,tyres,engine,gadget},rig=stage.createRig(gear,pipeline);
  assert.equal(rig.wheels.length,chassis==='longbody'?6:4);
  const plan=stage.preset('accelerate-brake');
  for(let t=20;t<=8000;t+=47){
    const p=stage.sample(plan,t),w=stage.wheelPose(rig,p);
    assert.equal(JSON.stringify(p),JSON.stringify(stage.sample(plan,t)));
    stage.sample(plan,20);
    assert.equal(JSON.stringify(p),JSON.stringify(stage.sample(plan,t)));
    for(const hub of w){
      assert(Math.abs(hub.y+hub.radius+(hub.far?3:0)-p.ground)<1e-9);
      assert(hub.x-hub.radius>0&&hub.x+hub.radius<480);
      assert(Math.abs(hub.angle*hub.radius+p.distance)<1e-9);
    }
    const derivative=(stage.sample(plan,t+.001).distance-stage.sample(plan,t-.001).distance)/.000002;
    if(t<7999)assert(Math.abs(derivative-p.speed)<.01);
    assert.equal(p.lift,0);
  }
  rigs++;
}
assert.equal(stage.createRig({...loadout,engine:'reactor'},pipeline),null);
const debrisEffect={id:'debris',kind:'signature',key:'signature',damage:7,damageBySlot:{chassis:4,tyres:3}};
const debris=stage.debrisPlan(debrisEffect,{duration:4800});
assert.equal(debris.illustrative,false);
assert.equal(debris.effect.damage,7);
const before=stage.debrisPose(debris,4800*.32),near=stage.debrisPose(debris,4800*.42),
  passed=stage.debrisPose(debris,4800*.56);
assert(before.visible&&near.visible&&passed.visible);
assert(before.x<near.x&&near.x<passed.x,'Debris must move LEFT to RIGHT as a left-facing car advances');
assert(before.x<140&&near.x>100,'Debris must be in front of the car before impact');
assert(passed.x>238,'Debris must pass the car during the reaction shot');
for(let i=0;i<3;i++){
  const approach=stage.debrisPose(debris,4800*.4,i);
  const exit=stage.debrisPose(debris,4800*.8,i);
  assert(exit.x>approach.x,'Debris '+i+' should never reverse towards the front');
  assert(!stage.debrisPose(debris,4800*.95,i).visible);
}
assert.deepEqual(stage.debrisPose(debris,4800*.42),stage.debrisPose(debris,4800*.42));
assert.equal(stage.sample(debris,4800*.35).action,'anticipation');
assert.equal(stage.sample(debris,4800*.55).action,'impact');
assert.equal(stage.sample(debris,4800*.82).action,'recovery');
assert.equal(stage.sample(debris,4800*.99).shudder,0);
assert.equal(stage.sample(debris,4800*.55,true).action,'reduced motion');
assert.equal(stage.sample(debris,4800*.55,true).shudder,0);
const missed=stage.debrisPlan({...debrisEffect,damage:0});
assert.equal(stage.sample(missed,missed.duration*.55).action,'evasion');
assert.equal(stage.sample(missed,missed.duration*.55).shudder,0);
assert.throws(()=>stage.debrisPlan({...debrisEffect,id:'hail'}));
assert.equal(JSON.stringify(stage.sample(debris,2000)),JSON.stringify(stage.sample(debris,2000)));
assert.throws(()=>stage.preset('jump',{},false));
assert.equal(stage.sample(stage.preset('idle'),4000).distance,0);
for(const preset of ['idle','cruise','accelerate-brake','bump','jump','impact']){
  const plan=stage.preset(preset);
  const reduced=stage.sample(plan,3000,true);
  for(const key of ['distance','lift','bodyY','roll','shudder'])assert.equal(reduced[key],0);
}
const jump=stage.preset('jump'),poses=Array.from({length:801},(_,i)=>stage.sample(jump,i*10));
assert(poses.some(p=>p.action==='anticipation'&&p.squash<1));
assert(poses.some(p=>p.action==='airborne'&&p.lift>40));
assert(poses.some(p=>p.action==='landing'&&p.bodyY>0));
assert.equal(poses.at(-1).lift,0);
const impact=stage.sample(stage.preset('impact'),3000);assert(Math.abs(impact.shudder)>0);
console.log('PASS side-stage: '+rigs+' actual rigs, deterministic seeks, wheel/ground velocity, contacts, cue phases and reduced motion');
