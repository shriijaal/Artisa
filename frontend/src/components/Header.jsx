import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import authFetch from '../utils/authFetch';
import { Arc } from 'loading-dev';

const NOTIF_KINDS = {
  commission: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  order: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  payment: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  application: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  default: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
};

const NOTIF_TINTS = {
  commission: 'bg-amber-100 text-amber-700',
  order: 'bg-blue-100 text-blue-700',
  payment: 'bg-emerald-100 text-emerald-700',
  application: 'bg-violet-100 text-violet-700',
  default: 'bg-stone-100 text-stone-500',
};

const notifKind = (kind) => {
  if (kind?.startsWith('commission_')) return 'commission';
  if (kind?.startsWith('order_')) return 'order';
  if (kind === 'payment_confirmed') return 'payment';
  if (kind?.startsWith('application_')) return 'application';
  return 'default';
};

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
  const [catDropdown, setCatDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [hasCommissions, setHasCommissions] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const searchInputRef = useRef(null);
  const searchTimerRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const catDropdownRef = useRef(null);

  useEffect(() => { if (searchFocused && searchInputRef.current) searchInputRef.current.focus(); }, [searchFocused]);

  useEffect(() => {
    fetch('/api/artworks/categories/').then(r => r.json()).then(d => setCategories(d)).catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) setCatDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

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

  useEffect(() => {
    if (!user) { setUnreadCount(0); setNotifCount(0); setNotifOpen(false); setNotifications([]); setHasCommissions(false); return; }
    const fetchUnread = async () => {
      try {
        const r = await authFetch('/api/messages/unread/');
        if (r.ok) { const d = await r.json(); setUnreadCount(d.unread_count || 0); }
      } catch {}
      try {
        const r = await authFetch('/api/notifications/unread/');
        if (r.ok) { const d = await r.json(); setNotifCount(d.unread_count || 0); }
      } catch {}
    };
    const fetchCommissions = async () => {
      try {
        const r = await authFetch('/api/commissions/mine/');
        if (r.ok) { const d = await r.json(); setHasCommissions(d.length > 0); }
      } catch {}
    };
    fetchUnread();
    fetchCommissions();
    const interval = setInterval(fetchUnread, 30000);
    const onMessagesRead = () => fetchUnread();
    window.addEventListener('artisa:messages-read', onMessagesRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener('artisa:messages-read', onMessagesRead);
    };
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const r = await authFetch('/api/orders/cart/');
      if (r.ok) { const d = await r.json(); setCartCount(d.length); }
    } catch {}
  };

  const timeAgo = (iso) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const r = await authFetch('/api/notifications/');
      if (r.ok) setNotifications(await r.json());
    } catch {}
    setNotifLoading(false);
  };

  const toggleNotifDropdown = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next && notifications.length === 0) fetchNotifications();
  };

  const markNotifRead = async (n) => {
    if (n.is_read) return;
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    setNotifCount(c => Math.max(0, c - 1));
    try { await authFetch(`/api/notifications/${n.id}/read/`, { method: 'POST' }); } catch {}
  };

  const markAllNotifsRead = async () => {
    setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
    setNotifCount(0);
    try { await authFetch('/api/notifications/mark-all-read/', { method: 'POST' }); } catch {}
  };

  const handleNotifClick = (n) => {
    markNotifRead(n);
    setNotifOpen(false);
    navigate(n.link);
  };

  const isActive = (p) => location.pathname === p;
  const navLinkClass = (p) => `text-sm font-medium transition-colors ${isActive(p) ? 'text-amber-600' : 'text-stone-600 hover:text-stone-900'}`;
  const handleLogout = async () => { await logout(); navigate('/'); setMenuOpen(false); };
  const hasQuery = searchQuery.trim().length > 0;

  const toggleSection = (key) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const SectionHeader = ({ id, label, count }) => (
    <button onClick={() => toggleSection(id)} className="flex items-center justify-between w-full mb-2 group">
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
      <svg className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${collapsedSections[id] ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  const MobileSectionHeader = ({ id, label }) => (
    <button onClick={() => toggleSection(id)} className="flex items-center justify-between w-full mb-3 group">
      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
      <svg className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${collapsedSections[id] ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  const SearchDropdown = () => (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden z-[60] max-h-[70vh] overflow-y-auto">
      {hasQuery ? (
        <div className="py-3">
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-400">
              <Arc size={16} color="#9c4327" />
              Searching...
            </div>
          ) : (
            <>
              {searchResults.artworks.length === 0 && searchResults.artists.length === 0 && searchResults.categories.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-stone-600 mb-1">No results found</p>
                  <p className="text-xs text-stone-400">Try a different search term</p>
                </div>
              ) : (
                <>
                  {searchResults.categories.length > 0 && (
                    <div className="px-4 pb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Categories</p>
                      <div className="flex flex-wrap gap-1.5">
                        {searchResults.categories.map(cat => (
                          <button key={cat.id} onClick={() => goToSearch(cat.name)} className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200 transition">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.artists.length > 0 && (
                    <div className="px-4 pb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Artists</p>
                      {searchResults.artists.map(a => (
                        <button key={a.username} onClick={() => { navigate(`/artists/${a.username}`); setSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-stone-50 transition-colors text-left">
                          <div className="h-8 w-8 rounded-full bg-amber-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-bold text-amber-600">{a.username?.charAt(0).toUpperCase()}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{a.first_name || a.last_name ? `${a.first_name || ''} ${a.last_name || ''}`.trim() : a.username}</p>
                            <p className="text-[11px] text-stone-400">@{a.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.artworks.length > 0 && (
                    <div className="px-4 pb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Artworks</p>
                      {searchResults.artworks.map(art => (
                        <button key={art.id} onClick={() => { navigate(`/artworks/${art.id}`); setSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-stone-50 transition-colors text-left">
                          <div className="h-10 w-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                            {art.images?.[0]?.image ? <img src={art.images[0].image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-stone-300 text-xs">?</div>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{art.title}</p>
                            <p className="text-[11px] text-stone-400">by {art.artist?.username}</p>
                          </div>
                          <span className="ml-auto text-xs font-semibold text-stone-900 flex-shrink-0">NPR {formatPrice(art.price)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <button onClick={handleSearchSubmit} className="w-full py-2.5 text-sm font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors border-t border-stone-100 flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                View all results
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="py-4">
          {trending.artworks.length > 0 && (
            <div className="px-5 pb-4">
              <SectionHeader id="desktop-artworks" label="Trending Artworks" />
              {!collapsedSections['desktop-artworks'] && trending.artworks.slice(0, 5).map(art => (
                <button key={art.id} onClick={() => { navigate(`/artworks/${art.id}`); setSearchFocused(false); }} className="flex items-center gap-3 w-full px-2 py-1.5 rounded-lg hover:bg-stone-50 transition-colors text-left">
                  <div className="h-9 w-9 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                    {art.images?.[0]?.image ? <img src={art.images[0].image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-stone-300 text-xs">?</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-stone-900 truncate">{art.title}</p>
                    <p className="text-[11px] text-stone-400">by {art.artist?.username}</p>
                  </div>
                  <span className="ml-auto text-[11px] font-semibold text-stone-900 flex-shrink-0">NPR {formatPrice(art.price)}</span>
                </button>
              ))}
            </div>
          )}
          {trending.artists.length > 0 && (
            <div className="px-5 pb-4">
              <SectionHeader id="desktop-artists" label="Trending Artists" />
              {!collapsedSections['desktop-artists'] && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {trending.artists.map(a => {
                  const hasArt = a.sample_artworks?.[0]?.image;
                  return (
                    <button key={a.username} onClick={() => { navigate(`/artists/${a.username}`); setSearchFocused(false); }} className="group relative flex-shrink-0 w-28 rounded-lg overflow-hidden aspect-[4/3] transition-all duration-200">
                      {hasArt ? (
                        <>
                          <img src={a.sample_artworks[0].image} alt="" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-stone-100" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 z-10 flex items-end gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-amber-100 overflow-hidden flex-shrink-0 border border-white/30">
                          {a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-[9px] font-bold text-amber-600 flex items-center justify-center h-full">{a.username?.charAt(0).toUpperCase()}</span>}
                        </div>
                        <p className={`text-[11px] font-semibold leading-tight truncate ${hasArt ? 'text-white' : 'text-stone-800'}`}>{a.username}</p>
                      </div>
                    </button>
                  );
                })}
                </div>
              )}
            </div>
          )}
          {trending.categories.length > 0 && (
            <div className="px-5 pb-2">
              <SectionHeader id="desktop-categories" label="Browse Categories" />
              {!collapsedSections['desktop-categories'] && (
                <div className="grid grid-cols-3 gap-1.5">
                {trending.categories.map((cat) => {
                  const hasImage = cat.sample_artworks?.[0]?.image;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => goToSearch(cat.name)}
                      className="group relative rounded-lg overflow-hidden aspect-[3/2] transition-all duration-200"
                    >
                      {hasImage ? (
                        <>
                          <img src={cat.sample_artworks[0].image} alt="" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-stone-100">
                          <span className="absolute text-3xl font-black text-stone-300 opacity-40 select-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            {cat.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 z-10">
                        <p className={`text-[11px] font-semibold leading-tight ${hasImage ? 'text-white' : 'text-stone-800'}`}>{cat.name}</p>
                      </div>
                    </button>
                  );
                })}
                </div>
              )}
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
          <Link to="/marketplace" className={navLinkClass('/marketplace')}>Discover</Link>
          <Link to="/artists" className={navLinkClass('/artists')}>Artists</Link>
          <div ref={catDropdownRef} className="relative">
            <button
              onClick={() => setCatDropdown(!catDropdown)}
              className={`text-sm font-medium transition-colors ${catDropdown ? 'text-amber-600' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Categories
              <svg className={`inline-block ml-1 h-3 w-3 transition-transform ${catDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {catDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg border border-stone-200 py-2 z-50 shadow-sm">
                <button
                  onClick={() => { navigate('/marketplace'); setCatDropdown(false); }}
                  className="w-full px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50 text-left transition-colors"
                >
                  All Categories
                </button>
                <div className="border-t border-stone-100 my-1" />
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { navigate(`/marketplace?category=${cat.id}`); setCatDropdown(false); }}
                    className="w-full px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 text-left transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link to={user && hasCommissions ? '/commissions/mine' : '/commissions/landing'} className={navLinkClass(user && hasCommissions ? '/commissions/mine' : '/commissions/landing')}>{user && hasCommissions ? 'My Commissions' : 'Commissions'}</Link>
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
              <div className="relative">
                <button
                  onClick={toggleNotifDropdown}
                  className="relative p-2 text-stone-600 hover:text-stone-900 transition-colors"
                  aria-label="Notifications"
                  aria-expanded={notifOpen}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg border border-stone-200 bg-white z-50 max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col shadow-sm">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
                      <p className="text-sm font-semibold text-stone-900">Notifications</p>
                      {notifCount > 0 && (
                        <button onClick={markAllNotifsRead} className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-96">
                      {notifLoading ? (
                        <p className="px-4 py-6 text-center text-sm text-stone-400">Loading...</p>
                      ) : notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-stone-400">No notifications yet</p>
                      ) : (
                        notifications.map(n => (
                          <button
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`flex w-full gap-3 border-b border-stone-50 px-4 py-3 text-left transition-colors last:border-b-0 ${n.is_read ? 'hover:bg-stone-50' : 'bg-amber-50/50 hover:bg-amber-50'}`}
                          >
                            <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${n.is_read ? 'bg-stone-100 text-stone-400' : NOTIF_TINTS[notifKind(n.kind)]}`}>
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={NOTIF_KINDS[notifKind(n.kind)]} />
                              </svg>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate text-sm ${n.is_read ? 'text-stone-700' : 'font-semibold text-stone-900'}`}>{n.title}</span>
                              <span className="mt-0.5 block text-xs leading-snug text-stone-500 line-clamp-2">{n.body}</span>
                              <span className="mt-1 block text-[11px] text-stone-400">{timeAgo(n.created_at)}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="border-t border-stone-100">
                      <button
                        onClick={() => {
                          navigate(user.artist_profile?.status === 'approved' ? '/artist/inboxes' : '/messages');
                          setNotifOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-stone-50"
                      >
                        <svg className="h-5 w-5 flex-shrink-0 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <span className="flex-1 text-sm font-medium text-stone-700">Messages</span>
                        {unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1.5 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                        <svg className="h-4 w-4 flex-shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-stone-200 bg-white py-1.5 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto">
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
                        <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Artist Studio
                        </div>
                        <Link to={`/artists/${user.username}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          My Profile
                        </Link>
                        <Link to="/artworks/create" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Create Artwork
                        </Link>
                        <Link to="/my-artworks" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          My Artworks
                        </Link>
                        <Link to="/artist/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                          Orders
                        </Link>
                        <Link to="/artist/earnings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>
                          Earnings
                        </Link>
                        <Link to="/commissions/inbox" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          Commission Requests
                        </Link>
                      </>
                    )}

                    {user?.artist_profile?.status !== 'approved' && user.role !== 'admin' && (
                      <Link
                        to={!user?.artist_profile ? '/artist-application' : user.artist_profile.status === 'rejected' ? '/artist-application' : '/settings/account'}
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
                    <Link to="/settings/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {user?.artist_profile?.status === 'approved' ? 'Edit Profile' : 'Settings'}
                    </Link>

                    <div className="border-t border-stone-100 my-1" />

                    <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-stone-500 hover:text-red-600 hover:bg-stone-50">
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
      {notifOpen && <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />}

      {/* Mobile Search Overlay */}
      {searchFocused && (
        <div className="fixed inset-0 z-[60] md:hidden flex flex-col bg-white">
          <div className="flex items-center gap-2 px-3 py-3 border-b border-stone-100">
            <button
              onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
              className="p-2 -ml-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search artworks, artists, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition"
              />
            </form>
          </div>
          <div className="flex-1 overflow-y-auto">
            {hasQuery ? (
              <div className="py-3">
                {searching ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-stone-400">
                    <Arc size={16} color="#9c4327" />
                    Searching...
                  </div>
                ) : (
                  <>
                    {searchResults.artworks.length === 0 && searchResults.artists.length === 0 && searchResults.categories.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                          <svg className="h-8 w-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-stone-600 mb-1">No results found</p>
                        <p className="text-xs text-stone-400">Try a different search term</p>
                      </div>
                    ) : (
                      <>
                        {searchResults.categories.length > 0 && (
                          <div className="px-5 pb-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2.5">Categories</p>
                            <div className="flex flex-wrap gap-2">
                              {searchResults.categories.map(cat => (
                                <button key={cat.id} onClick={() => goToSearch(cat.name)} className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200 transition">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  {cat.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {searchResults.artists.length > 0 && (
                          <div className="px-5 pb-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2.5">Artists</p>
                            <div className="space-y-1">
                              {searchResults.artists.map(a => (
                                <button key={a.username} onClick={() => { navigate(`/artists/${a.username}`); setSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left">
                                  <div className="h-10 w-10 rounded-full bg-amber-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-amber-600">{a.username?.charAt(0).toUpperCase()}</span>}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-stone-900 truncate">{a.first_name || a.last_name ? `${a.first_name || ''} ${a.last_name || ''}`.trim() : a.username}</p>
                                    <p className="text-xs text-stone-400">@{a.username}</p>
                                  </div>
                                  <svg className="h-4 w-4 text-stone-300 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {searchResults.artworks.length > 0 && (
                          <div className="px-5 pb-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2.5">Artworks</p>
                            <div className="space-y-1">
                              {searchResults.artworks.map(art => (
                                <button key={art.id} onClick={() => { navigate(`/artworks/${art.id}`); setSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left">
                                  <div className="h-12 w-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                                    {art.images?.[0]?.image ? <img src={art.images[0].image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-stone-300 text-xs">?</div>}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-stone-900 truncate">{art.title}</p>
                                    <p className="text-xs text-stone-400">by {art.artist?.username}</p>
                                  </div>
                                  <span className="text-xs font-semibold text-stone-900 flex-shrink-0">NPR {formatPrice(art.price)}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="sticky bottom-0 px-5 py-3 bg-white/95 backdrop-blur-sm border-t border-stone-100">
                      <button onClick={handleSearchSubmit} className="w-full py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        View all results
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="py-5 px-5 space-y-6">
                {trending.artworks.length > 0 && (
                  <div>
                    <MobileSectionHeader id="mobile-artworks" label="Trending Artworks" />
                    {!collapsedSections['mobile-artworks'] && (
                      <div className="space-y-1">
                        {trending.artworks.slice(0, 5).map(art => (
                          <button key={art.id} onClick={() => { navigate(`/artworks/${art.id}`); setSearchFocused(false); }} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left">
                            <div className="h-10 w-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                            {art.images?.[0]?.image ? <img src={art.images[0].image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-stone-300 text-xs">?</div>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-stone-900 truncate">{art.title}</p>
                            <p className="text-xs text-stone-400">by {art.artist?.username}</p>
                          </div>
                          <span className="text-xs font-semibold text-stone-900 flex-shrink-0">NPR {formatPrice(art.price)}</span>
                        </button>
                      ))}
                      </div>
                    )}
                  </div>
                )}

                {trending.artists.length > 0 && (
                  <div>
                    <MobileSectionHeader id="mobile-artists" label="Trending Artists" />
                    {!collapsedSections['mobile-artists'] && (
                      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                      {trending.artists.map(a => {
                        const hasArt = a.sample_artworks?.[0]?.image;
                        return (
                          <button key={a.username} onClick={() => { navigate(`/artists/${a.username}`); setSearchFocused(false); }} className="group relative flex-shrink-0 w-32 rounded-xl overflow-hidden aspect-[4/3] transition-all duration-200 active:scale-[0.97]">
                            {hasArt ? (
                              <>
                                <img src={a.sample_artworks[0].image} alt="" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              </>
                            ) : (
                              <div className="absolute inset-0 bg-stone-100" />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 flex items-end gap-2">
                              <div className="h-7 w-7 rounded-full bg-amber-100 overflow-hidden flex-shrink-0 border border-white/30">
                                {a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] font-bold text-amber-600 flex items-center justify-center h-full">{a.username?.charAt(0).toUpperCase()}</span>}
                              </div>
                              <p className={`text-xs font-semibold leading-tight truncate ${hasArt ? 'text-white' : 'text-stone-800'}`}>{a.username}</p>
                            </div>
                          </button>
                        );
                      })}
                      </div>
                    )}
                  </div>
                )}

                {trending.categories.length > 0 && (
                  <div>
                    <MobileSectionHeader id="mobile-categories" label="Browse Categories" />
                    {!collapsedSections['mobile-categories'] && (
                      <div className="grid grid-cols-3 gap-2">
                      {trending.categories.map((cat) => {
                        const hasImage = cat.sample_artworks?.[0]?.image;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => goToSearch(cat.name)}
                            className="group relative rounded-xl overflow-hidden aspect-[3/2] transition-all duration-200 active:scale-[0.97]"
                          >
                            {hasImage ? (
                              <>
                                <img src={cat.sample_artworks[0].image} alt="" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                              </>
                            ) : (
                              <div className="absolute inset-0 bg-stone-100">
                                <span className="absolute text-4xl font-black text-stone-300 opacity-40 select-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                  {cat.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                              <p className={`text-[12px] font-semibold leading-tight ${hasImage ? 'text-white' : 'text-stone-800'}`}>{cat.name}</p>
                            </div>
                          </button>
                        );
                      })}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-stone-100">
                  <p className="text-xs text-stone-400 text-center">Search by name, category, tag, or style</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
