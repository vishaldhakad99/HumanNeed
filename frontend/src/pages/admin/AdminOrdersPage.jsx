import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import { Modal } from '../../components/common/Modal';
import { ShoppingBag, Search, Check, X, RotateCcw, Truck, FileText } from 'lucide-react';

export const AdminOrdersPage = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Return review modal
  const [returnModal, setReturnModal] = useState({ isOpen: false, order: null });
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      const res = await api.get(`/admin/orders${query}`);
      if (res.data) setOrders(res.data);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      dispatch(addToast({ message: `Order status set to ${newStatus}`, type: 'success' }));
      fetchOrders();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleProcessReturn = async (action) => {
    if (!returnModal.order) return;
    try {
      await api.post(`/admin/orders/${returnModal.order._id}/return-process`, {
        action,
        rejectionReason,
      });
      dispatch(
        addToast({
          message: `Return request ${action === 'approve' ? 'approved (refund processing)' : 'rejected'}.`,
          type: 'info',
        })
      );
      setReturnModal({ isOpen: false, order: null });
      setRejectionReason('');
      fetchOrders();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">All Marketplace Orders</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Monitor orders across all sellers, manage fulfillment stages, and process customer returns
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-brand-dark shadow-subtle"
          >
            <option value="">All Statuses</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="return_requested">Return Requested</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="text"
            placeholder="Search order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-brand-dark shadow-subtle focus:outline-none focus:border-brand-royal"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading marketplace orders...</div>
      ) : orders.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase">
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items / Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Order Lifecycle</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-extrabold text-brand-dark">{ord.orderNumber}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(ord.createdAt).toLocaleString()}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-brand-dark">{ord.customer?.name || 'Customer'}</p>
                    <p className="text-[11px] text-slate-400">
                      {ord.shippingAddress?.city}, {ord.shippingAddress?.state}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-extrabold text-brand-navy">₹{ord.pricing?.total}</p>
                    <p className="text-[11px] text-slate-400">{ord.items?.length} line item(s)</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ord.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {ord.paymentMethod} • {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={ord.orderStatus}
                      onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase"
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="payment_confirmed">Payment Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="return_requested">Return Requested</option>
                      <option value="refund_processing">Refund Processing</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    {ord.orderStatus === 'return_requested' && (
                      <button
                        onClick={() => setReturnModal({ isOpen: true, order: ord })}
                        className="px-3 py-1 bg-amber-50 text-brand-orange hover:bg-amber-100 font-bold rounded-lg text-xs"
                      >
                        Review Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">No orders found.</div>
      )}

      {/* Return Request Review Modal */}
      {returnModal.order && (
        <Modal
          isOpen={returnModal.isOpen}
          onClose={() => setReturnModal({ isOpen: false, order: null })}
          title={`Review Return: ${returnModal.order.orderNumber}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-400 uppercase">Customer Reason:</span>
              <p className="font-semibold text-brand-dark">
                "{returnModal.order.returnDetails?.reason || 'No specific reason given'}"
              </p>
              <p className="text-slate-400 text-[10px]">
                Requested on:{' '}
                {new Date(
                  returnModal.order.returnDetails?.requestedAt || Date.now()
                ).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Admin Note (Required if rejecting)
              </label>
              <textarea
                rows={2}
                placeholder="Optional explanation..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input-field resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleProcessReturn('approve')}
                className="btn-primary flex-1 py-2 text-xs font-bold"
              >
                Approve & Process Refund
              </button>
              <button
                onClick={() => handleProcessReturn('reject')}
                className="px-4 py-2 bg-red-50 text-brand-error hover:bg-red-100 font-bold rounded-xl text-xs"
              >
                Reject Return
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminOrdersPage;
