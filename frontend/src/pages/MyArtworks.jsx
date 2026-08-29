import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ArtistSideNav from '../components/ArtistSideNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const MyArtworks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/artworks/my-artworks/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
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
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/artworks/${id}/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/artworks/my-artworks/${artworkId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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

  if (loading) {
    return <LoadingSpinner label="Loading your portfolio..." />;
  }

  const isApprovedArtist = user?.artist_profile?.status === 'approved';

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header />

      {isApprovedArtist && <ArtistSideNav artworkCount={artworks.length} />}

      <main className={`mx-auto w-full max-w-5xl px-6 py-10 page-enter flex-1 ${isApprovedArtist ? 'md:pl-60 xl:pl-72' : ''}`}>
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate(`/artists/${user?.username}`)} className="hover:text-amber-600 transition-colors">
              Artist Studio
            </button>
            <span>/</span>
            <span className="font-medium text-stone-800">My Artworks</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>My Artworks</h1>
              <p className="mt-1 text-stone-500">Manage your artwork portfolio and track review status.</p>
            </div>
            <button
              onClick={() => navigate('/artworks/create')}
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
            >
              + Create Artwork
            </button>
          </div>
        </div>

        {artworks.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <p className="text-stone-600 mb-4">You haven't created any artworks yet.</p>
            <button
              onClick={() => navigate('/artworks/create')}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
            >
              Create Your First Artwork
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {artwork.images && artwork.images.length > 0 && (
                    <div className="h-40 w-full sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      <img
                        src={artwork.images[0].image}
                        alt={artwork.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-stone-900">{artwork.title}</h3>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {artwork.type === 'physical' ? 'Physical' : 'Digital'} • NPR {artwork.price}
                        </p>
                      </div>
                      <span className={`inline-flex self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        artwork.status === 'draft'
                          ? 'bg-stone-100 text-stone-700'
                          : artwork.status === 'pending_review'
                          ? 'bg-amber-50 text-amber-700'
                          : artwork.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {artwork.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-sm text-stone-600 line-clamp-2">{artwork.description}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {artwork.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleSubmitForReview(artwork.id)}
                            disabled={submitting}
                            className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            Submit for Review
                          </button>
                          <button
                            onClick={() => deleteArtwork(artwork.id)}
                            className="rounded-lg border border-stone-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {artwork.status === 'pending_review' && (
                        <span className="text-xs text-amber-600">Awaiting admin review</span>
                      )}
                      {artwork.status === 'published' && (
                        <span className="text-xs text-emerald-600 font-medium">Published</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyArtworks;
