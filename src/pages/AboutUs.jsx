import React from 'react';
import { ShieldCheck, Award, Heart, Truck, MapPin, Mail, Phone } from 'lucide-react';
import TrustBadgeBar from '../components/TrustBadgeBar';

export default function AboutUs() {
  return (
    <div className="container" style={{ padding: 'var(--spacing-xxl) var(--spacing-md)', maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
          ABOUT US
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Redefining Urban Fashion & Apparel
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
          marginBottom: 'var(--spacing-xxl)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          This website is owned and managed by Dominal Technologies.
        </p>
      </div>

      {/* Brand Story */}
      <div style={{ lineHeight: '1.8', color: 'var(--color-primary-text)', marginBottom: 'var(--spacing-xxl)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)', borderBottom: '2px solid var(--color-black)', paddingBottom: 'var(--spacing-xs)', display: 'inline-block' }}>
          Our Story
        </h2>
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          Founded with a passion for modern aesthetics and uncompromised quality, <strong>Classic</strong> is a premium apparel destination designed for contemporary lifestyles. We strive to provide premium clothing that represents creative freedom, confidence, and comfort.
        </p>
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          What started with signature hand-washed denims has evolved into a complete wardrobe solution offering casual shirts, heavyweight graphic T-shirts, utility outerwear, and hand-crafted sneakers. Every garment undergoes rigorous quality verification to ensure flawless stitching, premium feel, and long-lasting durability.
        </p>
      </div>

      {/* Core Values */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xxl)' }}>
        <div style={{ padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-secondary)' }}>
          <Award size={28} style={{ color: 'var(--color-black)', marginBottom: 'var(--spacing-sm)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>Premium Craftsmanship</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', lineHeight: '1.6' }}>
            We source high-grade stretch denim, European flax linen, and heavy loopback cotton to deliver maximum longevity and tactile comfort.
          </p>
        </div>

        <div style={{ padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-secondary)' }}>
          <ShieldCheck size={28} style={{ color: 'var(--color-black)', marginBottom: 'var(--spacing-sm)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>Customer Trust & Safety</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', lineHeight: '1.6' }}>
            Managed by Dominal Technologies, we maintain strict adherence to e-commerce compliance, 256-bit encrypted PhonePe transactions, and transparent merchant policies.
          </p>
        </div>

        <div style={{ padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-secondary)' }}>
          <Heart size={28} style={{ color: 'var(--color-black)', marginBottom: 'var(--spacing-sm)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>Hassle-Free Support</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', lineHeight: '1.6' }}>
            Enjoy 7-day easy returns, 5-7 business days refunds, and fast 3-7 business days door-step delivery nationwide.
          </p>
        </div>
      </div>

      {/* Compliance Trust Bar */}
      <TrustBadgeBar />

      {/* Official Business Information */}
      <div style={{ marginTop: 'var(--spacing-xxl)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-lg)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
          Official Business Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)', fontSize: '13px', color: 'var(--color-secondary-text)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <MapPin size={18} style={{ color: 'var(--color-black)', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--color-black)' }}>Legal Entity / Trade Name:</strong><br />
              Dominal Technologies (Classic)<br />
              Plot No. 8, Marol Co-op Industrial Estate,<br />
              Andheri East, Mumbai - 400059
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Mail size={18} style={{ color: 'var(--color-black)', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--color-black)' }}>Email Support:</strong><br />
              care@classiccollectionsolapur.in<br />
              support@dominaltech.com
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Phone size={18} style={{ color: 'var(--color-black)', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--color-black)' }}>Helpline:</strong><br />
              1800-22-2244 (Toll Free)<br />
              Mon - Sat (10:00 AM - 7:00 PM)
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
