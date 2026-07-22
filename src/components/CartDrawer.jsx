import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CheckCircle } from 'lucide-react';

export default function CartDrawer() {
  const {
    showCart,
    setShowCart,
    cart,
    updateCartQty,
    removeFromCart,
    cartTotal,
    cartItemCount,
    createOrder
  } = useApp();

  const [checkoutStep, setCheckoutStep] = useState(false); // false = cart, true = shipping form
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const shippingFee = cartTotal >= 999 ? 0 : 99;
  const finalTotal = cartTotal + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!shippingDetails.name || !shippingDetails.phone || !shippingDetails.address) {
      alert("Please fill in all fields.");
      return;
    }
    setSubmittingOrder(true);
    const success = await createOrder(shippingDetails);
    setSubmittingOrder(false);
    if (success) {
      setOrderPlaced(true);
      setCheckoutStep(false);
      setShippingDetails({ name: '', phone: '', address: '' });
    } else {
      alert("Failed to place order. Please try again.");
    }
  };

  const closeDrawer = () => {
    setShowCart(false);
    // Reset states after animations close
    setTimeout(() => {
      setCheckoutStep(false);
      setOrderPlaced(false);
    }, 400);
  };

  return (
    <>
      {/* Backdrop */}
      <div className={`drawer-backdrop ${showCart ? 'open' : ''}`} onClick={closeDrawer} />

      {/* Drawer */}
      <div className={`drawer ${showCart ? 'open' : ''}`}>
        <div className="drawer-header">
          {checkoutStep ? (
            <button className="action-btn" onClick={() => setCheckoutStep(false)} style={{ padding: 0 }}>
              <ArrowLeft size={20} />
            </button>
          ) : (
            <span className="drawer-title">SHOPPING BAG ({cartItemCount})</span>
          )}
          
          <button className="drawer-close" onClick={closeDrawer}>
            <X size={20} />
          </button>
        </div>

        {/* Contents */}
        <div className="drawer-content">
          {orderPlaced ? (
            /* SUCCESS PANEL */
            <div className="drawer-empty" style={{ textAlign: 'center' }}>
              <CheckCircle size={60} color="var(--color-success)" className="drawer-empty-icon" style={{ opacity: 1 }} />
              <h3 style={{ marginTop: 'var(--spacing-md)' }}>Order Placed Successfully!</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)' }}>
                Thank you for shopping with Classic Collection Solapur. Your order has been registered and is being processed.
              </p>
              <button className="drawer-empty-btn" style={{ marginTop: 'var(--spacing-md)' }} onClick={closeDrawer}>
                Continue Shopping
              </button>
            </div>
          ) : checkoutStep ? (
            /* SHIPPING FORM PANEL */
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <h3 style={{ fontSize: '14px', marginBottom: 'var(--spacing-sm)' }}>SHIPPING & DELIVERY</h3>
              
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="form-input"
                  value={shippingDetails.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="input-phone-container">
                  <span className="phone-prefix">+91</span>
                  <input
                    type="tel"
                    name="phone"
                    required
                    pattern="[0-9]{10}"
                    className="input-phone"
                    value={shippingDetails.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit number"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Address</label>
                <textarea
                  name="address"
                  required
                  rows={4}
                  className="form-input"
                  value={shippingDetails.address}
                  onChange={handleInputChange}
                  placeholder="Street address, building, city, state, pincode"
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select Payment Method</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--color-bg-secondary)' }}>
                    <input type="radio" name="paymentMethod" defaultChecked />
                    <div style={{ fontSize: '12px' }}>
                      <strong>PhonePe Payment Gateway (UPI / Cards / NetBanking)</strong>
                      <div style={{ fontSize: '10px', color: 'var(--color-secondary-text)' }}>256-bit SSL encrypted secure payment</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}>
                    <input type="radio" name="paymentMethod" />
                    <div style={{ fontSize: '12px' }}>
                      <strong>Cash on Delivery (COD)</strong>
                      <div style={{ fontSize: '10px', color: 'var(--color-secondary-text)' }}>Pay cash upon delivery</div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                <div className="cart-summary-row">
                  <span>Items Subtotal</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Shipping Charges (3-7 Days Delivery)</span>
                  <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                </div>
                <div className="cart-summary-row total">
                  <span>Order Total</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p style={{ fontSize: '10px', color: 'var(--color-secondary-text)', textAlign: 'center', lineHeight: '1.4' }}>
                By clicking Place Order, you agree to our <a href="/terms-and-conditions" target="_blank" style={{ textDecoration: 'underline' }}>Terms & Conditions</a>, <a href="/shipping-policy" target="_blank" style={{ textDecoration: 'underline' }}>Shipping Policy (3-7 Days)</a>, <a href="/return-refund-policy" target="_blank" style={{ textDecoration: 'underline' }}>7-Days Return & 5-7 Days Refund Policy</a>. Managed by <strong>Dominal Technologies</strong>.
              </p>

              <button type="submit" className="checkout-btn" disabled={submittingOrder}>
                {submittingOrder ? "PROCESSING..." : "PAY & PLACE ORDER"}
              </button>
            </form>
          ) : cart.length === 0 ? (
            /* EMPTY CART */
            <div className="drawer-empty">
              <ShoppingBag size={64} className="drawer-empty-icon" />
              <h3>YOUR BAG IS EMPTY</h3>
              <p style={{ fontSize: '12px', textAlign: 'center' }}>
                Sign in to sync your bag, or start browsing to add premium styles!
              </p>
              <button className="drawer-empty-btn" onClick={closeDrawer}>
                Shop Now
              </button>
            </div>
          ) : (
            /* ITEMS LIST */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {cart.map((item, index) => {
                const itemPrice = item.product.sale_price || item.product.regular_price;
                return (
                  <div className="cart-item" key={`${item.product.id}-${item.selectedSize}-${index}`}>
                    <img
                      src={item.product.images?.[0] || item.product.image_url}
                      alt={item.product.title}
                      className="cart-item-image"
                    />
                    <div className="cart-item-details">
                      <h4 className="cart-item-title">{item.product.title}</h4>
                      <p className="cart-item-meta">Size: {item.selectedSize}</p>
                      <p className="cart-item-meta" style={{ color: 'var(--color-primary-text)' }}>
                        ₹{itemPrice.toLocaleString('en-IN')}
                      </p>
                      
                      <div className="cart-item-actions">
                        <div className="cart-item-qty">
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateCartQty(item.product.id, item.selectedSize, item.qty - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="cart-qty-val">{item.qty}</span>
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateCartQty(item.product.id, item.selectedSize, item.qty + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        
                        <button
                          className="cart-item-remove"
                          onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {cart.length > 0 && !checkoutStep && !orderPlaced && (
          <div className="drawer-footer">
            <div className="cart-summary-row">
              <span>Bag Total</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="cart-summary-row">
              <span>Estimated Shipping</span>
              <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
            </div>
            {shippingFee > 0 && (
              <p style={{ fontSize: '10px', color: 'var(--color-accent)', marginBottom: 'var(--spacing-sm)' }}>
                Add items worth ₹{999 - cartTotal} more for FREE shipping!
              </p>
            )}
            <div className="cart-summary-row total">
              <span>Order Total</span>
              <span>₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
            <button className="checkout-btn" onClick={() => setCheckoutStep(true)}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
