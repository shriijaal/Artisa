import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { trackInteraction } from '../services/api';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [artworks, setArtworks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/auth/favorites/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
        data.forEach(fav => fetchArtworkDetail(fav.artwork_id));
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtworkDetail = async (artworkId) => {
    try {
      const response = await fetch(`/api/artworks/published/${artworkId}/`);
      if (response.ok) {
        const data = await response.json();
        setArtworks(prev => ({ ...prev, [artworkId]: data }));
      }
    } catch (err) {
      console.error('Error fetching artwork:', err);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`/api/auth/favorites/${favoriteId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      addToast('Removed from wishlist', 'info');
    } catch (err) {
      console.error('Error removing favorite:', err);
      addToast('Failed to remove item', 'error');
    }
  };

  const addToCart = async (artworkId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/orders/cart/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ artwork_id: artworkId, quantity: 1 }),
      });
      if (response.ok) {
        trackInteraction('artwork', artworkId, 'cart_add');
        addToast('Added to cart!', 'success');
      } else {
        const err = await response.json();
        addToast(err.error || 'Failed to add to cart', 'error');
      }
    } catch (err) {
      addToast('Failed to add to cart', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading your wishlist..." />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="mx-auto max-w-4xl px-6 py-10 page-enter">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate('/marketplace')} className="hover:text-amber-600 transition-colors">
              Marketplace
            </button>
            <span>/</span>
            <span className="font-medium text-stone-800">My Wishlist</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Wishlist
          </h1>
          <p className="mt-2 text-stone-500">
            {favorites.length} item{favorites.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-1">Your wishlist is empty</h3>
            <p className="text-stone-500 text-sm mb-6">Browse the marketplace and save artworks you love.</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
            >
              Browse Artworks
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => {
              const artwork = artworks[favorite.artwork_id];
              if (!artwork) return (
                <div key={favorite.id} className="rounded-2xl border border-stone-200 bg-white p-6 animate-pulse">
                  <div className="flex gap-6">
                    <div className="h-28 w-28 rounded-xl bg-stone-200 flex-shrink-0" />
                    <div className="flex-1 space-y-3 pt-2">
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              );

              const primaryImage = artwork.images?.find(img => img.is_primary) || artwork.images?.[0];

              return (
                <div key={favorite.id} className="group rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                    {/* Thumbnail */}
                    <div
                      className="h-40 w-full sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100 cursor-pointer"
                      onClick={() => navigate(`/artworks/${artwork.id}`)}
                    >
                      {primaryImage ? (
                        <img
                          src={primaryImage.image}
                          alt={artwork.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <svg className="h-8 w-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3
                            className="text-base font-semibold text-stone-900 truncate cursor-pointer hover:text-amber-600 transition-colors"
                            onClick={() => navigate(`/artworks/${artwork.id}`)}
                          >
                            {artwork.title}
                          </h3>
                          <p className="mt-0.5 text-sm text-stone-500">
                            by <span className="font-medium text-stone-700">{artwork.artist?.username}</span>
                          </p>
                          <p className="mt-2 text-lg font-bold text-amber-700">
                            NPR {artwork.price.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFavorite(favorite.id)}
                          className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/artworks/${artwork.id}`)}
                          className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => addToCart(artwork.id)}
                          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
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

export default Wishlist;
