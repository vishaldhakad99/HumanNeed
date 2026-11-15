import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { CheckCircle2, Package, ArrowRight, Download, Truck, MapPin } from 'lucide-react';

export const OrderSuccessPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Trigger festive celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563EB', '#F59E0B', '#14213D', '#16A34A'],
    });

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.data) setOrder(res.data);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Success Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-card text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-brand-success flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-royal">
            Order Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mt-1">
            Thank You for Shopping with HumanNeed!
          </h1>
          <p className="text-xs text-brand-muted max-w-md mx-auto mt-1">
            Your order has been placed successfully and dispatched to our certified seller partners for
            packing.
          </p>
        </div>

        {order && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-md mx-auto flex items-center justify-between text-xs">
            <div className="text-left">
              <span className="text-slate-400">Order Number</span>
              <p className="font-extrabold text-brand-dark">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Total Paid</span>
              <p className="font-extrabold text-brand-navy">
                ₹{order.pricing.total.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to={`/dashboard?tab=orders`} className="btn-primary text-xs py-2.5 px-5">
            <Package className="w-4 h-4" />
            <span>Track Order</span>
          </Link>
          <Link to="/shop" className="btn-secondary text-xs py-2.5 px-5">
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Delivery Summary */}
      {order && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-brand-dark pb-2 border-b border-slate-100">
            Delivery & Payment Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Shipping Address</span>
              <p className="font-semibold text-brand-dark">{order.shippingAddress.fullName}</p>
              <p className="text-slate-600">
                {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
              <p className="text-slate-500">Contact: {order.shippingAddress.phone}</p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Payment Method</span>
              <p className="font-semibold text-brand-dark uppercase">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online via Razorpay'}
              </p>
              <p className="text-slate-600">
                Payment Status: <strong className="text-brand-success uppercase">{order.paymentStatus}</strong>
              </p>
              <p className="text-slate-400">
                Estimated Delivery: <strong>3-5 Business Days</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccessPage;
