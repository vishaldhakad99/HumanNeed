import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductFilter } from '../../components/product/ProductFilter';
import { ProductGridSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Filter, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter states initialized from URL params
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Load categories once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data) setCategories(res.data);
      } catch (e) {}
    };
    fetchCats();
  }, []);

  // Fetch products whenever filters or searchParams change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams(searchParams);
        queryParams.set('page', page);
        queryParams.set('limit', '12');

        const res = await api.get(`/products?${queryParams.toString()}`);
        if (res.data) {
          setProducts(res.data);
          if (res.meta) setMeta(res.meta);
        }
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, page]);

  // Update URL search parameters helper
  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value !== '' && value !== null && value !== undefined && value !== false) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // reset page on filter change
    setSearchParams(newParams);
  };

  const handlePriceChange = ({ min, max }) => {
    const newParams = new URLSearchParams(searchParams);
    if (min) newParams.set('minPrice', min);
    else newParams.delete('minPrice');
    if (max) newParams.set('maxPrice', max);
    else newParams.delete('maxPrice');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || minPrice || maxPrice || minRating || inStockOnly
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Title & Breadcrumb header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">
            {selectedCategory
              ? categories.find((c) => c.slug === selectedCategory)?.name || 'Category Products'
              : searchQuery
              ? `Results for "${searchQuery}"`
              : 'Marketplace Catalog'}
          </h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Showing {products.length} of {meta.totalCount} authentic products
          </p>
        </div>

        {/* Sort & Mobile Filter Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-brand-dark shadow-subtle"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-royal" />
            <span>Filters {hasActiveFilters && '•'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Sort By:</span>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-brand-dark focus:outline-none focus:border-brand-royal shadow-subtle"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_low_high">Price: Low to High</option>
              <option value="price_high_low">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-bold text-slate-400">Active:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-brand-dark">
              Query: "{searchQuery}"
              <button onClick={() => updateParam('search', '')}>
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-royal-light text-brand-royal rounded-full text-xs font-medium">
              Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
              <button onClick={() => updateParam('category', '')}>
                <X className="w-3.5 h-3.5 hover:text-brand-navy" />
              </button>
            </span>
          )}
          {minRating && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-medium">
              Rating: {minRating}★+
              <button onClick={() => updateParam('minRating', '')}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-medium">
              In Stock Only
              <button onClick={() => updateParam('inStock', false)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-xs text-brand-royal font-bold hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Catalog Grid & Filter Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <div className="hidden md:block col-span-1">
          <div className="sticky top-28">
            <ProductFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => updateParam('category', cat)}
              priceRange={{ min: minPrice, max: maxPrice }}
              onPriceChange={handlePriceChange}
              minRating={minRating}
              onRatingChange={(r) => updateParam('minRating', r)}
              inStockOnly={inStockOnly}
              onToggleInStock={(e) => updateParam('inStock', e.target.checked)}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </div>

        {/* Products Grid & Results */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              type="search"
              title="No Products Match Your Criteria"
              description="We couldn't find any products matching your selected filters or search terms. Try clearing filters or searching for another term."
              actionText="Reset All Filters"
              onAction={handleClearFilters}
            />
          )}

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-slate-200">
              <button
                onClick={() => updateParam('page', page - 1)}
                disabled={!meta.hasPrevPage}
                className="p-2 rounded-xl bg-white border border-slate-200 text-brand-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-subtle">
                Page {meta.currentPage} of {meta.totalPages}
              </span>

              <button
                onClick={() => updateParam('page', page + 1)}
                disabled={!meta.hasNextPage}
                className="p-2 rounded-xl bg-white border border-slate-200 text-brand-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-over / Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/50 backdrop-blur-sm">
          <div className="relative w-4/5 max-w-sm h-full bg-white p-5 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-brand-dark">Filter Products</h3>
              <button onClick={() => setIsMobileFilterOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <ProductFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                updateParam('category', cat);
                setIsMobileFilterOpen(false);
              }}
              priceRange={{ min: minPrice, max: maxPrice }}
              onPriceChange={handlePriceChange}
              minRating={minRating}
              onRatingChange={(r) => {
                updateParam('minRating', r);
                setIsMobileFilterOpen(false);
              }}
              inStockOnly={inStockOnly}
              onToggleInStock={(e) => {
                updateParam('inStock', e.target.checked);
                setIsMobileFilterOpen(false);
              }}
              onClearFilters={() => {
                handleClearFilters();
                setIsMobileFilterOpen(false);
              }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
