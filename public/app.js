import {IndexedDBStorage} from './storage.js';
import {validateAttempt,summarize,isObservedPee,reminderAdvice} from './domain.js';
const $=id=>document.getElementById(id);
const labels={pee:'Pee',poop:'Poop',both:'Pee + poop',try:'Just tried',accident:'Accident'};
const defaultSettings={day:'1',interval:60,sound:false,adaptive:false,dueAt:null,remaining:null};
export async function mountApp(storage) {
 let settings={...defaultSettings}, attempts=[], draftPhoto=null, draftUrl=null, viewingUrl=null, audio=null, reminderFired=false, preparingPhoto=false;
 const error=e=>{$('error').textContent=e.message || 'Something went wrong. Please retry.';$('error').hidden=false;};
 const safe=fn=>async(...args)=>{try{$('error').hidden=true;await fn(...args);}catch(e){error(e);}};
 const persist=()=>storage.saveSettings(settings);
 function sound(){if(!settings.sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();[523.25,659.25].forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=hz;const at=audio.currentTime+i*.16;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.07,at+.015);g.gain.exponentialRampToValueAtTime(.001,at+.16);o.start(at);o.stop(at+.18);});}catch{}}
 let feedbackTimeout;
 function feedback(message,withSound=true){clearTimeout(feedbackTimeout);$('feedback-message').textContent=message;$('feedback').hidden=false;if(withSound)sound();feedbackTimeout=setTimeout(()=>$('feedback').hidden=true,5000);}
 function elapsed(at){const mins=Math.max(0,Math.floor((Date.now()-at)/60000));return mins<60?`${mins}m ago`:`${Math.floor(mins/60)}h ${mins%60}m ago`;}
 function context(){const advice=reminderAdvice(attempts,settings.interval);const last=attempts.filter(a=>a.at<=Date.now()).sort((a,b)=>a.at-b.at || (a.createdAt??0)-(b.createdAt??0)).at(-1);const pee=attempts.filter(a=>a.at<=Date.now()&&isObservedPee(a)).sort((a,b)=>a.at-b.at || (a.createdAt??0)-(b.createdAt??0)).at(-1);$('pee-context').textContent=pee?`Last observed pee ${elapsed(pee.at)}`:'No observed pee logged yet';if(last&&(!pee||last!==pee))$('pee-context').textContent+=` · Last ${last.outcome==='try'?'try (no pee)':labels[last.outcome].toLowerCase()} ${elapsed(last.at)}`;return advice;}
 function showAdvice(){const advice=context();$('advice-body').hidden=!settings.adaptive;$('advice-reason').textContent=advice.reason;const choices=$('advice-choices');choices.replaceChildren();for(const mins of advice.choices){const b=document.createElement('button');b.type='button';b.className=mins===advice.suggested?'secondary':'small';const nextIn=Math.max(1,Math.ceil((advice.anchor+mins*60000-Date.now())/60000));b.title=settings.dueAt===null?'Changes the interval; reminder stays paused or stopped':`Next check in ${nextIn} minute${nextIn===1?'':'s'}, based on the last observed pee`;b.textContent=`${mins<settings.interval?'Sooner':mins>settings.interval?'Later':'Same'} · ${mins} min${mins===advice.suggested?' · suggested':''}${settings.dueAt!==null?` (next in ${nextIn}m)`:''}`;b.onclick=safe(async()=>{const current=reminderAdvice(attempts,settings.interval);const next={...settings,interval:mins};if(next.dueAt!==null)next.dueAt=Math.max(Date.now()+60000,current.anchor+mins*60000);else if(next.remaining!==null)next.remaining=mins*60000;await storage.saveSettings(next);settings=next;$('interval').value=String(mins);reminderFired=false;showAdvice();tick();feedback(settings.dueAt===null?'Interval saved. Reminder remains paused or stopped.':'Your choice is saved. Reminder timing is based on the last observed pee, with at least one minute to the next check.',false);});choices.append(b);}}
 let adviceMinute=null;
 function tick(){
  context();const minute=Math.floor(Date.now()/60000);if(minute!==adviceMinute){adviceMinute=minute;showAdvice();}
  const ms=settings.dueAt===null?(settings.remaining??settings.interval*60000):Math.max(0,settings.dueAt-Date.now());
  const secs=Math.ceil(ms/1000);$('clock').textContent=`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
  const due=settings.dueAt!==null&&ms===0;
  $('timer-state').textContent=due?'Time for a gentle check':settings.dueAt!==null?'Reminder running':settings.remaining!==null?'Paused':'Ready when you are';
  $('timer-toggle').textContent=settings.dueAt!==null?'Pause reminder':settings.remaining!==null?'Resume reminder':'Start reminder';
  $('snooze').disabled=settings.dueAt===null;
  $('timer-hint').textContent=due?'“Let’s listen to your body. Want to try the potty?”':'“Let’s listen to your body. Do you feel pee or poop?”';
  if(due&&!reminderFired){reminderFired=true;feedback('Time for a gentle body check.');}
 }
 function nowField(){const d=new Date();$('attempt-time').value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
 function removeDraftPhoto(){if(draftUrl)URL.revokeObjectURL(draftUrl);draftPhoto=null;draftUrl=null;$('photo').value='';$('photo-preview').hidden=true;}
 async function render(){
  attempts=await storage.listAttempts();showAdvice();
  const today=attempts.filter(a=>new Date(a.at).toDateString()===new Date().toDateString());const stats=summarize(today);
  $('tries').textContent=String(today.length);$('pees').textContent=String(stats.pees);$('total-volume').textContent=stats.measured?String(stats.volume):'—';
  $('total-volume').title=`${stats.measured} of ${stats.pees} pees have volume estimates.`;
  if(stats.gaps>=3)$('pattern').textContent=`Today’s logged pee gaps: median ${stats.median} minutes (range ${stats.min}–${stats.max}; ${stats.gaps} gaps). This is an observation, not a next-go prediction.`;
  else $('pattern').textContent=`${stats.pees} pees logged today. At least 4 logged pees are needed to show spacing. Follow your child’s cues meanwhile.`;
  const list=$('history-list');list.replaceChildren();
  if(!attempts.length){const p=document.createElement('p');p.textContent='No attempts yet. You’re ready to begin.';list.append(p);return;}
  for(const a of attempts){
   const item=document.createElement('article');item.className='history-item';
   const title=document.createElement('b');title.textContent=labels[a.outcome]+(a.outcome==='accident'&&a.accidentType&&a.accidentType!=='unknown'?` (${labels[a.accidentType]})`:'')+(a.volume!==null?` · ≈ ${a.volume} mL`:'');
   const time=document.createElement('time');time.dateTime=new Date(a.at).toISOString();time.textContent=`${new Date(a.at).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} · Day ${a.day} · ${a.initiatedBy==='child'?'Child noticed':'Parent offered'}`;
   item.append(title,document.createElement('br'),time);
   if(a.note){const p=document.createElement('p');p.textContent=a.note;item.append(p);}
   const actions=document.createElement('div');actions.className='history-actions';
   if(a.hasPhoto){const b=document.createElement('button');b.className='small';b.textContent='View bowl photo';b.onclick=safe(async()=>{const blob=await storage.getPhoto(a.id);if(!blob)throw Error('Photo unavailable.');if(viewingUrl)URL.revokeObjectURL(viewingUrl);viewingUrl=URL.createObjectURL(blob);$('history-photo').src=viewingUrl;$('photo-dialog').showModal();});actions.append(b);}
   const del=document.createElement('button');del.className='small';del.textContent='Delete';del.setAttribute('aria-label',`Delete ${labels[a.outcome]} from ${time.textContent}`);del.onclick=safe(async()=>{if(!confirm('Delete this attempt and its bowl photo?'))return;await storage.deleteAttempt(a.id);await render();});actions.append(del);item.append(actions);list.append(item);
  }
 }
 $('timer-toggle').onclick=safe(async()=>{const previous={...settings};if(settings.dueAt!==null){settings.remaining=Math.max(0,settings.dueAt-Date.now());settings.dueAt=null;}else{settings.dueAt=Date.now()+(settings.remaining>0?settings.remaining:settings.interval*60000);settings.remaining=null;reminderFired=false;}try{await persist();tick();}catch(e){settings=previous;throw e;}});
 $('snooze').onclick=safe(async()=>{const next={...settings,dueAt:Date.now()+600000,remaining:null};await storage.saveSettings(next);settings=next;reminderFired=false;tick();});
 $('interval').onchange=safe(async()=>{const next={...settings,interval:Number($('interval').value),remaining:null};if(next.dueAt!==null)next.dueAt=Date.now()+next.interval*60000;await storage.saveSettings(next);settings=next;reminderFired=false;showAdvice();tick();});
 $('day').onchange=safe(async()=>{const next={...settings,day:$('day').value};await storage.saveSettings(next);settings=next;});
 $('sound').onchange=safe(async()=>{const next={...settings,sound:$('sound').checked};await storage.saveSettings(next);settings=next;if(settings.sound)sound();});
 $('adaptive').onchange=safe(async()=>{const next={...settings,adaptive:$('adaptive').checked};try{await storage.saveSettings(next);settings=next;showAdvice();}catch(e){$('adaptive').checked=settings.adaptive;throw e;}});
 $('attempt-form').onchange=()=>{const value=new FormData($('attempt-form')).get('outcome');$('accident-wrap').hidden=value!=='accident';$('volume-wrap').hidden=!['pee','both'].includes(value);if($('volume-wrap').hidden)$('volume').value='';};
 $('photo').onchange=safe(async()=>{const file=$('photo').files[0];if(!file)return;preparingPhoto=true;$('save').disabled=true;try{removeDraftPhoto();if(!file.type.startsWith('image/'))throw Error('Choose an image.');if(file.size>20*1024*1024)throw Error('Choose a photo under 20 MB.');
  let bitmap;try{bitmap=await createImageBitmap(file);}catch{throw Error('This photo format could not be opened. Try a JPEG or PNG.');}
  try{const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);draftPhoto=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.8));if(!draftPhoto)throw Error('Photo could not be prepared. Try another.');}finally{bitmap.close();}
  draftUrl=URL.createObjectURL(draftPhoto);$('draft-photo').src=draftUrl;$('photo-preview').hidden=false;
  }finally{preparingPhoto=false;$('save').disabled=false;}
 });
 $('remove-photo').onclick=removeDraftPhoto;
 $('attempt-form').onsubmit=safe(async e=>{
  e.preventDefault();if(preparingPhoto)return;$('save').disabled=true;
  try{const a=validateAttempt({schemaVersion:1,id:crypto.randomUUID(),at:new Date($('attempt-time').value).getTime(),day:settings.day,outcome:new FormData($('attempt-form')).get('outcome'),initiatedBy:$('initiated').value,accidentType:new FormData($('attempt-form')).get('outcome')==='accident'?$('accident-type').value:null,volume:$('volume').value===''?null:Number($('volume').value),note:$('note').value.trim(),hasPhoto:!!draftPhoto,createdAt:Date.now()});
   await storage.saveAttempt(a,draftPhoto);removeDraftPhoto();$('attempt-form').reset();$('volume-wrap').hidden=true;$('accident-wrap').hidden=true;nowField();
   let timerSaveError;
   if(settings.dueAt!==null&&isObservedPee(a)&&a.at>=Date.now()-settings.interval*60000&&a.at===Math.max(a.at,...attempts.filter(isObservedPee).map(p=>p.at))){const next={...settings,dueAt:a.at+settings.interval*60000,remaining:null};try{await storage.saveSettings(next);settings=next;reminderFired=false;}catch(e){timerSaveError=e;}}
   await render();tick();feedback(a.outcome==='accident'?'Let’s get comfy and clean. We’re learning.':a.outcome==='try'?'Thanks for trying. Back to play!':a.initiatedBy==='child'?'You listened to your body!':'You practiced using the potty!');
   if(timerSaveError)error(Error('Attempt saved, but the timer could not restart. Restart it manually.'));
  }finally{$('save').disabled=false;}
 });
 $('cheer').onclick=()=>feedback('You’re learning, one little step at a time!');
 $('dismiss-feedback').onclick=()=>{$('feedback').hidden=true;clearTimeout(feedbackTimeout);};
 $('close-photo').onclick=()=>$('photo-dialog').close();
 $('photo-dialog').addEventListener('close',()=>{if(viewingUrl)URL.revokeObjectURL(viewingUrl);viewingUrl=null;$('history-photo').removeAttribute('src');});
 $('export').onclick=safe(async()=>{const data={schemaVersion:1,exportedAt:new Date().toISOString(),settings,attempts:await storage.listAttempts(),photosIncluded:false};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='potty-weekend-log.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 try{settings={...defaultSettings,...await storage.getSettings()};$('day').value=settings.day;$('interval').value=String(settings.interval);$('sound').checked=settings.sound;$('adaptive').checked=settings.adaptive;await render();}catch(e){error(Error('Storage is unavailable. Logs cannot be saved; try a regular browser tab with storage enabled.'));}
 nowField();tick();setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();safe(render)();}});
 // Composition root below is the only place selecting the storage implementation.
}
mountApp(new IndexedDBStorage());
