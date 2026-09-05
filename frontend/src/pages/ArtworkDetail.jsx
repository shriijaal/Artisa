import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { trackInteraction } from '../services/api';
import authFetch from '../utils/authFetch';
import RecommendedCarousel from '../components/RecommendedCarousel';

const StarRating = ({ rating, size = 'sm', interactive = false, onChange }) => {
  const [hover, setHover] = useState(0);
  const starSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <svg
            className={`${starSize} ${
              star <= (hover || rating) ? 'text-amber-500' : 'text-stone-200'
            } transition-colors`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

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
  const [isInCart, setIsInCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [purchasedItemId, setPurchasedItemId] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // Carousel state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);
  const resumeTimerRef = useRef(null);

  useEffect(() => {
    fetchArtwork();
    if (user) {
      checkFavorite();
      checkInCart();
    }
  }, [id, user]);

  useEffect(() => {
    if (artwork && user) {
      trackInteraction('artwork', id, 'view');
    }
  }, [artwork?.id, user]);

  useEffect(() => {
    fetchReviews();
    if (user) checkPurchased();
  }, [id, user]);

  // Carousel auto-advance
  useEffect(() => {
    if (!artwork || artwork.images?.length <= 1 || !isAutoPlaying) {
      clearInterval(autoPlayRef.current);
      return;
    }
    autoPlayRef.current = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % artwork.images.length);
    }, 4000);
    return () => clearInterval(autoPlayRef.current);
  }, [artwork?.images?.length, isAutoPlaying]);

  // Cleanup resume timer on unmount
  useEffect(() => {
    return () => clearTimeout(resumeTimerRef.current);
  }, []);

  const handleImageSelect = useCallback((index) => {
    setSelectedImageIndex(index);
    setIsAutoPlaying(false);
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setIsAutoPlaying(true), 8000);
  }, []);

  const handleCarouselHover = useCallback((entering) => {
    if (entering) {
      setIsAutoPlaying(false);
    } else {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => setIsAutoPlaying(true), 3000);
    }
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/?artwork_id=${id}`);
      if (response.ok) {
        setReviews(await response.json());
      }
    } catch {}
  };

  const checkPurchased = async () => {
    try {
      const res = await authFetch('/api/orders/');
      if (res.ok) {
        const orders = await res.json();
        for (const order of orders) {
          if (order.status === 'delivered' || order.status === 'completed') {
            for (const item of order.items || []) {
              if (item.artwork?.id === id) {
                const alreadyReviewed = reviews.some(r => r.artwork === id);
                if (!alreadyReviewed) {
                  setPurchasedItemId(item.id);
                }
                return;
              }
            }
          }
        }
      }
    } catch {}
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewRating || !reviewComment.trim() || !purchasedItemId) return;
    setSubmittingReview(true);
    try {
      const res = await authFetch('/api/reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_item_id: purchasedItemId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews((prev) => [newReview, ...prev]);
        setHasReviewed(true);
        setPurchasedItemId(null);
        setReviewRating(0);
        setReviewComment('');
        addToast('Review submitted!', 'success');
      } else {
        const err = await res.json();
        addToast(err.order_item_id?.[0] || err.detail || 'Failed to submit review', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

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
      const response = await authFetch('/api/auth/favorites/');
      if (response.ok) {
        const favorites = await response.json();
        setIsFavorite(favorites.some(f => f.artwork_id === id));
      }
    } catch (err) {
      console.error('Error checking favorite:', err);
    }
  };

  const checkInCart = async () => {
    try {
      const response = await authFetch('/api/orders/cart/');
      if (response.ok) {
        const cartItems = await response.json();
        setIsInCart(cartItems.some(item => String(item.artwork?.id) === String(id)));
      }
    } catch {}
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await authFetch(`/api/auth/favorites/artwork/${id}/`, {
          method: 'DELETE',
        });
        setIsFavorite(false);
        addToast('Removed from wishlist', 'info');
      } else {
        await authFetch('/api/auth/favorites/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      const response = await authFetch('/api/orders/cart/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artwork_id: id, quantity: 1 }),
      });

      if (response.ok) {
        setIsInCart(true);
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

  const formatCreatedDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <LoadingSpinner label="Revealing masterpiece details..." />;
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-stone-600">Artwork not found</div>
      </div>
    );
  }

  const images = artwork.images || [];
  const currentImage = images[selectedImageIndex] || images[0];
  const hasMultipleImages = images.length > 1;
  const isPhysical = artwork.type === 'physical';
  const hasDimensions = isPhysical && (artwork.width || artwork.height || artwork.depth);

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Top Section: Image + Details */}
        <div className="grid gap-10 lg:grid-cols-2">

          {/* ─── Left: Image Carousel ─── */}
          <div
            className="group/carousel"
            onMouseEnter={() => handleCarouselHover(true)}
            onMouseLeave={() => handleCarouselHover(false)}
          >
            {/* Main Image */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-stone-100">
              {currentImage ? (
                <img
                  key={currentImage.id}
                  src={currentImage.image}
                  alt={artwork.title}
                  className="absolute inset-0 h-full w-full object-cover animate-[fadeIn_0.4s_ease-out]"
                  style={{ animation: 'fadeIn 0.4s ease-out' }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-stone-400">No image</span>
                </div>
              )}

              {/* Image counter badge */}
              {hasMultipleImages && (
                <div className="absolute top-4 right-4 rounded-lg bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {hasMultipleImages && (
              <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {images.map((image, idx) => (
                  <button
                    key={image.id}
                    onClick={() => handleImageSelect(idx)}
                    className={`relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                      idx === selectedImageIndex
                        ? 'ring-2 ring-stone-900 opacity-100'
                        : 'opacity-40 hover:opacity-70 ring-1 ring-stone-200'
                    }`}
                  >
                    <img
                      src={image.image}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Right: Details Panel ─── */}
          <div className="flex flex-col">
            {/* Title + Favorite + Share */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight font-heading">
                {artwork.title}
              </h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    if (navigator.share) {
                      navigator.share({ title: artwork.title, url });
                    } else {
                      navigator.clipboard.writeText(url);
                      addToast('Link copied to clipboard', 'success');
                    }
                  }}
                  className="rounded-full p-2.5 bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition"
                  title="Share"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className={`rounded-full p-2.5 transition ${
                    isFavorite
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600'
                  }`}
                >
                  <svg className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Artist */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-stone-500">by</span>
              <button
                onClick={() => navigate(`/artists/${artwork.artist.username}`)}
                className="text-sm font-medium text-stone-900 hover:text-[#9c4327] transition-colors"
              >
                {artwork.artist.first_name || artwork.artist.username}
                {artwork.artist.last_name ? ` ${artwork.artist.last_name}` : ''}
              </button>
              {artwork.artist.artist_profile?.verified_badge && (
                <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
                </svg>
              )}
            </div>

            {/* Price + Rating */}
            <div className="mt-5 flex items-center gap-4 flex-wrap">
              <p className="text-2xl font-bold text-stone-900 font-heading">
                NPR {artwork.price?.toLocaleString()}
              </p>
              {artwork.review_count > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-3.5 w-3.5 ${star <= Math.round(artwork.avg_rating) ? 'text-amber-500' : 'text-stone-300'}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-stone-900">{artwork.avg_rating}</span>
                  <span className="text-xs text-stone-500">({artwork.review_count})</span>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-stone-200 pt-5">
              <DetailRow label="Type" value={isPhysical ? 'Physical' : 'Digital'} />
              {artwork.category && <DetailRow label="Category" value={artwork.category.name} />}
              {hasDimensions && (
                <DetailRow
                  label="Dimensions"
                  value={
                    [
                      artwork.width && `${artwork.width} cm`,
                      artwork.height && `${artwork.height} cm`,
                      artwork.depth && `${artwork.depth} cm`,
                    ].filter(Boolean).join(' × ')
                  }
                />
              )}
              {artwork.created_at && <DetailRow label="Created" value={formatCreatedDate(artwork.created_at)} />}
              {isPhysical && (
                <DetailRow
                  label="Stock"
                  value={
                    artwork.stock != null
                      ? `${artwork.stock} available`
                      : artwork.stock_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Available'
                  }
                />
              )}
              {artwork.originality_confirmed && (
                <DetailRow label="Originality" value="Confirmed" icon={
                  <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
                  </svg>
                } />
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-7 space-y-3">
              <button
                onClick={isInCart ? () => navigate('/cart') : addToCart}
                disabled={addingToCart}
                className={`w-full rounded-lg px-6 py-3.5 text-sm font-semibold transition ${
                  isInCart
                    ? 'bg-stone-200 text-stone-500 cursor-default'
                    : 'bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50'
                }`}
              >
                {addingToCart ? 'Adding...' : isInCart ? 'In Cart — View Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  navigate(`/checkout?buy_now=${artwork.id}`);
                }}
                className="w-full rounded-lg border border-stone-900 px-6 py-3.5 text-sm font-semibold text-stone-900 hover:bg-stone-900 hover:text-white transition"
              >
                Purchase Now
              </button>
              <button
                onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  navigate(`/messages?artist=${artwork.artist.id}&username=${artwork.artist.username}`);
                }}
                className="w-full text-center text-sm font-medium text-stone-500 hover:text-stone-900 transition py-1"
              >
                Contact for Inquiry →
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 rounded-lg bg-stone-50 border border-stone-200 p-4 space-y-2.5">
              {artwork.originality_confirmed && (
                <TrustBadge
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  text="Authenticity Confirmed"
                />
              )}
              {isPhysical && (
                <>
                  <TrustBadge
                    icon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    }
                    text="Secure Shipping"
                  />
                  <TrustBadge
                    icon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    }
                    text="Signed by Artist"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── Below: Tabbed Content ─── */}
        <div className="mt-16">
          {/* Tab Bar */}
          <div className="flex gap-6 border-b border-stone-200">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'description'
                  ? 'text-stone-900 font-semibold'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Description
              {activeTab === 'description' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('artist')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'artist'
                  ? 'text-stone-900 font-semibold'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Artist
              {activeTab === 'artist' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-full" />
              )}
            </button>
            {reviews.length > 0 && (
              <button
                onClick={() => setActiveTab('ratings')}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'ratings'
                    ? 'text-stone-900 font-semibold'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Ratings
                {activeTab === 'ratings' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-full" />
                )}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === 'description' ? (
              <div>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{artwork.description}</p>

                {/* Tags — inline at bottom */}
                {artwork.tags && artwork.tags.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {artwork.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-stone-100 border border-stone-200 px-3 py-1 text-xs font-medium text-stone-600"
                      >
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-6">
                {/* Artist Avatar */}
                <div className="h-14 w-14 flex-shrink-0 rounded-full bg-stone-200 overflow-hidden">
                  {artwork.artist.avatar ? (
                    <img src={artwork.artist.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600">
                      <span className="text-lg font-bold text-white font-heading">
                        {artwork.artist.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900 font-heading">
                      {artwork.artist.first_name || artwork.artist.username}
                      {artwork.artist.last_name ? ` ${artwork.artist.last_name}` : ''}
                    </h3>
                    {artwork.artist.artist_profile?.verified_badge && (
                      <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-stone-600 leading-relaxed">
                    {artwork.artist.artist_profile?.bio || 'No artist statement available.'}
                  </p>
                  <button
                    onClick={() => navigate(`/artists/${artwork.artist.username}`)}
                    className="mt-3 text-sm font-medium text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
                  >
                    View Full Profile →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Ratings Summary ─── */}
        {activeTab === 'ratings' && reviews.length > 0 && (() => {
          const distribution = [0, 0, 0, 0, 0];
          reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++; });
          const maxCount = Math.max(...distribution, 1);
          return (
            <div className="mt-16 flex flex-col sm:flex-row gap-10 items-start">
              {/* Left: Big average */}
              <div className="text-center sm:text-left flex-shrink-0">
                <p className="text-5xl font-bold text-stone-900 font-heading">{artwork.avg_rating || '—'}</p>
                <div className="mt-2 flex items-center gap-1 justify-center sm:justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(artwork.avg_rating || 0) ? 'text-amber-500' : 'text-stone-200'}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-1 text-sm text-stone-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Right: Distribution bars */}
              <div className="flex-1 w-full space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star - 1];
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-stone-500 w-3 text-right">{star}</span>
                      <svg className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-400 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Similar Works */}
        <div className="mt-16">
          <RecommendedCarousel
            title="Similar Works"
            subtitle="You might also like these"
            endpoint={`/api/recs/similar/${id}/?k=8`}
          />
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-stone-900 font-heading">
            Reviews {reviews.length > 0 && <span className="text-base font-normal text-stone-500">({reviews.length})</span>}
          </h2>

          {/* Review Form */}
          {user && purchasedItemId && !hasReviewed && (
            <form onSubmit={handleSubmitReview} className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">Write a Review</h3>
              <div className="mb-4">
                <label className="text-xs font-medium text-stone-500 mb-2 block">Your Rating</label>
                <StarRating rating={reviewRating} size="md" interactive onChange={setReviewRating} />
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this artwork..."
                rows={3}
                className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 mb-4"
              />
              <button
                type="submit"
                disabled={!reviewRating || !reviewComment.trim() || submittingReview}
                className="rounded-lg bg-[#000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="mt-6 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-stone-500 text-sm">No reviews yet. Be the first to review this artwork!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-stone-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-stone-600">
                          {review.reviewer?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{review.reviewer?.username}</p>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                    </div>
                    <span className="text-xs text-stone-400">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-stone-700 whitespace-pre-wrap">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Keyframe for image fade */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const DetailRow = ({ label, value, icon }) => (
  <div>
    <dt className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.05em]">{label}</dt>
    <dd className="mt-0.5 text-sm font-medium text-stone-900 flex items-center gap-1.5">
      {icon}
      {value}
    </dd>
  </div>
);

const TrustBadge = ({ icon, text }) => (
  <div className="flex items-center gap-2.5">
    <span className="flex-shrink-0 text-stone-500">{icon}</span>
    <span className="text-sm font-medium text-stone-700">{text}</span>
  </div>
);

export default ArtworkDetail;
