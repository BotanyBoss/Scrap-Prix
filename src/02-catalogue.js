
/* Scrap Prix v0.7.9 Event Restoration: final 40-part catalogue, Lv1-10 progression,
   course + surface environments, economy v1.1 and Event Waves 1-5. */
(function (root, factory) {
  'use strict';
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.ScrapData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TUNING = Object.freeze({
    version: 21,
    startingCredits: 130, startingWrenches: 0,
    maxDurability: 100, repairAmount: 20,
    maxLevel: 10, maxTier: 10, shopCount: 3, maxShopRefreshes: 1,
    marketCadence: 4,
    basePrize: 60, basePoints: 100,
    positionMultipliers: [2, 1.5, 1.25, 1, .75],
    historyLimit: 16,
    baseWeight: 18,
    wrenchDropStart: .80, wrenchDropDecay: .022, wrenchDropFloor: .20,
    gagAffinityPerRace: .001, gagAffinityCap: .05,
    postCapStressPerRace: .024, postCapRivalPerRace: .007,
    passEventChance: .09, fakePassChance: .025
  });
  const SLOTS = ['engine', 'tyres', 'chassis', 'gadget'];
  const CRITICAL = ['engine', 'tyres', 'chassis'];
  const STAT_NAMES = { power: 'Power', grip: 'Grip', armour: 'Armour', cooling: 'Cooling' };

  const part = (id,slot,name,weight,visual,note,stats,traits={}) => ({
    id,slot,name,price:id.startsWith('stock-')?0:70,weight,visual,note,stats,traits,
    primary:Object.entries(stats).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1])[0]?.[0]||'power',
    secondary:Object.entries(stats).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1])[1]?.[0]||null,
    generation:id.startsWith('stock-')?0:1,
    featured:id.startsWith('stock-')?[0,0]:[1,10]
  });

  const PARTS = [
    // Engines
    part('stock-engine','engine','Serviceable Engine',4,'stock','Starts. Usually stays started.',{power:5,grip:0,armour:0,cooling:0}),
    part('clunker','engine','Clunker Motor',5,'stock','Low output, cool-running and stubbornly difficult to offend.',{power:6,grip:0,armour:0,cooling:5}),
    part('boiler','engine','Steam Boiler',10,'stack','Pressure, torque and several nineteenth-century objections.',{power:10,grip:0,armour:2,cooling:-1},{torque:.65}),
    part('v8','engine','Exposed V8',8,'exhaust','Big uncomplicated power with the subtlety removed.',{power:11,grip:0,armour:0,cooling:-1}),
    part('race-block','engine','Race Block',5,'exhaust','Light, sharp and deeply unhappy away from prepared roads.',{power:9,grip:2,armour:0,cooling:0},{roughPowerPenalty:.16}),
    part('rocket-drive','engine','Rocket Drivetrain',8,'rocket','Maximum thrust. Minimum committee oversight.',{power:13,grip:-1,armour:0,cooling:-2},{loosePowerPenalty:.20}),
    part('twin-cylinder','engine','Twin Cylinder',4,'twin','Light, responsive and surprisingly civilised.',{power:7,grip:2,armour:0,cooling:2}),
    part('inline-four','engine','Inline Four',5,'stock','A sensible engine accidentally invited to this game.',{power:7,grip:1,armour:0,cooling:4}),
    part('reactor','engine','Reactor',9,'reactor','A tiny sun. The warranty has achieved escape velocity.',{power:12,grip:0,armour:1,cooling:-1}),
    part('heavy-diesel','engine','Heavy Diesel',10,'stack','Torque, endurance and absolutely no hurry to explain itself.',{power:9,grip:0,armour:3,cooling:2},{torque:1}),

    // Tyres
    part('stock-tyres','tyres','Round-ish Tyres',4,'stock','Four vaguely circular reasons to continue.',{power:0,grip:5,armour:0,cooling:0}),
    part('scrap-racer','tyres','Scrap Racer Wheels',4,'stock','Dependable road rubber assembled from several previous mistakes.',{power:0,grip:7,armour:1,cooling:0}),
    part('skinny-spokes','tyres','Skinny Spokes',2,'slick','Very little wheel. Very much optimism.',{power:3,grip:5,armour:0,cooling:0},{roughGripPenalty:.22,roughDamage:.20}),
    part('monster-treads','tyres','Monster Treads',8,'wide','The terrain can complain after you leave.',{power:-1,grip:10,armour:2,cooling:0},{looseGripBonus:.20}),
    part('balloon-tyres','tyres','Balloon Tyres',6,'wide','Large soft footprints for surfaces with commitment issues.',{power:-1,grip:8,armour:2,cooling:0},{softGripBonus:.15,softWeightReduction:.20}),
    part('speed-slicks','tyres','Speed Slicks',3,'slick','Phenomenal until weather becomes involved.',{power:2,grip:8,armour:0,cooling:0},{drySmoothGripBonus:.15,wetGripPenalty:.30,looseGripPenalty:.25}),
    part('bone-wheels','tyres','Bone Wheels',4,'wide','Skeletal structure, chunky ribs and several unanswered questions.',{power:2,grip:6,armour:2,cooling:0}),
    part('rail-wheels','tyres','Rail Wheels',7,'groove','Flanged steel wheels for people who consider steering optional.',{power:4,grip:4,armour:3,cooling:0},{straightEfficiency:.15,cornerGripPenalty:.25}),
    part('track-rollers','tyres','Track Rollers',10,'tread','Industrial rollers. Smooth-road etiquette not included.',{power:-2,grip:10,armour:4,cooling:0},{looseGripBonus:.20,roughDamageReduction:.15,smoothPowerPenalty:.10}),
    part('steel-belt','tyres','Steel-belt Survival',8,'groove','The tyres may outlive the vehicle and several governments.',{power:0,grip:7,armour:5,cooling:0},{roughDamageReduction:.30}),

    // Chassis
    part('stock-chassis','chassis','Salvaged GT',8,'stock','The balanced starting point. It even has doors.',{power:0,grip:1,armour:5,cooling:0},{bodyFamily:'gt'}),
    part('soapbox','chassis','Soapbox Frame',3,'light','Extremely light. Protection sold separately.',{power:0,grip:5,armour:1,cooling:0},{bodyFamily:'formula',roughMomentumPenalty:.18}),
    part('needle-frame','chassis','Needle Frame',5,'light','Long, narrow and designed around the phrase faster is a direction.',{power:4,grip:2,armour:1,cooling:0},{bodyFamily:'formula',roughMomentumPenalty:.13}),
    part('boilerplate','chassis','Boilerplate Chassis',11,'armour','A rolling argument in favour of thicker steel.',{power:0,grip:0,armour:8,cooling:1},{bodyFamily:'monster',roughMomentumBonus:.12}),
    part('wobble-wagon','chassis','Wobble Wagon',10,'cage','Rugged, crooked and suspiciously comfortable with bad roads.',{power:0,grip:2,armour:6,cooling:2},{bodyFamily:'gt',roughMomentumBonus:.10}),
    part('longbody','chassis','Longbody Frame',9,'cage','Stable at speed with enough structure to remain one car.',{power:2,grip:3,armour:5,cooling:0},{bodyFamily:'gt'}),
    part('hauler','chassis','Hauler Frame',13,'armour','Commercial-grade structure for transporting bad decisions.',{power:1,grip:0,armour:8,cooling:1},{bodyFamily:'monster',roughMomentumBonus:.15}),
    part('armoured-tub','chassis','Armoured Tub',14,'armour','Low-sided armour with all the grace of municipal infrastructure.',{power:0,grip:1,armour:10,cooling:0},{bodyFamily:'monster',roughMomentumBonus:.18}),
    part('aero-pod','chassis','Aero Pod Frame',6,'wing','Low, wide and happiest when the road behaves itself.',{power:2,grip:4,armour:2,cooling:1},{bodyFamily:'formula',roughMomentumPenalty:.14}),
    part('carbon-lite','chassis','Carbon-Lite Monocoque',5,'cage','Precision engineering wrapped around a worrying shortage of metal.',{power:3,grip:4,armour:2,cooling:0},{bodyFamily:'formula',roughMomentumPenalty:.16}),

    // Gadgets
    part('stock-gadget','gadget','Desk Fan',2,'stock','Bravely waves at the engine.',{power:0,grip:0,armour:0,cooling:5}),
    part('cooling-fan','gadget','Cooling Fan',4,'fan','Serious airflow for unserious machinery.',{power:0,grip:0,armour:0,cooling:9}),
    part('rocket-pack','gadget','Rocket Pack',5,'thruster','Adds thrust and subtracts adult supervision.',{power:7,grip:-1,armour:0,cooling:-2}),
    part('ram-plough','gadget','Ram Plough',7,'tank','A wide answer to problems located directly ahead.',{power:0,grip:0,armour:7,cooling:0},{obstacleDamageReduction:.30}),
    part('exhaust-array','gadget','Exhaust Array',4,'fins','Six pipes helping power and heat leave in roughly the same direction.',{power:4,grip:0,armour:0,cooling:5}),
    part('aero-kit','gadget','Aero Kit',3,'fins','Downforce for surfaces civilised enough to deserve it.',{power:1,grip:4,armour:0,cooling:0},{smoothGripBonus:.20}),
    part('tubular-brace','gadget','Tubular Brace',5,'fins','A structural opinion expressed through several tubes.',{power:0,grip:4,armour:5,cooling:0}),
    part('bolt-armour','gadget','Bolt-on Armour',8,'tank','If the car is heavier than the collision, the collision loses.',{power:-1,grip:0,armour:9,cooling:0}),
    part('stability-fins','gadget','Stability Fins',4,'fins','Two fins with strong feelings about sideways motion.',{power:0,grip:4,armour:1,cooling:2},{windReduction:.40}),
    part('impact-foam','gadget','Impact Foam Canister',5,'tank','One emergency cloud of extremely committed cushioning.',{power:0,grip:0,armour:6,cooling:2},{firstMajorImpactReduction:.50})
  ];

  const GENERATIONS = Object.freeze([{mark:1,min:1,max:10}]);

  const SURFACES = Object.freeze([
    {id:'smooth',name:'Smooth Tarmac',traction:0,roughness:0,softness:0,tyreStress:1,scene:'straight'},
    {id:'cracked',name:'Cracked Tarmac',traction:1,roughness:2,softness:0,tyreStress:2,scene:'ring'},
    {id:'gravel',name:'Gravel',traction:2,roughness:2,softness:1,tyreStress:3,scene:'ring'},
    {id:'dirt',name:'Dirt',traction:2,roughness:2,softness:2,tyreStress:2,scene:'ring'},
    {id:'mud',name:'Mud',traction:4,roughness:2,softness:4,tyreStress:3,scene:'harbour'},
    {id:'sand',name:'Sand',traction:4,roughness:1,softness:5,tyreStress:2,scene:'heat'},
    {id:'snow',name:'Packed Snow',traction:4,roughness:1,softness:3,tyreStress:2,scene:'straight'},
    {id:'ice',name:'Ice',traction:5,roughness:0,softness:0,tyreStress:1,scene:'straight'},
    {id:'broken',name:'Broken Concrete',traction:2,roughness:5,softness:0,tyreStress:5,scene:'rubble'}
  ]);

  const TRACKS = Object.freeze([
    {id:'airstrip',name:'Abandoned Airstrip',blurb:'Long straights. A light disregard for aviation law.',signature:'crosswind',scene:'straight',course:{straight:5,cornering:1,acceleration:2,endurance:2,impact:1},surfaceWeights:{smooth:72,cracked:28}},
    {id:'f1',name:'F1 Circuit',blurb:'Fast corners, smooth asphalt and nowhere to hide a sofa.',signature:'chicane',scene:'corners',course:{straight:4,cornering:5,acceleration:3,endurance:3,impact:1},surfaceWeights:{smooth:88,cracked:12}},
    {id:'street',name:'Street Circuit',blurb:'Tight corners between things somebody still owns.',signature:'pileup',scene:'corners',course:{straight:2,cornering:5,acceleration:5,endurance:3,impact:3},surfaceWeights:{smooth:55,cracked:45}},
    {id:'oval',name:'Municipal Speedway',blurb:'Turn left repeatedly until engineering becomes philosophy.',signature:'debris',scene:'straight',course:{straight:5,cornering:3,acceleration:2,endurance:4,impact:1},surfaceWeights:{smooth:75,cracked:25}},
    {id:'endurance',name:'Endurance Circuit',blurb:'Long enough for every thermal shortcut to become a confession.',signature:'heatwave',scene:'heat',course:{straight:3,cornering:4,acceleration:3,endurance:5,impact:2},surfaceWeights:{smooth:65,cracked:35}},
    {id:'drag',name:'Improvised Drag Strip',blurb:'A straight line with timing equipment and poor legal advice.',signature:'oil',scene:'straight',course:{straight:5,cornering:0,acceleration:5,endurance:1,impact:0},surfaceWeights:{smooth:92,cracked:8}},
    {id:'rally',name:'Rally Course',blurb:'Corners, crests and the occasional argument with vegetation.',signature:'grass',scene:'ring',course:{straight:2,cornering:4,acceleration:4,endurance:3,impact:3},surfaceWeights:{gravel:35,dirt:28,mud:17,snow:20}},
    {id:'offroad',name:'Off-road Trail',blurb:'The road has been replaced by a suggestion.',signature:'stampede',scene:'rubble',course:{straight:2,cornering:3,acceleration:4,endurance:3,impact:4},surfaceWeights:{dirt:30,mud:25,sand:25,snow:20}},
    {id:'rubble',name:'Demolition Route',blurb:'Infrastructure is now an optional extra.',signature:'collapse',scene:'rubble',course:{straight:1,cornering:2,acceleration:3,endurance:2,impact:5},surfaceWeights:{broken:70,gravel:20,cracked:10}}
  ]);

  const SIGNATURES = Object.freeze([
    {id:'crosswind',title:'Crosswind from nowhere',text:'A gust tries to file your car under aircraft.',severity:13,target:'tyres',visual:'crosswind'},
    {id:'chicane',title:'Temporary technical section',text:'Someone added several corners while nobody was looking.',severity:10,target:'tyres',visual:'bins'},
    {id:'pileup',title:'Fresh pile-up',text:'The racing line has become a used-car warehouse.',severity:15,target:'chassis',visual:'debris',favouredGags:['monster']},
    {id:'debris',title:'Flying spare parts',text:'The car ahead has become a parts catalogue.',severity:13,target:'chassis',visual:'debris'},
    {id:'heatwave',title:'Unexpected barbecue',text:'Your engine bay is now a commercial oven.',severity:15,target:'engine',visual:'heatwave',favouredGags:['icecream','burger']},
    {id:'oil',title:'Unscheduled oil slick',text:'Someone has generously lubricated the only straight line.',severity:11,target:'tyres',visual:'oil'},
    {id:'grass',title:'Long grass field',text:'The rally organiser has outsourced track maintenance to nature.',severity:14,target:'tyres',visual:'gravel',favouredGags:['mower']},
    {id:'stampede',title:'Dinosaur stampede',text:'Several million years of scheduling conflict arrive at once.',severity:15,target:'chassis',visual:'debris',favouredGags:['fossil']},
    {id:'collapse',title:'Road collapse',text:'The next hundred metres have resigned from being road.',severity:18,target:'chassis',visual:'debris',favouredGags:['tank','truck','monster']}
  ]);

  // Historic Event Waves 1–5, never removed by later presentation changes.
  const EVENTS = Object.freeze([
    // Core automatic / route events. Later themed waves reuse the same delivery machinery.
    {id:'cargo-spill',title:'Cargo Spill',text:'Crates, barrels and several invoices escape onto the racing line.',delivery:'automatic',severity:'bad',tags:['obstacle','rough'],score:-2,extraDamage:4,credits:0,target:'chassis',visual:'cargo',favouredGags:['truck']},
    {id:'massive-pileup',title:'Massive Pile-up',text:'The road ahead has become a deeply unhelpful vehicle collection.',delivery:'route',severity:'bad',tags:['obstacle','rough','impact'],score:-4,extraDamage:7,credits:0,target:'chassis',visual:'pileup',favouredGags:['monster','truck','tank']},
    {id:'long-grass',title:'Long Grass',text:'The course disappears into a field that has never heard of a mower.',delivery:'route',severity:'bad',tags:['grass','rough','traction'],score:-3,extraDamage:4,credits:0,target:'tyres',visual:'grass',favouredGags:['mower']},
    {id:'flooded-section',title:'Flooded Section',text:'The next part of the circuit has acquired depth.',delivery:'route',severity:'bad',tags:['water','traction'],score:-3,extraDamage:5,credits:0,target:'tyres',visual:'flood',favouredGags:['boat']},
    {id:'deep-sand',title:'Deep Sand Diversion',text:'Race control has replaced asphalt with several tonnes of inconvenience.',delivery:'route',severity:'bad',tags:['sand','soft','traction'],score:-3,extraDamage:4,credits:0,target:'tyres',visual:'sand',favouredGags:['dune']},
    {id:'deep-snow',title:'Deep Snow Section',text:'The racing line has vanished under a fresh delivery of winter.',delivery:'route',severity:'bad',tags:['snow','soft','traction'],score:-3,extraDamage:4,credits:0,target:'tyres',visual:'snow',favouredGags:['snowmobile']},
    {id:'oil-spill',title:'Oil Spill',text:'Someone has generously lubricated the racing line.',delivery:'automatic',severity:'bad',tags:['traction'],score:-3,extraDamage:2,credits:0,target:'tyres',visual:'oil'},
    {id:'pothole-chain',title:'Pothole Chain',text:'One pothole would have been an accident. This is urban planning.',delivery:'automatic',severity:'minor',tags:['rough','impact'],score:-2,extraDamage:4,credits:0,target:'chassis',visual:'potholes'},
    {id:'roadworks',title:'Roadworks',text:'One lane remains open. Naturally it is the least useful one.',delivery:'automatic',severity:'minor',tags:['obstacle'],score:-1,extraDamage:1,credits:0,target:'tyres',visual:'roadworks'},
    {id:'lucky-gap',title:'Lucky Gap',text:'The chaos parts for exactly long enough to reward your terrible judgement.',delivery:'automatic',severity:'positive',tags:['positive'],score:4,extraDamage:0,credits:0,target:'gadget',visual:'clearline'},
    {id:'torrential-downpour',title:'Torrential Downpour',text:'Rain stops being weather and becomes a water-delivery system.',delivery:'automatic',severity:'bad',tags:['water','visibility','traction'],score:-3,extraDamage:2,credits:0,target:'tyres',weatherId:'rain',visual:'downpour'},
    {id:'heatwave-event',title:'Freak Heatwave',text:'The track, tyres and engine bay all begin considering retirement.',delivery:'automatic',severity:'bad',tags:['heat'],score:-3,extraDamage:5,credits:0,target:'engine',weatherId:'hot',visual:'heatwave',favouredGags:['icecream','burger']},
    {id:'dense-fog',title:'Dense Fog Bank',text:'Visibility has been reduced to optimism and approximately six metres.',delivery:'automatic',severity:'bad',tags:['visibility'],score:-3,extraDamage:0,credits:0,target:'tyres',weatherId:'fog',visual:'fog'},
    {id:'crosswind-blast',title:'Crosswind Blast',text:'The atmosphere attempts a side-impact manoeuvre.',delivery:'automatic',severity:'minor',tags:['wind'],score:-2,extraDamage:2,credits:0,target:'tyres',weatherId:'wind',visual:'crosswind',favouredGags:['plane','snowmobile']},
    {id:'black-ice',title:'Black Ice',text:'The road looks perfectly normal, which is extremely unhelpful.',delivery:'automatic',severity:'bad',tags:['ice','traction'],score:-4,extraDamage:3,credits:0,target:'tyres',weatherId:'cold',visual:'ice',favouredGags:['snowmobile']},
    {id:'deer-crossing',title:'Deer Crossing',text:'A deer chooses this exact moment to reconsider the other side of the road.',delivery:'automatic',severity:'minor',tags:['animal','obstacle'],score:-2,extraDamage:2,credits:0,target:'tyres',visual:'deer'},
    {id:'cow-road',title:'Cow in the Road',text:'The cow has priority. Nobody remembers granting it priority.',delivery:'automatic',severity:'bad',tags:['animal','obstacle','impact'],score:-3,extraDamage:3,credits:0,target:'chassis',visual:'cow'},
    {id:'sheep-stampede',title:'Sheep Stampede',text:'The entire road becomes wool, panic and extremely poor lane discipline.',delivery:'route',severity:'bad',tags:['animal','obstacle'],score:-3,extraDamage:4,credits:0,target:'tyres',visual:'sheep'},

    // Choice routes. Safe routes cost time; risky routes are resolved against the current build.
    {id:'wreckage-shortcut',title:'Wreckage Shortcut',text:'A faster line runs directly through the pile-up.',delivery:'choice',severity:'mixed',tags:['choice','obstacle','rough'],visual:'pileup',favouredGags:['monster','truck','tank'],choice:{prompt:'Cut through the wreckage or take the longer clean route?',safeLabel:'TAKE SAFE ROUTE',riskLabel:'CUT THROUGH WRECKAGE',safeText:'You take the longer line around the wrecks.',successText:'The car barges through and steals a huge chunk of time.',failText:'The shortcut bites back. Metal meets more metal.',safeScore:-1,successScore:5,failScore:-5,successDamage:1,failDamage:7,target:'chassis',test:'rough'}},
    {id:'overgrown-shortcut',title:'Overgrown Shortcut',text:'The fast route disappears through waist-high grass.',delivery:'choice',severity:'mixed',tags:['choice','grass','rough'],visual:'grass',favouredGags:['mower'],choice:{prompt:'Stay on the road or dive through the overgrown shortcut?',safeLabel:'STAY ON ROAD',riskLabel:'TAKE GRASS SHORTCUT',safeText:'You stay on the slower maintained route.',successText:'The grass parts and the shortcut pays off beautifully.',failText:'The vegetation wins an argument with your momentum.',safeScore:-1,successScore:5,failScore:-4,successDamage:0,failDamage:5,target:'tyres',test:'grass'}},
    {id:'flooded-shortcut',title:'Flooded Shortcut',text:'The direct route is shorter and substantially wetter.',delivery:'choice',severity:'mixed',tags:['choice','water','traction'],visual:'flood',favouredGags:['boat'],choice:{prompt:'Take the dry detour or charge through the flooded service road?',safeLabel:'TAKE DRY ROUTE',riskLabel:'TAKE FLOODED SHORTCUT',safeText:'You stay dry and lose a little time.',successText:'You skim through the flood and emerge far ahead.',failText:'The shortcut becomes an unscheduled swimming lesson.',safeScore:-1,successScore:5,failScore:-5,successDamage:0,failDamage:6,target:'tyres',test:'water'}},
    {id:'dune-shortcut',title:'Dune Shortcut',text:'A straight line across the dunes is shorter in the same way cliffs are technically direct.',delivery:'choice',severity:'mixed',tags:['choice','sand','soft'],visual:'sand',favouredGags:['dune'],choice:{prompt:'Follow the marked course or cut directly across the dunes?',safeLabel:'FOLLOW COURSE',riskLabel:'CUT ACROSS DUNES',safeText:'You take the longer packed route.',successText:'The car surfs the dunes and lands miles ahead of common sense.',failText:'The car digs in and converts horsepower into sand.',safeScore:-1,successScore:5,failScore:-5,successDamage:1,failDamage:6,target:'tyres',test:'sand'}},
    {id:'frozen-lake-shortcut',title:'Frozen Lake Shortcut',text:'The shortest route is a large sheet of ice with confidence issues.',delivery:'choice',severity:'mixed',tags:['choice','ice','traction'],visual:'ice',favouredGags:['snowmobile'],choice:{prompt:'Take the shoreline or risk the frozen lake?',safeLabel:'TAKE SHORELINE',riskLabel:'CROSS THE ICE',safeText:'You take the slower route around the lake.',successText:'The car glides across the ice in a deeply suspicious display of competence.',failText:'Traction leaves the conversation almost immediately.',safeScore:-1,successScore:5,failScore:-5,successDamage:0,failDamage:5,target:'tyres',test:'ice'}},
    {id:'suspicious-ramp',title:'Suspicious Ramp',text:'A ramp has appeared where sensible road engineering would normally go.',delivery:'choice',severity:'mixed',tags:['choice','jump'],visual:'ramp',choice:{prompt:'Drive around the ramp or send it?',safeLabel:'DRIVE AROUND',riskLabel:'SEND IT',safeText:'You sensibly drive around it. Disappointing, but effective.',successText:'Perfect launch. Questionable landing. Massive time gain.',failText:'The launch is excellent. The landing belongs in a different report.',safeScore:-1,successScore:5,failScore:-4,successDamage:1,failDamage:7,target:'chassis',test:'jump'}},
    {id:'broken-bridge-jump',title:'Broken Bridge Jump',text:'The bridge has developed an aggressively missing middle.',delivery:'choice',severity:'mixed',tags:['choice','jump','impact'],visual:'bridge',choice:{prompt:'Take the long diversion or try to clear the broken bridge?',safeLabel:'TAKE DETOUR',riskLabel:'JUMP THE GAP',safeText:'You take the long way around and remain reassuringly earthbound.',successText:'The car clears the gap and lands ahead of several health-and-safety investigations.',failText:'The far side arrives at a deeply inconvenient angle.',safeScore:-2,successScore:6,failScore:-6,successDamage:1,failDamage:9,target:'chassis',test:'jump'}}

,
    // Wave 2 — presentation/comedy. These deliberately use light mechanical effects.
    {id:'true-potential',title:'True Potential?!',text:'The car acquires an unreasonable aura and briefly remembers what confidence feels like.',delivery:'automatic',severity:'positive',tags:['positive','anime','comedy'],score:4,extraDamage:0,credits:0,target:'gadget',visual:'aura'},
    {id:'too-fast-camera',title:'Too Fast for the Camera',text:'Speed lines consume the picture. The timing equipment insists this still counts.',delivery:'automatic',severity:'positive',tags:['positive','anime','speed'],score:5,extraDamage:0,credits:0,target:'engine',visual:'speedlines'},
    {id:'mysterious-mentor',title:'Mysterious Mentor Appears',text:'A shadowy figure offers three cryptic words. Somehow, they are useful.',delivery:'automatic',severity:'positive',tags:['positive','anime','comedy'],score:3,extraDamage:0,credits:0,target:'gadget',visual:'mentor'},
    {id:'dramatic-tailwind',title:'Unreasonably Dramatic Tailwind',text:'Leaves spiral, clouds part, and the atmosphere abruptly picks a favourite.',delivery:'automatic',severity:'positive',tags:['positive','wind','anime'],score:4,extraDamage:0,credits:0,target:'engine',weatherId:'wind',visual:'tailwind'},
    {id:'transformation-sequence',title:'Mid-Race Transformation Sequence',text:'Lights. Silhouette. Rotating components. The reveal is... exactly the same car.',delivery:'automatic',severity:'comedy',tags:['anime','comedy'],score:0,extraDamage:0,credits:0,target:'gadget',visual:'transformation'},
    {id:'episode-budget',title:'Episode Budget Ran Out',text:'The entire race briefly becomes alarmingly low-detail. Nobody acknowledges it.',delivery:'automatic',severity:'comedy',tags:['anime','comedy'],score:0,extraDamage:0,credits:0,target:'gadget',visual:'budget'},
    {id:'beam-horizon',title:'Beam Across the Horizon',text:'A colossal beam crosses the landscape. The shockwave has opinions about wheel alignment.',delivery:'automatic',severity:'bad',tags:['anime','heat','wind'],score:-2,extraDamage:3,credits:0,target:'chassis',visual:'beam'},
    {id:'crater-road',title:'Crater Where Road Used to Be',text:'Something has removed a substantial portion of infrastructure with great confidence.',delivery:'route',severity:'bad',tags:['anime','rough','impact'],score:-4,extraDamage:6,credits:0,target:'chassis',visual:'crater'},
    {id:'beach-episode',title:'Beach Episode',text:'The circuit unexpectedly reaches the beach. Sand immediately becomes everyone\'s problem.',delivery:'route',severity:'mixed',tags:['anime','sand','soft','comedy'],score:-1,extraDamage:2,credits:0,target:'tyres',visual:'beach',favouredGags:['dune']}
  ]);
  const SUPPLEMENTAL_EVENTS = Object.freeze([
    {id:'tailwind',title:'Suspicious tailwind',text:'The atmosphere briefly joins your pit crew.',score:4,extraDamage:0,credits:0,target:'engine',category:'good',visual:'tailwind'},
    {id:'delivery',title:'Misaddressed sponsorship',text:'A sponsor pays the wrong team. We are not correcting it.',score:0,extraDamage:0,credits:20,target:'gadget',category:'good',visual:'delivery'},
    {id:'clearline',title:'Perfect racing line',text:'Traffic parts. Physics behaves. Suspicious.',score:3,extraDamage:0,credits:0,target:'tyres',category:'good',visual:'clearline',favouredGags:['f1']},
    {id:'hail',title:'Frozen pea storm',text:'The sky becomes a freezer aisle with intent.',score:-1,extraDamage:4,credits:0,target:'chassis',category:'mild',visual:'hail',favouredGags:['house']},
    {id:'gravel',title:'Freshly redistributed gravel',text:'The verge would like a turn on the track.',score:-1,extraDamage:3,credits:0,target:'tyres',category:'mild',visual:'debris'},
    {id:'debris',title:'Flying spare parts',text:'The car ahead has become a parts catalogue.',score:-3,extraDamage:7,credits:0,target:'chassis',category:'severe',visual:'debris',favouredGags:['truck']},
    {id:'mustard',title:'Industrial mustard spill',text:'Nobody will explain the quantity. Grip has lodged a complaint.',score:-3,extraDamage:5,credits:0,target:'tyres',category:'severe',visual:'oil',favouredGags:['burger']},
    {id:'rails',title:'The track becomes rails',text:'Municipal planning takes a sudden and extremely specific turn.',score:-4,extraDamage:6,credits:0,target:'tyres',category:'severe',visual:'debris',favouredGags:['train']},
    {id:'bullets',title:'It is raining bullets',text:'The race has taken an alarming geopolitical detour.',score:-4,extraDamage:9,credits:0,target:'chassis',category:'severe',visual:'hail',favouredGags:['tank']},
    {id:'flood',title:'Flash flood',text:'The course has acquired depth.',score:-3,extraDamage:7,credits:0,target:'tyres',category:'severe',visual:'oil',favouredGags:['boat']},
    {id:'shooting-stars',title:'Shooting stars',text:'Beautiful. Majestic. Some of them are getting larger.',score:-2,extraDamage:6,credits:0,target:'chassis',category:'severe',visual:'hail',favouredGags:['spaceship','rocketcar']},
    {id:'crosswind-event',title:'Violent crosswind',text:'The atmosphere attempts overtaking.',score:-2,extraDamage:4,credits:0,target:'tyres',category:'mild',visual:'crosswind',favouredGags:['plane']},
    {id:'drag-challenge',title:'Impromptu drag race',text:'The corner marshals have temporarily become acceleration enthusiasts.',score:1,extraDamage:1,credits:0,target:'engine',category:'mild',visual:'tailwind',favouredGags:['muscle']},
    {id:'heat-event',title:'Freak heatwave',text:'Everything outside the ice cream is now also melting.',score:-2,extraDamage:6,credits:0,target:'engine',category:'severe',visual:'heatwave',favouredGags:['icecream','burger']}
  ]);

  const WILDCARDS = Object.freeze([...EVENTS,...SUPPLEMENTAL_EVENTS.map(e=>Object.freeze({...e,delivery:e.delivery||'automatic',tags:e.tags||[]}))]);

  const PASS_EVENTS = Object.freeze([
    // Wave 1/2 readable pass variants.
    {id:'spring-trap',title:'SPRING TRAP!',text:'A square of road erupts sideways on a gigantic spring. The rival is simply gone.',visual:'spring-trap',weight:4,motion:'spring'},
    {id:'duck-crossing',title:'DUCK CROSSING!',text:'One late duck makes the rival reconsider every life choice at once.',visual:'duck-pass',weight:3,motion:'swerve'},
    {id:'rival-monologue',title:'RIVAL MONOLOGUE',text:'"You do not understand... I never raced for victory..." You drive past while they continue explaining.',visual:'monologue',weight:2.4,motion:'slow'},
    {id:'goose-panic',title:'GOOSE PANIC!',text:'A goose enters the racing line with the confidence of something that has never faced consequences.',visual:'goose-pass',weight:1.8,motion:'swerve'},
    {id:'boar-charge',title:'BOAR CHARGE!',text:'A boar chooses the rival as the most interesting object on the road.',visual:'boar-pass',weight:1.4,motion:'blast'},
    {id:'bull-run',title:'BULL RUN!',text:"A bull arrives with very firm opinions about the rival\'s lane choice.",visual:'bull-pass',weight:1.1,motion:'blast'},
    // Wave 5 legendary spectacle. Low weights make individual sightings genuinely rare.
    {id:'tornado-touchdown',title:'TORNADO!',text:'The weather reviews the rival and removes them sideways.',visual:'tornado-pass',weight:.32,motion:'lift'},
    {id:'lightning-strike',title:'DIRECT HIT!',text:'A lightning bolt makes a remarkably specific motorsport decision.',visual:'lightning-pass',weight:.28,motion:'blast'},
    {id:'giant-footstep',title:'GIANT FOOTSTEP!',text:'Something enormous arrives one foot at a time. The rival was using that bit of road.',visual:'foot-pass',weight:.22,motion:'blast'},
    {id:'impossible-sword',title:'IMPOSSIBLE SLASH!',text:'A glowing slash crosses the course from nowhere and removes the rival\'s line from existence.',visual:'slash-pass',weight:.18,motion:'blast'},
    {id:'meteor-pass',title:'METEORIC NEAR MISS!',text:'A meteor lands beside the rival. "Near" is doing heroic work.',visual:'meteor-pass',weight:.24,motion:'blast'},
    {id:'ufo-abduction',title:'THEY CHOSE THE RIVAL',text:'A beam descends. The rival ascends. You continue racing.',visual:'ufo-pass',weight:.18,motion:'lift'},
    {id:'black-hole-pass',title:'MICRO BLACK HOLE!',text:'The rival is dragged sideways toward a singularity that definitely was not on the risk assessment.',visual:'blackhole-pass',weight:.12,motion:'suck'},
    {id:'rolling-stone',title:'ROLLING STONE BLOCK!',text:'An enormous carved block rolls across the course and solves your overtaking problem.',visual:'stone-pass',weight:.22,motion:'blast'},
    {id:'runaway-coffin',title:'RUNAWAY COFFIN!',text:'A coffin slides across the road and removes the rival with astonishing efficiency.',visual:'coffin-pass',weight:.20,motion:'blast'},
    {id:'shadow-pass',title:'THE SHADOW TAKES THEM',text:'The rival\'s shadow stretches sideways. So does the rival.',visual:'shadow-pass',weight:.16,motion:'suck'},
    {id:'tail-swipe',title:'TAIL SWIPE!',text:'A colossal tail crosses the road and returns one rival to scenery status.',visual:'tail-pass',weight:.20,motion:'blast'},
    {id:'tentacle-grab',title:'TENTACLE GRAB!',text:'One enormous tentacle reaches in, selects the rival, and leaves.',visual:'tentacle-pass',weight:.18,motion:'lift'},
    {id:'crab-claw',title:'CRAB CLAW!',text:'A claw the size of a garage plucks the rival from the racing line.',visual:'crab-pass',weight:.14,motion:'lift'},
    {id:'webbed-rival',title:'WEBBED!',text:'The rival meets industrial quantities of spider silk and exits sideways.',visual:'web-pass',weight:.15,motion:'suck'},
    {id:'trebuchet-pass',title:'TREBUCHET ACCURACY IMPROVED',text:'Several centuries of artillery development culminate in one extremely convenient pass.',visual:'trebuchet-pass',weight:.15,motion:'blast'},
    // v0.7.19d: bespoke route overtakes. Not part of the ordinary random pass pool.
    // A matching gag must encounter this route and actually earn a finishing-position gain.
    {id:'wreckage-shortcut-pass',title:'THE SCRAP GAP!',text:'The reinforced gag car finds a gap through the wrecks and passes the rival still stuck on the main road.',visual:'wreckage-shortcut',weight:0,motion:'shortcut',requiredGags:['monster','truck','tank'],triggerEvents:['wreckage-shortcut','massive-pileup']},
    {id:'overgrown-shortcut-pass',title:'MOWER EXPRESS!',text:'The Lawnmower cuts its own racing line through the grass and emerges ahead.',visual:'overgrown-shortcut',weight:0,motion:'shortcut',requiredGags:['mower'],triggerEvents:['overgrown-shortcut','long-grass']},
    {id:'flooded-shortcut-pass',title:'BOAT CAR BYPASS!',text:'The Boat Car skims along the flooded side route while a rival wrestles with the dry road.',visual:'flooded-shortcut',weight:0,motion:'shortcut',requiredGags:['boat'],triggerEvents:['flooded-shortcut','flooded-section']},
    {id:'dune-shortcut-pass',title:'DUNE BUGGY DASH!',text:'The Dune Buggy sails across a sandy cut-through and rejoins ahead of a rival.',visual:'dune-shortcut',weight:0,motion:'shortcut',requiredGags:['dune'],triggerEvents:['dune-shortcut','deep-sand']},
    {id:'frozen-lake-shortcut-pass',title:'SNOWMOBILE SHORTCUT!',text:'The Snowmobile skims the frozen lake, finding a clear line past a rival on the shore.',visual:'frozen-lake-shortcut',weight:0,motion:'shortcut',requiredGags:['snowmobile'],triggerEvents:['frozen-lake-shortcut']},
  ]);
  const PASS_EVENT_WEIGHTS = Object.freeze(Object.fromEntries(PASS_EVENTS.map(e=>[e.id,e.weight])));

  const FAKE_PASS_EVENTS = Object.freeze([
    {id:'rival-awakening',title:'RIVAL AWAKENING!',text:'The pass is almost complete. Then the rival starts glowing and rockets back ahead.',visual:'rival-awakening',weight:3,motion:'surge'},
    {id:'weighted-spoiler',title:'WEIGHTED SPOILER REMOVED!',text:'The rival throws away an absurdly heavy spoiler and immediately becomes your problem again.',visual:'weighted-spoiler',weight:3,motion:'surge'},
    {id:'clone-better',title:'THE CLONE WAS BETTER',text:'You pass one rival. An apparently superior duplicate takes their place ahead.',visual:'clone-fake',weight:.7,motion:'surge'},
    {id:'specimen-returned',title:'SPECIMEN RETURNED',text:'The rival is abducted. Excellent. Then the craft drops them back ahead with extra momentum.',visual:'ufo-fake',weight:.45,motion:'drop'},
    {id:'ghost-car',title:'GHOST CAR OVERTAKE',text:'The car you pass fades away. The actual rival is still ahead. Extremely rude.',visual:'ghost-fake',weight:.55,motion:'surge'},
    {id:'possessed-rival',title:'POSSESSED RIVAL',text:'Lights flare, steering twitches, and the rival claws their way back ahead.',visual:'possessed-fake',weight:.5,motion:'surge'},
    {id:'mirror-rival',title:'MIRROR RIVAL',text:'A reflection peels out of nowhere and becomes the rival still ahead.',visual:'mirror-fake',weight:.35,motion:'surge'}
  ]);
  const FAKE_PASS_EVENT_WEIGHTS = Object.freeze(Object.fromEntries(FAKE_PASS_EVENTS.map(e=>[e.id,e.weight])));

  // Waves 3-5 live mostly in the anomaly pool so normal race hazards remain readable.
  const HISTORIC_ANOMALIES = Object.freeze([
    // Wave 3 — science / space.
    {id:'teleporter',title:'Experimental Teleporter',text:'A humming arch promises a shorter route and absolutely no paperwork.',delivery:'choice',severity:'mixed',tags:['science','choice'],visual:'teleporter',weight:3.0,choice:{prompt:'Use the experimental teleporter?',safeLabel:'STAY ON ROAD',riskLabel:'ENTER TELEPORTER',safeText:'You decline to become a data point.',successText:'Reality blinks. You reappear much farther ahead and mostly facing the right way.',failText:'Calibration was apparently a future research objective.',safeScore:-1,successScore:7,failScore:-5,successDamage:0,failDamage:3,target:'chassis',test:'jump'}},
    {id:'wormhole',title:'Wormhole Shortcut',text:'A perfectly stable-looking hole in spacetime offers a highly questionable shortcut.',delivery:'choice',severity:'mixed',tags:['science','space','choice'],visual:'wormhole',weight:1.4,choice:{prompt:'Enter the wormhole?',safeLabel:'REMAIN IN REALITY',riskLabel:'ENTER WORMHOLE',safeText:'You stay in this dimension and lose a little time.',successText:'The exit appears offensively close to the finish.',failText:'The exit is technically on the course. Eventually.',safeScore:-1,successScore:8,failScore:-6,successDamage:0,failDamage:4,target:'chassis',test:'jump'}},
    {id:'gravity-failure',title:'Localized Gravity Failure',text:'Gravity clocks out for one section and leaves the suspension unsupervised.',delivery:'route',severity:'mixed',tags:['science','space','gravity'],score:1,extraDamage:1,target:'chassis',visual:'gravity',weight:3.2},
    {id:'experimental-magnet',title:'Experimental Magnet Activated',text:'A research magnet begins negotiating directly with every metal component.',delivery:'automatic',severity:'bad',tags:['science','magnet','impact'],score:-3,extraDamage:3,target:'chassis',visual:'magnet',weight:2.6},
    {id:'time-dilation',title:'Time Dilation Zone',text:'Everyone else appears to slow down. Physics has accidentally become useful.',delivery:'automatic',severity:'positive',tags:['science','time','positive'],score:6,extraDamage:0,target:'gadget',visual:'time-dilation',weight:1.5},
    {id:'miniature-sun',title:'Miniature Sun Experiment',text:'A research facility has created a small star beside the road because apparently zoning failed.',delivery:'automatic',severity:'very-bad',tags:['science','heat'],score:-4,extraDamage:7,target:'engine',weatherId:'hot',visual:'mini-sun',weight:.8,favouredGags:['icecream','burger']},
    {id:'first-contact',title:'First Contact',text:'An unidentified craft hovers above the course, observes the race, and appears unconvinced.',delivery:'automatic',severity:'comedy',tags:['space','ufo','comedy'],score:0,extraDamage:0,target:'gadget',visual:'ufo',weight:.7},
    // Wave 3 — history.
    {id:'roman-road',title:'Roman Road Engineering',text:'The surface becomes suspiciously straight, solid and competent.',delivery:'route',severity:'positive',tags:['history','smooth','positive'],score:4,extraDamage:0,target:'tyres',visual:'roman-road',weight:2.5},
    {id:'aqueduct-shortcut',title:'Aqueduct Shortcut',text:'The shortest route is now an elevated stone channel with essentially no guardrails.',delivery:'choice',severity:'mixed',tags:['history','choice','water'],visual:'aqueduct',weight:1.3,choice:{prompt:'Take the aqueduct?',safeLabel:'STAY ON ROAD',riskLabel:'TAKE AQUEDUCT',safeText:'You remain at ground level like a coward with excellent survival instincts.',successText:'The aqueduct delivers you ahead with ancient efficiency.',failText:'Two thousand years of engineering were not designed around this speed.',safeScore:-1,successScore:7,failScore:-6,successDamage:1,failDamage:8,target:'chassis',test:'jump'}},
    {id:'tomb-entrance',title:'Tomb Entrance Discovered',text:'A dark stone passage offers a route that is both shorter and historically inadvisable.',delivery:'choice',severity:'mixed',tags:['history','choice','rough'],visual:'tomb',weight:1.2,choice:{prompt:'Take the tomb shortcut?',safeLabel:'STAY OUTSIDE',riskLabel:'ENTER TOMB',safeText:'You avoid disturbing several millennia of very clear boundaries.',successText:'The tunnel cuts a huge piece from the course.',failText:'Ancient architecture introduces the suspension to archaeology.',safeScore:-1,successScore:7,failScore:-5,successDamage:1,failDamage:6,target:'chassis',test:'rough'}},
    {id:'industrial-revolution',title:'Industrial Revolution',text:'Steam, machinery and soot turn the next section into a factory floor with lane markings.',delivery:'route',severity:'mixed',tags:['history','heat','visibility'],score:-1,extraDamage:2,target:'engine',visual:'industrial',weight:2.0},
    {id:'anubis-judges',title:'Anubis Judges the Field',text:'Something weighs every machine with unsettling seriousness. Maintenance suddenly feels moral.',delivery:'automatic',severity:'mixed',tags:['history','myth','condition'],score:2,extraDamage:0,target:'gadget',visual:'anubis',weight:.22},
    {id:'ra-gaze',title:"Ra's Gaze",text:'The sun becomes brutally personal.',delivery:'automatic',severity:'very-bad',tags:['history','myth','heat'],score:-4,extraDamage:6,target:'engine',weatherId:'hot',visual:'sun-gaze',weight:.35,favouredGags:['icecream','burger']},
    // Wave 3 — supernatural.
    {id:'haunted-shortcut',title:'Haunted Shortcut',text:'A road appears where the map insists there is forest.',delivery:'choice',severity:'mixed',tags:['supernatural','choice'],visual:'haunted-road',weight:1.6,choice:{prompt:'Take the impossible road?',safeLabel:'IGNORE IT',riskLabel:'TAKE HAUNTED ROAD',safeText:'You stay with roads recognised by local government.',successText:'The impossible road is offensively efficient.',failText:'The road goes somewhere. Eventually it remembers where.',safeScore:-1,successScore:7,failScore:-5,successDamage:0,failDamage:3,target:'gadget',test:'jump'}},
    {id:'phantom-tailwind',title:'Phantom Tailwind',text:'Something unseen begins pushing the car forward. It is polite enough not to explain.',delivery:'automatic',severity:'positive',tags:['supernatural','wind','positive'],score:5,extraDamage:0,target:'gadget',visual:'ghost-wind',weight:2.2},
    {id:'possessed-engine',title:'Possessed Engine',text:'The engine revs far beyond anything requested. The additional horsepower appears spiritually sourced.',delivery:'automatic',severity:'mixed',tags:['supernatural','heat'],score:5,extraDamage:4,target:'engine',visual:'possessed',weight:1.8},
    {id:'graveyard-detour',title:'Graveyard Detour',text:'The race is redirected through narrow paths between extremely permanent residents.',delivery:'route',severity:'bad',tags:['supernatural','rough'],score:-3,extraDamage:3,target:'tyres',visual:'graveyard',weight:1.7},
    {id:'demon-crossroads',title:'Demon at the Crossroads',text:'A very well-dressed stranger offers immediate speed in exchange for "something later".',delivery:'choice',severity:'mixed',tags:['supernatural','choice','legendary'],visual:'crossroads',weight:.18,choice:{prompt:'Accept the deal?',safeLabel:'DECLINE',riskLabel:'MAKE THE DEAL',safeText:'You leave with your soul, warranty and lap time intact.',successText:'The car surges forward with deeply suspicious competence.',failText:'The deal works. The fine print also works.',safeScore:0,successScore:9,failScore:5,successDamage:2,failDamage:8,target:'engine',test:'jump'}},

    // Wave 4 — persistent multi-stage events.
    {id:'deja-vu',title:'Déjà Vu',text:'A figure stands half-hidden behind a distinctive tree.',delivery:'automatic',severity:'comedy',tags:['supernatural','multistage','horror'],score:0,extraDamage:0,target:'gadget',visual:'deja-vu-1',weight:.65,multiStage:{guaranteeSecond:true,followupChance:.40},stages:[
      {title:'Déjà Vu',text:'A figure stands half-hidden behind a distinctive tree.',score:0,extraDamage:0,visual:'deja-vu-1'},
      {title:'Déjà Vu',text:'The same tree appears again. The figure is closer to the road.',score:0,extraDamage:0,visual:'deja-vu-2'},
      {title:'Déjà Vu',text:'The tree returns. The figure is no longer properly hidden.',score:0,extraDamage:0,visual:'deja-vu-3'},
      {title:'Déjà Vu',text:'It was waiting for you.',score:0,extraDamage:0,visual:'deja-vu-4',jumpScare:true}
    ]},
    {id:'storm-front',title:'Storm Front',text:'A dark wall of cloud begins swallowing the horizon.',delivery:'automatic',severity:'bad',tags:['weather','multistage'],score:0,extraDamage:0,target:'tyres',visual:'storm-1',weight:1.3,multiStage:{guaranteeSecond:true,followupChance:.58},stages:[
      {title:'Storm Front',text:'A dark wall of cloud begins swallowing the horizon.',score:0,extraDamage:0,visual:'storm-1'},
      {title:'Storm Front Closing',text:'Wind rises and the first hard drops strike the road.',score:-1,extraDamage:1,visual:'storm-2',weatherId:'rain'},
      {title:'Storm Breaks',text:'The storm arrives all at once.',score:-3,extraDamage:3,visual:'storm-3',weatherId:'rain'}
    ]},
    {id:'tremors',title:'Tremors',text:'Pebbles begin hopping on the road for reasons pebbles generally avoid.',delivery:'automatic',severity:'bad',tags:['rough','multistage'],score:0,extraDamage:0,target:'chassis',visual:'tremor-1',weight:1.3,multiStage:{guaranteeSecond:false,followupChance:.62},stages:[
      {title:'Tremors',text:'Pebbles begin hopping on the road.',score:0,extraDamage:0,visual:'tremor-1'},
      {title:'Road Cracking',text:'Fresh cracks race across the surface.',score:-1,extraDamage:1,visual:'tremor-2'},
      {title:'Ground Gives Way',text:'The road finally loses the argument with geology.',score:-4,extraDamage:6,visual:'tremor-3'}
    ]},
    {id:'suspicious-lights',title:'Suspicious Lights',text:'A distant light moves in a way weather balloons have repeatedly promised not to.',delivery:'automatic',severity:'comedy',tags:['space','ufo','multistage'],score:0,extraDamage:0,target:'gadget',visual:'lights-1',weight:.85,multiStage:{guaranteeSecond:false,followupChance:.52},stages:[
      {title:'Suspicious Lights',text:'A distant light tracks the race.',score:0,extraDamage:0,visual:'lights-1'},
      {title:'Suspicious Lights',text:'The light returns, much closer.',score:0,extraDamage:0,visual:'lights-2'},
      {title:'Something Overhead',text:'The light is now unquestionably following the field.',score:-1,extraDamage:0,visual:'lights-3'},
      {title:'Close Encounter',text:'A silent craft hangs directly above the road before vanishing.',score:1,extraDamage:0,visual:'lights-4'}
    ]},
    {id:'cracking-ice',title:'Cracking Ice',text:'Thin fractures spider across the frozen surface beneath the tyres.',delivery:'automatic',severity:'bad',tags:['ice','multistage'],score:0,extraDamage:0,target:'tyres',visual:'crack-ice-1',weight:1.4,surfaces:['snow','ice'],multiStage:{guaranteeSecond:true,followupChance:.55},stages:[
      {title:'Cracking Ice',text:'Thin fractures spider beneath the tyres.',score:0,extraDamage:0,visual:'crack-ice-1'},
      {title:'Ice Moving',text:'Whole plates begin shifting under the racing line.',score:-1,extraDamage:1,visual:'crack-ice-2'},
      {title:'Ice Breaks',text:'The surface opens into a violently inconvenient gap.',score:-4,extraDamage:5,visual:'crack-ice-3'}
    ]},
    {id:'experimental-instability',title:'Experimental Instability',text:'Warning lamps illuminate in a nearby test facility. Several scientists begin running.',delivery:'automatic',severity:'bad',tags:['science','multistage'],score:0,extraDamage:0,target:'gadget',visual:'lab-1',weight:1.15,multiStage:{guaranteeSecond:false,followupChance:.60},stages:[
      {title:'Experimental Instability',text:'Warning lamps illuminate in a nearby test facility.',score:0,extraDamage:0,visual:'lab-1'},
      {title:'Containment Warning',text:'Sparks and alarm lights suggest peer review may be delayed.',score:-1,extraDamage:1,visual:'lab-2'},
      {title:'Containment Failure',text:'Whatever the machine was containing has chosen openness.',score:-3,extraDamage:4,visual:'lab-3'},
      {title:'Experiment Complete?',text:'Everything abruptly stops. Nobody looks reassured.',score:1,extraDamage:0,visual:'lab-4'}
    ]},

    // Wave 5 — legendary spectacle / monsters.
    {id:'kaiju-crossing',title:'Kaiju Crossing',text:'An enormous unidentified creature crosses the circuit with no interest in race control.',delivery:'route',severity:'very-bad',tags:['monster','impact','legendary'],score:-5,extraDamage:7,target:'chassis',visual:'kaiju',weight:.16},
    {id:'sand-worm',title:'Giant Sand Worm',text:'The dunes stand up vertically and acquire teeth.',delivery:'route',severity:'very-bad',tags:['monster','sand','rough','legendary'],score:-5,extraDamage:7,target:'chassis',visual:'sand-worm',weight:.22,surfaces:['sand'],favouredGags:['dune']},
    {id:'sea-serpent',title:'Sea Serpent',text:'Something very large rises beside the course and brings most of the water with it.',delivery:'route',severity:'very-bad',tags:['monster','water','legendary'],score:-4,extraDamage:6,target:'tyres',visual:'sea-serpent',weight:.16,favouredGags:['boat']},
    {id:'dragon-flyover',title:'Dragon Flyover',text:'A vast winged silhouette crosses overhead. Heat and turbulence arrive shortly afterwards.',delivery:'automatic',severity:'very-bad',tags:['monster','heat','wind','legendary'],score:-4,extraDamage:6,target:'engine',visual:'dragon',weight:.13},
    {id:'spider-web',title:'Giant Spider Web',text:'Industrial quantities of silk stretch across the entire racing line.',delivery:'route',severity:'bad',tags:['monster','obstacle','legendary'],score:-4,extraDamage:4,target:'tyres',visual:'spider-web',weight:.20},
    {id:'the-blob',title:'The Blob',text:'A huge amorphous mass begins oozing across the road with terrible lane discipline.',delivery:'route',severity:'bad',tags:['monster','traction','legendary'],score:-4,extraDamage:3,target:'tyres',visual:'blob',weight:.20},
    {id:'sleeping-giant',title:'Sleeping Giant',text:'The fastest route passes directly beside something enormous that is currently asleep.',delivery:'choice',severity:'mixed',tags:['monster','choice','legendary'],visual:'sleeping-giant',weight:.12,choice:{prompt:'Take the shortcut beside the sleeping giant?',safeLabel:'TAKE DETOUR',riskLabel:'TIPTOE PAST',safeText:'You choose not to test the sleep quality of something that large.',successText:'It stays asleep. The shortcut is enormous.',failText:'It did not stay asleep.',safeScore:-2,successScore:9,failScore:-7,successDamage:0,failDamage:9,target:'chassis',test:'jump'}},
    {id:'monster-stampede',title:'Monster Stampede',text:'Multiple large unidentified creatures decide the course is a migration route.',delivery:'route',severity:'very-bad',tags:['monster','obstacle','impact','legendary'],score:-5,extraDamage:7,target:'chassis',visual:'monster-stampede',weight:.11},
    {id:'creature-fight',title:'Creature Fight',text:'Two enormous creatures settle a disagreement beside the circuit. Debris joins the race.',delivery:'automatic',severity:'very-bad',tags:['monster','impact','legendary'],score:-4,extraDamage:6,target:'chassis',visual:'creature-fight',weight:.10},
    {id:'mountain-moved',title:'The Mountain Moved',text:'A mountain in the distance appears to breathe.',delivery:'automatic',severity:'comedy',tags:['monster','multistage','legendary'],score:0,extraDamage:0,target:'gadget',visual:'mountain-1',weight:.08,multiStage:{guaranteeSecond:false,followupChance:.35},stages:[
      {title:'The Mountain Moved',text:'A mountain in the distance appears to breathe.',score:0,extraDamage:0,visual:'mountain-1'},
      {title:'The Mountain Moved Again',text:'It was not a mountain.',score:0,extraDamage:0,visual:'mountain-2'},
      {title:'It Stood Up',text:'The horizon develops legs.',score:-1,extraDamage:1,visual:'mountain-3'}
    ]}
  ]);
  const SUPPLEMENTAL_ANOMALIES = Object.freeze([
    {id:'freak-hail',title:'Hail out of nowhere',text:'The local forecast has resigned.',extraDamage:3,score:-1,credits:0,target:'chassis',weatherId:'cold',visual:'hail'},
    {id:'cooling-shower',title:'Perfectly timed shower',text:'A brief cooling shower opens a little breathing room.',extraDamage:0,score:2,credits:0,target:'engine',weatherId:'rain',visual:'tailwind'},
    {id:'low-gravity',title:'Low-gravity anomaly',text:'Tyres become suggestions. Everyone receives temporary aerospace credentials.',extraDamage:2,score:-1,credits:0,target:'chassis',weatherId:'clear',visual:'tailwind',favouredGags:['spaceship']}
  ]);

  const ANOMALIES = Object.freeze([...HISTORIC_ANOMALIES,...SUPPLEMENTAL_ANOMALIES.map(e=>Object.freeze({...e,delivery:e.delivery||'automatic',tags:e.tags||[],weight:1}))]);
  const ANOMALY_WEIGHTS = Object.freeze(Object.fromEntries(ANOMALIES.map(e=>[e.id,e.weight||1])));

  const RACE_RULES = Object.freeze({
    openingChance:.60, lateChance:.64, anomalyChance:.18,
    openingWeights:{'lucky-gap':12,'roadworks':10,'pothole-chain':8,'cargo-spill':7,'long-grass':5,'flooded-section':4,'deep-sand':4,'deep-snow':3,'oil-spill':7,'torrential-downpour':4,'heatwave-event':4,'dense-fog':6,'crosswind-blast':7,'black-ice':3,'deer-crossing':5,'cow-road':3,'sheep-stampede':2,'massive-pileup':3,'wreckage-shortcut':3,'overgrown-shortcut':3,'flooded-shortcut':3,'dune-shortcut':3,'frozen-lake-shortcut':2,'suspicious-ramp':4,'broken-bridge-jump':2,'true-potential':2,'too-fast-camera':3,'mysterious-mentor':2,'dramatic-tailwind':3,'transformation-sequence':1.2,'episode-budget':1.2,'beam-horizon':1,'crater-road':1,'beach-episode':.7,'tailwind':3,'delivery':2,'clearline':2,'hail':2,'gravel':2,'debris':2,'mustard':1,'rails':1,'bullets':0.5,'flood':1,'shooting-stars':0.6,'crosswind-event':2,'drag-challenge':2,'heat-event':1},
    lateWeights:{'lucky-gap':5,'roadworks':6,'pothole-chain':9,'cargo-spill':9,'long-grass':7,'flooded-section':7,'deep-sand':6,'deep-snow':6,'oil-spill':8,'torrential-downpour':8,'heatwave-event':8,'dense-fog':6,'crosswind-blast':7,'black-ice':6,'deer-crossing':5,'cow-road':5,'sheep-stampede':5,'massive-pileup':9,'wreckage-shortcut':5,'overgrown-shortcut':4,'flooded-shortcut':5,'dune-shortcut':4,'frozen-lake-shortcut':4,'suspicious-ramp':4,'broken-bridge-jump':4,'true-potential':2,'too-fast-camera':3,'mysterious-mentor':1.5,'dramatic-tailwind':2,'transformation-sequence':1,'episode-budget':1,'beam-horizon':2,'crater-road':2,'beach-episode':1,'tailwind':1,'delivery':1,'clearline':1,'hail':2,'gravel':2,'debris':3,'mustard':2,'rails':2,'bullets':1.5,'flood':2,'shooting-stars':1.2,'crosswind-event':2,'drag-challenge':1,'heat-event':2}
  });

  const WEATHER = Object.freeze([
    {id:'clear',name:'Clear',heat:0,grip:1,wind:0,wear:0},
    {id:'rain',name:'Heavy Rain',heat:-1,grip:.90,wind:.05,wear:1},
    {id:'hot',name:'Heatwave',heat:3,grip:.98,wind:0,wear:1},
    {id:'cold',name:'Cold Snap',heat:-1,grip:.96,wind:0,wear:0},
    {id:'snowfall',name:'Snowfall',heat:-2,grip:.86,wind:.06,wear:1},
    {id:'blizzard',name:'Blizzard',heat:-3,grip:.74,wind:.22,wear:2},
    {id:'fog',name:'Fog',heat:0,grip:.98,wind:0,wear:0},
    {id:'wind',name:'Strong Wind',heat:0,grip:.97,wind:.25,wear:0}
  ]);

  const WEATHER_WEIGHTS = Object.freeze({
    smooth:{clear:48,rain:18,hot:10,cold:7,fog:8,wind:7,snowfall:2,blizzard:0},
    cracked:{clear:40,rain:20,hot:8,cold:8,fog:8,wind:8,snowfall:6,blizzard:2},
    gravel:{clear:35,rain:12,hot:9,cold:7,fog:8,wind:12,snowfall:12,blizzard:5},
    dirt:{clear:35,rain:15,hot:10,cold:7,fog:8,wind:10,snowfall:10,blizzard:5},
    mud:{clear:25,rain:35,hot:5,cold:6,fog:10,wind:5,snowfall:10,blizzard:4},
    sand:{clear:45,rain:5,hot:28,cold:2,fog:3,wind:15,snowfall:2,blizzard:0},
    snow:{clear:15,rain:3,hot:1,cold:20,fog:8,wind:8,snowfall:30,blizzard:15},
    ice:{clear:15,rain:3,hot:0,cold:25,fog:10,wind:10,snowfall:22,blizzard:15},
    broken:{clear:38,rain:15,hot:9,cold:7,fog:6,wind:10,snowfall:10,blizzard:5}
  });

  const APPROACHES = Object.freeze({
    careful:{name:'Careful',power:-3,grip:1,wear:.78,note:'-3 Power, +1 Grip, 22% less wear. Safer, slower, irritatingly responsible.'},
    balanced:{name:'Balanced',power:0,grip:0,wear:1,note:'No stat or wear changes.'},
    reckless:{name:'Reckless',power:4,grip:-1,wear:1.16,note:'+4 Power, -1 Grip, 16% more wear. Faster until the invoices arrive.'}
  });

  const RIVALS = Object.freeze([
    {name:'Municipal Express'},
    {name:'Overdraft Racing'},
    {name:'Corner Office'},
    {name:'Warranty Void'}
  ]);

  const GAG_RECIPES = Object.freeze([
    {id:'fossil',name:'Mechanical Fossil',requires:{chassis:'needle-frame',engine:'reactor',tyres:'bone-wheels',gadget:'ram-plough'}},
    {id:'train',name:'Locomotive',requires:{chassis:'wobble-wagon',engine:'boiler',tyres:'rail-wheels',gadget:'ram-plough'}},
    {id:'mower',name:'Lawnmower',requires:{chassis:'soapbox',engine:'clunker',tyres:'scrap-racer',gadget:'tubular-brace'}},
    {id:'truck',name:'Truck',requires:{chassis:'hauler',engine:'heavy-diesel',tyres:'steel-belt',gadget:'bolt-armour'}},
    {id:'monster',name:'Monster Truck',requires:{chassis:'hauler',engine:'v8',tyres:'monster-treads',gadget:'exhaust-array'}},
    {id:'muscle',name:'Muscle Car',requires:{chassis:'longbody',engine:'v8',tyres:'scrap-racer',gadget:'exhaust-array'}},
    {id:'tank',name:'Tank',requires:{chassis:'armoured-tub',engine:'heavy-diesel',tyres:'track-rollers',gadget:'bolt-armour'}},
    {id:'f1',name:'F1 Car',requires:{chassis:'carbon-lite',engine:'race-block',tyres:'speed-slicks',gadget:'aero-kit'}},
    {id:'rocketcar',name:'Rocket Car',requires:{chassis:'needle-frame',engine:'rocket-drive',tyres:'speed-slicks',gadget:'rocket-pack'}},
    {id:'burger',name:'Burger Wagon',requires:{chassis:'boilerplate',engine:'clunker',tyres:'balloon-tyres',gadget:'cooling-fan'}},
    {id:'boat',name:'Boat Car',requires:{chassis:'wobble-wagon',engine:'boiler',tyres:'balloon-tyres',gadget:'cooling-fan'}},
    {id:'dune',name:'Dune Buggy',requires:{chassis:'wobble-wagon',engine:'v8',tyres:'balloon-tyres',gadget:'tubular-brace'}},
    {id:'snowmobile',name:'Snowmobile',requires:{chassis:'aero-pod',engine:'twin-cylinder',tyres:'track-rollers',gadget:'stability-fins'}},
    {id:'plane',name:'Prop Plane',requires:{chassis:'longbody',engine:'twin-cylinder',tyres:'skinny-spokes',gadget:'stability-fins'}},
    {id:'house',name:'House Car',requires:{chassis:'boilerplate',engine:'inline-four',tyres:'skinny-spokes',gadget:'tubular-brace'}},
    {id:'icecream',name:'Ice Cream Van',requires:{chassis:'hauler',engine:'inline-four',tyres:'scrap-racer',gadget:'cooling-fan'}},
    {id:'spaceship',name:'Retro Space Car',requires:{chassis:'aero-pod',engine:'rocket-drive',tyres:'balloon-tyres',gadget:'rocket-pack'}}
  ]);

  const GAG_EFFECTS = Object.freeze({
    fossil:{name:'Predatory Ram',obstacleDamageReduction:.10,obstacleMomentumReduction:.10},
    train:{name:'Full Steam Ahead',straightPowerBonus:.08},
    mower:{name:'Direct Drive',massAccelerationReduction:.15},
    truck:{name:'Built to Haul',massAccelerationReduction:.10,roughMomentumReduction:.18},
    monster:{name:'Overrun',obstacleMomentumReduction:.25},
    muscle:{name:'Hooked Up',dryStraightPowerBonus:.06},
    tank:{name:'Tracked Drive',massAccelerationReduction:.15},
    f1:{name:'Ground Effect',smoothTyreWearReduction:.10},
    rocketcar:{name:'Synchronized Ignition',heatReduction:.15},
    burger:{name:'Kitchen Cooling Loop',coolingToPowerCap:3},
    boat:{name:'Buoyant Ride',softPenaltyReduction:.20},
    dune:{name:'Dune Skimmer',sandPenaltyReduction:.45,sandGripBonus:.12},
    snowmobile:{name:'Snow Runner',snowPenaltyReduction:.35,winterGripBonus:.10},
    plane:{name:'Balanced Airframe',extraWindReduction:.30},
    house:{name:'Load Bearing',impactWearReduction:.10},
    icecream:{name:'Refrigeration Loop',engineHeatWearReduction:.20},
    spaceship:{name:'Thrust Vectoring',rocketGripPenaltyReduction:.50}
  });

  return {TUNING,GENERATIONS,SLOTS,CRITICAL,STAT_NAMES,PARTS,TRACKS,SURFACES,SIGNATURES,EVENTS,WILDCARDS,PASS_EVENTS,PASS_EVENT_WEIGHTS,FAKE_PASS_EVENTS,FAKE_PASS_EVENT_WEIGHTS,ANOMALY_WEIGHTS,WEATHER,WEATHER_WEIGHTS,ANOMALIES,RACE_RULES,APPROACHES,RIVALS,GAG_RECIPES,GAG_EFFECTS};
});

