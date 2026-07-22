import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FacebookIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-grid container">
        {/* Col 1: Corporate */}
        <div>
          <h4 className="footer-column-title">Corporate Info</h4>
          <ul className="footer-list">
            <li className="footer-item"><Link to="/" className="footer-link">About Us</Link></li>
            <li className="footer-item"><Link to="/" className="footer-link">Careers</Link></li>
            <li className="footer-item"><Link to="/" className="footer-link">Store Locator</Link></li>
            <li className="footer-item"><Link to="/" className="footer-link">Franchise Enquiry</Link></li>
            <li className="footer-item"><Link to="/" className="footer-link">Investor Relations</Link></li>
          </ul>
        </div>

        {/* Col 2: Help & Policies */}
        <div>
          <h4 className="footer-column-title">Customer Help</h4>
          <ul className="footer-list">
            <li className="footer-item"><Link to="/" className="footer-link">Track Order Status</Link></li>
            <li className="footer-item"><Link to="/" className="footer-link">Easy Return Policy</Link></li>
            <li className="footer-item"><Link to="/" className="footer-link">FAQs</Link></li>
            <li className="footer-item"><Link to="/" className="footer-link">Shipping & Delivery</Link></li>
            <li className="footer-item"><Link to="/" className="footer-link">Contact Customer Care</Link></li>
          </ul>
        </div>

        {/* Col 3: Contact */}
        <div>
          <h4 className="footer-column-title">Contact Us</h4>
          <ul className="footer-list">
            <li className="footer-item" style={{ color: '#999999', fontWeight: 300, marginBottom: 'var(--spacing-sm)' }}>
              Credo Brands Marketing Ltd.<br />
              Plot No. 8, Marol Co-op Industrial Estate,<br />
              Andheri East, Mumbai - 400059
            </li>
            <li className="footer-item" style={{ color: '#999999', fontWeight: 300, marginBottom: 'var(--spacing-sm)' }}>
              Email: care@classiccollectionsolapur.in
            </li>
            <li className="footer-item" style={{ color: '#999999', fontWeight: 300 }}>
              Phone: 1800-22-2244 (Toll Free)
            </li>
          </ul>
        </div>

        {/* Col 4: Newsletter */}
        <div>
          <h4 className="footer-column-title">Stay Connected</h4>
          <p className="footer-newsletter-text">
            Subscribe to receive updates on new drops, exclusive offers, and events.
          </p>
          <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="ENTER EMAIL ADDRESS"
              className="footer-newsletter-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="footer-newsletter-btn">
              Join
            </button>
          </form>
          {subscribed && (
            <p style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: 'var(--spacing-sm)' }}>
              THANK YOU FOR SUBSCRIBING!
            </p>
          )}

          {/* Socials */}
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Facebook">
              <FacebookIcon size={16} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Instagram">
              <InstagramIcon size={16} />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Youtube">
              <YoutubeIcon size={16} />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom container">
        <div>&copy; {new Date().getFullYear()} Credo Brands Marketing Ltd. All Rights Reserved.</div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Link to="/" style={{ color: '#666666' }}>Privacy Policy</Link>
          <Link to="/" style={{ color: '#666666' }}>Terms & Conditions</Link>
          <Link to="/" style={{ color: '#666666' }}>GST Invoices</Link>
        </div>
      </div>
    </footer>
  );
}
