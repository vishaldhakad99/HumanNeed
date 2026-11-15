import { createSlice } from '@reduxjs/toolkit';

const initialItems = JSON.parse(localStorage.getItem('hn_compare') || '[]');

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    items: initialItems,
    isOpen: false,
  },
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload;
      const exists = state.items.find((p) => p._id === product._id);
      if (!exists) {
        if (state.items.length >= 4) {
          state.items.shift(); // Keep max 4
        }
        state.items.push(product);
        localStorage.setItem('hn_compare', JSON.stringify(state.items));
        state.isOpen = true;
      }
    },
    removeFromCompare: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((p) => p._id !== id);
      localStorage.setItem('hn_compare', JSON.stringify(state.items));
    },
    clearCompare: (state) => {
      state.items = [];
      localStorage.removeItem('hn_compare');
      state.isOpen = false;
    },
    toggleCompareDrawer: (state, action) => {
      state.isOpen = action.payload !== undefined ? action.payload : !state.isOpen;
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare, toggleCompareDrawer } = compareSlice.actions;
export default compareSlice.reducer;
