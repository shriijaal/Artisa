import { useState, useEffect, useCallback } from 'react';
import authFetch from '../utils/authFetch';

const statusColors = {
  draft: 'bg-stone-100 text-stone-600',
  pending_review: 'bg-amber-50 text-amber-700',
  published: 'bg-emerald-50 text-emerald-700',
  removed: 'bg-red-50 text-red-700',
};

const AdminArtworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);

  const fetchArtworks = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    authFetch(`/api/admin/artworks/?${params}`)
      .then((r) => r.json())
      .then(setArtworks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (message, artworkId, action) => {
    setToast({ message, artworkId, action });
  };

  const handleAction = async (artworkId, action) => {
    if (action === 'remove') {
      const res = await authFetch(`/api/admin/artworks/${artworkId}/remove/`, { method: 'PUT' });
      if (res.ok) {
        setArtworks((prev) => prev.filter((a) => a.id !== artworkId));
        showToast('Artwork removed', artworkId, 'remove');
      }
    } else if (action === 'restore') {
      const res = await authFetch(`/api/admin/artworks/${artworkId}/restore/`, { method: 'PUT' });
      if (res.ok) {
        setArtworks((prev) => prev.filter((a) => a.id !== artworkId));
        showToast('Artwork restored', artworkId, 'restore');
      }
    } else {
      const res = await authFetch(`/api/admin/artworks/${artworkId}/${action}/`, { method: 'PUT' });
      if (res.ok) fetchArtworks();
    }
  };

  const handleUndo = async () => {
    if (!toast) return;
    const { artworkId, action } = toast;
    const reverseAction = action === 'remove' ? 'restore' : 'remove';
    const res = await authFetch(`/api/admin/artworks/${artworkId}/${reverseAction}/`, { method: 'PUT' });
    if (res.ok) {
      setToast(null);
      fetchArtworks();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Artworks</h1>
        <p className="text-sm text-stone-500 mt-1">Moderate artwork submissions</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-stone-900 text-white px-5 py-3 rounded-lg shadow-lg animate-[slideUp_0.2s_ease-out]">
          <span className="text-sm">{toast.message}</span>
          <button
            onClick={handleUndo}
            className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Undo
          </button>
          <button onClick={() => setToast(null)} className="ml-1 text-stone-400 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or artist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="published">Published</option>
          <option value="removed">Removed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All Types</option>
          <option value="physical">Physical</option>
          <option value="digital">Digital</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        </div>
      ) : artworks.length === 0 ? (
        <div className="text-center py-12 text-stone-500 text-sm">No artworks found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="bg-white rounded-lg border border-stone-200 overflow-hidden group">
              <div className="aspect-square bg-stone-100 relative overflow-hidden">
                {artwork.primary_image ? (
                  <img src={artwork.primary_image} alt={artwork.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
                    </svg>
                  </div>
                )}
                <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[artwork.status] || 'bg-stone-100 text-stone-600'}`}>
                  {artwork.status.replace('_', ' ')}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-stone-900 truncate">{artwork.title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{artwork.artist_name}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-stone-900">NPR {artwork.price}</span>
                  <span className="text-xs text-stone-400">{artwork.type}</span>
                </div>
                {artwork.status === 'pending_review' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAction(artwork.id, 'publish')}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => handleAction(artwork.id, 'reject')}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {artwork.status === 'published' && (
                  <button
                    onClick={() => handleAction(artwork.id, 'remove')}
                    className="w-full mt-3 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                )}
                {artwork.status === 'removed' && (
                  <button
                    onClick={() => handleAction(artwork.id, 'restore')}
                    className="w-full mt-3 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminArtworks;
