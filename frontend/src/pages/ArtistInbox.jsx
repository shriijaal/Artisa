import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import Header from '../components/Header';
import ArtistSideNav from '../components/ArtistSideNav';
import LoadingSpinner from '../components/LoadingSpinner';
import CommissionChat from '../components/CommissionChat';

const TIME_AGO = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
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
  const [activeTab, setActiveTab] = useState('all');
  const [commissions, setCommissions] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [unreadData, setUnreadData] = useState({ commission_ids: [], artwork_ids: [] });
  const [loading, setLoading] = useState(true);
  const [chatArtworkId, setChatArtworkId] = useState(null);
  const [chatArtist, setChatArtist] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resCommissions, resInquiries, resUnread] = await Promise.all([
        fetch('/api/commissions/inbox/', { headers }),
        fetch('/api/messages/inquiries/', { headers }),
        fetch('/api/messages/unread/', { headers }),
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

  const commissionCount = commissions.length;
  const inquiryCount = inquiries.length;
  const totalUnread = (unreadData.commission_ids?.length || 0) + (unreadData.artwork_ids?.length || 0);

  if (loading) return <LoadingSpinner label="Loading inbox..." />;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />
      <div className="flex">
        <ArtistSideNav />
        <main className={`${compact ? 'md:ml-16' : 'md:ml-60 xl:ml-72'} flex-1 px-6 py-10`}>
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-stone-900">Inbox</h1>
              {totalUnread > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  {totalUnread} unread
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500">
              {commissionCount} commission{commissionCount !== 1 ? 's' : ''} · {inquiryCount} inquiry{inquiryCount !== 1 ? 'ies' : 'y'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'all', label: 'All' },
              { key: 'commissions', label: 'Commissions', count: commissionCount },
              { key: 'inquiries', label: 'Inquiries', count: inquiryCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Commissions Section */}
            {(activeTab === 'all' || activeTab === 'commissions') && commissions.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Commissions</h2>
                )}
                <div className="rounded-lg border border-stone-200 bg-white divide-y divide-stone-100">
                  {commissions.map((c) => {
                    const isUnread = unreadData.commission_ids?.includes(c.id);
                    const statusColor = STATUS_COLORS[c.status] || 'bg-stone-100 text-stone-600';
                    return (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/commissions/${c.id}`)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden">
                            {c.customer?.avatar ? (
                              <img src={c.customer.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-stone-600">{c.customer?.username?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {isUnread && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                              {c.status?.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-stone-400">{TIME_AGO(c.updated_at)}</span>
                          </div>
                          <p className="text-sm font-medium text-stone-900 truncate">
                            {c.title || `Commission from ${c.customer?.username}`}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            from {c.customer?.username}
                          </p>
                        </div>
                        <svg className="h-4 w-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty commissions */}
            {(activeTab === 'commissions') && commissions.length === 0 && (
              <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
                <p className="text-3xl mb-3">📭</p>
                <p className="font-semibold text-stone-700 mb-1">No commissions yet</p>
                <p className="text-sm text-stone-500">Commission requests will appear here</p>
              </div>
            )}

            {/* Inquiries Section */}
            {(activeTab === 'all' || activeTab === 'inquiries') && inquiries.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Inquiries</h2>
                )}
                <div className="rounded-lg border border-stone-200 bg-white divide-y divide-stone-100">
                  {inquiries.map((inq) => {
                    const isUnread = unreadData.artwork_ids?.includes(inq.artwork_id);
                    return (
                      <button
                        key={inq.artwork_id}
                        onClick={() => {
                          setChatArtworkId(inq.artwork_id);
                          setChatArtist(inq.other_party);
                        }}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-stone-50 transition-colors"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="h-12 w-12 rounded-lg bg-stone-100 overflow-hidden">
                            {inq.artwork?.image ? (
                              <img src={inq.artwork.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-300 text-xs">?</div>
                            )}
                          </div>
                          {isUnread && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">{inq.artwork?.title || 'Artwork'}</p>
                          <p className="text-xs text-stone-500 truncate">
                            from {inq.other_party?.username}: {inq.last_message}
                          </p>
                        </div>
                        <span className="text-xs text-stone-400 flex-shrink-0">{TIME_AGO(inq.last_message_at)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty inquiries */}
            {(activeTab === 'inquiries') && inquiries.length === 0 && (
              <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
                <p className="text-3xl mb-3">💬</p>
                <p className="font-semibold text-stone-700 mb-1">No inquiries yet</p>
                <p className="text-sm text-stone-500">Artwork inquiries from buyers will appear here</p>
              </div>
            )}

            {/* Empty all */}
            {activeTab === 'all' && commissions.length === 0 && inquiries.length === 0 && (
              <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
                <p className="text-3xl mb-3">📭</p>
                <p className="font-semibold text-stone-700 mb-1">Your inbox is empty</p>
                <p className="text-sm text-stone-500">Messages and inquiries will appear here</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Inquiry Chat Modal */}
      {chatArtworkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setChatArtworkId(null); setChatArtist(null); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md h-[580px] rounded-xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CommissionChat
              artworkId={chatArtworkId}
              artist={chatArtist}
              embedded
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistInbox;
