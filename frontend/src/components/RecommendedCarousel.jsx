import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const SkeletonCard = () => (
  <div className="flex-shrink-0 w-64">
    <div className="aspect-[4/5] rounded-lg bg-stone-100 animate-pulse" />
    <div className="mt-3 px-1 space-y-2">
      <div className="h-4 w-3/4 rounded bg-stone-100 animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-stone-100 animate-pulse" />
      <div className="h-4 w-1/3 rounded bg-stone-100 animate-pulse" />
    </div>
  </div>
);

const RecommendedCarousel = ({ title, subtitle, endpoint, limit = 8 }) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchArtworks();
  }, [endpoint]);

  const fetchArtworks = async () => {
    try {
      const url = endpoint || `/api/recs/artworks/?k=${limit}`;
      const token = localStorage.getItem('access_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      if (response.ok) {
        setArtworks(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <section className="relative">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 font-serif">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error || artworks.length === 0) return null;

  return (
    <section className="relative">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 font-serif">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
        </div>
      </div>

      <div className="relative group/carousel">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 h-12 w-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {artworks.map((artwork) => {
          const primaryImage = artwork.images?.find(img => img.is_primary) || artwork.images?.[0];
          const isNew = new Date(artwork.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const imageCount = artwork.images?.length || 0;
          const isLimitedEdition = artwork.type === 'physical' && artwork.stock > 0 && artwork.stock < 5;
          const isTrending = artwork.view_count > 100;
          
          // Badge priority: Featured > New > Trending > Limited Edition
          let badge = null;
          if (artwork.is_featured) {
            badge = { text: 'Featured', color: 'bg-violet-600' };
          } else if (isNew) {
            badge = { text: 'New', color: 'bg-amber-500' };
          } else if (isTrending) {
            badge = { text: 'Trending', color: 'bg-rose-500' };
          } else if (isLimitedEdition) {
            badge = { text: 'Limited Edition', color: 'bg-stone-900/80' };
          }
          
          return (
            <Link
              key={artwork.id}
              to={`/artworks/${artwork.id}`}
              className="group flex-shrink-0 w-64 snap-start"
            >
              <div className="aspect-[4/5] overflow-hidden bg-stone-100 rounded-lg border border-stone-200 transition-all duration-300 hover:-translate-y-1 relative">
                  {primaryImage ? (
                    <img
                      src={`http://127.0.0.1:8000${primaryImage.image}`}
                      alt={artwork.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                      <svg className="h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Single Badge (priority-based) */}
                  {badge && (
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center rounded-full ${badge.color} px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm`}>
                        {badge.text}
                      </span>
                    </div>
                  )}
                  
                  {/* Image Count */}
                  {imageCount > 1 && (
                    <div className="absolute top-12 right-3">
                      <span className="inline-flex items-center rounded-full bg-black/50 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-white">
                        1/{imageCount}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2 pt-4">
                    <h3 className="font-semibold text-stone-900 line-clamp-1 text-sm flex-1">
                      {artwork.title}
                    </h3>
                    {artwork.type === 'physical' && (
                      <span className={`text-[10px] font-medium whitespace-nowrap ${
                        artwork.stock_status === 'in_stock' || (!artwork.stock_status && artwork.stock > 0) ? 'text-emerald-600' :
                        artwork.stock_status === 'low_stock' ? 'text-amber-600' :
                        artwork.stock_status === 'sold_out' || (!artwork.stock_status && artwork.stock <= 0) ? 'text-red-500' :
                        artwork.stock_status === 'pre_order' ? 'text-blue-600' :
                        artwork.stock_status === 'made_to_order' ? 'text-violet-600' :
                        artwork.stock_status === 'reserved' ? 'text-orange-600' :
                        'text-slate-600'
                      }`}>
                        {artwork.stock_status ? 
                          artwork.stock_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                          (artwork.stock > 0 ? 'In Stock' : 'Sold Out')
                        }
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 group-hover:hidden">
                      {artwork.artist?.artist_profile?.verified_badge ? (
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-stone-700">
                            @{artwork.artist?.username}
                          </p>
                          <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
                          </svg>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-stone-700">
                          @{artwork.artist?.username}
                        </p>
                      )}
                    </div>
                    <div className="hidden group-hover:flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-white border border-stone-200 px-2.5 py-0.5 text-[10px] font-medium text-stone-600">
                        {artwork.type === 'physical' ? 'Physical' : 'Digital'}
                      </span>
                      {artwork.category?.name && (
                        <span className="inline-flex items-center rounded-md bg-stone-50 border border-stone-200 px-2.5 py-0.5 text-[10px] font-medium text-stone-600">
                          {artwork.category.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-bold text-stone-900">
                      NPR {Math.round(Number(artwork.price)).toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-[#9c4327] whitespace-nowrap">
                      View
                    </span>
                  </div>

                  {artwork.type === 'physical' && (artwork.width || artwork.height) && (
                    <div className="mt-2 text-[10px] text-stone-500">
                      {artwork.width && <span>{artwork.width}cm</span>}
                      {artwork.width && artwork.height && <span>×</span>}
                      {artwork.height && <span>{artwork.height}cm</span>}
                    </div>
                  )}
            </Link>
          );
        })}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 h-12 w-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
    </section>
  );
};

export default RecommendedCarousel;
