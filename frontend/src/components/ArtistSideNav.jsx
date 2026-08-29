import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ArtistSideNav = ({ artworkCount = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    fetchUnread();
  }, []);

  const fetchUnread = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/messages/unread/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMsgCount(data.unread_count || 0);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    {
      label: 'My Profile',
      path: `/artists/${user?.username}`,
      exact: true,
      icon: (active) => (
        <svg className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-stone-950 stroke-[2.5]' : 'text-stone-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: 'Create Artwork',
      path: '/artworks/create',
      badge: '+ New',
      icon: (active) => (
        <svg className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-amber-600 stroke-[2.5]' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'My Artworks',
      path: '/my-artworks',
      count: artworkCount || undefined,
      icon: (active) => (
        <svg className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-stone-950 stroke-[2.5]' : 'text-stone-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Artwork Orders',
      path: '/artist/orders',
      icon: (active) => (
        <svg className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-stone-950 stroke-[2.5]' : 'text-stone-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: 'Commissions',
      path: '/commissions/inbox',
      count: unreadMsgCount || undefined,
      icon: (active) => (
        <svg className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-stone-950 stroke-[2.5]' : 'text-stone-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: 'Earnings & Stats',
      path: '/artist/earnings',
      icon: (active) => (
        <svg className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-stone-950 stroke-[2.5]' : 'text-stone-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Edit Profile',
      path: '/profile/edit',
      icon: (active) => (
        <svg className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-stone-950 stroke-[2.5]' : 'text-stone-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Marketplace',
      path: '/marketplace',
      icon: (active) => (
        <svg className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? 'text-stone-950 stroke-[2.5]' : 'text-stone-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Desktop Fixed Side Navigation Panel (Facebook / Instagram Style, below Header) */}
      <aside className="hidden md:flex fixed top-[65px] left-0 bottom-0 z-40 w-60 xl:w-72 bg-white border-r border-stone-200 flex-col justify-between px-4 py-5 select-none shadow-[2px_0_12px_rgba(0,0,0,0.03)] overflow-y-auto">
        <div>
          {/* Studio Banner */}
          <div className="px-3 py-2.5 mb-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-stone-900 tracking-tight">Artist Studio</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
              Verified
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-stone-100 font-bold text-stone-950 shadow-sm'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {item.icon(isActive)}
                    <span className="text-sm tracking-tight truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-xs font-semibold bg-stone-200/80 text-stone-700 px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Instagram Mobile Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <Link
          to={`/artists/${user?.username}`}
          className={`flex flex-col items-center gap-0.5 p-1 ${location.pathname === `/artists/${user?.username}` ? 'text-amber-600' : 'text-stone-500'}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
        <Link
          to="/artworks/create"
          className="flex flex-col items-center gap-0.5 p-1 text-amber-600"
        >
          <div className="h-7 w-7 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </Link>
        <Link
          to="/my-artworks"
          className={`flex flex-col items-center gap-0.5 p-1 ${location.pathname === '/my-artworks' ? 'text-amber-600' : 'text-stone-500'}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-medium">Artworks</span>
        </Link>
        <Link
          to="/commissions/inbox"
          className={`flex flex-col items-center gap-0.5 p-1 ${location.pathname === '/commissions/inbox' ? 'text-amber-600' : 'text-stone-500'}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-[10px] font-medium">Commissions</span>
        </Link>
        <Link
          to="/artist/orders"
          className={`flex flex-col items-center gap-0.5 p-1 ${location.pathname === '/artist/orders' ? 'text-amber-600' : 'text-stone-500'}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-[10px] font-medium">Orders</span>
        </Link>
        <Link
          to="/profile/edit"
          className={`flex flex-col items-center gap-0.5 p-1 ${location.pathname === '/profile/edit' ? 'text-amber-600' : 'text-stone-500'}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </div>
    </>
  );
};

export default ArtistSideNav;
