import React from 'react';
import { Filter, X, Star, Check } from 'lucide-react';

export const ProductFilter = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  priceRange,
  onPriceChange,
  minRating,
  onRatingChange,
  inStockOnly,
  onToggleInStock,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-subtle space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
          <Filter className="w-4 h-4 text-brand-royal" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-brand-royal hover:underline font-semibold"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-3">
          Categories
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onSelectCategory('')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !selectedCategory
                ? 'bg-brand-royal-light text-brand-royal font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-brand-royal-light text-brand-royal font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-3">
          Price Range (₹)
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100000"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => onPriceChange({ ...priceRange, min: e.target.value })}
            className="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-royal"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="number"
            min="0"
            max="100000"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => onPriceChange({ ...priceRange, max: e.target.value })}
            className="w-1/2 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-royal"
          />
        </div>
      </div>

      {/* Ratings */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-3">
          Customer Rating
        </h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((stars) => (
            <button
              key={stars}
              onClick={() => onRatingChange(minRating === stars ? '' : stars)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                Number(minRating) === stars
                  ? 'bg-brand-royal-light text-brand-royal font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-brand-orange fill-current" />
                <span>{stars} Stars & Above</span>
              </div>
              {Number(minRating) === stars && <Check className="w-3.5 h-3.5 text-brand-royal" />}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Availability */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={onToggleInStock}
            className="w-4 h-4 rounded text-brand-royal focus:ring-brand-royal border-slate-300"
          />
          <span>Exclude Out of Stock</span>
        </label>
      </div>
    </div>
  );
};

export default ProductFilter;
