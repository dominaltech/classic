import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { bindHeaderCartBadge } from '../lib/cart-badge.js';
import { renderProductCard } from '../components/productCard.js';
import { createProductCardSkeletons } from '../components/skeletonLoader.js';
import { consumeFlash } from '../lib/flash.js';
import { getCategories, getProducts } from '../services/catalogService.js';
import { showErrorToast, showInfoToast, showSuccessToast } from '../lib/toast.js';
import { supabase } from '../config/supabaseClient.js';

const refs = {
  announcement: document.querySelector('#app-announcement'),
  header: document.querySelector('#app-header'),
  main: document.querySelector('#app-main'),
  footer: document.querySelector('#app-footer'),
  bottomNav: document.querySelector('#app-bottom-nav'),
};

/**
 * Shows a queued one-time message after auth/profile redirects.
 */
function showStoredFlash() {
  const flash = consumeFlash();
  if (!flash) return;

  const options = { title: flash.title, durationMs: flash.durationMs };
  if (flash.type === 'success') {
    showSuccessToast(flash.message, options);
  } else if (flash.type === 'error') {
    showErrorToast(flash.message, options);
  } else {
    showInfoToast(flash.message, options);
  }
}

/**
 * Renders the top announcement ticker bar.
 */
function renderAnnouncementBar(target) {
  if (!target) return;
  target.innerHTML = `
    <div class="announcement-bar">
      <div class="announce-ticker">
        <div class="announce-ticker-track">
          <span>Classic Collection Solapur — <strong>classicsolapur.com</strong></span>
          <span>100% Authentic <strong>Pure Cotton, Linen & Khadi</strong></span>
          <span>Express Delivery <strong>Across India</strong></span>
          <span>Easy Exchange & <strong>Customer Support</strong></span>
          <span>New Formal & Casual Weaves <strong>Updated Weekly</strong></span>
        </div>
      </div>
      <div class="announce-links">
        <a href="/pages/orders.html">Track Order</a>
        <a href="/pages/listing.html?style=formal">Formal Wear</a>
        <a href="/pages/listing.html?style=casual">Casual Wear</a>
      </div>
    </div>
  `;
}

/**
 * Renders the luxury Hero Slider with dynamic Supabase banners or fallback luxury fabric slides.
 */
async function renderHeroSlider(target) {
  let banners = [];
  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      banners = data;
    }
  } catch (_) {
    // Fallback if table not queried or offline
  }

  if (banners.length === 0) {
    banners = [
      {
        title: "MEN'S FORMAL SHIRTING & SUITING",
        subtitle: "WHITES, PLAIN, STRIPES & CHECKS IN COMBED COTTON & LINEN",
        image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80",
        link_url: "/pages/listing.html?style=formal",
      },
      {
        title: "AUTHENTIC KHADI & HANDLOOM SILK",
        subtitle: "TRADITIONAL INDIAN WEAVES WITH UNRIVALED LUXURY DRAPE",
        image_url: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1600&q=80",
        link_url: "/pages/listing.html?material=Khadi",
      },
      {
        title: "CASUAL WEAVES & LINEN COTTON",
        subtitle: "CHECKS, SOLIDS & PRINTS FOR EFFORTLESS EVERYDAY STYLE",
        image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1600&q=80",
        link_url: "/pages/listing.html?style=casual",
      },
    ];
  }

  const slider = document.createElement('section');
  slider.className = 'hero-slider';
  slider.setAttribute('aria-label', 'Featured collections slider');

  slider.innerHTML = `
    ${banners
      .map(
        (banner, idx) => `
      <div class="hero-slide${idx === 0 ? ' active' : ''}" data-slide-index="${idx}">
        <img src="${banner.image_url}" alt="${banner.title}" class="hero-img" loading="${idx === 0 ? 'eager' : 'lazy'}">
        <div class="hero-content">
          <h1 class="hero-title">${banner.title}</h1>
          <p class="hero-subtitle">${banner.subtitle}</p>
          <a href="${banner.link_url || '/pages/listing.html'}" class="hero-btn">
            EXPLORE FABRICS
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>
    `,
      )
      .join('')}
    <div class="slider-dots">
      ${banners
        .map(
          (_, idx) => `
        <button class="slider-dot${idx === 0 ? ' active' : ''}" type="button" aria-label="Slide ${idx + 1}" data-dot-index="${idx}"></button>
      `,
        )
        .join('')}
    </div>
  `;

  target.append(slider);

  // Slider animation logic
  const slides = slider.querySelectorAll('.hero-slide');
  const dots = slider.querySelectorAll('.slider-dot');
  let currentSlide = 0;
  let intervalId = null;

  function setSlide(index) {
    slides[currentSlide]?.classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide]?.classList.add('active');
    dots[currentSlide]?.classList.add('active');
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      setSlide(idx);
      resetAutoplay();
    });
  });

  function startAutoplay() {
    intervalId = setInterval(() => {
      setSlide(currentSlide + 1);
    }, 5500);
  }

  function resetAutoplay() {
    clearInterval(intervalId);
    startAutoplay();
  }

  startAutoplay();
}

