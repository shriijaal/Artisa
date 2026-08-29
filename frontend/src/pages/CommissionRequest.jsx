import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const CommissionRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const artistId = searchParams.get('artist');
  const artistUsername = searchParams.get('username');

  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refUploading, setRefUploading] = useState(false);
  const [referenceImages, setReferenceImages] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
  });

  useEffect(() => {
    if (!artistId && !artistUsername) {
      navigate('/marketplace');
      return;
    }
    fetchArtist();
  }, [artistId, artistUsername]);

  const fetchArtist = async () => {
    try {
      const identifier = artistUsername || artistId;
      const response = await fetch(`/api/auth/artists/${identifier}/`);
      if (response.ok) {
        setArtist(await response.json());
      } else {
        addToast('Artist not found', 'error');
        navigate('/marketplace');
      }
    } catch {
      addToast('Failed to load artist', 'error');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRefUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (referenceImages.length >= 5) {
      addToast('Maximum 5 reference images', 'error');
      return;
    }

    setRefUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/commissions/upload-ref/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setReferenceImages([...referenceImages, { id: data.id, url: data.url }]);
        addToast('Reference image uploaded', 'success');
      } else {
        addToast('Failed to upload image', 'error');
      }
    } catch {
      addToast('Upload failed', 'error');
    } finally {
      setRefUploading(false);
      e.target.value = '';
    }
  };

  const removeRef = (id) => {
    setReferenceImages(referenceImages.filter(r => r.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      addToast('Title is required', 'error');
      return;
    }
    if (!form.description.trim()) {
      addToast('Description is required', 'error');
      return;
    }
    if (!form.budget_min || !form.budget_max) {
      addToast('Both budget fields are required', 'error');
      return;
    }
    if (Number(form.budget_min) > Number(form.budget_max)) {
      addToast('Min budget must be less than or equal to max', 'error');
      return;
    }
    if (!form.deadline) {
      addToast('Deadline is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const targetArtistId = artist?.user?.id || artist?.id || artistId || artistUsername;

      const response = await fetch('/api/commissions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          artist_id: targetArtistId,
          title: form.title.trim(),
          description: form.description.trim(),
          budget_min: Number(form.budget_min),
          budget_max: Number(form.budget_max),
          deadline: form.deadline,
          reference_images: referenceImages.map(r => r.url),
          reference_image_ids: referenceImages.map(r => r.id).filter(id => id && typeof id === 'string'),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addToast('Commission request sent!', 'success');
        navigate(`/commissions/${data.id}`);
      } else {
        const err = await response.json();
        const msg = Object.values(err).flat().join(', ');
        addToast(msg || 'Failed to create commission', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading artist info..." />;
  if (!artist) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          Request a Commission
        </h1>

        {/* Artist Card (read-only) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white shadow overflow-hidden flex-shrink-0">
              {artist.user?.avatar ? (
                <img src={artist.user.avatar} alt={artist.user.username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600">
                  <span className="text-xl font-bold text-white">
                    {artist.user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900">
                  {artist.user?.first_name || artist.user?.username}
                  {artist.user?.last_name ? ` ${artist.user.last_name}` : ''}
                </h2>
                {artist.verified_badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-500">@{artist.user?.username}</p>
              {artist.bio && <p className="text-sm text-stone-600 mt-1 line-clamp-2">{artist.bio}</p>}
            </div>
          </div>
        </div>

        {/* Commission Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Custom portrait painting"
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Brief Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what you want in detail — style, size, colors, references, etc."
              rows={6}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Min Budget (NPR) *</label>
              <input
                type="number"
                name="budget_min"
                value={form.budget_min}
                onChange={handleChange}
                placeholder="5000"
                min="100"
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Max Budget (NPR) *</label>
              <input
                type="number"
                name="budget_max"
                value={form.budget_max}
                onChange={handleChange}
                placeholder="20000"
                min="100"
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Deadline *</label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Reference Images ({referenceImages.length}/5)
            </label>
            <div className="flex flex-wrap gap-3">
              {referenceImages.map(ref => (
                <div key={ref.id} className="relative h-20 w-20 rounded-lg overflow-hidden border border-stone-200">
                  <img src={ref.url} alt="Reference" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeRef(ref.id)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    x
                  </button>
                </div>
              ))}
              {referenceImages.length < 5 && (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-stone-400 hover:border-stone-500 hover:text-stone-600 transition">
                  <input type="file" accept="image/*" onChange={handleRefUpload} className="hidden" />
                  {refUploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-amber-600 px-6 py-4 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-50 shadow-sm"
          >
            {submitting ? 'Sending Request...' : 'Send Commission Request'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CommissionRequest;
