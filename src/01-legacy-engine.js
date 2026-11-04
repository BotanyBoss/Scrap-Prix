
/* Pure deterministic game rules. No UI, time, network or browser storage. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./legacy-data.js'));
  else root.ScrapLegacyEngine = factory(root.ScrapLegacyData);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (D) {
  'use strict';
  const { TUNING: T, SLOTS, CRITICAL, PARTS, TRACKS, SIGNATURES, WILDCARDS, WEATHER, APPROACHES, RIVALS } = D;
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const round = n => Math.round(n * 10) / 10;
  const part = id => PARTS.find(p => p.id === id);
  const track = id => TRACKS.find(t => t.id === id);
  const signature = id => SIGNATURES.find(e => e.id === id);
  const wildcard = id => WILDCARDS.find(e => e.id === id);
  const weather = id => WEATHER.find(w => w.id === id);
  function fail(s) { throw Error(s); }
  function integer(n, min, max, name) {
    if (!Number.isInteger(n) || n < min || n > max) fail('Invalid ' + name + '.');
  }
  function finite(n, min, max, name) {
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) fail('Invalid ' + name + '.');
  }
  // Mulberry32 generator. Stable across Node and browsers. Keep draws local to one event.
  function random(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function salted(seed, index, salt) {
    return random((seed ^ Math.imul((index + 1) >>> 0, 0x9E3779B1) ^ salt) >>> 0);
  }
  function shuffle(items, rng) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  // One authored map per block of six races, shuffled freshly every block.
  // Only conditions and combinations are procedural, never track geometry.
  function raceCard(seed, raceIndex) {
    integer(seed, 0, 4294967295, 'seed');
    integer(raceIndex, 0, 9999999, 'race index');
    const cycle = Math.floor(raceIndex / TRACKS.length);
    const ids = shuffle(TRACKS.map(t => t.id), salted(seed, cycle, 0x431B0091));
    const t = track(ids[raceIndex % TRACKS.length]);
    const rng = salted(seed, raceIndex, 0xA13C5D71);
    const w = WEATHER[Math.floor(rng() * WEATHER.length)];
    const wild = rng() < .65 ? WILDCARDS[Math.floor(rng() * WILDCARDS.length)] : null;
    return { trackId: t.id, signatureId: t.signature, weatherId: w.id, wildcardId: wild ? wild.id : null };
  }
  function shopOffers(s) {
    const rng = salted(s.seed, s.raceIndex, 0x5A0B2026);
    const slots = shuffle(SLOTS, rng).slice(0, T.shopCount);
    return slots.filter(slot => s.levels[slot] < T.maxTier).map(slot => {
      const options = PARTS.filter(p => p.slot === slot && p.price > 0);
      const item = options[Math.floor(rng() * options.length)];
      const tier = s.levels[slot] + 1;
      return { id: item.id, slot, tier, price: upgradePrice(item, tier) };
    });
  }
  function upgradePrice(item, tier) {
    integer(tier, 1, T.maxTier, 'upgrade tier');
    return item.price + (tier - 1) * 38 + (tier - 1) * (tier - 1) * 13;
  }
  function newRun(seed = 20261017) {
    integer(seed, 0, 4294967295, 'seed');
    const loadout = Object.fromEntries(SLOTS.map(slot => [slot, PARTS.find(p => p.slot === slot && p.price === 0).id]));
    return {
      version: T.version, seed, phase: 'garage', finished: null, raceIndex: 0,
      credits: T.startingCredits, wrenches: T.startingWrenches, points: 0,
      approach: 'balanced', loadout,
      levels: Object.fromEntries(SLOTS.map(slot => [slot, 0])),
      durability: Object.fromEntries(SLOTS.map(slot => [slot, T.maxDurability])),
      repairs: Object.fromEntries(SLOTS.map(slot => [slot, 0])),
      purchasedSlots: [], history: []
    };
  }
  function garage(s) {
    if (s.phase !== 'garage' || s.finished) fail('Return to a working garage before changing your car.');
  }
  function stats(s) {
    const result = { power: 0, grip: 0, armour: 0, cooling: 0 };
    for (const slot of SLOTS) {
      // A wrecked gadget is harmless and does not provide stats. Other zeroes end the run.
      if (s.durability[slot] === 0) continue;
      const item = part(s.loadout[slot]);
      if (!item || item.slot !== slot) fail('Unknown installed part.');
      for (const key of Object.keys(result)) result[key] += item.stats[key];
      // Replacing a component with a higher-tier version is a genuine, small stat upgrade.
      result[item.primary] += Math.min(5, Math.max(0, s.levels[slot] - 1));
    }
    for (const key of Object.keys(result)) result[key] = Math.max(0, result[key]);
    return result;
  }
  function effectiveStats(s) {
    const st = stats(s), a = APPROACHES[s.approach];
    st.power = Math.max(0, st.power + a.power);
    st.grip = Math.max(0, st.grip + a.grip);
    return st;
  }
  function buy(s, id) {
    garage(s);
    const item = part(id);
    if (!item || !item.price) fail('This upgrade does not exist.');
    const offer = shopOffers(s).find(o => o.id === id);
    if (!offer) fail('That component is not offered in this workshop.');
    if (s.purchasedSlots.includes(item.slot)) fail('You already replaced that slot at this stop.');
    if (s.credits < offer.price) fail('Not enough money for that upgrade.');
    const next = clone(s);
    next.credits -= offer.price;
    next.loadout[item.slot] = item.id;
    next.levels[item.slot] = offer.tier;
    next.durability[item.slot] = T.maxDurability;
    next.repairs[item.slot] = 0;
    next.purchasedSlots.push(item.slot);
    return next;
  }
  function setApproach(s, id) {
    garage(s);
    if (!Object.hasOwn(APPROACHES, id)) fail('Unknown driving approach.');
    return { ...clone(s), approach: id };
  }
  function repairQuote(s, slot) {
    if (!SLOTS.includes(slot)) fail('Unknown component slot.');
    const amount = Math.min(T.repairAmount, T.maxDurability - s.durability[slot]);
    return { amount, cost: amount ? s.repairs[slot] + 1 : 0 };
  }
  function repair(s, slot) {
    garage(s);
    const q = repairQuote(s, slot);
    if (!q.amount) fail('That component is already fully repaired.');
    if (s.wrenches < q.cost) fail('Not enough wrenches.');
    const next = clone(s);
    next.wrenches -= q.cost;
    next.durability[slot] += q.amount;
    next.repairs[slot]++;
    return next;
  }
  function performance(st, weights) {
    return Object.entries(weights).reduce((v, [key, weight]) => v + st[key] * weight, 0);
  }
  // Allocate an integer wear total across four slots without losing or duplicating damage.
  function distributeDamage(total, weights) {
    const sum = SLOTS.reduce((v, slot) => v + weights[slot], 0);
    const actual = {};
    let used = 0;
    const fractions = SLOTS.map(slot => {
      const raw = total * weights[slot] / sum;
      const amount = Math.floor(raw);
      actual[slot] = amount; used += amount;
      return { slot, fraction: raw - amount };
    }).sort((a, b) => b.fraction - a.fraction || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
    for (let i = 0; i < total - used; i++) actual[fractions[i].slot]++;
    return actual;
  }
  function strongestMitigation(sig, st) {
    return Object.entries(sig.mitigation).sort((a, b) => st[b[0]] * b[1] - st[a[0]] * a[1])[0][0];
  }
  function race(s) {
    garage(s);
    if (CRITICAL.some(slot => s.durability[slot] <= 0)) fail('A destroyed critical component cannot race.');
    const next = clone(s), card = raceCard(s.seed, s.raceIndex);
    const t = track(card.trackId), sig = signature(card.signatureId);
    const w = weather(card.weatherId), wild = wildcard(card.wildcardId);
    const st = effectiveStats(s);
    const rng = salted(s.seed, s.raceIndex, 0xF4112026);
    const heat = Math.max(0, st.power - st.cooling - 5 + t.heat + w.heat);
    const conditionPenalty = round(CRITICAL.reduce((v, slot) => v + 100 - s.durability[slot], 0) / 23);
    const heatPenalty = round(heat * .65);
    const mitigation = Object.entries(sig.mitigation).reduce((v, [key, coefficient]) => v + coefficient * st[key], 0);
    const hazardDamage = Math.max(1, Math.round(sig.severity + Math.floor(rng() * 5) - mitigation));
    const trackWear = Math.max(2, 4 + Math.round(t.stress / 3) + w.wear - Math.round(st.armour * .18));
    const rawDamage = Math.max(1, Math.round((trackWear + hazardDamage + (wild?.extraDamage || 0) + heat * .4) * APPROACHES[s.approach].wear));
    // Build identity changes which parts take the wear. Target weighting remains soft.
    const weights = {
      engine: 1.2 + heat * .12,
      tyres: 1.2 + st.power * .12 + st.grip * .025,
      chassis: 1.2 + st.armour * .14,
      gadget: s.durability.gadget > 0 ? .65 + heat * .025 : 0
    };
    weights[sig.target] += 1.7;
    if (wild) weights[wild.target] += .55;
    const allocation = distributeDamage(rawDamage, weights);
    const before = { ...s.durability }, damageBySlot = {};
    for (const slot of SLOTS) {
      next.durability[slot] = Math.max(0, before[slot] - allocation[slot]);
      damageBySlot[slot] = before[slot] - next.durability[slot];
    }
    const damage = SLOTS.reduce((v, slot) => v + damageBySlot[slot], 0);
    const failedSlot = CRITICAL.find(slot => next.durability[slot] === 0) || null;
    const fortune = round((rng() - .5) * 6);
    const base = round(performance(st, t.weights));
    const score = round(base - conditionPenalty - heatPenalty + w.score + (wild?.score || 0) - hazardDamage * .3 + fortune);
    const standings = [{ name: 'Your contraption', score, player: true, tie: 0 },
      ...RIVALS.map((r, i) => ({ name: r.name, player: false,
        score: round(performance(r.stats, t.weights) + (rng() - .5) * 7), tie: i + 1 }))]
      .sort((a, b) => b.score - a.score || a.tie - b.tie);
    let place = standings.findIndex(r => r.player) + 1;
    if (failedSlot) {
      const yours = standings.splice(place - 1, 1)[0];
      standings.push(yours);
      place = standings.length;
    }
    // Score and cash are awarded for both position and protecting the car.
    const positionMultiplier = T.positionMultipliers[place - 1];
    const cleanMultiplier = damage <= 8 ? 1.5 : damage <= 16 ? 1.25 : 1;
    const prize = failedSlot ? 0 : Math.round(T.basePrize * positionMultiplier * cleanMultiplier) + (wild?.credits || 0);
    const pointsEarned = failedSlot ? 0 : Math.round(T.basePoints * positionMultiplier * cleanMultiplier);
    // Drops grow rarer, but never reach zero. No position-dependent wrench advantage.
    const dropChance = Math.max(.14, .8 - s.raceIndex * .025);
    const wrenchDrop = failedSlot || rng() >= dropChance ? 0 : (rng() < .13 ? 3 : rng() < .34 ? 2 : 1);
    const result = {
      race: s.raceIndex + 1, ...card, approach: s.approach, method: strongestMitigation(sig, st),
      stats: st, base, conditionPenalty, heatPenalty, fortune, score, hazardDamage,
      damage, damageBySlot, durabilityBefore: before, durabilityAfter: { ...next.durability },
      failedSlot, place, positionMultiplier, cleanMultiplier, prize, pointsEarned, wrenchDrop,
      standings: standings.map(({ name, score: resultScore, player }) => ({ name, score: resultScore, player }))
    };
    next.raceIndex++;
    next.credits += prize;
    next.wrenches += wrenchDrop;
    next.points += pointsEarned;
    next.history.push(result);
    next.history = next.history.slice(-T.historyLimit);
    next.phase = 'result';
    next.finished = failedSlot ? 'wrecked' : null;
    next.purchasedSlots = [];
    return next;
  }
  function continueRun(s) {
    if (s.phase !== 'result' || s.finished) fail('There is no next race in this run.');
    return { ...clone(s), phase: 'garage' };
  }
  // Save validation intentionally reconstitutes every field; arbitrary imported HTML is ignored.
  function validateSave(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Save must be an object.');
    if (input.version !== T.version) fail('Old or unsupported save version. Milestone 01 saves are kept separately.');
    integer(input.seed, 0, 4294967295, 'seed');
    integer(input.raceIndex, 0, 9999999, 'race index');
    integer(input.credits, 0, 1000000000, 'credits');
    integer(input.wrenches, 0, 1000000000, 'wrenches');
    integer(input.points, 0, 1000000000, 'high score');
    if (!['garage', 'result'].includes(input.phase)) fail('Invalid game phase.');
    if (![null, 'wrecked'].includes(input.finished)) fail('Invalid ending.');
    if (!Object.hasOwn(APPROACHES, input.approach)) fail('Invalid driving approach.');
    if (!input.loadout || !input.levels || !input.repairs || !input.durability) fail('Missing component records.');
    const loadout = {}, levels = {}, repairs = {}, durability = {};
    for (const slot of SLOTS) {
      const id = input.loadout[slot], item = part(id);
      if (!item || item.slot !== slot) fail('Invalid fitted part in ' + slot + '.');
      integer(input.levels[slot], 0, T.maxTier, 'tier');
      if ((input.levels[slot] === 0) !== (item.price === 0)) fail('Invalid tier for ' + slot + '.');
      integer(input.repairs[slot], 0, 100000, 'repair count');
      integer(input.durability[slot], 0, 100, 'durability');
      loadout[slot] = id; levels[slot] = input.levels[slot];
      repairs[slot] = input.repairs[slot]; durability[slot] = input.durability[slot];
    }
    const purchasedSlots = input.purchasedSlots;
    if (!Array.isArray(purchasedSlots) || purchasedSlots.length > T.shopCount || new Set(purchasedSlots).size !== purchasedSlots.length || purchasedSlots.some(slot => !SLOTS.includes(slot))) fail('Invalid shop purchases.');
    if (input.phase === 'result' && purchasedSlots.length) fail('Purchase record is inconsistent.');
    const anyCriticalDead = CRITICAL.some(slot => durability[slot] === 0);
    if ((input.finished === 'wrecked') !== anyCriticalDead || (input.finished && input.phase !== 'result')) fail('Inconsistent wreck status.');
    if (!Array.isArray(input.history) || input.history.length > T.historyLimit || input.history.length > input.raceIndex) fail('Invalid race history.');
    if (input.phase === 'result' && !input.history.length) fail('A race report is missing.');
    if (input.raceIndex > 0 && !input.history.length) fail('Missing latest race report.');
    const history = input.history.map((r, i) => {
      if (!r || typeof r !== 'object') fail('Invalid race report.');
      integer(r.race, Math.max(1, input.raceIndex - T.historyLimit + 1), input.raceIndex, 'record race');
      const expectedRace = input.raceIndex - input.history.length + i + 1;
      const card = raceCard(input.seed, expectedRace - 1);
      if (r.race !== expectedRace || r.trackId !== card.trackId || r.signatureId !== card.signatureId || r.weatherId !== card.weatherId || r.wildcardId !== card.wildcardId) fail('A race record does not match the seed.');
      if (!Object.hasOwn(APPROACHES, r.approach) || !Object.hasOwn(D.STAT_NAMES, r.method)) fail('Invalid race approach or mitigation.');
      for (const key of ['base','conditionPenalty','heatPenalty','fortune','score']) finite(r[key], -10000, 10000, key);
      for (const key of ['hazardDamage','damage','place','prize','pointsEarned','wrenchDrop']) integer(r[key], 0, 1000000000, key);
      if (r.hazardDamage > 1000 || r.damage > 400 || r.place < 1 || r.place > 5 || r.wrenchDrop > 3) fail('Invalid race damage or placing.');
      finite(r.positionMultiplier, 0, 10, 'position multiplier');
      finite(r.cleanMultiplier, 1, 2, 'clean multiplier');
      if (r.positionMultiplier !== T.positionMultipliers[r.place - 1] || ![1, 1.25, 1.5].includes(r.cleanMultiplier)) fail('Invalid multipliers.');
      if (r.failedSlot !== null && !CRITICAL.includes(r.failedSlot)) fail('Invalid failure reason.');
      const statsRecord = {}, damageBySlot = {}, durabilityBefore = {}, durabilityAfter = {};
      for (const key of Object.keys(D.STAT_NAMES)) {
        integer(r.stats?.[key], 0, 1000, 'race stat'); statsRecord[key] = r.stats[key];
      }
      for (const slot of SLOTS) {
        integer(r.damageBySlot?.[slot], 0, 100, 'part damage');
        integer(r.durabilityBefore?.[slot], 0, 100, 'part condition');
        integer(r.durabilityAfter?.[slot], 0, 100, 'part condition');
        if (r.durabilityAfter[slot] !== r.durabilityBefore[slot] - r.damageBySlot[slot]) fail('Inconsistent part damage.');
        damageBySlot[slot] = r.damageBySlot[slot];
        durabilityBefore[slot] = r.durabilityBefore[slot];
        durabilityAfter[slot] = r.durabilityAfter[slot];
      }
      if (SLOTS.reduce((sum, slot) => sum + damageBySlot[slot], 0) !== r.damage) fail('Inconsistent total damage.');
      if ((CRITICAL.find(slot => durabilityAfter[slot] === 0) || null) !== r.failedSlot) fail('Inconsistent failure reason.');
      if (r.failedSlot && (r.place !== 5 || r.prize !== 0 || r.pointsEarned !== 0 || r.wrenchDrop !== 0)) fail('Wrecked car received a reward.');
      if (!r.failedSlot && (r.pointsEarned !== Math.round(T.basePoints * r.positionMultiplier * r.cleanMultiplier) || r.prize !== Math.round(T.basePrize * r.positionMultiplier * r.cleanMultiplier) + (wildcard(r.wildcardId)?.credits || 0))) fail('Inconsistent race earnings.');
      if ((r.damage <= 8 ? 1.5 : r.damage <= 16 ? 1.25 : 1) !== r.cleanMultiplier) fail('Inconsistent condition bonus.');
      if (!Array.isArray(r.standings) || r.standings.length !== 5 || r.standings.filter(x => x?.player === true).length !== 1) fail('Invalid race standings.');
      const names = ['Your contraption', ...RIVALS.map(o => o.name)];
      const standings = r.standings.map(x => {
        if (!x || !names.includes(x.name) || typeof x.player !== 'boolean' || x.player !== (x.name === 'Your contraption')) fail('Invalid race entrant.');
        finite(x.score, -10000, 10000, 'rival score');
        return { name: x.name, player: x.player, score: x.score };
      });
      if (new Set(standings.map(x => x.name)).size !== 5 || !standings[r.place - 1].player || standings[r.place - 1].score !== r.score) fail('Race position inconsistent.');
      return { race: r.race, ...card, approach: r.approach, method: r.method, stats: statsRecord,
        base: r.base, conditionPenalty: r.conditionPenalty, heatPenalty: r.heatPenalty,
        fortune: r.fortune, score: r.score, hazardDamage: r.hazardDamage,
        damage: r.damage, damageBySlot, durabilityBefore, durabilityAfter,
        failedSlot: r.failedSlot, place: r.place, positionMultiplier: r.positionMultiplier,
        cleanMultiplier: r.cleanMultiplier, prize: r.prize, pointsEarned: r.pointsEarned,
        wrenchDrop: r.wrenchDrop, standings };
    });
    if (history.length && history.at(-1).race !== input.raceIndex) fail('Missing last race.');
    if (history.length && history.slice(0, -1).some(r => r.failedSlot)) fail('Races cannot continue after a wreck.');
    if (input.phase === 'result' && history.length && history.at(-1).failedSlot !== (input.finished ? history.at(-1).failedSlot : null)) fail('Last race ending inconsistent.');
    // Only the latest report must match current durability: workshop repairs may happen between earlier races.
    if (input.phase === 'result' && SLOTS.some(slot => history.at(-1).durabilityAfter[slot] !== durability[slot])) fail('Race result does not match current car.');
    return { version: T.version, seed: input.seed, phase: input.phase, finished: input.finished,
      raceIndex: input.raceIndex, credits: input.credits, wrenches: input.wrenches,
      points: input.points, approach: input.approach, loadout, levels, repairs, durability,
      purchasedSlots: [...purchasedSlots], history };
  }
  function encodeSave(s) { return JSON.stringify(validateSave(s), null, 2); }
  function decodeSave(text) {
    if (typeof text !== 'string' || text.length > 200000) fail('Save file exceeds 200 KB or is not text.');
    let value;
    try { value = JSON.parse(text); } catch (_) { fail('This is not valid JSON.'); }
    return validateSave(value);
  }
  return { newRun, random, raceCard, shopOffers, upgradePrice, part, track, signature, wildcard, weather,
    stats, effectiveStats, buy, setApproach, repairQuote, repair, race, continueRun,
    validateSave, encodeSave, decodeSave };
});

