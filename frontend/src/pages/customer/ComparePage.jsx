import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { removeFromCompare, clearCompare } from '../../redux/slices/compareSlice';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { EmptyState } from '../../components/common/EmptyState';
import { Scale, X, ShoppingCart, Star, CheckCircle2, ArrowRight } from 'lucide-react';

export const ComparePage = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.compare);

  if (items.length < 2) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          type="search"
          title="Select At Least 2 Products to Compare"
          description="Click the compare icon on product cards across our shop catalog to view specifications side-by-side."
          actionText="Browse Catalog"
          actionLink="/shop"
        />
      </div>
    );
  }

  const handleAddToCart = async (product) => {
    const res = await dispatch(addToCartAsync({ productId: product._id, quantity: 1 }));
    if (!res.error) {
      dispatch(addToast({ message: `"${product.title}" added to cart!`, type: 'success' }));
    }
  };

  // Collect all unique spec keys across compared products
  const allSpecKeys = Array.from(
    new Set(
      items.flatMap((item) =>
        (item.specifications || []).map((s) => s.key)
      )
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">Compare Products</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Comparing {items.length} items side-by-side
          </p>
        </div>
        <button
          onClick={() => dispatch(clearCompare())}
          className="text-xs text-brand-error font-bold hover:underline"
        >
          Clear Comparison
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-x-auto p-6">
        <table className="w-full text-xs text-left border-collapse min-w-[650px]">
          <tbody>
            {/* Header: Images & Titles */}
            <tr className="border-b border-slate-100">
              <td className="p-3 w-40 font-bold text-slate-400 uppercase tracking-wider align-top">
                Product
              </td>
              {items.map((prod) => (
                <td key={prod._id} className="p-3 align-top min-w-[200px]">
                  <div className="relative space-y-2">
                    <button
                      onClick={() => dispatch(removeFromCompare(prod._id))}
                      className="absolute top-0 right-0 p-1 text-slate-400 hover:text-brand-error"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                      alt={prod.title}
                      className="w-24 h-24 object-cover rounded-xl bg-slate-50 border border-slate-100"
                    />
                    <Link
                      to={`/product/${prod.slug}`}
                      className="font-bold text-brand-dark hover:text-brand-royal line-clamp-2 leading-snug"
                    >
                      {prod.title}
                    </Link>
                  </div>
                </td>
              ))}
            </tr>

            {/* Price */}
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <td className="p-3 font-bold text-slate-500">Price</td>
              {items.map((prod) => (
                <td key={prod._id} className="p-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-brand-navy">
                      ₹{prod.discountPrice.toLocaleString('en-IN')}
                    </span>
                    {prod.price > prod.discountPrice && (
                      <span className="text-slate-400 line-through text-[11px]">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr className="border-b border-slate-100">
              <td className="p-3 font-bold text-slate-500">Customer Rating</td>
              {items.map((prod) => (
                <td key={prod._id} className="p-3">
                  <div className="flex items-center gap-1 font-bold text-amber-800">
                    <Star className="w-3.5 h-3.5 text-brand-orange fill-current" />
                    <span>{prod.ratingsAverage > 0 ? prod.ratingsAverage.toFixed(1) : 'New'}</span>
                    <span className="text-slate-400 font-normal">
                      ({prod.ratingsQuantity})
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Stock Availability */}
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <td className="p-3 font-bold text-slate-500">Availability</td>
              {items.map((prod) => (
                <td key={prod._id} className="p-3">
                  {prod.stockQuantity > 0 ? (
                    <span className="text-brand-success font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In Stock
                    </span>
                  ) : (
                    <span className="text-brand-error font-bold">Out of Stock</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Dynamic Specifications rows */}
            {allSpecKeys.map((key) => (
              <tr key={key} className="border-b border-slate-100">
                <td className="p-3 font-bold text-slate-400">{key}</td>
                {items.map((prod) => {
                  const specObj = (prod.specifications || []).find((s) => s.key === key);
                  return (
                    <td key={prod._id} className="p-3 text-slate-700">
                      {specObj ? specObj.value : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Action Row */}
            <tr>
              <td className="p-3"></td>
              {items.map((prod) => (
                <td key={prod._id} className="p-3">
                  <button
                    onClick={() => handleAddToCart(prod)}
                    disabled={prod.stockQuantity <= 0}
                    className="btn-primary w-full text-xs py-2 disabled:opacity-40"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;
