/**
 * Returns a promise preparing our key-value store on IndexedDB.
 *
 * @return {Promise.<IDBDatabase>} Promise to the IndexedDB database.
 */
function prepareDb_() {
    return new Promise(function(resolve, reject) {
      if (self.indexedDB) {
        let req = self.indexedDB.open('db', 1);
        if (req) {
          req.onerror = (event) => reject(event);
          req.onsuccess = function(event) {
            let db = event.target.result;
            resolve(db);
          };
          req.onupgradeneeded = function(event) {
            let db = event.target.result;
            db.createObjectStore('kv');
          };
        } else {
          reject('IndexedDB open failed.');
        }
      } else {
        reject('IndexedDB not available.');
      }
    });
  }
  
  /**
   * Returns a promise for loading a value from our key-value store on
   * IndexedDB.
   * Falls back to local storage if IndexedDB is unavailable.
   *
   * @param {string} key The key-value pair key.
   * @return {Promise.<Object>} Promise to the key-value pair value.
   */
  export function loadFromStore(key) {
    return new Promise(function(resolve, reject) {
      if (self.indexedDB) {
        let dbPromise = prepareDb_();
        dbPromise.then((db) => {
          db.onerror = (event) => reject(event);
          let get = db.transaction('kv', 'readonly').objectStore('kv').get(key);
          get.onsuccess = (event) => {
            if (event.target.result !== undefined) {
              resolve(event.target.result);
            } else {
              reject(new Error(`Key not found: ${key}`));
            }
          };
        });
      } else {
        resolve(JSON.parse(localStorage.getItem(key)));
      }
    });
  }
  
  /**
   * Returns a promise for saving a value onto our key-value store on IndexedDB.
   * Falls back to local storage if IndexedDB is unavailable.
   *
   * @param {string} key The key-value pair key.
   * @param {Object} value The key-value pair value.
   * @return {Promise} Promise to storage success.
   */
  export function saveToStore(key, value) {
    return new Promise(function(resolve, reject) {
      if (self.indexedDB) {
        let dbPromise = prepareDb_();
        dbPromise.then((db) => {
          db.onerror = (event) => reject(event);
          let put = db.transaction('kv', 'readwrite')
              .objectStore('kv').put(value, key);
          put.onsuccess = () => resolve();
        });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    });
  }