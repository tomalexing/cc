// Prefer requestIdleCallback, if available. 
const injector = window.requestIdleCallback || window.requestAnimationFrame;
/**
 * Loads and injects a js into the document.
 * @param {String} path The path to the JS file to be loaded.
 * @return {Promise} A promise which resolves when the JS gets applied.
 */

export default function loadAndInjectScript(url, cb = _ => {}) {
    const script = document.createElement('script');
    script.src = url;
    script.async = false;
    document.head.appendChild(script);

    script.onload = cb;

    script.onerror = function(){
      console.log('failed to load JS at url ' + url);
    }

};
