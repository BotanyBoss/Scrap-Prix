/* 3D garage integration contract: no gameplay change and lazy WebGL loading. */
(function test(){
  const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
  const html=fs.readFileSync(path.join(__dirname,'..','dist','dev.html'),'utf8');
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
  assert.equal(scripts.length,30);
  const runtime=vm.createContext({console,window:{}});
  vm.runInContext(scripts[28],runtime);
  const module=runtime.window.ScrapThreeGarage;
  assert(module&&typeof module.mount==='function'&&typeof module.dispose==='function');
  assert.equal(module.sourceVersion,'three@0.162.0');
  const shape=x=>JSON.parse(JSON.stringify(module.shapeHints(x)));
  const starter=shape({engine:'stock-engine',tyres:'stock-tyres',chassis:'stock-chassis',gadget:'stock-gadget'});
  assert.deepEqual(starter,{chassis:'standard',engine:'block',tyres:'normal',gadget:'fan'});
  const extreme=shape({engine:'rocket-drive',tyres:'monster-treads',chassis:'hauler',gadget:'rocket-pack'});
  assert.deepEqual(extreme,{chassis:'long',engine:'rocket',tyres:'large',gadget:'thrust'});
  const armour=shape({engine:'heavy-diesel',tyres:'speed-slicks',chassis:'carbon-lite',gadget:'bolt-armour'});
  assert.deepEqual(armour,{chassis:'light',engine:'heavy',tyres:'small',gadget:'defence'});
  assert.equal(module.parts(),null,'3D module must not mount or fetch anything at page load');
  module.dispose();assert.equal(module.parts(),null);
  const app=scripts[29];
  assert(app.includes('data-action="garage-3d"'),'Real garage must expose a toggle');
  assert(app.includes('window.ScrapThreeGarage.mount(canvas,{...state.loadout}'),'Render must use live installed parts');
  assert(app.includes("garageThreeEnabled=false"),'Legacy fallback must stay default');
  assert(app.includes("window.ScrapThreeGarage?.dispose()"),'Old WebGL scene must be disposed on rerender');
  assert(app.includes("3D preview unavailable. Original garage restored."),'Failure must restore the baseline');
  console.log('PASS: Three.js garage is opt-in and maps live four-slot loadouts without touching gameplay or fetching 3D on startup.');
})();
