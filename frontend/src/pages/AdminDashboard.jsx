import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import authFetch from '../utils/authFetch';
import { formatPrice } from '../utils/formatPrice';
import StatusProgressBar from '../components/StatusProgressBar';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatRelative = (value) => {
  if (!value) return '';
  const then = new Date(value).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return formatDate(value);
};

const statusColors = {
  pending: { pill: 'bg-amber-50 text-amber-700 shadow-sm', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  processing: { pill: 'bg-blue-50 text-blue-700 shadow-sm', dot: 'bg-blue-500', bar: 'bg-blue-500' },
  shipped: { pill: 'bg-violet-50 text-violet-700 shadow-sm', dot: 'bg-violet-500', bar: 'bg-violet-500' },
  delivered: { pill: 'bg-emerald-50 text-emerald-700 shadow-sm', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  cancelled: { pill: 'bg-stone-100 text-stone-500 shadow-sm', dot: 'bg-stone-400', bar: 'bg-stone-400' },
  accepted: { pill: 'bg-blue-50 text-blue-700 shadow-sm', dot: 'bg-blue-500', bar: 'bg-blue-500' },
  in_progress: { pill: 'bg-blue-50 text-blue-700 shadow-sm', dot: 'bg-blue-500', bar: 'bg-blue-500' },
  completed: { pill: 'bg-emerald-50 text-emerald-700 shadow-sm', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  declined: { pill: 'bg-red-50 text-red-700 shadow-sm', dot: 'bg-red-500', bar: 'bg-red-500' },
  approved: { pill: 'bg-emerald-50 text-emerald-700 shadow-sm', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  rejected: { pill: 'bg-red-50 text-red-700 shadow-sm', dot: 'bg-red-500', bar: 'bg-red-500' },
};

const paymentColors = {
  pending: { pill: 'bg-amber-50 text-amber-700 shadow-sm', dot: 'bg-amber-500' },
  paid: { pill: 'bg-emerald-50 text-emerald-700 shadow-sm', dot: 'bg-emerald-500' },
  failed: { pill: 'bg-red-50 text-red-700 shadow-sm', dot: 'bg-red-500' },
  refunded: { pill: 'bg-stone-100 text-stone-600 shadow-sm', dot: 'bg-stone-400' },
};

const PAYMENT_ORDER = ['paid', 'pending', 'failed', 'refunded'];
const COMMISSION_ORDER = ['pending', 'accepted', 'in_progress', 'delivered', 'completed', 'cancelled', 'declined'];

const StatusPill = ({ value, colors }) => {
  if (!value) return null;
  const c = colors[value] || { pill: 'bg-stone-100 text-stone-600 shadow-sm', dot: 'bg-stone-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${c.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {String(value).replace(/_/g, ' ')}
    </span>
  );
};

const trendTone = (pct) => {
  if (pct == null || Number.isNaN(pct)) return 'neutral';
  if (pct > 0) return 'up';
  if (pct < 0) return 'down';
  return 'neutral';
};

const toneStroke = {
  up: '#059669',
  down: '#ef4444',
  neutral: '#a8a29e',
};

const toneCard = {
  up: 'bg-gradient-to-br from-emerald-50/70 via-white to-white border-emerald-100',
  down: 'bg-gradient-to-br from-red-50/70 via-white to-white border-red-100',
  neutral: 'bg-gradient-to-br from-stone-100/60 via-white to-white border-stone-200',
};

const tonePill = {
  up: 'bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-700 border border-emerald-200/70',
  down: 'bg-gradient-to-r from-red-50 to-red-100/80 text-red-600 border border-red-200/70',
  neutral: 'bg-gradient-to-r from-stone-100 to-stone-200/60 text-stone-500 border border-stone-200/70',
};

const DeltaChip = ({ pct, className = '' }) => {
  if (pct === null || pct === undefined) return null;
  const tone = trendTone(pct);
  const flat = tone === 'neutral' && pct === 0;
  const showArrow = pct !== 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full shadow-sm ${tonePill[tone]} ${className}`}
    >
      {showArrow && (
        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          {pct > 0 ? (
            <path d="M6 2.5L10 8H2L6 2.5z" />
          ) : (
            <path d="M6 9.5L2 4h8L6 9.5z" />
          )}
        </svg>
      )}
      {flat ? '0%' : `${Math.abs(pct).toLocaleString()}%`}
    </span>
  );
};

const Sparkline = ({ points, stroke = '#000000', id }) => {
  if (!points || points.length < 2) return null;

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 200;
  const h = 36;
  const padY = 3;
  const uid = id || `sp-${Math.abs(Math.round(points[0] * 100 + points.length))}`;

  const pts = points.map((v, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - padY - ((v - min) / range) * (h - padY * 2),
  }));

  // Catmull-Rom → cubic Bézier for a soft continuous curve
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  const area = `${d} L ${w},${h} L 0,${h} Z`;
  const last = pts[pts.length - 1];
  const gridYs = [h * 0.25, h * 0.5, h * 0.75];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-9 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.24" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
          <stop offset="100%" stopColor={stroke} stopOpacity="1" />
        </linearGradient>
      </defs>
      {gridYs.map((gy) => (
        <line
          key={gy}
          x1="0"
          y1={gy}
          x2={w}
          y2={gy}
          stroke="#e7e5e4"
          strokeWidth="1"
          strokeDasharray="2 3"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path d={area} fill={`url(#${uid}-g)`} />
      <path
        d={d}
        fill="none"
        stroke={`url(#${uid}-line)`}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={last.x}
        cy={last.y}
        r="4"
        fill={stroke}
        opacity="0.15"
      />
      <circle
        cx={last.x}
        cy={last.y}
        r="2.25"
        fill={stroke}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const MetricCard = ({ label, value, delta, spark, sparkStroke, sub }) => {
  const tone = trendTone(delta);
  const stroke = sparkStroke || toneStroke[tone];
  const sparkId = `spark-${label.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()}`;

  return (
    <div className={`rounded-xl border p-5 flex flex-col min-w-0 shadow-sm ${toneCard[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-400 truncate">{label}</p>
        {spark && <span className="text-[10px] font-medium text-stone-400 tabular-nums shrink-0">14d</span>}
      </div>

      <p className="text-2xl sm:text-3xl font-semibold text-stone-900 tabular-nums tracking-tight mt-2 leading-tight break-words">
        {value}
      </p>
      {sub && <p className="text-xs text-stone-400 mt-1 tabular-nums">{sub}</p>}

      <div className="mt-auto pt-4 min-h-[36px] flex items-end gap-3">
        {spark ? (
          <div className="flex-1 min-w-0">
            <Sparkline points={spark} stroke={stroke} id={sparkId} />
          </div>
        ) : (
          <div className="flex-1 h-px bg-stone-200/70 mb-2" />
        )}
        {delta != null && <DeltaChip pct={delta} className="shrink-0 mb-0.5" />}
      </div>
    </div>
  );
};

const Panel = ({ title, action, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden ${className}`}>
    <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between gap-4">
      <h2 className="text-sm font-semibold text-stone-900 tracking-tight">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

const ViewAllLink = ({ to }) => (
  <Link to={to} className="text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors shrink-0">
    View all &rarr;
  </Link>
);

const SkeletonBlock = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div>
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="h-4 w-56 mt-2" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-4 w-12" />
          </div>
          <SkeletonBlock className="h-8 w-28 mt-2" />
          <div className="mt-auto pt-4">
            <SkeletonBlock className="h-7 w-full" />
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-stone-100">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="px-5 py-4">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-6 w-14 mt-2" />
          </div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <SkeletonBlock className="h-4 w-32" />
        </div>
        <div className="divide-y divide-stone-100">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
              <SkeletonBlock className="h-5 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200">
              <SkeletonBlock className="h-4 w-28" />
            </div>
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((j) => (
                <SkeletonBlock key={j} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-200">
        <SkeletonBlock className="h-4 w-28" />
      </div>
      <div className="divide-y divide-stone-100">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="px-6 py-3.5 flex items-center gap-4">
            <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1">
              <SkeletonBlock className="h-3.5 w-40" />
              <SkeletonBlock className="h-3 w-24 mt-1.5" />
            </div>
            <SkeletonBlock className="h-5 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ErrorPanel = ({ onRetry }) => (
  <div className="space-y-8">
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Dashboard</h1>
      <p className="text-sm text-stone-500 mt-1">Platform overview and key metrics</p>
    </div>
    <div className="bg-white rounded-xl border border-stone-200 p-10 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <svg className="h-7 w-7 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-stone-700 tracking-tight">Could not load dashboard</p>
      <p className="text-xs text-stone-400 mt-1">Check your connection and try again</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition"
      >
        Retry
      </button>
    </div>
  </div>
);

const activityIcons = {
  order: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  ),
  application: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8" />
  ),
  artwork: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
  ),
  commission: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  ),
  review: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  ),
};

const activityTone = {
  order: { soft: 'bg-stone-100', text: 'text-stone-700', ring: 'border-stone-200' },
  application: { soft: 'bg-amber-100', text: 'text-amber-700', ring: 'border-amber-200' },
  artwork: { soft: 'bg-stone-100', text: 'text-stone-700', ring: 'border-stone-200' },
  commission: { soft: 'bg-stone-100', text: 'text-stone-700', ring: 'border-stone-200' },
  review: { soft: 'bg-stone-100', text: 'text-stone-700', ring: 'border-stone-200' },
};

const ActivityRow = ({ item }) => {
  const tone = activityTone[item.type] || activityTone.order;
  const inner = (
    <>
      <span className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${tone.soft} ${tone.text} ${tone.ring}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          {activityIcons[item.type] || activityIcons.order}
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-900 truncate">{item.title}</p>
        <p className="text-xs text-stone-400 truncate mt-0.5">{item.subtitle}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {item.status && item.type === 'order' && (
          <StatusProgressBar value={item.status} kind="order" variant="compact" />
        )}
        {item.status && item.type !== 'order' && (
          <StatusPill value={item.status} colors={statusColors} />
        )}
        <span className="text-xs text-stone-400 tabular-nums whitespace-nowrap w-20 text-right shrink-0">{formatRelative(item.created_at)}</span>
      </div>
    </>
  );
  const cls = 'px-6 py-3.5 flex items-center gap-3.5 hover:bg-stone-50/60 transition-colors';
  return item.href ? (
    <Link to={item.href} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(false);
    authFetch('/api/admin/stats/')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load stats');
        return r.json();
      })
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <DashboardSkeleton />;
  if (error || !stats) return <ErrorPanel onRetry={fetchStats} />;

  const deltas = stats.deltas || {};
  const trends = stats.trends || [];
  const payments = stats.payments_by_status || {};
  const commissions = stats.commissions_by_status || {};
  const activity = stats.activity || [];
  const recentOrders = stats.recent_orders || [];
  const hasReviewWork = (stats.pending_applications || 0) > 0 || (stats.pending_artworks || 0) > 0;
  const revenueSpark = trends.map((t) => t.revenue);
  const ordersSpark = trends.map((t) => t.orders);
  const refunds = stats.refunds_30d || { count: 0, total: 0 };

  const openCommissions = stats.open_commissions || 0;
  const commissionTotal = Object.values(commissions).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Users"
          value={(stats.total_users ?? 0).toLocaleString()}
          delta={deltas.users?.pct}
        />
        <MetricCard
          label="Total Orders"
          value={(stats.total_orders ?? 0).toLocaleString()}
          delta={deltas.orders?.pct}
          spark={ordersSpark}
        />
        <MetricCard
          label="Revenue (net)"
          value={`NPR ${formatPrice(stats.revenue ?? 0)}`}
          delta={deltas.revenue?.pct}
          spark={revenueSpark}
          sub={
            (stats.revenue_refunded ?? 0) > 0
              ? `Refunded NPR ${formatPrice(stats.revenue_refunded)}`
              : undefined
          }
        />
      </div>

      {/* Secondary metrics strip */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-stone-100">
          {[
            { label: 'Artworks', value: stats.total_artworks ?? 0 },
            { label: 'Published', value: stats.published_artworks ?? 0 },
            { label: 'Categories', value: stats.total_categories ?? 0 },
            { label: 'New users (7d)', value: stats.new_users_7d ?? 0, delta: deltas.users?.pct },
            { label: 'New orders (7d)', value: stats.new_orders_7d ?? 0, delta: deltas.orders?.pct },
          ].map((item) => (
            <div key={item.label} className="px-5 py-4 min-w-0">
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider truncate">{item.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-base font-semibold text-stone-900 tabular-nums tracking-tight">{item.value.toLocaleString()}</p>
                {item.delta != null && <DeltaChip pct={item.delta} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid — equal-height columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders — 2/3 */}
        <Panel
          title="Recent Orders"
          action={<ViewAllLink to="/admin/orders" />}
          className="lg:col-span-2 h-full flex flex-col"
        >
          {recentOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                <svg className="h-7 w-7 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-stone-700 tracking-tight">No orders yet</p>
              <p className="text-xs text-stone-400 mt-1">Orders will appear here as customers check out</p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-stone-100 min-h-0">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to="/admin/orders"
                  className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{order.customer_name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        #{String(order.id).slice(0, 8)}
                        <span className="text-stone-300 mx-1.5">·</span>
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusProgressBar value={order.status} kind="order" variant="compact" />
                    <StatusProgressBar value={order.payment_status} kind="payment" variant="compact" />
                  </div>
                  <p className="text-sm font-semibold text-stone-900 tabular-nums shrink-0 min-w-[7rem] text-right">
                    NPR {formatPrice(order.total)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        {/* Right column — stretch to match orders height */}
        <div className="h-full flex flex-col gap-4 min-w-0">
          {/* Review queue */}
          <Panel title="Needs Review">
            <div className="p-4 space-y-2">
              <Link
                to="/admin/applications"
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  (stats.pending_applications || 0) > 0
                    ? 'border-stone-200 bg-white hover:bg-stone-50/60'
                    : 'border-stone-100 bg-stone-50/50'
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${(stats.pending_applications || 0) > 0 ? 'text-stone-900' : 'text-stone-400'}`}>
                    Applications
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {(stats.pending_applications || 0) > 0 ? 'Artist applications awaiting review' : 'All caught up'}
                  </p>
                </div>
                <span className={`inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full text-xs font-bold tabular-nums ${
                  (stats.pending_applications || 0) > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-stone-100 text-stone-400'
                }`}>
                  {stats.pending_applications ?? 0}
                </span>
              </Link>

              <Link
                to="/admin/artworks"
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  (stats.pending_artworks || 0) > 0
                    ? 'border-stone-200 bg-white hover:bg-stone-50/60'
                    : 'border-stone-100 bg-stone-50/50'
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${(stats.pending_artworks || 0) > 0 ? 'text-stone-900' : 'text-stone-400'}`}>
                    Artworks
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {(stats.pending_artworks || 0) > 0 ? 'Submitted for moderation' : 'All caught up'}
                  </p>
                </div>
                <span className={`inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full text-xs font-bold tabular-nums ${
                  (stats.pending_artworks || 0) > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-stone-100 text-stone-400'
                }`}>
                  {stats.pending_artworks ?? 0}
                </span>
              </Link>

              {!hasReviewWork && (
                <p className="text-xs text-stone-400 pt-1 px-1">Nothing waiting on you right now.</p>
              )}
            </div>
          </Panel>

          {/* Payments */}
          <Panel title="Payments" action={<ViewAllLink to="/admin/orders" />}>
            <div className="p-5 space-y-3.5">
              {PAYMENT_ORDER.map((key) => {
                const row = payments[key] || { count: 0, total: 0 };
                const c = paymentColors[key];
                return (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 capitalize">
                      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                      {key}
                    </span>
                    <span className="flex items-baseline gap-3 tabular-nums">
                      <span className="text-xs text-stone-400">{row.count}</span>
                      <span className="text-xs font-semibold text-stone-900 min-w-[5.5rem] text-right">
                        NPR {formatPrice(row.total)}
                      </span>
                    </span>
                  </div>
                );
              })}
              <div className="pt-2 mt-1 border-t border-stone-100 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Net (held)</span>
                  <span className="text-xs font-semibold text-stone-900 tabular-nums">
                    NPR {formatPrice(stats.revenue ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Refunded (all-time)</span>
                  <span className="text-xs font-semibold text-stone-600 tabular-nums">
                    NPR {formatPrice(stats.revenue_refunded ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">Refunds (30d)</span>
                  <span className="text-xs font-semibold text-stone-600 tabular-nums">
                    {refunds.count} · NPR {formatPrice(refunds.total)}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Commissions — flex-1 so column bottom aligns with orders */}
          <Panel title="Commissions" className="flex-1 flex flex-col">
            <div className="p-5 space-y-3 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-stone-600">Open work</span>
                <span className={`inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full text-xs font-bold tabular-nums ${
                  openCommissions > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {openCommissions}
                </span>
              </div>
              {commissionTotal === 0 ? (
                <p className="text-xs text-stone-400">No commissions yet.</p>
              ) : (
                <div className="space-y-2.5 pt-1 border-t border-stone-100">
                  {COMMISSION_ORDER.filter((k) => (commissions[k] || 0) > 0).map((key) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600">
                        <span className={`h-1.5 w-1.5 rounded-full ${(statusColors[key] || statusColors.pending).dot}`} />
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="text-xs font-semibold text-stone-900 tabular-nums">{commissions[key]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Unified activity feed */}
      <Panel title="Activity">
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-stone-700 tracking-tight">No activity yet</p>
            <p className="text-xs text-stone-400 mt-1">Orders, applications, and commissions will show up here</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {activity.map((item, i) => (
              <ActivityRow key={`${item.type}-${item.created_at}-${i}`} item={item} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default AdminDashboard;
