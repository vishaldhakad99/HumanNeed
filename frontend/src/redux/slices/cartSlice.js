import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const addToCartAsync = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const res = await api.post('/cart/add', { productId, quantity });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateQuantityAsync = createAsyncThunk(
  'cart/updateQuantity',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/cart/item/${itemId}`, { quantity });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/cart/item/${itemId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleSaveForLaterAsync = createAsyncThunk(
  'cart/toggleSaveForLater',
  async (itemId, { rejectWithValue }) => {
    try {
      const res = await api.put(`/cart/item/${itemId}/save-for-later`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const applyCouponAsync = createAsyncThunk(
  'cart/applyCoupon',
  async (code, { rejectWithValue }) => {
    try {
      const res = await api.post('/cart/apply-coupon', { code });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeCouponAsync = createAsyncThunk('cart/removeCoupon', async (_, { rejectWithValue }) => {
  try {
    const res = await api.delete('/cart/remove-coupon');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const initialState = {
  items: [],
  savedForLaterItems: [],
  itemCount: 0,
  pricing: {
    subtotal: 0,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    total: 0,
  },
  appliedCoupon: null,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartLocal: (state) => {
      state.items = [];
      state.savedForLaterItems = [];
      state.itemCount = 0;
      state.pricing = { subtotal: 0, discount: 0, shippingFee: 0, tax: 0, total: 0 };
      state.appliedCoupon = null;
    },
  },
  extraReducers: (builder) => {
    const handleCartData = (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.items = action.payload.items || [];
        state.savedForLaterItems = action.payload.savedForLaterItems || [];
        state.itemCount = action.payload.itemCount || 0;
        state.pricing = action.payload.pricing || state.pricing;
        state.appliedCoupon = action.payload.appliedCoupon || null;
      }
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, handleCartData)
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCartAsync.fulfilled, handleCartData)
      .addCase(updateQuantityAsync.fulfilled, handleCartData)
      .addCase(removeFromCartAsync.fulfilled, handleCartData)
      .addCase(toggleSaveForLaterAsync.fulfilled, handleCartData)
      .addCase(applyCouponAsync.fulfilled, handleCartData)
      .addCase(removeCouponAsync.fulfilled, handleCartData);
  },
});

export const { clearCartLocal } = cartSlice.actions;
export default cartSlice.reducer;