/**
 * Renders the brand video showcase that autoplays from the beginning when scrolled into view
 * and pauses when scrolled away.
 */
function renderHeroVideoShowcase(target) {
  const section = document.createElement('section');
  section.className = 'hero-video-section';
  section.setAttribute('aria-label', 'Solapur Textile Craftsmanship Video');

  section.innerHTML = `
    <div class="hero-video-wrapper">
      <video
        id="heroCraftVideo"
        class="hero-video-player"
        playsinline
        preload="auto"
        poster="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80"
      >
        <source src="/videos/classic-craft.mp4" type="video/mp4">
        <!-- Fallback high-res fabric weaving clip in case custom video isn't placed yet -->
        <source src="https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-tailor-measuring-fabric-42618-large.mp4" type="video/mp4">
      </video>
      <div class="video-overlay-badge">
        <span class="pulse-dot"></span>
        CLASSIC SOLAPUR • WEAVING EXCELLENCE
      </div>
      <button type="button" id="heroVideoSoundToggle" class="video-audio-toggle" aria-label="Toggle Sound">
        <svg id="soundIconOn" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" style="display: none;">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <svg id="soundIconOff" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
        <span id="soundLabel">SOUND OFF</span>
      </button>
      <div class="video-caption-bar">
        <h3>Handcrafted Cloth Materials &amp; Fine Textiles</h3>
        <p>Pure Cotton, Linen, Khadi &amp; Silk • Inspected for Flawless Tailoring</p>
      </div>
    </div>
  `;

  target.append(section);

  const video = section.querySelector('#heroCraftVideo');
  const soundBtn = section.querySelector('#heroVideoSoundToggle');
  const iconOn = section.querySelector('#soundIconOn');
  const iconOff = section.querySelector('#soundIconOff');
  const soundLabel = section.querySelector('#soundLabel');

  let isAudioEnabled = false;

  function updateAudioState(enabled) {
    isAudioEnabled = enabled;
    if (video) video.muted = !enabled;
    if (enabled) {
      if (iconOn) iconOn.style.display = 'inline-block';
      if (iconOff) iconOff.style.display = 'none';
      if (soundLabel) soundLabel.textContent = 'SOUND ON';
    } else {
      if (iconOn) iconOn.style.display = 'none';
      if (iconOff) iconOff.style.display = 'inline-block';
      if (soundLabel) soundLabel.textContent = 'SOUND OFF';
    }
  }

  // Toggle sound on button click
  soundBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    updateAudioState(!isAudioEnabled);
    if (video && video.paused) {
      video.play().catch(() => {});
    }
  });

  // Scroll observer: autoplays from start on scroll in, pauses on scroll out
  if ('IntersectionObserver' in window && video) {
    let wasIntersecting = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            if (!wasIntersecting) {
              wasIntersecting = true;
              video.currentTime = 0; // Restart from start
              video.muted = !isAudioEnabled;
              video.play().catch(() => {
                // If browser blocks unmuted playback without prior click, fallback to muted autoplay
                video.muted = true;
                updateAudioState(false);
                video.play().catch(() => {});
              });
            }
          } else {
            if (wasIntersecting) {
              wasIntersecting = false;
              video.pause();
            }
          }
        });
      },
      {
        threshold: [0, 0.3, 0.6],
      }
    );

    observer.observe(section);
  }
}

/**
 * Renders category & style showcase tiles according to Classic_PRD.pdf.
 */
