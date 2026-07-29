// Classic - Luxury Menswear Vanilla JS Application Logic

// 1. DUMMY PRODUCT DATASET matching handwritten specs & catalog
const PRODUCTS = [
  {
    id: "m-f-1",
    name: "Classic Pure Khadi Formal Shirt",
    slug: "classic-pure-khadi-formal-shirt",
    gender: "Men",
    type: "Formal",
    pattern: "Plain",
    fabric: "Khadi",
    price: 600,
    originalPrice: 1200,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
    badge: "Bestseller",
    description: "Handcrafted pure Khadi formal shirt offering exceptional breathability and eco-elegance."
  },
  {
    id: "m-f-2",
    name: "Royal Mulberry Silk Executive Shirt",
    slug: "royal-mulberry-silk-executive-shirt",
    gender: "Men",
    type: "Formal",
    pattern: "Whites",
    fabric: "Silk",
    price: 350,
    originalPrice: 850,
    image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600&auto=format&fit=crop&q=80",
    badge: "Special Offer",
    description: "Luxurious mulberry silk shirt tailored for boardroom presence."
  },
  {
    id: "m-f-3",
    name: "Pinstripe Linen Blend Formal Shirt",
    slug: "pinstripe-linen-blend-formal-shirt",
    gender: "Men",
    type: "Formal",
    pattern: "Strips",
    fabric: "Linen Cotton",
    price: 750,
    originalPrice: 1400,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
    badge: "New Arrival",
    description: "Tailored pinstripe shirt made from breathable linen cotton blend."
  },
  {
    id: "m-f-4",
    name: "Micro Check Cotton Formal Shirt",
    slug: "micro-check-cotton-formal-shirt",
    gender: "Men",
    type: "Formal",
    pattern: "Checks",
    fabric: "Cotton",
    price: 899,
    originalPrice: 1599,
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80",
    badge: "Classic",
    description: "Sharp micro-check pattern crafted from 100% Giza cotton."
  },
  {
    id: "m-f-5",
    name: "Monochrome Print Formal Linen Shirt",
    slug: "monochrome-print-formal-linen-shirt",
    gender: "Men",
    type: "Formal",
    pattern: "Prints",
    fabric: "Linen",
    price: 950,
    originalPrice: 1800,
    image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600&auto=format&fit=crop&q=80",
    badge: "Premium",
    description: "Subtle monochrome motif printed on pure French linen."
  },
  {
    id: "m-c-1",
    name: "Heritage Windowpane Check Casual Shirt",
    slug: "heritage-windowpane-check-casual-shirt",
    gender: "Men",
    type: "Casual",
    pattern: "Checks",
    fabric: "Cotton",
    price: 699,
    originalPrice: 1299,
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
    badge: "Popular",
    description: "Relaxed fit windowpane check shirt for weekend outings."
  },
  {
    id: "m-c-2",
    name: "Crisp White Linen Casual Overshirt",
    slug: "crisp-white-linen-casual-overshirt",
    gender: "Men",
    type: "Casual",
    pattern: "Whites",
    fabric: "Linen",
    price: 1100,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    badge: "Bestseller",
    description: "Effortlessly stylish crisp white casual linen overshirt."
  },
  {
    id: "m-c-3",
    name: "Solid Khadi Navy Casual Shirt",
    slug: "solid-khadi-navy-casual-shirt",
    gender: "Men",
    type: "Casual",
    pattern: "Solid",
    fabric: "Khadi",
    price: 600,
    originalPrice: 1100,
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&auto=format&fit=crop&q=80",
    badge: "Artisanal",
    description: "Rich solid navy tone in pure hand-spun Khadi fabric."
  },
  {
    id: "m-c-4",
    name: "Botanical Print Linen Cotton Casual Shirt",
    slug: "botanical-print-linen-cotton-casual-shirt",
    gender: "Men",
    type: "Casual",
    pattern: "Prints",
    fabric: "Linen Cotton",
    price: 850,
    originalPrice: 1500,
    image: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600&auto=format&fit=crop&q=80",
    badge: "Summer Ed.",
    description: "Vibrant botanical summer print in soft linen cotton."
  }
];

// STATE MANAGEMENT (LOCAL STORAGE)
let cart = JSON.parse(localStorage.getItem('classic_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('classic_wishlist') || '[]');

function saveCart() {
  localStorage.setItem('classic_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCartDrawer();
}

function saveWishlist() {
  localStorage.setItem('classic_wishlist', JSON.stringify(wishlist));
  updateWishlistBadge();
}

function updateCartBadge() {
  const count = cart.reduce((acc, item) => acc + item.qty, 0);
  document.querySelectorAll('.cart-count-badge').forEach(el => {
    el.textContent = count;
  });
}

function updateWishlistBadge() {
  document.querySelectorAll('.wishlist-count-badge').forEach(el => {
    el.textContent = wishlist.length;
  });
}

// CART ACTIONS
function addToCart(productId) {
  const prod = PRODUCTS.find(p => p.id === productId);
  if (!prod) return;
  
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...prod, qty: 1, size: '40' });
  }
  saveCart();
  toggleCartDrawer(true);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(productId);
    } else {
      saveCart();
    }
  }
}

function toggleCartDrawer(open) {
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (open) {
    overlay?.classList.add('active');
    drawer?.classList.add('active');
  } else {
    overlay?.classList.remove('active');
    drawer?.classList.remove('active');
  }
}

