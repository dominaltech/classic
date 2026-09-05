/*
  Reusable catalog filter UI renderer (toolbar toggle + sort select,
  collapsible filter panel, active-filter chips). Pure DOM work only —
  no Supabase calls live here; page controllers own data and callbacks.
*/

const ICONS = {
  filter: new URL('../../assets/icons/filter.svg', import.meta.url).href,
  close: new URL('../../assets/icons/close.svg', import.meta.url).href,
};

/**
 * Sort options exposed by the listing contract.
 * `value` is the URL-safe key, `label` is customer-facing copy.
 */
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

/**
 * Builds one labelled select control for the filter panel.
 * @param {Object} input - Select definition.
 * @param {string} input.id - Control id used for the accessible label.
 * @param {string} input.label - Fieldset legend text (e.g. "Style").
 * @param {string} input.allLabel - Label of the "no selection" option.
 * @param {{id?: string, name: string, slug: string}[]} input.options - Selectable options.
 * @param {string} input.selectedSlug - Currently selected slug ('' = none).
 * @param {boolean} input.enabled - Whether the select can be interacted with.
 * @param {string} input.disabledHint - Hint shown while the control is disabled.
 * @param {(slug: string) => void} input.onChange - Change callback with the slug value.
 * @returns {{group: HTMLElement, setOptions: Function}} Built fieldset and its updater.
 */
function createTaxonomySelectGroup({ id, label, allLabel, options, selectedSlug, enabled, disabledHint, onChange }) {
  const group = document.createElement('fieldset');
  group.className = 'filter-group';

  const legend = document.createElement('legend');
  legend.textContent = label;
  group.append(legend);

  const select = document.createElement('select');
  select.className = 'text-input filter-select';
  select.id = id;
  select.name = id;
  select.disabled = !enabled;
  select.setAttribute('aria-label', legend.textContent);

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = allLabel;
  select.append(allOption);

  options.forEach((option) => {
    const node = document.createElement('option');
    node.value = option.slug;
    node.textContent = option.name;
    node.selected = option.slug === selectedSlug;
    select.append(node);
  });

  select.addEventListener('change', () => {
    onChange(select.value);
  });

  const hint = document.createElement('p');
  hint.className = 'filter-group__hint';
  hint.hidden = enabled;
  hint.textContent = disabledHint;

  group.append(select, hint);

  /**
   * Rebuilds options and enabled state without recreating the control.
   * @param {{name: string, slug: string}[]} nextOptions - New option list.
   * @param {{enabled?: boolean, hintText?: string, selectedSlug?: string}} [nextMeta] - New meta.
   */
  function setOptions(nextOptions, { enabled: nextEnabled = true, hintText = disabledHint, selectedSlug: keepSlug } = {}) {
    const current = keepSlug !== undefined ? keepSlug : select.value;
    select.replaceChildren(allOption);

    nextOptions.forEach((option) => {
      const node = document.createElement('option');
      node.value = option.slug;
      node.textContent = option.name;
      select.append(node);
    });

    const stillExists = current !== '' && nextOptions.some((option) => option.slug === current);
    select.value = stillExists ? current : '';
    select.disabled = !nextEnabled;
    hint.textContent = hintText;
    hint.hidden = nextEnabled;
  }

  return { group, setOptions };
}

