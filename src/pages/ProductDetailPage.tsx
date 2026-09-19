import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import type { Product } from '../types/product';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { CustomDatePicker } from '../components/CustomDatePicker';
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
  Zap,
  Plus,
  Minus
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

  let badgeLabel = 'OFFICIAL GEAR';
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
            <div className="product-hero-badge-strip">
              <span className={`detail-category-badge ${badgeClass}`}>
                {badgeLabel}
              </span>
              <span className={`detail-stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                {product.inStock ? 'In Stock • Ready' : 'Currently Unavailable'}
              </span>
            </div>

            <div className="product-hero-img-viewport">
              <img 
                src={activeImage || product.image} 
                alt={product.name} 
                className="product-main-view-img"
              />
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
                  title={`View image ${idx + 1}`}
                >
                  <img src={imgUri} alt={`${product.name} angle ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Technical Specifications & Compliance Section */}
          <div className="card product-specs-card">
            <div className="detail-section-header">
              <Layers size={18} color="var(--accent)" />
              <h3>Technical Specifications & Details</h3>
            </div>

            <div className="specs-table-grid">
              <div className="spec-item-row">
                <span className="spec-label">Brand / Manufacturer</span>
                <span className="spec-value">{product.brand || 'Official Camqrew Partner'}</span>
              </div>
              <div className="spec-item-row">
                <span className="spec-label">Category</span>
                <span className="spec-value">{product.category}</span>
              </div>
              <div className="spec-item-row">
                <span className="spec-label">Equipment Condition</span>
                <span className="spec-value highlight-pill">{product.condition || 'Inspected'}</span>
              </div>
              <div className="spec-item-row">
                <span className="spec-label">Availability</span>
                <span className="spec-value" style={{ color: product.inStock ? 'var(--accent)' : 'var(--danger)' }}>
                  {product.inStock ? 'Ready for Dispatch / Pickup' : 'Out of Stock'}
                </span>
              </div>

              {/* Dynamic DB Specifications */}
              {product.specs && Object.keys(product.specs).length > 0 && Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="spec-item-row">
                  <span className="spec-label">{k}</span>
                  <span className="spec-value">{String(v)}</span>
                </div>
              ))}

              {/* Advanced E-commerce Fields */}
              {product.sku && (
                <div className="spec-item-row">
                  <span className="spec-label">Item SKU</span>
                  <span className="spec-value font-mono">{product.sku}</span>
                </div>
              )}
              {product.gtin && (
                <div className="spec-item-row">
                  <span className="spec-label">GTIN / Barcode</span>
                  <span className="spec-value font-mono">{product.gtin}</span>
                </div>
              )}
              {product.itemDimensions && (
                <div className="spec-item-row">
                  <span className="spec-label">Item Dimensions</span>
                  <span className="spec-value">{product.itemDimensions}</span>
                </div>
              )}
              {product.itemWeight && (
                <div className="spec-item-row">
                  <span className="spec-label">Weight</span>
                  <span className="spec-value">{product.itemWeight}</span>
                </div>
              )}
              {product.batteryInfo && (
                <div className="spec-item-row">
                  <span className="spec-label">Battery Configuration</span>
                  <span className="spec-value">{product.batteryInfo}</span>
                </div>
              )}
              {product.countryOfOrigin && (
                <div className="spec-item-row">
                  <span className="spec-label">Country of Origin</span>
                  <span className="spec-value">{product.countryOfOrigin}</span>
                </div>
              )}
              {product.safetyWarnings && (
                <div className="spec-item-row warning-row">
                  <span className="spec-label">Safety & Handling</span>
                  <span className="spec-value" style={{ color: 'var(--warning, #f59e0b)' }}>{product.safetyWarnings}</span>
                </div>
              )}
            </div>
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
                <Zap size={18} />
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
              <div key={rel.id} className="card product-card">
                <Link to={`/marketplace/${rel.id}`} className="product-card-body-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="product-img-wrapper">
                    <img src={rel.image} alt={rel.name} />
                    <span 
                      className="pro-tag"
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: rel.type === 'rental' ? '#7C3AED' : 'rgba(0,0,0,0.75)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 11,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {rel.type === 'rental' ? 'FOR RENT' : 'FOR SALE'}
                    </span>
                  </div>

                  <div style={{ padding: '16px 4px 4px' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rel.category}</span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '4px 0' }}>{rel.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      {rel.description?.slice(0, 70)}...
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                          {rel.type === 'rental' ? 'Daily Rate' : 'Price'}
                        </span>
                        <strong style={{ fontSize: 17, color: 'var(--accent)' }}>
                          ₹{(rel.rentalPricePerDay || rel.price)?.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
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
    </div>
  );
};

export default ProductDetailPage;
