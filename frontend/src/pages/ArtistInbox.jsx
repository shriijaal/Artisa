import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import Header from '../components/Header';
import ArtistSideNav from '../components/ArtistSideNav';
import authFetch from '../utils/authFetch';
import LoadingSpinner from '../components/LoadingSpinner';
import CommissionChat from '../components/CommissionChat';

const TIME_AGO = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d';
  return `${days}d`;
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  delivered: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-stone-100 text-stone-600',
  declined: 'bg-red-100 text-red-600',
};

const ArtistInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { compact } = useSidebar();
  const [commissions, setCommissions] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [unreadData, setUnreadData] = useState({ commission_ids: [], artwork_ids: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchAll();
    }, 10000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchAll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const fetchAll = async () => {
    try {
      const [resCommissions, resInquiries, resUnread] = await Promise.all([
        authFetch('/api/commissions/inbox/'),
        authFetch('/api/messages/inquiries/'),
        authFetch('/api/messages/unread/'),
      ]);
      if (resCommissions.ok) setCommissions(await resCommissions.json());
      if (resInquiries.ok) setInquiries(await resInquiries.json());
      if (resUnread.ok) {
        const d = await resUnread.json();
        setUnreadData({
          commission_ids: d.unread_commission_ids || [],
          artwork_ids: d.unread_artwork_ids || [],
        });
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const conversations = useMemo(() => {
    const items = [];

    for (const c of commissions) {
      const party = c.customer;
      const avatar = party?.avatar;
      const name = party?.first_name && party?.last_name
        ? `${party.first_name} ${party.last_name}`
        : party?.username || 'Customer';
      items.push({
        id: c.id,
        type: 'commission',
        title: c.title || `Commission from ${party?.username}`,
        subtitle: c.status?.replace(/_/g, ' '),
        name,
        avatar,
        lastMessage: null,
        lastMessageAt: c.updated_at,
        unread: unreadData.commission_ids?.includes(c.id),
        party,
        commissionData: c,
      });
    }

    for (const inq of inquiries) {
      const party = inq.other_party;
      const avatar = party?.avatar;
      const name = party?.first_name && party?.last_name
        ? `${party.first_name} ${party.last_name}`
        : party?.username || 'User';
      const preview = inq.last_message_sender === user?.id
        ? `You: ${inq.last_message}`
        : inq.last_message;
      items.push({
        id: inq.artwork_id,
        type: 'inquiry',
        title: inq.artwork?.title || 'Artwork',
        subtitle: null,
        name,
        avatar,
        artworkImage: inq.artwork?.image,
        lastMessage: preview,
        lastMessageAt: inq.last_message_at,
        unread: unreadData.artwork_ids?.includes(inq.artwork_id),
        party,
        artworkId: inq.artwork_id,
      });
    }

    items.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });

    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [commissions, inquiries, unreadData, user, search]);

  const totalUnread = conversations.filter((c) => c.unread).length;

  if (loading) return <LoadingSpinner label="Loading inbox..." />;

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
        <ArtistSideNav />

        <main className={`${compact ? 'md:ml-16' : 'md:ml-60 xl:ml-72'} flex-1 flex overflow-hidden`}>
          {/* ── Left: Conversation List ── */}
          <div
            className={`flex flex-col border-r border-stone-200 bg-white ${
              selected ? 'hidden md:flex' : 'flex'
            } w-full md:w-[340px] lg:w-[380px] flex-shrink-0`}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-bold text-stone-900">Messages</h1>
                  {totalUnread > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {totalUnread}
                    </span>
                  )}
                </div>
              </div>
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 transition"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                  <div className="h-14 w-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 mb-3">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-stone-700">No conversations yet</p>
                  <p className="text-xs text-stone-500 mt-1">Messages and inquiries will appear here</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive =
                    (conv.type === 'inquiry' && selected?.type === 'inquiry' && selected?.id === conv.id) ||
                    (conv.type === 'commission' && selected?.type === 'commission' && selected?.id === conv.id);

                  return (
                    <button
                      key={`${conv.type}-${conv.id}`}
                      onClick={() => {
                        if (conv.type === 'commission') {
                          navigate(`/commissions/${conv.id}`);
                        } else {
                          setSelected(conv);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors border-b border-stone-100 ${
                        isActive
                          ? 'bg-stone-100'
                          : 'hover:bg-stone-50'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {conv.artworkImage ? (
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-stone-100">
                            <img src={conv.artworkImage} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden">
                            {conv.avatar ? (
                              <img src={conv.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-stone-600">{conv.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        )}
                        {conv.unread && (
                          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-sm font-semibold truncate ${conv.unread ? 'text-stone-900' : 'text-stone-700'}`}>
                            {conv.name}
                          </span>
                          <span className="text-[11px] text-stone-400 flex-shrink-0">
                            {TIME_AGO(conv.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {conv.type === 'commission' && conv.subtitle && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_COLORS[conv.subtitle] || 'bg-stone-100 text-stone-600'}`}>
                              {conv.subtitle}
                            </span>
                          )}
                          <p className={`text-xs truncate ${conv.unread ? 'text-stone-700 font-medium' : 'text-stone-500'}`}>
                            {conv.type === 'inquiry' ? (conv.lastMessage || conv.title) : conv.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right: Chat Panel ── */}
          <div className={`flex-1 flex flex-col bg-[#faf9f7] ${selected ? 'flex' : 'hidden md:flex'}`}>
            {selected ? (
              <>
                {/* Mobile back button */}
                <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-white">
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1 -ml-1 text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-semibold text-stone-900 truncate">{selected.name}</span>
                </div>

                {/* Chat */}
                <div className="flex-1 overflow-hidden">
                  {selected.type === 'inquiry' ? (
                    <CommissionChat
                      artworkId={selected.artworkId}
                      artist={selected.party}
                      embedded
                    />
                  ) : (
                    <CommissionChat
                      commission={selected.commissionData}
                      embedded
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center h-full text-center px-8">
                <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-stone-700 mb-1">Select a conversation</h3>
                <p className="text-sm text-stone-500 max-w-xs">
                  Choose a conversation from the left to start messaging
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ArtistInbox;