/**
 * Renders the filter toolbar (toggle + sort) and the collapsible filter panel.
 * @param {{bar: HTMLElement, panel: HTMLElement}} mounts - Pre-existing mount nodes.
 * @param {Object} options - Render options.
 * @param {{id: string, name: string}[]} [options.materials] - Material checkbox options.
 * @param {{name: string, slug: string}[]} [options.styles] - Style select options.
 * @param {{name: string, slug: string}[]} [options.patterns] - Pattern select options.
 * @param {Object} [options.values] - Current filter values.
 * @param {string[]} [options.values.materialNames] - Selected material names.
 * @param {string} [options.values.styleSlug] - Selected style slug.
 * @param {string} [options.values.patternSlug] - Selected pattern slug.
 * @param {number | null} [options.values.minPrice] - Current minimum price.
 * @param {number | null} [options.values.maxPrice] - Current maximum price.
 * @param {string} [options.values.sort] - Current sort key.
 * @param {Object} [options.meta] - UI meta flags.
 * @param {boolean} [options.meta.stylesEnabled] - Whether styles can be filtered (needs a category).
 * @param {boolean} [options.meta.patternsEnabled] - Whether patterns can be filtered (needs a style).
 * @param {boolean} [options.meta.expanded] - Whether the panel starts open.
 * @param {number} [options.filterCount] - Active filter count badge value.
 * @param {(names: string[]) => void} options.onMaterialsChange - Material selection callback.
 * @param {(slug: string) => void} options.onStyleChange - Style selection callback.
 * @param {(slug: string) => void} options.onPatternChange - Pattern selection callback.
 * @param {(prices: {minRaw: string, maxRaw: string}) => void} options.onPriceInput - Price typing callback.
 * @param {(sort: string) => void} options.onSortChange - Sort selection callback.
 * @param {() => void} options.onResetAll - Clear-all callback.
 * @param {(isOpen: boolean) => void} [options.onPanelToggle] - Panel visibility callback.
 * @returns {{setStyleOptions: Function, setPatternOptions: Function, setPriceError: Function, setFilterCount: Function}} Imperative handles.
 */
