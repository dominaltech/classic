import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, ShoppingBag, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import TrustBadgeBar from '../components/TrustBadgeBar';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, wishlist, toggleWishlist, dataLoading } = useApp();

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  
  // Accordions states
  const [openAccordions, setOpenAccordions] = useState({
    details: true,
    material: false,
    shipping: false
  });

  // Find product by slug
  const product = products.find(p => p.slug === slug);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImgIndex(0);
    setSelectedSize('');
  }, [slug]);

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-black)', borderRadius: '50%', animation: 'dropdownFade 0.6s linear infinite' }} />
        <p style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container text-center" style={{ padding: 'var(--spacing-xxl) 0', minHeight: '60vh' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>PRODUCT NOT FOUND</h2>
        <p style={{ color: 'var(--color-secondary-text)', marginBottom: 'var(--spacing-lg)' }}>
          The product you are looking for does not exist or has been removed.
        </p>
        <button className="drawer-empty-btn" onClick={() => navigate('/')}>
          Return to Home
        </button>
      </div>
    );
  }

  const isWishlisted = wishlist.some(item => item.id === product.id);
  const salePrice = product.sale_price || product.regular_price;
  const regularPrice = product.regular_price;
  const hasDiscount = product.discount_percent && product.discount_percent > 0;

  // Construct images list
  const productImages = product.images && product.images.length > 0
    ? product.images
    : [product.image_url || "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80"];

  const toggleAccordion = (section) => {
    setOpenAccordions(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddToCartClick = () => {
    if (!selectedSize) {
      alert("Please select your size before adding to shopping bag!");
      return;
    }
    addToCart(product, selectedSize, 1);
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Product link copied to clipboard!");
  };

  return (
    <div className="container" style={{ minHeight: '80vh' }}>
      
      {/* Breadcrumbs */}
      <div style={{ padding: 'var(--spacing-md) 0', fontSize: '11px', color: 'var(--color-secondary-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>HOME</span>
        <span style={{ margin: '0 var(--spacing-sm)' }}>/</span>
        <span>{product.fit_type || "APPAREL"}</span>
        <span style={{ margin: '0 var(--spacing-sm)' }}>/</span>
        <span style={{ color: 'var(--color-primary-text)', fontWeight: 'bold' }}>{product.title}</span>
      </div>

      {/* Grid Layout */}
      <div className="pdp-grid">
        
        {/* LEFT COLUMN: IMAGES GALLERY */}
        <div className="pdp-gallery">
          {/* Thumbnails list */}
          <div className="pdp-thumbnails">
            {productImages.map((imgUrl, index) => (
              <div
                key={index}
                className={`pdp-thumbnail ${index === activeImgIndex ? 'active' : ''}`}
                onClick={() => setActiveImgIndex(index)}
              >
                <img
                  src={imgUrl}
                  alt={`${product.title} Thumb ${index + 1}`}
                  className="pdp-thumbnail-img"
                />
              </div>
            ))}
          </div>

          {/* Large Main Display */}
          <div className="pdp-main-image-container">
            <img
              src={productImages[activeImgIndex]}
              alt={product.title}
              className="pdp-main-image"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS BLOCK */}
        <div className="pdp-details">
          <div>
            <h1 className="pdp-title">{product.title}</h1>
            <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', marginTop: 'var(--spacing-xs)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Fit: {product.fit_type || 'Classic'} | Color: {product.color || 'Default'}
            </p>
          </div>

          {/* Pricing */}
          <div className="pdp-pricing">
            <span className="pdp-sale-price">
              ₹{salePrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="pdp-regular-price">
                  ₹{regularPrice.toLocaleString('en-IN')}
                </span>
                <span className="pdp-discount">
                  ({product.discount_percent}% OFF)
                </span>
              </>
            )}
          </div>
          
          <span className="product-card-gst" style={{ fontSize: '11px', display: 'block', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-md)' }}>
            GST BENEFIT INCLUDED &nbsp;|&nbsp; inclusive of all taxes
          </span>

          {/* Size Picker */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="pdp-size-section">
              <div className="pdp-size-title-row">
                <span className="pdp-size-title">Select Size</span>
                <button
                  className="pdp-size-guide-btn"
                  onClick={() => alert("Size Guide:\nDenims: 30(M), 32(L), 34(XL), 36(XXL)\nShirts: S(38), M(40), L(42), XL(44)")}
                >
                  Size Guide
                </button>
              </div>
              <div className="pdp-size-grid">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    className={`pdp-size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pdp-actions">
            <button className="pdp-add-to-cart-btn" onClick={handleAddToCartClick}>
              ADD TO BAG
            </button>
            
            {/* Wishlist Button */}
            <button
              className="pdp-wishlist-btn"
              onClick={() => toggleWishlist(product)}
              style={{ padding: '0 var(--spacing-md)' }}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart
                size={22}
                fill={isWishlisted ? "var(--color-accent)" : "none"}
                color={isWishlisted ? "var(--color-accent)" : "var(--color-primary-text)"}
              />
            </button>

            {/* Share link button */}
            <button
              className="pdp-wishlist-btn"
              onClick={handleShareClick}
              title="Copy link"
            >
              <Share2 size={20} />
            </button>
          </div>

          {/* Trust Badge Bar */}
          <TrustBadgeBar compact />

          {/* Collapsible Accordions details */}
          <div className="pdp-accordion">
            
            {/* Accordion 1: Description */}
            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => toggleAccordion('details')}>
                <span>Product Description</span>
                {openAccordions.details ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openAccordions.details && (
                <div className="pdp-accordion-content">
                  <p>{product.description || "No detailed description available for this premium wear. Tailored for comfort and styled for the modern urban environment."}</p>
                </div>
              )}
            </div>

            {/* Accordion 2: Materials */}
            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => toggleAccordion('material')}>
                <span>Material & Care</span>
                {openAccordions.material ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openAccordions.material && (
                <div className="pdp-accordion-content">
                  <p>Fabric: 98% Premium Cotton, 2% Lycra/Spandex Elastane for superior stretch.</p>
                  <p style={{ marginTop: 'var(--spacing-xs)' }}>
                    Care: Machine wash cold with similar colors. Inside out. Do not bleach. Tumble dry low. Warm iron if needed.
                  </p>
                </div>
              )}
            </div>

            {/* Accordion 3: Shipping policy */}
            <div className="pdp-accordion-item">
              <button className="pdp-accordion-header" onClick={() => toggleAccordion('shipping')}>
                <span>Shipping, Return & Refund Policies</span>
                {openAccordions.shipping ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openAccordions.shipping && (
                <div className="pdp-accordion-content">
                  <p><strong>Shipping Policy:</strong> Orders will be delivered within 3-7 business days across India.</p>
                  <p style={{ marginTop: 'var(--spacing-xs)' }}><strong>Return Policy:</strong> We have 7-days return policy from the date of delivery.</p>
                  <p style={{ marginTop: 'var(--spacing-xs)' }}><strong>Refund Policy:</strong> Refund will be credited to original payment method within 5-7 business days after inspection.</p>
                  <p style={{ marginTop: 'var(--spacing-xs)' }}><strong>Replacement Policy:</strong> Replacement orders will be delivered within 3-7 business days.</p>
                  <p style={{ marginTop: 'var(--spacing-xs)', fontStyle: 'italic', fontSize: '11px' }}>This website is owned and managed by Dominal Technologies.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
