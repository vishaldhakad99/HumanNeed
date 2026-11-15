import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  Tag,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalSellers: 0,
    approvedSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    verifiedRevenue: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    returnRequests: 0,
    statusDistribution: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/admin/metrics');
        if (res.data) setMetrics(res.data);
      } catch (err) {}
      finally { setLoading(false); }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-navy text-white">
              Root Administration
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-brand-dark mt-1">
            HumanNeed Platform Control Center
          </h1>
          <p className="text-xs text-brand-muted">
            Real-time marketplace monitoring, seller approvals, and catalog oversight
          </p>
        </div>

        {metrics.pendingSellers > 0 && (
          <Link
            to="/admin/sellers?status=pending"
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-brand-orange text-amber-900 rounded-2xl text-xs font-bold animate-pulse"
          >
            <Clock className="w-4 h-4 text-brand-orange" />
            <span>{metrics.pendingSellers} Seller Application(s) Awaiting Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Verified Platform Revenue</span>
            <TrendingUp className="w-4 h-4 text-brand-success" />
          </div>
          <p className="text-2xl font-extrabold text-brand-success">
            ₹{metrics.verifiedRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400">Computed strictly from real payments</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-brand-royal" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy">{metrics.totalOrders}</p>
          <p className="text-[11px] text-brand-muted">
            {metrics.pendingOrders} pending fulfillment
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Merchant Sellers</span>
            <Store className="w-4 h-4 text-brand-orange" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy">{metrics.totalSellers}</p>
          <p className="text-[11px] text-brand-muted">
            {metrics.approvedSellers} approved • {metrics.pendingSellers} pending
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Catalog Products</span>
            <Package className="w-4 h-4 text-brand-navy" />
          </div>
          <p className="text-2xl font-extrabold text-brand-navy">{metrics.totalProducts}</p>
          <p className="text-[11px] text-brand-muted">Across all vendor stores</p>
        </div>
      </div>

      {/* Quick Navigation Management Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/sellers"
          className="card-modern p-6 flex flex-col justify-between group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-amber-50 text-brand-orange">
              <Store className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-royal group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark">Seller Verifications</h3>
            <p className="text-xs text-brand-muted mt-1">
              Review new merchant applications, verify GSTIN/bank info, and grant store licenses.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/orders"
          className="card-modern p-6 flex flex-col justify-between group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-50 text-brand-royal">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-royal group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark">Marketplace Orders</h3>
            <p className="text-xs text-brand-muted mt-1">
              Oversee nationwide order dispatches, return requests, and refund processing.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="card-modern p-6 flex flex-col justify-between group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-royal group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark">Customer Accounts</h3>
            <p className="text-xs text-brand-muted mt-1">
              Inspect user activity, update user roles, and manage account suspensions.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/categories"
          className="card-modern p-6 flex flex-col justify-between group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-50 text-brand-success">
              <Package className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-royal group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark">Categories & Taxonomy</h3>
            <p className="text-xs text-brand-muted mt-1">
              Add and configure product categories, banner slugs, and department hierarchy.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/coupons"
          className="card-modern p-6 flex flex-col justify-between group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
              <Tag className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-royal group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark">Discount Coupons</h3>
            <p className="text-xs text-brand-muted mt-1">
              Create and manage promotional discount codes with min purchase and expiry limits.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="card-modern p-6 flex flex-col justify-between group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-slate-100 text-brand-navy">
              <FileText className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-royal group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-dark">Security Audit Trail</h3>
            <p className="text-xs text-brand-muted mt-1">
              View immutable audit records for authentication, approvals, and order status events.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
