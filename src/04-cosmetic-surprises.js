

/* Cosmetic event surprises. Separate from the seeded GAMEPLAY RNG.
   Nothing in this module can change condition, rewards, event odds or results. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ScrapEventFlavour = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const surprises = Object.freeze({
    ducks: { headline: 'THE DUCKS HAVE UNIONISED', line: 'Negotiations at turn three have broken down.', visual: true },
    meteor: { headline: 'THE SKY HAS DECLARED WAR', line: 'Orbital debris demands right of way.', visual: true },
    snail: { headline: 'SNAIL CLAIMS THE FASTEST LAP', line: 'Race control refuses to provide supporting evidence.', visual: true },
    delivery: { headline: 'ACCOUNTING HAS LOST CONTROL', line: 'The wrong team got paid. Keep walking.', visual: true },
    oil: { headline: 'SOMEONE BUTTERED THE CIRCUIT', line: 'There are questions. Nobody is answering them.', visual: true },
    shortcut: { headline: 'THE BINS ARE REVOLTING', line: 'The shortcut is now municipal territory.', visual: true },
    debris: { headline: 'FREE SPARE PARTS, NO REFUNDS', line: 'The previous car has applied for early retirement.', visual: true },
    clearline: { headline: 'UNPRECEDENTED GOOD ROAD NEWS', line: 'Everyone has somehow remembered how lanes work.', visual: false },
    gravel: { headline: 'TRACK SURFACE SOLD SEPARATELY', line: 'The missing road is available as a premium upgrade.', visual: false },
    tailwind: { headline: 'WIND HAS PICKED A FAVOURITE', line: 'The laws of aerodynamics show blatant bias.', visual: false },
    crosswind: { headline: 'CAR APPLIES FOR PILOT LICENCE', line: 'The application was denied mid-corner.', visual: false },
    heatwave: { headline: 'ENGINE NOW MEDIUM-RARE', line: 'The pit crew requests barbecue sauce.', visual: false },
    flood: { headline: 'FISH DEMAND A RACE LICENCE', line: 'A carp has claimed the inside line.', visual: true },
    hail: { headline: 'WEATHER HAS BROUGHT FREEZER PEAS', line: 'The sponsor assures us these are locally sourced.', visual: false },
    'freak-hail': { headline: 'THE SKY IS THROWING ICE', line: 'The forecast has gone into witness protection.', visual: false },
    'cooling-shower': { headline: 'FREE CAR WASH INCLUDED', line: 'A welcome break for the engine, not the driver.', visual: false },
    'freak-dust': { headline: 'UNEXPECTED DELIVERY OF DESERT', line: 'A sandstorm appears to have the wrong postcode.', visual: false }
  });
  // Small independent hash, constant across browsers/Node; no game RNG used.
  function hash(text) {
    let n = 2166136261;
    for (let i = 0; i < text.length; i++) n = Math.imul(n ^ text.charCodeAt(i), 16777619);
    n ^= n >>> 16; n = Math.imul(n, 0x7feb352d); n ^= n >>> 15;
    n = Math.imul(n, 0x846ca68b); n ^= n >>> 16;
    return n >>> 0;
  }
  function pick(seed, race, lap, kind, id) {
    const entry = surprises[id];
    if (!entry) return { headline: null, line: null, rareText: false, rareVisual: false };
    const key = `${seed >>> 0}:${race}:${lap}:${kind}:${id}`;
    const rareText = hash(`headline:${key}`) / 4294967296 < .12;
    const rareVisual = !!entry.visual && hash(`art:${key}`) / 4294967296 < .035;
    return { headline: rareText ? entry.headline : null,
      line: rareText ? entry.line : null, rareText, rareVisual };
  }
  return { pick, hash, surprises };
});


