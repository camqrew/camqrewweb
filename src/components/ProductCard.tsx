import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../types/product';
import { Star, ShoppingBag, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (p: Product) => void;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const isRental = product.type === 'rental';
  const priceValue = product.rentalPricePerDay || product.price || 0;
  
  const fallbackImage = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000';
  const displayImage = (!imgError && product.image) ? product.image : fallbackImage;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/marketplace/${product.id}`);
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <div 
      className="pro-card product-card-mobile-match cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Top Cinematic Image Banner */}
      <div className="pro-card-banner-wrapper">
        <img
          src={displayImage}
          alt={product.name}
          className="pro-card-banner-img"
          loading="lazy"
          onError={() => setImgError(true)}
        />

        {/* Floating Badges on Banner */}
        <div className="product-banner-badges">
          {/* Listing Type: FOR SALE or FOR RENT */}
          <span className={`product-type-badge ${isRental ? 'badge-rental' : 'badge-sale'}`}>
            {isRental ? 'FOR RENT' : (product.isOfficial ? 'OFFICIAL STORE' : 'FOR SALE')}
          </span>

          {/* Category Tag floating top-right */}
          <span className="product-cat-pill">
            {product.category || 'Gear'}
          </span>
        </div>
      </div>

      {/* Floating Content Box with curved top overlapping banner */}
      <div className="pro-card-floating-body">
        {/* Header Info Row: Brand tag & Star Rating */}
        <div className="pro-card-header-row product-card-header-row">
          <div className="product-brand-box">
            <span className="product-brand-pill">
              {product.brand || 'Camqrew'}
            </span>
          </div>

          <div className="pro-card-info-col">
            <div className="pro-card-rating-row">
              <Star size={13} fill="#3fb668" color="#3fb668" />
              <span className="pro-card-rating-val">{(product.rating || 4.9).toFixed(1)}</span>
              <span className="pro-card-review-count">
                ({isRental ? 'Insured Escrow' : (product.isOfficial ? 'Warranty' : 'Verified')})
              </span>
              <span className="pro-card-meta-dot">•</span>
              <span className={`product-stock-pill ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                {product.inStock ? (isRental ? 'Available' : 'In Stock') : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>

        {/* Product Title */}
        <h3 className="pro-card-pro-name product-title" title={product.name}>
          {product.name}
        </h3>

        {/* Specs / Condition Subtitle */}
        <p className="pro-card-role-title product-subtitle">
          {product.condition ? `Condition: ${product.condition}` : product.category}
          {product.codEnabled ? ' • COD Supported' : ''}
        </p>

        {/* Description snippet */}
        <p className="product-desc-snippet" title={product.description}>
          {product.description || 'Professional cinema & photography production equipment.'}
        </p>

        {/* Price / Rate Line */}
        <div className="pro-card-rate-line product-price-line">
          <span className="pro-card-rate-label">
            {isRental ? 'Daily Rate' : 'Price'}
          </span>
          <span className="pro-card-rate-val product-price-val">
            ₹{priceValue.toLocaleString('en-IN')}
          </span>
          {isRental && (
            <span className="pro-card-rate-unit">/day</span>
          )}
        </div>

        {/* Action Buttons Row: View + Add to Cart */}
        <div className="pro-card-actions-row product-card-actions-row">
          <Link 
            to={`/marketplace/${product.id}`} 
            className="pro-card-btn-view"
            onClick={(e) => e.stopPropagation()}
            title="View Product Details"
          >
            <span>View</span>
            <Eye size={15} />
          </Link>

          <button
            type="button"
            onClick={handleAdd}
            className="pro-card-btn-book product-btn-add-cart"
            disabled={!product.inStock}
            title={product.inStock ? 'Add to Cart' : 'Out of Stock'}
          >
            <ShoppingBag size={15} style={{ marginRight: 6 }} />
            <span>+ Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
