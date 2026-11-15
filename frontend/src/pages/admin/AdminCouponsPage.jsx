import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import { Modal } from '../../components/common/Modal';
import { Tag, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';

export const AdminCouponsPage = () => {
  const dispatch = useDispatch();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchase: 0,
    maxDiscount: '',
    validUntil: '',
    usageLimit: 1000,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      if (res.data) setCoupons(res.data);
    } catch (e) {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        ...couponForm,
        discountValue: Number(couponForm.discountValue),
        minPurchase: Number(couponForm.minPurchase || 0),
        maxDiscount: couponForm.maxDiscount ? Number(couponForm.maxDiscount) : null,
        usageLimit: Number(couponForm.usageLimit || 1000),
      });
      dispatch(addToast({ message: 'Coupon created successfully!', type: 'success' }));
      setIsModalOpen(false);
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchase: 0,
        maxDiscount: '',
        validUntil: '',
        usageLimit: 1000,
      });
      fetchCoupons();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      dispatch(addToast({ message: 'Coupon removed.', type: 'info' }));
      fetchCoupons();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">Promotional Discount Coupons</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Create and track promotional codes and checkout discounts
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs py-2.5 px-4">
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading coupons...</div>
      ) : coupons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const isExpired = new Date(c.validUntil) < new Date();
            return (
              <div
                key={c._id}
                className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-extrabold text-brand-royal bg-brand-royal-light px-2.5 py-1 rounded-lg">
                    {c.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isExpired ? 'bg-red-50 text-brand-error' : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-brand-navy text-base">
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}% OFF`
                      : `₹${c.discountValue} FLAT OFF`}
                  </p>
                  <p className="text-slate-500">
                    Min order: <strong>₹{c.minPurchase}</strong>
                    {c.maxDiscount && ` • Max discount: ₹${c.maxDiscount}`}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Expires: {new Date(c.validUntil).toLocaleDateString()}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Used: {c.usedCount} times</span>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="p-1 text-slate-400 hover:text-brand-error"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">
          No coupons created yet. Click 'Create Coupon' above.
        </div>
      )}

      {/* Create Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Coupon"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. FESTIVE20"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="input-field uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Discount Type *</label>
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                className="input-field"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Discount Value *</label>
              <input
                type="number"
                required
                min="1"
                placeholder={couponForm.discountType === 'percentage' ? 'e.g. 15' : 'e.g. 200'}
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Min Order (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={couponForm.minPurchase}
                onChange={(e) => setCouponForm({ ...couponForm, minPurchase: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Max Cap (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="Optional"
                value={couponForm.maxDiscount}
                onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Expiration Date *</label>
            <input
              type="date"
              required
              value={couponForm.validUntil}
              onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
              className="input-field"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
            Create and Activate Coupon
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCouponsPage;
