import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import TrustBadgeBar from '../components/TrustBadgeBar';

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', orderId: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', phone: '', orderId: '', message: '' });
    setTimeout(() => setSubmitted(false), 6000);
  };

  return (
    <div className="container" style={{ padding: 'var(--spacing-xxl) var(--spacing-md)', maxWidth: '950px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
          CONTACT CUSTOMER SUPPORT
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          We Are Here To Assist You With Orders, Returns & Inquiries
        </p>
      </div>

      {/* Ownership Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-black)',
          color: 'var(--color-white)',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: 'var(--spacing-xxl)'
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: 'bold' }}>
          This website is owned and managed by Dominal Technologies.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-xxl)', marginBottom: 'var(--spacing-xxl)' }}>
        
        {/* Left Column: Contact Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid var(--color-black)', paddingBottom: 'var(--spacing-xs)' }}>
            Get In Touch
          </h2>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
            <MapPin size={22} style={{ color: 'var(--color-black)', flexShrink: 0, marginTop: '3px' }} />
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Corporate Registered Address</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', lineHeight: '1.6', marginTop: '2px' }}>
                Dominal Technologies (Classic)<br />
                Plot No. 8, Marol Co-op Industrial Estate,<br />
                Andheri East, Mumbai - 400059, Maharashtra, India
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
            <Mail size={22} style={{ color: 'var(--color-black)', flexShrink: 0, marginTop: '3px' }} />
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Email Customer Care</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', lineHeight: '1.6', marginTop: '2px' }}>
                care@classiccollectionsolapur.in<br />
                support@dominaltech.com
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
            <Phone size={22} style={{ color: 'var(--color-black)', flexShrink: 0, marginTop: '3px' }} />
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Helpline & Support</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', lineHeight: '1.6', marginTop: '2px' }}>
                1800-22-2244 (Toll Free)<br />
                +91 98765 43210
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
            <Clock size={22} style={{ color: 'var(--color-black)', flexShrink: 0, marginTop: '3px' }} />
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Working Hours</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', lineHeight: '1.6', marginTop: '2px' }}>
                Monday to Saturday: 10:00 AM to 7:00 PM IST<br />
                (Closed on Sundays and National Holidays)
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--spacing-xl)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            Send Us A Message
          </h2>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
              <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto var(--spacing-sm)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Message Received!</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', marginTop: 'var(--spacing-xs)' }}>
                Thank you for contacting Dominal Technologies. Our support team will respond within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Order ID (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  placeholder="e.g. ORD123456"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Message *</label>
                <textarea
                  required
                  rows={4}
                  className="form-input"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?"
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="checkout-btn" style={{ marginTop: 'var(--spacing-xs)' }}>
                SUBMIT MESSAGE
              </button>
            </form>
          )}
        </div>

      </div>

      <TrustBadgeBar />

    </div>
  );
}
