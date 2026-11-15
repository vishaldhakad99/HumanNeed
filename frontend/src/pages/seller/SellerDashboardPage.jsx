import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Store,
} from 'lucide-react';

export const SellerDashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    totalOrders: 0,
    totalItemsSold: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const [profRes, analRes] = await Promise.allSettled([
          api.get('/seller/profile'),
          api.get('/seller/analytics'),
        ]);

        if (profRes.status === 'fulfilled' && profRes.value?.data) {
          setProfile(profRes.value.data);
        }
        if (analRes.status === 'fulfilled' && analRes.value?.data) {
          setAnalytics(analRes.value.data);
        }
      } catch (err) {}
      finally { setLoading(false); }
    };
    fetchSellerData();
  }, []);

  const isApproved = profile?.status === 'approved';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-navy text-white flex items-center justify-center">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-brand-dark">
              {profile ? profile.storeName : 'Merchant Dashboard'}
            </h1>
            <p className="text-xs text-brand-muted">
              Merchant Partner Portal • {profile?.businessEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isApproved
                ? 'bg-emerald-50 text-brand-success'
                : profile?.status === 'pending'
                ? 'bg-amber-50 text-brand-orange'
                : 'bg-red-50 text-brand-error'
            }`}
          >
            Status: {profile?.status || 'Unknown'}
          </span>

          {isApproved && (
            <Link to="/seller/products/new" className="btn-primary text-xs py-2 px-4">
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Total Listed Products</span>
            <Package className="w-4 h-4 text-brand-royal" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy">{analytics.totalProducts}</p>
          <p className="text-[11px] text-brand-muted">
            {analytics.activeProducts} active in store
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Orders Received</span>
            <ShoppingBag className="w-4 h-4 text-brand-orange" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy">{analytics.totalOrders}</p>
          <p className="text-[11px] text-brand-muted">
            {analytics.totalItemsSold} items fulfilled
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Verified Earnings</span>
            <TrendingUp className="w-4 h-4 text-brand-success" />
          </div>
          <p className="text-2xl font-extrabold text-brand-success">
            ₹{analytics.totalEarnings.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400">From paid/delivered orders</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Out of Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-brand-error" />
          </div>
          <p className="text-2xl font-extrabold text-brand-dark">
            {analytics.outOfStockProducts}
          </p>
          <p className="text-[11px] text-brand-error">Need inventory restock</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-brand-dark">Product Catalog Management</h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Create, update pricing, upload images, manage inventory levels, and control active
              status of your marketplace listings.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link to="/seller/products" className="btn-secondary text-xs py-2 px-4">
              <span>View All Products</span>
            </Link>
            {isApproved && (
              <Link to="/seller/products/new" className="btn-primary text-xs py-2 px-4">
                <Plus className="w-4 h-4" />
                <span>Create New Product</span>
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-subtle flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-brand-dark">Order Fulfillment</h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Track customer orders containing items from your store. Mark items as Packed, Shipped,
              and enter courier tracking credentials.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/seller/orders" className="btn-primary text-xs py-2 px-4">
              <span>Manage Store Orders</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
