import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { trackInteraction } from '../services/api';
import RecommendedCarousel from '../components/RecommendedCarousel';

const ArtworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [artwork, setArtwork] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchArtwork();
    if (user) {
      checkFavorite();
    }
  }, [id, user]);

  useEffect(() => {
    if (artwork && user) {
      trackInteraction('artwork', id, 'view');
    }
  }, [artwork?.id, user]);

  const fetchArtwork = async () => {
    try {
      const response = await fetch(`/api/artworks/published/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setArtwork(data);
      } else {
        navigate('/marketplace');
      }
    } catch (err) {
      console.error('Error fetching artwork:', err);
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/auth/favorites/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const favorites = await response.json();
        setIsFavorite(favorites.some(f => f.artwork_id === id));
      }
    } catch (err) {
      console.error('Error checking favorite:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      if (isFavorite) {
        await fetch(`/api/auth/favorites/artwork/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setIsFavorite(false);
        addToast('Removed from wishlist', 'info');
      } else {
        await fetch('/api/auth/favorites/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ artwork_id: id }),
        });
        setIsFavorite(true);
        trackInteraction('artwork', id, 'favorite');
        addToast('Added to wishlist!', 'success');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      addToast('Failed to update wishlist', 'error');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/orders/cart/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ artwork_id: id, quantity: 1 }),
      });

      if (response.ok) {
        addToast('Added to cart!', 'success');
        trackInteraction('artwork', id, 'cart_add');
      } else {
        const err = await response.json();
        addToast(err.error || 'Failed to add to cart', 'error');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      addToast('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Revealing masterpiece details..." />;
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600">Artwork not found</div>
      </div>
    );
  }

  const primaryImage = artwork.images?.find(img => img.is_primary) || artwork.images?.[0];

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Image Gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-stone-100">
              {primaryImage ? (
                <img
                  src={primaryImage.image}
                  alt={artwork.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-stone-400">No image</span>
                </div>
              )}
            </div>
            
            {artwork.images && artwork.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {artwork.images.map((image) => (
                  <div
                    key={image.id}
                    className={`aspect-square overflow-hidden rounded-lg cursor-pointer border-2 ${
                      image.id === primaryImage.id ? 'border-stone-900' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image.image}
                      alt={artwork.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Artwork Details */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-stone-900">{artwork.title}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/artists/${artwork.artist.username}`)}
                    className="text-stone-600 hover:text-stone-900 transition"
                  >
                    <span className="font-medium">{artwork.artist.username}</span>
                  </button>
                  {artwork.artist.artist_profile?.verified_badge && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`flex-shrink-0 rounded-full p-3 transition ${
                  isFavorite
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <svg
                  className="h-6 w-6"
                  fill={isFavorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-6">
              <p className="text-3xl font-bold text-stone-900">NPR {artwork.price}</p>
              <p className="mt-1 text-sm text-stone-600 capitalize">{artwork.type}</p>
            </div>

            {artwork.type === 'physical' && (artwork.width || artwork.height || artwork.depth) && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-stone-900">Dimensions</h2>
                <div className="mt-2 text-stone-700">
                  {artwork.width && <span>{artwork.width} cm</span>}
                  {artwork.width && artwork.height && <span> × </span>}
                  {artwork.height && <span>{artwork.height} cm</span>}
                  {artwork.depth && (artwork.width || artwork.height) && <span> × </span>}
                  {artwork.depth && <span>{artwork.depth} cm</span>}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-stone-900">Description</h2>
              <p className="mt-2 text-stone-700 whitespace-pre-wrap">{artwork.description}</p>
            </div>

            {artwork.tags && artwork.tags.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-stone-900">Tags</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {artwork.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
                    >
                      {tag.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={addToCart}
                disabled={addingToCart}
                className="w-full rounded-lg bg-stone-900 px-6 py-4 text-sm font-medium text-white hover:bg-stone-800 transition disabled:opacity-50"
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <p className="mt-2 text-center text-sm text-stone-500">
                {artwork.type === 'physical'
                  ? `Stock: ${artwork.stock} available`
                  : 'Digital download available'}
              </p>
            </div>

            <div className="mt-8 rounded-xl bg-stone-100 p-6">
              <h3 className="font-semibold text-stone-900">About the Artist</h3>
              <p className="mt-2 text-sm text-stone-600">
                {artwork.artist.artist_profile?.bio || 'No bio available.'}
              </p>
              <button
                onClick={() => navigate(`/artists/${artwork.artist.username}`)}
                className="mt-4 text-sm font-medium text-stone-900 hover:text-stone-700 transition"
              >
                View Full Profile →
              </button>
            </div>
          </div>
        </div>

        {/* Similar Works */}
        <div className="mt-12">
          <RecommendedCarousel
            title="Similar Works"
            subtitle="You might also like these"
            endpoint={`/api/recs/similar/${id}/?k=8`}
          />
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-stone-900">Reviews</h2>
          <p className="mt-2 text-stone-600">Reviews coming soon...</p>
        </div>
      </main>
    </div>
  );
};

export default ArtworkDetail;
