/*
  Reusable quantity stepper — Product Detail (Phase 7) and Cart line
  items (Phase 8). Clamps every value into [min, max], disables the
  stepper buttons at the bounds, and reports changes via callback.
  Pure DOM only; no data fetching lives here.
*/

/**
 * Creates a quantity selector control.
 * @param {Object} [options] - Selector options.
 * @param {number} [options.min=1] - Smallest allowed quantity (never below 1).
 * @param {number} [options.max=Infinity] - Largest allowed quantity (e.g. stock).
 * @param {number} [options.value=1] - Initial quantity.
 * @param {string} [options.label] - Accessible label for the number input.
 * @param {(value: number) => void} [options.onChange] - Called after every committed change.
 * @returns {{element: HTMLElement, getValue: () => number, setValue: (v: number) => void, setMax: (max: number) => void, setDisabled: (disabled: boolean) => void}} Control handle.
 */
export function createQuantitySelector({ min = 1, max = Infinity, value = 1, label = 'Quantity', onChange } = {}) {
  const safeMin = Math.max(1, Number.parseInt(min, 10) || 1);
  let safeMax = Number.isFinite(Number(max)) ? Math.max(safeMin, Number.parseInt(max, 10)) : Infinity;
  let current = safeMin;

  /**
   * Clamps any raw value into the [min, max] range (non-numeric -> min).
   * @param {*} raw - Raw quantity.
   * @returns {number} Safe quantity.
   */
  function clamp(raw) {
    const parsed = Number.parseInt(raw, 10);
    return Math.min(safeMax, Math.max(safeMin, Number.isFinite(parsed) ? parsed : safeMin));
  }

  const root = document.createElement('div');
  root.className = 'quantity';

  const decrease = document.createElement('button');
  decrease.type = 'button';
  decrease.className = 'quantity__button';
  decrease.setAttribute('aria-label', 'Decrease quantity');
  decrease.textContent = '−';

  const input = document.createElement('input');
  input.className = 'quantity__input';
  input.type = 'text';
  input.inputMode = 'numeric';
  input.autoComplete = 'off';
  input.setAttribute('aria-label', label);

  const increase = document.createElement('button');
  increase.type = 'button';
  increase.className = 'quantity__button';
  increase.setAttribute('aria-label', 'Increase quantity');
  increase.textContent = '+';

  /**
   * Commits a new quantity: clamps, re-renders, syncs button bounds,
   * and notifies the owner.
   * @param {*} next - Requested quantity.
   * @param {{notify?: boolean}} [flags] - Set notify:false to stay silent.
   */
  function commit(next, { notify = true } = {}) {
    current = clamp(next);
    input.value = String(current);
    decrease.disabled = current <= safeMin;
    increase.disabled = current >= safeMax;

    if (notify && typeof onChange === 'function') {
      onChange(current);
    }
  }

  decrease.addEventListener('click', () => {
    commit(current - 1);
  });

  increase.addEventListener('click', () => {
    commit(current + 1);
  });

  input.addEventListener('change', () => {
    commit(input.value);
  });

  root.append(decrease, input, increase);
  commit(value, { notify: false });

  return {
    element: root,
    /**
     * Reads the current clamped quantity.
     * @returns {number} Current quantity.
     */
    getValue() {
      return current;
    },
    /**
     * Sets the quantity without firing onChange.
     * @param {number} next - New quantity.
     */
    setValue(next) {
      commit(next, { notify: false });
    },
    /**
     * Raises/lowers the maximum (e.g. after a fresh stock read) and
     * re-clamps the current value into the new range.
     * @param {number} nextMax - New maximum.
     */
    setMax(nextMax) {
      const parsed = Number.parseInt(nextMax, 10);
      safeMax = Number.isFinite(parsed) ? Math.max(safeMin, parsed) : Infinity;
      commit(current, { notify: false });
    },
    /**
     * Enables/disables the whole control (e.g. while a request runs).
     * @param {boolean} disabled - Target disabled state.
     */
    setDisabled(disabled) {
      const isDisabled = Boolean(disabled);
      decrease.disabled = isDisabled || current <= safeMin;
      increase.disabled = isDisabled || current >= safeMax;
      input.disabled = isDisabled;
    },
  };
}
