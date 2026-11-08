// The 26 genuine and 7 fake overtaking effects must be representable on an actual replay.
// This is a presentation-timeline test, not a certification of final sprite/3D art.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','dist/dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const ctx=vm.createContext({console});ctx.globalThis=ctx;ctx.window=ctx;
for(const i of [0,1,2,3,4,5])vm.runInContext(scripts[i],ctx);
const D=ctx.ScrapData,E=ctx.ScrapEngine,P=ctx.ScrapPresentation;
const clone=v=>JSON.parse(JSON.stringify(v));
let before=null,after=null;
for(let seed=1;seed<=300&&!before;seed++){
 const s=clone(E.newRun(seed));
 s.loadout={engine:'v8',tyres:'speed-slicks',chassis:'carbon-lite',gadget:'aero-kit'};
 s.levels={engine:10,tyres:10,chassis:10,gadget:10};
 s.durability={engine:100,tyres:100,chassis:100,gadget:100};
 s.approach='reckless';
 const out=clone(E.race(s)),result=out.history.at(-1);
 if(!result.noStart&&!result.failedSlot&&result.place<=4){before=s;after=out;}
}
assert(before&&after,'Need a successful race with at least one visual overtake');
const result=after.history.at(-1);
const total=5-result.place;
assert(total>0);
function testVisualEvent(id,fake){
 const def=fake?E.fakePassEvent(id):E.passEvent(id);
 assert(def&&def.id===id,'Unknown '+(fake?'fake':'real')+' pass event '+id);
 result.passEvents=fake?[]:[{id,index:0}];
 result.fakePassEvents=fake?[{id,index:0}]:[];
 const replay=P.createReplay(before,after);
 const driving=replay.total-replay.steps.at(-1).duration;
 let found=false;
 for(let i=0;i<=400;i++){
    const state=P.overtakeState(replay,driving*i/400);
    const entry=fake?state.fake:state.special;
    if(entry?.id===id){assert(entry.local>=0&&entry.local<=1,'Animation progress out of bounds');found=true;break;}
 }
 assert(found,'Special visual not scheduled: '+id);
}
for(const x of D.PASS_EVENTS)testVisualEvent(x.id,false);
for(const x of D.FAKE_PASS_EVENTS)testVisualEvent(x.id,true);
console.log('PASS: '+D.PASS_EVENTS.length+' genuine passes and '+D.FAKE_PASS_EVENTS.length+' fake passes are scheduled with finite animation progress.');
