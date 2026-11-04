/* Scrap Prix v0.7.8 — visual-only environment components.
   The simulation owns the track, traction, weather and seeded race result.
   These objects describe pictures, not physics.  Presets other than the
   nine mapped campaign tracks are DEV-only concept recipes for review. */
(function(){
  'use strict';
  const SKY={
    day:{name:'Clear blue day',top:'#7dc2dc',bottom:'#e7eedf',cloud:'#fff3dc',light:'#fff0b0',celestial:'sun'},
    urban:{name:'Urban haze',top:'#83b4c6',bottom:'#cfd8ca',cloud:'#dfe5d8',light:'#fff0ba',celestial:'sun'},
    morning:{name:'Golden morning',top:'#e8a776',bottom:'#f4deb7',cloud:'#fff0c9',light:'#ffe6a0',celestial:'sun'},
    dusk:{name:'Amber sunset',top:'#965c7b',bottom:'#f7ae75',cloud:'#e5a6a0',light:'#ffce80',celestial:'sun'},
    overcast:{name:'Overcast',top:'#839ca9',bottom:'#d2d8d3',cloud:'#e8e9df',light:'#d2dce3',celestial:'none'},
    storm:{name:'Storm ceiling',top:'#354b62',bottom:'#8493a0',cloud:'#52657a',light:'#a6b5be',celestial:'none'},
    snow:{name:'Snowy daylight',top:'#9ebdcb',bottom:'#edf1eb',cloud:'#e9f2f1',light:'#f6ffff',celestial:'none'},
    polar:{name:'Polar night',top:'#162e4d',bottom:'#7d9db5',cloud:'#8eb9c5',light:'#dde4ff',celestial:'moon'},
    night:{name:'City night',top:'#15283d',bottom:'#546a82',cloud:'#657589',light:'#f4e1ad',celestial:'moon'},
    ash:{name:'Volcanic ash',top:'#402f3a',bottom:'#b6775a',cloud:'#695157',light:'#f2a65f',celestial:'none'},
    neon:{name:'Neon violet',top:'#171b47',bottom:'#66437e',cloud:'#5d5689',light:'#e595ff',celestial:'moon'},
    space:{name:'Deep space',top:'#060e23',bottom:'#172542',cloud:'#263b72',light:'#e4edf7',celestial:'stars'},
    moon:{name:'Lunar black',top:'#050913',bottom:'#111827',cloud:'#19263d',light:'#c4dfff',celestial:'earth'},
    underwater:{name:'Deep blue ocean',top:'#07375a',bottom:'#2184a0',cloud:'#54abc0',light:'#b4f7ed',celestial:'rays'},
    alien:{name:'Alien amethyst',top:'#443078',bottom:'#d07eac',cloud:'#b489c1',light:'#f3d7d6',celestial:'planet'},
    fantasy:{name:'Storybook daylight',top:'#729fc1',bottom:'#e9d6bb',cloud:'#f5e1c9',light:'#fff1bd',celestial:'sun'}
  };
  const ROAD={
    asphalt:{name:'Everyday asphalt',fill:'#4b5b61',line:'#f5ecd9',curb:'#e2c984',edge:'#334a51',markings:'dashes',shoulder:'#9caa9f'},
    streets:{name:'City streets',fill:'#414e56',line:'#f6d88e',curb:'#bbc4b9',edge:'#243d46',markings:'double',shoulder:'#9c9b96'},
    drag:{name:'Drag-strip rubber',fill:'#343b43',line:'#ffdfb0',curb:'#f4ce4c',edge:'#28323a',markings:'drag',shoulder:'#9b9a8f'},
    grandprix:{name:'Grand Prix tarmac',fill:'#383d49',line:'#f3eee5',curb:'#e45c52',edge:'#25333a',markings:'dashes',shoulder:'#75a690'},
    circuit:{name:'Club circuit',fill:'#44494b',line:'#f3e8cf',curb:'#e7bf77',edge:'#293d3a',markings:'dashes',shoulder:'#90a58c'},
    runway:{name:'Runway concrete',fill:'#777e7b',line:'#fff6ce',curb:'#b7a57e',edge:'#555e5b',markings:'runway',shoulder:'#a5b6a9'},
    gravel:{name:'Gravel stage',fill:'#8b7865',line:'#baa68c',curb:'#8a835d',edge:'#5e6657',markings:'tracks',shoulder:'#93a07e'},
    dirt:{name:'Packed dirt',fill:'#936c4a',line:'#bf9063',curb:'#777250',edge:'#70533e',markings:'tracks',shoulder:'#8c9e65'},
    mud:{name:'Deep mud',fill:'#63584d',line:'#897562',curb:'#706b49',edge:'#493e38',markings:'tracks',shoulder:'#6e8368'},
    sand:{name:'Sand route',fill:'#d4af77',line:'#f3d39c',curb:'#a78558',edge:'#aa885c',markings:'tracks',shoulder:'#dfbd83'},
    snow:{name:'Packed snow',fill:'#b6d0d7',line:'#eff6ec',curb:'#f9faf1',edge:'#809fad',markings:'tracks',shoulder:'#e7edf0'},
    ice:{name:'Frozen ice',fill:'#7eaebf',line:'#b7e6eb',curb:'#eef8fc',edge:'#56899d',markings:'cracks',shoulder:'#c3dde9'},
    broken:{name:'Broken concrete',fill:'#797975',line:'#b6b09c',curb:'#b8a27d',edge:'#514d46',markings:'cracks',shoulder:'#8f8271'},
    metal:{name:'Raised metal track',fill:'#475868',line:'#9cd0d7',curb:'#f8b845',edge:'#243743',markings:'metal',shoulder:'#152d45'},
    cobble:{name:'Medieval cobbles',fill:'#74767a',line:'#a6a5a1',curb:'#aaa39a',edge:'#514b4d',markings:'cobble',shoulder:'#baa585'},
    lunar:{name:'Lunar regolith',fill:'#9da2a6',line:'#cbd5d6',curb:'#8d98a8',edge:'#626976',markings:'tracks',shoulder:'#727d8a'},
    neon:{name:'Smart neon highway',fill:'#263342',line:'#54e4f3',curb:'#fa6ee7',edge:'#141d37',markings:'double',shoulder:'#414d71'},
    toy:{name:'Toy-floor raceway',fill:'#ba6e58',line:'#f8d3a2',curb:'#f1dc62',edge:'#624c48',markings:'dashes',shoulder:'#cda87c'},
    volcanic:{name:'Ash-black road',fill:'#45434a',line:'#efa15b',curb:'#e07042',edge:'#211f27',markings:'cracks',shoulder:'#75574e'}
  };
  // Profile keys select distinctive *landscape* art, independent of road and sky.
  const LAND={
    city:['Downtown skyline','city','#8fa4ad','#496678','#8ba09c','#1b4354'],
    street:['Backstreets & shops','suburb','#c6b3a2','#826b67','#9e9d92','#3e5358'],
    drag:['Drag paddock','paddock','#b9b2a1','#687d82','#aaa897','#344c54'],
    f1:['Grand Prix complex','grandprix','#a4c0b5','#638b82','#8ba99a','#274b52'],
    circuit:['Old racing circuit','circuit','#9cafac','#59786b','#90ab81','#385c51'],
    airstrip:['Airfield & hangars','airfield','#a3b9b9','#718a8e','#9eae9f','#394d59'],
    factory:['Industrial works','industry','#9fa8a2','#6d7273','#8a8980','#3e464b'],
    rooftops:['Skyscraper rooftops','rooftops','#97b3b8','#577e93','#8ba7b0','#2e4d60'],
    sewer:['Storm channel','sewer','#476770','#294c59','#73877d','#143644'],
    rally:['Rally hillside','rally','#98b59c','#547d64','#899c70','#305748'],
    forest:['Deep woodland','forest','#80a88c','#396c59','#698b65','#22473b'],
    beach:['Seafront & palms','beach','#8bbdc4','#3897a7','#e4c78a','#316d72'],
    desert:['Sandstone mesas','desert','#d8ad81','#ad7659','#deb680','#7e5f51'],
    snow:['Snowbound valley','snow','#c3d5db','#8eafc4','#e3eef0','#486579'],
    ice:['Glacier field','ice','#99cdd4','#5d9eb6','#c9e7ef','#357d94'],
    mountains:['Alpine mountains','mountains','#a6b8ba','#5b8694','#a9b4a1','#3a6171'],
    offroad:['Rocky wilderness','offroad','#b9a185','#91765e','#a29572','#6a5345'],
    jungle:['Rainforest canopy','jungle','#68a784','#306652','#658b62','#1f4d43'],
    volcano:['Volcanic caldera','volcano','#ad7770','#6b5254','#77645c','#493b41'],
    swamp:['Foggy marsh','swamp','#93a18b','#607b6e','#8e9885','#384e4d'],
    pileup:['Wrecked motorway','pileup','#abb0a6','#797d79','#9d9587','#444e53'],
    wasteland:['Dead badlands','wasteland','#bc9d79','#82775e','#ac9d81','#66584f'],
    raiders:['Fortified raider outpost','raiders','#b99870','#815d51','#ae9169','#563d3b'],
    junkyard:['Scrap mountains','junkyard','#b0a58f','#776957','#95846c','#4d4c48'],
    warzone:['Bombed-out ruins','warzone','#969c98','#626b69','#89867a','#424c4c'],
    haunted:['Haunted cemetery','haunted','#71838d','#3b525b','#596c69','#283c48'],
    prehistoric:['Primordial valley','prehistoric','#8bb78d','#4b8558','#83a16d','#345c43'],
    space:['Orbital skyway','space','#384871','#1f3156','#162844','#6e91bc'],
    moon:['Lunar surface','moon','#9caebd','#67798d','#858fa1','#434e61'],
    underwater:['Submerged ocean','underwater','#50a2af','#247a9b','#498da0','#155a75'],
    utopia:['Utopian megacity','utopia','#c6e6e0','#86b7bd','#b9d7d1','#4b8292'],
    cyber:['Neon megacity','cyber','#6b6697','#35345f','#4c4273','#1b244e'],
    miniature:['Giant meadow','miniature','#a4c492','#5e9668','#b1c18b','#37644b'],
    toyroom:['Household floor','toyroom','#e9b992','#bd846f','#caa481','#6c4e58'],
    alien:['Alien wilds','alien','#af8eb9','#755ca3','#b68ca7','#504776'],
    medieval:['Castle & village','medieval','#c5b7a1','#8b8d83','#b9a58b','#5f5e5c']
  };
  const LANDSCAPES=Object.fromEntries(Object.entries(LAND).map(([id,[name,profile,far,near,ground,ink]])=>[id,{name,profile,far,near,ground,ink}]));
  const SCENERY={
    lamps:'Street lamps',shops:'Shop fronts',starting:'Starting lights',pits:'Pit wall',tyres:'Tyre walls',cones:'Runway cones',pipes:'Pipes & towers',cranes:'Construction cranes',drains:'Sewer fixtures',rally:'Rally banners',pines:'Pine trees',palms:'Beach palms',cactus:'Cacti',snowbanks:'Snow drifts',crystals:'Ice crystals',guardrails:'Mountain guardrails',boulders:'Rock boulders',vines:'Tropical vines',lava:'Lava vents',reeds:'Marsh reeds',wrecks:'Crashed cars',ruins:'Abandoned wreckage',spikes:'Raider barricades',scrap:'Scrap piles',bunkers:'Concrete bunkers',gravestones:'Crooked gravestones',ferns:'Giant ferns',beacons:'Space markers',lunar:'Lunar antennas',coral:'Coral formations',utopia:'Smart pylons',neon:'Neon billboards',grass:'Giant blades of grass',toys:'Oversized toys',mushrooms:'Alien mushrooms',banners:'Medieval standards'
  };
  const ATMOS={
    clean:{name:'Clean daylight',overlay:null},
    warm:{name:'Warm sunshine',overlay:'rgba(244,175,89,.06)'},
    haze:{name:'City haze',overlay:'rgba(176,191,178,.09)'},
    evening:{name:'Evening glow',overlay:'rgba(238,131,98,.09)'},
    cold:{name:'Cold light',overlay:'rgba(180,221,248,.07)'},
    fog:{name:'Low mist',overlay:'rgba(198,214,211,.13)'},
    smoke:{name:'Smoky air',overlay:'rgba(91,73,69,.13)'},
    heat:{name:'Dry heat',overlay:'rgba(255,179,94,.09)'},
    eerie:{name:'Eerie twilight',overlay:'rgba(73,101,118,.11)'},
    neon:{name:'Neon glow',overlay:'rgba(138,77,180,.12)'},
    abyss:{name:'Vacuum darkness',overlay:'rgba(30,42,74,.09)'},
    submerged:{name:'Underwater caustics',overlay:'rgba(27,155,190,.08)'},
    alien:{name:'Alien glow',overlay:'rgba(206,128,185,.08)'}
  };
  // All 36 requested creative locations, intentionally distinct. Future art passes
  // refine their assets; adding a recipe alone does NOT add a gameplay track.
  const ENTRIES=[
    ['city','City','streets','city','urban','lamps','haze'],
    ['street','Street / Urban','streets','street','morning','shops','clean'],
    ['drag','Drag Strip','drag','drag','day','starting','clean'],
    ['rally','Rally','gravel','rally','overcast','rally','clean'],
    ['f1','F1','grandprix','f1','day','pits','clean'],
    ['circuit','Circuit','circuit','circuit','day','tyres','clean'],
    ['airstrip','Airstrip','runway','airstrip','day','cones','clean'],
    ['forest','Forest','dirt','forest','morning','pines','haze'],
    ['beach','Beach','sand','beach','day','palms','warm'],
    ['desert','Desert','sand','desert','dusk','cactus','heat'],
    ['snow','Snow','snow','snow','snow','snowbanks','cold'],
    ['ice','Ice','ice','ice','polar','crystals','cold'],
    ['mountains','Mountains','asphalt','mountains','day','guardrails','clean'],
    ['offroad','Off-Road','mud','offroad','overcast','boulders','haze'],
    ['pileup','Pile-up','broken','pileup','overcast','wrecks','smoke'],
    ['prehistoric','Prehistoric','dirt','prehistoric','morning','ferns','warm'],
    ['jungle','Jungle','mud','jungle','overcast','vines','haze'],
    ['wasteland','Wastelands','broken','wasteland','ash','ruins','smoke'],
    ['raiders','Raider Badlands','sand','raiders','dusk','spikes','heat'],
    ['space','Space','metal','space','space','beacons','abyss'],
    ['moon','Moon','lunar','moon','moon','lunar','abyss'],
    ['underwater','Underwater Tunnel','metal','underwater','underwater','coral','submerged'],
    ['junkyard','Junkyard','broken','junkyard','morning','scrap','haze'],
    ['warzone','War Zone','broken','warzone','storm','bunkers','smoke'],
    ['utopia','Future City','neon','utopia','day','utopia','clean'],
    ['cyber','Neon Future','neon','cyber','neon','neon','neon'],
    ['miniature','Mouse-Sized Meadow','dirt','miniature','morning','grass','warm'],
    ['volcano','Volcano','volcanic','volcano','ash','lava','smoke'],
    ['swamp','Swamp','mud','swamp','overcast','reeds','fog'],
    ['haunted','Haunted Graveyard','cobble','haunted','night','gravestones','eerie'],
    ['factory','Factory','broken','factory','overcast','pipes','smoke'],
    ['sewer','Storm Channel','broken','sewer','storm','drains','fog'],
    ['rooftops','Construction Rooftops','metal','rooftops','morning','cranes','clean'],
    ['toyroom','Toy Room','toy','toyroom','morning','toys','warm'],
    ['alien','Alien Planet','sand','alien','alien','mushrooms','alien'],
    ['medieval','Medieval Castle','cobble','medieval','fantasy','banners','clean']
  ];
  const RECIPES=Object.freeze(Object.fromEntries(ENTRIES.map(([id,name,road,landscape,sky,scenery,atmosphere])=>[id,Object.freeze({id,name,road,landscape,sky,scenery,atmosphere})])));
  const TRACK_RECIPES=Object.freeze({
    airstrip:'airstrip',f1:'f1',street:'street',oval:'circuit',endurance:'circuit',drag:'drag',rally:'rally',offroad:'offroad',rubble:'pileup',
    straight:'airstrip',corners:'city',heat:'desert',harbour:'beach',ring:'forest',rubble_scene:'pileup'
  });
  const PHYSICAL_SURFACES=Object.freeze({cracked:'asphalt',gravel:'gravel',dirt:'dirt',mud:'mud',sand:'sand',snow:'snow',ice:'ice',broken:'broken'});
  const KINDS=Object.freeze({road:ROAD,landscape:LANDSCAPES,sky:SKY,scenery:SCENERY,atmosphere:ATMOS});
  const SLOTS=Object.freeze(['road','landscape','sky','scenery','atmosphere']);
  function legal(kind,value){return typeof value==='string'&&Object.prototype.hasOwnProperty.call(KINDS[kind],value);}
  function resolve({track='airstrip',surface=null,preset=null,overrides=null}={}){
    const id=RECIPES[preset]?preset:(TRACK_RECIPES[track]||'airstrip');
    const base=RECIPES[id];
    const chosen={};
    for(const slot of SLOTS)chosen[slot]=legal(slot,overrides?.[slot])?overrides[slot]:base[slot];
    // Actual campaign surface affects visuals, not the other way round.
    // A selected DEV preview has no gameplay surface and preserves independent slots.
    if(!overrides?.road&&surface&&PHYSICAL_SURFACES[surface])chosen.road=PHYSICAL_SURFACES[surface];
    const env={id,name:base.name,components:chosen,road:ROAD[chosen.road],landscape:LANDSCAPES[chosen.landscape],sky:SKY[chosen.sky],scenery:chosen.scenery,atmosphere:ATMOS[chosen.atmosphere]};
    return env;
  }
  function validate(){
    const errors=[];
    for(const [id,recipe] of Object.entries(RECIPES))for(const slot of SLOTS)if(!legal(slot,recipe[slot]))errors.push(`${id}: missing ${slot}=${recipe[slot]}`);
    for(const track of ['airstrip','f1','street','oval','endurance','drag','rally','offroad','rubble'])if(!RECIPES[TRACK_RECIPES[track]])errors.push(`campaign ${track}: no recipe`);
    return errors;
  }
  Object.freeze(SKY);Object.freeze(ROAD);Object.freeze(LANDSCAPES);Object.freeze(SCENERY);Object.freeze(ATMOS);
  window.ScrapEnvironments=Object.freeze({SKY,ROAD,LANDSCAPES,SCENERY,ATMOS,RECIPES,TRACK_RECIPES,PHYSICAL_SURFACES,SLOTS,KINDS,resolve,validate});
})();
