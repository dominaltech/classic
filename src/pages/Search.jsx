import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { products, dataLoading } = useApp();

  const searchResults = products.filter(product => {
    if (!query) return false;
    const lowerQuery = query.toLowerCase();
    return (
      product.title.toLowerCase().includes(lowerQuery) ||
      (product.description && product.description.toLowerCase().includes(lowerQuery)) ||
      (product.fit_type && product.fit_type.toLowerCase().includes(lowerQuery)) ||
      (product.color && product.color.toLowerCase().includes(lowerQuery))
    );
  });

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-black)', borderRadius: '50%', animation: 'dropdownFade 0.6s linear infinite' }} />
        <p style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Searching Catalogue...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '80vh', marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xxl)' }}>
      <h1 className="search-results-title uppercase" style={{ fontSize: '18px', letterSpacing: '1px', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-md)' }}>
        SEARCH RESULTS FOR: <span style={{ fontWeight: 'bold' }}>"{query}"</span>
      </h1>

      <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', margin: 'var(--spacing-md) 0' }}>
        Found {searchResults.length} matches
      </p>

      {searchResults.length > 0 ? (
        <div className="product-grid">
          {searchResults.map(product => (
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
          <h3>NO MATCHING PRODUCTS FOUND</h3>
          <p style={{ fontSize: '13px' }}>Try double-checking your spelling or search for popular terms like "Jeans" or "Shirts".</p>
        </div>
      )}
    </div>
  );
}
