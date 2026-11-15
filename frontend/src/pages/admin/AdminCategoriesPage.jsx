import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import { Modal } from '../../components/common/Modal';
import { FolderPlus, Plus, Edit, Trash2, ShoppingBag } from 'lucide-react';

export const AdminCategoriesPage = () => {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit modal state
  const [modalState, setModalState] = useState({ isOpen: false, editingCat: null });
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    image: '',
    displayOrder: 0,
    isFeatured: false,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.data) setCategories(res.data);
    } catch (e) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setCatForm({ name: '', description: '', image: '', displayOrder: 0, isFeatured: false });
    setModalState({ isOpen: true, editingCat: null });
  };

  const handleOpenEdit = (cat) => {
    setCatForm({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      displayOrder: cat.displayOrder || 0,
      isFeatured: Boolean(cat.isFeatured),
    });
    setModalState({ isOpen: true, editingCat: cat });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalState.editingCat) {
        await api.put(`/categories/${modalState.editingCat._id}`, catForm);
        dispatch(addToast({ message: 'Category updated successfully!', type: 'success' }));
      } else {
        await api.post('/categories', catForm);
        dispatch(addToast({ message: 'Category created successfully!', type: 'success' }));
      }
      setModalState({ isOpen: false, editingCat: null });
      fetchCategories();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      dispatch(addToast({ message: 'Category removed.', type: 'info' }));
      fetchCategories();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">Marketplace Categories</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Organize departments, navigation hierarchy, and catalog groupings
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary text-xs py-2.5 px-4">
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading categories...</div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-3xl border border-slate-100 p-5 shadow-subtle flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-brand-royal overflow-hidden border border-slate-100 shrink-0">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-6 h-6" />
                  )}
                </div>
                <div className="truncate flex-1">
                  <h4 className="text-sm font-bold text-brand-dark truncate">{cat.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">/{cat.slug}</p>
                </div>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Order: {cat.displayOrder}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-brand-royal rounded-lg hover:bg-slate-50"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    className="p-1.5 text-slate-400 hover:text-brand-error rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">
          No categories configured. Click 'Add New Category' above to create one.
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, editingCat: null })}
        title={modalState.editingCat ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Consumer Electronics"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Short description..."
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={catForm.image}
              onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Display Order</label>
              <input
                type="number"
                value={catForm.displayOrder}
                onChange={(e) => setCatForm({ ...catForm, displayOrder: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-dark">
                <input
                  type="checkbox"
                  checked={catForm.isFeatured}
                  onChange={(e) => setCatForm({ ...catForm, isFeatured: e.target.checked })}
                  className="rounded text-brand-royal"
                />
                <span>Feature on Homepage</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
            {modalState.editingCat ? 'Save Changes' : 'Create Category'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCategoriesPage;
