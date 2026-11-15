import React from 'react';

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-3 flex flex-col gap-3 animate-pulse shadow-subtle">
    <div className="w-full aspect-square bg-slate-200 rounded-xl" />
    <div className="h-4 bg-slate-200 rounded w-1/3" />
    <div className="h-5 bg-slate-200 rounded w-3/4" />
    <div className="flex items-center gap-2">
      <div className="h-4 bg-slate-200 rounded w-16" />
      <div className="h-4 bg-slate-200 rounded w-12" />
    </div>
    <div className="h-9 bg-slate-200 rounded-xl w-full mt-1" />
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
    <div className="h-10 bg-slate-100 rounded-lg mb-4 w-full" />
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 py-3 border-b border-slate-50">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="h-4 bg-slate-200 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
    <div className="space-y-4">
      <div className="w-full aspect-square bg-slate-200 rounded-2xl" />
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-20 h-20 bg-slate-200 rounded-xl" />
        ))}
      </div>
    </div>
    <div className="space-y-4 flex flex-col justify-center">
      <div className="h-5 bg-slate-200 rounded w-1/4" />
      <div className="h-8 bg-slate-200 rounded w-3/4" />
      <div className="h-5 bg-slate-200 rounded w-1/3" />
      <div className="h-10 bg-slate-200 rounded w-1/2" />
      <div className="h-24 bg-slate-200 rounded w-full" />
      <div className="flex gap-4 pt-4">
        <div className="h-12 bg-slate-200 rounded-xl flex-1" />
        <div className="h-12 bg-slate-200 rounded-xl flex-1" />
      </div>
    </div>
  </div>
);

export default ProductGridSkeleton;
