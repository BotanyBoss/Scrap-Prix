/* Bundled in the DEV game alongside the original pipeline exporter. */
function createRaceFrames(){
  let assembly=null;
  const frames=new Map();
  return function frame(loadout,camera,wear){
    if(!Object.entries(Pipeline.choices).every(([slot,ids])=>ids.includes(loadout[slot])))return null;
    if(!assembly||Object.keys(Pipeline.choices).some(slot=>assembly.loadout[slot]!==loadout[slot])){
      assembly=Pipeline.assemble(loadout,assembly);
      frames.clear();
    }
    const key=camera+'/'+(wear||'clean');
    if(!frames.has(key))frames.set(key,softwareFrame(assembly,Pipeline.cameras[camera],wear));
    return frames.get(key);
  };
}
