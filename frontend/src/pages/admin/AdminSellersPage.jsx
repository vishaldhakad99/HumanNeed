import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Store, ShieldCheck, Check, X, Clock, AlertCircle } from 'lucide-react';

export const AdminSellersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const statusFilter = searchParams.get('status') || '';

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState({ isOpen: false, sellerId: null });
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/sellers?status=${statusFilter}` : '/admin/sellers';
      const res = await api.get(url);
      if (res.data) setSellers(res.data);
    } catch (e) {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/sellers/${id}/status`, { status: 'approved' });
      dispatch(addToast({ message: 'Seller application approved!', type: 'success' }));
      fetchSellers();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleReject = async () => {
    if (!rejectModal.sellerId) return;
    try {
      await api.put(`/admin/sellers/${rejectModal.sellerId}/status`, {
        status: 'rejected',
        rejectionReason,
      });
      dispatch(addToast({ message: 'Seller application rejected.', type: 'info' }));
      setRejectModal({ isOpen: false, sellerId: null });
      setRejectionReason('');
      fetchSellers();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">Merchant Sellers Management</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Verify business credentials and approve marketplace merchant stores
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {['', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setSearchParams(s ? { status: s } : {})}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                statusFilter === s
                  ? 'bg-white text-brand-navy shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {s || 'All Sellers'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading seller applications...</div>
      ) : sellers.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase">
                <th className="p-4">Store Name</th>
                <th className="p-4">Owner / Contact</th>
                <th className="p-4">Tax IDs</th>
                <th className="p-4">Status</th>
                <th className="p-4">Applied Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellers.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-brand-dark">{s.storeName}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">
                      {s.storeDescription || 'No description provided'}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-brand-dark">{s.user?.name || 'User'}</p>
                    <p className="text-[11px] text-slate-400">{s.businessEmail}</p>
                    <p className="text-[11px] text-slate-400">{s.businessPhone}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-mono text-[11px]">GSTIN: {s.gstin || 'N/A'}</p>
                    <p className="font-mono text-[11px]">PAN: {s.pan || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800'
                          : s.status === 'pending'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-red-50 text-brand-error'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {s.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(s._id)}
                          className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold rounded-lg flex items-center gap-1 transition-colors"
                          title="Approve Seller"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {s.status !== 'rejected' && (
                        <button
                          onClick={() => setRejectModal({ isOpen: true, sellerId: s._id })}
                          className="px-3 py-1 bg-red-50 text-brand-error hover:bg-red-100 font-bold rounded-lg flex items-center gap-1 transition-colors"
                          title="Reject Seller"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          type="seller"
          title="No Sellers in this Category"
          description="There are currently no seller registrations matching your selected status filter."
        />
      )}

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, sellerId: null })}
        title="Reject Seller Application"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide a clear reason for rejecting this seller application. This note will be
            available to the merchant for re-application.
          </p>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Rejection Reason *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Invalid GSTIN or business address documentation..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-field resize-none"
            />
          </div>

          <button
            onClick={handleReject}
            disabled={!rejectionReason.trim()}
            className="btn-primary w-full py-2.5 text-xs font-bold disabled:opacity-50"
          >
            Confirm Rejection
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSellersPage;
