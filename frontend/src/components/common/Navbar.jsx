import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { HumanNeedLogo } from '../../assets/HumanNeedLogo';
import { openAuthModal } from '../../redux/slices/uiSlice';
import { logoutUser } from '../../redux/slices/authSlice';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import api from '../../services/api';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  Store,
  ShieldCheck,
  Package,
  LogOut,
  MapPin,
  Sparkles,
  Mic,
  MicOff,
} from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { itemCount } = useSelector((state) => state.cart);
  const { count: wishlistCount } = useSelector((state) => state.wishlist);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [categories, setCategories] = useState([]);

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Web Speech API Voice Search
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isVoiceListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsVoiceListening(true);
      };

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
          setIsSearchOpen(false);
          navigate(`/shop?search=${encodeURIComponent(transcript.trim())}`);
        }
      };

      recognition.onerror = () => {
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsVoiceListening(false);
    }
  };

  // Load top categories for category bar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data) setCategories(res.data.slice(0, 8));
      } catch (err) {
        // Fallback silently if offline/empty
      }
    };
    fetchCategories();
  }, []);

  // Live search suggestions with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions({ products: [], categories: [] });
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.data) {
          setSuggestions(res.data);
          setIsSearchOpen(true);
        }
      } catch (err) {
        // Ignore
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-subtle bg-white">
      {/* 1. Premium Announcement Bar */}
      <div className="bg-brand-navy text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="bg-brand-orange text-brand-dark px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
              Launch Offer
            </span>
            <span className="text-slate-300 hidden sm:inline">
              Free Express Delivery on all orders above ₹500 across India!
            </span>
            <span className="text-slate-300 sm:hidden">Free Delivery above ₹500!</span>
          </div>

          <div className="flex items-center gap-5 text-slate-300 shrink-0">
            <Link
              to="/seller/register"
              className="hover:text-brand-orange flex items-center gap-1 font-medium transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Sell on HumanNeed</span>
            </Link>
            <div className="h-3 w-px bg-slate-700 hidden md:block" />
            <span className="hidden md:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-success" />
              <span>100% Genuine Products</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <Link to="/" className="shrink-0">
            <HumanNeedLogo size="normal" />
          </Link>

          {/* Search Bar with live autocomplete */}
          <div className="flex-1 max-w-2xl relative hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder={isVoiceListening ? 'Listening... Speak your search...' : 'Search for products, brands, essentials...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
                className="w-full pl-11 pr-28 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-brand-dark placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />

              {/* Voice Search Button */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`absolute right-20 top-2 p-1.5 rounded-full transition-all ${
                  isVoiceListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-brand-royal hover:bg-slate-100'
                }`}
                title="Voice Search"
              >
                {isVoiceListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-brand-royal text-white rounded-full text-xs font-semibold hover:bg-brand-royal-hover transition-colors"
              >
                Search
              </button>
            </form>

            {/* Live Autocomplete Suggestions Dropdown */}
            {isSearchOpen && (suggestions.products.length > 0 || suggestions.categories.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-premium border border-slate-100 overflow-hidden z-50">
                {suggestions.categories.length > 0 && (
                  <div className="p-2 border-b border-slate-100">
                    <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Categories
                    </p>
                    {suggestions.categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/shop?category=${cat.slug}`);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-brand-dark hover:bg-slate-50 rounded-lg flex items-center justify-between"
                      >
                        <span>{cat.name}</span>
                        <span className="text-slate-400 text-[10px]">In Categories</span>
                      </button>
                    ))}
                  </div>
                )}

                {suggestions.products.length > 0 && (
                  <div className="p-2">
                    <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Products
                    </p>
                    {suggestions.products.map((prod) => (
                      <Link
                        key={prod._id}
                        to={`/product/${prod.slug}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-brand-dark hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={prod.title}
                          className="w-8 h-8 rounded-md object-cover bg-slate-100"
                        />
                        <div className="flex-1 truncate">
                          <p className="truncate text-brand-dark">{prod.title}</p>
                          <p className="text-brand-royal font-bold">₹{prod.discountPrice}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            {/* Ask AI Pill Button */}
            <button
              onClick={() => setIsAIAssistantOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-navy to-slate-900 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
              title="HumanNeed AI Shopping Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
              <span>Ask AI</span>
            </button>

            {/* Wishlist (Desktop/Tablet) */}
            <Link
              to="/dashboard?tab=wishlist"
              className="hidden sm:inline-flex relative p-2 text-slate-600 hover:text-brand-royal hover:bg-slate-50 rounded-xl transition-all"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 p-1.5 sm:p-2 sm:px-3 text-brand-navy hover:bg-brand-royal-light rounded-xl transition-all group"
              title="Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-brand-royal" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-royal text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold hidden sm:inline text-brand-dark">Cart</span>
            </Link>

            {/* User Account / Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-royal text-white flex items-center justify-center text-xs font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-brand-dark hidden sm:inline max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-premium border border-slate-100 p-2 z-50 animate-scale-up">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-brand-dark truncate">{user.name}</p>
                      <p className="text-[11px] text-brand-muted truncate">{user.email}</p>
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold uppercase mt-1">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                    >
                      <User className="w-4 h-4 text-brand-royal" />
                      <span>My Profile & Dashboard</span>
                    </Link>

                    <Link
                      to="/dashboard?tab=orders"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                    >
                      <Package className="w-4 h-4 text-brand-royal" />
                      <span>My Orders</span>
                    </Link>

                    {/* Seller Portal Link */}
                    {(user.role === 'seller' || user.role === 'admin') && (
                      <Link
                        to="/seller/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-brand-royal hover:bg-brand-royal-light rounded-xl"
                      >
                        <Store className="w-4 h-4" />
                        <span>Seller Portal</span>
                      </Link>
                    )}

                    {/* Admin Dashboard Link */}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-brand-orange hover:bg-amber-50 rounded-xl"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Control Center</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        dispatch(logoutUser());
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-brand-error hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch(openAuthModal('login'))}
                  className="px-4 py-2 text-xs font-bold text-brand-navy hover:text-brand-royal transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => dispatch(openAuthModal('register'))}
                  className="btn-primary text-xs py-2 px-3.5 hidden sm:inline-flex"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 md:hidden hover:bg-slate-100 rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="px-4 pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder={isVoiceListening ? 'Listening... Speak now...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-brand-dark"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`absolute right-3 top-2 p-1 rounded-full ${
                isVoiceListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-brand-royal'
              }`}
              title="Voice Search"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. Category Navigation Bar */}
      <nav className="bg-slate-50 border-b border-slate-200/80 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 overflow-x-auto text-xs font-semibold py-2.5 text-slate-700">
          <Link
            to="/shop"
            className="text-brand-royal hover:text-brand-royal-hover flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>All Products</span>
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/shop?category=${cat.slug}`}
              className="hover:text-brand-royal whitespace-nowrap transition-colors shrink-0"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            to="/shop?sort=popularity"
            className="hover:text-brand-royal whitespace-nowrap text-brand-orange ml-auto shrink-0 font-bold"
          >
            🔥 Best Sellers
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Explore</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 bg-slate-50 rounded-lg text-brand-royal font-bold"
            >
              All Products
            </Link>
            <Link
              to="/seller/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 bg-slate-50 rounded-lg text-slate-700"
            >
              Sell on HumanNeed
            </Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAIAssistantOpen(true);
              }}
              className="p-2 bg-brand-navy text-white rounded-lg font-bold flex items-center gap-1.5 justify-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
              <span>Ask AI Assistant</span>
            </button>
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/shop?category=${cat.slug}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-slate-50 rounded-lg text-slate-700"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Floating AI Shopping Assistant Launcher (FAB on mobile, above bottom nav) */}
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2 bg-gradient-to-r from-brand-navy to-slate-900 text-white p-2.5 sm:px-4 sm:py-3 rounded-full shadow-premium hover:shadow-2xl hover:scale-105 transition-all group border border-white/10"
        title="Ask HumanNeed AI Assistant"
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-brand-royal flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-orange animate-pulse" />
        </div>
        <span className="text-xs font-bold tracking-tight pr-1 hidden sm:inline">Ask AI</span>
      </button>

      {/* AI Assistant Interactive Drawer */}
      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />
    </header>
  );
};

export default Navbar;
