import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HumanNeedLogo } from '../../assets/HumanNeedLogo';
import { addToast } from '../../redux/slices/uiSlice';
import {
  ShieldCheck,
  RotateCcw,
  CreditCard,
  Truck,
  Mail,
  ArrowRight,
  Heart,
  Phone,
  MapPin,
} from 'lucide-react';

export const Footer = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      dispatch(
        addToast({
          message: 'Thank you for subscribing to HumanNeed updates and exclusive deals!',
          type: 'success',
        })
      );
      setEmail('');
    }
  };

  return (
    <footer className="bg-brand-navy text-white pt-12 border-t border-slate-800">
      {/* 1. Value Proposition Banner */}
      <div className="max-w-7xl mx-auto px-4 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-slate-800/80 rounded-xl text-brand-royal shrink-0">
              <ShieldCheck className="w-6 h-6 text-brand-royal" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Genuine</h4>
              <p className="text-xs text-slate-400 mt-0.5">Verified products from trusted sellers</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-slate-800/80 rounded-xl text-brand-orange shrink-0">
              <RotateCcw className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">7-Day Easy Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hassle-free replacement or refund</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-slate-800/80 rounded-xl text-brand-success shrink-0">
              <CreditCard className="w-6 h-6 text-brand-success" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Secure Payments</h4>
              <p className="text-xs text-slate-400 mt-0.5">UPI, Cards, Netbanking via Razorpay</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-slate-800/80 rounded-xl text-brand-royal shrink-0">
              <Truck className="w-6 h-6 text-brand-royal" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Fast Nationwide Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">Free shipping on orders above ₹500</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <HumanNeedLogo variant="light" size="large" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              HumanNeed is India's dedicated multi-vendor marketplace connecting consumers with
              verified authentic sellers for daily essentials, technology, fashion, and home lifestyle.
            </p>
            <div className="pt-2 flex flex-col gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-orange" />
                <span>support@humanneed.in</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-orange" />
                <span>Bengaluru, Karnataka, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Shop & Explore</h5>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=popularity" className="hover:text-white transition-colors">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=rating" className="hover:text-white transition-colors">
                  Top Rated
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition-colors">
                  Compare Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Customer Support</h5>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li>
                <Link to="/dashboard?tab=orders" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/dashboard?tab=addresses" className="hover:text-white transition-colors">
                  Manage Addresses
                </Link>
              </li>
              <li>
                <Link to="/seller/register" className="hover:text-brand-orange text-brand-orange font-bold transition-colors">
                  Become a Seller
                </Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">Safe Shopping Guarantee</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Stay Updated</h5>
            <p className="text-xs text-slate-400">
              Subscribe to get updates on price drops, new arrivals, and special coupon codes.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-royal"
              />
              <button type="submit" className="btn-accent w-full text-xs py-2">
                <span>Subscribe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="border-t border-slate-800/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} HumanNeed Marketplace Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Built with precision for India</span>
            <Heart className="w-3.5 h-3.5 text-brand-error fill-current" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
