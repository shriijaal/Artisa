import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import authFetch from '../utils/authFetch';

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-lg border border-stone-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <p className="text-2xl font-bold text-stone-900 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.total_users ?? 0}
          icon="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          color="bg-amber-500"
        />
        <StatCard
          label="Verified Artists"
          value={stats?.total_artists ?? 0}
          icon="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          color="bg-violet-500"
        />
        <StatCard
          label="Total Orders"
          value={stats?.total_orders ?? 0}
          icon="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
          color="bg-emerald-500"
        />
        <StatCard
          label="Revenue"
          value={`NPR ${(stats?.revenue ?? 0).toLocaleString()}`}
          icon="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="bg-rose-500"
        />
      </div>

      {/* Pending Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/applications"
          className="bg-white rounded-lg border border-stone-200 p-6 hover:border-amber-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">Pending Applications</p>
              <p className="text-3xl font-bold text-stone-900 mt-1">{stats?.pending_applications ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-2">Artist applications awaiting review</p>
        </Link>
        <Link
          to="/admin/artworks"
          className="bg-white rounded-lg border border-stone-200 p-6 hover:border-amber-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">Pending Artworks</p>
              <p className="text-3xl font-bold text-stone-900 mt-1">{stats?.pending_artworks ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-2">Artworks submitted for moderation</p>
        </Link>
      </div>

      {/* Recent Orders */}
      {stats?.recent_orders?.length > 0 && (
        <div className="bg-white rounded-lg border border-stone-200">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="text-sm font-semibold text-stone-900">Recent Orders</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {stats.recent_orders.map((order) => (
              <div key={order.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900">{order.customer_name}</p>
                  <p className="text-xs text-stone-500">#{String(order.id).slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-stone-900">NPR {order.total}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                    order.status === 'cancelled' ? 'bg-red-50 text-red-700' :
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
