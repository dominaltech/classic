const TOAST_TITLES = {
  success: 'Success',
  error: 'Something went wrong',
  info: 'Heads up',
};

const DEFAULT_DURATION_MS = 3600;

function resolveRegion(region) {
  if (region instanceof HTMLElement) {
    return region;
  }

  const fallback = document.querySelector('#app-toast');
  if (!fallback) {
    throw new Error('Toast region #app-toast was not found in the document.');
  }

  return fallback;
}

/**
 * Shows a self-dismissing toast notification inside the shared toast region.
 * @param {Object} options - Toast content and behavior.
 * @param {string} options.message - User-facing message.
 * @param {'success' | 'error' | 'info'} [options.type] - Toast intent.
 * @param {string} [options.title] - Optional title override.
 * @param {number} [options.durationMs] - Self-dismiss delay in milliseconds.
 * @param {HTMLElement} [options.region] - Optional custom toast region.
 * @returns {{dismiss: () => void, element: HTMLElement}} Toast controls.
 */
export function showToast({
  message,
  type = 'info',
  title,
  durationMs = DEFAULT_DURATION_MS,
  region,
} = {}) {
  if (!message) {
    throw new Error('showToast requires a message.');
  }

  const toastRegion = resolveRegion(region);
  const toast = document.createElement('section');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <span class="toast__accent" aria-hidden="true"></span>
    <div class="toast__content">
      <h3 class="toast__title">${title || TOAST_TITLES[type] || TOAST_TITLES.info}</h3>
      <p class="toast__message">${message}</p>
    </div>
    <button class="icon-button" type="button" data-toast-dismiss aria-label="Dismiss notification">
      <span aria-hidden="true">&times;</span>
    </button>
  `;

  toastRegion.append(toast);
  requestAnimationFrame(() => {
    toast.dataset.visible = 'true';
  });

  let timeoutId = window.setTimeout(() => dismiss(), durationMs);

  const dismiss = () => {
    window.clearTimeout(timeoutId);
    toast.dataset.visible = 'false';
    window.setTimeout(() => {
      toast.remove();
    }, 260);
  };

  const handleDismissClick = () => dismiss();
  toast.querySelector('[data-toast-dismiss]').addEventListener('click', handleDismissClick);

  return {
    dismiss,
    element: toast,
  };
}

/**
 * Convenience helper for success toasts.
 * @param {string} message - User-facing message.
 * @param {Object} [options] - Additional toast options.
 */
export function showSuccessToast(message, options = {}) {
  return showToast({ ...options, message, type: 'success', title: options.title || 'Done' });
}

/**
 * Convenience helper for error toasts.
 * @param {string} message - User-facing message.
 * @param {Object} [options] - Additional toast options.
 */
export function showErrorToast(message, options = {}) {
  return showToast({ ...options, message, type: 'error' });
}

/**
 * Convenience helper for informational toasts.
 * @param {string} message - User-facing message.
 * @param {Object} [options] - Additional toast options.
 */
export function showInfoToast(message, options = {}) {
  return showToast({ ...options, message, type: 'info' });
}
