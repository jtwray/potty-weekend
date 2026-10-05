/** Storage port: listAttempts, saveAttempt(record, optionalBlob), deleteAttempt,
 * getPhoto, getSettings, saveSettings. All return Promises. UI receives an adapter.
 * Photos and attempt metadata commit atomically. Versioned IDs survive a future migration.
 */
export class IndexedDBStorage {
  constructor(name='potty-weekend-v1') { this.name=name; }
  async open() {
    if (this.db) return this.db;
    this.db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open(this.name,1);
      r.onupgradeneeded=()=>{ for(const name of ['attempts','photos','settings']) r.result.createObjectStore(name,{keyPath:'id'}); };
      r.onsuccess=()=>resolve(r.result);
      r.onerror=()=>reject(r.error);
      r.onblocked=()=>reject(Error('Close other open copies of this app and retry.'));
    });
    return this.db;
  }
  async transaction(stores, mode, operation) {
    const db=await this.open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(stores,mode); let result;
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error || Error('Could not save.'));
      tx.onabort=()=>reject(tx.error || Error('Save canceled.'));
      try {operation(tx,value=>{result=value;});} catch(e) {tx.abort();reject(e);}
    });
  }
  listAttempts() {return this.transaction(['attempts'],'readonly',(tx,done)=>{tx.objectStore('attempts').getAll().onsuccess=e=>done(e.target.result.sort((a,b)=>b.at-a.at));});}
  saveAttempt(record,photo) {return this.transaction(['attempts','photos'],'readwrite',(tx)=>{tx.objectStore('attempts').put(record);if(photo) tx.objectStore('photos').put({id:record.id,blob:photo});});}
  deleteAttempt(id) {return this.transaction(['attempts','photos'],'readwrite',tx=>{tx.objectStore('attempts').delete(id);tx.objectStore('photos').delete(id);});}
  getPhoto(id) {return this.transaction(['photos'],'readonly',(tx,done)=>{tx.objectStore('photos').get(id).onsuccess=e=>done(e.target.result?.blob??null);});}
  getSettings() {return this.transaction(['settings'],'readonly',(tx,done)=>{tx.objectStore('settings').get('main').onsuccess=e=>done(e.target.result??null);});}
  saveSettings(settings) {return this.transaction(['settings'],'readwrite',tx=>tx.objectStore('settings').put({...settings,id:'main'}));}
}
