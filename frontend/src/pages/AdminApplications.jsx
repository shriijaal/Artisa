import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import authFetch from '../utils/authFetch';
import RichTextView from '../components/editor/RichTextView';

const tabs = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const statusColors = {
  pending: { pill: 'bg-amber-50 text-amber-700 shadow-sm', dot: 'bg-amber-500' },
  approved: { pill: 'bg-emerald-50 text-emerald-700 shadow-sm', dot: 'bg-emerald-500' },
  rejected: { pill: 'bg-red-50 text-red-700 shadow-sm', dot: 'bg-red-500' },
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, applicationId: null, username: '', reason: '' });
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const fetchApplications = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    authFetch(`/api/admin/applications/?${params}`)
      .then((r) => r.json())
      .then(setApplications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  useEffect(() => {
    if (!toast) { setCountdown(0); return; }
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setToast(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [toast]);

  const showToast = (message) => setToast({ message });

  const handleApprove = async (application) => {
    setProcessing(true);
    try {
      const res = await authFetch(`/api/admin/applications/${application.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (res.ok) {
        setApplications((prev) => prev.map((a) =>
          a.id === application.id ? { ...a, status: 'approved' } : a
        ));
        showToast(`Application approved — ${application.username} is now an artist`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    const { applicationId, username, reason } = rejectModal;
    if (!reason.trim()) return;
    setProcessing(true);
    try {
      const res = await authFetch(`/api/admin/applications/${applicationId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejection_reason: reason.trim() }),
      });
      if (res.ok) {
        setApplications((prev) => prev.map((a) =>
          a.id === applicationId
            ? { ...a, status: 'rejected', rejection_reason: reason.trim() }
            : a
        ));
        setRejectModal({ open: false, applicationId: null, username: '', reason: '' });
        showToast(`Application rejected — ${username} has been notified`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const counts = useMemo(() => ({
    '': applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }), [applications]);

  const filtered = useMemo(
    () => applications.filter((a) => !activeTab || a.status === activeTab),
    [applications, activeTab]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Applications</h1>
        <p className="text-sm text-stone-500 mt-1">
          {loading ? 'Loading...' : `${applications.length} application${applications.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-80 bg-stone-900 text-white rounded-xl shadow-lg overflow-hidden animate-[slideUp_0.2s_ease-out]">
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="text-sm flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-stone-400 hover:text-white transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="h-0.5 bg-stone-700">
            <div
              className="h-full bg-stone-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts[''] },
          { label: 'Pending', value: counts.pending },
          { label: 'Approved', value: counts.approved },
          { label: 'Rejected', value: counts.rejected },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-semibold mt-1.5 text-stone-900 tabular-nums tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-500'
              }`}>
                {counts[tab.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search by username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-200 border-t-stone-900" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-stone-700 tracking-tight">No applications found</p>
            <p className="text-xs text-stone-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Applicant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Reason</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((app) => {
                const status = statusColors[app.status] || statusColors.pending;
                return (
                  <Fragment key={app.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                      className="hover:bg-stone-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-sm font-semibold ring-1 ring-stone-200 overflow-hidden shrink-0">
                            {app.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-900 truncate tracking-tight">{app.username}</p>
                            <p className="text-xs text-stone-500 truncate mt-0.5">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-600 line-clamp-2 max-w-xs">{app.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${status.pill}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500 tabular-nums">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {app.status === 'pending' && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApprove(app)}
                              disabled={processing}
                              className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ open: true, applicationId: app.id, username: app.username, reason: '' })}
                              disabled={processing}
                              className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <svg className={`h-4 w-4 text-stone-400 transition-transform ${expandedId === app.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </td>
                    </tr>

                    {expandedId === app.id && (
                      <tr key={`${app.id}-detail`}>
                        <td colSpan={6} className="px-6 py-0">
                          <div className="py-4 border-t border-stone-100 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Why this artist?</h4>
                                <p className="text-sm text-stone-600 leading-relaxed">{app.reason}</p>
                              </div>
                              <div className="space-y-4">
                                {app.bio && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Bio</p>
                                    <RichTextView html={app.bio} className="text-stone-600" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {Array.isArray(app.specialties) && app.specialties.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Specialties</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {app.specialties.map((s) => (
                                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-medium">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {Array.isArray(app.portfolio_samples) && app.portfolio_samples.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Portfolio Samples</h4>
                                <ul className="space-y-1">
                                  {app.portfolio_samples.map((url, i) => (
                                    <li key={url || i}>
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-stone-700 underline decoration-stone-300 underline-offset-2 hover:text-stone-900 break-all"
                                      >
                                        {url}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {app.social_links && Object.keys(app.social_links).length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Social Links</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  {Object.entries(app.social_links).map(([platform, url]) => url && (
                                    <a
                                      key={platform}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-stone-700 hover:text-stone-900"
                                    >
                                      <span className="font-medium capitalize">{platform}</span>
                                      <span className="text-stone-400"> · {url}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {app.status === 'rejected' && app.rejection_reason && (
                              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Rejection Reason</span>
                                <p className="text-sm text-red-800 mt-1">{app.rejection_reason}</p>
                              </div>
                            )}

                            {app.reviewed_at && (
                              <p className="text-xs text-stone-400">
                                Reviewed{app.reviewed_by ? ` by ${app.reviewed_by}` : ''} · {formatDate(app.reviewed_at)}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-stone-900">Reject Application</h3>
            <p className="text-sm text-stone-500 mt-1">Provide a reason for rejecting {rejectModal.username}'s application. They will be notified by email.</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
              rows={4}
              autoFocus
              className="mt-4 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 resize-none"
              placeholder="e.g. Portfolio does not show original work, incomplete profile, missing specialties..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectModal({ open: false, applicationId: null, username: '', reason: '' })}
                className="flex-1 px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectModal.reason.trim() || processing}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
