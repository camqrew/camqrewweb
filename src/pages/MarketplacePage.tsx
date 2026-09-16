import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { orderApi } from '../api/orderApi';
import type { Product, ProductType } from '../types/product';
import { useCartStore, type CartTab } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { LocationSelector } from '../components/LocationSelector';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { 
  ShoppingBag, 
  Search, 
  Camera, 
  Trash2, 
  CheckCircle, 
  X,
  Plus,
  Minus,
  Tag,
  ShieldCheck,
  Truck,
  Calendar,
  Lock,
  CreditCard,
  LogIn,
  Package,
  Clapperboard,
  Loader2,
  Check,
  User,
  Phone,
  MapPin,
  Building2,
  Store,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Navigation,
  Shield,
  Edit3
} from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // URL State
  const activeTab = (searchParams.get('tab') || 'catalog') as 'catalog' | 'cart';
  const typeFilter = (searchParams.get('type') || 'all') as ProductType | 'all';
  const categoryFilter = searchParams.get('category') || 'All';
  const [searchQuery, setSearchQuery] = useState('');

  // Cart Store
  const { 
    items, 
    addItem, 
    removeItem, 
    updateQuantity, 
    updateRentalDays, 
    applyPromoCode, 
    removePromoCode, 
    promoCode, 
    discountPercentage,
    getSaleItems,
    getRentalItems,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getShippingFee,
    getSecurityDeposit,
    getTotal,
    clearSaleCart,
    clearRentalCart
  } = useCartStore();

  // Dual-Cart Tab (Sale vs Rental)
  const saleItems = getSaleItems();
  const rentalItems = getRentalItems();
  const [cartTab, setCartTab] = useState<CartTab>(
    saleItems.length === 0 && rentalItems.length > 0 ? 'rental' : 'sale'
  );

  // Sync default cart tab if one is empty
  useEffect(() => {
    if (cartTab === 'sale' && saleItems.length === 0 && rentalItems.length > 0) {
      setCartTab('rental');
    } else if (cartTab === 'rental' && rentalItems.length === 0 && saleItems.length > 0) {
      setCartTab('sale');
    }
  }, [saleItems.length, rentalItems.length, cartTab]);

  // Auth Gate Modal & Toasts
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  // Checkout State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderCompleteInfo, setOrderCompleteInfo] = useState<{ id: string; type: 'sale' | 'rental' } | null>(null);

  // Checkout Form Fields
  const [checkoutName, setCheckoutName] = useState(user?.name || '');
  const [checkoutPhone, setCheckoutPhone] = useState(user?.phone || '');
  const [checkoutAddress1, setCheckoutAddress1] = useState('');
  const [checkoutAddress2, setCheckoutAddress2] = useState('');
  const [checkoutLocation, setCheckoutLocation] = useState({
    state: 'Maharashtra',
    district: 'Mumbai',
    city: 'Mumbai',
  });
  const [checkoutPincode, setCheckoutPincode] = useState('400001');
  const [deliveryOption, setDeliveryOption] = useState<'express' | 'hub'>('express');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  
  // Rental-Specific Checkout Fields
  const [rentalStartDate, setRentalStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharVerified, setAadharVerified] = useState(false);

  // Pre-fill user data when available
  useEffect(() => {
    if (user) {
      if (user.name && !checkoutName) setCheckoutName(user.name);
      if (user.phone && !checkoutPhone) setCheckoutPhone(user.phone);
    }
  }, [user, checkoutName, checkoutPhone]);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const categories = ['All', 'Cameras', 'Lenses', 'Lighting', 'Drones', 'Audio', 'Accessories'];

  useEffect(() => {
    setLoading(true);
    const pType = typeFilter === 'all' ? undefined : typeFilter;
    productApi.getProducts(pType, categoryFilter !== 'All' ? categoryFilter : undefined, searchQuery || undefined)
      .then(setProducts)
      .catch((e) => console.warn('Product fetch error', e))
      .finally(() => setLoading(false));
  }, [typeFilter, categoryFilter, searchQuery]);

  // Handle Add to Cart with Auth Gate
  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated || !user) {
      setPendingProduct(product);
      setShowAuthModal(true);
      return;
    }

    const isRental = product.type === 'rental';
    addItem(product, 1, undefined, undefined, isRental ? 1 : undefined);
    setToastMessage(`Added "${product.name}" to ${isRental ? 'Rentals' : 'Buy Gear'} cart!`);
  };

  // Handle Promo Code Application
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const ok = applyPromoCode(promoInput);
    if (ok) {
      setPromoError('');
      setToastMessage(`Promo code "${promoInput.toUpperCase()}" applied!`);
      setPromoInput('');
    } else {
      setPromoError('Invalid promo code. Use CAMCREW10 (10% off) or PROPROMO20 (20% off).');
    }
  };

  // Open Checkout
  const handleStartCheckout = () => {
    if (!isAuthenticated || !user) {
      navigate('/login?redirect=/marketplace?tab=cart');
      return;
    }
    setCheckoutStep(1);
    setCheckoutModalOpen(true);
  };

  // Execute Order Creation
  const handleFinishOrder = async () => {
    setCheckoutLoading(true);
    try {
      const activeItems = cartTab === 'rental' ? rentalItems : saleItems;
      const subtotal = getSubtotal(cartTab);
      const tax = getTaxAmount(cartTab);
      const total = getTotal(cartTab);

      const addressData = {
        fullName: checkoutName,
        phone: checkoutPhone,
        addressLine1: checkoutAddress1 || 'Primary Delivery Address',
        addressLine2: checkoutAddress2,
        state: checkoutLocation.state,
        district: checkoutLocation.district,
        city: checkoutLocation.city,
        pincode: checkoutPincode,
        aadharNumber: cartTab === 'rental' ? aadharNumber : undefined,
      };

      let placedOrder;
      if (cartTab === 'rental') {
        placedOrder = await orderApi.createRentalOrder(
          activeItems,
          subtotal,
          tax,
          total,
          addressData,
          paymentMethod
        );
        clearRentalCart();
      } else {
        placedOrder = await orderApi.createOrder(
          activeItems,
          addressData,
          subtotal,
          tax,
          total,
          paymentMethod
        );
        clearSaleCart();
      }

      setOrderCompleteInfo({ id: placedOrder.id, type: cartTab });
      setCheckoutModalOpen(false);
    } catch (err: any) {
      alert(`Checkout failed: ${err.message || 'Please verify order details.'}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const activeItems = cartTab === 'rental' ? rentalItems : saleItems;
  const activeSubtotal = getSubtotal(cartTab);
  const activeDiscount = getDiscountAmount(cartTab);
  const activeTax = getTaxAmount(cartTab);
  const activeShipping = getShippingFee(cartTab);
  const activeDeposit = getSecurityDeposit(cartTab);
  const activeTotal = getTotal(cartTab);

  return (
    <div className="marketplace-page container">
      {/* Visual Toast Notification */}
      {toastMessage && (
        <div className="global-floating-toast">
          <CheckCircle size={18} className="toast-icon" />
          <span>{toastMessage}</span>
          <button className="toast-close-btn" onClick={() => setToastMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="marketplace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Production Gear Marketplace</h1>
          <p className="page-subtitle">Rent cinema packages for shoots or buy verified pre-owned and official equipment.</p>
        </div>

        <button 
          className={`btn ${activeTab === 'cart' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setSearchParams({ tab: activeTab === 'cart' ? 'catalog' : 'cart' })}
        >
          <ShoppingBag size={18} />
          <span>Cart ({items.length})</span>
        </button>
      </div>

      {activeTab === 'cart' ? (
        <div className="dual-cart-container" style={{ width: '100%', margin: '0 auto', paddingBottom: 40 }}>
          {/* Order Complete Success Card */}
          {orderCompleteInfo ? (
            <div className="card text-center order-confirmed-card" style={{ maxWidth: 640, margin: '20px auto', padding: '40px 24px' }}>
              <div className="order-confirmed-icon-wrap" style={{ margin: '0 auto 20px', width: 64, height: 64, borderRadius: '50%', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={36} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>
                {orderCompleteInfo.type === 'rental' ? '🎬 Gear Rental Reserved!' : '📦 Order Placed Successfully!'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>
                Order Reference: <strong style={{ color: 'var(--text-primary)' }}>#{orderCompleteInfo.id.slice(0, 8)}</strong>
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
                {orderCompleteInfo.type === 'rental' 
                  ? 'Your equipment rental dates and refundable security deposit are locked in escrow.' 
                  : 'Your gear purchase has been confirmed. Courier tracking will update in your dashboard.'}
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
                <button 
                  onClick={() => { setOrderCompleteInfo(null); setSearchParams({ tab: 'catalog' }); }} 
                  className="btn btn-outline"
                >
                  Continue Shopping
                </button>
                <button 
                  onClick={() => navigate('/dashboard?tab=bookings')} 
                  className="btn btn-primary"
                >
                  View My Orders →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Dual-Cart Segmented Switcher (Matching Mobile App) ── */}
              <div className="cart-segmented-bar">
                <button
                  type="button"
                  className={`cart-segmented-tab ${cartTab === 'sale' ? 'active' : ''}`}
                  onClick={() => setCartTab('sale')}
                >
                  <Package size={18} />
                  <span>Buy Gear</span>
                  <span className="cart-count-pill">{saleItems.length}</span>
                </button>

                <button
                  type="button"
                  className={`cart-segmented-tab ${cartTab === 'rental' ? 'active' : ''}`}
                  onClick={() => setCartTab('rental')}
                >
                  <Clapperboard size={18} />
                  <span>Rentals</span>
                  <span className="cart-count-pill">{rentalItems.length}</span>
                </button>
              </div>

              {/* Cart Content: Empty State vs Item List */}
              {activeItems.length === 0 ? (
                <div className="card text-center cart-empty-card" style={{ padding: '60px 24px', maxWidth: 640, margin: '24px auto' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>
                    {cartTab === 'rental' ? '🎬' : '🛒'}
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                    Your {cartTab === 'rental' ? 'Rentals' : 'Buy Gear'} Cart is Empty
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 24px', fontSize: 14, lineHeight: 1.6 }}>
                    {cartTab === 'rental'
                      ? 'Ready to shoot? Browse our rental inventory for cinema camera packages, anamorphic primes, and lighting rigs.'
                      : 'Looking to buy? Browse our marketplace for official brand-new and inspected pre-owned gear.'}
                  </p>
                  <button 
                    onClick={() => setSearchParams({ tab: 'catalog', type: cartTab === 'rental' ? 'rental' : 'sale' })} 
                    className="btn btn-primary btn-md"
                  >
                    Explore {cartTab === 'rental' ? 'Rental Gear' : 'Gear for Sale'}
                  </button>
                </div>
              ) : (
                <div className="dual-cart-layout-grid">
                  {/* Left Column: Active Cart Items & Promo Box */}
                  <div className="cart-main-column">
                    <div className="cart-items-wrapper">
                      {activeItems.map((item, idx) => {
                        const isRental = item.product.type === 'rental';
                        const isOfficial = item.product.isOfficial || false;
                        const isUsed = item.product.isUsed || false;

                        let badgeText = isRental ? '🎬 RENTAL' : '📦 SALE';
                        let badgeClass = 'badge-rental';
                        if (!isRental && isOfficial) {
                          badgeText = '✨ OFFICIAL';
                          badgeClass = 'badge-official';
                        } else if (!isRental && isUsed) {
                          badgeText = '♻️ PRO USED';
                          badgeClass = 'badge-used';
                        }

                        const dailyRate = item.product.rentalPricePerDay || item.product.price;
                        const duration = item.daysCount || 1;
                        const itemSubtotal = isRental 
                          ? (dailyRate * duration * item.quantity)
                          : (item.product.price * item.quantity);

                        return (
                          <div key={`${item.product.id}-${idx}`} className="card cart-item-card-redesigned">
                            <div className="cart-item-image-box">
                              <img src={item.product.image} alt={item.product.name} />
                            </div>

                            <div className="cart-item-info">
                              <div className="cart-item-header-row">
                                <span className={`cart-source-badge ${badgeClass}`}>{badgeText}</span>
                                <span className="cart-item-cat">{item.product.category}</span>
                              </div>

                              <h4 className="cart-item-title">{item.product.name}</h4>

                              <div className="cart-item-price-row">
                                <span className="cart-unit-rate">
                                  ₹{(isRental ? dailyRate : item.product.price).toLocaleString('en-IN')}
                                  {isRental && <span className="rate-sub"> / day</span>}
                                </span>
                              </div>

                              {/* Rental Duration Stepper (Rental tab only) */}
                              {isRental && (
                                <div className="cart-rental-stepper-row">
                                  <span className="stepper-label">
                                    <Calendar size={13} style={{ marginRight: 4 }} /> Shoot Duration:
                                  </span>
                                  <div className="cart-stepper-control">
                                    <button 
                                      type="button"
                                      className="stepper-btn"
                                      onClick={() => updateRentalDays(item.product.id, duration - 1)}
                                      title="Decrease days"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="stepper-value"><strong>{duration}</strong> {duration === 1 ? 'day' : 'days'}</span>
                                    <button 
                                      type="button"
                                      className="stepper-btn"
                                      onClick={() => updateRentalDays(item.product.id, duration + 1)}
                                      title="Increase days"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Quantity Stepper & Subtotal Row */}
                              <div className="cart-item-bottom-actions">
                                <div className="cart-qty-block">
                                  <span className="stepper-label">Qty:</span>
                                  <div className="cart-stepper-control">
                                    <button 
                                      type="button"
                                      className="stepper-btn"
                                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                      title="Decrease quantity"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="stepper-value"><strong>{item.quantity}</strong></span>
                                    <button 
                                      type="button"
                                      className="stepper-btn"
                                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                      title="Increase quantity"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </div>

                                <div className="cart-item-calc">
                                  <span className="subtotal-label">Subtotal:</span>
                                  <strong className="subtotal-value">₹{itemSubtotal.toLocaleString('en-IN')}</strong>
                                </div>

                                <button 
                                  type="button"
                                  onClick={() => removeItem(item.product.id)}
                                  className="cart-trash-btn"
                                  title="Remove item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Promo Code Card */}
                    <div className="card cart-promo-card">
                      <div className="promo-header">
                        <Tag size={16} color="var(--accent)" />
                        <span style={{ fontWeight: 600, fontSize: 14 }}>Have a Discount or Promo Code?</span>
                      </div>

                      {promoCode ? (
                        <div className="promo-active-box">
                          <span className="promo-badge">
                            🎉 <strong>{promoCode}</strong> applied ({discountPercentage}% OFF)
                          </span>
                          <button 
                            type="button" 
                            className="btn btn-ghost btn-sm"
                            onClick={removePromoCode}
                            style={{ color: 'var(--danger)', fontSize: 12, padding: '4px 8px' }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyPromo} className="promo-input-row">
                          <input 
                            type="text" 
                            placeholder="Try CAMCREW10 or PROPROMO20"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            className="promo-input-field"
                          />
                          <button type="submit" className="btn btn-outline btn-sm">
                            Apply
                          </button>
                        </form>
                      )}

                      {promoError && (
                        <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{promoError}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Order Summary & Escrow Guarantee */}
                  <div className="cart-sidebar-column">
                    <div className="card cart-summary-card-redesigned">
                      <h3 className="summary-card-title">
                        {cartTab === 'rental' ? 'Rental Order Summary' : 'Order Summary'}
                      </h3>

                      <div className="summary-detail-row">
                        <span>Subtotal ({activeItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                        <strong>₹{activeSubtotal.toLocaleString('en-IN')}</strong>
                      </div>

                      {activeDiscount > 0 && (
                        <div className="summary-detail-row discount-row">
                          <span>Promo Discount ({promoCode})</span>
                          <strong style={{ color: 'var(--success, #10b981)' }}>-₹{activeDiscount.toLocaleString('en-IN')}</strong>
                        </div>
                      )}

                      {cartTab === 'sale' && (
                        <div className="summary-detail-row">
                          <span>Courier Shipping Fee</span>
                          <strong>₹{activeShipping.toLocaleString('en-IN')}</strong>
                        </div>
                      )}

                      {cartTab === 'rental' && (
                        <div className="summary-detail-row">
                          <span title="Fully refundable after post-shoot equipment check">
                            Refundable Security Deposit
                          </span>
                          <strong style={{ color: 'var(--accent)' }}>₹{activeDeposit.toLocaleString('en-IN')}</strong>
                        </div>
                      )}

                      <div className="summary-detail-row">
                        <span>GST Tax (18%)</span>
                        <strong>₹{activeTax.toLocaleString('en-IN')}</strong>
                      </div>

                      <hr className="divider" style={{ margin: '16px 0' }} />

                      <div className="summary-total-row">
                        <span>Grand Total</span>
                        <span className="summary-total-price">₹{activeTotal.toLocaleString('en-IN')}</span>
                      </div>

                      <button 
                        type="button" 
                        onClick={handleStartCheckout}
                        className="btn btn-primary full-width btn-lg checkout-cta-btn"
                        style={{ marginTop: 20 }}
                      >
                        {cartTab === 'rental' ? 'Proceed to Rental Checkout →' : 'Proceed to Buy Checkout →'}
                      </button>

                      {/* Escrow Guarantee Pill */}
                      <div className="cart-trust-shield">
                        <ShieldCheck size={18} color="var(--accent)" />
                        <div className="trust-text">
                          <strong>100% Escrow Protection</strong>
                          <span>
                            {cartTab === 'rental'
                              ? 'Deposit safely held in escrow and returned immediately upon gear inspection.'
                              : 'Seller payment released only after you verify the delivered equipment.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Catalog View */
        <>
          <div className="marketplace-filter-hub card">
            {/* Top Row: Segmented Mode Switcher + Search */}
            <div className="marketplace-top-controls-row">
              <div className="segmented-gear-switch">
                <button
                  type="button"
                  className={`segmented-tab ${typeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSearchParams({ type: 'all', category: categoryFilter })}
                >
                  All Gear
                </button>
                <button
                  type="button"
                  className={`segmented-tab ${typeFilter === 'rental' ? 'active' : ''}`}
                  onClick={() => setSearchParams({ type: 'rental', category: categoryFilter })}
                >
                  Rent Equipment
                </button>
                <button
                  type="button"
                  className={`segmented-tab ${typeFilter === 'sale' ? 'active' : ''}`}
                  onClick={() => setSearchParams({ type: 'sale', category: categoryFilter })}
                >
                  Buy Gear
                </button>
              </div>

              <div className="marketplace-search-box">
                <Search size={16} className="search-box-icon" />
                <input
                  type="text"
                  placeholder="Search cameras, primes, gimbals, drones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="marketplace-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: Category Chips */}
            <div className="marketplace-categories-row">
              <div className="category-chips-scroll">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`category-filter-chip ${categoryFilter === c ? 'active' : ''}`}
                    onClick={() => setSearchParams({ type: typeFilter, category: c })}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="pros-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="card skeleton-card" style={{ height: 280 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card text-center" style={{ padding: 40 }}>
              <Camera size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3>No equipment found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Try changing the category or search terms.</p>
            </div>
          ) : (
            <div className="pros-grid">
              {products.map((p) => (
                <div 
                  key={p.id} 
                  className="card product-card cursor-pointer"
                  onClick={() => navigate(`/marketplace/${p.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-img-wrapper">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                    />
                    <span 
                      className="pro-tag" 
                      style={{ 
                        position: 'absolute', 
                        top: 10, 
                        left: 10, 
                        background: p.type === 'rental' ? '#7C3AED' : 'rgba(0,0,0,0.75)', 
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 11,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {p.type === 'rental' ? 'FOR RENT' : 'FOR SALE'}
                    </span>
                  </div>

                  <div style={{ padding: '16px 4px 4px' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.category}</span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '4px 0' }}>{p.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      {p.description?.slice(0, 75)}...
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                          {p.type === 'rental' ? 'Daily Rate' : 'Price'}
                        </span>
                        <strong style={{ fontSize: 18, color: 'var(--accent)' }}>
                          ₹{(p.rentalPricePerDay || p.price)?.toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(p);
                        }}
                        className="btn btn-primary btn-sm"
                        title="Add to Cart"
                      >
                        + Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── AUTH REQUIRED MODAL ── */}
      {showAuthModal && (
        <div className="auth-gate-modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-gate-modal-card card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-icon" onClick={() => setShowAuthModal(false)}>
              <X size={20} />
            </button>

            <div className="auth-gate-icon-circle">
              <Lock size={32} color="var(--accent)" />
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 16, textAlign: 'center' }}>
              Sign In Required
            </h3>

            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '12px 0 24px', fontSize: 14, lineHeight: 1.6 }}>
              You need to be signed in to add <strong style={{ color: 'var(--text-primary)' }}>{pendingProduct?.name}</strong> to your cart and proceed with orders.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                type="button"
                className="btn btn-primary btn-lg full-width"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate(`/login?redirect=${encodeURIComponent('/marketplace')}`);
                }}
              >
                <LogIn size={18} style={{ marginRight: 6 }} />
                Sign In or Register →
              </button>

              <button 
                type="button"
                className="btn btn-outline full-width"
                onClick={() => setShowAuthModal(false)}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHECKOUT WIZARD MODAL ── */}
      {checkoutModalOpen && (
        <div className="checkout-modal-backdrop" onClick={() => !checkoutLoading && setCheckoutModalOpen(false)}>
          <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-modal-header">
              <div>
                <div className="checkout-badge-pill">
                  {cartTab === 'rental' ? (
                    <>
                      <Clapperboard size={12} /> Rental Equipment
                    </>
                  ) : (
                    <>
                      <Package size={12} /> Buy Gear Order
                    </>
                  )}
                </div>
                <h3 className="checkout-title">
                  {cartTab === 'rental' ? 'Equipment Rental Checkout' : 'Buy Gear Checkout'}
                </h3>
                <p className="checkout-subtitle">
                  {checkoutStep === 1 && (cartTab === 'rental' ? 'Step 1 of 4: Renter & Production Details' : 'Step 1 of 4: Shipping Address')}
                  {checkoutStep === 2 && (cartTab === 'rental' ? 'Step 2 of 4: Shoot Schedule & Custody Agreement' : 'Step 2 of 4: Choose Delivery Mode')}
                  {checkoutStep === 3 && (cartTab === 'rental' ? 'Step 3 of 4: Identity & Aadhaar Verification' : 'Step 3 of 4: Review Shipping & Order')}
                  {checkoutStep === 4 && 'Step 4 of 4: Escrow Payment & Confirmation'}
                </p>
              </div>
              <button 
                className="checkout-close-btn" 
                onClick={() => !checkoutLoading && setCheckoutModalOpen(false)}
                disabled={checkoutLoading}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Track */}
            <div className="checkout-stepper-container">
              <div className="checkout-stepper-track">
                {[1, 2, 3, 4].map((s) => (
                  <div 
                    key={s} 
                    className={`stepper-bar-segment ${s === checkoutStep ? 'active' : s < checkoutStep ? 'completed' : ''}`} 
                  />
                ))}
              </div>
              <div className="stepper-labels-row">
                <span className={`stepper-label-item ${checkoutStep === 1 ? 'active' : checkoutStep > 1 ? 'completed' : ''}`}>1. Address</span>
                <span className={`stepper-label-item ${checkoutStep === 2 ? 'active' : checkoutStep > 2 ? 'completed' : ''}`}>{cartTab === 'rental' ? '2. Schedule' : '2. Fulfillment'}</span>
                <span className={`stepper-label-item ${checkoutStep === 3 ? 'active' : checkoutStep > 3 ? 'completed' : ''}`}>{cartTab === 'rental' ? '3. ID KYC' : '3. Review'}</span>
                <span className={`stepper-label-item ${checkoutStep === 4 ? 'active' : ''}`}>4. Payment</span>
              </div>
            </div>

            {/* Step 1: Address / Details */}
            {checkoutStep === 1 && (
              <div className="checkout-step-body">
                <div className="checkout-form-grid">
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">
                      <User size={13} /> Full Legal Name
                    </label>
                    <div className="checkout-input-wrapper">
                      <User size={16} className="checkout-input-icon" />
                      <input 
                        type="text" 
                        className="checkout-input" 
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        placeholder="e.g. Mohammad Thaha Hussain"
                        required
                      />
                    </div>
                  </div>

                  <div className="checkout-form-group">
                    <label className="checkout-form-label">
                      <Phone size={13} /> Contact Phone Number
                    </label>
                    <div className="checkout-input-wrapper">
                      <Phone size={16} className="checkout-input-icon" />
                      <input 
                        type="tel" 
                        className="checkout-input" 
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="checkout-form-grid" style={{ marginTop: 10 }}>
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">
                      <MapPin size={13} /> {cartTab === 'rental' ? 'Studio / Shoot Address' : 'Street Address'}
                    </label>
                    <div className="checkout-input-wrapper">
                      <MapPin size={16} className="checkout-input-icon" />
                      <input 
                        type="text" 
                        className="checkout-input" 
                        value={checkoutAddress1}
                        onChange={(e) => setCheckoutAddress1(e.target.value)}
                        placeholder="House/Flat No., Building, Street"
                        required
                      />
                    </div>
                  </div>

                  <div className="checkout-form-group">
                    <label className="checkout-form-label">
                      <Building2 size={13} /> Landmark (Optional)
                    </label>
                    <div className="checkout-input-wrapper">
                      <Building2 size={16} className="checkout-input-icon" />
                      <input 
                        type="text" 
                        className="checkout-input" 
                        value={checkoutAddress2}
                        onChange={(e) => setCheckoutAddress2(e.target.value)}
                        placeholder="e.g. Near City Center, Flat 402"
                      />
                    </div>
                  </div>
                </div>

                <div className="checkout-form-group" style={{ marginTop: 10 }}>
                  <label className="checkout-form-label">
                    <Navigation size={13} /> Select Indian Locality (State, District, City)
                  </label>
                  <LocationSelector 
                    selectedState={checkoutLocation.state}
                    selectedDistrict={checkoutLocation.district}
                    selectedCity={checkoutLocation.city}
                    onChange={setCheckoutLocation}
                  />
                </div>

                <div className="checkout-form-group" style={{ marginTop: 10 }}>
                  <label className="checkout-form-label">
                    <Navigation size={13} /> Postal PIN Code
                  </label>
                  <div className="checkout-input-wrapper">
                    <Navigation size={16} className="checkout-input-icon" />
                    <input 
                      type="text" 
                      className="checkout-input" 
                      value={checkoutPincode}
                      onChange={(e) => setCheckoutPincode(e.target.value)}
                      placeholder="6-digit postal code (e.g. 400001)"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="checkout-actions-row">
                  <button 
                    type="button" 
                    className="checkout-btn-back"
                    onClick={() => setCheckoutModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="checkout-btn-next"
                    onClick={() => {
                      if (!checkoutName || !checkoutPhone || !checkoutAddress1) {
                        alert('Please complete your name, phone number, and street address.');
                        return;
                      }
                      setCheckoutStep(2);
                    }}
                  >
                    Next: {cartTab === 'rental' ? 'Rental Terms' : 'Fulfillment Mode'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Terms / Delivery Mode */}
            {checkoutStep === 2 && (
              <div className="checkout-step-body">
                {cartTab === 'rental' ? (
                  <>
                    <div className="checkout-form-group">
                      <label className="checkout-form-label">
                        <Calendar size={13} /> Shoot / Rental Start Date
                      </label>
                      <CustomDatePicker
                        value={rentalStartDate}
                        onChange={(val) => setRentalStartDate(val)}
                        min={new Date().toISOString().split('T')[0]}
                        placeholder="Select shoot start date"
                      />
                    </div>

                    <div className="checkout-review-card" style={{ marginTop: 16 }}>
                      <div className="review-card-header">
                        <span className="review-card-title">
                          <ShieldCheck size={16} color="var(--accent)" /> Equipment Custody Agreement
                        </span>
                      </div>
                      <ul style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 18, lineHeight: 1.6, margin: '8px 0 14px' }}>
                        <li>The renter agrees to use the gear professionally and avoid water or high-impact hazards.</li>
                        <li>Equipment is insured under Camcrew Transit Insurance throughout shipment and return.</li>
                        <li>Refundable security deposit is released back within 24 hours of gear return inspection.</li>
                      </ul>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        <input 
                          type="checkbox" 
                          checked={termsAgreed} 
                          onChange={(e) => setTermsAgreed(e.target.checked)} 
                          style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                        />
                        <span>I accept the Camcrew Equipment Rental Custody Terms</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="checkout-section-header">
                      <Truck size={16} /> Choose Delivery Method
                    </h4>
                    <div className="checkout-options-stack">
                      <div 
                        className={`checkout-option-card ${deliveryOption === 'express' ? 'selected' : ''}`}
                        onClick={() => setDeliveryOption('express')}
                      >
                        <div className="option-radio-dot">
                          <div className="option-radio-inner" />
                        </div>
                        <div className="option-icon-avatar">
                          <Truck size={22} />
                        </div>
                        <div className="option-content">
                          <div className="option-title-row">
                            <span className="option-title">Express Insured Courier</span>
                            <span className="option-price-pill">₹150</span>
                          </div>
                          <p className="option-desc">
                            Direct to your doorstep via BlueDart / Delhivery in 2-3 business days with transit lock.
                          </p>
                        </div>
                      </div>

                      <div 
                        className={`checkout-option-card ${deliveryOption === 'hub' ? 'selected' : ''}`}
                        onClick={() => setDeliveryOption('hub')}
                      >
                        <div className="option-radio-dot">
                          <div className="option-radio-inner" />
                        </div>
                        <div className="option-icon-avatar" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                          <Store size={22} />
                        </div>
                        <div className="option-content">
                          <div className="option-title-row">
                            <span className="option-title">Local Camcrew Hub Pickup</span>
                            <span className="option-price-pill free">FREE</span>
                          </div>
                          <p className="option-desc">
                            Pick up at your nearest metro creator center ({checkoutLocation.city || 'Metro'} Hub).
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="checkout-actions-row">
                  <button type="button" className="checkout-btn-back" onClick={() => setCheckoutStep(1)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button 
                    type="button" 
                    className="checkout-btn-next"
                    onClick={() => {
                      if (cartTab === 'rental' && !termsAgreed) {
                        alert('Please agree to the Equipment Custody Agreement to proceed.');
                        return;
                      }
                      setCheckoutStep(3);
                    }}
                  >
                    Next: {cartTab === 'rental' ? 'ID Verification' : 'Order Review'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: KYC / Order Summary */}
            {checkoutStep === 3 && (
              <div className="checkout-step-body">
                {cartTab === 'rental' ? (
                  <div className="kyc-step-container">
                    <div className="checkout-review-card">
                      <div className="review-card-header">
                        <span className="review-card-title">
                          <Lock size={16} color="var(--accent)" /> Identity & Aadhaar Verification
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                        Government ID verification is legally mandatory for high-value camera and cinema package rentals.
                      </p>

                      <div className="checkout-form-group">
                        <label className="checkout-form-label">
                          <Shield size={13} /> Aadhaar or Government ID Number
                        </label>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div className="checkout-input-wrapper" style={{ flex: 1 }}>
                            <Shield size={16} className="checkout-input-icon" />
                            <input 
                              type="text" 
                              className="checkout-input" 
                              placeholder="12-digit Aadhaar (e.g. 5421 8930 1192)"
                              value={aadharNumber}
                              onChange={(e) => {
                                setAadharNumber(e.target.value);
                                setAadharVerified(false);
                              }}
                            />
                          </div>
                          <button 
                            type="button" 
                            className={`btn ${aadharVerified ? 'btn-outline' : 'btn-primary'}`}
                            style={{ height: 46, padding: '0 20px', borderRadius: 12 }}
                            onClick={() => {
                              if (aadharNumber.trim().length >= 8) {
                                setAadharVerified(true);
                              } else {
                                alert('Please enter a valid Aadhaar or Government ID number.');
                              }
                            }}
                          >
                            {aadharVerified ? <Check size={16} color="var(--success)" /> : 'Verify'}
                          </button>
                        </div>
                      </div>

                      {aadharVerified && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'var(--success, #10b981)', fontSize: 13, fontWeight: 700 }}>
                          <CheckCircle size={16} /> ID Verified successfully for production rental!
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="sale-review-step">
                    {/* Destination Card */}
                    <div className="checkout-review-card">
                      <div className="review-card-header">
                        <span className="review-card-title">
                          <MapPin size={14} /> Shipping Destination
                        </span>
                        <button type="button" className="review-edit-btn" onClick={() => setCheckoutStep(1)}>
                          <Edit3 size={12} /> Edit Address
                        </button>
                      </div>

                      <div className="review-recipient-name">
                        {checkoutName} • <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{checkoutPhone}</span>
                      </div>
                      <p className="review-address-text">
                        {checkoutAddress1}{checkoutAddress2 ? `, ${checkoutAddress2}` : ''}<br />
                        {checkoutLocation.city}, {checkoutLocation.district}, {checkoutLocation.state} - {checkoutPincode}
                      </p>

                      <div className="review-badge-row">
                        <span className="review-chip">
                          <Truck size={12} /> {deliveryOption === 'express' ? 'Express Courier (₹150)' : 'Hub Pickup (Free)'}
                        </span>
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="checkout-items-card">
                      <div className="review-card-header">
                        <span className="review-card-title">
                          <ShoppingBag size={14} /> Order Items ({saleItems.length})
                        </span>
                      </div>

                      <div className="review-items-scroll">
                        {saleItems.map(i => (
                          <div key={i.product.id} className="review-item-row">
                            <div className="review-item-info">
                              <span className="review-item-qty">{i.quantity}×</span>
                              <span className="review-item-name">{i.product.name}</span>
                            </div>
                            <span className="review-item-price">₹{(i.product.price * i.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Receipt breakdown */}
                    <div className="checkout-receipt-box">
                      <div className="receipt-row">
                        <span>Items Subtotal</span>
                        <span>₹{getSubtotal('sale').toLocaleString('en-IN')}</span>
                      </div>
                      <div className="receipt-row">
                        <span>Delivery & Transit Insurance</span>
                        <span>{getShippingFee('sale') === 0 ? <strong style={{ color: '#10b981' }}>FREE</strong> : `₹${getShippingFee('sale')}`}</span>
                      </div>
                      <div className="receipt-row">
                        <span>Estimated GST (18%)</span>
                        <span>₹{getTaxAmount('sale').toLocaleString('en-IN')}</span>
                      </div>
                      <div className="receipt-row total">
                        <span>Total Payable</span>
                        <span className="total-accent">₹{getTotal('sale').toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="checkout-actions-row">
                  <button type="button" className="checkout-btn-back" onClick={() => setCheckoutStep(2)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button 
                    type="button" 
                    className="checkout-btn-next"
                    onClick={() => {
                      if (cartTab === 'rental' && !aadharVerified) {
                        alert('Please verify your Aadhaar or Government ID number to proceed.');
                        return;
                      }
                      setCheckoutStep(4);
                    }}
                  >
                    Next: Payment Mode <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {checkoutStep === 4 && (
              <div className="checkout-step-body">
                <h4 className="checkout-section-header">
                  <CreditCard size={16} /> Select Payment Method
                </h4>

                <div className="checkout-options-stack">
                  <div 
                    className={`checkout-option-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <div className="option-radio-dot">
                      <div className="option-radio-inner" />
                    </div>
                    <div className="option-icon-avatar">
                      <QrCode size={22} />
                    </div>
                    <div className="option-content">
                      <div className="option-title-row">
                        <span className="option-title">UPI / Instant QR Code</span>
                        <span className="option-price-pill free">Instant • Zero Fee</span>
                      </div>
                      <p className="option-desc">
                        Google Pay, PhonePe, Paytm, CRED or any BHIM UPI application.
                      </p>
                    </div>
                  </div>

                  <div 
                    className={`checkout-option-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="option-radio-dot">
                      <div className="option-radio-inner" />
                    </div>
                    <div className="option-icon-avatar" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
                      <CreditCard size={22} />
                    </div>
                    <div className="option-content">
                      <div className="option-title-row">
                        <span className="option-title">Credit / Debit Card</span>
                        <span className="option-price-pill" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)' }}>256-Bit SSL</span>
                      </div>
                      <p className="option-desc">
                        Visa, Mastercard, RuPay, and American Express cards supported.
                      </p>
                    </div>
                  </div>

                  {cartTab === 'sale' && (
                    <div 
                      className={`checkout-option-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div className="option-radio-dot">
                        <div className="option-radio-inner" />
                      </div>
                      <div className="option-icon-avatar" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                        <Truck size={22} />
                      </div>
                      <div className="option-content">
                        <div className="option-title-row">
                          <span className="option-title">Cash on Delivery (COD)</span>
                          <span className="option-price-pill" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>Inspection First</span>
                        </div>
                        <p className="option-desc">
                          Inspect the parcel at your doorstep before completing payment.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Escrow assurance note */}
                <div className="checkout-escrow-banner">
                  <ShieldCheck size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>100% Escrow Protection:</strong> Funds remain securely held in Camcrew Escrow until you receive and verify the gear.
                  </div>
                </div>

                {/* Total amount payable */}
                <div className="checkout-payable-card">
                  <div className="payable-label-box">
                    <span className="payable-title">Amount Payable Now</span>
                    <span className="payable-subtext">Inclusive of GST, Shipping & Escrow Protection</span>
                  </div>
                  <span className="payable-amount">₹{activeTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="checkout-actions-row">
                  <button 
                    type="button" 
                    className="checkout-btn-back" 
                    onClick={() => setCheckoutStep(3)}
                    disabled={checkoutLoading}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button 
                    type="button" 
                    className="checkout-btn-next"
                    onClick={handleFinishOrder}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Securing Escrow Order...
                      </>
                    ) : (
                      <>
                        <Lock size={16} /> Pay ₹{activeTotal.toLocaleString('en-IN')} & Confirm
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
