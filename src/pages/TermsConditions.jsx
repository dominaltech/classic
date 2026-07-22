import React from 'react';
import TrustBadgeBar from '../components/TrustBadgeBar';

export default function TermsConditions() {
  return (
    <div className="container" style={{ padding: 'var(--spacing-xxl) var(--spacing-md)', maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
          TERMS & CONDITIONS
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Standard Terms of Service for Customer Orders & Website Usage
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

      <TrustBadgeBar compact />

      {/* Body Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', color: 'var(--color-primary-text)', lineHeight: '1.7', fontSize: '13px' }}>
        
        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            1. Introduction & Acceptance of Terms
          </h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            Welcome to Classic. By accessing, browsing, or making purchases on this website, you agree to comply with and be bound by these Terms and Conditions. This website is owned and managed by <strong>Dominal Technologies</strong>. If you do not agree with any part of these terms, please do not use our services.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            2. Product Pricing & Currency
          </h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            All prices listed on the website are displayed in Indian Rupees (INR - ₹) and are inclusive of applicable GST unless stated otherwise. Prices, discounts, and availability are subject to change without prior notice.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            3. Order Placement & Payment Processing
          </h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            Orders placed on the website constitute an offer to purchase. Payments are processed securely via encrypted payment gateways including <strong>PhonePe</strong>, Credit Cards, Debit Cards, Net Banking, and UPI. Cash on Delivery (COD) is available for selected pin codes.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            4. Shipping, Return, Refund & Replacement SLAs
          </h3>
          <ul style={{ color: 'var(--color-secondary-text)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <li><strong>Shipping SLA:</strong> Orders will be delivered within 3-7 business days across India.</li>
            <li><strong>Return SLA:</strong> We have a 7-days return policy from the date of delivery.</li>
            <li><strong>Refund SLA:</strong> Refund will be credited to original payment method within 5-7 business days after inspection.</li>
            <li><strong>Replacement SLA:</strong> Replacement orders will be delivered within 3-7 business days.</li>
          </ul>
        </section>

        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            5. Intellectual Property
          </h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            All content on this website, including logos, designs, trademarks, text, and imagery, is the intellectual property of Dominal Technologies. Reproduction or unauthorized use without written permission is strictly prohibited.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            6. Governing Law & Jurisdiction
          </h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            These terms are governed by the laws of India. Any disputes arising out of the use of this website shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.
          </p>
        </section>

      </div>

    </div>
  );
}
