import { logoutCurrentUser, watchAuthState } from '../lib/auth-guard.js';
import { setLoading } from '../lib/loading.js';
import { showErrorToast, showSuccessToast } from '../lib/toast.js';

const ICONS = {
  menu: new URL('../../assets/icons/menu.svg', import.meta.url).href,
  close: new URL('../../assets/icons/close.svg', import.meta.url).href,
  cart: new URL('../../assets/icons/cart.svg', import.meta.url).href,
  profile: new URL('../../assets/icons/profile.svg', import.meta.url).href,
};

const BASE_NAV_ITEMS = [
  { id: 'home', label: 'Home', meta: 'classicsolapur.com', path: '/', enabled: true },
  { id: 'catalog', label: 'All Fabrics Catalog', meta: 'Browse', path: '/pages/listing.html', enabled: true },
  { id: 'formal', label: "Men's Formal", meta: 'Whites, Plain, Stripes', path: '/pages/listing.html?style=formal', enabled: true },
  { id: 'casual', label: "Men's Casual", meta: 'Checks, Prints, Solid', path: '/pages/listing.html?style=casual', enabled: true },
  { id: 'khadi', label: 'Khadi & Silk Special', meta: 'Traditional', path: '/pages/listing.html?material=Khadi', enabled: true },
  { id: 'orders', label: 'Track Orders', meta: 'Order Status', path: '/pages/orders.html', enabled: true, authOnly: true },
];

function iconMarkup(name, className = 'icon') {
  return `<img class="${className}" src="${ICONS[name]}" alt="" aria-hidden="true" />`;
}

function baseNavMarkup(user) {
  return BASE_NAV_ITEMS
    .filter((item) => !item.authOnly || user)
    .map((item) => `
      <li>
        <button
          class="nav-link"
          type="button"
          data-nav-route="${item.id}"
          data-nav-path="${item.path}"
          ${item.enabled ? '' : 'aria-disabled="true" disabled'}
        >
          <span>${item.label}</span>
          <span class="nav-link__meta">${item.meta}</span>
        </button>
      </li>
    `)
    .join('');
}

function authNavMarkup(user) {
  if (!user) {
    return `
      <div class="nav-drawer__auth-copy">Sign in to your Classic account to place orders, track shipments & save favorites.</div>
      <button class="nav-link nav-link--auth" type="button" data-auth-action="login">
        <span>Log in</span>
        <span class="nav-link__meta">Account</span>
      </button>
      <button class="nav-link nav-link--auth" type="button" data-auth-action="signup">
        <span>Create account</span>
        <span class="nav-link__meta">Sign Up</span>
      </button>
    `;
  }

  return `
    <div class="nav-account">
      <span class="nav-account__icon">${iconMarkup('profile')}</span>
      <span class="nav-account__copy">
        <span class="nav-account__label">Signed in as</span>
        <span class="nav-account__email" data-auth-user-email></span>
      </span>
    </div>
    <button class="nav-link nav-link--auth" type="button" data-auth-action="profile">
      <span>My Profile</span>
      <span class="nav-link__meta">Shipping Address</span>
    </button>
    <button class="nav-link nav-link--auth" type="button" data-auth-action="logout">
      <span>Log out</span>
      <span class="nav-link__meta">End Session</span>
    </button>
  `;
}

/**
 * Renders the luxury Classic Collection Solapur header.
 * @param {HTMLElement} target - Mount node for the header.
 * @param {Object} [options] - Header behavior options.
 * @param {number} [options.cartCount] - Number shown in the cart badge.
 * @param {(routeId: string) => void} [options.handleNavigate] - Called with route id.
 * @param {() => void} [options.handleCart] - Called when cart action is selected.
 * @returns {{destroy: () => void, setCartCount: (count: number) => void}} Header controls.
 */
