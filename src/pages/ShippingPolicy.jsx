import React from 'react';
import { Truck, Clock, PackageCheck, MapPin, AlertCircle } from 'lucide-react';
import TrustBadgeBar from '../components/TrustBadgeBar';

export default function ShippingPolicy() {
  return (
    <div className="container" style={{ padding: 'var(--spacing-xxl) var(--spacing-md)', maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
          SHIPPING & DELIVERY POLICY
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Fast, Reliable & Transparent Doorstep Logistics Across India
        </p>
      </div>

      {/* Mandatory Highlight Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-black)',
          color: 'var(--color-white)',
          padding: 'var(--spacing-lg)',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: 'var(--spacing-xxl)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--spacing-xs)' }}>
          Mandatory Delivery Timeline
        </h2>
        <p style={{ fontSize: '15px', color: '#e0e0e0', fontWeight: '500' }}>
          Orders will be delivered within 3-7 business days.
        </p>
      </div>

      <TrustBadgeBar compact />

      {/* Policy Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', color: 'var(--color-primary-text)', lineHeight: '1.7', marginTop: 'var(--spacing-xl)' }}>
        
        {/* Section 1 */}
        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <Clock size={20} style={{ color: 'var(--color-black)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              1. Order Processing Timeframe
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)' }}>
            All orders placed on our website are verified, processed, and packed within <strong>24 to 48 hours</strong> (excluding Sundays and public holidays). Orders placed after 5:00 PM IST will be processed on the next business day.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <Truck size={20} style={{ color: 'var(--color-black)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              2. Delivery Timelines & Coverage
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', marginBottom: 'var(--spacing-sm)' }}>
            We partner with leading tier-1 express courier services (BlueDart, Delhivery, DTDC, Shadowfax) to ensure safe delivery across 27,000+ pin codes in India.
          </p>
          <ul style={{ fontSize: '13px', color: 'var(--color-secondary-text)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <li><strong>Metro Cities:</strong> Delivered within 3 to 5 business days.</li>
            <li><strong>Rest of India:</strong> Delivered within 4 to 7 business days.</li>
            <li><strong>Standard SLA:</strong> All orders will be delivered within 3-7 business days from dispatch.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <PackageCheck size={20} style={{ color: 'var(--color-black)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              3. Shipping Charges
            </h3>
          </div>
          <ul style={{ fontSize: '13px', color: 'var(--color-secondary-text)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <li><strong>Prepaid / COD Orders above ₹999:</strong> FREE Shipping nationwide.</li>
            <li><strong>Orders below ₹999:</strong> A nominal flat shipping charge of ₹99 applies.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <MapPin size={20} style={{ color: 'var(--color-black)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              4. Order Tracking & Notifications
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)' }}>
            Once your order is handed over to the courier partner, an automated SMS and Email containing your unique AWB tracking number and live tracking link will be dispatched immediately.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <AlertCircle size={20} style={{ color: 'var(--color-black)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              5. Contact Support & Ownership
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)' }}>
            If you face any delays or have address modifications prior to dispatch, please contact our helpline at <strong>1800-22-2244</strong> or email <strong>care@classiccollectionsolapur.in</strong>.<br />
            <em>This website is owned and managed by Dominal Technologies.</em>
          </p>
        </section>

      </div>

    </div>
  );
}