function renderPRDCollectionTiles(target) {
  const section = document.createElement('section');
  section.className = 'catalog-section';
  section.style.maxWidth = '1280px';
  section.style.margin = '48px auto';
  section.style.padding = '0 24px';

  section.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
      <div>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 700;">Curated Collections</p>
        <h2 style="font-family: var(--font-family-heading, 'Playfair Display', Georgia, serif); font-size: clamp(1.6rem, 3vw, 2.2rem); text-transform: uppercase;">Men's Clothing Materials</h2>
      </div>
      <a href="/pages/listing.html" style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--color-text); text-decoration: none; border-bottom: 2px solid var(--color-text); padding-bottom: 2px;">View All Fabrics →</a>
    </div>

    <div class="category-tile-grid">
      <a class="category-tile" href="/pages/listing.html?style=formal">
        <img src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80" alt="Men's Formal Material">
        <div class="category-tile-content">
          <div class="category-tile-subtitle">Men's Style</div>
          <div class="category-tile-title">Formal Shirting & Suiting</div>
          <div style="font-size: 11px; opacity: 0.85; margin-top: 4px;">Whites • Plain • Stripes • Checks • Prints</div>
        </div>
      </a>

      <a class="category-tile" href="/pages/listing.html?style=casual">
        <img src="https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=600&q=80" alt="Men's Casual Material">
        <div class="category-tile-content">
          <div class="category-tile-subtitle">Men's Style</div>
          <div class="category-tile-title">Casual & Everyday Weaves</div>
          <div style="font-size: 11px; opacity: 0.85; margin-top: 4px;">Checks • Whites • Solid • Prints</div>
        </div>
      </a>

      <a class="category-tile" href="/pages/listing.html?material=Khadi">
        <img src="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80" alt="Khadi Material">
        <div class="category-tile-content">
          <div class="category-tile-subtitle">Signature Fabric</div>
          <div class="category-tile-title">Pure Khadi & Handloom</div>
          <div style="font-size: 11px; opacity: 0.85; margin-top: 4px;">Hand-spun Indian Heritage Textiles</div>
        </div>
      </a>

      <a class="category-tile" href="/pages/listing.html?material=Silk">
        <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80" alt="Silk Material">
        <div class="category-tile-content">
          <div class="category-tile-subtitle">Luxury Fabric</div>
          <div class="category-tile-title">Mulberry & Tussar Silk</div>
          <div style="font-size: 11px; opacity: 0.85; margin-top: 4px;">Lustrous Festive & Kurta Fabrics</div>
        </div>
      </a>
    </div>
  `;

  target.append(section);
}

/**
 * Renders latest products on Home using the shared product card.
 */
async function renderLatestProducts(target) {
  const section = document.createElement('section');
  section.className = 'catalog-section';
  section.style.maxWidth = '1280px';
  section.style.margin = '48px auto';
  section.style.padding = '0 24px';

  section.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
      <div>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 700;">Fresh Drops</p>
        <h2 style="font-family: var(--font-family-heading, 'Playfair Display', Georgia, serif); font-size: clamp(1.6rem, 3vw, 2.2rem); text-transform: uppercase;">Latest Fabric Arrivals</h2>
      </div>
      <a href="/pages/listing.html" style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--color-text); text-decoration: none; border-bottom: 2px solid var(--color-text); padding-bottom: 2px;">View All Products →</a>
    </div>
    <div class="product-grid" data-latest-grid></div>
  `;
  const grid = section.querySelector('[data-latest-grid]');
  grid.append(...createProductCardSkeletons(4));
  target.append(section);

  const result = await getProducts({ page: 1, pageSize: 8 });
  grid.innerHTML = '';

  if (!result.ok) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px 24px; background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: 8px;">
        <h3 style="font-family: var(--font-family-heading); margin-bottom: 8px;">Fresh Catalog Uploading</h3>
        <p style="color: var(--color-text-muted); font-size: 14px;">Products are being updated via the Classic Admin Panel. Check back shortly!</p>
      </div>
    `;
    return;
  }

  const products = result.data || [];

  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px 24px; background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: 8px;">
        <h3 style="font-family: var(--font-family-heading); margin-bottom: 8px;">Ready for Fresh Arrivals</h3>
        <p style="color: var(--color-text-muted); font-size: 14px; margin-bottom: 16px;">Add cloth materials from your Classic PWA Admin to showcase them here.</p>
        <a href="/pages/listing.html" class="button button--secondary button--small">Browse Catalog</a>
      </div>
    `;
    return;
  }

  products.forEach((product) => {
    grid.append(renderProductCard(product));
  });
}

/**
 * Renders the 4-item Trust Badges section.
 */
function renderTrustBadges(target) {
  const section = document.createElement('section');
  section.className = 'trust-section';
  section.innerHTML = `
    <div class="trust-grid">
      <div class="trust-item">
        <div class="trust-icon-wrap">
          <svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>
        <div class="trust-title">Express Delivery</div>
        <div class="trust-desc">All-India fast dispatch from Solapur</div>
      </div>
      <div class="trust-item">
        <div class="trust-icon-wrap">
          <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="trust-title">100% Authentic Quality</div>
        <div class="trust-desc">Pure Cotton, Linen, Khadi & Silk</div>
      </div>
      <div class="trust-item">
        <div class="trust-icon-wrap">
          <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>
        </div>
        <div class="trust-title">Easy Exchanges</div>
        <div class="trust-desc">Hassle-free replacement policy</div>
      </div>
      <div class="trust-item">
        <div class="trust-icon-wrap">
          <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>
        <div class="trust-title">Verified Commerce</div>
        <div class="trust-desc">Direct support & order tracking</div>
      </div>
    </div>
  `;
  target.append(section);
}

