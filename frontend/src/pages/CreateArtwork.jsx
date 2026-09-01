import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ArtistSideNav from '../components/ArtistSideNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const CreateArtwork = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: 'physical',
    category_id: '',
    stock: '',
    tags: '',
    originality_declaration: false,
    images: [],
    digital_file: null,
  });

  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/artworks/categories/');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.images.length + files.length > 5) {
      setError('You can upload a maximum of 5 images');
      return;
    }

    setFormData({
      ...formData,
      images: [...formData.images, ...files],
    });

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!formData.originality_declaration) {
      setError('You must declare that this is your original work');
      setSubmitting(false);
      return;
    }

    if (formData.images.length === 0) {
      setError('Please upload at least one image of your artwork');
      setSubmitting(false);
      return;
    }

    if (formData.type === 'digital' && !formData.digital_file) {
      setError('Please upload a high-resolution digital file');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const artworkData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        type: formData.type,
        category_id: formData.category_id,
        stock: formData.type === 'physical' ? parseInt(formData.stock) : null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        originality_declaration: formData.originality_declaration,
      };

      const response = await fetch('/api/artworks/my-artworks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(artworkData),
      });

      if (response.ok) {
        const artwork = await response.json();
        
        // Upload images
        for (const image of formData.images) {
          const imageFormData = new FormData();
          imageFormData.append('image', image);
          imageFormData.append('is_primary', image === formData.images[0]);
          
          await fetch(`/api/artworks/my-artworks/${artwork.id}/images/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: imageFormData,
          });
        }

        // Upload digital file if digital artwork
        if (formData.type === 'digital' && formData.digital_file) {
          const digitalFormData = new FormData();
          digitalFormData.append('file', formData.digital_file);
          
          await fetch(`/api/artworks/my-artworks/${artwork.id}/digital-file/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: digitalFormData,
          });
        }

        addToast('Artwork submitted successfully!', 'success');
        navigate('/my-artworks');
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to create artwork');
        addToast(err.error || 'Failed to create artwork', 'error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      addToast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading form..." />;
  }

  const isApprovedArtist = user?.artist_profile?.status === 'approved';

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header />

      {isApprovedArtist && <ArtistSideNav />}

      <main className={`mx-auto w-full max-w-3xl px-6 py-10 page-enter flex-1 ${isApprovedArtist ? 'md:pl-60 xl:pl-72' : ''}`}>
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate('/my-artworks')} className="hover:text-amber-600 transition-colors">
              My Artworks
            </button>
            <span>/</span>
            <span className="font-medium text-stone-800">Create Artwork</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>Create New Artwork</h1>
          <p className="mt-2 text-stone-500">
            Add your artwork to the marketplace. It will be saved as a draft for review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              placeholder="Artwork title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              placeholder="Describe your artwork, materials, dimensions, story..."
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-stone-700 mb-2">
                Price (NPR) *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-stone-700 mb-2">
                Type *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                required
              >
                <option value="physical">Physical Artwork</option>
                <option value="digital">Digital Artwork</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-stone-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {formData.type === 'physical' && (
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-stone-700 mb-2">
                Stock Quantity *
              </label>
              <input
                id="stock"
                type="number"
                min="1"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                placeholder="1"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-stone-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              placeholder="landscape, oil painting, nature"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Images * (max 5)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            {previews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover border border-stone-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">Primary</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.type === 'digital' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Digital File *
              </label>
              <input
                type="file"
                accept=".zip,.rar,.pdf,.jpg,.png"
                onChange={(e) => setFormData({ ...formData, digital_file: e.target.files[0] })}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
              {formData.digital_file && (
                <p className="mt-1 text-sm text-stone-500">{formData.digital_file.name}</p>
              )}
            </div>
          )}

          <div className="flex items-start gap-3">
            <input
              id="originality_declaration"
              type="checkbox"
              checked={formData.originality_declaration}
              onChange={(e) => setFormData({ ...formData, originality_declaration: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
              required
            />
            <label htmlFor="originality_declaration" className="text-sm text-stone-700">
              I confirm that this artwork is my original creation and I have the right to sell it on Artisa.
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-stone-200">
            <button
              onClick={() => navigate('/my-artworks')}
              type="button"
              className="w-full sm:w-auto rounded-lg border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto rounded-lg bg-amber-600 px-8 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Create Artwork →'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateArtwork;
