/**
 * Applies or clears a local loading state on a button or panel.
 * @param {HTMLElement} element - Element that owns the loading state.
 * @param {boolean} isLoading - Whether the element is busy.
 * @param {string} [loadingText] - Optional text shown while busy.
 * @returns {HTMLElement} The same element for chaining.
 */
export function setLoading(element, isLoading, loadingText = 'Loading') {
  if (!element) {
    throw new Error('setLoading requires an element.');
  }

  element.toggleAttribute('aria-busy', isLoading);
  element.toggleAttribute('data-loading', isLoading);

  if (element instanceof HTMLButtonElement) {
    element.disabled = isLoading;

    if (isLoading) {
      element.dataset.originalHtml = element.innerHTML;
      element.textContent = loadingText;
    } else if (element.dataset.originalHtml) {
      element.innerHTML = element.dataset.originalHtml;
      delete element.dataset.originalHtml;
    }
  }

  return element;
}

/**
 * Sets document-level busy state for full-page async bootstraps.
 * @param {boolean} isLoading - Whether the page is busy.
 */
export function setPageLoading(isLoading) {
  document.documentElement.toggleAttribute('data-page-loading', isLoading);
  document.body.toggleAttribute('aria-busy', isLoading);
}
