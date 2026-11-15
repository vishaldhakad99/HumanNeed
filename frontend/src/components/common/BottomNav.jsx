import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Home, Compass, Heart, ShoppingCart, User } from 'lucide-react';
import { openAuthModal } from '../../redux/slices/uiSlice';

export const BottomNav = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { itemCount } = useSelector((state) => state.cart);
  const { count: wishlistCount } = useSelector((state) => state.wishlist);

  const handleAccountClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      dispatch(openAuthModal('login'));
    }
  };

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
    },
    {
      to: '/shop',
      label: 'Shop',
      icon: Compass,
    },
    {
      to: isAuthenticated ? '/dashboard?tab=wishlist' : '#',
      label: 'Wishlist',
      icon: Heart,
      badge: wishlistCount,
      onClick: !isAuthenticated ? (e) => { e.preventDefault(); dispatch(openAuthModal('login')); } : undefined,
    },
    {
      to: '/cart',
      label: 'Cart',
      icon: ShoppingCart,
      badge: itemCount,
    },
    {
      to: isAuthenticated ? '/dashboard' : '#',
      label: isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Account',
      icon: User,
      onClick: handleAccountClick,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden">
      <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center px-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.to}
              onClick={item.onClick}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 relative text-[10px] font-semibold transition-colors ${
                  isActive && item.to !== '#'
                    ? 'text-brand-royal font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 bg-brand-orange text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5 truncate max-w-[56px] leading-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
