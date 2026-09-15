import { useState, useEffect, useCallback } from 'react';
import authFetch from '../utils/authFetch';
import CustomSelect from '../components/CustomSelect';

const statusColors = {
  pending: 'bg-[#9c4327]/10 text-[#9c4327]',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-violet-50 text-violet-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-stone-100 text-stone-500',
};

const paymentColors = {
  pending: 'bg-[#9c4327]/10 text-[#9c4327]',
  paid: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-stone-100 text-stone-600',
};

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const paymentOptions = [
  { value: '', label: 'All Payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    const effectiveStatus = statusFilter || (activeTab !== 'all' ? activeTab : '');
    if (effectiveStatus) params.set('status', effectiveStatus);
    if (paymentFilter) params.set('payment_status', paymentFilter);
    authFetch(`/api/admin/orders/?${params}`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter, paymentFilter, activeTab]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const fetchDetail = async (orderId) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(orderId);
    setDetailLoading(true);
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/`);
      const data = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateOrder = async (orderId, updates) => {
    setUpdating(true);
    try {
      await authFetch(`/api/admin/orders/${orderId}/update/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchOrders();
      if (expandedId === orderId) {
        const res = await authFetch(`/api/admin/orders/${orderId}/`);
        setDetail(await res.json());
      }
    } catch {} finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders;

  const totalRevenue = orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const processingCount = orders.filter((o) => o.status === 'processing').length;

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Orders</h1>
        <p className="text-sm text-stone-500 mt-1">Manage all platform orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Revenue', value: `रू ${totalRevenue.toLocaleString()}` },
          { label: 'Pending', value: pendingCount },
          { label: 'Processing', value: processingCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-xs font-medium text-stone-500 uppercase">{stat.label}</p>
            <p className="text-2xl font-bold mt-1 text-stone-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              activeTab === tab.key
                ? 'border-[#9c4327] text-[#9c4327]'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={statusOptions}
          className="w-full sm:w-40"
        />
        <CustomSelect
          value={paymentFilter}
          onChange={setPaymentFilter}
          placeholder="All Payments"
          options={paymentOptions}
          className="w-full sm:w-40"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c4327]" />
          </div>
        ) : filteredOrders.length === 0 ? (
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
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    onClick={() => fetchDetail(order.id)}
                    className="hover:bg-stone-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-stone-900">#{String(order.id).slice(0, 8)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-stone-900">{order.customer_name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">{order.item_count}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-stone-900">रू {parseFloat(order.total).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-stone-100 text-stone-600'}`}>
                        {order.status}
                      </span>
                      {order.status === 'cancelled' && order.cancellation_reason && (
                        <p className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={order.cancellation_reason}>
                          {order.cancellation_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${paymentColors[order.payment_status] || 'bg-stone-100 text-stone-600'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <svg className={`h-4 w-4 text-stone-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </td>
                  </tr>

                  {expandedId === order.id && (
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={8} className="px-6 py-0">
                        <div className="py-4 border-t border-stone-100">
                          {detailLoading ? (
                            <div className="flex items-center justify-center h-24">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9c4327]" />
                            </div>
                          ) : detail ? (
                            <div className="space-y-4">
                              {/* Status Update */}
                              <div className="flex flex-wrap items-center gap-3 p-3 bg-stone-50 rounded-lg">
                                <span className="text-xs font-semibold text-stone-600 uppercase">Update:</span>
                                <CustomSelect
                                  value={detail.status}
                                  onChange={(val) => updateOrder(order.id, { status: val })}
                                  options={statusOptions.filter((o) => o.value)}
                                  className="w-40"
                                />
                                <CustomSelect
                                  value={detail.payment_status}
                                  onChange={(val) => updateOrder(order.id, { payment_status: val })}
                                  options={paymentOptions.filter((o) => o.value)}
                                  className="w-40"
                                />
                                {updating && <span className="text-xs text-stone-500">Saving...</span>}
                              </div>

                              {/* Cancellation Reason */}
                              {detail.status === 'cancelled' && detail.cancellation_reason && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-red-700 uppercase">Cancellation Reason</span>
                                  </div>
                                  <p className="text-sm text-red-800">{detail.cancellation_reason}</p>
                                  {detail.cancelled_by_name && (
                                    <p className="text-xs text-red-600 mt-1">Cancelled by: {detail.cancelled_by_name}</p>
                                  )}
                                </div>
                              )}

                              {/* Customer + Shipping */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-stone-500 uppercase mb-2">Customer</h4>
                                  <p className="text-sm font-medium text-stone-900">{detail.customer_name}</p>
                                  <p className="text-xs text-stone-500">{detail.customer_email}</p>
                                </div>
                                {detail.shipping_address && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-stone-500 uppercase mb-2">Shipping Address</h4>
                                    <p className="text-sm text-stone-900">{detail.shipping_address.street}, {detail.shipping_address.city}</p>
                                    <p className="text-xs text-stone-500">{detail.shipping_address.district} District, {detail.shipping_address.province} Province</p>
                                    <p className="text-xs text-stone-500">Phone: {detail.shipping_address.phone}</p>
                                  </div>
                                )}
                              </div>

                              {/* Items */}
                              <div>
                                <h4 className="text-xs font-semibold text-stone-500 uppercase mb-2">Items</h4>
                                <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                                  {detail.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 bg-white">
                                      {item.primary_image ? (
                                        <img src={item.primary_image} alt={item.artwork_title} className="w-12 h-12 rounded object-cover" />
                                      ) : (
                                        <div className="w-12 h-12 rounded bg-stone-100 flex items-center justify-center text-stone-400 text-xs">No img</div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-900 truncate">{item.artwork_title}</p>
                                        <p className="text-xs text-stone-500">{item.artwork_type} · Artist: {item.artist_name}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-stone-900">रू {parseFloat(item.price).toLocaleString()}</p>
                                        <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                                      </div>
                                      {item.shipment && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                          item.shipment.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                                          item.shipment.status === 'shipped' ? 'bg-violet-50 text-violet-700' :
                                          'bg-stone-100 text-stone-600'
                                        }`}>
                                          {item.shipment.status}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Totals */}
                              <div className="flex justify-end gap-6 text-sm">
                                <span className="text-stone-500">Subtotal: <strong className="text-stone-900">रू {parseFloat(detail.subtotal).toLocaleString()}</strong></span>
                                <span className="text-stone-500">Shipping: <strong className="text-stone-900">रू {parseFloat(detail.shipping_cost).toLocaleString()}</strong></span>
                                <span className="text-stone-700 font-semibold">Total: <strong className="text-stone-900">रू {parseFloat(detail.total).toLocaleString()}</strong></span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
