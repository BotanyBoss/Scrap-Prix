// Seeded determinism + snapshot test for the rules engine.
// Run `node tests/determinism.cjs --update` only after an intentional gameplay change.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),snapshotPath=path.join(__dirname,'engine-snapshot.json');
const html=fs.readFileSync(path.join(root,'dist/dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const SEEDS=[1,20261017,424242,987654321];

function loadEngine(){
  const context=vm.createContext({console});context.globalThis=context;context.window=context;
  for(const i of [0,1,2,3])vm.runInContext(scripts[i],context);
  assert(context.ScrapEngine,'ScrapEngine did not load');
  return context.ScrapEngine;
}

function playRun(E,seed){
  let state=E.newRun(seed);const log=[];
  for(let guard=0;guard<100&&!state.finished;guard++){
    state=E.race(state,{});
    const last=state.history.at(-1);
    log.push(last);
    if(state.finished)break;
    state=E.continueRun(state);
  }
  assert(state.finished,`Run for seed ${seed} did not finish`);
  return{log,final:state};
}

const results={};
for(const seed of SEEDS){
  const a=playRun(loadEngine(),seed),b=playRun(loadEngine(),seed);
  const ja=JSON.stringify(a),jb=JSON.stringify(b);
  assert.equal(ja,jb,`Seed ${seed} is not deterministic across engine instances`);
  assert(a.log.length>1,"run too short");
  results[seed]=crypto.createHash('sha256').update(ja).digest('hex');
}

if(process.argv.includes('--update')){
  fs.writeFileSync(snapshotPath,JSON.stringify(results,null,2)+'\n');
  console.log('Snapshot updated.');
}else{
  const expected=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
  assert.deepEqual(results,expected,'Engine output changed. If intentional, run: node tests/determinism.cjs --update');
  console.log(`PASS: ${SEEDS.length} seeded runs are deterministic and match the stored snapshot.`);
}
