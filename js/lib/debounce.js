/**
 * Delays invoking a function until it has stayed quiet for a given wait.
 * The returned wrapper exposes cancel() to drop any pending invocation,
 * which page controllers use when they need an immediate (non-debounced) run.
 * @param {Function} callback - Function to debounce.
 * @param {number} [waitMs=300] - Idle wait in milliseconds before invoking.
 * @returns {Function & {cancel: () => void}} Debounced wrapper around the callback.
 */
export function debounce(callback, waitMs = 300) {
  if (typeof callback !== 'function') {
    throw new Error('debounce requires a function to wrap.');
  }

  const wait = Math.max(0, Number(waitMs) || 0);
  let timerId = null;

  /**
   * Debounced wrapper — every call resets the idle timer.
   * @param {...*} args - Arguments forwarded to the wrapped callback.
   */
  function debounced(...args) {
    if (timerId !== null) {
      window.clearTimeout(timerId);
    }

    timerId = window.setTimeout(() => {
      timerId = null;
      callback(...args);
    }, wait);
  }

  /**
   * Drops any pending invocation without calling the wrapped callback.
   */
  debounced.cancel = () => {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}