// WISHLIST TOGGLE
function toggleWishlist(productId) {
  if (wishlist.includes(productId)) {
    wishlist = wishlist.filter(id => id !== productId);
  } else {
    wishlist.push(productId);
  }
  saveWishlist();
  
  // Update buttons
  document.querySelectorAll(`.wishlist-btn[data-id="${productId}"]`).forEach(btn => {
    btn.classList.toggle('active', wishlist.includes(productId));
  });

  if (window.location.pathname.includes('wishlist.html')) {
    renderWishlistPage();
  }
}

// RENDER CART DRAWER HTML
function renderCartDrawer() {
  const body = document.getElementById('cartDrawerBody');
  const subtotalEl = document.getElementById('cartSubtotal');
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 40px 0;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 01-8 0"></path>
        </svg>
        <p style="margin-top: 16px; font-weight: 600; color: #777;">Your Shopping Cart is Empty</p>
        <a href="products.html" class="btn-primary" style="margin-top: 16px; display: inline-block;">Browse Men's Collection</a>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '₹0';
    return;
  }

  let total = 0;
  body.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    return `
      <div class="cart-item">
        <img src="${item.image}" class="cart-item-img" alt="${item.name}" />
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.name}</h4>
          <p class="cart-item-sub">Fabric: ${item.fabric} | Size: ${item.size || '40'}</p>
          <div class="cart-qty-row">
            <span style="font-weight: 800;">₹${item.price}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
              <span style="font-weight: 700; font-size: 13px;">${item.qty}</span>
              <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
              <button onclick="removeFromCart('${item.id}')" style="margin-left: 8px; color: #d32f2f; font-size: 11px; font-weight: 700;">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.textContent = `₹${total}`;
}

// RENDER PRODUCT CARD HTML UTILITY
function createProductCardHTML(p) {
  const isWish = wishlist.includes(p.id);
  return `
    <div class="product-card">
      <div class="product-image-wrap">
        ${p.badge ? `<span class="product-tag">${p.badge}</span>` : ''}
        <button class="wishlist-btn ${isWish ? 'active' : ''}" data-id="${p.id}" onclick="toggleWishlist('${p.id}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWish ? '#d32f2f' : 'none'}" stroke="${isWish ? '#d32f2f' : '#000'}" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
          </svg>
        </button>
        <a href="product-detail.html?id=${p.id}">
          <img src="${p.image}" class="product-image" alt="${p.name}" loading="lazy" />
        </a>
      </div>
      <div class="product-info">
        <div class="product-category">${p.gender} | ${p.type} • ${p.pattern}</div>
        <a href="product-detail.html?id=${p.id}" class="product-name">${p.name}</a>
        <div class="product-fabric">Fabric: <strong>${p.fabric}</strong></div>
        <div class="product-price-row">
          <span class="price-current">₹${p.price}</span>
          ${p.originalPrice ? `<span class="price-original">₹${p.originalPrice}</span>` : ''}
        </div>
        <button class="add-cart-btn" onclick="addToCart('${p.id}')">Add To Cart</button>
      </div>
    </div>
  `;
}

// PRODUCT LIST PAGE FILTER & SORT LOGIC
function filterAndRenderProducts() {
  const container = document.getElementById('productsGrid');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const typeFilter = urlParams.get('type') || ''; // 'Formal' or 'Casual'

  // Get selected checkboxes
  const patternBoxes = Array.from(document.querySelectorAll('.filter-pattern:checked')).map(cb => cb.value);
  const fabricBoxes = Array.from(document.querySelectorAll('.filter-fabric:checked')).map(cb => cb.value);
  const sortValue = document.getElementById('sortSelect')?.value || 'featured';

  let list = PRODUCTS.filter(p => {
    if (typeFilter && p.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (patternBoxes.length > 0 && !patternBoxes.includes(p.pattern)) return false;
    if (fabricBoxes.length > 0 && !fabricBoxes.includes(p.fabric)) return false;
    return true;
  });

  // Sorting
  if (sortValue === 'low-to-high') {
    list.sort((a, b) => a.price - b.price);
  } else if (sortValue === 'high-to-low') {
    list.sort((a, b) => b.price - a.price);
  }

  const countEl = document.getElementById('productCount');
  if (countEl) countEl.textContent = `${list.length} Items Found`;

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: #777;">No products matched your selected filters.</div>`;
  } else {
    container.innerHTML = list.map(createProductCardHTML).join('');
  }
}

// INITIALIZATION ON DOM LOADED
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  updateWishlistBadge();
  renderCartDrawer();

  // Attach overlay close events
  document.getElementById('cartOverlay')?.addEventListener('click', () => toggleCartDrawer(false));
  document.getElementById('closeCartBtn')?.addEventListener('click', () => toggleCartDrawer(false));
  document.getElementById('cartTrigger')?.addEventListener('click', () => toggleCartDrawer(true));

  // Initialize Home Featured Grid if present
  const homeGrid = document.getElementById('homeFeaturedGrid');
  if (homeGrid) {
    homeGrid.innerHTML = PRODUCTS.slice(0, 4).map(createProductCardHTML).join('');
  }

  // Initialize Products Page
  if (document.getElementById('productsGrid')) {
    filterAndRenderProducts();
    // Add event listeners to filters
    document.querySelectorAll('.filter-checkbox input').forEach(cb => {
      cb.addEventListener('change', filterAndRenderProducts);
    });
    document.getElementById('sortSelect')?.addEventListener('change', filterAndRenderProducts);
  }
});
