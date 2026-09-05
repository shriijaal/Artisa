import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
      const token = localStorage.getItem('access_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/recs/homepage/', { headers });

      if (response.ok) {
        setData(await response.json());
      } else if (response.status === 401 && token) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        const retry = await fetch('/api/recs/homepage/');
        if (retry.ok) {
          setData(await retry.json());
        } else {
          setError('Failed to load homepage.');
        }
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
          <section className="relative bg-stone-900 text-white overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-30">
              <img
                src={data.hero_featured[0].images?.[0]?.image || 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80'}
                alt=""
                className="w-full h-full object-cover blur-sm scale-110"
              />
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:py-40">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Discover Extraordinary Original Art
                </h1>
                <p className="mt-6 text-lg leading-8 text-stone-300 max-w-xl">
                  Collect premium physical and digital artworks directly from verified independent artists across Nepal.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <Link
                    to="/marketplace"
                    className="rounded-lg bg-[#000] px-7 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition"
                  >
                    Explore Marketplace
                  </Link>
                  <Link to="/register" className="text-sm font-semibold leading-6 text-white hover:text-stone-300 transition">
                    Join as an Artist <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
                <div className="mt-12 flex items-center gap-8 text-sm text-stone-400">
                  <div>
                    <span className="block text-2xl font-bold text-white">500+</span>
                    Artists
                  </div>
                  <div className="w-px h-8 bg-stone-700" />
                  <div>
                    <span className="block text-2xl font-bold text-white">2,000+</span>
                    Artworks
                  </div>
                  <div className="w-px h-8 bg-stone-700" />
                  <div>
                    <span className="block text-2xl font-bold text-white">NPR 5M+</span>
                    Earned by Artists
                  </div>
                </div>
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
            <button onClick={() => scrollCarousel('left')} className="absolute left-5 top-1/2 -translate-y-[85%] z-20 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white shadow-sm transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer">
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
                      NPR {Math.round(Number(artwork.price)).toLocaleString()}
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
            <button onClick={() => scrollCarousel('right')} className="absolute right-5 top-1/2 -translate-y-[85%] z-20 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white shadow-sm transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/marketplace" className="text-sm font-semibold text-[#9c4327] hover:text-[#7a3520] transition">
              View all artworks &rarr;
            </Link>
          </div>
        </section>

        {/* ── EDITOR'S PICKS (BENTO) ── */}
        {data.recommended_artworks && data.recommended_artworks.length >= 5 && (
          <section ref={addRevealRef} className="reveal max-w-7xl mx-auto px-6 pt-24">
            <div className="flex justify-between items-end mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#9c4327] mb-2">Hand-Picked</p>
                <h2 className="text-3xl font-bold text-stone-900">Editor's Picks</h2>
                <p className="mt-2 text-stone-500">A curated selection of standout artworks from our community.</p>
              </div>
              <Link to="/marketplace" className="text-sm font-semibold text-[#9c4327] hover:text-[#7a3520] transition hidden sm:block">
                View all &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px] sm:auto-rows-[240px]">
              {/* Hero — large */}
              <Link to={`/artworks/${data.recommended_artworks[0].id}`} className="group relative col-span-2 row-span-2 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 hover:border-stone-300 transition-all duration-300">
                {data.recommended_artworks[0].images?.[0]?.image ? (
                  <img src={data.recommended_artworks[0].images[0].image} alt={data.recommended_artworks[0].title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-stone-400">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 border border-white/10 mb-3">
                    Editor&apos;s Pick
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">{data.recommended_artworks[0].title}</h3>
                  <p className="text-sm text-white/70 mt-1">by {data.recommended_artworks[0].artist.username}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-semibold text-amber-400">NPR {data.recommended_artworks[0].price}</span>
                    <span className="text-xs text-white/50 group-hover:text-amber-400 transition-colors font-medium">View Details &rarr;</span>
                  </div>
                </div>
              </Link>

              {/* Rest — 4 smaller cards */}
              {data.recommended_artworks.slice(1, 5).map((art) => (
                <Link key={art.id} to={`/artworks/${art.id}`} className="group relative col-span-1 row-span-1 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 hover:border-stone-300 transition-all duration-300">
                  {art.images?.[0]?.image ? (
                    <img src={art.images[0].image} alt={art.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone-400 text-sm">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <h3 className="text-sm font-semibold text-white truncate">{art.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-amber-400 font-semibold">NPR {art.price}</span>
                      <span className="text-[10px] text-white/50">{art.artist.username}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CATEGORIES ── */}
        {data.categories && data.categories.length > 0 && (
          <section ref={addRevealRef} className="reveal max-w-7xl mx-auto px-6 pt-24">
            <h2 className="text-2xl font-bold text-stone-900 mb-8">Browse by Medium</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {data.categories.map((category, idx) => {
                const colors = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                return (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/marketplace?category=${category.id}`)}
                    className={`group relative rounded-lg overflow-hidden aspect-square border ${colors.border} ${colors.bg} ${colors.hoverBg} transition-all duration-200 flex flex-col items-center justify-center gap-2`}
                  >
                    <span className={`text-4xl font-bold ${colors.text} opacity-20 group-hover:opacity-40 transition-opacity select-none`}>
                      {category.name.charAt(0)}
                    </span>
                    <span className={`text-sm font-semibold ${colors.text} relative z-10`}>
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── FEATURED ARTISTS ── */}
        {data.featured_artists && data.featured_artists.length > 0 && (
          <section ref={addRevealRef} className="reveal bg-white border-y border-stone-200 mt-24 py-16">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">
                Featured Artists
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {data.featured_artists.map((artist) => (
                  <Link key={artist.id} to={`/artists/${artist.username}`} className="flex flex-col items-center group">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden mb-4 border-4 border-stone-100 group-hover:border-stone-300 transition-colors">
                      {artist.avatar ? (
                        <img src={artist.avatar} alt={artist.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-stone-200 flex items-center justify-center text-2xl md:text-3xl text-stone-400 font-bold">
                          {artist.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-stone-900">
                      {artist.first_name || artist.last_name
                        ? `${artist.first_name || ''} ${artist.last_name || ''}`.trim()
                        : artist.username}
                    </h3>
                    <p className="text-sm text-stone-500 mt-0.5">@{artist.username}</p>
                    <span className="text-xs text-stone-400 mt-1">Artist</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── COMMISSION CTA ── */}
        <section ref={addRevealRef} className="reveal max-w-7xl mx-auto px-6 pt-24 pb-4">
          <div className="relative rounded-lg overflow-hidden bg-stone-900 px-6 py-16 sm:px-12 sm:py-20 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="relative z-10 max-w-xl text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Looking for Custom Art?
              </h2>
              <p className="mt-4 text-lg text-stone-300">
                Connect with our talented artists for custom portraits, illustrations, and physical masterpieces tailored to your vision.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  to="/marketplace"
                  className="rounded-lg bg-[#000] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition"
                >
                  Browse Custom Art
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative w-64 h-64 flex-shrink-0">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur-3xl opacity-20" />
              <img
                src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80"
                alt=""
                className="absolute inset-0 w-full h-full object-cover rounded-lg rotate-3 border-4 border-stone-800"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
