import React from 'react';
import { RotateCcw, CreditCard, RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import TrustBadgeBar from '../components/TrustBadgeBar';

export default function ReturnRefundPolicy() {
  return (
    <div className="container" style={{ padding: 'var(--spacing-xxl) var(--spacing-md)', maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
          RETURN, REFUND & REPLACEMENT POLICY
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Customer Satisfaction Guaranteed With Transparent Timeframes
        </p>
      </div>

      {/* Mandatory Highlight Box */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xxl)'
        }}
      >
        <div style={{ backgroundColor: 'var(--color-black)', color: 'var(--color-white)', padding: 'var(--spacing-lg)', borderRadius: '8px', textAlign: 'center' }}>
          <RotateCcw size={24} style={{ marginBottom: 'var(--spacing-xs)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Return Policy</h3>
          <p style={{ fontSize: '15px', marginTop: '4px', fontWeight: '500' }}>We have 7-days return policy</p>
        </div>

        <div style={{ backgroundColor: 'var(--color-black)', color: 'var(--color-white)', padding: 'var(--spacing-lg)', borderRadius: '8px', textAlign: 'center' }}>
          <CreditCard size={24} style={{ marginBottom: 'var(--spacing-xs)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Refund Policy</h3>
          <p style={{ fontSize: '13px', marginTop: '4px', color: '#e0e0e0' }}>Refund will be credited to original payment method within 5-7 business days</p>
        </div>

        <div style={{ backgroundColor: 'var(--color-black)', color: 'var(--color-white)', padding: 'var(--spacing-lg)', borderRadius: '8px', textAlign: 'center' }}>
          <RefreshCw size={24} style={{ marginBottom: 'var(--spacing-xs)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Replacement Policy</h3>
          <p style={{ fontSize: '13px', marginTop: '4px', color: '#e0e0e0' }}>Replacement orders will be delivered within 3-7 business days</p>
        </div>
      </div>

      <TrustBadgeBar compact />

      {/* Comprehensive Rules & Guidelines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', color: 'var(--color-primary-text)', lineHeight: '1.7', marginTop: 'var(--spacing-xl)' }}>
        
        {/* Section 1: Return Policy */}
        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <RotateCcw size={20} style={{ color: 'var(--color-black)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              1. 7-Days Return Policy Details
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', marginBottom: 'var(--spacing-sm)' }}>
            We have a strict <strong>7-days return policy</strong>. You may initiate a return request within 7 calendar days from the date of package delivery.
          </p>
          <ul style={{ fontSize: '13px', color: 'var(--color-secondary-text)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <li><strong>Eligibility:</strong> Items must be unworn, unwashed, unaltered, and free of stains/odors.</li>
            <li><strong>Packaging:</strong> Original brand tags, barcode labels, and intact polybags must be attached.</li>
            <li><strong>Reverse Pickup:</strong> Doorstep pickup will be arranged by our logistics partner within 24-48 hours of approval.</li>
          </ul>
        </section>

        {/* Section 2: Refund Policy */}
        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <CreditCard size={20} style={{ color: 'var(--color-black)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              2. Refund Policy & Processing SLA
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', marginBottom: 'var(--spacing-sm)' }}>
            Once your returned item reaches our fulfillment center, it undergoes a mandatory quality check.
          </p>
          <ul style={{ fontSize: '13px', color: 'var(--color-secondary-text)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <li><strong>Prepaid Orders (PhonePe / UPI / Credit Card / Debit Card / Net Banking):</strong> Refund will be credited to original payment method within 5-7 business days after quality inspection approval.</li>
            <li><strong>Cash on Delivery (COD) Orders:</strong> Refund will be transferred via PhonePe UPI ID or IMPS bank transfer provided by the customer within 5-7 business days.</li>
          </ul>
        </section>

        {/* Section 3: Replacement Policy */}
        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <RefreshCw size={20} style={{ color: 'var(--color-black)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              3. Replacement & Exchange Policy
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', marginBottom: 'var(--spacing-sm)' }}>
            Need a different size or received a damaged/defective item? We offer swift replacement orders.
          </p>
          <ul style={{ fontSize: '13px', color: 'var(--color-secondary-text)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <li><strong>Replacement Delivery Timeline:</strong> Replacement orders will be delivered within 3-7 business days following reverse pickup confirmation.</li>
            <li><strong>Zero Extra Cost:</strong> Size exchanges for the first attempt are completely free of charge.</li>
          </ul>
        </section>

        {/* Section 4: How to Initiate */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--color-black)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              4. How to Request Return or Replacement
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', marginBottom: 'var(--spacing-xs)' }}>
            To submit your request, please contact our support team with your <strong>Order ID</strong>:
          </p>
          <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--spacing-md)', borderRadius: '6px', fontSize: '13px', color: 'var(--color-primary-text)' }}>
            <strong>Support Email:</strong> care@classiccollectionsolapur.in<br />
            <strong>Helpline Number:</strong> 1800-22-2244 (Mon - Sat, 10 AM - 7 PM)<br />
            <em>This website is owned and managed by Dominal Technologies.</em>
          </div>
        </section>

      </div>

    </div>
  );
}
