'use strict';
const Stage=ScrapSideStage,$=id=>document.getElementById(id);
const canvas=$('stage'),ctx=canvas.getContext('2d');
const controls=[['duration','Duration (ms)',2000,16000,100],['speed','Road speed (px/s)',0,180,5],
  ['easing','Acceleration easing',0,1,.05],['bounce','Body bounce (px)',0,6,.25],
  ['follow','Camera settle (ms)',100,2400,50],['lead','Camera lead (px)',-50,50,1]];
for(const [slot,ids] of Object.entries(Pipeline.choices)){
  const label=document.createElement('label');label.textContent=slot;
  const select=document.createElement('select');select.id=slot;
  for(const id of ids)select.add(new Option(id,id));
  label.append(select);$('loadout').append(label);
}
for(const [key,title,min,max,step] of controls){
  const label=document.createElement('label');label.textContent=title;
  const input=document.createElement('input');Object.assign(input,{id:key,type:'range',min,max,step,value:Stage.defaults[key]});
  input.setAttribute('aria-label',title);label.append(input);$('parameters').append(label);
}
let rig,plan,time=0,playing=true,last=null;
$('reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
function settings(){
  return {version:1,preset:$('preset').value,loadout:Object.fromEntries(Object.keys(Pipeline.choices).map(k=>[k,$(k).value])),
    parameters:Object.fromEntries(controls.map(([key])=>[key,Number($(key).value)]))};
}
function rebuild(){
  const s=settings();rig=Stage.createRig(s.loadout,Pipeline);plan=Stage.preset(s.preset,s.parameters);
  time=Math.min(time,plan.duration);$('seek').max=plan.duration;
  $('note').textContent=['bump','jump','impact'].includes(s.preset)?
    'Illustrative motion study. This is not an event witnessed in a real race.':'Ordinary travel study. Temporary shapes represent the selected equipment.';
  paint();
}
function paint(){
  const pose=Stage.draw(ctx,rig,plan,time,{reduced:$('reduced').checked,guides:$('guides').checked});
  canvas.dataset.pose=JSON.stringify(pose);canvas.dataset.wheels=rig.wheels.length;canvas.dataset.loadout=JSON.stringify(rig.loadout);
  $('seek').value=time;$('clock').value=(time/1000).toFixed(2)+' / '+(plan.duration/1000).toFixed(1)+' s';
  $('pose').textContent='Cue '+pose.action+'  |  '+rig.wheels.length+' wheels\nTravel '+pose.distance.toFixed(1)+' px  |  Speed '+pose.speed.toFixed(1)+' px/s\nBody '+pose.bodyY.toFixed(1)+' px  |  Lift '+pose.lift.toFixed(1)+' px  |  Camera '+pose.camera.toFixed(1)+' px';
  $('play').textContent=playing?'Pause':'Play';$('play').setAttribute('aria-pressed',String(playing));
}
function frame(now){
  if(last!==null&&playing&&!document.hidden){
    time+=Math.min(100,now-last)*Number($('playback-speed').value);
    if(time>=plan.duration){if($('loop').checked)time%=plan.duration;else{time=plan.duration;playing=false;}}
  }
  last=now;paint();requestAnimationFrame(frame);
}
$('play').onclick=()=>{if(time===plan.duration)time=0;playing=!playing;last=null;paint();};
$('restart').onclick=()=>{time=0;last=null;paint();};
$('step').onclick=()=>{playing=false;time=Math.min(plan.duration,time+1000/30);paint();};
$('seek').oninput=()=>{playing=false;time=Number($('seek').value);paint();};
for(const id of [...Object.keys(Pipeline.choices),...controls.map(c=>c[0]),'preset'])$(id).oninput=rebuild;
$('reduced').onchange=paint;$('guides').onchange=paint;
$('export').onclick=()=>{$('config').value=JSON.stringify(settings(),null,2);$('status').textContent='Config ready to copy or download.';};
$('save').onclick=()=>{
  $('export').click();
  const url=URL.createObjectURL(new Blob([$('config').value],{type:'application/json'})),link=document.createElement('a');
  link.href=url;link.download='scrap-prix-side-motion.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('restore').onclick=()=>{
  try{
    const s=JSON.parse($('config').value);
    if(s.version!==1||!Array.from($('preset').options).some(o=>o.value===s.preset)||!Stage.createRig(s.loadout||{},Pipeline))throw Error('Unsupported preset or equipment');
    const params=Stage.config(s.parameters);
    for(const key of Object.keys(Pipeline.choices))$(key).value=s.loadout[key];
    for(const key of Object.keys(params))$(key).value=params[key];
    $('preset').value=s.preset;time=0;playing=false;rebuild();$('status').textContent='Configuration restored.';
  }catch(e){$('status').textContent=e.message;}
};
rebuild();requestAnimationFrame(frame);
