import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCart,
  updateQuantityAsync,
  removeFromCartAsync,
  toggleSaveForLaterAsync,
  applyCouponAsync,
  removeCouponAsync,
} from '../../redux/slices/cartSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Trash2,
  Bookmark,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Truck,
  RotateCcw,
} from 'lucide-react';

export const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items, savedForLaterItems, pricing, appliedCoupon, loading } = useSelector(
    (state) => state.cart
  );
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1 || newQty > 10) return;
    await dispatch(updateQuantityAsync({ itemId, quantity: newQty }));
  };

  const handleRemoveItem = async (itemId) => {
    const res = await dispatch(removeFromCartAsync(itemId));
    if (!res.error) {
      dispatch(addToast({ message: 'Item removed from your cart.', type: 'info' }));
    }
  };

  const handleToggleSave = async (itemId) => {
    await dispatch(toggleSaveForLaterAsync(itemId));
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    const res = await dispatch(applyCouponAsync(couponCode.trim().toUpperCase()));
    setCouponLoading(false);

    if (!res.error) {
      dispatch(addToast({ message: `Coupon "${couponCode.toUpperCase()}" applied!`, type: 'success' }));
      setCouponCode('');
    } else {
      dispatch(addToast({ message: res.payload || 'Invalid coupon code.', type: 'error' }));
    }
  };

  const handleRemoveCoupon = async () => {
    await dispatch(removeCouponAsync());
    dispatch(addToast({ message: 'Coupon removed.', type: 'info' }));
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          type="cart"
          title="Sign In to View Your Shopping Cart"
          description="Log in with your HumanNeed account to view saved items, synchronize devices, and enjoy fast checkout."
          actionText="Sign In Now"
          onAction={() => dispatch(openAuthModal('login'))}
        />
      </div>
    );
  }

  if (items.length === 0 && savedForLaterItems.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          type="cart"
          title="Your Shopping Cart is Empty"
          description="Looks like you haven't added anything to your cart yet. Explore our genuine essentials and top offers."
          actionText="Start Shopping"
          actionLink="/shop"
        />
      </div>
    );
  }

  // Free delivery calculation (Free over ₹500)
  const remainingForFreeDelivery = Math.max(0, 500 - (pricing.subtotal - pricing.discount));
  const progressPercent = Math.min(100, Math.round(((pricing.subtotal - pricing.discount) / 500) * 100));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark">Shopping Cart</h1>
        <p className="text-[11px] sm:text-xs text-brand-muted mt-0.5">
          {items.length} active item(s) in your basket
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-6">
          {/* Free Shipping Progress Indicator */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-subtle space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-brand-dark">
                <Truck className="w-4 h-4 text-brand-royal" />
                {remainingForFreeDelivery === 0 ? (
                  <span className="text-brand-success font-extrabold">
                    Congratulations! You unlocked FREE Delivery.
                  </span>
                ) : (
                  <span>
                    Add <strong>₹{remainingForFreeDelivery}</strong> more to unlock FREE Delivery!
                  </span>
                )}
              </span>
              <span className="text-slate-400">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-royal transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Active Items List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle divide-y divide-slate-100 overflow-hidden">
            {items.map((item) => (
              <div
                key={item._id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Link
                    to={`/product/${item.product.slug}`}
                    className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100"
                  >
                    <img
                      src={
                        item.product.images?.[0] ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'
                      }
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="space-y-1">
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="text-sm font-bold text-brand-dark hover:text-brand-royal line-clamp-1 transition-colors"
                    >
                      {item.product.title}
                    </Link>
                    {item.product.seller && (
                      <p className="text-[11px] text-slate-400">
                        Seller: {item.product.seller.storeName}
                      </p>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-brand-navy">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-slate-400">
                          (₹{item.price} each)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => handleUpdateQty(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-brand-dark">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(item._id, item.quantity + 1)}
                      disabled={item.quantity >= Math.min(10, item.product.stockQuantity)}
                      className="p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSave(item._id)}
                      className="p-2 text-slate-400 hover:text-brand-royal rounded-lg hover:bg-slate-50"
                      title="Save for Later"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="p-2 text-slate-400 hover:text-brand-error rounded-lg hover:bg-red-50"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Saved For Later Section */}
          {savedForLaterItems.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Saved for Later ({savedForLaterItems.length})
              </h3>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle divide-y divide-slate-100">
                {savedForLaterItems.map((item) => (
                  <div key={item._id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-50"
                      />
                      <div>
                        <p className="text-xs font-bold text-brand-dark">{item.product.title}</p>
                        <p className="text-xs font-extrabold text-brand-navy">₹{item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSave(item._id)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Move to Cart
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="p-2 text-slate-400 hover:text-brand-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="lg:col-span-4 space-y-4">
          {/* Coupon Code Input Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
              <Tag className="w-4 h-4 text-brand-orange" />
              <span>Have a Discount Coupon?</span>
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    Code <strong>{appliedCoupon.code}</strong> Applied
                  </p>
                  <p className="text-[10px] text-emerald-600">
                    Saved ₹{appliedCoupon.discountAmount}
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs text-brand-error font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-royal uppercase"
                />
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="btn-secondary text-xs px-4"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </form>
            )}
          </div>

          {/* Pricing Breakdown Summary */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-dark pb-3 border-b border-slate-100">
              Price Details
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-semibold text-brand-dark">
                  ₹{pricing.subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {pricing.discount > 0 && (
                <div className="flex justify-between text-brand-success font-medium">
                  <span>Coupon Discount</span>
                  <span>- ₹{pricing.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                {pricing.shippingFee === 0 ? (
                  <span className="text-brand-success font-bold">FREE</span>
                ) : (
                  <span className="font-semibold text-brand-dark">
                    ₹{pricing.shippingFee}
                  </span>
                )}
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Estimated Taxes (Included)</span>
                <span>₹{pricing.tax}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-sm font-extrabold text-brand-dark">Total Amount</span>
              <span className="text-2xl font-extrabold text-brand-navy">
                ₹{pricing.total.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              disabled={items.length === 0}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-md"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-brand-success" />
              <span>Safe & 100% Encrypted Transactions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