export function renderFilterBar(mounts, {
  materials = [],
  styles = [],
  patterns = [],
  values = {},
  meta = {},
  filterCount = 0,
  onMaterialsChange,
  onStyleChange,
  onPatternChange,
  onPriceInput,
  onSortChange,
  onResetAll,
  onPanelToggle,
}) {
  const { bar, panel } = mounts;

  if (!bar || !panel) {
    throw new Error('renderFilterBar requires both bar and panel mount nodes.');
  }

  const {
    materialNames = [],
    styleSlug = '',
    patternSlug = '',
    minPrice = null,
    maxPrice = null,
    sort = 'newest',
  } = values;
  const {
    stylesEnabled = false,
    patternsEnabled = false,
    expanded = false,
  } = meta;

  bar.replaceChildren();
  panel.replaceChildren();

  /* ------------------------------------------------ toolbar (toggle + sort) */
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'button button--ghost filter-bar__toggle';
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.setAttribute('aria-controls', panel.id || 'listing-filter-panel');

  const toggleIcon = document.createElement('img');
  toggleIcon.src = ICONS.filter;
  toggleIcon.alt = '';
  toggleIcon.setAttribute('aria-hidden', 'true');

  const toggleLabel = document.createElement('span');
  toggleLabel.textContent = 'Filters';

  const countBadge = document.createElement('span');
  countBadge.className = 'filter-count';
  countBadge.hidden = filterCount === 0;
  countBadge.textContent = String(filterCount);

  toggle.append(toggleIcon, toggleLabel, countBadge);

  const sortWrap = document.createElement('div');
  sortWrap.className = 'filter-bar__sort';

  const sortLabel = document.createElement('label');
  sortLabel.className = 'filter-bar__sort-label';
  sortLabel.htmlFor = 'listing-sort';
  sortLabel.textContent = 'Sort by';

  const sortSelect = document.createElement('select');
  sortSelect.className = 'text-input sort-select';
  sortSelect.id = 'listing-sort';
  sortSelect.name = 'sort';

  SORT_OPTIONS.forEach((option) => {
    const node = document.createElement('option');
    node.value = option.value;
    node.textContent = option.label;
    node.selected = option.value === sort;
    sortSelect.append(node);
  });

  sortSelect.addEventListener('change', () => {
    if (typeof onSortChange === 'function') {
      onSortChange(sortSelect.value);
    }
  });

  sortWrap.append(sortLabel, sortSelect);
  bar.append(toggle, sortWrap);

  /* ------------------------------------------------------------ panel shell */
  panel.hidden = !expanded;

  const form = document.createElement('form');
  form.className = 'filter-panel__form';
  form.noValidate = true;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  const grid = document.createElement('div');
  grid.className = 'filter-panel__grid';

  /* --------------------------------------------------------- material group */
  const materialGroup = document.createElement('fieldset');
  materialGroup.className = 'filter-group';

  const materialLegend = document.createElement('legend');
  materialLegend.textContent = 'Material';
  materialGroup.append(materialLegend);

  if (materials.length === 0) {
    const emptyHint = document.createElement('p');
    emptyHint.className = 'filter-group__hint';
    emptyHint.textContent = 'Materials will appear here once the catalog is published.';
    materialGroup.append(emptyHint);
  } else {
    const optionList = document.createElement('div');
    optionList.className = 'filter-options';

    materials.forEach((material) => {
      const option = document.createElement('label');
      option.className = 'filter-option';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = material.name;
      checkbox.checked = materialNames.includes(material.name);

      const text = document.createElement('span');
      text.textContent = material.name;

      checkbox.addEventListener('change', () => {
        const selected = Array.from(optionList.querySelectorAll('input[type="checkbox"]:checked'))
          .map((input) => input.value);

        if (typeof onMaterialsChange === 'function') {
          onMaterialsChange(selected);
        }
      });

      option.append(checkbox, text);
      optionList.append(option);
    });

    materialGroup.append(optionList);
  }

  /* ---------------------------------------------------- style/pattern group */
  const styleGroup = createTaxonomySelectGroup({
    id: 'listing-filter-style',
    label: 'Style',
    allLabel: 'All styles',
    options: styles,
    selectedSlug: styleSlug,
    enabled: stylesEnabled,
    disabledHint: 'Choose a category from Home first to filter by style.',
    onChange: (slug) => {
      if (typeof onStyleChange === 'function') {
        onStyleChange(slug);
      }
    },
  });

  const patternGroup = createTaxonomySelectGroup({
    id: 'listing-filter-pattern',
    label: 'Pattern',
    allLabel: 'All patterns',
    options: patterns,
    selectedSlug: patternSlug,
    enabled: patternsEnabled,
    disabledHint: 'Select a style first to see its patterns.',
    onChange: (slug) => {
      if (typeof onPatternChange === 'function') {
        onPatternChange(slug);
      }
    },
  });

  /* ------------------------------------------------------------ price group */
  const priceGroup = document.createElement('fieldset');
  priceGroup.className = 'filter-group';

  const priceLegend = document.createElement('legend');
  priceLegend.textContent = 'Price range';
  priceGroup.append(priceLegend);

  const priceRow = document.createElement('div');
  priceRow.className = 'filter-price';

  const buildPriceField = (id, label, value, placeholder) => {
    const field = document.createElement('div');
    field.className = 'form-field';

    const fieldLabel = document.createElement('label');
    fieldLabel.className = 'form-label';
    fieldLabel.htmlFor = id;
    fieldLabel.textContent = label;

    const input = document.createElement('input');
    input.className = 'text-input';
    input.id = id;
    input.name = id;
    input.type = 'text';
    input.inputMode = 'decimal';
    input.autoComplete = 'off';
    input.placeholder = placeholder;
    input.value = value === null ? '' : String(value);

    input.addEventListener('input', () => {
      if (typeof onPriceInput === 'function') {
        const minInput = form.querySelector('#listing-price-min');
        const maxInput = form.querySelector('#listing-price-max');
        onPriceInput({ minRaw: minInput.value, maxRaw: maxInput.value });
      }
    });

    field.append(fieldLabel, input);
    return field;
  };

  priceRow.append(
    buildPriceField('listing-price-min', 'Min (₹)', minPrice, '0'),
    buildPriceField('listing-price-max', 'Max (₹)', maxPrice, 'Any'),
  );

  const priceError = document.createElement('p');
  priceError.className = 'form-field__error';
  priceError.hidden = true;
  priceError.setAttribute('role', 'alert');

  priceGroup.append(priceRow, priceError);

  /* -------------------------------------------------------------- actions */
  grid.append(materialGroup, styleGroup.group, patternGroup.group, priceGroup);

  const actions = document.createElement('div');
  actions.className = 'filter-panel__actions';

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'button button--ghost button--small';
  resetButton.textContent = 'Clear all filters';
  resetButton.addEventListener('click', () => {
    if (typeof onResetAll === 'function') {
      onResetAll();
    }
  });

  actions.append(resetButton);
  form.append(grid, actions);
  panel.append(form);

  /* --------------------------------------------------------- panel toggling */
  /**
   * Opens or closes the panel and syncs ARIA state.
   * @param {boolean} isOpen - Target visibility.
   */
  function setExpanded(isOpen) {
    panel.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', String(isOpen));

    if (typeof onPanelToggle === 'function') {
      onPanelToggle(isOpen);
    }
  }

  toggle.addEventListener('click', () => {
    setExpanded(panel.hidden);
  });

  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setExpanded(false);
      toggle.focus();
    }
  });

  return {
    setStyleOptions: styleGroup.setOptions,
    setPatternOptions: patternGroup.setOptions,
    /**
     * Shows or clears the inline price validation error.
     * @param {string} message - Error text ('' clears the error).
     */
    setPriceError(message) {
      const text = String(message || '').trim();
      priceError.textContent = text;
      priceError.hidden = text === '';

      form.querySelectorAll('#listing-price-min, #listing-price-max').forEach((input) => {
        input.setAttribute('aria-invalid', text === '' ? 'false' : 'true');
      });
    },
    /**
     * Updates the active-filter count badge on the toggle.
     * @param {number} count - Active filter count (0 hides the badge).
     */
    setFilterCount(count) {
      const safeCount = Math.max(0, Number(count) || 0);
      countBadge.textContent = String(safeCount);
      countBadge.hidden = safeCount === 0;
    },
  };
}

