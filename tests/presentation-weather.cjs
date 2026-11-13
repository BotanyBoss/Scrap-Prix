// Presentation-only regression: HUD weather must reflect every event that changes weather.
// Execute with: node tests/presentation-weather.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const scripts=['src/02-catalogue.js','src/03-engine.js','src/04-cosmetic-surprises.js','src/05-presentation.js'];
const scope=vm.createContext({console});
for(const file of scripts)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),scope,{filename:file});
const P=scope.ScrapPresentation;
const before={seed:155,raceIndex:0};
function stepWeather(eventsByLap){
  const laps=eventsByLap.map((effects,i)=>({lap:i+1,weatherId:'clear',effects:[{kind:'wear',damage:1},...effects.map((e,j)=>({key:j?'late':'opening',damage:2,scoreDelta:-1,credits:0,...e}))]}));
  const result={rulesVersion:16,race:1,weatherId:'clear',lapCount:laps.length,laps,failedSlot:null,failureLap:null,place:3,prize:60,pointsEarned:100,wrenchDrop:1};
  const replay=P.createReplay(before,{seed:155,raceIndex:1,history:[result]});
  return replay.steps.filter(s=>s.sourceId);
}
const event=(id,kind='optional',extra={})=>({id,kind,...extra});
const changed=stepWeather([
  [event('torrential-downpour'),event('pothole-chain')],
  [event('storm-front','chain',{stage:2})],
  [event('heatwave-event')]
]);
assert.deepEqual(changed.map(s=>s.sourceId),['torrential-downpour','pothole-chain','storm-front','heatwave-event']);
assert.deepEqual(changed.map(s=>s.weatherId),['rain','rain','rain','hot'],'event weather must persist for the rest of its lap');
assert.equal(stepWeather([[event('pothole-chain')]])[0].weatherId,'clear','unaffected events must preserve base weather');
assert.deepEqual(stepWeather([[event('torrential-downpour')],[event('pothole-chain')]]).map(s=>s.weatherId),['rain','clear'],'event weather should not leak into the next lap');
assert.equal(changed[0].copy.includes('water-delivery system'),true,'event narration must remain intact');
console.log('PASS: event and chain weather HUD, same-lap carry, next-lap reset, untouched narration');
