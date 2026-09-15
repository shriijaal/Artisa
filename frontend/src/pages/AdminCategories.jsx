import { useState, useEffect } from 'react';
import authFetch from '../utils/authFetch';
import CustomSelect from '../components/CustomSelect';
import ResizableTable from '../components/ResizableTable';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', parent: '' });

  const fetchCategories = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    authFetch(`/api/admin/categories/?${params}`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editCategory
      ? `/api/admin/categories/${editCategory.id}/`
      : '/api/admin/categories/';
    const method = editCategory ? 'PUT' : 'POST';
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
        parent: form.parent || null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setEditCategory(null);
      setForm({ name: '', slug: '', description: '', parent: '' });
      fetchCategories();
    }
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Delete this category?')) return;
    const res = await authFetch(`/api/admin/categories/${categoryId}/`, { method: 'DELETE' });
    if (res.ok) fetchCategories();
  };

  const startEdit = (cat) => {
    setEditCategory(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', parent: cat.parent || '' });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Categories</h1>
          <p className="text-sm text-stone-500 mt-1">Manage marketplace categories</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditCategory(null); setForm({ name: '', slug: '', description: '', parent: '' }); }}
          className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-stone-800 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-stone-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-stone-900">{editCategory ? 'Edit Category' : 'New Category'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="auto-generated from name"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Parent Category</label>
            <CustomSelect
              value={form.parent}
              onChange={(val) => setForm({ ...form, parent: val })}
              placeholder="None (top-level)"
              options={[
                { value: '', label: 'None (top-level)' },
                ...categories.filter((c) => c.id !== editCategory?.id).map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="w-full"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-stone-800"
          >
            {editCategory ? 'Save Changes' : 'Create Category'}
          </button>
        </form>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-sm">No categories found</div>
        ) : (
          <ResizableTable
            columns={[
              { key: 'name', label: 'Name', width: 200 },
              { key: 'parent', label: 'Parent', width: 160 },
              { key: 'subcategories', label: 'Subcategories', width: 300 },
              { key: 'artworks', label: 'Artworks', width: 100 },
              { key: 'actions', label: 'Actions', width: 120 },
            ]}
          >
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-stone-50">
                <td className="px-4 py-4 text-sm font-medium text-stone-900">{cat.name}</td>
                <td className="px-4 py-4 text-sm text-stone-500">{cat.parent ? categories.find((c) => c.id === cat.parent)?.name || 'None' : 'None'}</td>
                <td className="px-4 py-4 text-sm text-stone-500">
                  {cat.children_names?.length > 0 ? (
                    <span>{cat.children_names.join(', ')}</span>
                  ) : (
                    <span className="text-stone-300">None</span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-stone-500">{cat.artwork_count}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(cat)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Edit</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </ResizableTable>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
