import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase, isMocked } from '../supabaseClient';
import {
  BarChart,
  ShoppingBag,
  Grid,
  Image as ImageIcon,
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Lock,
  ArrowRightLeft,
  Star,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const {
    user,
    profile,
    isAdmin,
    authLoading,
    setShowAuth,
    products,
    categories,
    banners,
    orders,
    refreshData
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // overview | products | categories | banners | orders
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = creating, object = editing

  // CRUD Forms State
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    category_id: '',
    regular_price: '',
    sale_price: '',
    discount_percent: '',
    fit_type: '',
    color: '',
    sizes: '', // comma separated input
    is_trending: false,
    image_url_1: '',
    image_url_2: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    image_url: '',
    display_order: ''
  });

  const [bannerForm, setBannerForm] = useState({
    image_url: '',
    link_url: '',
    section_placement: 'hero', // hero | collection
    title: '',
    subtitle: '',
    display_order: ''
  });

  // Handle Loading Auth
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-black)', borderRadius: '50%', animation: 'dropdownFade 0.6s linear infinite' }} />
        <p style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Authenticating Admin...</p>
      </div>
    );
  }

  // Handle Unauthorized Users
  if (!user || !isAdmin) {
    return (
      <div className="container text-center" style={{ padding: 'var(--spacing-xxl) 0', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-md)' }}>
        <Lock size={64} style={{ opacity: 0.2 }} />
        <h1 style={{ fontSize: '20px', letterSpacing: '1px' }}>ADMINISTRATOR ACCESS ONLY</h1>
        <p style={{ color: 'var(--color-secondary-text)', maxWidth: '450px', fontSize: '14px', lineHeight: '1.6' }}>
          This page is reserved for store owners. Please sign in using an account with administrator privileges.
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
          <button className="admin-btn" onClick={() => setShowAuth(true)}>
            SIGN IN
          </button>
          <button className="admin-btn secondary" onClick={() => {
            // Trigger login with dummy credentials
            setShowAuth(true);
          }}>
            VIEW DEMO ACCOUNT
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIONS ---

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    if (activeTab === 'products') {
      setProductForm({
        title: '',
        description: '',
        category_id: categories[0]?.id || '',
        regular_price: '',
        sale_price: '',
        discount_percent: '',
        fit_type: '',
        color: '',
        sizes: '30, 32, 34, 36, M, L, XL',
        is_trending: false,
        image_url_1: '',
        image_url_2: ''
      });
    } else if (activeTab === 'categories') {
      setCategoryForm({
        name: '',
        slug: '',
        image_url: '',
        display_order: categories.length + 1
      });
    } else if (activeTab === 'banners') {
      setBannerForm({
        image_url: '',
        link_url: '',
        section_placement: 'hero',
        title: '',
        subtitle: '',
        display_order: banners.length + 1
      });
    }
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    if (activeTab === 'products') {
      setProductForm({
        title: item.title,
        description: item.description || '',
        category_id: item.category_id || '',
        regular_price: item.regular_price,
        sale_price: item.sale_price || '',
        discount_percent: item.discount_percent || '',
        fit_type: item.fit_type || '',
        color: item.color || '',
        sizes: (item.sizes || []).join(', '),
        is_trending: !!item.is_trending,
        image_url_1: item.images?.[0] || item.image_url || '',
        image_url_2: item.images?.[1] || ''
      });
    } else if (activeTab === 'categories') {
      setCategoryForm({
        name: item.name,
        slug: item.slug,
        image_url: item.image_url || '',
        display_order: item.display_order || ''
      });
    } else if (activeTab === 'banners') {
      setBannerForm({
        image_url: item.image_url,
        link_url: item.link_url || '',
        section_placement: item.section_placement || 'hero',
        title: item.title || '',
        subtitle: item.subtitle || '',
        display_order: item.display_order || ''
      });
    }
    setModalOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    if (isMocked) {
      const mockKey = `mock_db_${activeTab}`;
      const data = JSON.parse(localStorage.getItem(mockKey)) || [];
      const updated = data.filter(item => item.id !== id);
      localStorage.setItem(mockKey, JSON.stringify(updated));
      alert("Deleted successfully!");
      refreshData();
    } else {
      const { error } = await supabase.from(activeTab).delete().eq('id', id);
      if (error) {
        alert("Supabase delete failed: " + error.message);
      } else {
        alert("Deleted successfully!");
        refreshData();
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (isMocked) {
      const dbOrders = JSON.parse(localStorage.getItem('mock_db_orders')) || [];
      const updated = dbOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      localStorage.setItem('mock_db_orders', JSON.stringify(updated));
      refreshData();
    } else {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) alert("Failed to update status: " + error.message);
      else refreshData();
    }
  };

  // --- SUBMITS ---

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const cleanSizes = productForm.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const regular = parseFloat(productForm.regular_price);
    const sale = productForm.sale_price ? parseFloat(productForm.sale_price) : null;
    const discount = productForm.discount_percent ? parseInt(productForm.discount_percent) : null;

    const payload = {
      title: productForm.title,
      slug: productForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: productForm.description,
      category_id: parseInt(productForm.category_id),
      regular_price: regular,
      sale_price: sale,
      discount_percent: discount,
      fit_type: productForm.fit_type,
      color: productForm.color,
      sizes: cleanSizes,
      is_trending: productForm.is_trending,
      image_url: productForm.image_url_1, // primary fallback
      images: [productForm.image_url_1, productForm.image_url_2].filter(Boolean)
    };

    if (editingItem) {
      if (isMocked) {
        const prods = JSON.parse(localStorage.getItem('mock_db_products')) || [];
        const idx = prods.findIndex(p => p.id === editingItem.id);
        prods[idx] = { ...prods[idx], ...payload };
        localStorage.setItem('mock_db_products', JSON.stringify(prods));
      } else {
        await supabase.from('products').update(payload).eq('id', editingItem.id);
      }
    } else {
      if (isMocked) {
        const prods = JSON.parse(localStorage.getItem('mock_db_products')) || [];
        prods.push({ id: Date.now(), ...payload });
        localStorage.setItem('mock_db_products', JSON.stringify(prods));
      } else {
        await supabase.from('products').insert([payload]);
      }
    }
    setModalOpen(false);
    refreshData();
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      image_url: categoryForm.image_url,
      display_order: parseInt(categoryForm.display_order)
    };

    if (editingItem) {
      if (isMocked) {
        const cats = JSON.parse(localStorage.getItem('mock_db_categories')) || [];
        const idx = cats.findIndex(c => c.id === editingItem.id);
        cats[idx] = { ...cats[idx], ...payload };
        localStorage.setItem('mock_db_categories', JSON.stringify(cats));
      } else {
        await supabase.from('categories').update(payload).eq('id', editingItem.id);
      }
    } else {
      if (isMocked) {
        const cats = JSON.parse(localStorage.getItem('mock_db_categories')) || [];
        cats.push({ id: Date.now(), ...payload });
        localStorage.setItem('mock_db_categories', JSON.stringify(cats));
      } else {
        await supabase.from('categories').insert([payload]);
      }
    }
    setModalOpen(false);
    refreshData();
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      image_url: bannerForm.image_url,
      link_url: bannerForm.link_url,
      section_placement: bannerForm.section_placement,
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      display_order: parseInt(bannerForm.display_order)
    };

    if (editingItem) {
      if (isMocked) {
        const bans = JSON.parse(localStorage.getItem('mock_db_banners')) || [];
        const idx = bans.findIndex(b => b.id === editingItem.id);
        bans[idx] = { ...bans[idx], ...payload };
        localStorage.setItem('mock_db_banners', JSON.stringify(bans));
      } else {
        await supabase.from('banners').update(payload).eq('id', editingItem.id);
      }
    } else {
      if (isMocked) {
        const bans = JSON.parse(localStorage.getItem('mock_db_banners')) || [];
        bans.push({ id: Date.now(), ...payload });
        localStorage.setItem('mock_db_banners', JSON.stringify(bans));
      } else {
        await supabase.from('banners').insert([payload]);
      }
    }
    setModalOpen(false);
    refreshData();
  };

  return (
    <div className="admin-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div style={{ padding: '0 var(--spacing-lg) var(--spacing-sm) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-sm)' }}>
          <p style={{ fontSize: '10px', color: 'var(--color-secondary-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logged in as</p>
          <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{profile?.full_name}</p>
        </div>
        
        <button
          className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart size={18} /> Overview
        </button>
        <button
          className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <ShoppingBag size={18} /> Products
        </button>
        <button
          className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Grid size={18} /> Categories
        </button>
        <button
          className={`admin-nav-item ${activeTab === 'banners' ? 'active' : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          <ImageIcon size={18} /> Banners
        </button>
        <button
          className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ClipboardList size={18} /> Orders
        </button>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="admin-main">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="admin-header">
              <h2 className="admin-title">Overview Dashboard</h2>
              <button className="admin-btn secondary" onClick={refreshData} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} /> Refresh Data
              </button>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon"><ShoppingBag size={24} /></div>
                <div className="admin-stat-info">
                  <span className="admin-stat-label">Products</span>
                  <span className="admin-stat-val">{products.length}</span>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon"><Grid size={24} /></div>
                <div className="admin-stat-info">
                  <span className="admin-stat-label">Categories</span>
                  <span className="admin-stat-val">{categories.length}</span>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon"><ClipboardList size={24} /></div>
                <div className="admin-stat-info">
                  <span className="admin-stat-label">Total Orders</span>
                  <span className="admin-stat-val">{orders.length}</span>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '14px', marginBottom: 'var(--spacing-md)' }}>RECENT ORDERS</h3>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Address</th>
                    <th>Total amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'monospace' }}>#{o.id}</td>
                      <td style={{ fontWeight: 'bold' }}>{o.customer_name}</td>
                      <td>{o.customer_address}</td>
                      <td>₹{o.total_amount.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge-admin-tag ${o.status === 'delivered' ? 'trending' : ''}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-secondary-text)' }}>
                        No orders registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div>
            <div className="admin-header">
              <h2 className="admin-title">Manage Products</h2>
              <button className="admin-btn" onClick={handleOpenCreateModal}>
                <Plus size={16} /> Add Product
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Regular Price</th>
                    <th>Sale Price</th>
                    <th>Trending</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const cat = categories.find(c => c.id === p.category_id);
                    return (
                      <tr key={p.id}>
                        <td>
                          <img
                            src={p.images?.[0] || p.image_url}
                            alt={p.title}
                            className="admin-table-img"
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{p.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>Fit: {p.fit_type} | Color: {p.color}</div>
                        </td>
                        <td>{cat ? cat.name : 'Unassigned'}</td>
                        <td>₹{p.regular_price}</td>
                        <td>{p.sale_price ? `₹${p.sale_price}` : '-'}</td>
                        <td>
                          {p.is_trending && (
                            <span className="badge-admin-tag trending"><Star size={10} fill="var(--color-white)" /> Trending</span>
                          )}
                        </td>
                        <td>
                          <div className="admin-actions-cell">
                            <button className="admin-action-icon-btn" onClick={() => handleOpenEditModal(p)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="admin-action-icon-btn delete" onClick={() => handleDeleteItem(p.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES */}
        {activeTab === 'categories' && (
          <div>
            <div className="admin-header">
              <h2 className="admin-title">Manage Categories</h2>
              <button className="admin-btn" onClick={handleOpenCreateModal}>
                <Plus size={16} /> Add Category
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Thumbnail</th>
                    <th>Category Name</th>
                    <th>URL Slug</th>
                    <th>Display Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td>
                        <img
                          src={c.image_url}
                          alt={c.name}
                          className="admin-table-img"
                          style={{ borderRadius: '50%', width: '40px', height: '40px' }}
                        />
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                      <td>{c.slug}</td>
                      <td>{c.display_order}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-action-icon-btn" onClick={() => handleOpenEditModal(c)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="admin-action-icon-btn delete" onClick={() => handleDeleteItem(c.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BANNERS */}
        {activeTab === 'banners' && (
          <div>
            <div className="admin-header">
              <h2 className="admin-title">Manage Banners</h2>
              <button className="admin-btn" onClick={handleOpenCreateModal}>
                <Plus size={16} /> Add Banner
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Banner Image</th>
                    <th>Section Placement</th>
                    <th>Title & Subtitle</th>
                    <th>Link Destination</th>
                    <th>Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map(b => (
                    <tr key={b.id}>
                      <td>
                        <img
                          src={b.image_url}
                          alt={b.title || "Banner"}
                          className="admin-table-img"
                          style={{ aspectRatio: '16 / 9', width: '90px' }}
                        />
                      </td>
                      <td>
                        <span className="badge-admin-tag">{b.section_placement}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{b.title || '-'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>{b.subtitle || '-'}</div>
                      </td>
                      <td><code>{b.link_url}</code></td>
                      <td>{b.display_order}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button className="admin-action-icon-btn" onClick={() => handleOpenEditModal(b)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="admin-action-icon-btn delete" onClick={() => handleDeleteItem(b.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ORDERS */}
        {activeTab === 'orders' && (
          <div>
            <div className="admin-header">
              <h2 className="admin-title">Customer Orders</h2>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order Details</th>
                    <th>Customer info</th>
                    <th>Address</th>
                    <th>Products purchased</th>
                    <th>Total</th>
                    <th>Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>#{o.id}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{o.customer_name}</div>
                        <div>{o.customer_phone}</div>
                      </td>
                      <td style={{ fontSize: '12px', maxWidth: '180px' }}>{o.customer_address}</td>
                      <td>
                        <ul style={{ listStyle: 'none', fontSize: '11px', padding: 0 }}>
                          {(o.items || []).map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '2px' }}>
                              - {item.title} ({item.size}) x {item.qty}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>₹{o.total_amount.toLocaleString('en-IN')}</td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          style={{
                            padding: '4px',
                            fontSize: '12px',
                            border: '1px solid var(--color-border)',
                            outline: 'none',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-secondary-text)' }}>
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- FORM MODAL (CRUD OPERATIONS) --- */}
      {modalOpen && (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div
            className="modal-container admin-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              {editingItem ? `EDIT ${activeTab.toUpperCase().slice(0, -1)}` : `ADD NEW ${activeTab.toUpperCase().slice(0, -1)}`}
            </h3>

            {/* PRODUCT FORM */}
            {activeTab === 'products' && (
              <form onSubmit={handleProductSubmit}>
                <div className="form-group">
                  <label className="form-label">Product Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="e.g. Classic Indigo Denim"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Description</label>
                  <textarea
                    required
                    rows={3}
                    className="form-input"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Detailed features, washing specs..."
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div className="admin-form-grid">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    >
                      {categories.map(c => (
                        <option value={c.id} key={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fit Profile</label>
                    <input
                      type="text"
                      className="form-input"
                      value={productForm.fit_type}
                      onChange={(e) => setProductForm({ ...productForm, fit_type: e.target.value })}
                      placeholder="e.g. Super Slim Fit"
                    />
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="form-group">
                    <label className="form-label">Regular MRP Price (₹)</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={productForm.regular_price}
                      onChange={(e) => setProductForm({ ...productForm, regular_price: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sale Price (₹) [Optional]</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productForm.sale_price}
                      onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="form-group">
                    <label className="form-label">Discount % [Optional]</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productForm.discount_percent}
                      onChange={(e) => setProductForm({ ...productForm, discount_percent: e.target.value })}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color Description</label>
                    <input
                      type="text"
                      className="form-input"
                      value={productForm.color}
                      onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                      placeholder="e.g. Vintage Indigo"
                    />
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="form-group">
                    <label className="form-label">Sizing Stock (comma list)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={productForm.sizes}
                      onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                      placeholder="30, 32, 34, M, L"
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '30px' }}>
                    <label className="filter-item-label">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={productForm.is_trending}
                        onChange={(e) => setProductForm({ ...productForm, is_trending: e.target.checked })}
                      />
                      Feature in "Trending This Week"
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Image URL</label>
                  <input
                    type="url"
                    required
                    className="form-input"
                    value={productForm.image_url_1}
                    onChange={(e) => setProductForm({ ...productForm, image_url_1: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Image URL (Hover view)</label>
                  <input
                    type="url"
                    className="form-input"
                    value={productForm.image_url_2}
                    onChange={(e) => setProductForm({ ...productForm, image_url_2: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="admin-btn secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="admin-btn">Save Product</button>
                </div>
              </form>
            )}

            {/* CATEGORY FORM */}
            {activeTab === 'categories' && (
              <form onSubmit={handleCategorySubmit}>
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g. JEANS"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    className="form-input"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    placeholder="e.g. jeans"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Thumbnail Image URL</label>
                  <input
                    type="url"
                    required
                    className="form-input"
                    value={categoryForm.image_url}
                    onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={categoryForm.display_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, display_order: e.target.value })}
                  />
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="admin-btn secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="admin-btn">Save Category</button>
                </div>
              </form>
            )}

            {/* BANNER FORM */}
            {activeTab === 'banners' && (
              <form onSubmit={handleBannerSubmit}>
                <div className="form-group">
                  <label className="form-label">Banner Placement</label>
                  <select
                    className="form-input"
                    value={bannerForm.section_placement}
                    onChange={(e) => setBannerForm({ ...bannerForm, section_placement: e.target.value })}
                  >
                    <option value="hero">Hero Carousel Banner (Full Width)</option>
                    <option value="collection">Shop by Collection Split Banner</option>
                  </select>
                </div>

                <div className="admin-form-grid">
                  <div className="form-group">
                    <label className="form-label">Banner Title [Optional]</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="e.g. THE SUNDAY BRUNCH EDIT"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Banner Subtitle [Optional]</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bannerForm.subtitle}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      placeholder="e.g. Classic Linens Series"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    required
                    className="form-input"
                    value={bannerForm.image_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="admin-form-grid">
                  <div className="form-group">
                    <label className="form-label">Link Redirect URL</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bannerForm.link_url}
                      onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                      placeholder="e.g. /category/jeans"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      value={bannerForm.display_order}
                      onChange={(e) => setBannerForm({ ...bannerForm, display_order: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="admin-btn secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="admin-btn">Save Banner</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
