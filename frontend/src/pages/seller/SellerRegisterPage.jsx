import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../services/api';
import { addToast, openAuthModal } from '../../redux/slices/uiSlice';
import { Store, ShieldCheck, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export const SellerRegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [existingSeller, setExistingSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    businessEmail: user?.email || '',
    businessPhone: user?.phone || '',
    gstin: '',
    pan: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    bankDetails: {
      accountHolderName: user?.name || '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      const checkSellerStatus = async () => {
        try {
          const res = await api.get('/seller/profile');
          if (res.data) setExistingSeller(res.data);
        } catch (e) {}
        finally { setLoading(false); }
      };
      checkSellerStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/seller/apply', formData);
      if (res.data) {
        setExistingSeller(res.data);
        dispatch(
          addToast({
            message: 'Application submitted! HumanNeed administrators will review your store.',
            type: 'success',
          })
        );
      }
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  if (existingSeller) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-card text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-royal flex items-center justify-center mx-auto">
            {existingSeller.status === 'approved' ? (
              <CheckCircle2 className="w-8 h-8 text-brand-success" />
            ) : existingSeller.status === 'pending' ? (
              <Clock className="w-8 h-8 text-brand-orange" />
            ) : (
              <AlertCircle className="w-8 h-8 text-brand-error" />
            )}
          </div>

          <h2 className="text-2xl font-extrabold text-brand-dark">
            Store: {existingSeller.storeName}
          </h2>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
            Application Status: <strong className="text-brand-royal">{existingSeller.status}</strong>
          </div>

          <p className="text-xs text-brand-muted max-w-md mx-auto leading-relaxed">
            {existingSeller.status === 'approved'
              ? 'Congratulations! Your seller store has been approved. You have full access to list products and fulfill customer orders.'
              : existingSeller.status === 'pending'
              ? 'Your store registration has been recorded and is currently in review by the HumanNeed Admin team. Review typically takes 24 hours.'
              : `Your seller application was not approved. Reason: ${
                  existingSeller.rejectionReason || 'Criteria not met.'
                }`}
          </p>

          <div className="pt-4">
            <button
              onClick={() => navigate('/seller/dashboard')}
              className="btn-primary text-xs py-3 px-6 font-bold"
            >
              <span>Go to Seller Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-royal text-white flex items-center justify-center mx-auto">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">
          Sell on HumanNeed Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted max-w-lg mx-auto">
          Join India's trusted curated marketplace. Expand your customer reach with transparent
          policies, zero listing fees, and secure payments.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-card space-y-6">
        {/* Store Basics */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-dark pb-2 border-b border-slate-100">
            1. Store Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Store Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Tech Retail"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Business Email *</label>
              <input
                type="email"
                required
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Store Description</label>
            <textarea
              rows={3}
              placeholder="Tell shoppers about your store, product lines, and values..."
              value={formData.storeDescription}
              onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Business & Tax Identification */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-dark pb-2 border-b border-slate-100">
            2. Business Identification & Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Business Phone *</label>
              <input
                type="tel"
                required
                placeholder="10-digit number"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">GSTIN Number</label>
              <input
                type="text"
                placeholder="e.g. 07AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="input-field uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">PAN Number</label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                className="input-field uppercase"
              />
            </div>
          </div>
        </div>

        {/* Bank Account for Settlements */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-dark pb-2 border-b border-slate-100">
            3. Bank Settlement Account
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={formData.bankDetails.accountHolderName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value },
                  })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={formData.bankDetails.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                  })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. HDFC0001234"
                value={formData.bankDetails.ifscCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() },
                  })
                }
                className="input-field uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank"
                value={formData.bankDetails.bankName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                  })
                }
                className="input-field"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3.5 text-sm font-bold shadow-md"
        >
          {submitting ? 'Submitting Application...' : 'Submit Merchant Application'}
        </button>
      </form>
    </div>
  );
};

export default SellerRegisterPage;
