import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { removeFromCompare, clearCompare, toggleCompareDrawer } from '../../redux/slices/compareSlice';
import { Scale, X, ArrowRight } from 'lucide-react';

export const ProductComparisonDrawer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, isOpen } = useSelector((state) => state.compare);

  if (items.length === 0) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => dispatch(toggleCompareDrawer(true))}
        className="fixed bottom-20 left-4 sm:bottom-5 sm:left-5 z-30 bg-brand-navy text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-premium flex items-center gap-2 text-xs font-bold hover:bg-slate-800 transition-all"
      >
        <Scale className="w-4 h-4 text-brand-orange" />
        <span>Compare ({items.length})</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-premium p-3 sm:p-4 animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-brand-navy">
            <Scale className="w-4 h-4 text-brand-orange" />
            <span>Compare ({items.length}/4)</span>
          </div>
          <button
            onClick={() => dispatch(clearCompare())}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline"
          >
            Clear All
          </button>
        </div>

        {/* Product Items Pill List */}
        <div className="flex items-center gap-3 overflow-x-auto max-w-2xl py-1">
          {items.map((prod) => (
            <div
              key={prod._id}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0"
            >
              <img
                src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'}
                alt={prod.title}
                className="w-7 h-7 rounded-md object-cover"
              />
              <span className="text-xs font-semibold text-brand-dark max-w-[120px] truncate">
                {prod.title}
              </span>
              <button
                onClick={() => dispatch(removeFromCompare(prod._id))}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => dispatch(toggleCompareDrawer(false))}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Minimize
          </button>
          <button
            onClick={() => {
              dispatch(toggleCompareDrawer(false));
              navigate('/compare');
            }}
            disabled={items.length < 2}
            className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
          >
            <span>Compare Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductComparisonDrawer;
