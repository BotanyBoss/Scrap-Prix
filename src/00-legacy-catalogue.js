
/* Small, deliberately data-driven roster. Numbers are provisional until humans play. */
(function (root, factory) {
  'use strict';
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.ScrapLegacyData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TUNING = Object.freeze({
    version: 2, startingCredits: 130, startingWrenches: 0,
    maxDurability: 100, repairAmount: 20, maxTier: 6, shopCount: 3,
    basePrize: 65, basePoints: 100, positionMultipliers: [2, 1.5, 1.25, 1, .75],
    historyLimit: 12
  });
  const SLOTS = ['engine', 'tyres', 'chassis', 'gadget'];
  const CRITICAL = ['engine', 'tyres', 'chassis'];
  const STAT_NAMES = { power: 'Power', grip: 'Grip', armour: 'Armour', cooling: 'Cooling' };
  const PARTS = [
    { id: 'stock-engine', slot: 'engine', name: 'Serviceable engine', price: 0, primary: 'power', note: 'Starts. Usually stays started.', stats: { power: 5, grip: 0, armour: 0, cooling: 0 } },
    { id: 'turbo', slot: 'engine', name: 'Junkyard turbo', price: 65, primary: 'power', note: 'Extra power. Some thermal indignity.', stats: { power: 9, grip: 0, armour: 0, cooling: -1 } },
    { id: 'rocket', slot: 'engine', name: 'Discount rocket', price: 100, primary: 'power', note: 'Power over common sense.', stats: { power: 13, grip: -1, armour: 0, cooling: -3 } },
    { id: 'stock-tyres', slot: 'tyres', name: 'Round-ish tyres', price: 0, primary: 'grip', note: 'Four vaguely circular reasons to continue.', stats: { power: 0, grip: 5, armour: 0, cooling: 0 } },
    { id: 'grippy', slot: 'tyres', name: 'Velcro tyres', price: 70, primary: 'grip', note: 'The road is coming with us.', stats: { power: -1, grip: 10, armour: 0, cooling: 0 } },
    { id: 'slicks', slot: 'tyres', name: 'Borrowed slicks', price: 60, primary: 'grip', note: 'Faster, mostly still round.', stats: { power: 3, grip: 6, armour: 0, cooling: 0 } },
    { id: 'stock-chassis', slot: 'chassis', name: 'Salvaged hatchback', price: 0, primary: 'armour', note: 'Almost legally recognisable.', stats: { power: 0, grip: 0, armour: 5, cooling: 0 } },
    { id: 'armoured', slot: 'chassis', name: 'Kitchen-sink armour', price: 60, primary: 'armour', note: 'Not built for cornering awards.', stats: { power: -2, grip: 0, armour: 11, cooling: 0 } },
    { id: 'lightweight', slot: 'chassis', name: 'Cardboard monocoque', price: 55, primary: 'armour', note: 'Extra light. The armour is not a typo.', stats: { power: 3, grip: 0, armour: 1, cooling: 0 } },
    { id: 'stock-gadget', slot: 'gadget', name: 'Desk fan', price: 0, primary: 'cooling', note: 'Bravely waves at the engine.', stats: { power: 0, grip: 0, armour: 0, cooling: 5 } },
    { id: 'cooler', slot: 'gadget', name: 'Industrial icebox', price: 65, primary: 'cooling', note: 'Prevents the engine becoming dinner.', stats: { power: 0, grip: 0, armour: 1, cooling: 11 } },
    { id: 'booster', slot: 'gadget', name: 'Emergency boost', price: 55, primary: 'power', note: 'Cooling was apparently optional.', stats: { power: 5, grip: 0, armour: 0, cooling: 1 } }
  ];
  // Every map retains a known signature hazard. Generated weather/wildcards vary.
  const TRACKS = [
    { id: 'straight', name: 'Abandoned Airstrip', blurb: 'Long straights. A light disregard for aviation law.', signature: 'crosswind', weights: { power: 2.7, grip: 1, armour: .4, cooling: .6 }, stress: 8, heat: 2 },
    { id: 'corners', name: 'Shopping Centre Slalom', blurb: 'Shopping trolleys are not aerodynamic.', signature: 'ducks', weights: { power: 1.1, grip: 2.7, armour: .5, cooling: .4 }, stress: 9, heat: 0 },
    { id: 'rubble', name: 'Demolition Diversion', blurb: 'The road has acquired new craters.', signature: 'meteor', weights: { power: 1.4, grip: 1.2, armour: 1.7, cooling: .4 }, stress: 13, heat: 0 },
    { id: 'heat', name: 'Very Warm Speedway', blurb: 'The forecast contains the word molten.', signature: 'heatwave', weights: { power: 1.8, grip: 1.2, armour: .4, cooling: 1.5 }, stress: 10, heat: 5 },
    { id: 'harbour', name: 'Harbour Hairpins', blurb: 'The sea is not an approved shortcut.', signature: 'flood', weights: { power: 1.5, grip: 2.1, armour: .9, cooling: .4 }, stress: 11, heat: 0 },
    { id: 'ring', name: 'Municipal Chaos Ring', blurb: 'The local wildlife has unionised.', signature: 'snail', weights: { power: 1.9, grip: 1.7, armour: .8, cooling: .6 }, stress: 10, heat: 1 }
  ];
  // No single stat is mandatory. All four contribute to hazard mitigation, with varying emphasis.
  const SIGNATURES = [
    { id: 'crosswind', title: 'Crosswind from nowhere', text: 'A gust tries to file your car under aircraft.', severity: 14, target: 'tyres', mitigation: { power: .36, grip: .57, armour: .22, cooling: .09 } },
    { id: 'ducks', title: 'Duck crossing', text: 'An unlicensed parade takes the racing line.', severity: 14, target: 'tyres', mitigation: { power: .3, grip: .62, armour: .3, cooling: .08 } },
    { id: 'meteor', title: 'Pothole from space', text: 'A meteor has a surprisingly accurate satnav.', severity: 17, target: 'chassis', mitigation: { power: .48, grip: .52, armour: .58, cooling: .08 } },
    { id: 'heatwave', title: 'Unexpected barbecue', text: 'Your engine bay is now a commercial oven.', severity: 16, target: 'engine', mitigation: { power: .2, grip: .19, armour: .25, cooling: .8 } },
    { id: 'flood', title: 'Unsanctioned swimming pool', text: 'The harbour has annexed a corner.', severity: 15, target: 'tyres', mitigation: { power: .39, grip: .62, armour: .26, cooling: .1 } },
    { id: 'snail', title: 'Extremely large snail', text: 'A fully original enormous gastropod wants right of way.', severity: 13, target: 'chassis', mitigation: { power: .55, grip: .5, armour: .34, cooling: .12 } }
  ];
  const WILDCARDS = [
    { id: 'tailwind', title: 'Suspicious tailwind', text: 'An aircraft assists your acceleration without asking.', score: 5, extraDamage: 0, credits: 0, target: 'engine' },
    { id: 'delivery', title: 'Misaddressed sponsorship', text: 'A sponsor pays the wrong team. We are not correcting it.', score: 0, extraDamage: 0, credits: 20, target: 'gadget' },
    { id: 'hail', title: 'Frozen pea storm', text: 'A freezer truck becomes an agricultural weapon.', score: -2, extraDamage: 4, credits: 0, target: 'chassis' },
    { id: 'shortcut', title: 'Wheelie-bin chicane', text: 'An optimistic shortcut is full of bins.', score: 3, extraDamage: 3, credits: 0, target: 'tyres' }
  ];
  const WEATHER = [
    { id: 'clear', name: 'Clear skies', wear: 0, heat: 0, score: 0 },
    { id: 'rain', name: 'Heavy rain', wear: 2, heat: -1, score: -1 },
    { id: 'dust', name: 'Dust storm', wear: 2, heat: 1, score: -1 },
    { id: 'hot', name: 'Heat haze', wear: 1, heat: 2, score: 0 },
    { id: 'cold', name: 'Cold snap', wear: 1, heat: -2, score: 0 }
  ];
  const APPROACHES = {
    careful: { name: 'Careful', power: -1, grip: 1, wear: .75, note: '-1 power, +1 grip, 25% less wear.' },
    balanced: { name: 'Balanced', power: 0, grip: 0, wear: 1, note: 'No stat or wear changes.' },
    reckless: { name: 'Reckless', power: 2, grip: -1, wear: 1.3, note: '+2 power, -1 grip, 30% more wear.' }
  };
  const RIVALS = [
    { name: 'Municipal Express', stats: { power: 6, grip: 6, armour: 5, cooling: 5 } },
    { name: 'Overdraft Racing', stats: { power: 9, grip: 5, armour: 4, cooling: 4 } },
    { name: 'Corner Office', stats: { power: 5, grip: 9, armour: 5, cooling: 5 } },
    { name: 'Warranty Void', stats: { power: 8, grip: 7, armour: 5, cooling: 6 } }
  ];
  return { TUNING, SLOTS, CRITICAL, STAT_NAMES, PARTS, TRACKS, SIGNATURES, WILDCARDS, WEATHER, APPROACHES, RIVALS };
});

