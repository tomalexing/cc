/**
 * Returns a promise that succeeds automatically after a specified timeout.
 *
 * @param {number} timeout The timeout, in milliseconds.
 * @return {Promise} The constructed promise.
 */
export function wait(timeout) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }
  
  /**
   * Returns a promise that executes the callback after the provided promise,
   * regardless of whether it succeedd or failed.
   *
   * @param {Promise} promise The promise to execute after.
   * @param {function} callback The callback to execute.
   * @return {Promise} The constructed promise.
   */
  export function after(promise, callback) {
    return promise.then(callback, callback);
  }
  
/**
   * Returns a promise for fetching a JSON URL, with customizable error string
   * and timeout.
   *
   * @param {string} url The URL to fetch.
   * @param {string} errorString The error string to use for any failures.
   * @param {number} timeout The timeout to use for the request.
   * @param {method} method REST method
   * @return {Promise.<Object>} The constructed promise.
   */
  export function fetchJsonPost(url, payload, errorString = 'Error fetching data.',
      timeout = 0) {
    return fetchFile(url, errorString, timeout, 'json', 'POST', JSON.stringify(payload));
  }
  

  /**
   * Returns a promise for fetching a JSON URL, with customizable error string
   * and timeout.
   *
   * @param {string} url The URL to fetch.
   * @param {string} errorString The error string to use for any failures.
   * @param {number} timeout The timeout to use for the request.
   * @return {Promise.<Object>} The constructed promise.
   */
  export function fetchJson(url, errorString = 'Error fetching data.',
      timeout = 0) {
    return fetchFile(url, errorString, timeout, 'json');
  }
  
  /**
   * Returns a promise for fetching a URL, with customizable error string
   * and timeout.
   *
   * @param {string} url The URL to fetch.
   * @param {string} errorString The error string to use for any failures.
   * @param {number} timeout The timeout to use for the request.
   * @param {string} responseType The response type for the request (e.g. 'json').
   * @return {Promise.<Object>} The constructed promise.
   */
  export function fetchFile(url, errorString = 'Error fetching data.',
      timeout = 0, responseType = '', method = 'GET', body = '') {
    return new Promise(function(resolve, reject) {
      let req = new XMLHttpRequest();
      req.open(method, url);
      req.timeout = timeout;
  
      req.addEventListener('load', () => {
        if (req.status === 200) {
          resolve(req.response);
        } else {
          reject(new Error(errorString + ` HTTP ${req.statusText}.`));
        }
      });
  
      let errorHandler = () => {
        reject(new Error(errorString));
      };
      req.addEventListener('error', errorHandler);
      req.addEventListener('abort', errorHandler);
  
      req.addEventListener('timeout', () => {
        reject(new Error(errorString + ' Request timed out.'));
      });
  
      req.responseType = responseType;
      req.send(body);
    });
  }

   /**
   * Returns a promise for fetching a URL
   *
   * @param {string} url The URL to fetch.
   * @param {object} payload The body to add to the POST request.
   * @returns {Promise.<Object>} The constructed promise.
   *
   */
  export function get(url, payload = null, num, method = 'POST') {
    return createQueue(() => 
        Promise.race([
          new Promise((resolve, reject) => setTimeout(_ => {reject({result: null})}, 15 * 1000)),
          fetch(url, payload ? {
            method,
            headers: {
              'content-type': 'application/json',
              'accept': 'application/json'
            },
            body: JSON.stringify(payload),
            mode: 'cors',
          }
          : 
          {}
        ).then(response => response.json())
        ])
      , num);
  }

  
/**
 *  Queue to make requests constantly until it success or max number of requests is reached.
 *
 * @export
 * @param {*} task
 * @param {number} [maxNumOfTry=5]
 * @returns {Promise.<Object>} The constructed promise.
 */
export function createQueue(task, maxNumOfTry = 5) {
    return new Promise((done, fail) => {
      const handleFailureResult =  result => {
        maxNumOfTry--;
        if(maxNumOfTry > 0){
          setTimeout(getNextTask, 1000);
        }else{
          console.log('fail to load')
          fail();
        }
      };
      const getNextTask = () => task().then(done).catch(handleFailureResult);
      getNextTask();
    });
  }


/**
 * Simple debouncer
 * 
 * @param {Function} func
 * @param {number} wait Time while debounce
 * @param {boolean} immediate Should be called immediatly
 */
export function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};
