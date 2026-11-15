import React from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen, ShoppingBag, Heart, Search, Store, FolderPlus, ArrowRight } from 'lucide-react';

const icons = {
  products: PackageOpen,
  cart: ShoppingBag,
  wishlist: Heart,
  search: Search,
  seller: Store,
  category: FolderPlus,
};

export const EmptyState = ({
  type = 'products',
  title,
  description,
  actionText,
  actionLink,
  onAction,
  className = '',
}) => {
  const IconComponent = icons[type] || PackageOpen;

  const defaultTitles = {
    products: 'No Products Listed Yet',
    cart: 'Your Shopping Cart is Empty',
    wishlist: 'Your Wishlist is Empty',
    search: 'No Matching Results Found',
    seller: 'No Active Sellers Yet',
    category: 'No Categories Available',
  };

  const defaultDescriptions = {
    products:
      'HumanNeed maintains a strict verified-inventory policy. Approved sellers will list real products here shortly.',
    cart: 'Explore thousands of genuine essentials and add your favorite items to your shopping cart.',
    wishlist: 'Save products you love to keep track of prices and stock availability.',
    search: 'Try adjusting your search keywords, clearing applied filters, or browsing our categories.',
    seller: 'Be among the first verified merchant partners to list your brand on HumanNeed.',
    category: 'Platform administrators can define categories to organize marketplace collections.',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white rounded-2xl border border-slate-100 shadow-subtle ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-royal-light flex items-center justify-center text-brand-royal mb-4">
        <IconComponent className="w-8 h-8" />
      </div>

      <h3 className="text-lg md:text-xl font-bold text-brand-dark mb-2">
        {title || defaultTitles[type] || 'No Data Found'}
      </h3>

      <p className="text-sm text-brand-muted max-w-md mb-6 leading-relaxed">
        {description || defaultDescriptions[type] || 'There are currently no items to display.'}
      </p>

      {actionText && actionLink && (
        <Link to={actionLink} className="btn-primary">
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button onClick={onAction} className="btn-primary">
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default EmptyState;
