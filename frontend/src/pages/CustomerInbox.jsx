import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import authFetch from '../utils/authFetch';
import CommissionChat from '../components/CommissionChat';
import LoadingSpinner from '../components/LoadingSpinner';

const CustomerInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { compact } = useSidebar();
  const [commissions, setCommissions] = useState([]);
  const [inquiries, setInquiries] = useState([]);
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
      const [resCommissions, resInquiries] = await Promise.all([
        authFetch('/api/commissions/mine/'),
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
      fetchAll();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const conversations = useMemo(() => {
    const byPerson = {};

    for (const c of commissions) {
      const party = c.artist;
      const partyId = party?.id;
      if (!partyId) continue;
      const name = party?.first_name && party?.last_name
        ? `${party.first_name} ${party.last_name}`
        : party?.username || 'Artist';
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

      const commission = hasCommission ? person.commissions[0] : null;
      const inquiry = hasInquiry ? person.inquiries.reduce((latest, inq) =>
        new Date(inq.last_message_at) > new Date(latest.last_message_at) ? inq : latest
      ) : null;

      const commissionTime = commission?.updated_at ? new Date(commission.updated_at).getTime() : 0;
      const inquiryTime = inquiry?.last_message_at ? new Date(inquiry.last_message_at).getTime() : 0;
      const lastMessageAt = commissionTime > inquiryTime ? commission.updated_at : inquiry?.last_message_at;

      const commissionUnread = commission?.unread_count || 0;
      const inquiryUnread = inquiry?.unread_count || 0;
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
          ? (commission.title || `Commission with ${person.name}`)
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
  }, [commissions, inquiries, user, search]);

  if (loading) return <LoadingSpinner label="Loading messages..." />;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white">
      {/* Sidebar */}
      <div className={`${compact ? 'w-16' : 'w-80'} flex-shrink-0 border-r border-stone-200 flex flex-col transition-all duration-300`}>
        {!compact && (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-stone-900">Messages</h1>
                {conversations.some(c => c.unreadCount > 0) && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg px-2.5 py-1 font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
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
                  className="w-full bg-stone-100/70 border border-stone-200/50 rounded-lg py-2 pl-9 pr-4 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
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
                  <p className="text-xs text-stone-500 mt-1">Start a commission or inquiry to chat</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = selected?.partyId === conv.partyId;

                  return (
                    <button
                      key={conv.partyId}
                      onClick={() => setSelected(conv)}
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
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-h-[18px] min-w-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? 'text-stone-900' : 'text-stone-700'}`}>
                            {conv.name}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-stone-400 flex-shrink-0 ml-2">
                              {new Date(conv.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {conv.type === 'commission' && (
                            <span className="text-[10px] font-medium text-stone-500 bg-stone-100 rounded px-1.5 py-0.5 flex-shrink-0 capitalize">
                              {conv.subtitle}
                            </span>
                          )}
                          {conv.type === 'inquiry' && (
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 rounded px-1.5 py-0.5 flex-shrink-0">
                              inquiry
                            </span>
                          )}
                          <span className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
                            {conv.lastMessage || conv.title}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <CommissionChat
            commission={selected.commissionData}
            artworkId={selected.artworkId}
            artist={selected.party}
            embedded
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 bg-stone-50/40">
            <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-800">Your Messages</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm">
              Select a conversation to start chatting with an artist
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInbox;
