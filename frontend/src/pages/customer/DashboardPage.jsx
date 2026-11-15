import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../services/api';
import { updateUserSync } from '../../redux/slices/authSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { fetchWishlist, toggleWishlistAsync } from '../../redux/slices/wishlistSlice';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import {
  User,
  Package,
  MapPin,
  Heart,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const activeTab = searchParams.get('tab') || 'orders';

  // Stats summary
  const [stats, setStats] = useState({ totalOrders: 0, wishlistCount: 0, totalReviews: 0 });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState([]);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  // Cancel / Return Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionModal, setActionModal] = useState({ type: null, isOpen: false }); // 'cancel' | 'return'
  const [actionReason, setActionReason] = useState('');

  // Invoice view modal
  const [invoiceData, setInvoiceData] = useState(null);

  // Load summary and tab data
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/users/dashboard-summary');
        if (res.data) setStats(res.data);
      } catch (e) {}
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const res = await api.get('/orders/my-orders');
          if (res.data) setOrders(res.data);
        } catch (e) {}
        finally { setOrdersLoading(false); }
      };
      fetchOrders();
    } else if (activeTab === 'addresses') {
      const fetchAddresses = async () => {
        try {
          const res = await api.get('/users/addresses');
          if (res.data) setAddresses(res.data);
        } catch (e) {}
      };
      fetchAddresses();
    } else if (activeTab === 'wishlist') {
      dispatch(fetchWishlist());
    }
  }, [activeTab, dispatch]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', profileForm);
      if (res.data) {
        dispatch(updateUserSync(res.data.user));
        dispatch(addToast({ message: 'Profile updated successfully!', type: 'success' }));
      }
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/change-password', passwordForm);
      dispatch(addToast({ message: 'Password updated successfully!', type: 'success' }));
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      await api.post(`/orders/${selectedOrder._id}/cancel`, { reason: actionReason });
      dispatch(addToast({ message: 'Order has been cancelled.', type: 'info' }));
      setActionModal({ type: null, isOpen: false });
      setActionReason('');
      // Refresh orders
      const res = await api.get('/orders/my-orders');
      if (res.data) setOrders(res.data);
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleReturnOrder = async () => {
    if (!selectedOrder) return;
    try {
      await api.post(`/orders/${selectedOrder._id}/return`, { reason: actionReason });
      dispatch(addToast({ message: 'Return request submitted.', type: 'success' }));
      setActionModal({ type: null, isOpen: false });
      setActionReason('');
      const res = await api.get('/orders/my-orders');
      if (res.data) setOrders(res.data);
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleViewInvoice = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice`);
      if (res.data) setInvoiceData(res.data);
    } catch (err) {
      dispatch(addToast({ message: 'Failed to fetch invoice.', type: 'error' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Header & Metrics Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-brand-navy text-white flex items-center justify-center text-lg sm:text-xl font-bold shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark truncate">{user?.name}</h1>
            <p className="text-xs text-brand-muted truncate">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-brand-royal-light text-brand-royal rounded text-[10px] font-bold uppercase">
              {user?.role} Account
            </span>
          </div>
        </div>

        <div className="flex items-center justify-around w-full md:w-auto divide-x divide-slate-100 text-center border-t md:border-t-0 pt-3 md:pt-0">
          <div className="px-2 sm:px-3">
            <p className="text-base sm:text-lg font-extrabold text-brand-navy">{stats.totalOrders}</p>
            <p className="text-[10px] sm:text-xs text-slate-400">Total Orders</p>
          </div>
          <div className="px-3 sm:px-4">
            <p className="text-base sm:text-lg font-extrabold text-brand-orange">{wishlistItems.length}</p>
            <p className="text-[10px] sm:text-xs text-slate-400">Saved Wishlist</p>
          </div>
          <div className="px-3 sm:px-4">
            <p className="text-base sm:text-lg font-extrabold text-brand-royal">{stats.totalReviews}</p>
            <p className="text-[10px] sm:text-xs text-slate-400">Reviews Written</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Tab Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-1.5 sm:p-3 shadow-subtle flex lg:flex-col overflow-x-auto gap-1 no-scrollbar shrink-0">
          <button
            onClick={() => setSearchParams({ tab: 'orders' })}
            className={`flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full ${
              activeTab === 'orders'
                ? 'bg-brand-royal text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'addresses' })}
            className={`flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full ${
              activeTab === 'addresses'
                ? 'bg-brand-royal text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Addresses</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'wishlist' })}
            className={`flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full ${
              activeTab === 'wishlist'
                ? 'bg-brand-royal text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Wishlist ({wishlistItems.length})</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'profile' })}
            className={`flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full ${
              activeTab === 'profile'
                ? 'bg-brand-royal text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-brand-dark">Order History</h3>

              {ordersLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading your orders...</div>
              ) : orders.length > 0 ? (
                orders.map((ord) => (
                  <div
                    key={ord._id}
                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400">Order ID:</span>{' '}
                        <strong className="text-brand-dark">{ord.orderNumber}</strong>
                        <span className="text-slate-400 ml-3">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-brand-royal">
                          {ord.orderStatus.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                          {ord.paymentMethod} • {ord.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Items Thumbnails & Titles */}
                    <div className="space-y-3">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                              alt={it.title}
                              className="w-12 h-12 rounded-xl object-cover bg-slate-50"
                            />
                            <div>
                              <p className="text-xs font-bold text-brand-dark line-clamp-1">{it.title}</p>
                              <p className="text-[11px] text-slate-400">Qty: {it.quantity}</p>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-brand-navy">
                            ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Order Total:</span>{' '}
                        <strong className="text-sm font-extrabold text-brand-navy">
                          ₹{ord.pricing.total.toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(ord._id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>

                        {/* Cancellation Button (Only if pending or processing) */}
                        {['pending_payment', 'payment_confirmed', 'processing'].includes(
                          ord.orderStatus
                        ) && (
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setActionModal({ type: 'cancel', isOpen: true });
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-brand-error bg-red-50 hover:bg-red-100 rounded-xl"
                          >
                            Cancel Order
                          </button>
                        )}

                        {/* Return Request Button (Delivered orders) */}
                        {ord.orderStatus === 'delivered' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setActionModal({ type: 'return', isOpen: true });
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-brand-orange bg-amber-50 hover:bg-amber-100 rounded-xl"
                          >
                            Request Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  type="cart"
                  title="No Orders Placed Yet"
                  description="When you place orders, you can track their live shipment journey and download VAT/GST invoices here."
                  actionText="Shop Now"
                  actionLink="/shop"
                />
              )}
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-brand-dark">Saved Delivery Addresses</h3>

              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-dark">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold">
                            Default Address
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-slate-500">Phone: {addr.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  type="search"
                  title="No Saved Addresses"
                  description="You can add and manage your shipping destinations during checkout."
                  actionText="Go to Shop"
                  actionLink="/shop"
                />
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-brand-dark">Your Saved Items</h3>

              {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.map((prod) => (
                    <div
                      key={prod._id}
                      className="bg-white rounded-3xl border border-slate-100 p-4 shadow-subtle flex flex-col justify-between"
                    >
                      <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-3">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                          alt={prod.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-brand-dark line-clamp-1">{prod.title}</h4>
                      <p className="text-sm font-extrabold text-brand-navy my-2">
                        ₹{prod.discountPrice}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            dispatch(addToCartAsync({ productId: prod._id, quantity: 1 }));
                            dispatch(addToast({ message: 'Added to cart!', type: 'success' }));
                          }}
                          className="btn-primary text-xs py-2 flex-1"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => dispatch(toggleWishlistAsync(prod._id))}
                          className="p-2 text-slate-400 hover:text-brand-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  type="wishlist"
                  title="Your Wishlist is Empty"
                  description="Save items you're interested in by tapping the heart icon on any product."
                  actionText="Browse Products"
                  actionLink="/shop"
                />
              )}
            </div>
          )}

          {/* TAB 4: PROFILE & SECURITY */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Details */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle space-y-4">
                <h3 className="text-sm font-extrabold text-brand-dark">Personal Information</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <button type="submit" className="btn-primary text-xs py-2.5">
                    Save Changes
                  </button>
                </form>
              </div>

              {/* Password Change */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle space-y-4">
                <h3 className="text-sm font-extrabold text-brand-dark">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 8 chars, 1 uppercase & 1 number"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                  <button type="submit" className="btn-secondary text-xs py-2.5">
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel / Return Modal Dialog */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ type: null, isOpen: false })}
        title={actionModal.type === 'cancel' ? 'Cancel Order' : 'Request Product Return'}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            {actionModal.type === 'cancel'
              ? 'Are you sure you want to cancel this order? Any reserved inventory will be released.'
              : 'Our return policy covers defects or unsatisfied items within 7 days of delivery.'}
          </p>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Reason for {actionModal.type === 'cancel' ? 'Cancellation' : 'Return'}
            </label>
            <textarea
              required
              rows={3}
              placeholder="Please provide details..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="input-field resize-none"
            />
          </div>

          <button
            onClick={actionModal.type === 'cancel' ? handleCancelOrder : handleReturnOrder}
            disabled={!actionReason.trim()}
            className="btn-primary w-full py-2.5 text-xs font-bold disabled:opacity-50"
          >
            Confirm {actionModal.type === 'cancel' ? 'Cancellation' : 'Return Request'}
          </button>
        </div>
      </Modal>

      {/* Structured Invoice Viewer Modal */}
      {invoiceData && (
        <Modal
          isOpen={Boolean(invoiceData)}
          onClose={() => setInvoiceData(null)}
          title="Order Invoice"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-xs text-slate-700">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-base font-extrabold text-brand-navy">HumanNeed Marketplace</h4>
                <p className="text-slate-400">Official Tax Invoice</p>
                <p className="mt-1 font-bold">Invoice: {invoiceData.invoiceNumber}</p>
                <p>Date: {new Date(invoiceData.invoiceDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">Billed To:</p>
                <p>{invoiceData.customer.name}</p>
                <p>{invoiceData.customer.address?.city}, {invoiceData.customer.address?.state}</p>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left font-bold">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-2.5">
                      <p className="font-semibold text-brand-dark">{item.title}</p>
                      <p className="text-[10px] text-slate-400">Sold by: {item.seller}</p>
                    </td>
                    <td className="py-2.5 text-center">{item.quantity}</td>
                    <td className="py-2.5 text-right">₹{item.unitPrice}</td>
                    <td className="py-2.5 text-right font-bold">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{invoiceData.pricing.subtotal}</span>
                </div>
                {invoiceData.pricing.discount > 0 && (
                  <div className="flex justify-between text-brand-success font-semibold">
                    <span>Discount:</span>
                    <span>- ₹{invoiceData.pricing.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{invoiceData.pricing.shippingFee === 0 ? 'FREE' : `₹${invoiceData.pricing.shippingFee}`}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-extrabold text-brand-navy">
                  <span>Total:</span>
                  <span>₹{invoiceData.pricing.total}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs py-2 px-4"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DashboardPage;
