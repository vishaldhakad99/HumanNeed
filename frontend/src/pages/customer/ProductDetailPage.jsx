import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import { toggleWishlistAsync } from '../../redux/slices/wishlistSlice';
import { addToCompare } from '../../redux/slices/compareSlice';
import { addToast, openAuthModal } from '../../redux/slices/uiSlice';
import { ProductDetailSkeleton } from '../../components/common/Skeleton';
import { ProductCard } from '../../components/product/ProductCard';
import { Modal } from '../../components/common/Modal';
import {
  Heart,
  ShoppingCart,
  Zap,
  Star,
  ShieldCheck,
  RotateCcw,
  Truck,
  MapPin,
  Store,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Scale,
  Plus,
  Minus,
} from 'lucide-react';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const [productData, setProductData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Delivery Pincode checker state
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Write Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.data) {
          setProductData(res.data.product);
          setRelatedProducts(res.data.relatedProducts || []);
          setSelectedImageIndex(0);

          // Fetch reviews
          const reviewsRes = await api.get(`/reviews/product/${res.data.product._id}`);
          if (reviewsRes.data) setReviews(reviewsRes.data);

          // Save to recently viewed in localStorage
          try {
            const current = JSON.parse(localStorage.getItem('hn_recently_viewed') || '[]');
            const filtered = current.filter((p) => p._id !== res.data.product._id);
            const updated = [
              {
                _id: res.data.product._id,
                title: res.data.product.title,
                slug: res.data.product.slug,
                price: res.data.product.price,
                discountPrice: res.data.product.discountPrice,
                images: res.data.product.images,
                ratingsAverage: res.data.product.ratingsAverage,
                ratingsCount: res.data.product.ratingsCount,
                stockQuantity: res.data.product.stockQuantity,
                category: res.data.product.category,
              },
              ...filtered,
            ].slice(0, 10);
            localStorage.setItem('hn_recently_viewed', JSON.stringify(updated));
          } catch (e) {
            // LocalStorage fallback
          }
        }
      } catch (err) {
        setProductData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!productData) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-card">
        <AlertCircle className="w-12 h-12 text-brand-error mx-auto mb-4" />
        <h2 className="text-xl font-bold text-brand-dark mb-2">Product Not Found</h2>
        <p className="text-xs text-brand-muted mb-6">
          The requested product may have been discontinued or moved.
        </p>
        <Link to="/shop" className="btn-primary">
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlistItems.some((item) => (item._id || item) === productData._id);
  const isOutOfStock = productData.stockQuantity <= 0;
  const isLowStock = productData.stockQuantity > 0 && productData.stockQuantity <= 5;
  const discountPercent =
    productData.price > productData.discountPrice
      ? Math.round(((productData.price - productData.discountPrice) / productData.price) * 100)
      : 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }
    const res = await dispatch(addToCartAsync({ productId: productData._id, quantity }));
    if (!res.error) {
      dispatch(addToast({ message: `Added ${quantity} unit(s) to your cart!`, type: 'success' }));
    } else {
      dispatch(addToast({ message: res.payload || 'Failed to add item.', type: 'error' }));
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }
    const res = await dispatch(addToCartAsync({ productId: productData._id, quantity }));
    if (!res.error) {
      navigate('/checkout');
    }
  };

  const handlePincodeCheck = async (e) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6) {
      setPincodeResult({ valid: false, message: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }
    setPincodeLoading(true);
    try {
      const res = await api.get(`/users/pincode/${pincode.trim()}`);
      if (res.data) {
        setPincodeResult({ valid: true, data: res.data });
      }
    } catch (err) {
      setPincodeResult({ valid: false, message: err.message });
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await api.post(`/reviews/product/${productData._id}`, reviewForm);
      if (res.data) {
        dispatch(addToast({ message: 'Review submitted successfully!', type: 'success' }));
        setReviews([res.data, ...reviews]);
        setIsReviewModalOpen(false);
        setReviewForm({ rating: 5, title: '', comment: '' });
      }
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* 1. Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-brand-muted">
        <Link to="/" className="hover:text-brand-royal transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-brand-royal transition-colors">
          Shop
        </Link>
        {productData.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              to={`/shop?category=${productData.category.slug}`}
              className="hover:text-brand-royal transition-colors"
            >
              {productData.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-brand-dark truncate max-w-xs">{productData.title}</span>
      </nav>

      {/* 2. Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-hidden flex items-center justify-center p-4">
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 z-10 bg-brand-orange text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
            <img
              src={
                productData.images && productData.images.length > 0
                  ? productData.images[selectedImageIndex]
                  : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'
              }
              alt={productData.title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Thumbnails */}
          {productData.images && productData.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {productData.images.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    selectedImageIndex === i ? 'border-brand-royal shadow-sm' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Purchase Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            {productData.brand && (
              <span className="text-xs font-bold text-brand-royal uppercase tracking-wider">
                {productData.brand.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mt-1 leading-snug">
              {productData.title}
            </h1>

            {/* Ratings & Seller Pill */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded-lg font-bold">
                <Star className="w-3.5 h-3.5 text-brand-orange fill-current" />
                <span>
                  {productData.ratingsAverage > 0 ? productData.ratingsAverage.toFixed(1) : 'New'}
                </span>
                <span className="text-slate-400 font-normal">
                  ({productData.ratingsQuantity} ratings)
                </span>
              </div>

              {productData.seller && (
                <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Store className="w-3.5 h-3.5 text-brand-royal" />
                  <span>
                    Sold by: <strong>{productData.seller.storeName}</strong>
                  </span>
                  {productData.seller.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-success" title="Verified Merchant" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Details */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-brand-navy">
              ₹{productData.discountPrice.toLocaleString('en-IN')}
            </span>
            {discountPercent > 0 && (
              <>
                <span className="text-sm text-slate-400 line-through">
                  ₹{productData.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-brand-success">
                  You Save ₹{(productData.price - productData.discountPrice).toLocaleString('en-IN')} (
                  {discountPercent}%)
                </span>
              </>
            )}
            <span className="text-[11px] text-slate-400 ml-auto">Inclusive of all taxes</span>
          </div>

          {/* Stock Availability */}
          <div>
            {isOutOfStock ? (
              <div className="flex items-center gap-2 text-brand-error text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Currently Out of Stock</span>
              </div>
            ) : isLowStock ? (
              <div className="flex items-center gap-2 text-brand-orange text-xs font-bold animate-pulse">
                <AlertCircle className="w-4 h-4" />
                <span>Hurry! Only {productData.stockQuantity} items left in stock</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-brand-success text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>In Stock & Ready to Dispatch</span>
              </div>
            )}
          </div>

          {/* Quantity Selector & Purchase Buttons */}
          <div className="space-y-3 pt-2">
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-brand-dark">Quantity:</span>
                <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden shadow-subtle">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 py-1 text-xs font-extrabold text-brand-dark">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(Math.min(10, productData.stockQuantity), q + 1))}
                    className="p-2 text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="btn-primary flex-1 py-3 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="btn-accent flex-1 py-3 text-sm"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>

              <button
                onClick={() => dispatch(toggleWishlistAsync(productData._id))}
                className={`p-3 rounded-xl border transition-all ${
                  isWishlisted
                    ? 'border-brand-error bg-red-50 text-brand-error'
                    : 'border-slate-200 bg-white text-slate-500 hover:text-brand-error'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => {
                  dispatch(addToCompare(productData));
                  dispatch(addToast({ message: 'Added to comparison.', type: 'info' }));
                }}
                className="p-3 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-brand-royal transition-all"
                title="Compare"
              >
                <Scale className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Delivery & Pincode Checker */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
              <MapPin className="w-4 h-4 text-brand-royal" />
              <span>Check Delivery Availability</span>
            </div>

            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit PIN code"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-royal"
              />
              <button type="submit" disabled={pincodeLoading} className="btn-secondary text-xs px-4">
                {pincodeLoading ? 'Checking...' : 'Check'}
              </button>
            </form>

            {pincodeResult && (
              <div
                className={`text-xs p-2.5 rounded-xl ${
                  pincodeResult.valid
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-red-50 text-brand-error'
                }`}
              >
                {pincodeResult.valid ? (
                  <p>
                    ✓ Serviceable to PIN <strong>{pincode}</strong>: {pincodeResult.data.estimatedDelivery}
                  </p>
                ) : (
                  <p>{pincodeResult.message}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-brand-royal" />
                <span>Free delivery on orders over ₹500</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-brand-orange" />
                <span>7-Day Replacement Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Product Specifications & Description */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle p-6 md:p-8 space-y-6">
        <h3 className="text-xl font-extrabold text-brand-dark">Product Details & Specifications</h3>

        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
          <p>{productData.description}</p>
        </div>

        {productData.specifications && productData.specifications.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-brand-dark mb-4">Technical Specifications</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productData.specifications.map((spec, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-400 font-medium">{spec.key}</span>
                  <span className="font-semibold text-brand-dark">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Customer Reviews & Ratings Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-brand-dark">Customer Reviews</h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Verified feedback from verified buyers
            </p>
          </div>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="btn-primary text-xs py-2 px-4 shrink-0"
          >
            Write a Review
          </button>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-royal text-white flex items-center justify-center text-xs font-bold">
                      {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-brand-dark">{rev.user?.name || 'Customer'}</span>
                      {rev.isVerifiedPurchase && (
                        <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'text-brand-orange fill-current'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {rev.title && <h5 className="text-xs font-bold text-brand-dark">{rev.title}</h5>}
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm font-semibold text-brand-dark">No customer reviews yet</p>
            <p className="text-xs text-brand-muted mt-1 mb-4">
              Be the first to share your experience with this item.
            </p>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="btn-secondary text-xs"
            >
              Write First Review
            </button>
          </div>
        )}
      </div>

      {/* 5. Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-extrabold text-brand-dark">Similar Products You May Need</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Write a Customer Review"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Your Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  className="p-1 text-brand-orange"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= reviewForm.rating ? 'fill-current' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Headline</label>
            <input
              type="text"
              placeholder="What's the most important thing to know?"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Review Details</label>
            <textarea
              required
              rows={4}
              placeholder="What did you like or dislike about this product?"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="input-field resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={reviewSubmitting}
            className="btn-primary w-full py-2.5 text-xs font-bold"
          >
            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProductDetailPage;
