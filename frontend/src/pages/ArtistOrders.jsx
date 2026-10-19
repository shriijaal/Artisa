import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import Header from '../components/Header';
import ArtistSideNav from '../components/ArtistSideNav';
import { formatPrice } from '../utils/formatPrice';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import CustomSelect from '../components/CustomSelect';
import authFetch from '../utils/authFetch';
import StatusProgressBar from '../components/StatusProgressBar';

const ArtistOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { compact } = useSidebar();
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.artist_profile?.status !== 'approved') { navigate('/settings/account'); return; }
    fetchArtistOrders();
  }, [user]);

  const fetchArtistOrders = async () => {
    try {
      const response = await authFetch('/api/orders/artist/items/');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching artist orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateShipmentStatus = async (shipmentId, newStatus) => {
    setUpdatingId(shipmentId);
    try {
      const response = await authFetch(`/api/orders/shipments/${shipmentId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchArtistOrders();
        addToast('Shipment status updated!', 'success');
      } else {
        addToast('Failed to update shipment status.', 'error');
      }
    } catch (err) {
      console.error('Error updating shipment:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (orderId) => {
    if (!rejectReason.trim()) return;
    setUpdatingId(orderId);
    try {
      const response = await authFetch(`/api/orders/${orderId}/artist-reject/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      if (response.ok) {
        fetchArtistOrders();
        setRejectingId(null);
        setRejectReason('');
        addToast('Order rejected.', 'success');
      } else {
        const data = await response.json();
        addToast(data.error || 'Failed to reject order.', 'error');
      }
    } catch {
      addToast('Network error.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAccept = async (orderId) => {
    setUpdatingId(orderId);
    try {
      const response = await authFetch(`/api/orders/${orderId}/artist-accept/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        fetchArtistOrders();
        addToast('Order accepted! You can now proceed with fulfillment.', 'success');
      } else {
        const data = await response.json();
        addToast(data.error || 'Failed to accept order.', 'error');
      }
    } catch {
      addToast('Network error.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        const match = item.artwork.title.toLowerCase().includes(q) ||
          item.customer_username.toLowerCase().includes(q) ||
          item.order_id.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter) {
        if (item.order_status !== statusFilter) return false;
      } else {
        if (item.order_status === 'cancelled') return false;
      }
      return true;
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(() => {
    const paid = items.filter((i) => i.order_payment_status === 'paid');
    const totalRevenue = paid.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    const pendingShipments = items.filter((i) => i.order_payment_status === 'paid' && i.artwork.type === 'physical' && i.shipment?.status === 'pending').length;
    const totalSold = items.reduce((s, i) => s + i.quantity, 0);
    return { totalRevenue, pendingShipments, totalSold, totalOrders: items.length };
  }, [items]);

  if (loading) return <LoadingSpinner label="Loading your sales orders..." />;

  const isApprovedArtist = user?.artist_profile?.status === 'approved';

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />
      {isApprovedArtist && <ArtistSideNav />}

      <main className={`mx-auto w-full max-w-5xl px-6 py-10 page-enter flex-1 ${isApprovedArtist ? (compact ? 'md:pl-16' : 'md:pl-60 xl:pl-72') : ''}`}>
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate(`/artists/${user?.username}`)} className="hover:text-[#9c4327] transition-colors">Artist Studio</button>
            <span>/</span>
            <span className="font-medium text-stone-800">Manage Sales</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">Manage Sales</h1>
              <p className="text-stone-500 mt-1">Track and fulfill orders for your artworks.</p>
            </div>
            <button
              onClick={() => navigate('/artist/earnings')}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition"
            >
              View Earnings Summary
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Sales', value: stats.totalSold, color: 'text-stone-900' },
            { label: 'Revenue', value: `NPR ${stats.totalRevenue.toLocaleString()}`, color: 'text-stone-900' },
            { label: 'Pending Shipments', value: stats.pendingShipments, color: 'text-stone-900' },
            { label: 'Total Orders', value: stats.totalOrders, color: 'text-stone-900' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-stone-200 bg-white p-4">
              <p className="text-xs font-medium text-stone-500 uppercase">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search by artwork, customer, or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Orders"
            options={statusOptions}
            className="w-full sm:w-40"
          />
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
            <p className="text-stone-600">{items.length === 0 ? 'No customers have purchased your artworks yet.' : 'No orders match your search.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isPaid = item.order_payment_status === 'paid';
                      const img = item.artwork?.images?.[0]?.image;
              return (
                <div key={item.id} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Artwork Image */}
                    <div className="md:w-32 h-32 md:h-auto flex-shrink-0 bg-stone-100">
                      {img ? (
                        <img src={img} alt={item.artwork.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">No image</div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-5">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-[15px] font-semibold text-stone-950">{item.artwork.title}</h3>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 uppercase tracking-wider">{item.artwork.type}</span>
                        <StatusProgressBar value={item.order_payment_status} kind="payment" variant="compact" />
                        {!isPaid && item.order_status === 'processing' && (
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                            Accepted
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Order</span>
                          <span className="font-mono text-[13px] text-stone-800">#{item.order_id.slice(0, 8)}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Customer</span>
                          <span className="text-[13px] text-stone-800 font-medium">@{item.customer_username}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Quantity</span>
                          <span className="text-[13px] text-stone-800">{item.quantity}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">Price</span>
                          <span className="text-[13px] text-stone-900 font-semibold">NPR {formatPrice(item.price)}</span>
                        </div>
                      </div>

                      {/* Status Timeline (physical only) */}
                      {item.artwork.type === 'physical' && item.shipment && (
                        <div>
                          <StatusProgressBar value={item.shipment.status} kind="shipment" variant="full" />
                          {item.shipment.tracking_number && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                              <span className="font-mono">{item.shipment.tracking_number}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {item.artwork.type === 'digital' && (
                        <div className="text-[11px] text-stone-500 bg-stone-50 rounded-lg px-3 py-1.5 inline-block">
                          Digital — delivery handled automatically upon payment
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-center items-start md:items-end gap-2 p-5 md:min-w-[200px] border-t md:border-t-0 md:border-l border-stone-100">
                      {item.artwork.type === 'physical' && item.shipment && isPaid && (
                        <>
                          {item.shipment.status !== 'delivered' && (
                            <>
                              {item.shipment.status === 'pending' && (
                                <button
                                  onClick={() => updateShipmentStatus(item.shipment.id, 'shipped')}
                                  disabled={updatingId === item.shipment.id}
                                  className="w-full rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium py-2 text-[12px] transition disabled:opacity-50"
                                >
                                  {updatingId === item.shipment.id ? 'Updating...' : 'Mark Shipped'}
                                </button>
                              )}
                              {item.shipment.status === 'shipped' && (
                                <button
                                  onClick={() => updateShipmentStatus(item.shipment.id, 'delivered')}
                                  disabled={updatingId === item.shipment.id}
                                  className="w-full rounded-lg bg-green-700 hover:bg-green-800 text-white font-medium py-2 text-[12px] transition disabled:opacity-50"
                                >
                                  {updatingId === item.shipment.id ? 'Updating...' : 'Mark Delivered'}
                                </button>
                              )}
                            </>
                          )}
                          {item.shipment.status === 'delivered' && (
                            <span className="text-[12px] text-green-700 font-medium">Delivered</span>
                          )}
                        </>
                      )}

                      {!isPaid && item.order_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAccept(item.order_id)}
                            disabled={updatingId === item.order_id}
                            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 text-[12px] transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingId === item.order_id ? 'Accepting...' : 'Accept Order'}
                          </button>
                          <button
                            onClick={() => setRejectingId(rejectingId === item.order_id ? null : item.order_id)}
                            disabled={updatingId === item.order_id}
                            className="w-full rounded-lg border border-red-200 bg-red-50 text-red-700 font-medium py-2 text-[12px] hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject Order
                          </button>
                        </>
                      )}

                      {rejectingId === item.order_id && (
                        <div className="w-full space-y-2">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            rows={2}
                            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(item.order_id)}
                              disabled={!rejectReason.trim() || updatingId === item.order_id}
                              className="flex-1 rounded-lg bg-red-600 text-white font-medium py-1.5 text-[12px] hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingId === item.order_id ? 'Rejecting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              className="flex-1 rounded-lg border border-stone-200 text-stone-600 font-medium py-1.5 text-[12px] hover:bg-stone-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ArtistOrders;
