import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import authFetch from '../utils/authFetch';
import { formatPrice } from '../utils/formatPrice';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-400/10 text-yellow-700 border border-yellow-300/30 backdrop-blur-sm' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  delivered: { label: 'Delivered', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-stone-100 text-stone-600 border-stone-200' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700 border-red-200' },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled / Declined' },
];

const PROGRESS_STEPS = ['pending', 'accepted', 'in_progress', 'delivered', 'completed'];
const STEP_LABELS = ['Pending', 'Accepted', 'In Progress', 'Delivered', 'Completed'];

const getDeadlineInfo = (deadline, status) => {
  if (['completed', 'cancelled', 'declined'].includes(status)) return null;
  const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { text: 'Due today!', urgent: true };
  if (days <= 3) return { text: `${days}d left`, urgent: true };
  return { text: `${days}d left`, urgent: false };
};

const getProgressIndex = (status) => {
  if (status === 'cancelled' || status === 'declined') return -1;
  return PROGRESS_STEPS.indexOf(status);
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
      const [resCommissions, resUnread] = await Promise.all([
        authFetch('/api/commissions/mine/'),
        authFetch('/api/messages/unread/'),
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

  const isOverdue = (c) => {
    if (['completed', 'cancelled', 'declined'].includes(c.status)) return false;
    return new Date(c.deadline) < new Date();
  };

  const getFilteredCommissions = (key) => {
    if (key === 'all') return commissions;
    if (key === 'overdue') return commissions.filter(isOverdue);
    if (key === 'cancelled') return commissions.filter(c => c.status === 'cancelled' || c.status === 'declined');
    return commissions.filter(c => c.status === key);
  };

  const filtered = getFilteredCommissions(filter);

  const counts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab.key] = getFilteredCommissions(tab.key).length;
    return acc;
  }, {});

  if (loading) return <LoadingSpinner label="Loading your commissions..." />;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">My Commissions</h1>
          <p className="text-sm text-stone-500 mt-1">
            Track and manage your custom artwork requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_TABS.map((tab) => {
            const isOverdueTab = tab.key === 'overdue';
            const hasOverdue = counts.overdue > 0;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
                  filter === tab.key
                    ? isOverdueTab && hasOverdue
                      ? 'bg-red-600 text-white'
                      : 'bg-stone-900 text-white'
                    : isOverdueTab && hasOverdue
                      ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                    filter === tab.key ? 'bg-white/20 text-white' : isOverdueTab && hasOverdue ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Commission List */}
        <div className="space-y-3">
          {filtered.map((c) => {
            const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
            const deadlineInfo = getDeadlineInfo(c.deadline, c.status);
            const needsReview = c.status === 'delivered';
            const progressIdx = getProgressIndex(c.status);
            const hasUnread = unreadIds.includes(c.id);
            const artistName = c.artist?.first_name && c.artist?.last_name
              ? `${c.artist.first_name} ${c.artist.last_name}`
              : c.artist?.username || 'Artist';
            const isTerminal = ['cancelled', 'declined'].includes(c.status);

            return (
              <div
                key={c.id}
                className={`rounded-lg border bg-white p-5 transition ${
                  needsReview ? 'border-orange-200' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title + Badges */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-stone-900 truncate">
                        {c.title}
                      </h3>
                      {needsReview && (
                        <span className="flex-shrink-0 rounded-full bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 border border-orange-200">
                          Action Required
                        </span>
                      )}
                      {hasUnread && (
                        <span className="flex-shrink-0 rounded-full bg-stone-900 text-white text-[11px] font-semibold px-2 py-0.5">
                          New Message
                        </span>
                      )}
                    </div>

                    {/* Artist + Date */}
                    <div className="flex items-center gap-2 mb-3">
                      {c.artist?.avatar ? (
                        <img src={c.artist.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500">
                          {artistName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-stone-500">
                        <span className="font-medium">{artistName}</span>
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-xs text-stone-400">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Progress Steps */}
                    {isTerminal ? (
                      <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>
                        {c.status === 'cancelled' ? (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        )}
                        {sc.label}
                      </div>
                    ) : (
                      <div className="flex items-center gap-0">
                        {PROGRESS_STEPS.map((step, idx) => {
                          const isCompleted = progressIdx > idx;
                          const isCurrent = progressIdx === idx;
                          return (
                            <div key={step} className="flex items-center">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                    isCompleted
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : isCurrent
                                      ? 'bg-amber-500 border-amber-500 text-white'
                                      : 'bg-white border-stone-200 text-stone-300'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    idx + 1
                                  )}
                                </div>
                                <span
                                  className={`mt-1 text-[10px] font-medium whitespace-nowrap ${
                                    isCurrent ? 'text-amber-600' : isCompleted ? 'text-emerald-600' : 'text-stone-300'
                                  }`}
                                >
                                  {STEP_LABELS[idx]}
                                </span>
                              </div>
                              {idx < PROGRESS_STEPS.length - 1 && (
                                <div
                                  className={`w-4 h-0.5 mx-0.5 -mt-4 transition-all ${
                                    isCompleted ? 'bg-emerald-400' : 'bg-stone-200'
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="text-right flex-shrink-0 space-y-2">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>
                      {sc.label}
                    </span>
                    <p className="text-sm text-stone-700 font-semibold">
                      {formatPrice(c.budget_min)} – {formatPrice(c.budget_max)}
                    </p>
                    {deadlineInfo && (
                      <p className={`text-xs font-semibold ${deadlineInfo.urgent ? 'text-red-500' : 'text-stone-400'}`}>
                        {deadlineInfo.urgent && '⚠ '}{deadlineInfo.text}
                      </p>
                    )}
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => navigate(`/commissions/${c.id}`)}
                        className="rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium py-1.5 px-3 transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => navigate(`/commissions/${c.id}?tab=messages`)}
                        className="rounded-md bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium py-1.5 px-3 transition flex items-center gap-1"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                        Chat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default MyCommissions;
