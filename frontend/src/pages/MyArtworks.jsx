import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ArtistSideNav from '../components/ArtistSideNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import authFetch from '../utils/authFetch';

const MyArtworks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const response = await authFetch('/api/artworks/my-artworks/');
      if (response.ok) {
        const data = await response.json();
        setArtworks(data);
      }
    } catch (err) {
      console.error('Error fetching artworks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (id) => {
    setSubmitting(true);
    try {
      const response = await authFetch(`/api/artworks/${id}/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originality_declaration: true }),
      });
      if (response.ok) {
        addToast('Artwork submitted for review', 'success');
        fetchArtworks();
      } else {
        addToast('Failed to submit artwork', 'error');
      }
    } catch (err) {
      console.error('Error submitting artwork:', err);
      addToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteArtwork = async (artworkId) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    try {
      const response = await authFetch(`/api/artworks/my-artworks/${artworkId}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        addToast('Artwork deleted', 'info');
        fetchArtworks();
      } else {
        addToast('Failed to delete artwork', 'error');
      }
    } catch (err) {
      console.error('Error deleting artwork:', err);
      addToast('Network error', 'error');
    }
  };

  const cancelSubmission = async (artworkId) => {
    if (!confirm('Cancel this submission? The artwork will return to draft.')) return;

    try {
      const response = await authFetch(`/api/artworks/my-artworks/${artworkId}/cancel/`, {
        method: 'POST',
      });
      if (response.ok) {
        addToast('Submission cancelled', 'info');
        fetchArtworks();
      } else {
        addToast('Failed to cancel submission', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-stone-100 text-stone-700';
      case 'pending_review': return 'bg-amber-50 text-amber-700';
      case 'published': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-red-50 text-red-700';
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading your portfolio..." />;
  }

  const isApprovedArtist = user?.artist_profile?.status === 'approved';

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />

      {isApprovedArtist && <ArtistSideNav artworkCount={artworks.length} />}

      <main className={`mx-auto w-full max-w-5xl px-6 py-10 page-enter flex-1 ${isApprovedArtist ? 'md:pl-60 xl:pl-72' : ''}`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate(`/artists/${user?.username}`)} className="hover:text-[#9c4327] transition-colors">
              Artist Studio
            </button>
            <span>/</span>
            <span className="font-medium text-stone-800">My Artworks</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">My Artworks</h1>
              <p className="mt-1 text-stone-500">Manage your artwork portfolio and track review status.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              {artworks.length > 0 && (
                <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                    title="Grid view"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                    title="List view"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              )}
              <button
                onClick={() => navigate('/artworks/create')}
                className="rounded-lg bg-[#000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition-colors"
              >
                + Create Artwork
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {artworks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-700 mb-1 font-heading">Your Gallery is Empty</h3>
            <p className="text-stone-500 text-sm max-w-xs mx-auto mb-4">
              Start building your portfolio by uploading your first original physical or digital artwork.
            </p>
            <button
              onClick={() => navigate('/artworks/create')}
              className="rounded-lg bg-[#000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition"
            >
              + Create First Artwork
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View — masonry layout matching profile page */
          <div className="columns-2 sm:columns-3 gap-3 space-y-3">
            {artworks.map((artwork, idx) => {
              const primaryImage = artwork.images?.find((img) => img.is_primary) || artwork.images?.[0];
              const aspects = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/3]', 'aspect-[5/6]', 'aspect-[3/2]'];
              const aspectClass = aspects[idx % aspects.length];
              const artworkType = artwork.type;
              return (
                <div
                  key={artwork.id}
                  onClick={() => navigate(`/artworks/${artwork.id}`)}
                  className="group cursor-pointer break-inside-avoid rounded-lg overflow-hidden relative bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/artworks/${artwork.id}`); } }}
                >
                  {primaryImage ? (
                    <img
                      src={primaryImage.image}
                      alt={artwork.title}
                      className={`w-full ${aspectClass} object-cover group-hover:scale-105 transition-transform duration-500`}
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full ${aspectClass} flex items-center justify-center text-stone-300 bg-stone-100`}>
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Type pill */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-stone-800 shadow-sm border border-white/40">
                      <span className={`h-1.5 w-1.5 rounded-full ${artworkType === 'physical' ? 'bg-[#9c4327]' : 'bg-stone-500'}`} />
                      {artworkType === 'physical' ? 'Physical' : 'Digital'}
                    </span>
                  </div>

                  {/* Status pill — show for non-published */}
                  {artwork.status !== 'published' && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] shadow-sm ${statusColor(artwork.status)}`}>
                        {artwork.status === 'pending_review' ? 'Pending' : artwork.status.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                    <p className="text-white text-sm font-semibold line-clamp-1 font-heading">{artwork.title}</p>
                    <p className="text-[#fc8d6b] text-xs font-bold mt-0.5">
                      NPR {artwork.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View — compact editorial rows */
          <div className="grid gap-px bg-stone-200 rounded-lg overflow-hidden border border-stone-200">
            {artworks.map((artwork) => {
              const primaryImage = artwork.images?.find((img) => img.is_primary) || artwork.images?.[0];
              return (
                <div
                  key={artwork.id}
                  className="group bg-white flex items-center gap-4 px-4 py-3 hover:bg-stone-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-400"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/artworks/${artwork.id}`); }}
                >
                  {/* Thumbnail */}
                  <div className="h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100">
                    {primaryImage ? (
                      <img src={primaryImage.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg className="h-5 w-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-sm font-semibold text-stone-900 truncate cursor-pointer hover:text-[#9c4327] transition-colors"
                        onClick={() => navigate(`/artworks/${artwork.id}`)}
                      >
                        {artwork.title}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-stone-400">
                        {artwork.type === 'physical' ? 'Physical' : 'Digital'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-stone-500">NPR {artwork.price.toLocaleString()}</span>
                      {artwork.status !== 'published' && (
                        <>
                          <span className="text-stone-300">·</span>
                          <span className={`inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.03em] ${statusColor(artwork.status)}`}>
                            {artwork.status === 'pending_review' ? 'Pending' : artwork.status}
                          </span>
                        </>
                      )}
                      {artwork.status === 'published' && (
                        <>
                          <span className="text-stone-300">·</span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-emerald-600">Published</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {artwork.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleSubmitForReview(artwork.id)}
                          disabled={submitting}
                          className="rounded-lg bg-[#000] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => deleteArtwork(artwork.id)}
                          className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {artwork.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => cancelSubmission(artwork.id)}
                          className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteArtwork(artwork.id)}
                          className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {artwork.status === 'published' && (
                      <button
                        onClick={() => navigate(`/artworks/${artwork.id}`)}
                        className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyArtworks;
