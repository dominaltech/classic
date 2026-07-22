import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Heart, User, Search, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';

export default function Header() {
  const { cartItemCount, wishlist, setShowCart, setShowAuth, user, profile, isAdmin, logout } = useApp();
  const [promoIndex, setPromoIndex] = useState(0);
  const [searchVal, setSearchVal] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const promos = [
    "FREE SHIPPING ABOVE ₹999 | EASY 7-DAY RETURNS | DELIVERED IN 3-7 DAYS",
    "THIS WEBSITE IS OWNED AND MANAGED BY DOMINAL TECHNOLOGIES",
    "GST BENEFIT INCLUDED | 256-BIT SECURE PHONEPE PAYMENTS"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const megaMenuData = {
    "SPRING SUMMER'26": {
      "Highlights": ["New Arrivals", "Trending Now", "Summer Linens", "Pastel Hues"],
      "Top Wear": ["Floral Printed Shirts", "Sateen Polos", "Graphic Tees", "Linen Shirts"],
      "Bottom Wear": ["Light Wash Denim", "Cargos & Chinos", "Drawstring Shorts", "Trousers"],
      "Shop By Style": ["Vacation Wear", "Casual Fridays", "Streetwear Essentials", "Monochrome"]
    },
    "JEANS": {
      "Fits": ["Super Slim Fit", "Skinny Fit", "Slim Fit", "Relaxed Fit", "Straight Fit"],
      "Washes": ["Light Blue Wash", "Mid Blue Wash", "Dark Indigo", "Charcoal Black", "Pure White"],
      "Styles": ["Distressed", "Classic Five-Pocket", "Cargo Jeans", "Utility Denim"],
      "Collection": ["Triple O Five O Series", "Selvage Denim", "Flex-stretch Performance", "Recycled Cotton"]
    },
    "SHIRTS": {
      "Sleeve": ["Full Sleeve Shirts", "Half Sleeve Shirts", "Sleeveless"],
      "Fit": ["Super Slim Fit Shirts", "Slim Fit Shirts", "Regular Fit Shirts", "Relaxed Fit Shirts"],
      "Pattern": ["Solid Shirts", "Checked Shirts", "Printed Shirts", "Striped Shirts", "Denim Shirts"],
      "Fabric": ["Premium Cotton", "Linen Blend", "Rayon Soft", "Twill Utility"]
    },
    "T-SHIRTS": {
      "Type": ["Polo T-Shirts", "Crew Neck Tees", "V-Neck T-Shirts", "Henleys"],
      "Fit": ["Slim Fit Tees", "Relaxed Fit Tees", "Oversized Graphic Tees", "Regular Fit"],
      "Style": ["Solid Colors", "Typography Prints", "Striped Polos", "Pocket Tees"],
      "Fabric": ["Heavyweight Loopback", "Slub Cotton", "Supima Premium", "Cotton Lycra"]
    },
    "SHOES": {
      "Category": ["Leather Sneakers", "Casual Loafers", "Chukka Boots", "Running Trainers"],
      "Occasion": ["Street Smart", "Smart Casuals", "Weekend Lounge", "Athleisure"],
      "Material": ["Genuine Suede", "Full Grain Leather", "Knit Mesh", "Canvas Canvas"],
      "Trending": ["Platform Sneakers", "Retro Cup-soles", "Minimalist Slip-ons", "Court Sneakers"]
    },
    "WINTER WEAR": {
      "Type": ["Puffer Jackets", "Leather Biker Jackets", "Windbreakers", "Denim Jackets"],
      "Knits": ["Crewneck Sweaters", "Turtle Neck Pullovers", "Hoodies & Sweatshirts", "Cardigans"],
      "Cuts": ["Slim Knitwear", "Heavyweight Hoodies", "Zip-through Cardigans", "Bomber Jackets"],
      "Fabric": ["French Terry", "Merino Wool Blend", "Quilted Nylon", "Sherpa Fleece"]
    },
    "SALE": {
      "Discounts": ["Flat 50% Off", "Flat 40% Off", "Flat 30% Off", "Under ₹999 Shop"],
      "Categories": ["Sale Shirts", "Sale Jeans", "Sale T-Shirts", "Sale Footwear"],
      "Hot Sellers": ["Best of Jeans", "Trending Shirts", "Graphic Tees Pack", "Jackets Sale"],
      "Clearance": ["Last Sizes Left", "Warehouse Clearance", "Flat 60% Off", "Seasonal Steals"]
    }
  };

  return (
    <div className="header-container">
      {/* Promotion Bar */}
      <div className="promo-bar">
        <div className="promo-text">{promos[promoIndex]}</div>
      </div>

      {/* Main Navbar */}
      <header className="navbar container">
        {/* Mobile menu toggle */}
        <button className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link to="/" className="logo" style={{ fontSize: '15px', whiteSpace: 'nowrap' }}>
          CLASSIC COLLECTION SOLAPUR
        </Link>

        {/* Main Nav Links (Desktop) */}
        <nav className="desktop-only" style={{ display: 'block', height: '100%' }}>
          <ul className="nav-links">
            {Object.keys(megaMenuData).map((catName) => (
              <li className="nav-item" key={catName}>
                <Link
                  to={`/category/${catName.toLowerCase().replace(/['\s]/g, '-')}`}
                  className="nav-link"
                >
                  {catName}
                </Link>
                {/* Mega Menu Dropdown */}
                <div className="mega-menu">
                  <div className="mega-menu-content">
                    {Object.entries(megaMenuData[catName]).map(([colTitle, items]) => (
                      <div className="mega-column" key={colTitle}>
                        <h4 className="mega-column-title">{colTitle}</h4>
                        <ul className="mega-column-list">
                          {items.map((item) => (
                            <li className="mega-column-item" key={item}>
                              <Link
                                to={`/category/${catName.toLowerCase().replace(/['\s]/g, '-')}?filter=${encodeURIComponent(item)}`}
                                className="mega-column-link"
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Actions (Search, Wishlist, Account, Cart) */}
        <div className="nav-actions">
          {/* Search bar */}
          <form className="search-bar-container desktop-only" onSubmit={handleSearchSubmit}>
            <Search className="search-icon-nav" size={16} />
            <input
              type="text"
              placeholder="SEARCH PRODUCTS"
              className="search-input"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </form>

          {/* User profile dropdown button */}
          <div className="profile-dropdown-wrapper" style={{ position: 'relative' }}>
            <button
              className="action-btn"
              onClick={() => {
                if (user) {
                  setProfileDropdownOpen(!profileDropdownOpen);
                } else {
                  setShowAuth(true);
                }
              }}
              title={user ? `Account (${profile?.full_name || 'User'})` : "Sign In"}
            >
              <User size={20} />
              {user && isAdmin && (
                <span className="badge" style={{ backgroundColor: 'var(--color-accent)' }}>A</span>
              )}
            </button>

            {/* Profile Dropdown */}
            {user && profileDropdownOpen && (
              <div
                className="profile-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: 'var(--color-bg-main)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 8px 16px var(--color-shadow)',
                  zIndex: 120,
                  width: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'var(--spacing-sm) 0'
                }}
              >
                <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--color-border)', fontSize: '12px' }}>
                  <p style={{ fontWeight: 'bold' }}>{profile?.full_name || 'User'}</p>
                  <p style={{ color: 'var(--color-secondary-text)', fontSize: '10px' }}>{user.email || profile?.phone}</p>
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="profile-dropdown-link"
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      fontWeight: 'bold'
                    }}
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <LayoutDashboard size={14} /> ADMIN DASHBOARD
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setProfileDropdownOpen(false);
                    navigate('/');
                  }}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    textAlign: 'left',
                    color: 'var(--color-accent)',
                    width: '100%'
                  }}
                >
                  <LogOut size={14} /> SIGN OUT
                </button>
              </div>
            )}
          </div>

          {/* Wishlist Icon */}
          <Link to="/wishlist" className="action-btn" title="Wishlist">
            <Heart size={20} />
            {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
          </Link>

          {/* Cart Icon */}
          <button className="action-btn" onClick={() => setShowCart(true)} title="Shopping Bag">
            <ShoppingBag size={20} />
            {cartItemCount > 0 && <span className="badge">{cartItemCount}</span>}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--color-bg-main)',
            zIndex: 300,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--spacing-md)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <span className="logo" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>CLASSIC COLLECTION SOLAPUR</span>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Search inside Mobile Menu */}
          <form style={{ marginBottom: 'var(--spacing-md)' }} onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="SEARCH PRODUCTS"
              className="form-input"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{ padding: 'var(--spacing-sm)' }}
            />
          </form>

          {/* Links list */}
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', overflowY: 'auto' }}>
            {Object.keys(megaMenuData).map((catName) => (
              <li key={catName}>
                <Link
                  to={`/category/${catName.toLowerCase().replace(/['\s]/g, '-')}`}
                  style={{ fontHeading: 'var(--font-heading)', fontWeight: 'bold', fontSize: '16px', display: 'block' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {catName}
                </Link>
              </li>
            ))}
            {user && isAdmin && (
              <li style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                <Link
                  to="/admin"
                  style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ADMIN DASHBOARD
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
