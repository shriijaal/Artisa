import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/formatPrice';
import authFetch from '../utils/authFetch';

const CATEGORY_COLORS = [
  { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', hoverBg: 'hover:bg-stone-200' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', hoverBg: 'hover:bg-rose-100' },
  { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', hoverBg: 'hover:bg-sky-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hoverBg: 'hover:bg-emerald-100' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', hoverBg: 'hover:bg-violet-100' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hoverBg: 'hover:bg-orange-100' },
];

const Home = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const revealRefs = useRef([]);

  const scrollCarousel = (dir) => {
    if (!carouselRef.current) return;
    const w = carouselRef.current.offsetWidth * 0.8;
    carouselRef.current.scrollBy({ left: dir === 'left' ? -w : w, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchHomepageData();
  }, []);

  useEffect(() => {
    if (loading || !data) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading, data]);

  const addRevealRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const fetchHomepageData = async () => {
    try {
      const response = await authFetch('/api/recs/homepage/');

      if (response.ok) {
        setData(await response.json());
      } else {
        setError(`Server error (${response.status}). Please try again later.`);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Failed to connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || (!data && !error)) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <Header />
        <div className="pb-16">
          {/* Hero skeleton */}
          <div className="bg-stone-900 h-[420px] w-full" />
          {/* Recommendations skeleton */}
          <div className="max-w-7xl mx-auto px-6 pt-16">
            <div className="skeleton h-8 w-64 mb-2" />
            <div className="skeleton h-4 w-80 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-stone-200 bg-white">
                  <div className="skeleton aspect-[4/3] w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Categories skeleton */}
          <div className="max-w-7xl mx-auto px-6 pt-20">
            <div className="skeleton h-7 w-48 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="bg-white rounded-lg border border-stone-200 p-10 max-w-md">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-stone-500 mb-6">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); fetchHomepageData(); }}
              className="rounded-lg bg-[#000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />

      <main className="pb-0 page-enter">
        {/* ── HERO ── */}
        {data.hero_featured && data.hero_featured.length > 0 && (
          <section className="relative bg-stone-900 text-white overflow-hidden hero-noise">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-stone-900 via-stone-900/95 to-stone-800/90" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 sm:py-12 lg:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
                {/* Left — Text */}
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-4xl xl:text-5xl">
                    Nepal&apos;s Marketplace for Original Art
                  </h1>
                  <p className="mt-4 text-base leading-7 text-stone-300 max-w-xl">
                    Collect premium physical and digital artworks directly from verified independent artists across Nepal.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link
                      to="/marketplace"
                      className="rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-100 transition inline-flex items-center gap-2"
                    >
                      Explore Marketplace
                    </Link>
                    {!user && (
                      <Link
                        to="/register"
                        className="rounded-lg border border-white/30 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition"
                      >
                        Join as an Artist
                      </Link>
                    )}
                    {user && user.artist_profile?.status !== 'approved' && user.role !== 'admin' && (
                      <Link
                        to={!user.artist_profile ? '/artist-application' : user.artist_profile.status === 'rejected' ? '/artist-application' : '/settings/account'}
                        className="rounded-lg border border-white/30 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition"
                      >
                        {!user.artist_profile ? 'Join as an Artist' : user.artist_profile.status === 'pending' ? 'Application Pending' : 'Re-apply as Artist'}
                      </Link>
                    )}
                  </div>
                  <div className="mt-8 flex items-center gap-6 text-sm text-stone-400">
                    <div>
                      <span className="block text-2xl font-bold text-white">{data.stats?.total_artists ? `${data.stats.total_artists.toLocaleString()}+` : '500+'}</span>
                      Artists
                    </div>
                    <div className="w-px h-8 bg-stone-700" />
                    <div>
                      <span className="block text-2xl font-bold text-white">{data.stats?.total_artworks ? `${data.stats.total_artworks.toLocaleString()}+` : '2,000+'}</span>
                      Artworks
                    </div>
                    <div className="w-px h-8 bg-stone-700" />
                    <div>
                      <span className="block text-2xl font-bold text-white">NPR 5M+</span>
                      Earned by Artists
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-4 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Verified Artists
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Secure Payments
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Free Listings
                    </span>
                  </div>
                </div>

                {/* Right — Artwork Grid */}
                <>
                  {/* Mobile: horizontal carousel */}
                  <div className="flex lg:hidden gap-3 overflow-x-auto snap-x snap-mandatory -mx-2 px-2 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                    {data.hero_featured.slice(0, 5).map((artwork, i) => (
                      <Link
                        key={artwork.id}
                        to={`/artworks/${artwork.id}`}
                        className="group relative flex-shrink-0 w-48 snap-start rounded-xl overflow-hidden bg-stone-800 hero-artwork-card"
                        style={{ animationDelay: `${i * 120}ms` }}
                      >
                        <div className="aspect-[3/4] relative">
                          {artwork.images?.[0]?.image ? (
                            <img
                              src={artwork.images[0].image}
                              alt={artwork.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-stone-600">
                              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-xs font-semibold line-clamp-1">{artwork.title}</p>
                            <p className="text-white/60 text-[10px] mt-0.5">{artwork.artist?.username}</p>
                            <span className="text-[11px] font-bold text-white/80">रू {Number(artwork.price || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                      </Link>
                    ))}
                  </div>

                  {/* Desktop: masonry grid */}
                  <div className="hidden lg:grid grid-cols-2 grid-rows-[200px_200px] gap-3">
                    {data.hero_featured.slice(0, 4).map((artwork, i) => {
                      const spans = ['row-span-2', 'row-span-1', 'row-span-1', 'row-span-2'];
                      return (
                        <Link
                          key={artwork.id}
                          to={`/artworks/${artwork.id}`}
                          className={`group relative ${spans[i]} rounded-xl overflow-hidden bg-stone-800 hero-artwork-card`}
                          style={{ animationDelay: `${i * 120}ms` }}
                        >
                          <div className="h-full min-h-0 relative">
                            {artwork.images?.[0]?.image ? (
                              <img
                                src={artwork.images[0].image}
                                alt={artwork.title}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading={i === 0 ? 'eager' : 'lazy'}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-stone-600">
                                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                              <p className="text-white text-sm font-semibold line-clamp-1">{artwork.title}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-stone-300">{artwork.artist?.username || 'Artist'}</span>
                                <span className="text-sm font-bold text-white">रू {Number(artwork.price || 0).toLocaleString()}</span>
                              </div>
                              <div className="mt-2.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/90">
                                  View Artwork
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Border + shadow on hover */}
                          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/25 group-hover:shadow-xl group-hover:shadow-black/30 transition-all duration-300" />
                        </Link>
                      );
                    })}
                  </div>
                </>
              </div>
            </div>
          </section>
        )}

        {/* ── RECOMMENDATIONS ── */}
        <section ref={addRevealRef} className="reveal max-w-7xl mx-auto px-6 pt-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-stone-900">
                {data.recommendation_type === 'personalized' ? 'Recommended For You' : 'Trending Now'}
              </h2>
              <p className="mt-2 text-stone-500">
                {data.recommendation_type === 'personalized'
                  ? 'Based on your interactions and favorite categories.'
                  : 'The most popular artworks handpicked for you.'}
              </p>
            </div>
            <Link to="/marketplace" className="text-sm font-semibold text-[#9c4327] hover:text-[#7a3520] transition hidden sm:block">
              View all &rarr;
            </Link>
          </div>

          <div className="relative group/carousel py-5">
            {/* Left Arrow — centered on image */}
            <button onClick={() => scrollCarousel('left')} className="absolute left-2 top-1/2 -translate-y-[95%] z-20 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white shadow-sm transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>

            {/* Scrollable Track */}
            <div ref={carouselRef} className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory -mx-2 px-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {data.recommended_artworks?.map((artwork) => (
                <Link key={artwork.id} to={`/artworks/${artwork.id}`} className="group flex-shrink-0 w-64 snap-start">
                  <div className="aspect-[4/5] overflow-hidden bg-stone-100 rounded-lg border border-stone-200 hover:border-stone-300 transition-all duration-300 hover:-translate-y-1 relative">
                    {artwork.images && artwork.images.length > 0 ? (
                      <img
                        src={artwork.images[0].image}
                        alt={artwork.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-400 text-sm">No Image</div>
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
                      NPR {formatPrice(artwork.price)}
                    </span>
                    <div className="flex items-center gap-2">
                      {artwork.review_count > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-stone-600">
                          <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span className="font-medium">{artwork.avg_rating}</span>
                        </span>
                      )}
                      <span className="text-xs font-medium text-[#9c4327] whitespace-nowrap">
                        View
                      </span>
                    </div>
                  </div>

                  {artwork.type === 'physical' && (artwork.width || artwork.height) && (
                    <div className="mt-2 text-[10px] text-stone-500">
                      {artwork.width && <span>{artwork.width}cm</span>}
                      {artwork.width && artwork.height && <span>×</span>}
                      {artwork.height && <span>{artwork.height}cm</span>}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Arrow — centered on image */}
            <button onClick={() => scrollCarousel('right')} className="absolute right-2 top-1/2 -translate-y-[95%] z-20 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white shadow-sm transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/marketplace" className="text-sm font-semibold text-[#9c4327] hover:text-[#7a3520] transition">
              View all artworks &rarr;
            </Link>
          </div>
        </section>

        {/* ── CATEGORIES ── */}
        {data.categories && data.categories.length > 0 && (
          <section ref={addRevealRef} className="reveal max-w-7xl mx-auto px-6 pt-24">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-stone-900">Browse by Medium</h2>
                <p className="mt-2 text-stone-500">Explore artworks by category.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.categories.map((category, idx) => {
                const colors = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                const hasImages = category.sample_artworks?.length > 0;
                return (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/marketplace?category=${category.id}`)}
                    className={`group relative rounded-xl overflow-hidden aspect-[3/4] transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/50 hover:-translate-y-1 ${
                      hasImages ? 'bg-stone-900' : `${colors.bg} ${colors.border} border`
                    }`}
                  >
                    {hasImages && (
                      <div className="absolute inset-0">
                        <div className="relative h-full overflow-hidden bg-stone-800">
                          {category.sample_artworks[0]?.image ? (
                            <img src={category.sample_artworks[0].image} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="h-full w-full bg-stone-700" />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      </div>
                    )}
                    {!hasImages && (
                      <span className={`absolute text-6xl font-bold ${colors.text} opacity-10 group-hover:opacity-20 transition-opacity select-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}>
                        {category.name.charAt(0)}
                      </span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                      <h3 className={`text-sm font-bold ${hasImages ? 'text-white' : colors.text} leading-tight`}>
                        {category.name}
                      </h3>
                      {category.artwork_count > 0 && (
                        <p className={`text-[11px] ${hasImages ? 'text-white/60' : 'text-stone-400'} mt-0.5`}>
                          {category.artwork_count} {category.artwork_count === 1 ? 'Artwork' : 'Artworks'}
                        </p>
                      )}
                    </div>
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                      <div className={`h-6 w-6 rounded-full ${hasImages ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/60'} flex items-center justify-center`}>
                        <svg className={`h-3 w-3 ${hasImages ? 'text-white' : 'text-stone-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── EDITOR'S PICKS (BENTO) ── */}
        {data.recommended_artworks && data.recommended_artworks.length >= 5 && (
          <section ref={addRevealRef} className="reveal max-w-7xl mx-auto px-6 pt-24">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Text card — spans 2 cols */}
              <div className="col-span-2 row-span-1 rounded-xl p-8 sm:p-10 flex flex-col justify-center hero-artwork-card" style={{ animationDelay: '0ms' }}>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">Editor's Picks</h2>
                <p className="mt-4 text-base sm:text-lg text-stone-500 leading-relaxed max-w-md">A curated selection of standout artworks from our community, chosen by our team.</p>
                <Link to="/marketplace" className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-stone-900 px-7 py-3.5 text-sm font-semibold text-white hover:bg-stone-800 transition-colors self-start">
                  Shop these finds
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Top-right cards — 2 square cards */}
              {data.recommended_artworks.slice(0, 2).map((art, i) => (
                <Link key={art.id} to={`/artworks/${art.id}`} className="group relative col-span-1 row-span-1 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all duration-300 aspect-square hero-artwork-card" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                  {art.images?.[0]?.image ? (
                    <img src={art.images[0].image} alt={art.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone-400 text-sm">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-stone-700 overflow-hidden border border-white/20">
                        {art.artist.avatar ? <img src={art.artist.avatar} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <span className="text-xs text-white/70">{art.artist.username}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1 truncate">{art.title}</h3>
                    <span className="text-xs font-bold text-amber-400">NPR {formatPrice(art.price)}</span>
                  </div>
                </Link>
              ))}

              {/* Bottom row — 4 square cards */}
              {data.recommended_artworks.slice(2, 6).map((art, i) => (
                <Link key={art.id} to={`/artworks/${art.id}`} className="group relative col-span-1 row-span-1 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all duration-300 aspect-square hero-artwork-card" style={{ animationDelay: `${(i + 3) * 100}ms` }}>
                  {art.images?.[0]?.image ? (
                    <img src={art.images[0].image} alt={art.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone-400 text-sm">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-stone-700 overflow-hidden border border-white/20">
                        {art.artist.avatar ? <img src={art.artist.avatar} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <span className="text-xs text-white/70">{art.artist.username}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1 truncate">{art.title}</h3>
                    <span className="text-xs font-bold text-amber-400">NPR {formatPrice(art.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── FEATURED ARTISTS ── */}
        {data.featured_artists && data.featured_artists.length > 0 && (
          <section ref={addRevealRef} className="reveal max-w-7xl mx-auto px-6 mt-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-stone-900">Featured Artists</h2>
              <p className="mt-3 text-stone-500">Meet the talented creators behind the work.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {data.featured_artists.map((artist) => (
                <Link key={artist.id} to={`/artists/${artist.username}`} className="flex flex-col items-center group">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 border-4 border-stone-100 group-hover:border-stone-200 transition-colors">
                    {artist.avatar ? (
                      <img src={artist.avatar} alt={artist.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-stone-200 flex items-center justify-center text-2xl text-stone-400 font-bold">
                        {artist.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 text-center">
                    {artist.first_name || artist.last_name
                      ? `${artist.first_name || ''} ${artist.last_name || ''}`.trim()
                      : artist.username}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">@{artist.username}</p>
                  {/* Artwork thumbnails */}
                  {artist.sample_artworks && artist.sample_artworks.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {artist.sample_artworks.slice(0, 2).map((art) => (
                        <div key={art.id} className="h-[72px] w-[72px] rounded-lg overflow-hidden bg-stone-100">
                          {art.image ? (
                            <img src={art.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-stone-200" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── VALUE PROPOSITIONS ── */}
        <section ref={addRevealRef} className="reveal max-w-7xl mx-auto px-6 pt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900">Why Artisa?</h2>
            <p className="mt-3 text-stone-500">Built for Nepali art and the people who love it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Discover */}
            <div className="rounded-xl bg-stone-50 p-8">
              <span className="text-5xl font-bold text-stone-200 select-none">01</span>
              <h3 className="text-xl font-bold text-stone-900 mt-2">Discover Unique Art</h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                Browse <span className="border-b border-dotted border-stone-500 text-stone-800">handcrafted artworks</span> from independent Nepali artisans. From traditional Thangka paintings to modern digital illustrations, find pieces that speak to you.
              </p>
            </div>

            {/* Commission */}
            <div className="rounded-xl bg-stone-50 p-8">
              <span className="text-5xl font-bold text-stone-200 select-none">02</span>
              <h3 className="text-xl font-bold text-stone-900 mt-2">Commission Custom Work</h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                Work directly with artists to <span className="border-b border-dotted border-stone-500 text-stone-800">bring your vision to life</span>. Whether it is a portrait, illustration, or bespoke sculpture, collaborate one-on-one to create something truly yours.
              </p>
            </div>

            {/* Connect */}
            <div className="rounded-xl bg-stone-50 p-8">
              <span className="text-5xl font-bold text-stone-200 select-none">03</span>
              <h3 className="text-xl font-bold text-stone-900 mt-2">Connect with Creators</h3>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                <span className="border-b border-dotted border-stone-500 text-stone-800">Support local talent</span> directly and build meaningful relationships with the artists behind the work. Every purchase helps sustain Nepali artistry.
              </p>
            </div>
          </div>
        </section>

        {/* ── COMMISSION CTA ── */}
        <section ref={addRevealRef} className="reveal max-w-7xl mx-auto px-6 pt-24 pb-4">
          <div className="relative rounded-2xl overflow-hidden bg-stone-900 px-8 py-16 sm:px-12 sm:py-20 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#9c4327]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

            <div className="relative z-10 max-w-xl text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Looking for Custom Art?
              </h2>
              <p className="mt-4 text-base sm:text-lg text-stone-300 leading-relaxed">
                Connect with our talented artists for custom portraits, illustrations, and physical masterpieces tailored to your vision.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link
                  to="/commissions/new"
                  className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-stone-900 hover:bg-stone-100 transition-colors shadow-lg shadow-white/10"
                >
                  Request a Commission
                </Link>
                <Link
                  to="/marketplace"
                  className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Browse Marketplace
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-4 justify-center lg:justify-start text-xs text-stone-400">
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Free to request
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Responds in 24h
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Secure payment
                </span>
              </div>
            </div>

            {/* Single artwork image */}
            <div className="hidden lg:block relative w-64 h-64 flex-shrink-0">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur-3xl opacity-20" />
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-stone-900/80" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
