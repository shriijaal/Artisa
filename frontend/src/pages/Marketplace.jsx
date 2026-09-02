import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import RecommendedCarousel from '../components/RecommendedCarousel';
import { useToast } from '../components/Toast';

const Marketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [artworks, setArtworks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    verified: false,
    min_price: '',
    max_price: '',
    sort: 'newest',
  });

  useEffect(() => {
    fetchCategories();
    fetchArtworks();
    if (user) {
      fetchFavorites();
    }
  }, [filters, user]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/artworks/categories/');
      if (response.ok) {
        setCategories(await response.json());
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchArtworks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);
      if (filters.verified) params.append('verified', 'true');
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      params.append('sort', filters.sort);

      const response = await fetch(`/api/artworks/published/?${params.toString()}`);
      if (response.ok) {
        setArtworks(await response.json());
      }
    } catch (err) {
      console.error('Error fetching artworks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      type: '',
      verified: false,
      min_price: '',
      max_price: '',
      sort: 'newest',
    });
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/auth/favorites/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.map(f => f.artwork_id));
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const toggleFavorite = async (artworkId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      if (favorites.includes(artworkId)) {
        await fetch(`/api/auth/favorites/artwork/${artworkId}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setFavorites(prev => prev.filter(id => id !== artworkId));
        addToast('Removed from wishlist', 'info');
      } else {
        await fetch('/api/auth/favorites/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ artwork_id: artworkId }),
        });
        setFavorites(prev => [...prev, artworkId]);
        addToast('Added to wishlist!', 'success');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      addToast('Failed to update wishlist', 'error');
    }
  };

  const activeFilterCount = [filters.category, filters.type, filters.verified, filters.min_price, filters.max_price].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">Filters</h3>
        <button onClick={clearFilters} className="text-xs text-stone-500 hover:text-stone-800 transition">
          Clear all
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Category</label>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Type</label>
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
        >
          <option value="">All Types</option>
          <option value="physical">Physical</option>
          <option value="digital">Digital</option>
        </select>
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          id="verified"
          checked={filters.verified}
          onChange={(e) => handleFilterChange('verified', e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
        />
        <label htmlFor="verified" className="text-sm text-stone-600">Verified Artists Only</label>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Price Range (NPR)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
            className="w-1/2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
            className="w-1/2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Sort By</label>
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Recommended Carousel */}
        <div className="mb-6 sm:mb-8">
          <RecommendedCarousel
            title="Recommended for You"
            subtitle="Based on your browsing history"
            endpoint="/api/recs/artworks/?k=8"
          />
        </div>

        {/* Search + Mobile Filter Toggle */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search artworks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          {/* Artworks Grid */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-stone-500">
                {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <LoadingSpinner fullPage={false} label="Loading masterworks..." />
              </div>
            ) : artworks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-200 bg-white p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-stone-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-stone-500 text-sm">No artworks found matching your filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-[#000] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    <div
                      key={artwork.id}
                      onClick={() => navigate(`/artworks/${artwork.id}`)}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-stone-100 rounded-lg border border-stone-200 hover:border-stone-300 transition-all duration-300 hover:-translate-y-1 relative">
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
                            <span className={`inline-flex items-center rounded-full ${badge.color} px-2 py-1 text-[10px] font-semibold text-white shadow-lg backdrop-blur-sm`}>
                              {badge.text}
                            </span>
                          </div>
                        )}
                        
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(artwork.id); }}
                          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
                            favorites.includes(artwork.id)
                              ? 'bg-white text-red-500 shadow-lg'
                              : 'bg-white/80 backdrop-blur-sm text-stone-400 hover:text-red-500 hover:bg-white'
                          }`}
                        >
                          <svg className="h-5 w-5" fill={favorites.includes(artwork.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>

                        {/* Image Count */}
                        {imageCount > 1 && (
                          <div className="absolute top-12 right-3">
                            <span className="inline-flex items-center rounded-full bg-black/50 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-white">
                              1/{imageCount}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4">
                        <div className="flex items-start justify-between gap-2">
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
                            NPR {Math.round(artwork.price).toLocaleString()}
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <h2 className="text-base font-semibold text-stone-900">Filters</h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <FilterPanel />
            </div>
            <div className="p-5 border-t border-stone-200">
              <button
                onClick={() => setFilterOpen(false)}
                className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition"
              >
                Show {artworks.length} result{artworks.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Marketplace;
