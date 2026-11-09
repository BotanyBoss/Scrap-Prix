const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/dev.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert.equal(scripts.length,28);scripts.forEach(s=>new vm.Script(s));
const context=vm.createContext({console});for(const i of [0,2,7,8,9])vm.runInContext(scripts[i],context);const art=context.ScrapVehicleArt;
assert.equal(art.recipes.length,17);
let projections=0;
for(const recipe of art.recipes){const model={...art.DEFAULT,...recipe.requires};assert.equal(art.resolveForm(model).id,recipe.id);for(const slot of Object.keys(recipe.requires)){const alternative=art.OPTIONS[slot].find(o=>o.id!==model[slot]);assert.notEqual(art.resolveForm({...model,[slot]:alternative.id})?.id,recipe.id);}for(const view of ['garage','rear','side'])for(let phase=0;phase<4;phase++){const g=art.projected(model,view,phase);assert(g.faces.every(f=>f.pts.flat().every(Number.isFinite)));projections++;}}
assert.equal(art.resolveForm(art.fromLoadout({chassis:'needle-frame',engine:'reactor',tyres:'bone-wheels',gadget:'ram-plough'})).id,'fossil');
assert.equal(art.resolveForm(art.fromLoadout({chassis:'hauler',engine:'heavy-diesel',tyres:'steel-belt',gadget:'bolt-armour'})).id,'truck');
const s=scripts[20],start=s.indexOf('    function streetLots('),end=s.indexOf('    function drawStreetFrontage(',start);assert(start>=0&&end>start);const layout=vm.runInNewContext(s.slice(start,end)+';streetLots');
for(const side of [-1,1])for(const distance of [0,50,100,212.6999,212.7001,500]){const lots=layout(distance,side).sort((a,b)=>a.serial-b.serial),starts=lots.filter(x=>x.gap>0);for(const lot of lots){assert(lot.gap===0||(lot.gap>=4&&lot.gap<=7));assert(Math.abs(lot.far-lot.buildingNear-3.8)<1e-9);}for(let i=1;i<starts.length;i++)assert(starts[i].serial-starts[i-1].serial>=4&&starts[i].serial-starts[i-1].serial<=7);for(const lot of lots){const later=layout(distance+.001,side).find(x=>x.serial===lot.serial);if(later)assert(Math.abs(later.buildingNear-lot.buildingNear+.001)<1e-9);}}
console.log(`PASS: 27 scripts parse; 17 recipes and 68 near-matches; ${projections} finite projections; gameplay IDs; Street 4-7-house groups, varying gaps and movement continuity.`);
require("child_process").execFileSync(process.execPath,[path.join(__dirname,"..","scripts","gen-recipes.cjs"),"--check"],{stdio:"inherit"});
