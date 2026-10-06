import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize,validateAttempt} from '../public/domain.js';
const at=(day,hour)=>new Date(2026,9,day,hour).getTime();
test('spacing excludes overnight gaps and non-pee events; unknown volumes do not count as zero',()=>{
 const result=summarize([{outcome:'pee',at:at(4,9),volume:25},{outcome:'try',at:at(4,10),volume:null},{outcome:'pee',at:at(4,11),volume:null},{outcome:'accident',at:at(4,12),volume:null},{outcome:'both',at:at(4,14),volume:null},{outcome:'pee',at:at(5,8),volume:50}]);
 assert.deepEqual(result,{pees:4,gaps:2,median:150,min:120,max:180,volume:75,measured:2});
});
test('empty history gives no invented pattern',()=>{assert.equal(summarize([]).median,null);});
test('attempt validation rejects future time and measurements for no-output events',()=>{
 const a={outcome:'try',at:Date.now(),volume:null,note:'',initiatedBy:'parent'};
 assert.equal(validateAttempt(a),a);assert.throws(()=>validateAttempt({...a,volume:25}));assert.throws(()=>validateAttempt({...a,at:Date.now()+120000}));assert.throws(()=>validateAttempt({...a,outcome:'pee',volume:-1}));
});

import {isObservedPee, reminderAdvice} from '../public/domain.js';
const noon=new Date(2026,9,6,12).getTime();
const event=(mins,outcome,volume=null,extra={})=>({at:noon+mins*60000,outcome,volume,...extra});
test('advice distinguishes known pee accidents from legacy or poop accidents',()=>{
 assert.equal(isObservedPee(event(0,'accident')),false);
 assert.equal(isObservedPee(event(0,'accident',null,{accidentType:'poop'})),false);
 const pee=event(0,'accident',null,{accidentType:'pee'});
 assert.equal(isObservedPee(pee),true);
 assert.equal(reminderAdvice([pee],60,noon).suggested,50);
});
test('no-output attempt retains the actual pee anchor and overdue try suggests earlier',()=>{
 const r=reminderAdvice([event(65,'try'),event(0,'pee',100)],60,noon+65*60000);
 assert.equal(r.anchor,noon);assert.equal(r.suggested,50);
});
test('two recent no-output attempts suggest more space without moving the pee anchor',()=>{
 const r=reminderAdvice([event(0,'pee',100),event(10,'try'),event(20,'try')],60,noon+20*60000);
 assert.equal(r.suggested,70);assert.equal(r.anchor,noon);
});
test('small-output hypothesis needs two earlier positive pure-pee measurements',()=>{
 assert.equal(reminderAdvice([event(0,'pee',100),event(30,'pee',5)],60,noon+30*60000).direction,'same');
 const r=reminderAdvice([event(0,'pee',100),event(30,'pee',120),event(60,'pee',5)],60,noon+60*60000);
 assert.equal(r.direction,'sooner');assert.match(r.reason,/does not tell us how much remains/);
 assert.equal(reminderAdvice([event(0,'both',100),event(30,'pee',120),event(60,'pee',5)],60,noon+60*60000).direction,'same');
});
test('unknown or zero volume does not become a small-output trigger',()=>{
 for(const volume of [null,0])assert.equal(reminderAdvice([event(0,'pee',100),event(30,'pee',120),event(60,'pee',volume)],60,noon+60*60000).direction,'same');
});
test('stale and previous-day accidents do not tune today’s reminders',()=>{
 const a=event(0,'accident',null,{accidentType:'pee'});
 assert.equal(reminderAdvice([a],60,noon+121*60000).direction,'same');
 assert.equal(reminderAdvice([a],60,noon+24*60*60000).lastPee,undefined);
});
test('choices are bounded, unique, and future records are excluded',()=>{
 assert.deepEqual(reminderAdvice([],20,noon).choices,[20,30]);
 assert.deepEqual(reminderAdvice([],120,noon).choices,[110,120]);
 assert.equal(reminderAdvice([event(1,'pee',100)],60,noon).lastPee,undefined);
});
test('known pee accidents participate in observed spacing without inventing a volume',()=>{
 const r=summarize([event(0,'pee',100),event(30,'accident',null,{accidentType:'pee'}),event(60,'accident',null,{accidentType:'poop'})]);
 assert.equal(r.pees,2);assert.equal(r.gaps,1);assert.equal(r.median,30);assert.equal(r.measured,1);
});
