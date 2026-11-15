import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Star, Scale } from 'lucide-react';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import { toggleWishlistAsync } from '../../redux/slices/wishlistSlice';
import { addToCompare } from '../../redux/slices/compareSlice';
import { addToast, openAuthModal } from '../../redux/slices/uiSlice';

export const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const isWishlisted = wishlistItems.some(
    (item) => (item._id || item) === product._id
  );

  const isOutOfStock = product.stockQuantity <= 0;
  const discountPercent =
    product.price > product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }

    if (isOutOfStock) {
      dispatch(addToast({ message: 'Sorry, this product is currently out of stock.', type: 'error' }));
      return;
    }

    const res = await dispatch(addToCartAsync({ productId: product._id, quantity: 1 }));
    if (!res.error) {
      dispatch(addToast({ message: `"${product.title}" added to your cart!`, type: 'success' }));
    } else {
      dispatch(addToast({ message: res.payload || 'Failed to add item to cart.', type: 'error' }));
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }

    await dispatch(toggleWishlistAsync(product._id));
  };

  const handleAddToCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCompare(product));
    dispatch(addToast({ message: `"${product.title}" added to comparison.`, type: 'info' }));
  };

  return (
    <div className="card-modern group relative flex flex-col h-full bg-white rounded-xl sm:rounded-2xl overflow-hidden p-2.5 sm:p-3.5">
      {/* Top Badges & Action Buttons */}
      <div className="relative w-full aspect-square bg-slate-50 rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3">
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 bg-brand-orange text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
            {discountPercent}% OFF
          </span>
        )}

        {/* Out of Stock Overlay/Badge */}
        {isOutOfStock && (
          <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 bg-brand-error text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
            Out of Stock
          </span>
        )}

        {/* Product Image */}
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={
              product.images && product.images.length > 0
                ? product.images[0]
                : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
            }
            alt={product.title}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ${
              isOutOfStock ? 'opacity-60 grayscale' : ''
            }`}
            loading="lazy"
          />
        </Link>

        {/* Floating Quick Actions (Wishlist & Compare) */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 flex flex-col gap-1 sm:gap-1.5 z-10">
          <button
            onClick={handleToggleWishlist}
            className={`p-1.5 sm:p-2 rounded-full transition-all shadow-sm ${
              isWishlisted
                ? 'bg-red-50 text-brand-error'
                : 'bg-white/90 text-slate-500 hover:text-brand-error hover:bg-white'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleAddToCompare}
            className="p-2 rounded-full bg-white/90 text-slate-500 hover:text-brand-royal hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100 hidden sm:flex"
            title="Compare Product"
          >
            <Scale className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Category Name */}
          {product.category && (
            <p className="text-[10px] sm:text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-0.5 sm:mb-1 truncate">
              {product.category.name || 'Essentials'}
            </p>
          )}

          {/* Title */}
          <Link
            to={`/product/${product.slug}`}
            className="text-xs sm:text-sm font-semibold text-brand-dark hover:text-brand-royal line-clamp-2 leading-tight sm:leading-snug transition-colors mb-1 sm:mb-1.5"
            title={product.title}
          >
            {product.title}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            <div className="flex items-center gap-0.5 sm:gap-1 bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-orange fill-current" />
              <span>{product.ratingsAverage > 0 ? product.ratingsAverage.toFixed(1) : 'New'}</span>
            </div>
            {product.ratingsQuantity > 0 && (
              <span className="text-[10px] sm:text-[11px] text-slate-400">({product.ratingsQuantity})</span>
            )}
          </div>
        </div>

        {/* Pricing & Add To Cart Button */}
        <div className="pt-1.5 sm:pt-2 border-t border-slate-50 flex items-center justify-between gap-1.5 sm:gap-2 mt-auto">
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-brand-navy truncate">
                ₹{product.discountPrice.toLocaleString('en-IN')}
              </span>
              {discountPercent > 0 && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-sm shrink-0 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-brand-royal hover:bg-brand-royal-hover text-white active:scale-95'
            }`}
            title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
