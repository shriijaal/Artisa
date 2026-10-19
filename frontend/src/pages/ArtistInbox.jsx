import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  pending: 'bg-stone-100 text-stone-600',
  accepted: 'bg-stone-100 text-stone-600',
  in_progress: 'bg-stone-100 text-stone-600',
  delivered: 'bg-stone-100 text-stone-600',
  completed: 'bg-stone-100 text-stone-600',
  cancelled: 'bg-stone-100 text-stone-500',
  declined: 'bg-stone-100 text-stone-500',
};

const ArtistInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { compact } = useSidebar();
  const [searchParams, setParams] = useSearchParams();
  const [commissions, setCommissions] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAll();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
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
      const [resCommissions, resInquiries] = await Promise.all([
        authFetch('/api/commissions/inbox/'),
        authFetch('/api/messages/inquiries/'),
      ]);
      if (resCommissions.ok) setCommissions(await resCommissions.json());
      if (resInquiries.ok) setInquiries(await resInquiries.json());
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await authFetch('/api/messages/mark-all-read/', { method: 'POST' });
      window.dispatchEvent(new CustomEvent('artisa:messages-read'));
      fetchAll();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const selectConv = (conv) => {
    setSelected(conv);
    if (conv.unreadCount > 0) {
      setCommissions((prev) => prev.map((c) => (c.customer?.id === conv.partyId ? { ...c, unread_count: 0 } : c)));
      setInquiries((prev) => prev.map((q) => (q.other_party?.id === conv.partyId ? { ...q, unread_count: 0 } : q)));
      window.dispatchEvent(new CustomEvent('artisa:messages-read'));
    }
    setParams((prev) => ({ ...prev, thread: conv.id }), { replace: true });
  };

  const deselect = () => {
    setSelected(null);
    setParams((prev) => {
      const next = { ...prev };
      delete next.thread;
      return next;
    }, { replace: true });
  };

  const unreadTotal = useMemo(
    () =>
      commissions.reduce((s, c) => s + (c.unread_count || 0), 0) +
      inquiries.reduce((s, q) => s + (q.unread_count || 0), 0),
    [commissions, inquiries]
  );

  const conversations = useMemo(() => {
    const byPerson = {};

    for (const c of commissions) {
      const party = c.customer;
      const partyId = party?.id;
      if (!partyId) continue;
      const name = party?.first_name && party?.last_name
        ? `${party.first_name} ${party.last_name}`
        : party?.username || 'Customer';
      if (!byPerson[partyId]) {
        byPerson[partyId] = {
          partyId,
          name,
          avatar: party?.avatar,
          party,
          commissions: [],
          inquiries: [],
        };
      }
      byPerson[partyId].commissions.push(c);
    }

    for (const inq of inquiries) {
      const party = inq.other_party;
      const partyId = party?.id;
      if (!partyId) continue;
      const name = party?.first_name && party?.last_name
        ? `${party.first_name} ${party.last_name}`
        : party?.username || 'User';
      if (!byPerson[partyId]) {
        byPerson[partyId] = {
          partyId,
          name,
          avatar: party?.avatar,
          party,
          commissions: [],
          inquiries: [],
        };
      }
      byPerson[partyId].inquiries.push(inq);
    }

    const items = Object.values(byPerson).map((person) => {
      const hasCommission = person.commissions.length > 0;
      const hasInquiry = person.inquiries.length > 0;

      const openCommission = person.commissions.find(
        (c) => !['cancelled', 'declined'].includes(c.status)
      );
      const commission = openCommission || person.commissions[0] || null;
      const inquiry = hasInquiry ? person.inquiries.reduce((latest, inq) =>
        new Date(inq.last_message_at) > new Date(latest.last_message_at) ? inq : latest
      ) : null;

      const commissionTime = commission?.updated_at ? new Date(commission.updated_at).getTime() : 0;
      const inquiryTime = inquiry?.last_message_at ? new Date(inquiry.last_message_at).getTime() : 0;
      const lastMessageAt = commissionTime > inquiryTime ? commission.updated_at : inquiry?.last_message_at;

      const commissionUnread = person.commissions.reduce((s, c) => s + (c.unread_count || 0), 0);
      const inquiryUnread = person.inquiries.reduce((s, q) => s + (q.unread_count || 0), 0);
      const totalUnread = commissionUnread + inquiryUnread;

      let lastMessage = null;
      if (commission?.last_message) {
        const senderId = commission.last_message.sender_id;
        lastMessage = senderId === user?.id
          ? `You: ${commission.last_message.body}`
          : commission.last_message.body;
      } else if (inquiry?.last_message) {
        lastMessage = inquiry.last_message_sender === user?.id
          ? `You: ${inquiry.last_message}`
          : inquiry.last_message;
      }

      const subtitle = hasCommission
        ? commission.status?.replace(/_/g, ' ')
        : null;

      return {
        id: commission?.id || inquiry?.artwork_id,
        partyId: person.partyId,
        type: hasCommission ? 'commission' : 'inquiry',
        hasBoth: hasCommission && hasInquiry,
        title: hasCommission
          ? (commission.title || `Commission from ${person.name}`)
          : (inquiry?.artwork?.title || 'Artwork'),
        subtitle,
        name: person.name,
        avatar: person.avatar,
        artworkImage: inquiry?.artwork?.image,
        lastMessage,
        lastMessageAt,
        unreadCount: totalUnread,
        party: person.party,
        commissionData: commission,
        artworkId: inquiry?.artwork_id,
      };
    });

    items.sort((a, b) => {
      const unreadDiff = (b.unreadCount > 0 ? 1 : 0) - (a.unreadCount > 0 ? 1 : 0);
      if (unreadDiff !== 0) return unreadDiff;
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });

    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
      );
    }
    if (filter === 'unread') result = result.filter((c) => c.unreadCount > 0);
    return result;
  }, [commissions, inquiries, user, search, filter]);

  useEffect(() => {
    const thread = searchParams.get('thread');
    if (!thread || loading) return;
    const conv = conversations.find((c) => c.id === thread);
    if (conv) {
      setSelected((prev) => (prev && prev.id === conv.id ? prev : conv));
    } else {
      setParams((prev) => {
        const next = { ...prev };
        delete next.thread;
        return next;
      }, { replace: true });
    }
  }, [searchParams, conversations, loading, setParams]);

  const totalUnread = conversations.filter((c) => c.unreadCount > 0).length;

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
                  <h1 className="text-[15px] font-semibold text-stone-900">Messages</h1>
                  {totalUnread > 0 && (
                    <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-white">
                      {totalUnread}
                    </span>
                  )}
                </div>
              </div>
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-stone-100/60 border border-stone-200/50 rounded-lg py-2 pl-9 pr-4 text-[13px] text-stone-700 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-300 transition-all"
                />
              </div>

              {/* Filter: All / Unread */}
              <div className="mt-3 flex rounded-lg bg-stone-100/60 p-0.5">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 rounded-md py-1.5 text-[11px] font-medium transition-colors ${filter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 rounded-md py-1.5 text-[11px] font-medium transition-colors ${filter === 'unread' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Unread{unreadTotal > 0 ? ` (${unreadTotal})` : ''}
                </button>
              </div>

              {/* Mark All Read */}
              {conversations.some(c => c.unreadCount > 0) && (
                <button
                  onClick={handleMarkAllRead}
                  className="w-full mt-2 text-[11px] text-stone-600 hover:text-stone-900 font-medium py-1.5 transition-colors"
                >
                  Mark all as read
                </button>
              )}
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
                  {commissions.length === 0 && inquiries.length === 0 ? (
                    <>
                      <p className="text-[13px] font-semibold text-stone-700">No conversations yet</p>
                      <p className="text-[11px] text-stone-400 mt-1">Messages and inquiries will appear here</p>
                    </>
                  ) : filter === 'unread' ? (
                    <p className="text-[13px] font-semibold text-stone-700">You're all caught up</p>
                  ) : (
                    <p className="text-[13px] font-semibold text-stone-700">No matching conversations</p>
                  )}
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = selected?.partyId === conv.partyId;

                  return (
                    <button
                      key={conv.partyId}
                      onClick={() => selectConv(conv)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors border-b border-stone-100 ${
                        isActive
                          ? 'bg-stone-100'
                          : 'hover:bg-stone-50'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {conv.artworkImage ? (
                          <div className="h-11 w-11 rounded-lg overflow-hidden bg-stone-100">
                            <img src={conv.artworkImage} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden">
                            {conv.avatar ? (
                              <img src={conv.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[13px] font-semibold text-stone-600">{conv.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-h-[18px] min-w-[18px] px-1 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-[13px] truncate ${conv.unreadCount > 0 ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'}`}>
                            {conv.name}
                          </span>
                          <span className="text-[10px] text-stone-400 flex-shrink-0">
                            {TIME_AGO(conv.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {conv.subtitle && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[conv.subtitle] || 'bg-stone-100 text-stone-600'}`}>
                              {conv.subtitle}
                            </span>
                          )}
                          {conv.hasBoth && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
                              inquiry
                            </span>
                          )}
                          <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
                            {conv.lastMessage || conv.title}
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
          <div className={`flex-1 flex flex-col bg-white ${selected ? 'flex' : 'hidden md:flex'}`}>
            {selected ? (
              <>
                {/* Mobile back button */}
                <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-white">
                  <button
                    onClick={deselect}
                    className="p-1 -ml-1 text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-[13px] font-semibold text-stone-900 truncate">{selected.name}</span>
                </div>

                {/* Chat */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {selected.commissionData && (
                    <button
                      onClick={() => navigate(`/commissions/${selected.commissionData.id}`)}
                      className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-200/80 hover:bg-stone-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[selected.commissionData.status] || 'bg-stone-100 text-stone-600'}`}>
                          {selected.commissionData.status?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[13px] font-medium text-stone-700 truncate">
                          {selected.commissionData.title || 'Commission'}
                        </span>
                      </div>
                      <svg className="h-4 w-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  <div className="flex-1 overflow-hidden">
                    {selected.artworkId ? (
                      <CommissionChat
                        artworkId={selected.artworkId}
                        artist={selected.party}
                        embedded
                      />
                    ) : selected.commissionData ? (
                      <CommissionChat
                        commission={selected.commissionData}
                        embedded
                      />
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center h-full text-center px-8">
                <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-[15px] font-semibold text-stone-700 mb-1">Select a conversation</h3>
                <p className="text-[13px] text-stone-400 max-w-xs">
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
