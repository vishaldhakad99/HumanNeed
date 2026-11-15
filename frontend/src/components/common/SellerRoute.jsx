import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

export const SellerRoute = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  const [sellerStatus, setSellerStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSeller = async () => {
      if (isAuthenticated) {
        try {
          const res = await api.get('/seller/profile');
          setSellerStatus(res.data ? res.data.status : 'not_registered');
        } catch (e) {
          setSellerStatus('not_registered');
        }
      }
      setLoading(false);
    };
    checkSeller();
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-royal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (sellerStatus === 'not_registered' && user.role !== 'admin') {
    return <Navigate to="/seller/register" replace />;
  }

  return (
    <div>
      {/* If seller application is pending review, show prominent banner */}
      {sellerStatus === 'pending' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-amber-800 text-xs font-medium">
            <Clock className="w-4 h-4 text-brand-orange shrink-0" />
            <span>
              Your seller application is currently <strong>Under Review</strong> by HumanNeed
              administrators. Product listing and order fulfillment will be activated once your store is
              approved.
            </span>
          </div>
        </div>
      )}

      {sellerStatus === 'rejected' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-red-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-brand-error shrink-0" />
            <span>
              Your seller registration was not approved. Please contact merchant support at{' '}
              <a href="mailto:support@humanneed.in" className="underline font-bold">
                support@humanneed.in
              </a>
              .
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

export default SellerRoute;
