import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { addToast } from '../../redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Package, Truck, CheckCircle2, ChevronRight, MapPin, Clock } from 'lucide-react';

export const SellerOrdersPage = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update Status Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: 'packed',
    courierName: '',
    trackingNumber: '',
    comment: '',
  });
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/seller/orders');
      if (res.data) setOrders(res.data);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);

    try {
      await api.put(`/seller/orders/${selectedOrder._id}/status`, statusForm);
      dispatch(addToast({ message: `Order updated to ${statusForm.status}!`, type: 'success' }));
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-dark">Store Fulfillment & Orders</h1>
        <p className="text-xs text-brand-muted mt-0.5">
          Fulfill customer orders containing products sold by your store
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading store orders...</div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord._id}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400">Order:</span>{' '}
                  <strong className="text-brand-dark">{ord.orderNumber}</strong>
                  <span className="text-slate-400 ml-3">
                    Placed: {new Date(ord.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-brand-royal">
                    {ord.orderStatus.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                    {ord.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items belonging to this seller */}
              <div className="space-y-3">
                {ord.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={it.title}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100"
                      />
                      <div>
                        <p className="font-bold text-brand-dark line-clamp-1">{it.title}</p>
                        <p className="text-slate-400">
                          Qty: {it.quantity} • Unit Price: ₹{it.price}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-brand-navy">
                      ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Customer Shipping Address & Status Updater */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5 max-w-md">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Deliver To:
                  </span>
                  <p className="font-semibold text-brand-dark">
                    {ord.shippingAddress.fullName} • {ord.shippingAddress.phone}
                  </p>
                  <p className="text-slate-500 truncate">
                    {ord.shippingAddress.addressLine1}, {ord.shippingAddress.city},{' '}
                    {ord.shippingAddress.state} - {ord.shippingAddress.pincode}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase">Your Store Total:</span>
                    <p className="text-base font-extrabold text-brand-navy">
                      ₹{ord.sellerSubtotal?.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOrder(ord);
                      setStatusForm({
                        status: ord.orderStatus === 'processing' ? 'packed' : 'shipped',
                        courierName: '',
                        trackingNumber: '',
                        comment: '',
                      });
                    }}
                    className="btn-primary text-xs py-2 px-4 shrink-0"
                  >
                    Update Fulfillment Status
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          type="cart"
          title="No Orders Received Yet"
          description="Customer orders containing your listed products will appear here in real time for fulfillment."
          actionText="View Store Products"
          actionLink="/seller/products"
        />
      )}

      {/* Update Fulfillment Status Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Update Fulfillment: ${selectedOrder.orderNumber}`}
        >
          <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Fulfillment Stage *
              </label>
              <select
                required
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                className="input-field"
              >
                <option value="packed">Packed (Ready for pickup)</option>
                <option value="shipped">Shipped (Dispatched with courier)</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered (Handed to customer)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1">Courier Partner</label>
                <input
                  type="text"
                  placeholder="e.g. Blue Dart, Delhivery"
                  value={statusForm.courierName}
                  onChange={(e) => setStatusForm({ ...statusForm, courierName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1">Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. BLU9876543210"
                  value={statusForm.trackingNumber}
                  onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Status Note / Comment</label>
              <textarea
                rows={2}
                placeholder="Optional notes for customer tracking timeline..."
                value={statusForm.comment}
                onChange={(e) => setStatusForm({ ...statusForm, comment: e.target.value })}
                className="input-field resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              {updating ? 'Updating...' : 'Save and Notify Customer'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SellerOrdersPage;
