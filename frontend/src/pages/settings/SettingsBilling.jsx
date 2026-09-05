import { useState, useEffect } from 'react';
import { formatPrice } from '../../utils/formatPrice';
import LoadingSpinner from '../../components/LoadingSpinner';

const SettingsBilling = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/orders/', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setOrders(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const paidOrders = orders.filter((o) => o.payment_status === 'paid');

  const totalSpent = paidOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  if (loading) return <LoadingSpinner label="Loading billing..." />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Billing</h1>
      <p className="text-sm text-stone-500 mb-8">View your transaction history and payment details.</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs text-stone-500 mb-1">Total Spent</p>
          <p className="text-xl font-bold text-stone-900">NPR {formatPrice(totalSpent)}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs text-stone-500 mb-1">Orders</p>
          <p className="text-xl font-bold text-stone-900">{paidOrders.length}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs text-stone-500 mb-1">Last Purchase</p>
          <p className="text-sm font-semibold text-stone-900">
            {paidOrders.length > 0 ? new Date(paidOrders[0].created_at).toLocaleDateString() : '—'}
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h3 className="font-semibold">Transaction History</h3>
        </div>
        {paidOrders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-stone-400 text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {paidOrders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-mono text-stone-600">#{String(order.id).slice(0, 8)}</span>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-500">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-stone-500 truncate">
                    {order.items?.map((i) => i.artwork?.title).filter(Boolean).join(', ') || 'Order'}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-stone-900">NPR {formatPrice(order.total)}</p>
                  <span className="inline-block mt-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 uppercase">
                    {order.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsBilling;
