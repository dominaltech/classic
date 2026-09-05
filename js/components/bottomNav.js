const ICONS = {
  home: new URL('../../assets/icons/home.svg', import.meta.url).href,
  search: new URL('../../assets/icons/search.svg', import.meta.url).href,
  cart: new URL('../../assets/icons/cart.svg', import.meta.url).href,
  profile: new URL('../../assets/icons/profile.svg', import.meta.url).href,
};

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home', path: '/', enabled: true },
  { id: 'search', label: 'Search', icon: 'search', path: '/pages/listing.html', enabled: false },
  { id: 'cart', label: 'Cart', icon: 'cart', path: '/pages/cart.html', enabled: true },
  { id: 'profile', label: 'Profile', icon: 'profile', path: '/pages/profile.html', enabled: true },
];

function iconMarkup(name) {
  return `<img class="icon" src="${ICONS[name]}" alt="" aria-hidden="true" />`;
}

function resolveActiveRoute(activeRoute) {
  if (activeRoute) {
    return activeRoute;
  }

  if (window.location.pathname.endsWith('/pages/profile.html')) {
    return 'profile';
  }

  if (window.location.pathname.endsWith('/pages/cart.html')) {
    return 'cart';
  }

  return 'home';
}

/**
 * Renders the mobile-first bottom tab bar with four SVG icon destinations.
 * @param {HTMLElement} target - Mount node for the bottom navigation.
 * @param {Object} [options] - Navigation behavior options.
 * @param {string} [options.activeRoute] - Active route id; defaults from the current URL.
 * @param {(routeId: string) => void} [options.handleNavigate] - Called after an enabled route is selected.
 * @returns {{destroy: () => void}} Bottom navigation controls.
 */
export function renderBottomNav(target, options = {}) {
  if (!target) {
    throw new Error('renderBottomNav requires a target element.');
  }

  const { activeRoute, handleNavigate = () => { } } = options;
  const currentRoute = resolveActiveRoute(activeRoute);

  target.innerHTML = `
    <nav class="bottom-nav" aria-label="Bottom navigation">
      <div class="bottom-nav__inner">
        ${NAV_ITEMS.map((item) => `
          <button
            class="bottom-nav__item"
            type="button"
            data-bottom-route="${item.id}"
            data-route-path="${item.path}"
            ${item.id === currentRoute ? 'aria-current="page"' : ''}
            ${item.enabled ? '' : 'aria-disabled="true" disabled'}
          >
            ${iconMarkup(item.icon)}
            <span>${item.label}</span>
          </button>
        `).join('')}
      </div>
    </nav>
  `;

  const routes = [...target.querySelectorAll('[data-bottom-route]')];

  const handleRouteClick = (event) => {
    const route = event.currentTarget;

    if (route.disabled || route.getAttribute('aria-disabled') === 'true') {
      return;
    }

    const routeId = route.getAttribute('data-bottom-route');
    const path = route.getAttribute('data-route-path');
    handleNavigate(routeId);

    if (path && window.location.pathname !== path) {
      window.location.assign(path);
    }
  };

  routes.forEach((route) => route.addEventListener('click', handleRouteClick));

  return {
    destroy() {
      routes.forEach((route) => route.removeEventListener('click', handleRouteClick));
      target.innerHTML = '';
    },
  };
}
