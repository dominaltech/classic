import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Phone, Mail, Lock, User, Check } from 'lucide-react';

export default function AuthModal() {
  const {
    showAuth,
    setShowAuth,
    authMode,
    setAuthMode,
    login,
    loginOtp,
    verifyOtpCode,
    signup
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleClose = () => {
    setShowAuth(false);
    // Reset forms
    setEmail('');
    setPassword('');
    setPhone('');
    setFullName('');
    setOtpCode('');
    setOtpSent(false);
    setAuthMode('login');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'login') {
      const success = await login(email, password);
      if (success) handleClose();
    } else {
      const success = await signup(email, password, fullName, phone);
      if (success) handleClose();
    }
    setLoading(false);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await loginOtp(phone);
    if (success) {
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await verifyOtpCode(otpCode);
    if (success) handleClose();
    setLoading(false);
  };

  if (!showAuth) return null;

  return (
    <div className={`modal-overlay ${showAuth ? 'open' : ''}`} onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <X size={20} />
        </button>

        {authMode === 'otp' ? (
          /* OTP VERIFICATION STEP */
          <form onSubmit={handleOtpVerifySubmit}>
            <h2 className="auth-title">ENTER VERIFICATION CODE</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
              We sent a verification code to +91 {phone}. Enter the code below.
            </p>

            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="Enter 4 or 6 digit code"
                className="form-input"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '18px', fontWeight: 'bold' }}
              />
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--color-secondary-text)', textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
              Demo Hint: Enter any code (e.g. 1234) to bypass verify.
            </p>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "VERIFYING..." : "VERIFY & SIGN IN"}
            </button>
          </form>
        ) : (
          /* STANDARD FORM (LOGIN OR REGISTER) */
          <div>
            <h2 className="auth-title">Welcome to Classic Collection Solapur</h2>
            
            {/* Tabs for Login / Register */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                SIGN IN
              </button>
              <button
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => setAuthMode('register')}
              >
                CREATE ACCOUNT
              </button>
            </div>

            {authMode === 'login' ? (
              /* SIGN IN FORM */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {/* Visual OTP Input Trigger */}
                <form onSubmit={handlePhoneSubmit} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--color-secondary-text)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 'var(--spacing-sm)' }}>
                    Login via Mobile OTP
                  </p>
                  <div className="form-group">
                    <div className="input-phone-container">
                      <span className="phone-prefix">+91</span>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        placeholder="Enter 10 digit mobile"
                        className="input-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="auth-submit-btn" style={{ marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-sm) var(--spacing-md)' }} disabled={loading}>
                    {loading ? "SENDING..." : "SEND OTP"}
                  </button>
                </form>

                {/* Email/Password Login */}
                <form onSubmit={handleEmailSubmit}>
                  <p style={{ fontSize: '11px', color: 'var(--color-secondary-text)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 'var(--spacing-sm)' }}>
                    Or Sign In using Email
                  </p>
                  
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? "SIGNING IN..." : "SIGN IN"}
                  </button>
                </form>

                <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--spacing-md)', fontSize: '11px', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>Demo Admin Login Credentials:</p>
                  <p>Email: <span style={{ fontFamily: 'monospace' }}>admin@classic.com</span></p>
                  <p>Password: <span style={{ fontFamily: 'monospace' }}>admin123</span></p>
                </div>
              </div>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleEmailSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div className="input-phone-container">
                    <span className="phone-prefix">+91</span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="10-digit number"
                      className="input-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? "CREATING ACCOUNT..." : "REGISTER"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
