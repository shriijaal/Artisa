import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import authFetch from '../utils/authFetch';
import CustomSelect from '../components/CustomSelect';
import StatusProgressBar from '../components/StatusProgressBar';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const paymentOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (paymentFilter) params.set('payment_status', paymentFilter);
    authFetch(`/api/admin/orders/?${params}`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, paymentFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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
      const res = await authFetch(`/api/admin/orders/${orderId}/update/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchOrders();
        if (expandedId === orderId) {
          const detailRes = await authFetch(`/api/admin/orders/${orderId}/`);
          setDetail(await detailRes.json());
        }
        showToast('Order updated');
      }
    } catch {} finally {
      setUpdating(false);
    }
  };

  const counts = useMemo(() => {
    const c = { all: orders.length, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => { if (c[o.status] !== undefined && o.status !== 'all') c[o.status] += 1; });
    return c;
  }, [orders]);

  const filteredOrders = useMemo(
    () => activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab),
    [orders, activeTab]
  );

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
    .reduce((s, o) => s + parseFloat(o.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Orders</h1>
        <p className="text-sm text-stone-500 mt-1">
          {loading ? 'Loading...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} found`}
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
          { label: 'Total Orders', value: counts.all },
          { label: 'Revenue', value: `NPR ${totalRevenue.toLocaleString()}` },
          { label: 'Pending', value: counts.pending },
          { label: 'Processing', value: counts.processing },
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

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by customer, email, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition"
          />
        </div>
        <CustomSelect
          value={paymentFilter}
          onChange={setPaymentFilter}
          placeholder="All Payments"
          options={[
            { value: '', label: 'All Payments' },
            ...paymentOptions,
          ]}
          className="w-full sm:w-44"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-200 border-t-stone-900" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-stone-700 tracking-tight">No orders found</p>
            <p className="text-xs text-stone-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Items</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Payment</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Date</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => (
                <Fragment key={order.id}>
                  <tr
                    onClick={() => fetchDetail(order.id)}
                    className="hover:bg-stone-50/60 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-stone-900 tabular-nums tracking-tight">#{String(order.id).slice(0, 8)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-stone-900">{order.customer_name}</p>
                      {order.customer_email && (
                        <p className="text-xs text-stone-500 mt-0.5">{order.customer_email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500 tabular-nums">{order.item_count}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-stone-900 tabular-nums">NPR {parseFloat(order.total).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <StatusProgressBar value={order.status} kind="order" variant="compact" />
                      {order.status === 'cancelled' && order.cancellation_reason && (
                        <p className="text-xs text-stone-500 mt-1 max-w-[200px] truncate" title={order.cancellation_reason}>
                          {order.cancellation_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusProgressBar value={order.payment_status} kind="payment" variant="compact" />
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500 tabular-nums">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <svg className={`h-4 w-4 text-stone-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </td>
                  </tr>

                  {expandedId === order.id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-0">
                        <div className="py-4 border-t border-stone-100">
                          {detailLoading ? (
                            <div className="flex items-center justify-center h-24">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-900" />
                            </div>
                          ) : detail ? (
                            <div className="space-y-4">
                              {/* Status Update */}
                              <div className="flex flex-wrap items-center gap-3 p-3 bg-stone-50 rounded-lg">
                                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Update:</span>
                                <CustomSelect
                                  value={detail.status}
                                  onChange={(val) => updateOrder(order.id, { status: val })}
                                  options={statusOptions}
                                  className="w-40"
                                />
                                <CustomSelect
                                  value={detail.payment_status}
                                  onChange={(val) => updateOrder(order.id, { payment_status: val })}
                                  options={paymentOptions}
                                  className="w-40"
                                />
                                {updating && <span className="text-xs text-stone-500">Saving...</span>}
                              </div>

                              {/* Cancellation Reason */}
                              {detail.status === 'cancelled' && detail.cancellation_reason && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                  <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Cancellation Reason</span>
                                  <p className="text-sm text-red-800 mt-1">{detail.cancellation_reason}</p>
                                  {detail.cancelled_by_name && (
                                    <p className="text-xs text-red-600 mt-1">Cancelled by: {detail.cancelled_by_name}</p>
                                  )}
                                </div>
                              )}

                              {/* Customer + Shipping */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Customer</h4>
                                  <p className="text-sm font-medium text-stone-900">{detail.customer_name}</p>
                                  <p className="text-xs text-stone-500">{detail.customer_email}</p>
                                </div>
                                {detail.shipping_address && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Shipping Address</h4>
                                    <p className="text-sm text-stone-900">{detail.shipping_address.street}, {detail.shipping_address.city}</p>
                                    <p className="text-xs text-stone-500">{detail.shipping_address.district} District, {detail.shipping_address.province} Province</p>
                                    <p className="text-xs text-stone-500">Phone: {detail.shipping_address.phone}</p>
                                  </div>
                                )}
                              </div>

                              {/* Items */}
                              <div>
                                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Items</h4>
                                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                                  {detail.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-3.5 bg-white">
                                      {item.primary_image ? (
                                        <img src={item.primary_image} alt={item.artwork_title} className="w-12 h-12 rounded-lg object-cover" />
                                      ) : (
                                        <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 text-xs">No img</div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-900 truncate">{item.artwork_title}</p>
                                        <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                                          <span className={`h-1.5 w-1.5 rounded-full ${item.artwork_type === 'physical' ? 'bg-stone-700' : 'bg-stone-400'}`} />
                                          <span className="uppercase tracking-wider font-semibold">{item.artwork_type}</span>
                                          <span className="h-1 w-1 rounded-full bg-stone-300" />
                                          <span>Artist: {item.artist_name}</span>
                                        </p>
                                        {item.shipment?.tracking_number && (
                                          <p className="text-xs text-stone-500 mt-1">
                                            Tracking: <span className="font-mono font-medium text-stone-700">{item.shipment.tracking_number}</span>
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-stone-900 tabular-nums">NPR {parseFloat(item.price).toLocaleString()}</p>
                                        <p className="text-xs text-stone-500 tabular-nums">Qty: {item.quantity}</p>
                                      </div>
                                      {item.shipment && (
                                        <div className="text-right">
                                          <StatusProgressBar value={item.shipment.status} kind="shipment" variant="compact" />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Totals */}
                              <div className="flex justify-end">
                                <div className="w-full sm:w-72 space-y-2 rounded-xl border border-stone-200 bg-stone-50/60 p-4">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Subtotal</span>
                                    <span className="text-stone-900 font-medium tabular-nums">NPR {parseFloat(detail.subtotal).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Shipping</span>
                                    <span className="text-stone-900 font-medium tabular-nums">NPR {parseFloat(detail.shipping_cost).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-sm pt-2 border-t border-stone-200">
                                    <span className="text-stone-700 font-semibold">Total</span>
                                    <span className="text-stone-900 font-semibold tabular-nums">NPR {parseFloat(detail.total).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