/**
 * Renders removable chips for every active filter plus a Clear-all action.
 * @param {HTMLElement} mount - Chips mount node (hidden when no chips).
 * @param {{key: string, value: string, label: string}[]} chips - Active filter chips.
 * @param {Object} handlers - Chip handlers.
 * @param {(key: string, value: string) => void} handlers.onRemove - Remove one chip.
 * @param {() => void} [handlers.onClearAll] - Clear every filter.
 */
export function renderActiveFilterChips(mount, chips, { onRemove, onClearAll } = {}) {
  if (!mount) {
    throw new Error('renderActiveFilterChips requires a mount node.');
  }

  mount.replaceChildren();

  if (!Array.isArray(chips) || chips.length === 0) {
    mount.hidden = true;
    return;
  }

  mount.hidden = false;

  const list = document.createElement('ul');
  list.className = 'active-filters__list';
  list.setAttribute('aria-label', 'Active filters');

  chips.forEach((chip) => {
    const item = document.createElement('li');
    item.className = 'filter-chip';

    const label = document.createElement('span');
    label.textContent = chip.label;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'filter-chip__remove';
    remove.setAttribute('aria-label', `Remove ${chip.label} filter`);

    const removeIcon = document.createElement('img');
    removeIcon.src = ICONS.close;
    removeIcon.alt = '';
    removeIcon.setAttribute('aria-hidden', 'true');

    remove.append(removeIcon);
    remove.addEventListener('click', () => {
      if (typeof onRemove === 'function') {
        onRemove(chip.key, chip.value);
      }
    });

    item.append(label, remove);
    list.append(item);
  });

  mount.append(list);

  if (typeof onClearAll === 'function') {
    const clearAll = document.createElement('button');
    clearAll.type = 'button';
    clearAll.className = 'button button--ghost button--small';
    clearAll.textContent = 'Clear all';
    clearAll.addEventListener('click', onClearAll);
    mount.append(clearAll);
  }
}
