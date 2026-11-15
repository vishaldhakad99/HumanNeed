import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { EmptyState } from '../../components/common/EmptyState';
import { addToast } from '../../redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { Package, Plus, Edit, Archive, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const SellerProductsPage = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/seller/products?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (res.data) {
        setProducts(res.data);
        if (res.meta) setTotalPages(res.meta.totalPages);
      }
    } catch (err) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to archive this product?')) return;
    try {
      await api.delete(`/seller/products/${id}`);
      dispatch(addToast({ message: 'Product archived successfully.', type: 'info' }));
      fetchProducts();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">My Store Products</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage your catalog inventory and active store listings
          </p>
        </div>

        <Link to="/seller/products/new" className="btn-primary text-xs py-2.5 px-4">
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="max-w-md relative">
        <input
          type="text"
          placeholder="Search by product title or SKU..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-brand-dark shadow-subtle focus:outline-none focus:border-brand-royal"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading catalog...</div>
      ) : products.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase">
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Price / MRP</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => (
                <tr key={prod._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={prod.title}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-brand-dark line-clamp-1">{prod.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {prod.category?.name || 'General'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-600">{prod.sku}</td>
                  <td className="p-4">
                    <p className="font-extrabold text-brand-navy">₹{prod.discountPrice}</p>
                    {prod.price > prod.discountPrice && (
                      <p className="text-[10px] text-slate-400 line-through">₹{prod.price}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-bold ${
                        prod.stockQuantity <= 0 ? 'text-brand-error' : 'text-brand-dark'
                      }`}
                    >
                      {prod.stockQuantity} units
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        prod.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800'
                          : prod.status === 'out_of_stock'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {prod.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/seller/products/edit/${prod._id}`}
                        className="p-1.5 text-slate-400 hover:text-brand-royal rounded-lg hover:bg-slate-100"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleArchive(prod._id)}
                        className="p-1.5 text-slate-400 hover:text-brand-error rounded-lg hover:bg-red-50"
                        title="Archive Product"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          type="products"
          title="No Products Listed Yet"
          description="You haven't added any products to your store catalog yet. Click below to publish your first listing!"
          actionText="Create First Product"
          actionLink="/seller/products/new"
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-brand-dark disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-600 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-white border border-slate-200 text-brand-dark disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
