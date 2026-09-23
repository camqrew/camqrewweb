import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import type { Product } from '../types/product';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { ProductCard } from '../components/ProductCard';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Truck, 
  Calendar, 
  ShoppingCart, 
  Lock, 
  X, 
  CheckCircle, 
  Package, 
  Clock, 
  ChevronRight,
  Layers,
  Plus,
  Minus,
  ZoomIn,
  Camera,
  Shield,
  CheckCircle2,
  CreditCard,
  QrCode,
  Tag,
  Box,
  Scale,
  BatteryCharging,
  Globe,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Rental date calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Auth Gate Modal & Toast
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    productApi.getProductById(id)
      .then((p) => {
        setProduct(p);
        setActiveImage(p.image);
        // Fetch related products from same category or type
        productApi.getProducts(p.type, p.category)
          .then((list) => {
            setRelatedProducts(list.filter((item) => item.id !== p.id).slice(0, 4));
          })
          .catch(() => {});
      })
      .catch((err) => {
        console.error('Failed to fetch product:', err);
        setError('Equipment not found or no longer available.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Toast Auto-hide
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Calculate rental days
  const calculateRentalDays = () => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const rentalDays = calculateRentalDays();

  const handleAddToCart = () => {
    if (!product) return;
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }

    const isRental = product.type === 'rental';
    if (isRental) {
      addItem(product, 1, startDate, endDate, rentalDays);
      setToastMessage(`Added "${product.name}" for ${rentalDays} ${rentalDays === 1 ? 'day' : 'days'} to your rental cart!`);
    } else {
      addItem(product, quantity);
      setToastMessage(`Added ${quantity} × "${product.name}" to your cart!`);
    }
  };

  const handleInstantCheckout = () => {
    if (!product) return;
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }
    const isRental = product.type === 'rental';
    if (isRental) {
      addItem(product, 1, startDate, endDate, rentalDays);
      navigate('/marketplace?tab=cart');
    } else {
      addItem(product, quantity);
      navigate('/marketplace?tab=cart');
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page container" style={{ padding: '60px 24px', minHeight: '60vh' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <div className="card skeleton-card" style={{ width: 120, height: 24, borderRadius: 8 }} />
          <div className="card skeleton-card" style={{ width: 180, height: 24, borderRadius: 8 }} />
        </div>
        <div className="product-detail-grid">
          <div className="card skeleton-card" style={{ height: 460, borderRadius: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card skeleton-card" style={{ height: 40, width: '70%', borderRadius: 8 }} />
            <div className="card skeleton-card" style={{ height: 30, width: '40%', borderRadius: 8 }} />
            <div className="card skeleton-card" style={{ height: 120, borderRadius: 16 }} />
            <div className="card skeleton-card" style={{ height: 160, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 540, margin: '0 auto', padding: '48px 32px', borderRadius: 24 }}>
          <Package size={56} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Equipment Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 15 }}>
            {error || 'The equipment you are looking for does not exist or may have been removed.'}
          </p>
          <Link to="/marketplace" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeft size={16} /> Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const isRental = product.type === 'rental';
  const isUsed = product.isUsed || false;

  const allImages = product.gallery && product.gallery.length > 0
    ? [product.image, ...product.gallery.filter((g) => g !== product.image)]
    : [product.image];

  const dailyRate = product.rentalPricePerDay || product.price;
  const estimatedRentalTotal = dailyRate * rentalDays;

  // Intelligently identify brand or creator name
  const displayBrand = (() => {
    if (product.brand && product.brand !== 'Rental' && product.brand !== 'Used Gear') return product.brand;
    const knownBrands = ['Sony', 'Canon', 'ARRI', 'Cooke', 'RED', 'DJI', 'Aputure', 'Hasselblad', 'Profoto', 'Sennheiser', 'Tilta', 'Sound Devices', 'Blackmagic', 'Fujifilm', 'Nikon', 'Panasonic'];
    const found = knownBrands.find(b => product.name?.toLowerCase().includes(b.toLowerCase()));
    if (found) return found;
    return isRental ? 'Camqrew Pro Creator' : (product.brand || 'Camqrew');
  })();

  let badgeLabel = 'OFFICIAL GEAR STORE';
  let badgeClass = 'badge-official';
  if (isRental) {
    badgeLabel = 'EQUIPMENT RENTAL';
    badgeClass = 'badge-rental';
  } else if (isUsed) {
    badgeLabel = 'VERIFIED PRE-OWNED';
    badgeClass = 'badge-used';
  }

  return (
    <div className="product-detail-page container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="global-floating-toast">
          <CheckCircle size={18} className="toast-icon" />
          <span>{toastMessage}</span>
          <button className="toast-close-btn" onClick={() => setToastMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Breadcrumbs Navigation */}
      <nav className="product-breadcrumbs">
        <Link to="/" className="breadcrumb-link">Home</Link>
        <ChevronRight size={14} className="breadcrumb-sep" />
        <Link to="/marketplace" className="breadcrumb-link">Marketplace</Link>
        <ChevronRight size={14} className="breadcrumb-sep" />
        <Link to={`/marketplace?category=${encodeURIComponent(product.category)}`} className="breadcrumb-link">
          {product.category}
        </Link>
        <ChevronRight size={14} className="breadcrumb-sep" />
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      {/* Back to Marketplace Quick Trigger */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/marketplace" className="detail-back-btn">
          <ArrowLeft size={16} />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      {/* Main 2-Column Product Layout */}
      <div className="product-detail-grid">
        {/* Left Column: Media Showcase */}
        <div className="product-media-column">
          <div className="product-hero-image-card card">
            {/* Floating Top Badges Strip */}
            <div className="product-hero-badge-strip">
              <span className={`detail-category-badge ${badgeClass}`}>
                {badgeLabel}
              </span>
              <span className={`detail-stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                <span className="status-live-dot" />
                <span>{product.inStock ? (isRental ? 'Available • Instant Escrow' : 'In Stock • Ready to Ship') : 'Currently Unavailable'}</span>
              </span>
            </div>

            {/* Viewport with dark studio background and smooth zoom */}
            <div 
              className="product-hero-img-viewport cursor-pointer"
              onClick={() => setIsLightboxOpen(true)}
              title="Click to expand high-resolution photo"
            >
              <img 
                src={activeImage || product.image} 
                alt={product.name} 
                className="product-main-view-img"
              />

              {/* Bottom Floating Overlay Bar */}
              <div className="product-hero-overlay-bar">
                {allImages.length > 1 && (
                  <span className="hero-img-counter-pill">
                    <Camera size={13} />
                    <span>{allImages.indexOf(activeImage || product.image) + 1} / {allImages.length}</span>
                  </span>
                )}
                <button
                  type="button"
                  className="hero-zoom-trigger-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  title="Expand Full Resolution"
                >
                  <ZoomIn size={15} />
                  <span>Zoom</span>
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnail Gallery Strip */}
          {allImages.length > 1 && (
            <div className="product-thumbnail-strip">
              {allImages.map((imgUri, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`product-thumb-btn ${activeImage === imgUri ? 'active' : ''}`}
                  onClick={() => setActiveImage(imgUri)}
                  title={`View angle ${idx + 1}`}
                >
                  <img src={imgUri} alt={`${product.name} angle ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Technical Specifications & Details Section */}
          <div className="card product-specs-card">
            <div className="detail-section-header">
              <div className="specs-header-left">
                <div className="specs-header-icon-box">
                  <Layers size={18} color="var(--accent)" />
                </div>
                <div className="specs-header-text">
                  <h3>Technical Specifications & Details</h3>
                  <p>Verified hardware standards & platform inspection criteria</p>
                </div>
              </div>
              <div className="specs-verified-pill">
                <ShieldCheck size={14} color="#3fb668" />
                <span>Verified Specs</span>
              </div>
            </div>

            {/* Responsive Specifications Tiles Grid */}
            <div className="specs-tiles-grid">
              <div className="spec-tile">
                <div className="spec-tile-icon"><Shield size={18} /></div>
                <div className="spec-tile-content">
                  <span className="spec-tile-label">Brand / Maker</span>
                  <strong className="spec-tile-value">{displayBrand}</strong>
                </div>
              </div>

              <div className="spec-tile">
                <div className="spec-tile-icon"><Package size={18} /></div>
                <div className="spec-tile-content">
                  <span className="spec-tile-label">Category</span>
                  <strong className="spec-tile-value">{product.category}</strong>
                </div>
              </div>

              <div className="spec-tile">
                <div className="spec-tile-icon"><CheckCircle2 size={18} /></div>
                <div className="spec-tile-content">
                  <span className="spec-tile-label">Equipment Condition</span>
                  <div className="spec-tile-value">
                    <span className="spec-condition-badge">
                      {product.condition || 'Inspected & Tested'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="spec-tile">
                <div className="spec-tile-icon"><Truck size={18} /></div>
                <div className="spec-tile-content">
                  <span className="spec-tile-label">Availability</span>
                  <strong className="spec-tile-value" style={{ color: product.inStock ? 'var(--accent)' : 'var(--danger)' }}>
                    {product.inStock ? (isRental ? 'Ready for Dispatch / Pickup' : 'In Stock • Ready to Ship') : 'Currently Out of Stock'}
                  </strong>
                </div>
              </div>

              <div className="spec-tile">
                <div className="spec-tile-icon"><Lock size={18} /></div>
                <div className="spec-tile-content">
                  <span className="spec-tile-label">Protection & Assurance</span>
                  <strong className="spec-tile-value">
                    {isRental ? '100% Refundable Escrow' : 'Camqrew Verified & Tested'}
                  </strong>
                </div>
              </div>

              <div className="spec-tile">
                <div className="spec-tile-icon"><CreditCard size={18} /></div>
                <div className="spec-tile-content">
                  <span className="spec-tile-label">Payment Modes</span>
                  <strong className="spec-tile-value">
                    {product.codEnabled ? 'Cash on Delivery • UPI • Cards' : 'Secure Escrow UPI & Cards'}
                  </strong>
                </div>
              </div>

              {/* Dynamic DB Specs (SKU, GTIN, Dimensions, Weight, Battery, Country, Safety) */}
              {product.sku && (
                <div className="spec-tile">
                  <div className="spec-tile-icon"><QrCode size={18} /></div>
                  <div className="spec-tile-content">
                    <span className="spec-tile-label">Item SKU</span>
                    <strong className="spec-tile-value font-mono">{product.sku}</strong>
                  </div>
                </div>
              )}

              {product.gtin && (
                <div className="spec-tile">
                  <div className="spec-tile-icon"><Tag size={18} /></div>
                  <div className="spec-tile-content">
                    <span className="spec-tile-label">GTIN / Barcode</span>
                    <strong className="spec-tile-value font-mono">{product.gtin}</strong>
                  </div>
                </div>
              )}

              {product.itemDimensions && (
                <div className="spec-tile">
                  <div className="spec-tile-icon"><Box size={18} /></div>
                  <div className="spec-tile-content">
                    <span className="spec-tile-label">Dimensions</span>
                    <strong className="spec-tile-value">{product.itemDimensions}</strong>
                  </div>
                </div>
              )}

              {product.itemWeight && (
                <div className="spec-tile">
                  <div className="spec-tile-icon"><Scale size={18} /></div>
                  <div className="spec-tile-content">
                    <span className="spec-tile-label">Weight</span>
                    <strong className="spec-tile-value">{product.itemWeight}</strong>
                  </div>
                </div>
              )}

              {product.batteryInfo && (
                <div className="spec-tile">
                  <div className="spec-tile-icon"><BatteryCharging size={18} /></div>
                  <div className="spec-tile-content">
                    <span className="spec-tile-label">Battery Configuration</span>
                    <strong className="spec-tile-value">{product.batteryInfo}</strong>
                  </div>
                </div>
              )}

              {product.countryOfOrigin && (
                <div className="spec-tile">
                  <div className="spec-tile-icon"><Globe size={18} /></div>
                  <div className="spec-tile-content">
                    <span className="spec-tile-label">Country of Origin</span>
                    <strong className="spec-tile-value">{product.countryOfOrigin}</strong>
                  </div>
                </div>
              )}

              {product.specs && Object.keys(product.specs).length > 0 && Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="spec-tile">
                  <div className="spec-tile-icon"><Sparkles size={18} /></div>
                  <div className="spec-tile-content">
                    <span className="spec-tile-label">{k}</span>
                    <strong className="spec-tile-value">{String(v)}</strong>
                  </div>
                </div>
              ))}
            </div>

            {product.safetyWarnings && (
              <div className="spec-safety-alert-banner">
                <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Safety & Handling Advisory:</strong> {product.safetyWarnings}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Info, Pricing, Dates & Action Card */}
        <div className="product-info-column">
          <div className="card product-primary-info-card">
            {/* Header / Brand & Rating */}
            <div className="product-header-meta">
              <span className="product-brand-tag">{product.brand}</span>
              <div className="product-rating-pill">
                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                <span>{(product.rating || 5.0).toFixed(1)}</span>
                <span className="rating-count">(Verified Reviews)</span>
              </div>
            </div>

            <h1 className="product-headline">{product.name}</h1>

            {/* Price & Commercial Banner */}
            <div className="product-price-block">
              {product.salePrice && !isRental ? (
                <div className="price-with-discount">
                  <div className="price-main-display">
                    <span className="currency-symbol">₹</span>
                    <span className="price-number">{product.salePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="original-strikethrough">₹{product.price.toLocaleString('en-IN')}</span>
                  <span className="discount-tag">
                    {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                  </span>
                </div>
              ) : (
                <div className="price-main-display">
                  <span className="currency-symbol">₹</span>
                  <span className="price-number">
                    {(isRental ? dailyRate : product.price).toLocaleString('en-IN')}
                  </span>
                  {isRental && <span className="price-unit-period">/ day</span>}
                </div>
              )}

              {isRental ? (
                <p className="price-helper-sub">
                  Plus 100% refundable security deposit held safely in Camqrew Escrow until equipment return.
                </p>
              ) : (
                <p className="price-helper-sub">
                  Inclusive of all taxes. Free Camqrew hub pickup or insured express courier.
                </p>
              )}
            </div>

            {/* ── Rental Duration Scheduler (Only for Rentals) ── */}
            {isRental && (
              <div className="rental-duration-box">
                <div className="duration-box-header">
                  <Calendar size={16} color="var(--accent)" />
                  <h4>Select Production Shoot Dates</h4>
                </div>

                <div className="rental-dates-picker-grid">
                  <div className="date-input-group">
                    <label className="auth-field-label">Shoot Start Date</label>
                    <CustomDatePicker
                      value={startDate}
                      min={todayStr}
                      onChange={(val) => {
                        setStartDate(val);
                        if (endDate && val > endDate) {
                          setEndDate(val);
                        }
                      }}
                      placeholder="Shoot Start Date"
                    />
                  </div>

                  <div className="date-input-group">
                    <label className="auth-field-label">Shoot Wrap Date</label>
                    <CustomDatePicker
                      value={endDate}
                      min={startDate || todayStr}
                      onChange={(val) => setEndDate(val)}
                      placeholder="Shoot Wrap Date"
                    />
                  </div>
                </div>

                <div className="rental-calculation-strip">
                  <div className="calc-item">
                    <span className="calc-label">Total Duration:</span>
                    <strong className="calc-value">{rentalDays} {rentalDays === 1 ? 'day' : 'days'}</strong>
                  </div>
                  <div className="calc-item">
                    <span className="calc-label">Estimated Rental:</span>
                    <strong className="calc-value" style={{ color: 'var(--accent)' }}>
                      ₹{estimatedRentalTotal.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Stepper (Only for Sale) */}
            {!isRental && (
              <div className="quantity-select-row">
                <label className="auth-field-label">Quantity</label>
                <div className="cart-stepper-control" style={{ width: 140 }}>
                  <button 
                    type="button" 
                    className="stepper-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="stepper-value">{quantity}</span>
                  <button 
                    type="button" 
                    className="stepper-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="product-actions-stack">
              <button
                type="button"
                className="btn btn-primary btn-lg product-cta-btn"
                onClick={handleInstantCheckout}
                disabled={!product.inStock}
              >
                <span>{isRental ? 'Book & Rent Now' : 'Buy Now with Escrow'}</span>
              </button>

              <button
                type="button"
                className="btn btn-outline btn-lg product-cart-btn"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart size={18} />
                <span>Add to {isRental ? 'Rentals' : 'Gear'} Cart</span>
              </button>
            </div>

            {/* Trust Assurance Grid */}
            <div className="product-trust-assurances">
              <div className="trust-tile">
                <ShieldCheck size={20} color="var(--accent)" />
                <div className="trust-tile-text">
                  <strong>Camqrew Escrow Protection</strong>
                  <span>Funds released only after you test & inspect equipment.</span>
                </div>
              </div>

              <div className="trust-tile">
                <Truck size={20} color="var(--accent)" />
                <div className="trust-tile-text">
                  <strong>Insured Transit & Hub Handover</strong>
                  <span>Doorstep delivery or instant verified local hub collection.</span>
                </div>
              </div>

              <div className="trust-tile">
                <Clock size={20} color="var(--accent)" />
                <div className="trust-tile-text">
                  <strong>Pre-Shoot Gear Inspection</strong>
                  <span>Certified sensor, optics & mechanical condition verified.</span>
                </div>
              </div>
            </div>

            {/* Product Bullet Points / Highlights */}
            {product.bulletPoints && product.bulletPoints.length > 0 && (
              <div className="product-highlights-box">
                <h4 className="highlights-title">Key Equipment Highlights</h4>
                <ul className="highlights-list">
                  {product.bulletPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Product Description */}
            <div className="product-description-box">
              <h4 className="description-title">Equipment Overview</h4>
              <p className="description-text">
                {product.description || 'Professional cinema & creative equipment verified by Camqrew. All parts, sensors, and mounts are maintained in optimal operational condition.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RELATED EQUIPMENT SECTION ── */}
      {relatedProducts.length > 0 && (
        <div className="related-equipment-section" style={{ marginTop: 60 }}>
          <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>Explore Similar {product.category}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>More verified gear available in the marketplace.</p>
            </div>
            <Link to={`/marketplace?category=${encodeURIComponent(product.category)}`} className="btn btn-outline btn-sm">
              View All {product.category}
            </Link>
          </div>

          <div className="pros-grid">
            {relatedProducts.map((rel) => (
              <ProductCard 
                key={rel.id} 
                product={rel} 
                onAddToCart={(p) => {
                  addItem(p);
                  navigate('/marketplace?tab=cart');
                }}
              />
            ))}
          </div>
        </div>
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
              You need to be signed in to add <strong style={{ color: 'var(--text-primary)' }}>{product.name}</strong> to your cart and proceed with orders.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link 
                to={`/login?redirect=/marketplace/${product.id}`}
                className="btn btn-primary full-width btn-lg"
                style={{ justifyContent: 'center' }}
              >
                Sign In to Account
              </Link>
              <Link 
                to={`/register?redirect=/marketplace/${product.id}`}
                className="btn btn-outline full-width"
                style={{ justifyContent: 'center' }}
              >
                Create New Free Account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── HIGH RESOLUTION IMAGE LIGHTBOX ── */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        images={allImages}
        initialIndex={allImages.indexOf(activeImage || product.image)}
        onClose={() => setIsLightboxOpen(false)}
        title={product.name}
      />
    </div>
  );
};

export default ProductDetailPage;
