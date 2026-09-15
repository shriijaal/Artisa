import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import authFetch from '../utils/authFetch';
import { formatPrice } from '../utils/formatPrice';

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-xl border border-stone-200 p-5 group hover:shadow-sm transition-shadow">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
        <p className="text-2xl font-bold text-stone-900 mt-1.5 font-heading tabular-nums">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center dont hfixflex-shrink-0 ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/admin/stats/')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-200 border-t-stone-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight font-heading">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.total_users ?? 0}
          color="bg-amber-50"
          icon={
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          label="Verified Artists"
          value={stats?.total_artists ?? 0}
          color="bg-violet-50"
          icon={
            <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Orders"
          value={stats?.total_orders ?? 0}
          color="bg-emerald-50"
          icon={
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          }
        />
        <StatCard
          label="Revenue"
          value={`रू ${formatPrice(stats?.revenue ?? 0)}`}
          color="bg-rose-50"
          icon={
            <span className="text-sm font-bold text-rose-600">रू</span>
          }
        />
      </div>

      {/* Pending Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/applications"
          className="bg-white rounded-xl border border-stone-200 p-5 group hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Pending Applications</p>
              <p className="text-3xl font-bold text-stone-900 mt-1.5 font-heading">{stats?.pending_applications ?? 0}</p>
              <p className="text-xs text-stone-400 mt-1">Artist applications awaiting review</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors shrink-0">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-stone-500 group-hover:text-stone-700 transition-colors">
            View all
            <svg className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>

        <Link
          to="/admin/artworks"
          className="bg-white rounded-xl border border-stone-200 p-5 group hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Pending Artworks</p>
              <p className="text-3xl font-bold text-stone-900 mt-1.5 font-heading">{stats?.pending_artworks ?? 0}</p>
              <p className="text-xs text-stone-400 mt-1">Artworks submitted for moderation</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors shrink-0">
              <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-stone-500 group-hover:text-stone-700 transition-colors">
            View all
            <svg className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      {stats?.recent_orders?.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900 font-heading">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {stats.recent_orders.map((order) => (
              <div key={order.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-stone-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    order.status === 'delivered' ? 'bg-emerald-500' :
                    order.status === 'cancelled' ? 'bg-red-500' :
                    order.status === 'processing' ? 'bg-blue-500' :
                    order.status === 'shipped' ? 'bg-violet-500' :
                    'bg-amber-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{order.customer_name}</p>
                    <p className="text-xs text-stone-400">#{String(order.id).slice(0, 8)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-stone-900 font-heading tabular-nums">रू {formatPrice(order.total)}</p>
                  <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                    order.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                    order.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                    order.status === 'shipped' ? 'bg-violet-50 text-violet-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
