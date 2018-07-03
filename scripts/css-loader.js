import {fetchFile} from './promise-utils';

// Prefer requestIdleCallback, if available.
const injector = window.requestIdleCallback || window.requestAnimationFrame;

/**
 * Loads and injects a stylesheet into the document.
 * @param {String} path The path to the CSS file to be loaded.
 * @return {Promise} A promise which resolves when the CSS gets applied.
 */
export default function loadAndInjectStyles(path) {
  return fetchFile(path)
    .then((styles) => {
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;

      // Wait either for rIC or rAF then inject and return.
      return new Promise((resolve, reject) => {
        injector(() => {
          document.head.appendChild(styleEl);
          requestAnimationFrame(resolve);
        });
      });
    });
}