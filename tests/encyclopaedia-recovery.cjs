// Regression for ordinary events, unwitnessed crash recovery and result idempotence.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),saved=new Map();
const storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))};
const load=()=>{
 const ctx=vm.createContext({localStorage:storage});ctx.window=ctx;ctx.globalThis=ctx;
 for(const f of ['src/02-catalogue.js','src/03-engine.js','src/26-bounties.js','src/27-encyclopaedia.js'])
  vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
 return ctx;
};
const {ScrapData:D,ScrapEngine:E,ScrapEncyclopaedia:A}=load();
A.startRun();
assert.equal(A.recordEventSeen('optional','cargo-spill'),true);
assert.equal(A.recordEventSeen('wildcard','cargo-spill'),false,'optional and wildcard are one entry');
assert.equal(A.snapshot().entries.events['wildcard:cargo-spill'].state,'discovered');
assert.equal(A.recordEventMissed('optional','wreckage-shortcut'),true);
assert.equal(A.snapshot().entries.shortcuts['wildcard:wreckage-shortcut'].state,'missed');
assert.equal(A.recordEventSeen('optional','wreckage-shortcut'),true);
assert.equal(A.snapshot().entries.shortcuts['wildcard:wreckage-shortcut'].state,'discovered');
let race=null;
for(let seed=1;seed<200&&!race;seed++){
 const before=E.newRun(seed),r=E.race(before).history.at(-1);
 if(r.laps.flatMap(l=>l.effects).some(e=>e.kind==='optional'&&e.id))race=r;
}
assert(race,'No naturally resolved optional event found');
const opted=race.laps.flatMap(l=>l.effects).find(e=>e.kind==='optional'&&e.id);
A.recordUnwitnessedResult(race);
const key='wildcard:'+opted.id;
const current=A.snapshot();
const tab=current.entries.shortcuts[key]?'shortcuts':'events';
assert.equal(current.entries[tab][key].state,'missed');
A.recordEventSeen('optional',opted.id);
A.recordUnwitnessedResult(race);
assert.equal(A.snapshot().entries[tab][key].state,'discovered','never downgrade seen event');
const extra={laps:[{effects:[{kind:'optional',id:'flooded-section'},{kind:'wear',id:null}]}],
 passEvents:[{id:D.PASS_EVENTS[0].id}],fakePassEvents:[{id:D.FAKE_PASS_EVENTS[0].id}]};
A.recordUnwitnessedResult(extra);
assert.equal(A.snapshot().entries.events['wildcard:flooded-section'].state,'missed');
assert.equal(A.snapshot().entries.events['pass:'+D.PASS_EVENTS[0].id].state,'missed');
assert.equal(A.snapshot().entries.events['fake:'+D.FAKE_PASS_EVENTS[0].id].state,'missed');
const unseen=D.WILDCARDS.find(def=>{
 const k='wildcard:'+def.id,s=A.snapshot();
 return !s.entries.events[k]&&!s.entries.shortcuts[k];
});
assert(unseen,'Need an unseen event to test scheduled-only exclusion');
A.recordUnwitnessedResult({laps:[],events:[{kind:'optional',id:unseen.id}]});
assert(!A.snapshot().entries.events['wildcard:'+unseen.id]);
assert(!A.snapshot().entries.shortcuts['wildcard:'+unseen.id]);
const completed={...race,race:1,bountyResults:[{id:'third',success:true}]};
assert.equal(A.recordResult(completed),true);
assert.equal(A.recordResult(completed),false);
const reload=load().ScrapEncyclopaedia;
assert.equal(reload.recordResult(completed),false,'No double-counted bounty after reload');
assert.equal(reload.list('bounties').find(x=>x.key==='third').count,1);
assert.equal(reload.snapshot().entries[tab][key].state,'discovered');
assert.equal(reload.snapshot().entries.shortcuts['wildcard:wreckage-shortcut'].state,'discovered');
console.log('PASS: optional/wildcard aliases, observed vs skipped events, mid-race recovery and bounty dedupe');
