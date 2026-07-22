import React from 'react';
import TrustBadgeBar from '../components/TrustBadgeBar';

export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ padding: 'var(--spacing-xxl) var(--spacing-md)', maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
          PRIVACY POLICY
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Protecting Your Personal Information & Payment Data
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
            1. Information We Collect
          </h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            Dominal Technologies ("Classic") values your trust. When you place an order or create an account, we collect necessary personal details such as your Full Name, Shipping Address, Contact Phone Number, and Email Address strictly to fulfill your order and provide delivery updates.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            2. Payment Security & Encrypted Gateways
          </h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            We do NOT store your credit/debit card details or banking passwords on our servers. All online financial transactions are processed securely through PCI-DSS compliant payment aggregators such as <strong>PhonePe</strong> using end-to-end 256-bit SSL encryption.
          </p>
        </section>

        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            3. How Information Is Used
          </h3>
          <ul style={{ color: 'var(--color-secondary-text)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <li>Processing and delivering your orders within 3-7 business days.</li>
            <li>Processing returns, refunds (5-7 business days SLA), or replacements.</li>
            <li>Sending SMS and Email tracking notifications.</li>
            <li>Improving customer service and store performance.</li>
          </ul>
        </section>

        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            4. Data Sharing & Third-Party Services
          </h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            We never sell, rent, or trade your personal data to third parties. Customer details are shared exclusively with trusted logistics partners (e.g. BlueDart, Delhivery) and PhonePe payment gateway strictly for order fulfillment.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
            5. Contact Grievance Officer
          </h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            For privacy inquiries, data deletion requests, or grievances, please contact:<br />
            <strong>Privacy Officer:</strong> Dominal Technologies<br />
            <strong>Email:</strong> privacy@dominaltech.com / care@classiccollectionsolapur.in<br />
            <em>This website is owned and managed by Dominal Technologies.</em>
          </p>
        </section>

      </div>

    </div>
  );
}