export function renderHeader(target, options = {}) {
  if (!target) {
    throw new Error('renderHeader requires a target element.');
  }

  const { cartCount = 0, handleNavigate = () => {}, handleCart = () => { window.location.assign('/pages/cart.html'); } } = options;
  const state = { open: false, cartCount, user: null };

  target.innerHTML = `
    <div class="app-shell__header">
      <header class="site-header">
        <div class="site-header__inner">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="icon-button" type="button" data-header-menu aria-label="Open navigation menu" aria-expanded="false" aria-controls="primary-nav-drawer">
              ${iconMarkup('menu')}
            </button>
            <a class="brand" href="/" data-header-brand aria-label="Classic Collection Solapur home">
              <span class="brand__wordmark">Classic Collection</span>
              <span class="brand__tagline">Solapur</span>
            </a>
          </div>

          <nav class="desktop-nav-links" style="display: flex; gap: 20px; align-items: center;" aria-label="Main Navigation">
            <a href="/" style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text); text-decoration: none;">Home</a>
            <a href="/pages/listing.html" style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text); text-decoration: none;">All Fabrics</a>
            <a href="/pages/listing.html?style=formal" style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text); text-decoration: none;">Formal</a>
            <a href="/pages/listing.html?style=casual" style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text); text-decoration: none;">Casual</a>
            <a href="/pages/listing.html?material=Khadi" style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text); text-decoration: none;">Khadi & Silk</a>
          </nav>

          <div class="header-actions" style="display: flex; align-items: center; gap: 8px;">
            <button class="icon-button" type="button" onclick="window.location.assign('/pages/listing.html')" aria-label="Search catalog">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button class="icon-button" type="button" onclick="window.location.assign('/pages/profile.html')" aria-label="Account profile">
              ${iconMarkup('profile')}
            </button>
            <button class="icon-button" type="button" data-header-cart aria-label="Open cart">
              ${iconMarkup('cart')}
              <span class="cart-badge" data-header-cart-count${state.cartCount > 0 ? '' : ' hidden'}>${state.cartCount}</span>
            </button>
          </div>
        </div>
      </header>
      <button class="drawer-overlay" type="button" data-drawer-overlay aria-label="Close navigation menu" tabindex="-1"></button>
      <aside class="nav-drawer" id="primary-nav-drawer" data-nav-drawer aria-label="Primary navigation" aria-hidden="true">
        <div class="nav-drawer__head">
          <div style="display: flex; flex-direction: column;">
            <span style="font-family: var(--font-family-heading, 'Playfair Display', Georgia, serif); font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Classic Collection</span>
            <span style="font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px;">Solapur • classicsolapur.com</span>
          </div>
          <button class="icon-button" type="button" data-drawer-close aria-label="Close navigation menu">
            ${iconMarkup('close')}
          </button>
        </div>
        <nav aria-label="Drawer navigation">
          <ul class="nav-drawer__list" data-primary-nav-list></ul>
          <div class="nav-drawer__auth" data-auth-nav aria-label="Account navigation"></div>
        </nav>
        <p class="nav-drawer__foot">Classic Collection Solapur offers premium unstitched clothing fabrics, cotton, linen, silk, and khadi materials.</p>
      </aside>
    </div>
  `;

  const refs = {
    menu: target.querySelector('[data-header-menu]'),
    cart: target.querySelector('[data-header-cart]'),
    cartCount: target.querySelector('[data-header-cart-count]'),
    overlay: target.querySelector('[data-drawer-overlay]'),
    drawer: target.querySelector('[data-nav-drawer]'),
    close: target.querySelector('[data-drawer-close]'),
    primaryNav: target.querySelector('[data-primary-nav-list]'),
    authNav: target.querySelector('[data-auth-nav]'),
  };

  const renderNavigation = () => {
    refs.primaryNav.innerHTML = baseNavMarkup(state.user);
    refs.authNav.innerHTML = authNavMarkup(state.user);

    if (state.user) {
      const emailSlot = refs.authNav.querySelector('[data-auth-user-email]');
      if (emailSlot) {
        emailSlot.textContent = state.user.email || 'Authenticated customer';
      }
    }
  };

  const setDrawerOpen = (open) => {
    state.open = Boolean(open);
    refs.drawer.setAttribute('aria-hidden', String(!state.open));
    refs.menu.setAttribute('aria-expanded', String(state.open));
    refs.overlay.classList.toggle('drawer-overlay--visible', state.open);
    refs.drawer.classList.toggle('nav-drawer--open', state.open);
    document.body.classList.toggle('drawer-open', state.open);
  };

  const setCartCount = (count) => {
    state.cartCount = Math.max(0, Number(count) || 0);
    refs.cartCount.textContent = String(state.cartCount);
    refs.cartCount.hidden = state.cartCount === 0;
  };

  const performLogout = async (button) => {
    setLoading(button, true, 'Logging out');
    const result = await logoutCurrentUser();
    setLoading(button, false);

    if (!result.ok) {
      showErrorToast(result.error || 'Could not log you out.');
      return;
    }

    showSuccessToast('You have been logged out.', { title: 'Logged out' });
    setDrawerOpen(false);
  };

  const handleMenuClick = () => setDrawerOpen(!state.open);
  const handleCloseClick = () => setDrawerOpen(false);
  const handleCartClick = () => handleCart();
  const handleKeydown = (event) => {
    if (event.key === 'Escape' && state.open) {
      setDrawerOpen(false);
    }
  };

  const handlePrimaryNavClick = (event) => {
    const route = event.target.closest('[data-nav-route]');
    if (!route || route.disabled || route.getAttribute('aria-disabled') === 'true') {
      return;
    }

    const path = route.getAttribute('data-nav-path') || '/pages/listing.html';
    const routeId = route.getAttribute('data-nav-route');

    if (routeId === 'home') {
      if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        setDrawerOpen(false);
        return;
      }
      window.location.assign('/');
      return;
    }

    window.location.assign(path);
  };

  const handleAuthNavClick = (event) => {
    const actionButton = event.target.closest('[data-auth-action]');
    if (!actionButton) return;

    const action = actionButton.getAttribute('data-auth-action');
    if (action === 'login') {
      window.location.assign('/pages/login.html');
      return;
    }
    if (action === 'signup') {
      window.location.assign('/pages/signup.html');
      return;
    }
    if (action === 'profile') {
      window.location.assign('/pages/profile.html');
      return;
    }
    if (action === 'logout') {
      performLogout(actionButton);
    }
  };

  refs.menu?.addEventListener('click', handleMenuClick);
  refs.close?.addEventListener('click', handleCloseClick);
  refs.overlay?.addEventListener('click', handleCloseClick);
  refs.cart?.addEventListener('click', handleCartClick);
  refs.primaryNav?.addEventListener('click', handlePrimaryNavClick);
  refs.authNav?.addEventListener('click', handleAuthNavClick);
  window.addEventListener('keydown', handleKeydown);

  renderNavigation();

  const unsubscribeAuth = watchAuthState((user) => {
    state.user = user;
    renderNavigation();
  });

  return {
    setCartCount,
    destroy() {
      refs.menu?.removeEventListener('click', handleMenuClick);
      refs.close?.removeEventListener('click', handleCloseClick);
      refs.overlay?.removeEventListener('click', handleCloseClick);
      refs.cart?.removeEventListener('click', handleCartClick);
      refs.primaryNav?.removeEventListener('click', handlePrimaryNavClick);
      refs.authNav?.removeEventListener('click', handleAuthNavClick);
      window.removeEventListener('keydown', handleKeydown);
      unsubscribeAuth();
    },
  };
}
