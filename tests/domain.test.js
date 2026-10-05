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
