import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { addToast } from '../../redux/slices/uiSlice';
import { Plus, Trash2, ArrowLeft, Loader2, ImagePlus } from 'lucide-react';

export const SellerProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    discountPrice: '',
    stockQuantity: '',
    lowStockThreshold: 5,
    images: [''],
    specifications: [{ key: '', value: '' }],
    tags: '',
    status: 'active',
  });

  useEffect(() => {
    const initForm = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);

        if (catsRes.data) setCategories(catsRes.data);
        if (brandsRes.data) setBrands(brandsRes.data);

        if (isEditMode) {
          const prodRes = await api.get(`/products/${id}`);
          if (prodRes.data?.product) {
            const p = prodRes.data.product;
            setFormData({
              title: p.title || '',
              shortDescription: p.shortDescription || '',
              description: p.description || '',
              category: p.category?._id || p.category || '',
              brand: p.brand?._id || p.brand || '',
              price: p.price || '',
              discountPrice: p.discountPrice || '',
              stockQuantity: p.stockQuantity || 0,
              lowStockThreshold: p.lowStockThreshold || 5,
              images: p.images?.length > 0 ? p.images : [''],
              specifications:
                p.specifications?.length > 0 ? p.specifications : [{ key: '', value: '' }],
              tags: p.tags?.join(', ') || '',
              status: p.status || 'active',
            });
          }
        }
      } catch (err) {
        dispatch(addToast({ message: 'Failed to load form data.', type: 'error' }));
      } finally {
        setFetching(false);
      }
    };

    initForm();
  }, [id, isEditMode, dispatch]);

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    if (formData.images.length < 5) {
      setFormData({ ...formData, images: [...formData.images, ''] });
    }
  };

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      setFormData({
        ...formData,
        images: formData.images.filter((_, i) => i !== index),
      });
    }
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData({ ...formData, specifications: newSpecs });
  };

  const addSpecField = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: '', value: '' }],
    });
  };

  const removeSpecField = (index) => {
    setFormData({
      ...formData,
      specifications: formData.specifications.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanImages = formData.images.filter((img) => img && img.trim());
      if (cleanImages.length === 0) {
        dispatch(addToast({ message: 'Please provide at least one product image URL.', type: 'error' }));
        setLoading(false);
        return;
      }

      const cleanSpecs = formData.specifications.filter((s) => s.key.trim() && s.value.trim());
      const cleanTags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title,
        shortDescription: formData.shortDescription,
        description: formData.description,
        category: formData.category,
        brand: formData.brand || null,
        price: Number(formData.price),
        discountPrice: Number(formData.discountPrice || formData.price),
        stockQuantity: Number(formData.stockQuantity),
        lowStockThreshold: Number(formData.lowStockThreshold || 5),
        images: cleanImages,
        specifications: cleanSpecs,
        tags: cleanTags,
        status: formData.status,
      };

      if (isEditMode) {
        await api.put(`/seller/products/${id}`, payload);
        dispatch(addToast({ message: 'Product updated successfully!', type: 'success' }));
      } else {
        await api.post('/seller/products', payload);
        dispatch(addToast({ message: 'Product created and published!', type: 'success' }));
      }

      navigate('/seller/products');
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading product details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/seller/products')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-subtle"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">
            {isEditMode ? 'Edit Product Listing' : 'Add New Product Listing'}
          </h1>
          <p className="text-xs text-brand-muted">
            Provide accurate details to maximize buyer discovery and trust
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-card space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-dark pb-2 border-b border-slate-100">
            1. Title & Classification
          </h3>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Product Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ergonomic Wireless Mouse with Silent Click"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">Brand</label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="input-field"
              >
                <option value="">None / Generic Brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-dark pb-2 border-b border-slate-100">
            2. Pricing & Inventory
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                MRP / Original Price (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 1499"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Selling / Discount Price (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 999"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="Units available"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-dark">
              3. Product Images (Up to 5 URLs)
            </h3>
            {formData.images.length < 5 && (
              <button
                type="button"
                onClick={addImageField}
                className="text-xs font-bold text-brand-royal hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Image URL</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {formData.images.map((url, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={url}
                  onChange={(e) => handleImageChange(i, e.target.value)}
                  className="input-field"
                />
                {formData.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageField(i)}
                    className="p-2 text-slate-400 hover:text-brand-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Descriptions & Specs */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-dark pb-2 border-b border-slate-100">
            4. Detailed Description & Specifications
          </h3>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Full Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Highlight key benefits, materials, usage instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-brand-dark">
                Key Specifications (Attributes)
              </label>
              <button
                type="button"
                onClick={addSpecField}
                className="text-xs font-bold text-brand-royal hover:underline"
              >
                + Add Spec
              </button>
            </div>

            <div className="space-y-2">
              {formData.specifications.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Attribute (e.g. Color)"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(i, 'key', e.target.value)}
                    className="input-field w-1/3"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Midnight Black)"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(i, 'value', e.target.value)}
                    className="input-field flex-1"
                  />
                  {formData.specifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecField(i)}
                      className="p-2 text-slate-400 hover:text-brand-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Search Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. wireless, mouse, bluetooth, usb-c, office"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 text-sm font-bold shadow-md"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>{isEditMode ? 'Update Product Listing' : 'Publish Product to Marketplace'}</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default SellerProductFormPage;
