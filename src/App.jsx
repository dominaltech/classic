import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';

// Pages
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  return (
    <div className="app-wrapper">
      {/* Global Navigation header */}
      <Header />

      {/* Main Pages router */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<ProductList />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Fallback route */}
          <Route path="*" element={
            <div className="container text-center" style={{ padding: 'var(--spacing-xxl) 0', minHeight: '60vh' }}>
              <h2>PAGE NOT FOUND</h2>
              <p style={{ margin: 'var(--spacing-md) 0', color: 'var(--color-secondary-text)' }}>
                The link you followed is broken, or the page has been moved.
              </p>
              <a href="/" className="checkout-btn" style={{ maxWidth: '200px', margin: '0 auto' }}>
                Go to Homepage
              </a>
            </div>
          } />
        </Routes>
      </main>

      {/* Global overlay panels */}
      <CartDrawer />
      <AuthModal />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
