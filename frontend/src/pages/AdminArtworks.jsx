import { useState, useEffect, useCallback } from 'react';
import authFetch from '../utils/authFetch';
import { formatPrice } from '../utils/formatPrice';
import CustomSelect from '../components/CustomSelect';

const statusColors = {
  draft: 'bg-stone-100 text-stone-600',
  pending_review: 'bg-amber-50 text-amber-700',
  published: 'bg-emerald-50 text-emerald-700',
  removed: 'bg-red-50 text-red-700',
};

const tabs = [
  { key: '', label: 'All' },
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'removed', label: 'Removed' },
];

const AdminArtworks = () => {
  const [allArtworks, setAllArtworks] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [rejectModal, setRejectModal] = useState({ open: false, artworkId: null, reason: '' });

  const fetchArtworks = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (typeFilter) params.set('type', typeFilter);
    authFetch(`/api/admin/artworks/?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setAllArtworks(data);
        setArtworks(activeTab ? data.filter((a) => a.status === activeTab) : data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, typeFilter, activeTab]);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

  // Instantly filter from cached data when tab changes
  useEffect(() => {
    if (allArtworks.length > 0) {
      setArtworks(activeTab ? allArtworks.filter((a) => a.status === activeTab) : allArtworks);
    }
  }, [activeTab, allArtworks]);

  useEffect(() => {
    if (!toast) { setCountdown(0); return; }
    setCountdown(6);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setToast(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [toast]);

  const showToast = (message, artworkId, action) => {
    setToast({ message, artworkId, action });
  };

  const removeArtwork = (artworkId) => {
    setAllArtworks((prev) => prev.filter((a) => a.id !== artworkId));
    setArtworks((prev) => prev.filter((a) => a.id !== artworkId));
  };

  const handleAction = async (artworkId, action) => {
    if (action === 'remove') {
      const res = await authFetch(`/api/admin/artworks/${artworkId}/remove/`, { method: 'PUT' });
      if (res.ok) {
        removeArtwork(artworkId);
        showToast('Artwork removed', artworkId, 'remove');
      }
    } else if (action === 'restore') {
      const res = await authFetch(`/api/admin/artworks/${artworkId}/restore/`, { method: 'PUT' });
      if (res.ok) {
        removeArtwork(artworkId);
        showToast('Artwork restored', artworkId, 'restore');
      }
    } else if (action === 'reject') {
      setRejectModal({ open: true, artworkId, reason: '' });
    } else {
      const res = await authFetch(`/api/admin/artworks/${artworkId}/${action}/`, { method: 'PUT' });
      if (res.ok) fetchArtworks();
    }
  };

  const handleConfirmReject = async () => {
    const { artworkId, reason } = rejectModal;
    if (!reason.trim()) return;
    const res = await authFetch(`/api/admin/artworks/${artworkId}/reject/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    if (res.ok) {
      setRejectModal({ open: false, artworkId: null, reason: '' });
      removeArtwork(artworkId);
      showToast('Artwork rejected', artworkId, 'reject');
    }
  };

  const handleUndo = async () => {
    if (!toast) return;
    const { artworkId, action } = toast;
    let reverseAction;
    if (action === 'remove') reverseAction = 'restore';
    else if (action === 'restore') reverseAction = 'remove';
    else if (action === 'reject') reverseAction = 'publish';
    else return;
    const res = await authFetch(`/api/admin/artworks/${artworkId}/${reverseAction}/`, { method: 'PUT' });
    if (res.ok) {
      setToast(null);
      fetchArtworks();
    }
  };

  const getCount = (status) => {
    if (!status) return allArtworks.length;
    return allArtworks.filter((a) => a.status === status).length;
  };

  const renderPendingCard = (artwork) => (
    <div key={artwork.id} className="bg-white rounded-lg border border-stone-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-48 h-48 sm:h-auto bg-stone-100 shrink-0 overflow-hidden">
          {artwork.primary_image ? (
            <img src={artwork.primary_image} alt={artwork.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">{artwork.title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">by {artwork.artist_name}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 whitespace-nowrap">Pending Review</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-bold text-stone-900">NPR {formatPrice(artwork.price)}</span>
              <span className="text-xs text-stone-400">{artwork.type}</span>
              {artwork.category_name && <span className="text-xs text-stone-400">{artwork.category_name}</span>}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleAction(artwork.id, 'publish')}
              className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Publish
            </button>
            <button
              onClick={() => handleAction(artwork.id, 'reject')}
              className="flex-1 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompactCard = (artwork, actions) => (
    <div key={artwork.id} className="bg-white rounded-lg border border-stone-200 overflow-hidden group">
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        {artwork.primary_image ? (
          <img src={artwork.primary_image} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
        )}
        <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[artwork.status] || 'bg-stone-100 text-stone-600'}`}>
          {artwork.status.replace('_', ' ')}
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-xs font-semibold text-stone-900 truncate">{artwork.title}</h3>
        <p className="text-[11px] text-stone-500 mt-0.5">{artwork.artist_name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-bold text-stone-900">NPR {formatPrice(artwork.price)}</span>
          <span className="text-[10px] text-stone-400">{artwork.type}</span>
        </div>
        {actions && <div className="mt-2">{actions}</div>}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        </div>
      );
    }

    if (artworks.length === 0) {
      return <div className="text-center py-12 text-stone-500 text-sm">No artworks found</div>;
    }

    if (activeTab === 'pending_review') {
      return (
        <div className="space-y-4">
          {artworks.map(renderPendingCard)}
        </div>
      );
    }

    if (activeTab === 'published') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {artworks.map((artwork) =>
            renderCompactCard(artwork, (
              <button
                onClick={() => handleAction(artwork.id, 'remove')}
                className="w-full px-3 py-1.5 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Remove
              </button>
            ))
          )}
        </div>
      );
    }

    if (activeTab === 'draft') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {artworks.map((artwork) =>
            renderCompactCard(artwork, (
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleAction(artwork.id, 'submit')}
                  className="flex-1 px-3 py-1.5 text-[10px] font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Submit
                </button>
                <button
                  onClick={() => handleAction(artwork.id, 'delete')}
                  className="px-3 py-1.5 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeTab === 'removed') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 opacity-60">
          {artworks.map((artwork) =>
            renderCompactCard(artwork, (
              <button
                onClick={() => handleAction(artwork.id, 'restore')}
                className="w-full px-3 py-1.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Restore
              </button>
            ))
          )}
        </div>
      );
    }

    // All tab - mixed grid
    return (
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
                <span className="text-sm font-bold text-stone-900">NPR {formatPrice(artwork.price)}</span>
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
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Artworks</h1>
        <p className="text-sm text-stone-500 mt-1">Moderate artwork submissions</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-80 bg-stone-900 text-white rounded-lg shadow-lg overflow-hidden animate-[slideUp_0.2s_ease-out]">
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="text-sm flex-1">{toast.message}</span>
            <button
              onClick={handleUndo}
              className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Undo ({countdown}s)
            </button>
            <button onClick={() => setToast(null)} className="text-stone-400 hover:text-white transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="h-0.5 bg-stone-700">
            <div
              className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 6) * 100}%` }}
            />
          </div>
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
        <CustomSelect
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="All Types"
          options={[
            { value: '', label: 'All Types' },
            { value: 'physical', label: 'Physical' },
            { value: 'digital', label: 'Digital' },
          ]}
          className="w-full sm:w-40"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const count = getCount(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Rejection Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-stone-900">Reject Artwork</h3>
            <p className="text-sm text-stone-500 mt-1">Please provide a reason for rejecting this artwork. The artist will be notified.</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Image quality too low, description incomplete, not original work..."
              className="mt-4 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-300 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectModal({ open: false, artworkId: null, reason: '' })}
                className="flex-1 px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectModal.reason.trim()}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Reject Artwork
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArtworks;
