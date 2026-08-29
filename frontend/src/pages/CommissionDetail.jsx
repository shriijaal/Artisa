import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import CommissionChat from '../components/CommissionChat';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: '⏳',
    description: 'Waiting for artist to respond',
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '✅',
    description: 'Artist has accepted your request',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: '🎨',
    description: 'Artist is working on your commission',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: '📦',
    description: 'Work delivered — please review',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: '🎉',
    description: 'Commission successfully completed',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-stone-100 text-stone-600 border-stone-200',
    icon: '✖',
    description: 'Commission was cancelled',
  },
  declined: {
    label: 'Declined',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: '🚫',
    description: 'Artist declined this request',
  },
};

const STATUS_STEPS = ['pending', 'accepted', 'in_progress', 'delivered', 'completed'];

const StatusTimeline = ({ currentStatus }) => {
  const terminalStatuses = ['cancelled', 'declined'];
  if (terminalStatuses.includes(currentStatus)) {
    const cfg = STATUS_CONFIG[currentStatus];
    return (
      <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${cfg.color}`}>
        <span className="text-lg">{cfg.icon}</span>
        <div>
          <p className="font-semibold text-sm">{cfg.label}</p>
          <p className="text-xs opacity-80">{cfg.description}</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const cfg = STATUS_CONFIG[step];
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isActive
                    ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200'
                    : 'bg-white border-stone-200 text-stone-300'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`mt-1 text-xs font-medium whitespace-nowrap ${
                  isDone ? 'text-emerald-600' : isActive ? 'text-amber-600' : 'text-stone-300'
                }`}
              >
                {cfg.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 -mt-5 transition-all ${
                  isDone ? 'bg-emerald-400' : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const DeliverableCard = ({ deliverable }) => {
  const isImage = /\.(jpg|jpeg|png|webp)(\?|$)/i.test(deliverable.file);
  const isPdf = /\.pdf(\?|$)/i.test(deliverable.file);
  const isZip = /\.zip(\?|$)/i.test(deliverable.file);

  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 hover:border-stone-300 transition">
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
            isImage
              ? 'bg-blue-100'
              : isPdf
              ? 'bg-red-100'
              : isZip
              ? 'bg-yellow-100'
              : 'bg-stone-200'
          }`}
        >
          {isImage ? '🖼️' : isPdf ? '📄' : isZip ? '📦' : '📁'}
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">Revision {deliverable.revision_number}</p>
          {deliverable.notes && (
            <p className="text-xs text-stone-500 mt-0.5 max-w-xs line-clamp-1">{deliverable.notes}</p>
          )}
          <p className="text-xs text-stone-400 mt-0.5">
            {new Date(deliverable.created_at).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
      <a
        href={deliverable.file}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition shadow-sm flex-shrink-0"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download
      </a>
    </div>
  );
};

const CommissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [commission, setCommission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [deliverNotes, setDeliverNotes] = useState('');
  const [deliverFile, setDeliverFile] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetchCommission();
    checkUnread();
  }, [id]);

  const checkUnread = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/messages/unread/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.unread_commission_ids && data.unread_commission_ids.includes(id)) {
          setUnreadCount(1);
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchCommission = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/commissions/${id}/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setCommission(await response.json());
      } else {
        addToast('Commission not found', 'error');
        navigate('/commissions/mine');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, body = {}) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/commissions/${id}/${action}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const updated = await response.json();
        setCommission(updated);
        const messages = {
          accept: { msg: 'Commission accepted! You can now start working.', type: 'success' },
          start: { msg: 'Marked as in progress!', type: 'success' },
          approve: { msg: 'Work approved! Commission completed. 🎉', type: 'success' },
          revision: { msg: 'Revision requested. Artist will be notified.', type: 'info' },
          cancel: { msg: 'Commission cancelled.', type: 'info' },
          decline: { msg: 'Commission declined.', type: 'info' },
        };
        const m = messages[action] || { msg: 'Action completed', type: 'success' };
        addToast(m.msg, m.type);
        if (['decline', 'cancel'].includes(action)) {
          setTimeout(() => navigate(-1), 1200);
        }
      } else {
        const err = await response.json();
        addToast(err.error || 'Action failed', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setActionLoading(false);
      setShowDeclineModal(false);
      setShowCancelConfirm(false);
    }
  };

  const handleDeliver = async () => {
    if (!deliverFile) {
      addToast('Please select a file to upload', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', deliverFile);
      formData.append('notes', deliverNotes);
      const response = await fetch(`/api/commissions/${id}/deliver/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (response.ok) {
        await fetchCommission();
        setDeliverFile(null);
        setDeliverNotes('');
        addToast('Deliverable uploaded successfully!', 'success');
      } else {
        const err = await response.json();
        addToast(err.error || err.file?.[0] || 'Upload failed', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const daysUntilDeadline = commission
    ? Math.ceil((new Date(commission.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) return <LoadingSpinner label="Loading commission..." />;
  if (!commission) return null;

  const isArtist = user?.id === commission.artist?.id;
  const isCustomer = user?.id === commission.customer?.id;
  const statusConfig = STATUS_CONFIG[commission.status] || STATUS_CONFIG.pending;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">

        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 transition mb-3"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1
              className="text-2xl font-bold text-stone-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {commission.title}
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Created {new Date(commission.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold flex-shrink-0 ${statusConfig.color}`}>
            <span>{statusConfig.icon}</span>
            {statusConfig.label}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 gap-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <span>Details & Actions</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('messages');
              setUnreadCount(0);
            }}
            className={`pb-3 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
              activeTab === 'messages'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <span>Messages</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-stone-900 text-white rounded-full min-w-5">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'messages' ? (
          <CommissionChat
            commission={commission}
            otherParty={isArtist ? commission.customer : commission.artist}
            onUnreadUpdate={setUnreadCount}
          />
        ) : (
          <>
        {/* Status Timeline */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Progress</p>
          <StatusTimeline currentStatus={commission.status} />
          <p className="mt-4 text-xs text-stone-500 text-center">{statusConfig.description}</p>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Customer', party: commission.customer },
            { label: 'Artist', party: commission.artist },
          ].map(({ label, party }) => (
            <div key={label} className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{label}</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {party?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{party?.username}</p>
                  <p className="text-xs text-stone-400 truncate">{party?.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Details Card */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Brief</h2>
          <p className="text-stone-700 whitespace-pre-wrap text-sm leading-relaxed">{commission.description}</p>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-100">
            <div className="text-center">
              <p className="text-xs text-stone-400 mb-1">Budget Range</p>
              <p className="text-sm font-bold text-stone-900">
                Rs.{Number(commission.budget_min).toLocaleString()}
              </p>
              <p className="text-xs text-stone-500">
                — Rs.{Number(commission.budget_max).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-stone-400 mb-1">Deadline</p>
              <p className={`text-sm font-bold ${
                daysUntilDeadline !== null && daysUntilDeadline <= 3 && !['completed','cancelled','declined'].includes(commission.status)
                  ? 'text-red-600'
                  : 'text-stone-900'
              }`}>
                {commission.deadline}
              </p>
              {daysUntilDeadline !== null && !['completed','cancelled','declined'].includes(commission.status) && (
                <p className={`text-xs ${daysUntilDeadline <= 3 ? 'text-red-500' : 'text-stone-500'}`}>
                  {daysUntilDeadline > 0
                    ? `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} left`
                    : daysUntilDeadline === 0
                    ? 'Due today!'
                    : `${Math.abs(daysUntilDeadline)} days overdue`}
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-stone-400 mb-1">Revisions</p>
              <p className="text-sm font-bold text-stone-900">
                {commission.current_revision}/{commission.revision_limit}
              </p>
              <p className="text-xs text-stone-500">
                {commission.revision_limit - commission.current_revision} remaining
              </p>
            </div>
          </div>

          {/* Decline Reason */}
          {commission.rejection_reason && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-xs font-semibold text-red-600 mb-1">Decline Reason</p>
              <p className="text-sm text-red-700">{commission.rejection_reason}</p>
            </div>
          )}

          {/* Reference Images */}
          {commission.reference_image_objects?.length > 0 && (
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Reference Images</p>
              <div className="flex flex-wrap gap-2">
                {commission.reference_image_objects.map((ref) => (
                  <a key={ref.id} href={ref.image} target="_blank" rel="noopener noreferrer">
                    <img
                      src={ref.image}
                      alt="Reference"
                      className="h-20 w-20 rounded-lg object-cover border border-stone-200 hover:opacity-90 transition cursor-zoom-in"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Fallback: URL-based reference images */}
          {commission.reference_image_objects?.length === 0 && commission.reference_images?.length > 0 && (
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Reference Images</p>
              <div className="flex flex-wrap gap-2">
                {commission.reference_images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Reference ${i + 1}`}
                      className="h-20 w-20 rounded-lg object-cover border border-stone-200 hover:opacity-90 transition cursor-zoom-in"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Deliverables */}
        {commission.deliverables?.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
              Deliverables ({commission.deliverables.length})
            </h2>
            <div className="space-y-3">
              {commission.deliverables.map((d) => (
                <DeliverableCard key={d.id} deliverable={d} />
              ))}
            </div>
          </div>
        )}

        {/* Actions Panel */}
        <div className="space-y-4">

          {/* Artist — Pending: Accept or Decline */}
          {isArtist && commission.status === 'pending' && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-700 mb-1">Respond to Request</h3>
              <p className="text-xs text-stone-500 mb-4">Review the brief above before accepting or declining.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('accept')}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
                >
                  {actionLoading ? 'Processing...' : '✓ Accept Commission'}
                </button>
                <button
                  onClick={() => setShowDeclineModal(true)}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Artist — Accepted: Start Work */}
          {isArtist && commission.status === 'accepted' && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Ready to start?</h3>
              <p className="text-xs text-blue-600 mb-4">Click below to mark this commission as in progress and let the customer know you've started.</p>
              <button
                onClick={() => handleAction('start')}
                disabled={actionLoading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
              >
                {actionLoading ? 'Updating...' : '🎨 Start Working'}
              </button>
            </div>
          )}

          {/* Artist — In Progress or Accepted: Upload Deliverable */}
          {isArtist && (commission.status === 'accepted' || commission.status === 'in_progress') && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-800 mb-1">Upload Deliverable</h3>
              <p className="text-xs text-stone-500 mb-4">
                Supported: PDF, PNG, JPG, WEBP, ZIP (max 50 MB).
                This is revision {commission.current_revision + 1} of {commission.revision_limit}.
              </p>
              <div className="space-y-3">
                <label className={`block rounded-xl border-2 border-dashed p-4 cursor-pointer transition ${deliverFile ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-400'}`}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.zip"
                    onChange={(e) => setDeliverFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      {deliverFile ? '📎' : '📁'}
                    </div>
                    <div className="min-w-0">
                      {deliverFile ? (
                        <>
                          <p className="text-sm font-semibold text-stone-900 truncate">{deliverFile.name}</p>
                          <p className="text-xs text-stone-500">{(deliverFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-stone-600">Click to choose file</p>
                          <p className="text-xs text-stone-400">PDF, PNG, JPG, WEBP, ZIP up to 50 MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </label>
                <textarea
                  value={deliverNotes}
                  onChange={(e) => setDeliverNotes(e.target.value)}
                  placeholder="Notes about this deliverable — what changed, what to review, etc. (optional)"
                  rows={2}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
                <button
                  onClick={handleDeliver}
                  disabled={actionLoading || !deliverFile}
                  className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition disabled:opacity-50 shadow-sm"
                >
                  {actionLoading ? 'Uploading...' : '📤 Upload Deliverable'}
                </button>
              </div>
            </div>
          )}

          {/* Customer — Delivered: Approve or Revision */}
          {isCustomer && commission.status === 'delivered' && (
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-orange-800 mb-1">Review Delivered Work</h3>
              <p className="text-xs text-orange-700 mb-4">
                The artist has submitted their work. Download the latest deliverable above and let them know your decision.
                {commission.current_revision >= commission.revision_limit && (
                  <span className="font-semibold"> You have used all your revision requests.</span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
                >
                  {actionLoading ? 'Processing...' : '✓ Approve Work'}
                </button>
                {commission.current_revision < commission.revision_limit && (
                  <button
                    onClick={() => handleAction('revision')}
                    disabled={actionLoading}
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition disabled:opacity-50"
                  >
                    Request Revision ({commission.revision_limit - commission.current_revision} left)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Completed Banner */}
          {commission.status === 'completed' && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="font-semibold text-emerald-800">Commission Completed!</p>
              <p className="text-xs text-emerald-600 mt-1">This commission has been successfully delivered and approved.</p>
            </div>
          )}

          {/* Cancel Button (either party, non-terminal, non-delivered) */}
          {(isArtist || isCustomer) &&
            !['completed', 'cancelled', 'declined', 'delivered'].includes(commission.status) && (
            <div>
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                >
                  Cancel Commission
                </button>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800 mb-1">Cancel this commission?</p>
                  <p className="text-xs text-red-600 mb-4">This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
                    >
                      Keep Commission
                    </button>
                    <button
                      onClick={() => handleAction('cancel')}
                      disabled={actionLoading}
                      className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </>
        )}

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="rounded-2xl bg-white p-6 shadow-xl max-w-md w-full">
              <h3 className="text-lg font-bold text-stone-900 mb-1">Decline Commission</h3>
              <p className="text-sm text-stone-500 mb-4">Please provide a reason so the customer understands.</p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., I'm currently fully booked, or this isn't my style..."
                rows={4}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
                >
                  Go Back
                </button>
                <button
                  onClick={() => handleAction('decline', { rejection_reason: declineReason })}
                  disabled={!declineReason.trim() || actionLoading}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Declining...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CommissionDetail;
