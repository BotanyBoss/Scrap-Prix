// Permanent stage-specific discoveries must not reveal an unwitnessed finale.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))};
const load=()=>{
 const ctx=vm.createContext({localStorage:storage});ctx.window=ctx;ctx.globalThis=ctx;
 for(const f of ['src/02-catalogue.js','src/03-engine.js','src/26-bounties.js','src/27-encyclopaedia.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
 return ctx.ScrapEncyclopaedia;
};
const A=load();
assert.equal(A.hasSeenEvent('anomaly','suspicious-lights'),false);
A.recordEventSeen('anomaly','suspicious-lights',1);
assert.equal(A.hasSeenEvent('anomaly','suspicious-lights',1),true);
assert.equal(A.hasSeenEvent('anomaly','suspicious-lights',4),false);
A.recordEventSeen('chain','suspicious-lights',2);
assert.equal(A.hasSeenEvent('chain','suspicious-lights',2),true);
A.recordEventMissed('chain','suspicious-lights');
assert.equal(A.hasSeenEvent('chain','suspicious-lights',4),false);
A.recordEventSeen('chain','suspicious-lights',4);
assert.equal(A.hasSeenEvent('chain','suspicious-lights',4),true);
assert.equal(A.snapshot().eventStages['suspicious-lights'],4);
const reopened=load();
assert.equal(reopened.hasSeenEvent('chain','suspicious-lights',4),true,'Reload preserves finale');
assert.equal(reopened.hasSeenEvent('anomaly','suspicious-lights',4),true,'Shared stage identity');
assert.equal(reopened.hasSeenEvent('anomaly','mountain-moved'),false);
reopened.recordEventSeen('anomaly','mountain-moved',1);
assert.equal(reopened.hasSeenEvent('anomaly','mountain-moved',3),false);
reopened.recordEventSeen('chain','mountain-moved',2);
assert.equal(reopened.hasSeenEvent('chain','mountain-moved',3),false);
reopened.recordWeather('blizzard');
assert.equal(reopened.hasSeenWeather('blizzard'),true);
assert.equal(reopened.hasSeenLegendary(),true);
console.log('PASS: stage-aware discovery, missed-stage secrecy, persistent finale and weather prerequisites');
