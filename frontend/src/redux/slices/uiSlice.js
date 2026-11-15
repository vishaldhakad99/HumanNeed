import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toasts: [],
    authModal: {
      isOpen: false,
      mode: 'login', // 'login' | 'register'
    },
    isMobileMenuOpen: false,
  },
  reducers: {
    addToast: (state, action) => {
      const { message, type = 'info', id = Date.now() } = action.payload;
      state.toasts.push({ id, message, type });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    openAuthModal: (state, action) => {
      state.authModal.isOpen = true;
      state.authModal.mode = action.payload || 'login';
    },
    closeAuthModal: (state) => {
      state.authModal.isOpen = false;
    },
    setAuthModalMode: (state, action) => {
      state.authModal.mode = action.payload;
    },
    toggleMobileMenu: (state, action) => {
      state.isMobileMenuOpen = action.payload !== undefined ? action.payload : !state.isMobileMenuOpen;
    },
  },
});

export const {
  addToast,
  removeToast,
  openAuthModal,
  closeAuthModal,
  setAuthModalMode,
  toggleMobileMenu,
} = uiSlice.actions;

export default uiSlice.reducer;
