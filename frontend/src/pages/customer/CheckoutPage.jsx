import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../services/api';
import { clearCartLocal } from '../../redux/slices/cartSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { Modal } from '../../components/common/Modal';
import {
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items, pricing, appliedCoupon } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'razorpay'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Address Modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    alternatePhone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'home',
  });

  // Payment gateway config
  const [gatewayConfig, setGatewayConfig] = useState(null);

  // Fetch addresses and payment gateway config
  useEffect(() => {
    const initCheckout = async () => {
      try {
        const [addrRes, payRes] = await Promise.all([
          api.get('/users/addresses'),
          api.get('/payments/config'),
        ]);

        if (addrRes.data && addrRes.data.length > 0) {
          setAddresses(addrRes.data);
          const defaultAddr = addrRes.data.find((a) => a.isDefault) || addrRes.data[0];
          setSelectedAddressId(defaultAddr._id);
        } else {
          setIsAddressModalOpen(true);
        }

        if (payRes.data) {
          setGatewayConfig(payRes.data);
        }
      } catch (err) {
        // Handle error
      }
    };
    initCheckout();
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-card">
        <h2 className="text-xl font-bold text-brand-dark mb-2">No Items to Checkout</h2>
        <p className="text-xs text-brand-muted mb-6">
          Your cart is currently empty. Please add items before checking out.
        </p>
        <Link to="/shop" className="btn-primary">
          Back to Shop
        </Link>
      </div>
    );
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/addresses', addressForm);
      if (res.data) {
        setAddresses([res.data, ...addresses]);
        setSelectedAddressId(res.data._id);
        setIsAddressModalOpen(false);
        dispatch(addToast({ message: 'Delivery address saved!', type: 'success' }));
      }
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handlePlaceOrder = async () => {
    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
    if (!selectedAddress) {
      dispatch(addToast({ message: 'Please select or add a delivery address.', type: 'error' }));
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          alternatePhone: selectedAddress.alternatePhone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          landmark: selectedAddress.landmark,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
      };

      if (paymentMethod === 'cod') {
        const res = await api.post('/orders', orderPayload);
        if (res.data) {
          dispatch(clearCartLocal());
          navigate(`/order-success/${res.data.order._id}`);
        }
      } else if (paymentMethod === 'razorpay') {
        // Razorpay Online Flow
        if (!gatewayConfig?.isConfigured || !window.Razorpay) {
          dispatch(
            addToast({
              message:
                'Razorpay is not yet configured with active API keys in backend/.env. Please select Cash on Delivery or configure RAZORPAY_KEY_ID to proceed with online payments.',
              type: 'error',
            })
          );
          setIsSubmitting(false);
          return;
        }

        const res = await api.post('/orders', orderPayload);
        const { order, razorpayOrder, razorpayKeyId } = res.data;

        const options = {
          key: razorpayKeyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'HumanNeed Marketplace',
          description: `Order #${order.orderNumber}`,
          order_id: razorpayOrder.id,
          handler: async (response) => {
            try {
              // Verify cryptographic signature on backend
              const verifyRes = await api.post('/payments/verify', {
                orderId: order._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyRes.data) {
                dispatch(clearCartLocal());
                navigate(`/order-success/${order._id}`);
              }
            } catch (vErr) {
              dispatch(addToast({ message: 'Payment signature verification failed.', type: 'error' }));
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: selectedAddress.phone,
          },
          theme: {
            color: '#2563EB',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          dispatch(addToast({ message: `Payment failed: ${resp.error.description}`, type: 'error' }));
        });
        rzp.open();
      }
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark">Secure Checkout</h1>
        <p className="text-[11px] sm:text-xs text-brand-muted mt-0.5">Complete your order with verified security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Address & Payment Selection */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-royal text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-base font-extrabold text-brand-dark">Delivery Address</h3>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs font-bold text-brand-royal hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => setSelectedAddressId(addr._id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr._id
                        ? 'border-brand-royal bg-brand-royal-light/40 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-brand-dark">{addr.fullName}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold">
                        {addr.addressType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                      {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Phone: {addr.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs text-brand-muted mb-3">No delivery address saved yet.</p>
                <button onClick={() => setIsAddressModalOpen(true)} className="btn-primary text-xs">
                  Add Delivery Address
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-royal text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-base font-extrabold text-brand-dark">Select Payment Method</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Cash On Delivery Option */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-brand-royal bg-brand-royal-light/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-brand-orange">
                    <Banknote className="w-5 h-5" />
                  </div>
                  {paymentMethod === 'cod' && (
                    <CheckCircle2 className="w-5 h-5 text-brand-royal" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-brand-dark">Cash on Delivery (COD)</h4>
                <p className="text-xs text-brand-muted mt-1">
                  Pay via Cash or UPI upon physical doorstep package delivery.
                </p>
              </div>

              {/* Razorpay Online Option */}
              <div
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-brand-royal bg-brand-royal-light/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-brand-royal">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  {paymentMethod === 'razorpay' && (
                    <CheckCircle2 className="w-5 h-5 text-brand-royal" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-brand-dark">Online Payment (Razorpay)</h4>
                <p className="text-xs text-brand-muted mt-1">
                  Pay instantly via UPI (GPay, PhonePe, Paytm), Cards, or Net Banking.
                </p>
              </div>
            </div>

            {/* Note on Razorpay Test Mode if keys not provided */}
            {paymentMethod === 'razorpay' && !gatewayConfig?.isConfigured && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <span>
                  <strong>Razorpay Test Notice:</strong> Active Razorpay API keys are not detected in
                  environment. To test online payments, configure <code>RAZORPAY_KEY_ID</code> and{' '}
                  <code>RAZORPAY_KEY_SECRET</code> in <code>backend/.env</code>, or select{' '}
                  <strong>Cash on Delivery</strong> for immediate order placement.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-dark pb-3 border-b border-slate-100">
              Order Summary
            </h3>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it._id} className="flex items-center justify-between text-xs gap-3">
                  <span className="truncate text-slate-600 flex-1">
                    {it.quantity}x {it.product.title}
                  </span>
                  <span className="font-semibold text-brand-dark shrink-0">
                    ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-dark">
                  ₹{pricing.subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {pricing.discount > 0 && (
                <div className="flex justify-between text-brand-success font-medium">
                  <span>Discount</span>
                  <span>- ₹{pricing.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery</span>
                {pricing.shippingFee === 0 ? (
                  <span className="text-brand-success font-bold">FREE</span>
                ) : (
                  <span>₹{pricing.shippingFee}</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-sm font-extrabold text-brand-dark">Total to Pay</span>
              <span className="text-2xl font-extrabold text-brand-navy">
                ₹{pricing.total.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !selectedAddressId}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-md"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Place Order • ₹{pricing.total.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add New Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add Delivery Address"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Full Name</label>
              <input
                type="text"
                required
                value={addressForm.fullName}
                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Mobile Number</label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit number"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Flat, House no., Building, Street
            </label>
            <input
              type="text"
              required
              value={addressForm.addressLine1}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">PIN Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6 digits"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">City</label>
              <input
                type="text"
                required
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">State</label>
              <input
                type="text"
                required
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Address Type</label>
            <div className="flex gap-4 text-xs font-medium">
              {['home', 'work', 'other'].map((type) => (
                <label key={type} className="flex items-center gap-1.5 cursor-pointer capitalize">
                  <input
                    type="radio"
                    name="addressType"
                    checked={addressForm.addressType === type}
                    onChange={() => setAddressForm({ ...addressForm, addressType: type })}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
            Save and Deliver Here
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
