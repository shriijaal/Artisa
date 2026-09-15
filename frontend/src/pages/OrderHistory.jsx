import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice } from '../utils/formatPrice';
import { useToast } from '../components/Toast';
import authFetch from '../utils/authFetch';

const StarRatingInput = ({ rating, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="cursor-pointer"
        >
          <svg
            className={`h-6 w-6 ${star <= (hover || rating) ? 'text-amber-500' : 'text-stone-200'} transition-colors`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [reviewedItems, setReviewedItems] = useState(new Set());
  const [reviewingItemId, setReviewingItemId] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders();
  }, [user]);

  useEffect(() => {
    if (user && orders.length > 0) checkReviewedItems();
  }, [orders, user]);

  const checkReviewedItems = async () => {
    try {
      const reviewed = new Set();
      for (const order of orders) {
        if (!order.items) continue;
        for (const item of order.items) {
          const res = await authFetch(`/api/reviews/?artwork_id=${item.artwork.id}`);
          if (res.ok) {
            const reviews = await res.json();
            if (reviews.some(r => r.reviewer?.id === user.id)) reviewed.add(item.id);
          }
        }
      }
      setReviewedItems(reviewed);
    } catch {}
  };

  const handleSubmitReview = async (itemId) => {
    if (!reviewRating || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await authFetch('/api/reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_item_id: itemId, rating: reviewRating, comment: reviewComment.trim() }),
      });
      if (res.ok) {
        setReviewedItems((prev) => new Set([...prev, itemId]));
        setReviewingItemId(null);
        setReviewRating(0);
        setReviewComment('');
        addToast('Review submitted!', 'success');
      } else {
        const err = await res.json();
        addToast(err.order_item_id?.[0] || err.detail || 'Failed to submit review', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await authFetch('/api/orders/');
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

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      const res = await authFetch(`/api/orders/${orderId}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        fetchOrders();
        addToast('Order cancelled successfully.', 'success');
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to cancel order.', 'error');
      }
    } catch {
      addToast('Network error.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (search) {
        const q = search.toLowerCase();
        const match = order.id.toLowerCase().includes(q) ||
          order.items?.some((i) => i.artwork?.title?.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (activeTab === 'active') {
        return ['pending', 'processing', 'shipped'].includes(order.status);
      }
      if (activeTab === 'completed') {
        return order.status === 'delivered';
      }
      if (activeTab === 'cancelled') {
        return order.status === 'cancelled';
      }
      return true;
    });
  }, [orders, search, activeTab]);

  const tabCounts = useMemo(() => ({
    all: orders.length,
    active: orders.filter((o) => ['pending', 'processing', 'shipped'].includes(o.status)).length,
    completed: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }), [orders]);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) return <LoadingSpinner label="Loading your orders..." />;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10 page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate('/marketplace')} className="hover:text-[#9c4327] transition-colors">Marketplace</button>
            <span>/</span>
            <span className="font-medium text-stone-800">Order History</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Your Orders</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-stone-200 mb-6 overflow-x-auto">
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
              {tabCounts[tab.key] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-[#9c4327]/10 text-[#9c4327]' : 'bg-stone-100 text-stone-500'
                }`}>
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by order ID or artwork name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c4327]/30 focus:border-[#9c4327]"
          />
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
            <p className="text-stone-600 mb-4">{orders.length === 0 ? 'You have not placed any orders yet.' : 'No orders match your search.'}</p>
            {orders.length === 0 && (
              <button
                onClick={() => navigate('/marketplace')}
                className="rounded-lg bg-[#000] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 transition"
              >
                Browse Marketplace
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const currentStep = statusSteps.indexOf(order.status);
              return (
                <div key={order.id} className="rounded-lg border border-stone-200 bg-white overflow-hidden">
                  <div
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-stone-900">#{order.id.slice(0, 8)}</span>
                        <span className="text-sm text-stone-500">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-stone-600 mt-1">Total: रू {formatPrice(order.total)}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#9c4327]/10 text-[#9c4327] border border-[#9c4327]/20'
                      }`}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        order.status === 'processing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        order.status === 'cancelled' ? 'bg-stone-100 text-stone-500 border border-stone-200' :
                        order.status === 'pending' ? 'bg-[#9c4327]/10 text-[#9c4327] border border-[#9c4327]/20' :
                        'bg-stone-50 text-stone-700 border border-stone-200'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>

                      {order.payment_status === 'pending' && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setPayingOrderId(order.id);
                            try {
                              const res = await authFetch('/api/payments/khalti/initiate/', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ order_id: order.id }),
                              });
                              const data = await res.json();
                              if (res.ok && data.payment_url) {
                                window.location.href = data.payment_url;
                              } else {
                                addToast(data.error || 'Could not initiate payment.', 'error');
                              }
                            } catch {
                              addToast('Payment initiation failed.', 'error');
                            } finally {
                              setPayingOrderId(null);
                            }
                          }}
                          disabled={payingOrderId === order.id}
                          className="rounded-lg bg-[#000] px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition disabled:opacity-50"
                        >
                          {payingOrderId === order.id ? 'Redirecting...' : 'Pay with Khalti'}
                        </button>
                      )}

                      {order.status === 'pending' && order.payment_status !== 'paid' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (cancellingId !== order.id) {
                              if (window.confirm('Are you sure you want to cancel this order?')) {
                                handleCancelOrder(order.id);
                              }
                            }
                          }}
                          disabled={cancellingId === order.id}
                          className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}

                      <svg
                        className={`h-5 w-5 text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-stone-100 bg-stone-50/30 p-5 space-y-5">
                      {/* Status Timeline */}
                      {order.status !== 'cancelled' && (
                        <div className="flex items-center justify-center gap-1 py-2">
                          {statusSteps.map((step, idx) => {
                            const isComplete = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            return (
                              <div key={step} className="flex items-center">
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                  isCurrent ? 'bg-[#9c4327]/10 text-[#9c4327] font-semibold' :
                                  isComplete ? 'bg-emerald-50 text-emerald-700' :
                                  'bg-stone-100 text-stone-400'
                                }`}>
                                  {isComplete && !isCurrent ? (
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  ) : null}
                                  <span className="capitalize">{step}</span>
                                </div>
                                {idx < 3 && (
                                  <div className={`w-8 h-px ${idx < currentStep ? 'bg-emerald-300' : 'bg-stone-200'}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {order.status === 'cancelled' && (
                        <div className="text-center py-2">
                          <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-4 py-1.5">
                            Order Cancelled
                          </span>
                        </div>
                      )}

                      {/* Shipping Details */}
                      {order.shipping_address && (
                        <div>
                          <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">Shipping Details</h4>
                          <p className="text-sm text-stone-900">{order.shipping_address.street}, {order.shipping_address.city}</p>
                          <p className="text-sm text-stone-600">{order.shipping_address.district} District, {order.shipping_address.province} Province</p>
                          <p className="text-sm text-stone-600">Phone: {order.shipping_address.phone}</p>
                        </div>
                      )}

                      {/* Items */}
                      <div>
                        <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-3">Items</h4>
                        <div className="divide-y divide-stone-100 bg-white border border-stone-200 rounded-lg overflow-hidden">
                          {order.items.map((item) => {
                            const img = item.artwork?.images?.[0]?.image;
                            return (
                              <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                  {img ? (
                                    <img src={img} alt={item.artwork.title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-12 h-12 rounded bg-stone-100 flex items-center justify-center text-stone-400 text-xs flex-shrink-0">No img</div>
                                  )}
                                  <div>
                                    <h5 className="font-medium text-stone-900">{item.artwork.title}</h5>
                                    <p className="text-xs text-stone-500">{item.artwork.type.toUpperCase()} · @{item.artwork.artist?.username}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 self-end sm:self-center flex-wrap">
                                  <div className="text-right">
                                    <span className="text-sm text-stone-500">{item.quantity} x</span>
                                    <span className="font-semibold text-stone-900 ml-2">रू {formatPrice(item.price)}</span>
                                  </div>

                                  {item.artwork.type === 'physical' && item.shipment && (
                                    <div className="rounded-lg bg-stone-50 px-3 py-1.5 border border-stone-200 text-xs">
                                      <span className="font-semibold text-stone-700 block">Shipment: {item.shipment.status.toUpperCase()}</span>
                                      {item.shipment.tracking_number && (
                                        <span className="text-stone-500 font-mono block mt-0.5">Tracking: {item.shipment.tracking_number}</span>
                                      )}
                                    </div>
                                  )}

                                  {item.artwork.type === 'digital' && order.payment_status === 'paid' && (
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const tokenRes = await authFetch(`/api/orders/${order.id}/download-token/${item.id}/`, {
                                            method: 'POST',
                                          });
                                          const tokenData = await tokenRes.json();
                                          if (!tokenRes.ok) { addToast(tokenData.error || 'Could not generate download link.', 'error'); return; }
                                          const fileRes = await authFetch(tokenData.download_url);
                                          if (!fileRes.ok) { const d = await fileRes.json(); addToast(d.error || 'Download failed.', 'error'); return; }
                                          const blob = await fileRes.blob();
                                          const url = window.URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = item.artwork.title || 'download';
                                          a.click();
                                          window.URL.revokeObjectURL(url);
                                        } catch { addToast('Download failed.', 'error'); }
                                      }}
                                      className="text-xs font-semibold text-white bg-[#000] hover:bg-stone-800 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                    >
                                      Download
                                    </button>
                                  )}

                                  {(order.status === 'delivered' || order.status === 'completed') && !reviewedItems.has(item.id) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReviewingItemId(reviewingItemId === item.id ? null : item.id);
                                        setReviewRating(0);
                                        setReviewComment('');
                                      }}
                                      className="text-xs font-semibold text-[#9c4327] border border-[#9c4327]/30 bg-[#9c4327]/5 hover:bg-[#9c4327]/10 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                    >
                                      {reviewingItemId === item.id ? 'Cancel' : 'Write Review'}
                                    </button>
                                  )}
                                  {reviewedItems.has(item.id) && (
                                    <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                                      Reviewed
                                    </span>
                                  )}
                                </div>

                                {reviewingItemId === item.id && (
                                  <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4 w-full">
                                    <p className="text-xs font-semibold text-stone-700 mb-2">Your Rating</p>
                                    <StarRatingInput rating={reviewRating} onChange={setReviewRating} />
                                    <textarea
                                      value={reviewComment}
                                      onChange={(e) => setReviewComment(e.target.value)}
                                      placeholder="Share your experience with this artwork..."
                                      rows={3}
                                      className="w-full mt-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubmitReview(item.id);
                                      }}
                                      disabled={!reviewRating || !reviewComment.trim() || submittingReview}
                                      className="mt-3 rounded-lg bg-[#000] px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
