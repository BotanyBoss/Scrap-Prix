/* Temporary anonymous dialogue HUD for layout review. No characters, sound or gameplay changes. */
(function dialogueModule(){
  'use strict';
  // Presentation only. No random rolls, voices, characters or gameplay mutations.
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const GARAGE=Object.freeze({
    start:{id:'garage-start',speaker:'GARAGE / TEST',channel:'WORKSHOP',kind:'garage',text:'Placeholder garage greeting. This is where a character could comment on your next race.'},
    return:{id:'garage-return',speaker:'GARAGE / TEST',channel:'WORKSHOP',kind:'garage',text:'Placeholder post-race comment. The garage scene remains visible behind this message.'},
    replace:{id:'garage-replace',speaker:'GARAGE / TEST',channel:'PART REPLACED',kind:'garage',text:'The replacement is fitted. This short message previews a reaction to your latest purchase.'},
    tune:{id:'garage-tune',speaker:'GARAGE / TEST',channel:'TUNING',kind:'garage',text:'Upgrade recorded. The dialogue panel can react to workshop decisions without interrupting them.'},
    bodge:{id:'garage-bodge',speaker:'GARAGE / TEST',channel:'EMERGENCY BODGE',kind:'garage',text:'Emergency patch confirmed. This is only a layout test, not a finished line.'},
    repair:{id:'garage-repair',speaker:'GARAGE / TEST',channel:'REPAIR',kind:'garage',text:'Repairs completed. The speaker panel is temporary and can be dismissed at any time.'},
    bounty:{id:'garage-bounty',speaker:'GARAGE / TEST',channel:'BOUNTY BOARD',kind:'garage',text:'A contract has changed. This panel can react without covering the Bounty Board.'}
  });
  const RACE=Object.freeze({
    opening:{id:'race-start',speaker:'RADIO / TEST',channel:'TRACK RADIO',kind:'radio',text:'Race radio subtitle preview. Short lines stay near the edge of the track view.'},
    hazard:{id:'race-hazard',speaker:'RADIO / TEST',channel:'TRACK HAZARD',kind:'radio',text:'Hazard update received. This text is a placeholder for contextual race commentary.'},
    anomaly:{id:'race-anomaly',speaker:'RADIO / TEST',channel:'UNUSUAL EVENT',kind:'radio',text:'Unexpected event detected. The radio panel stays clear of the event announcement.'},
    pass:{id:'race-overtake',speaker:'RIVAL / TEST',channel:'RIVAL RADIO',kind:'rival',text:'Placeholder rival reaction following an overtake. There is no character attached yet.'},
    fake:{id:'race-comeback',speaker:'RIVAL / TEST',channel:'RIVAL RADIO',kind:'rival',text:'Placeholder comeback message. This uses the same subtitle area, not a second box.'},
    finish:{id:'race-finish',speaker:'RADIO / TEST',channel:'FINISH',kind:'radio',text:'Race concluded. A future character could react to your finishing position.'}
  });
  function garage(kind){return GARAGE[kind]||null;}
  function race({step,special,fake,choice,cinematic}={}){
    if(!step||choice||cinematic)return null;
    if(special)return {...RACE.pass,id:'pass:'+special.id};
    if(fake)return {...RACE.fake,id:'fake:'+fake.id};
    if(step.id==='opening')return RACE.opening;
    if(step.id==='finish')return RACE.finish;
    if(step.sourceKind==='anomaly'||step.sourceKind==='chain')return {...RACE.anomaly,id:'anomaly:'+step.sourceId};
    if(step.sourceKind==='signature')return {...RACE.hazard,id:'hazard:'+step.sourceId};
    return null;
  }
  function markup(cue,where='race'){
    const id=where==='garage'?'garage-dialogue':'race-dialogue',cls=where==='garage'?'garage-radio-dock':'race-radio-dock';
    return `<aside id="${id}" class="${cls} dialogue-dock" ${cue?'':'hidden'} aria-label="${where==='garage'?'Garage dialogue preview':'Race dialogue preview'}" aria-live="polite" aria-atomic="true"${cue?' data-cue="'+esc(cue.id)+'"':''}>${cue?body(cue):''}</aside>`;
  }
  function body(cue){
    return `<div class="dialogue-face" data-role="${esc(cue.kind)}" aria-hidden="true"><span class="dialogue-face-shape"></span><small>?</small></div>
       <div class="dialogue-copy"><div class="dialogue-speaker"><strong>${esc(cue.speaker)}</strong><span>${esc(cue.channel)}</span></div>
       <p>${esc(cue.text)}</p><small class="dialogue-test-tag">DIALOGUE LAYOUT TEST · NO VOICE</small></div>
       <button class="dialogue-close" data-action="dismiss-dialogue" aria-label="Dismiss dialogue preview" title="Dismiss">×</button>`;
  }
  function update(id,cue){
    const root=document.getElementById(id);if(!root)return;
    const key=cue?.id||'';
    if(root.dataset.cue===key)return;
    root.dataset.cue=key;root.hidden=!cue;
    root.innerHTML=cue?body(cue):'';
  }
  window.ScrapDialogueUI={garage,race,markup,update};
})();
