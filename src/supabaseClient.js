import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we should use the real Supabase client or a mock client
const useMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project-id');

let supabaseClientInstance = null;

// Mock database initial seed data
const seedCategories = [
  { id: 1, name: "SPRING SUMMER'26", slug: "spring-summer-26", image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80", display_order: 1 },
  { id: 2, name: "SHOES", slug: "shoes", image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80", display_order: 2 },
  { id: 3, name: "SHIRTS", slug: "shirts", image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80", display_order: 3 },
  { id: 4, name: "T-SHIRTS", slug: "t-shirts", image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80", display_order: 4 },
  { id: 5, name: "JEANS", slug: "jeans", image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80", display_order: 5 },
  { id: 6, name: "WINTER WEAR", slug: "winter-wear", image_url: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=600&auto=format&fit=crop&q=80", display_order: 6 },
  { id: 7, name: "SALE", slug: "sale", image_url: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&auto=format&fit=crop&q=80", display_order: 7 }
];

const seedProducts = [
  {
    id: 101,
    category_id: 5,
    title: "Mid Blue Super Slim Fit Denim",
    slug: "mid-blue-super-slim-fit-denim",
    description: "Classic mid-blue wash denim crafted in premium stretch cotton. Tailored for a sleek super slim fit with detailed whiskering and standard five-pocket design.",
    regular_price: 3499.00,
    sale_price: 1749.00,
    discount_percent: 50,
    fit_type: "Super Slim Fit",
    color: "Mid Blue",
    sizes: ["30", "32", "34", "36"],
    is_trending: true,
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: 102,
    category_id: 5,
    title: "Charcoal Black Skinny Fit Jeans",
    slug: "charcoal-black-skinny-fit-jeans",
    description: "Faded charcoal black jeans featuring a skinny leg profile. Extremely durable and comfortable for everyday urban streetwear.",
    regular_price: 3999.00,
    sale_price: 2399.00,
    discount_percent: 40,
    fit_type: "Skinny Fit",
    color: "Charcoal Black",
    sizes: ["30", "32", "34"],
    is_trending: true,
    images: [
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: 103,
    category_id: 3,
    title: "Tropical Leaf Printed Relaxed Shirt",
    slug: "tropical-leaf-printed-relaxed-shirt",
    description: "Breathable cotton-linen blend casual shirt with dynamic tropical prints. Features a relaxed collar and short sleeves, perfect for summer getaways.",
    regular_price: 2499.00,
    sale_price: 1499.00,
    discount_percent: 40,
    fit_type: "Relaxed Fit",
    color: "White/Green",
    sizes: ["M", "L", "XL"],
    is_trending: true,
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: 104,
    category_id: 3,
    title: "Urban Utility Sage Cargo Shirt",
    slug: "urban-utility-sage-cargo-shirt",
    description: "Premium cotton twill utility shirt featuring dual chest pockets and shoulder epaulets. Crafted in a rich sage green color.",
    regular_price: 2999.00,
    sale_price: 2099.00,
    discount_percent: 30,
    fit_type: "Slim Fit",
    color: "Sage Green",
    sizes: ["S", "M", "L", "XL"],
    is_trending: false,
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: 105,
    category_id: 4,
    title: "Vantage Graphic Tee - Off-White",
    slug: "vantage-graphic-tee-off-white",
    description: "Heavyweight loopback cotton jersey T-shirt with vintage-inspired graphical prints. Features drop shoulders for a relaxed modern fit.",
    regular_price: 1499.00,
    sale_price: 899.00,
    discount_percent: 40,
    fit_type: "Relaxed Fit",
    color: "Off-White",
    sizes: ["M", "L", "XL"],
    is_trending: true,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: 106,
    category_id: 2,
    title: "Classic White Leather Sneakers",
    slug: "classic-white-leather-sneakers",
    description: "Minimalist sneakers crafted from soft full-grain leather. Finished with comfortable padded insoles and clean white vulcanized rubber cupsoles.",
    regular_price: 4999.00,
    sale_price: 3499.00,
    discount_percent: 30,
    fit_type: "Regular Fit",
    color: "White",
    sizes: ["8", "9", "10"],
    is_trending: true,
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: 107,
    category_id: 6,
    title: "Urban Explorer Puffer Jacket",
    slug: "urban-explorer-puffer-jacket",
    description: "Fully padded water-resistant winter puffer jacket. Equipped with high-density synthetic down insulation, zip pockets, and adjustable hood.",
    regular_price: 5999.00,
    sale_price: 4199.00,
    discount_percent: 30,
    fit_type: "Regular Fit",
    color: "Olive Green",
    sizes: ["M", "L", "XL"],
    is_trending: false,
    images: [
      "https://images.unsplash.com/photo-1610410088109-844609c702c5?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&auto=format&fit=crop&q=80"
    ]
  }
];

const seedBanners = [
  { id: 1, image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80", link_url: "/category/spring-summer-26", section_placement: "hero", title: "SPRING SUMMER '26", subtitle: "REDEFINING URBAN CASUALS", display_order: 1 },
  { id: 2, image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop&q=80", link_url: "/category/jeans", section_placement: "hero", title: "THE DENIM CULTURE", subtitle: "FIND YOUR PERFECT FIT", display_order: 2 },
  { id: 3, image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&auto=format&fit=crop&q=80", link_url: "/category/shirts", section_placement: "collection", title: "The Sunday Brunch Edit", subtitle: "Relaxed Silhouettes & Linen Linings", display_order: 1 },
  { id: 4, image_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=80", link_url: "/category/jeans", section_placement: "collection", title: "TRIPLE O FIVE O", subtitle: "Premium Selvage Denim Series", display_order: 2 }
];

// Initialize localStorage databases if not set
if (typeof window !== 'undefined' && useMock) {
  if (!localStorage.getItem('mock_db_categories')) {
    localStorage.setItem('mock_db_categories', JSON.stringify(seedCategories));
  } else {
    // Force update broken images if they are in the cached localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('mock_db_categories')) || [];
      let changed = false;
      const updated = existing.map(cat => {
        if (cat.slug === 'winter-wear' && cat.image_url.includes('1610410088109')) {
          cat.image_url = 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=600&auto=format&fit=crop&q=80';
          changed = true;
        }
        if (cat.slug === 'sale' && cat.image_url.includes('1472417584965')) {
          cat.image_url = 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&auto=format&fit=crop&q=80';
          changed = true;
        }
        return cat;
      });
      if (changed) {
        localStorage.setItem('mock_db_categories', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!localStorage.getItem('mock_db_products')) {
    localStorage.setItem('mock_db_products', JSON.stringify(seedProducts));
  }
  if (!localStorage.getItem('mock_db_banners')) {
    localStorage.setItem('mock_db_banners', JSON.stringify(seedBanners));
  }
  if (!localStorage.getItem('mock_db_profiles')) {
    // Default admin profile
    localStorage.setItem('mock_db_profiles', JSON.stringify([
      { id: "admin-uid", full_name: "Classic Admin", phone: "9876543210", role: "admin" },
      { id: "user-uid", full_name: "John Doe", phone: "9999988888", role: "user" }
    ]));
  }
}

// Chainable mock builder mimicking Supabase syntax
class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderBy = null;
    this.isSingle = false;
    this.action = 'select';
    this.payload = null;
  }

  select(columns) {
    this.action = 'select';
    return this;
  }

  insert(rows) {
    this.action = 'insert';
    this.payload = rows;
    return this;
  }

  update(row) {
    this.action = 'update';
    this.payload = row;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderBy = { column, ascending };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async execute() {
    let data = JSON.parse(localStorage.getItem(`mock_db_${this.table}`)) || [];

    if (this.action === 'insert') {
      const newRows = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = newRows.map(row => {
        const id = row.id || Date.now() + Math.floor(Math.random() * 1000);
        return {
          id,
          created_at: new Date().toISOString(),
          ...row
        };
      });
      data.push(...inserted);
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(data));
      return { data: Array.isArray(this.payload) ? inserted : inserted[0], error: null };
    }

    if (this.action === 'update') {
      data = data.map(row => {
        let matches = true;
        for (const f of this.filters) {
          if (row[f.column] != f.value) matches = false;
        }
        if (matches) {
          return { ...row, ...this.payload };
        }
        return row;
      });
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(data));
      
      const updated = data.filter(row => {
        let matches = true;
        for (const f of this.filters) {
          if (row[f.column] != f.value) matches = false;
        }
        return matches;
      });
      return { data: this.isSingle ? (updated[0] || null) : updated, error: null };
    }

    if (this.action === 'delete') {
      data = data.filter(row => {
        let matches = true;
        for (const f of this.filters) {
          if (row[f.column] != f.value) matches = false;
        }
        return !matches;
      });
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(data));
      return { data: null, error: null };
    }

    // Default: select
    let filtered = [...data];
    for (const f of this.filters) {
      filtered = filtered.filter(row => {
        if (Array.isArray(row[f.column])) {
          return row[f.column].includes(f.value);
        }
        return row[f.column] == f.value;
      });
    }

    if (this.orderBy) {
      const col = this.orderBy.column;
      const asc = this.orderBy.ascending;
      filtered.sort((a, b) => {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
        return 0;
      });
    }

    if (this.isSingle) {
      return { data: filtered[0] || null, error: null };
    }

    return { data: filtered, error: null };
  }

  // Promise resolution interface
  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Mock auth interface
const mockAuth = {
  listeners: [],

  async signUp({ email, password, phone, options }) {
    const profiles = JSON.parse(localStorage.getItem('mock_db_profiles')) || [];
    const uid = 'mock-uid-' + Math.random().toString(36).substr(2, 9);
    const newProfile = {
      id: uid,
      full_name: options?.data?.full_name || email.split('@')[0],
      phone: phone || options?.data?.phone || '',
      role: 'user',
      created_at: new Date().toISOString()
    };
    profiles.push(newProfile);
    localStorage.setItem('mock_db_profiles', JSON.stringify(profiles));

    const session = {
      access_token: 'mock-token-' + uid,
      user: {
        id: uid,
        email,
        phone,
        user_metadata: options?.data || {}
      }
    };
    
    localStorage.setItem('mock_session', JSON.stringify(session));
    this.notify(session);

    return { data: { user: session.user, session }, error: null };
  },

  async signInWithPassword({ email, password }) {
    const profiles = JSON.parse(localStorage.getItem('mock_db_profiles')) || [];
    // Super simple mock credentials verification
    // For admin testing: admin@classic.com / admin123
    let matchingProfile = null;
    let userRole = 'user';
    let fullName = 'Normal User';
    
    if (email === 'admin@classic.com') {
      matchingProfile = profiles.find(p => p.role === 'admin');
      userRole = 'admin';
      fullName = 'Classic Admin';
    } else {
      matchingProfile = profiles.find(p => p.id === 'user-uid') || profiles[1];
      userRole = matchingProfile ? matchingProfile.role : 'user';
      fullName = matchingProfile ? matchingProfile.full_name : 'John Doe';
    }

    const uid = matchingProfile ? matchingProfile.id : 'mock-uid-regular';
    const session = {
      access_token: 'mock-token-' + uid,
      user: {
        id: uid,
        email,
        phone: matchingProfile?.phone || '',
        user_metadata: {
          full_name: fullName,
          role: userRole
        }
      }
    };

    localStorage.setItem('mock_session', JSON.stringify(session));
    this.notify(session);

    return { data: { user: session.user, session }, error: null };
  },

  async signInWithOtp({ phone, email }) {
    // Simulate sending OTP
    return { data: { message: "Mock OTP Sent successfully!" }, error: null };
  },

  async verifyOtp({ phone, email, token }) {
    // Simulating verified OTP. Make any code like '1234' or '123456' pass.
    const profiles = JSON.parse(localStorage.getItem('mock_db_profiles')) || [];
    const regularProfile = profiles.find(p => p.role === 'user') || profiles[1];
    const uid = regularProfile.id;
    
    const session = {
      access_token: 'mock-token-' + uid,
      user: {
        id: uid,
        email: email || 'user@example.com',
        phone: phone || regularProfile.phone,
        user_metadata: {
          full_name: regularProfile.full_name,
          role: regularProfile.role
        }
      }
    };
    
    localStorage.setItem('mock_session', JSON.stringify(session));
    this.notify(session);
    return { data: { user: session.user, session }, error: null };
  },

  async signOut() {
    localStorage.removeItem('mock_session');
    this.notify(null);
    return { error: null };
  },

  async getSession() {
    const sessionStr = localStorage.getItem('mock_session');
    if (!sessionStr) return { data: { session: null }, error: null };
    return { data: { session: JSON.parse(sessionStr) }, error: null };
  },

  async getUser() {
    const { data: { session } } = await this.getSession();
    if (!session) return { data: { user: null }, error: null };
    return { data: { user: session.user }, error: null };
  },

  onAuthStateChange(callback) {
    this.listeners.push(callback);
    // Trigger initial auth check
    this.getSession().then(({ data: { session } }) => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
          }
        }
      }
    };
  },

  notify(session) {
    const event = session ? 'SIGNED_IN' : 'SIGNED_OUT';
    this.listeners.forEach(cb => cb(event, session));
  }
};

// Mock storage interface
const mockStorage = {
  from(bucket) {
    return {
      async upload(path, file) {
        // Return a mock object URL or mock URL
        const mockUrl = URL.createObjectURL(file);
        return { data: { path, fullPath: `${bucket}/${path}` }, error: null };
      },
      getPublicUrl(path) {
        // Just return a placeholder or standard url
        return { data: { publicUrl: path } };
      }
    };
  }
};

// Export actual or mock Supabase Client
if (useMock) {
  supabaseClientInstance = {
    auth: mockAuth,
    storage: mockStorage,
    from(table) {
      return new MockQueryBuilder(table);
    }
  };
} else {
  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClientInstance;
export const isMocked = useMock;
