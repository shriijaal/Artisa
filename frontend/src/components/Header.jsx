import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ artworks: [], artists: [], categories: [] });
  const [trending, setTrending] = useState({ artworks: [], artists: [], categories: [] });
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimerRef = useRef(null);
  const searchWrapperRef = useRef(null);

  useEffect(() => { if (searchFocused && searchInputRef.current) searchInputRef.current.focus(); }, [searchFocused]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchFocused(true); }
      if (e.key === 'Escape') { setSearchFocused(false); searchInputRef.current?.blur(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) setSearchFocused(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (searchFocused && !trending.artworks.length) {
      fetch('/api/recs/trending/').then(r => r.json()).then(setTrending).catch(() => {});
    }
  }, [searchFocused]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults({ artworks: [], artists: [], categories: [] }); return; }
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchSearch(searchQuery), 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery]);

  const fetchSearch = async (q) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/recs/search/?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults({ artworks: data.artworks || [], artists: data.artists || [], categories: data.categories || [] });
    } catch { setSearchResults({ artworks: [], artists: [], categories: [] }); }
    setSearching(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`); setSearchFocused(false); setSearchQuery(''); }
  };

  const goToSearch = (q) => { navigate(`/marketplace?search=${encodeURIComponent(q)}`); setSearchFocused(false); setSearchQuery(''); };

  useEffect(() => { user ? fetchCartCount() : setCartCount(0); }, [user, location.pathname]);

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const r = await fetch('/api/orders/cart/', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setCartCount(d.length); }
    } catch {}
  };

  const isActive = (p) => location.pathname === p;
  const navLinkClass = (p) => `text-sm font-medium transition-colors ${isActive(p) ? 'text-amber-600' : 'text-stone-600 hover:text-stone-900'}`;
  const handleLogout = async () => { await logout(); navigate('/'); setMenuOpen(false); };
  const hasQuery = searchQuery.trim().length > 0;

  const SearchDropdown = () => (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-stone-200 overflow-hidden z-[60] max-h-[70vh] overflow-y-auto">
      {hasQuery ? (
        <div className="py-2">
          {searching ? <div className="py-8 text-center text-sm text-stone-400">Searching...</div> : (
            <>
              {searchResults.artworks.length === 0 && searchResults.artists.length === 0 && searchResults.categories.length === 0 ? (
                <div className="py-8 text-center text-sm text-stone-400">No results found</div>
              ) : (
                <>
                  {searchResults.categories.length > 0 && (
                    <div className="px-4 pb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Categories</p>
                      <div className="flex flex-wrap gap-1.5">
                        {searchResults.categories.map(cat => (
                          <button key={cat.id} onClick={() => goToSearch(cat.name)} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200 transition">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.artists.length > 0 && (
                    <div className="px-4 pb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Artists</p>
                      {searchResults.artists.map(a => (
                        <button key={a.username} onClick={() => { navigate(`/artists/${a.username}`); setSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left">
                          <div className="h-8 w-8 rounded-full bg-amber-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-bold text-amber-600">{a.username?.charAt(0).toUpperCase()}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{a.first_name || a.last_name ? `${a.first_name || ''} ${a.last_name || ''}`.trim() : a.username}</p>
                            <p className="text-[11px] text-stone-500">@{a.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.artworks.length > 0 && (
                    <div className="px-4 pb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Artworks</p>
                      {searchResults.artworks.map(art => (
                        <button key={art.id} onClick={() => { navigate(`/artworks/${art.id}`); setSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left">
                          <div className="h-10 w-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                            {art.images?.[0]?.image ? <img src={art.images[0].image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-stone-300 text-xs">?</div>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{art.title}</p>
                            <p className="text-[11px] text-stone-500">by {art.artist?.username}</p>
                          </div>
                          <span className="ml-auto text-xs font-semibold text-amber-600 flex-shrink-0">NPR {art.price}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <button onClick={handleSearchSubmit} className="w-full py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors border-t border-stone-100">
                View all results for “{searchQuery}”
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="py-4">
          {trending.categories.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Browse Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {trending.categories.map(cat => (
                  <button key={cat.id} onClick={() => goToSearch(cat.name)} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200 transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {trending.artists.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Trending Artists</p>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {trending.artists.map(a => (
                  <button key={a.username} onClick={() => { navigate(`/artists/${a.username}`); setSearchFocused(false); }} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 group">
                    <div className="h-12 w-12 rounded-full bg-amber-100 overflow-hidden border-2 border-transparent group-hover:border-amber-300 transition-colors flex items-center justify-center">
                      {a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-amber-600">{a.username?.charAt(0).toUpperCase()}</span>}
                    </div>
                    <span className="text-[11px] font-medium text-stone-700 truncate w-full text-center">{a.username}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {trending.artworks.length > 0 && (
            <div className="px-5 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Trending Artworks</p>
              {trending.artworks.slice(0, 5).map(art => (
                <button key={art.id} onClick={() => { navigate(`/artworks/${art.id}`); setSearchFocused(false); }} className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left">
                  <div className="h-10 w-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                    {art.images?.[0]?.image ? <img src={art.images[0].image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-stone-300 text-xs">?</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{art.title}</p>
                    <p className="text-[11px] text-stone-500">by {art.artist?.username}</p>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-amber-600 flex-shrink-0">NPR {art.price}</span>
                </button>
              ))}
            </div>
          )}
          <div className="px-5 pt-2 pb-1 border-t border-stone-100 mt-2">
            <p className="text-[11px] text-stone-400 text-center">Search by name, category, tag, or style</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 gap-4">
        <Link to="/" className="group flex-shrink-0 logo-link">
          <span className="font-heading text-xl font-bold tracking-tight logo-text">Artisa</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 flex-shrink-0">
          <Link to="/marketplace" className={navLinkClass('/marketplace')}>Marketplace</Link>
        </nav>
        <div ref={searchWrapperRef} className="relative flex-1 max-w-md hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input ref={searchInputRef} type="text" placeholder="Search artworks, artists, tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} className="w-full pl-9 pr-16 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition" />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-stone-400 pointer-events-none">Ctrl K</kbd>
          </form>
          {searchFocused && <SearchDropdown />}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSearchFocused(true)} className="md:hidden p-2 text-stone-600 hover:text-stone-900 transition-colors" aria-label="Search">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
          {user ? (
            <>
              <button onClick={() => navigate('/cart')} className="relative p-2 text-stone-600 hover:text-stone-900 transition-colors" aria-label="Shopping cart">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-7 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">{cartCount > 9 ? '9+' : cartCount}</span>}
              </button>
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 hover:bg-stone-100 transition-colors">
                  <div className="h-6 w-6 rounded-full bg-amber-600 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[11px] font-bold text-white">{user.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-stone-800">{user.username}</span>
                  <svg className={`h-4 w-4 text-stone-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-lg border border-stone-200 bg-white py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-sm font-semibold text-stone-900 truncate">@{user.username}</p>
                      {user.role === 'admin' && <span className="text-[10px] font-medium text-violet-600">Admin</span>}
                    </div>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}

                    {user?.artist_profile?.status === 'approved' && (
                      <>
                        <Link to={`/artists/${user.username}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          My Profile
                        </Link>
                        <Link to="/my-artworks" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          My Artworks
                        </Link>
                      </>
                    )}

                    {user?.artist_profile?.status !== 'approved' && user.role !== 'admin' && (
                      <Link
                        to={!user?.artist_profile ? '/artist-application' : user.artist_profile.status === 'rejected' ? '/artist-application' : '/profile/edit'}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#9c4327] hover:bg-stone-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        {!user?.artist_profile ? 'Apply as Artist' : user.artist_profile.status === 'pending' ? 'Application Pending' : 'Re-apply as Artist'}
                      </Link>
                    )}

                    <div className="border-t border-stone-100 my-1" />

                    <Link to="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      My Purchases
                    </Link>
                    <Link to="/commissions/mine" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Sent Commissions
                    </Link>
                    <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      Wishlist
                    </Link>
                    <Link to="/profile/edit" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Settings
                    </Link>

                    <div className="border-t border-stone-100 my-1" />

                    <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-stone-500 hover:text-red-600 hover:bg-red-50">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">Sign in</Link>
              <Link to="/register" className="rounded-lg bg-[#000] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 transition-colors">Get started</Link>
            </div>
          )}
        </div>
      </div>
      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}
      {searchFocused && (
        <div className="fixed inset-0 z-[60] md:hidden flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200">
            <button onClick={() => { setSearchFocused(false); setSearchQuery(''); }} className="p-1 text-stone-500"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <svg className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input ref={searchInputRef} type="text" placeholder="Search artworks, artists, tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-7 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition" />
            </form>
          </div>
          <div className="flex-1 overflow-y-auto">
            {hasQuery ? (
              <div className="py-2">
                {searching ? <div className="py-8 text-center text-sm text-stone-400">Searching...</div> : (
                  <>
                    {searchResults.artworks.length === 0 && searchResults.artists.length === 0 && searchResults.categories.length === 0 ? (
                      <div className="py-8 text-center text-sm text-stone-400">No results found</div>
                    ) : (
                      <>
                        {searchResults.categories.length > 0 && (<div className="px-4 pb-2"><p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Categories</p><div className="flex flex-wrap gap-1.5">{searchResults.categories.map(cat => (<button key={cat.id} onClick={() => goToSearch(cat.name)} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200 transition"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{cat.name}</button>))}</div></div>)}
                        {searchResults.artists.length > 0 && (<div className="px-4 pb-2"><p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Artists</p>{searchResults.artists.map(a => (<button key={a.username} onClick={() => { navigate(`/artists/${a.username}`); setSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left"><div className="h-8 w-8 rounded-full bg-amber-100 overflow-hidden flex-shrink-0 flex items-center justify-center">{a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-bold text-amber-600">{a.username?.charAt(0).toUpperCase()}</span>}</div><div className="min-w-0"><p className="text-sm font-medium text-stone-900 truncate">{a.first_name || a.last_name ? `${a.first_name || ''} ${a.last_name || ''}`.trim() : a.username}</p><p className="text-[11px] text-stone-500">@{a.username}</p></div></button>))}</div>)}
                        {searchResults.artworks.length > 0 && (<div className="px-4 pb-2"><p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Artworks</p>{searchResults.artworks.map(art => (<button key={art.id} onClick={() => { navigate(`/artworks/${art.id}`); setSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left"><div className="h-10 w-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">{art.images?.[0]?.image ? <img src={art.images[0].image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-stone-300 text-xs">?</div>}</div><div className="min-w-0"><p className="text-sm font-medium text-stone-900 truncate">{art.title}</p><p className="text-[11px] text-stone-500">by {art.artist?.username}</p></div><span className="ml-auto text-xs font-semibold text-amber-600 flex-shrink-0">NPR {art.price}</span></button>))}</div>)}
                      </>
                    )}
                    <button onClick={handleSearchSubmit} className="w-full py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors border-t border-stone-100">View all results for “{searchQuery}”</button>
                  </>
                )}
              </div>
            ) : (
              <div className="py-4">
                {trending.categories.length > 0 && (<div className="px-5 pb-4"><p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Browse Categories</p><div className="flex flex-wrap gap-1.5">{trending.categories.map(cat => (<button key={cat.id} onClick={() => goToSearch(cat.name)} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200 transition"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{cat.name}</button>))}</div></div>)}
                {trending.artists.length > 0 && (<div className="px-5 pb-4"><p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Trending Artists</p><div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>{trending.artists.map(a => (<button key={a.username} onClick={() => { navigate(`/artists/${a.username}`); setSearchFocused(false); }} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 group"><div className="h-12 w-12 rounded-full bg-amber-100 overflow-hidden border-2 border-transparent group-hover:border-amber-300 transition-colors flex items-center justify-center">{a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-amber-600">{a.username?.charAt(0).toUpperCase()}</span>}</div><span className="text-[11px] font-medium text-stone-700 truncate w-full text-center">{a.username}</span></button>))}</div></div>)}
                {trending.artworks.length > 0 && (<div className="px-5 pb-2"><p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Trending Artworks</p>{trending.artworks.slice(0, 5).map(art => (<button key={art.id} onClick={() => { navigate(`/artworks/${art.id}`); setSearchFocused(false); }} className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left"><div className="h-10 w-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">{art.images?.[0]?.image ? <img src={art.images[0].image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-stone-300 text-xs">?</div>}</div><div className="min-w-0"><p className="text-sm font-medium text-stone-900 truncate">{art.title}</p><p className="text-[11px] text-stone-500">by {art.artist?.username}</p></div><span className="ml-auto text-xs font-semibold text-amber-600 flex-shrink-0">NPR {art.price}</span></button>))}</div>)}
                <div className="px-5 pt-2 pb-1 border-t border-stone-100 mt-2"><p className="text-[11px] text-stone-400 text-center">Search by name, category, tag, or style</p></div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;