import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '⏳' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '✅' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🎨' },
  delivered: { label: 'Delivered', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '📦' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200', icon: '🎉' },
  cancelled: { label: 'Cancelled', color: 'bg-stone-100 text-stone-600 border-stone-200', icon: '✖' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700 border-red-200', icon: '🚫' },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled / Declined' },
];

const getDeadlineInfo = (deadline, status) => {
  if (['completed', 'cancelled', 'declined'].includes(status)) return null;
  const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { text: 'Due today!', urgent: true };
  if (days <= 3) return { text: `${days}d left`, urgent: true };
  return { text: `${days}d left`, urgent: false };
};

const MyCommissions = () => {
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState([]);
  const [unreadIds, setUnreadIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const [resCommissions, resUnread] = await Promise.all([
        fetch('/api/commissions/mine/', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/messages/unread/', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (resCommissions.ok) {
        setCommissions(await resCommissions.json());
      }
      if (resUnread.ok) {
        const data = await resUnread.json();
        setUnreadIds(data.unread_commission_ids || []);
      }
    } catch (err) {
      console.error('Error fetching commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCommissions = (key) => {
    if (key === 'all') return commissions;
    if (key === 'cancelled') return commissions.filter(c => c.status === 'cancelled' || c.status === 'declined');
    return commissions.filter(c => c.status === key);
  };

  const filtered = getFilteredCommissions(filter);

  const counts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab.key] = getFilteredCommissions(tab.key).length;
    return acc;
  }, {});

  const activeCount = commissions.filter(c =>
    ['pending', 'accepted', 'in_progress', 'delivered'].includes(c.status)
  ).length;

  const needsAttention = commissions.filter(c => c.status === 'delivered').length;

  if (loading) return <LoadingSpinner label="Loading your commissions..." />;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              My Commissions
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              {commissions.length} total · {activeCount} active
            </p>
          </div>
          {needsAttention > 0 && (
            <div className="rounded-lg bg-[#9c4327]/10 border border-[#9c4327]/20 px-4 py-3 text-sm text-[#9c4327] font-medium flex items-center gap-2">
              <span className="text-base">📦</span>
              {needsAttention} {needsAttention === 1 ? 'delivery' : 'deliveries'} awaiting your review
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
                filter === tab.key
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  filter === tab.key ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Commission List */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
            <p className="text-3xl mb-3">🎨</p>
            <p className="font-semibold text-stone-700 mb-1">
              {filter === 'all' ? 'No commissions yet' : `No ${STATUS_CONFIG[filter]?.label || filter} commissions`}
            </p>
            <p className="text-sm text-stone-500 mb-6">
              {filter === 'all'
                ? 'Request a custom artwork from a verified artist.'
                : 'Nothing here yet.'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/marketplace')}
                className="rounded-lg bg-[#000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition"
              >
                Browse Artists
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              const deadlineInfo = getDeadlineInfo(c.deadline, c.status);
              const needsReview = c.status === 'delivered';

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/commissions/${c.id}`)}
                  className={`cursor-pointer rounded-lg border bg-white p-5 hover:border-stone-300 transition group ${
                    needsReview ? 'border-orange-200' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-stone-900 truncate group-hover:text-amber-700 transition">
                          {c.title}
                        </h3>
                        {needsReview && (
                          <span className="flex-shrink-0 rounded-full bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 border border-orange-200">
                            Action Required
                          </span>
                        )}
                        {unreadIds.includes(c.id) && (
                          <span className="flex-shrink-0 rounded-full bg-stone-900 text-white text-[11px] font-semibold px-2 py-0.5 flex items-center gap-1">
                            <span>💬</span> New Message
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-500">
                        Artist: <span className="font-medium">{c.artist?.username}</span>
                      </p>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-1">{c.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                      <p className="text-xs text-stone-500 font-medium">
                        Rs.{Number(c.budget_min).toLocaleString()} – {Number(c.budget_max).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-2">
                        {deadlineInfo && (
                          <span className={`text-xs font-semibold ${deadlineInfo.urgent ? 'text-red-500' : 'text-stone-400'}`}>
                            {deadlineInfo.urgent && '⚠ '}{deadlineInfo.text}
                          </span>
                        )}
                        <span className="text-xs text-stone-300">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCommissions;
