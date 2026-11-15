import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from './Modal';
import { closeAuthModal, setAuthModalMode, addToast } from '../../redux/slices/uiSlice';
import { loginUser, registerUser } from '../../redux/slices/authSlice';
import { Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { HumanNeedIcon } from '../../assets/HumanNeedLogo';

export const AuthModal = () => {
  const dispatch = useDispatch();
  const { isOpen, mode } = useSelector((state) => state.ui.authModal);
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'login') {
      const res = await dispatch(loginUser({ email: formData.email, password: formData.password }));
      if (!res.error) {
        dispatch(addToast({ message: 'Welcome back to HumanNeed!', type: 'success' }));
        dispatch(closeAuthModal());
      }
    } else if (mode === 'register') {
      const res = await dispatch(registerUser(formData));
      if (!res.error) {
        dispatch(addToast({ message: 'Account created successfully! Welcome to HumanNeed.', type: 'success' }));
        dispatch(closeAuthModal());
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeAuthModal())}
      title={mode === 'login' ? 'Sign in to HumanNeed' : 'Create your HumanNeed Account'}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center mb-6 text-center">
        <HumanNeedIcon className="w-12 h-12 mb-3" />
        <h4 className="text-xl font-bold text-brand-dark">
          {mode === 'login' ? 'Welcome Back!' : 'Join HumanNeed Today'}
        </h4>
        <p className="text-sm text-brand-muted mt-1">
          {mode === 'login'
            ? 'Access your orders, wishlist, and personalized recommendations'
            : 'Buy genuine essentials from trusted sellers across India'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-brand-error text-xs rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="input-field pl-10"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="input-field pl-10"
            />
          </div>
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="input-field pl-10"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder={mode === 'register' ? 'Min 8 chars, 1 uppercase & 1 number' : 'Your password'}
              className="input-field pl-10"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        {mode === 'login' ? (
          <p className="text-sm text-brand-muted">
            Don't have an account?{' '}
            <button
              onClick={() => dispatch(setAuthModalMode('register'))}
              className="font-bold text-brand-royal hover:underline"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="text-sm text-brand-muted">
            Already have an account?{' '}
            <button
              onClick={() => dispatch(setAuthModalMode('login'))}
              className="font-bold text-brand-royal hover:underline"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;
