
/* Scrap Prix v0.4.0 visual gag recipes. Campaign item IDs map into these visual
   families through vehicle-art.js; the bodywork appears only on the exact four. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ScrapVehicleCombos=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const RECIPES=Object.freeze([
    Object.freeze({id:'train',name:'Locomotive',requires:Object.freeze({chassis:'wagon',engine:'boiler',tyres:'rail',gadget:'plough'}),freeSlot:null,note:'Wobble Wagon + Steam Boiler + Rail Wheels + Ram Plough.'}),
    Object.freeze({id:'fossil',name:'Mechanical Fossil',requires:Object.freeze({chassis:'needle',engine:'reactor',tyres:'bone',gadget:'plough'}),freeSlot:null,note:'Needle Frame + Reactor + Bone Wheels + Ram Plough.'}),
    Object.freeze({id:'mower',name:'Lawnmower',requires:Object.freeze({chassis:'soapbox',engine:'motor',tyres:'road',gadget:'handle'}),freeSlot:null,note:'Soapbox Frame + Clunker Motor + Scrap Racer Wheels + Tubular Brace.'}),
    Object.freeze({id:'truck',name:'Truck',requires:Object.freeze({chassis:'hauler',engine:'diesel',tyres:'groove',gadget:'armour'}),freeSlot:null,note:'Hauler Frame + Heavy Diesel + Steel-belt Survival + Bolt-on Armour.'}),
    Object.freeze({id:'monster',name:'Monster Truck',requires:Object.freeze({chassis:'hauler',engine:'v8',tyres:'monster',gadget:'exhaust'}),freeSlot:null,note:'Hauler Frame + Exposed V8 + Monster Treads + Exhaust Array.'}),
    Object.freeze({id:'muscle',name:'Muscle Car',requires:Object.freeze({chassis:'longbody',engine:'v8',tyres:'road',gadget:'exhaust'}),freeSlot:null,note:'Longbody Frame + Exposed V8 + Scrap Racer Wheels + Exhaust Array.'}),
    Object.freeze({id:'tank',name:'Tank',requires:Object.freeze({chassis:'tub',engine:'diesel',tyres:'track',gadget:'armour'}),freeSlot:null,note:'Armoured Tub + Heavy Diesel + Track Rollers + Bolt-on Armour.'}),
    Object.freeze({id:'f1',name:'F1 Car',requires:Object.freeze({chassis:'gt',engine:'race',tyres:'speed',gadget:'wing'}),freeSlot:null,note:'Carbon-Lite Monocoque + Race Block + Speed Slicks + Aero Kit.'}),
    Object.freeze({id:'rocketcar',name:'Rocket Car',requires:Object.freeze({chassis:'needle',engine:'rocket',tyres:'speed',gadget:'rockets'}),freeSlot:null,note:'Needle Frame + Rocket Drivetrain + Speed Slicks + Rocket Pack.'}),
    Object.freeze({id:'burger',name:'Burger Wagon',requires:Object.freeze({chassis:'brick',engine:'motor',tyres:'balloon',gadget:'fan'}),freeSlot:null,note:'Boilerplate Chassis + Clunker Motor + Balloon Tyres + Cooling Fan.'}),
    Object.freeze({id:'boat',name:'Boat Car',requires:Object.freeze({chassis:'wagon',engine:'boiler',tyres:'balloon',gadget:'fan'}),freeSlot:null,note:'Wobble Wagon + Steam Boiler + Balloon Tyres + Cooling Fan.'}),
    Object.freeze({id:'dune',name:'Dune Buggy',requires:Object.freeze({chassis:'wagon',engine:'v8',tyres:'balloon',gadget:'handle'}),freeSlot:null,note:'Wobble Wagon + Exposed V8 + Balloon Tyres + Tubular Brace.'}),
    Object.freeze({id:'snowmobile',name:'Snowmobile',requires:Object.freeze({chassis:'pod',engine:'twin',tyres:'track',gadget:'fins'}),freeSlot:null,note:'Aero Pod Frame + Twin Cylinder + Track Rollers + Stability Fins.'}),
    Object.freeze({id:'plane',name:'Prop Plane',requires:Object.freeze({chassis:'longbody',engine:'twin',tyres:'spokes',gadget:'fins'}),freeSlot:null,note:'Longbody Frame + Twin Cylinder + Skinny Spokes + Stability Fins.'}),
    Object.freeze({id:'house',name:'House Car',requires:Object.freeze({chassis:'brick',engine:'inline4',tyres:'spokes',gadget:'handle'}),freeSlot:null,note:'Boilerplate Chassis + Inline Four + Skinny Spokes + Tubular Brace.'}),
    Object.freeze({id:'icecream',name:'Ice Cream Van',requires:Object.freeze({chassis:'hauler',engine:'inline4',tyres:'road',gadget:'fan'}),freeSlot:null,note:'Hauler Frame + Inline Four + Scrap Racer Wheels + Cooling Fan.'}),
    Object.freeze({id:'spaceship',name:'Retro Space Car',requires:Object.freeze({chassis:'pod',engine:'rocket',tyres:'balloon',gadget:'rockets'}),freeSlot:null,note:'Aero Pod Frame + Rocket Drivetrain + Balloon Tyres + Rocket Pack.'})
  ]);
  function matches(models){if(!models||typeof models!=='object')return[];return RECIPES.filter(recipe=>Object.entries(recipe.requires).every(([slot,id])=>models[slot]===id));}
  function resolve(models){const hits=matches(models);return hits.length===1?hits[0]:null;}
  return Object.freeze({RECIPES,matches,resolve});
});

