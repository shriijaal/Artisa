import { useState, useEffect, useMemo } from 'react';
import authFetch from '../utils/authFetch';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchApplications = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    authFetch(`/api/admin/applications/?${params}`)
      .then((r) => r.json())
      .then(setApplications)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApplications(); }, [search, statusFilter]);

  const handleAction = async (applicationId, action) => {
    setProcessing(true);
    try {
      const res = await authFetch(`/api/admin/applications/${applicationId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejection_reason: rejectReason }),
      });
      if (res.ok) {
        setApplications((prev) => prev.map((a) =>
          a.id === applicationId
            ? { ...a, status: action === 'approve' ? 'approved' : 'rejected', rejection_reason: rejectReason }
            : a
        ));
        setActionModal(null);
        setRejectReason('');
        fetchApplications();
      }
    } finally {
      setProcessing(false);
    }
  };

  const filtered = useMemo(() => applications, [applications]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Applications</h1>
        <p className="text-sm text-stone-500 mt-1">Review artist verification requests</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-sm">No applications found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Applicant</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Reason</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-stone-900">{app.username}</p>
                    <p className="text-xs text-stone-500">{app.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-stone-600 line-clamp-2 max-w-xs">{app.reason}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[app.status] || 'bg-stone-100 text-stone-600'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-stone-500">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(app.id, 'approve')}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setActionModal(app)}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-stone-900">Reject Application</h3>
            <p className="text-sm text-stone-500 mt-1">Provide a reason for rejecting {actionModal.username}'s application.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="mt-4 w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Rejection reason..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setActionModal(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(actionModal.id, 'reject')}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
