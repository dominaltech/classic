import React from 'react';
import { Truck, RotateCcw, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react';

export default function TrustBadgeBar({ compact = false }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: compact ? 'var(--spacing-md)' : 'var(--spacing-lg)',
        margin: 'var(--spacing-lg) 0',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(200px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-md)',
        }}
      >
        {/* Shipping */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
          <Truck size={22} style={{ color: 'var(--color-primary-text)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              3-7 Days Shipping
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--color-secondary-text)', marginTop: '2px', lineHeight: '1.4' }}>
              Orders will be delivered within 3-7 business days across India.
            </p>
          </div>
        </div>

        {/* 7-Days Return */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
          <RotateCcw size={22} style={{ color: 'var(--color-primary-text)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              7-Days Return Policy
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--color-secondary-text)', marginTop: '2px', lineHeight: '1.4' }}>
              Hassle-free 7-days easy return policy from delivery date.
            </p>
          </div>
        </div>

        {/* Refund */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
          <CreditCard size={22} style={{ color: 'var(--color-primary-text)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              5-7 Days Refund
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--color-secondary-text)', marginTop: '2px', lineHeight: '1.4' }}>
              Refund credited to original payment method within 5-7 business days.
            </p>
          </div>
        </div>

        {/* Replacement */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
          <RefreshCw size={22} style={{ color: 'var(--color-primary-text)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              3-7 Days Replacement
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--color-secondary-text)', marginTop: '2px', lineHeight: '1.4' }}>
              Replacement orders delivered within 3-7 business days.
            </p>
          </div>
        </div>
      </div>

      {!compact && (
        <div
          style={{
            marginTop: 'var(--spacing-md)',
            paddingTop: 'var(--spacing-sm)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--color-secondary-text)',
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
          <span>This website is owned and managed by <strong>Dominal Technologies</strong>. Guaranteed PhonePe 256-bit SSL secure payments.</span>
        </div>
      )}
    </div>
  );
}