/**
 * Renders the newsletter signup section.
 */
function renderNewsletter(target) {
  const section = document.createElement('section');
  section.className = 'newsletter-section';
  section.innerHTML = `
    <p class="nl-eyebrow">Stay In Touch</p>
    <h2 class="nl-title">Get New Fabric Drops First</h2>
    <p class="nl-sub">Be the first to know when new formal shirting, khadi weaves & festive silk materials arrive in stock.</p>
    <form class="nl-form" onsubmit="event.preventDefault(); alert('Thank you for subscribing to Classic Collection Solapur updates!');">
      <input type="email" class="nl-input" placeholder="Enter your email address" required />
      <button type="submit" class="nl-submit">Subscribe</button>
    </form>
  `;
  target.append(section);
}

/**
 * Renders the luxury brand footer.
 */
function renderFooter(target) {
  if (!target) return;
  target.innerHTML = `
    <footer class="site-footer">
      <div class="footer-grid">
        <div>
          <div class="footer-logo-row">
            <span style="font-family: var(--font-family-heading, 'Playfair Display', Georgia, serif); font-size: 1.25rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Classic Collection</span>
          </div>
          <p class="footer-desc">
            Classic Collection Solapur — Premium clothing materials and fabrics for men. Discover genuine cotton, linen, silk, and khadi weaves crafted for timeless tailoring.
          </p>
          <p style="font-size: 12px; color: var(--color-text-muted); margin-top: 10px;">
            <strong>Online Store:</strong> classicsolapur.com<br>
            <strong>Location:</strong> Solapur, Maharashtra, India
          </p>
        </div>
        <div>
          <div class="footer-col-title">Collections</div>
          <div class="footer-links">
            <a href="/pages/listing.html?style=formal">Men's Formal</a>
            <a href="/pages/listing.html?style=casual">Men's Casual</a>
            <a href="/pages/listing.html?material=Cotton">Pure Cotton</a>
            <a href="/pages/listing.html?material=Khadi">Handloom Khadi</a>
            <a href="/pages/listing.html?material=Silk">Festive Silk</a>
          </div>
        </div>
        <div>
          <div class="footer-col-title">Customer Care</div>
          <div class="footer-links">
            <a href="/pages/orders.html">Track Orders</a>
            <a href="/pages/profile.html">My Profile</a>
            <a href="/pages/cart.html">Shopping Bag</a>
            <a href="/pages/listing.html">All Products</a>
          </div>
        </div>
        <div>
          <div class="footer-col-title">Fabric Promise</div>
          <p style="font-size: 13px; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 12px;">
            Every meter of fabric is inspected for thread density, colorfastness, and weave integrity before packaging.
          </p>
          <div style="display: flex; gap: 8px;">
            <span style="display: inline-block; padding: 4px 10px; background: #ffffff; border: 1px solid var(--color-border); font-size: 11px; font-weight: 700; text-transform: uppercase;">Cotton</span>
            <span style="display: inline-block; padding: 4px 10px; background: #ffffff; border: 1px solid var(--color-border); font-size: 11px; font-weight: 700; text-transform: uppercase;">Linen</span>
            <span style="display: inline-block; padding: 4px 10px; background: #ffffff; border: 1px solid var(--color-border); font-size: 11px; font-weight: 700; text-transform: uppercase;">Khadi</span>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div>© ${new Date().getFullYear()} Classic Collection Solapur (classicsolapur.com). All rights reserved.</div>
        <div>Premium Clothing Materials & Fabric E-Commerce</div>
      </div>
    </footer>
  `;
}

/**
 * Boots the home catalog page.
 */
function bootHome() {
  if (!refs.header || !refs.main || !refs.bottomNav) {
    throw new Error('Home shell mount nodes are missing from index.html.');
  }

  showStoredFlash();
  renderAnnouncementBar(refs.announcement);
  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, {});

  renderHeroSlider(refs.main);
  renderHeroVideoShowcase(refs.main);
  renderPRDCollectionTiles(refs.main);
  renderLatestProducts(refs.main);
  renderTrustBadges(refs.main);
  renderNewsletter(refs.main);
  renderFooter(refs.footer);
}

bootHome();
