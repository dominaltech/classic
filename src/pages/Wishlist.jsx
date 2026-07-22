import React from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Wishlist() {
  const { wishlist } = useApp();
  const navigate = useNavigate();

  return (
    <div className="container" style={{ minHeight: '80vh', marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xxl)' }}>
      <h1 style={{ fontSize: '18px', letterSpacing: '1px', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-md)', textTransform: 'uppercase' }}>
        YOUR WISHLIST ({wishlist.length})
      </h1>

      {wishlist.length > 0 ? (
        <div className="product-grid" style={{ marginTop: 'var(--spacing-lg)' }}>
          {wishlist.map(product => (
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
          <Heart size={64} style={{ opacity: 0.2 }} />
          <h3>YOUR WISHLIST IS EMPTY</h3>
          <p style={{ fontSize: '13px', textAlign: 'center' }}>
            Add items you like to your wishlist. They will be saved here for later.
          </p>
          <button
            className="drawer-empty-btn"
            style={{ marginTop: 'var(--spacing-md)' }}
            onClick={() => navigate('/')}
          >
            Start Browsing
          </button>
        </div>
      )}
    </div>
  );
}
