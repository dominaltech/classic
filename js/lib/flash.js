const FLASH_KEY = 'dominal:ui:flash';

/**
 * Queues a one-time UI message that survives a same-tab redirect.
 * @param {Object} flash - Flash payload.
 * @param {'success' | 'error' | 'info'} [flash.type] - Toast intent.
 * @param {string} [flash.title] - Toast title.
 * @param {string} flash.message - User-facing message.
 * @param {number} [flash.durationMs] - Toast duration.
 */
export function queueFlash({ type = 'info', title, message, durationMs } = {}) {
  if (!message) {
    return;
  }

  try {
    window.sessionStorage.setItem(FLASH_KEY, JSON.stringify({ type, title, message, durationMs }));
  } catch {
    // Storage can be unavailable in restricted browser modes; the redirect still works.
  }
}

/**
 * Reads and clears the queued one-time UI message.
 * @returns {{type?: string, title?: string, message: string, durationMs?: number} | null} Flash payload, if any.
 */
export function consumeFlash() {
  try {
    const raw = window.sessionStorage.getItem(FLASH_KEY);

    if (!raw) {
      return null;
    }

    window.sessionStorage.removeItem(FLASH_KEY);
    return JSON.parse(raw);
  } catch {
    try {
      window.sessionStorage.removeItem(FLASH_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }

    return null;
  }
}
