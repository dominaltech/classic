import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart } from 'lucide-react';

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist } = useApp();

  const isWishlisted = wishlist.some(item => item.id === product.id);

  const salePrice = product.sale_price || product.regular_price;
  const regularPrice = product.regular_price;
  const hasDiscount = product.discount_percent && product.discount_percent > 0;

  // Use product images array or fallback to single image_url
  const primaryImg = product.images?.[0] || product.image_url || "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80";
  const secondaryImg = product.images?.[1] || product.image_url || primaryImg;

  return (
    <div className="product-card">
      <div className="product-card-image-container">
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="product-discount-badge">
            {product.discount_percent}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          className="product-card-wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={18}
            fill={isWishlisted ? "var(--color-accent)" : "none"}
            color={isWishlisted ? "var(--color-accent)" : "var(--color-primary-text)"}
          />
        </button>

        {/* Images */}
        <Link to={`/product/${product.slug}`}>
          <img
            src={primaryImg}
            alt={product.title}
            className="product-card-img primary"
            loading="lazy"
          />
          <img
            src={secondaryImg}
            alt={`${product.title} Alternate`}
            className="product-card-img secondary"
            loading="lazy"
          />
        </Link>
      </div>

      <div className="product-card-info">
        {/* Title */}
        <Link to={`/product/${product.slug}`}>
          <h3 className="product-card-title">{product.title}</h3>
        </Link>

        {/* Pricing */}
        <div className="product-card-pricing">
          <span className="product-card-sale-price">
            ₹{salePrice.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <>
              <span className="product-card-regular-price">
                ₹{regularPrice.toLocaleString('en-IN')}
              </span>
              <span className="product-card-discount">
                ({product.discount_percent}% OFF)
              </span>
            </>
          )}
        </div>

        {/* GST text */}
        <span className="product-card-gst">GST BENEFIT INCLUDED</span>
      </div>
    </div>
  );
}
