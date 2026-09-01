import { useState, useEffect } from 'react';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-violet-50 text-violet-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

const paymentColors = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-stone-100 text-stone-600',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/admin/orders/?${params}`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Orders</h1>
        <p className="text-sm text-stone-500 mt-1">View all platform orders</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by customer, email, or order ID..."
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
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-sm">No orders found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Items</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Payment</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-stone-900">#{String(order.id).slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-stone-900">{order.customer_name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">{order.item_count}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-stone-900">NPR {order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-stone-100 text-stone-600'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${paymentColors[order.payment_status] || 'bg-stone-100 text-stone-600'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-stone-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
