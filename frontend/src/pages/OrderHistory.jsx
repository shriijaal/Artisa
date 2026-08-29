import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/orders/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async (orderId) => {
    setPayingOrderId(orderId);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/orders/${orderId}/pay/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchOrders();
        addToast('Payment successful!', 'success');
      } else {
        addToast('Payment failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error during mock payment:', err);
    } finally {
      setPayingOrderId(null);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (loading) {
    return <LoadingSpinner label="Loading your orders..." />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10 page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate('/marketplace')} className="hover:text-amber-600 transition-colors">Marketplace</button>
            <span>/</span>
            <span className="font-medium text-stone-800">Order History</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>Your Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
            <p className="text-stone-600 mb-4">You have not placed any orders yet.</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition shadow-sm"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <div key={order.id} className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                  <div 
                    onClick={() => toggleExpand(order.id)}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-stone-900">Order #{order.id.slice(0, 8)}</span>
                        <span className="text-sm text-stone-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 mt-1">Total: NPR {order.total}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          order.payment_status === 'paid' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          Payment: {order.payment_status.toUpperCase()}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          order.status === 'delivered' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : order.status === 'shipped'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : order.status === 'processing'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-stone-50 text-stone-700 border border-stone-200'
                        }`}>
                          Fulfillment: {order.status.toUpperCase()}
                        </span>
                      </div>

                      {order.payment_status === 'pending' && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const token = localStorage.getItem('access_token');
                            setPayingOrderId(order.id);
                            try {
                              const res = await fetch('/api/payments/khalti/initiate/', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`,
                                },
                                body: JSON.stringify({ order_id: order.id }),
                              });
                              const data = await res.json();
                              if (res.ok && data.payment_url) {
                                window.location.href = data.payment_url;
                              } else {
                                addToast(data.error || 'Could not initiate payment.', 'error');
                              }
                            } catch (err) {
                              addToast('Payment initiation failed.', 'error');
                            } finally {
                              setPayingOrderId(null);
                            }
                          }}
                          disabled={payingOrderId === order.id}
                          className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition disabled:opacity-50"
                        >
                          {payingOrderId === order.id ? 'Redirecting...' : 'Pay with Khalti'}
                        </button>
                      )}
                      
                      <svg
                        className={`h-5 w-5 text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-stone-100 bg-stone-50/30 p-6 space-y-6">
                      {order.shipping_address && (
                        <div>
                          <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">Shipping Details</h4>
                          <p className="text-sm text-stone-900">
                            {order.shipping_address.street}, {order.shipping_address.city}
                          </p>
                          <p className="text-sm text-stone-600">
                            {order.shipping_address.district} District, {order.shipping_address.province} Province
                          </p>
                          <p className="text-sm text-stone-600">Phone: {order.shipping_address.phone}</p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-3">Items</h4>
                        <div className="divide-y divide-stone-100 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                          {order.items.map((item) => (
                            <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                              <div>
                                <h5 className="font-medium text-stone-900">{item.artwork.title}</h5>
                                <p className="text-xs text-stone-500">Artwork Type: {item.artwork.type.toUpperCase()}</p>
                                <p className="text-xs text-stone-500">Sold by artist {item.artwork.artist?.username}</p>
                              </div>
                              
                              <div className="flex items-center gap-6 self-end sm:self-center">
                                <div className="text-right">
                                  <span className="text-sm text-stone-500">{item.quantity} x</span>
                                  <span className="font-semibold text-stone-900 ml-2">NPR {item.price}</span>
                                </div>

                                {item.artwork.type === 'physical' && item.shipment && (
                                  <div className="rounded-lg bg-stone-50 px-3 py-1.5 border border-stone-200 text-xs">
                                    <span className="font-semibold text-stone-700 block">
                                      Status: {item.shipment.status.toUpperCase()}
                                    </span>
                                    {item.shipment.tracking_number && (
                                      <span className="text-stone-500 font-mono block mt-0.5">
                                        Tracking: {item.shipment.tracking_number}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {item.artwork.type === 'digital' && order.payment_status === 'paid' && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const jwt = localStorage.getItem('access_token');
                                      try {
                                        const tokenRes = await fetch(`/api/orders/${order.id}/download-token/${item.id}/`, {
                                          method: 'POST',
                                          headers: { 'Authorization': `Bearer ${jwt}` },
                                        });
                                        const tokenData = await tokenRes.json();
                                        if (!tokenRes.ok) {
                                          addToast(tokenData.error || 'Could not generate download link.', 'error');
                                          return;
                                        }
                                        const fileRes = await fetch(tokenData.download_url, {
                                          headers: { 'Authorization': `Bearer ${jwt}` },
                                        });
                                        if (!fileRes.ok) {
                                          const d = await fileRes.json();
                                          addToast(d.error || 'Download failed.', 'error');
                                          return;
                                        }
                                        const blob = await fileRes.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = item.artwork.title || 'download';
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                      } catch {
                                        addToast('Download failed.', 'error');
                                      }
                                    }}
                                    className="text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    Download
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;
