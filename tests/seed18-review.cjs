const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({});context.window=context;
for(const name of [
 'src/02-catalogue.js','src/03-engine.js','src/04-cosmetic-surprises.js',
 'src/05-presentation.js','src/07-raster.js','src/08-gag-recipes.js',
 'src/09-vehicle-art.js','src/12-event-director.js',
 'src/30-race-manifest.js','src/31-race-director.js','src/32-ordinary-timeline.js',
 'previews/side-stage/race-fixture.js']){
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context,{filename:name});
}
const review=context.ScrapSeed18DebrisReview.load(18);
const reloaded=context.ScrapSeed18DebrisReview.load(18);
const shots=review.shots;
assert.equal(review.manifest.seed,18);
assert.equal(review.seed,18);
assert.equal(review.event.id,'debris');
assert.equal(review.result.race,1);
assert.equal(review.manifest.plannedLaps,5);
assert.equal(review.source.damage,review.event.damage);
assert.equal(JSON.stringify(review.source.damageBySlot),JSON.stringify(review.event.damageBySlot));
assert.equal(JSON.stringify(review.shots),JSON.stringify(reloaded.shots));
assert.equal(review.durationMs,shots.reduce((sum,shot)=>sum+shot.durationMs,0));
assert.equal(review.durationMs,shots.at(-1).endMs-shots[0].startMs);
assert.equal(review.clipStartMs,shots[0].startMs);
assert.equal(review.clipEndMs,shots.at(-1).endMs);
assert.equal(shots.map(s=>s.debris.phase).join(','),'anticipation,reaction,recovery');
assert.equal(shots.map(s=>s.camera).join(','),'front,side,side');
assert(shots.every(s=>s.source.id==='debris'&&s.debris.startMs===review.clipStartMs));
assert.equal(context.ScrapRaceDirector.sample(review.storyboard,review.clipStartMs).shot,shots[0]);
for(let i=0;i<shots.length;i++){
 const shot=shots[i],middle=shot.startMs+shot.durationMs/2;
 assert.equal(context.ScrapRaceDirector.sample(review.storyboard,middle).shot,shot);
}
const end=context.ScrapRaceDirector.sample(review.storyboard,review.clipEndMs-1).shot;
assert.equal(end,shots[2]);
assert.throws(()=>context.ScrapSeed18DebrisReview.load(19));
console.log('PASS factually seeded event review: 18, three clock-aligned shots, real damage and deterministic source');
