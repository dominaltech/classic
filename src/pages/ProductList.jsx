import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';

export default function ProductList() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter'); // Get potential filter from megamenu

  const { products, categories, dataLoading } = useApp();
  
  // State for selected filters
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedFits, setSelectedFits] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [sortBy, setSortBy] = useState('newest'); // newest | low-high | high-low | discount
  
  // Mobile filter drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Category details
  const currentCategory = categories.find(c => c.slug === slug);
  const categoryTitle = currentCategory ? currentCategory.name : slug?.toUpperCase().replace(/-/g, ' ');

  // Reset filters when category slug changes
  useEffect(() => {
    setSelectedSizes([]);
    setSelectedFits([]);
    setSelectedColors([]);
    setSelectedPriceRanges([]);
    setSortBy('newest');
    
    // Apply initial filter if redirected from megamenu
    if (filterParam) {
      if (filterParam.includes('Fit')) {
        setSelectedFits([filterParam]);
      } else if (['M', 'L', 'XL', 'S', '30', '32', '34', '36', '8', '9', '10'].includes(filterParam)) {
        setSelectedSizes([filterParam]);
      } else {
        setSelectedColors([filterParam]);
      }
    }
  }, [slug, filterParam]);

  // Unique filter values derived from active category products
  const categoryProducts = products.filter(p => {
    if (!currentCategory) return true; // Show all if no category matches
    return p.category_id === currentCategory.id;
  });

  const availableSizes = Array.from(new Set(categoryProducts.flatMap(p => p.sizes || [])));
  const availableFits = Array.from(new Set(categoryProducts.map(p => p.fit_type).filter(Boolean)));
  const availableColors = Array.from(new Set(categoryProducts.map(p => p.color).filter(Boolean)));

  const priceRanges = [
    { label: "Under ₹1,500", min: 0, max: 1500 },
    { label: "₹1,500 - ₹2,500", min: 1500, max: 2500 },
    { label: "₹2,500 - ₹4,000", min: 2500, max: 4000 },
    { label: "Over ₹4,000", min: 4000, max: 99999 }
  ];

  // Toggle handlers
  const handleSizeToggle = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleFitToggle = (fit) => {
    setSelectedFits(prev => 
      prev.includes(fit) ? prev.filter(f => f !== fit) : [...prev, fit]
    );
  };

  const handleColorToggle = (color) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handlePriceToggle = (rangeLabel) => {
    setSelectedPriceRanges(prev => 
      prev.includes(rangeLabel) ? prev.filter(r => r !== rangeLabel) : [...prev, rangeLabel]
    );
  };

  const clearAllFilters = () => {
    setSelectedSizes([]);
    setSelectedFits([]);
    setSelectedColors([]);
    setSelectedPriceRanges([]);
    setSortBy('newest');
  };

  // Filter and Sort execution
  let filteredProducts = [...categoryProducts];

  // 1. Size Filter
  if (selectedSizes.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      p.sizes && p.sizes.some(s => selectedSizes.includes(s))
    );
  }

  // 2. Fit Filter
  if (selectedFits.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      selectedFits.includes(p.fit_type)
    );
  }

  // 3. Color Filter
  if (selectedColors.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      selectedColors.includes(p.color)
    );
  }

  // 4. Price Filter
  if (selectedPriceRanges.length > 0) {
    filteredProducts = filteredProducts.filter(p => {
      const price = p.sale_price || p.regular_price;
      return selectedPriceRanges.some(rangeLabel => {
        const range = priceRanges.find(r => r.label === rangeLabel);
        return range ? (price >= range.min && price <= range.max) : true;
      });
    });
  }

  // 5. Sorting
  filteredProducts.sort((a, b) => {
    const priceA = a.sale_price || a.regular_price;
    const priceB = b.sale_price || b.regular_price;
    
    if (sortBy === 'low-high') return priceA - priceB;
    if (sortBy === 'high-low') return priceB - priceA;
    if (sortBy === 'discount') return (b.discount_percent || 0) - (a.discount_percent || 0);
    
    // Default: 'newest' (by id descending or created_at)
    return b.id - a.id;
  });

  const hasFiltersApplied = 
    selectedSizes.length > 0 || 
    selectedFits.length > 0 || 
    selectedColors.length > 0 || 
    selectedPriceRanges.length > 0;

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-black)', borderRadius: '50%', animation: 'dropdownFade 0.6s linear infinite' }} />
        <p style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Loading Catalogue...</p>
      </div>
    );
  }

  // Render Filters HTML block (shared desktop/mobile)
  const renderFilterContent = () => (
    <>
      {/* Size Filter */}
      {availableSizes.length > 0 && (
        <div className="filter-section">
          <h3 className="filter-title">Sizes</h3>
          <div className="filter-size-grid">
            {availableSizes.map(size => (
              <button
                key={size}
                className={`filter-size-btn ${selectedSizes.includes(size) ? 'active' : ''}`}
                onClick={() => handleSizeToggle(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fit Filter */}
      {availableFits.length > 0 && (
        <div className="filter-section">
          <h3 className="filter-title">Fit Type</h3>
          <ul className="filter-list">
            {availableFits.map(fit => (
              <li key={fit}>
                <label className="filter-item-label">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={selectedFits.includes(fit)}
                    onChange={() => handleFitToggle(fit)}
                  />
                  {fit}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Color Filter */}
      {availableColors.length > 0 && (
        <div className="filter-section">
          <h3 className="filter-title">Colors</h3>
          <ul className="filter-list">
            {availableColors.map(color => (
              <li key={color}>
                <label className="filter-item-label">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={selectedColors.includes(color)}
                    onChange={() => handleColorToggle(color)}
                  />
                  {color}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Filter */}
      <div className="filter-section">
        <h3 className="filter-title">Price Range</h3>
        <ul className="filter-list">
          {priceRanges.map(range => (
            <li key={range.label}>
              <label className="filter-item-label">
                <input
                  type="checkbox"
                  className="filter-checkbox"
                  checked={selectedPriceRanges.includes(range.label)}
                  onChange={() => handlePriceToggle(range.label)}
                />
                {range.label}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <div className="container" style={{ minHeight: '80vh' }}>
      
      {/* Category Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--spacing-md)',
          marginTop: 'var(--spacing-xl)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '20px', letterSpacing: '1px', fontWeight: 'bold' }}>{categoryTitle}</h1>
          <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
            {filteredProducts.length} Products found
          </p>
        </div>

        {/* Desktop Sorting Dropdown */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-secondary-text)' }}>
            SORT BY:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '6px var(--spacing-sm)',
              fontSize: '12px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              outline: 'none',
              fontWeight: 'bold'
            }}
          >
            <option value="newest">What's New</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
            <option value="discount">Better Discount %</option>
          </select>
        </div>
      </div>

      {/* PLP Main Layout Grid */}
      <div className="plp-container">
        
        {/* DESKTOP SIDEBAR FILTERS */}
        <aside className="plp-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>FILTERS</span>
            {hasFiltersApplied && (
              <button onClick={clearAllFilters} style={{ fontSize: '11px', textDecoration: 'underline', color: 'var(--color-accent)' }}>
                CLEAR ALL
              </button>
            )}
          </div>
          {renderFilterContent()}
        </aside>

        {/* PRODUCTS GRID AREA */}
        <main>
          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map(product => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-xxl) 0',
                color: 'var(--color-secondary-text)',
                gap: 'var(--spacing-sm)'
              }}
            >
              <h3>NO PRODUCTS MATCH YOUR CRITERIA</h3>
              <p style={{ fontSize: '13px' }}>Try widening your search filters or browse other categories.</p>
              {hasFiltersApplied && (
                <button
                  className="drawer-empty-btn"
                  style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-lg)' }}
                  onClick={clearAllFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </main>

      </div>

      {/* MOBILE FLOATING FILTER BAR */}
      <div className="mobile-filter-bar">
        <button className="mobile-filter-btn" onClick={() => setMobileFiltersOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SlidersHorizontal size={14} /> Filter
        </button>
        <span style={{ color: '#444444' }}>|</span>
        <button
          className="mobile-filter-btn"
          onClick={() => {
            const sorts = ['newest', 'low-high', 'high-low', 'discount'];
            const labels = ["What's New", "Price: Low to High", "Price: High to Low", "Better Discount"];
            const nextIdx = (sorts.indexOf(sortBy) + 1) % sorts.length;
            setSortBy(sorts[nextIdx]);
            alert(`Sorting changed to: ${labels[nextIdx]}`);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowUpDown size={14} /> Sort
        </button>
      </div>

      {/* MOBILE FULLSCREEN FILTER DRAWER */}
      {mobileFiltersOpen && (
        <div className={`mobile-filter-overlay ${mobileFiltersOpen ? 'open' : ''}`}>
          <div className="mobile-filter-header">
            <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>FILTERS</h3>
            <button onClick={() => setMobileFiltersOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="mobile-filter-content">
            {renderFilterContent()}
          </div>

          <div className="mobile-filter-footer">
            <button
              className="mobile-filter-footer-btn"
              onClick={() => {
                clearAllFilters();
                setMobileFiltersOpen(false);
              }}
            >
              Clear All
            </button>
            <button
              className="mobile-filter-footer-btn apply"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply Filters ({filteredProducts.length})
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
