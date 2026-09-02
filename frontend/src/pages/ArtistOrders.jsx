import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ArtistSideNav from '../components/ArtistSideNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const ArtistOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingShipmentId, setUpdatingShipmentId] = useState(null);
  
  // Tracking inputs state per shipment/item
  const [trackingInputs, setTrackingInputs] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Verify artist status
    if (user.artist_profile?.status !== 'approved') {
      navigate('/profile/edit');
      return;
    }
    fetchArtistOrders();
  }, [user]);

  const fetchArtistOrders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/orders/artist/items/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
        
        // Initialise tracking number inputs
        const inputs = {};
        data.forEach(item => {
          if (item.shipment) {
            inputs[item.shipment.id] = item.shipment.tracking_number || '';
          }
        });
        setTrackingInputs(inputs);
      }
    } catch (err) {
      console.error('Error fetching artist orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackingChange = (shipmentId, val) => {
    setTrackingInputs(prev => ({ ...prev, [shipmentId]: val }));
  };

  const updateShipmentStatus = async (shipmentId, newStatus) => {
    setUpdatingShipmentId(shipmentId);
    try {
      const token = localStorage.getItem('access_token');
      const trackingNumber = trackingInputs[shipmentId] || '';
      
      const response = await fetch(`/api/orders/shipments/${shipmentId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          tracking_number: trackingNumber
        })
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
      setUpdatingShipmentId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading your sales orders..." />;
  }

  const isApprovedArtist = user?.artist_profile?.status === 'approved';

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />

      {isApprovedArtist && <ArtistSideNav />}

      <main className={`mx-auto w-full max-w-5xl px-6 py-10 page-enter flex-1 ${isApprovedArtist ? 'md:pl-60 xl:pl-72' : ''}`}>
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate(`/artists/${user?.username}`)} className="hover:text-[#9c4327] transition-colors">
              Artist Studio
            </button>
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

        {items.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
            <p className="text-stone-600">No customers have purchased your artworks yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => {
              const isPaid = item.order_payment_status === 'paid';
              return (
                <div key={item.id} className="rounded-lg border border-stone-200 bg-white p-6 flex flex-col md:flex-row justify-between gap-6">
                  {/* Artwork & Order Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-stone-950 text-lg">{item.artwork.title}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 uppercase">
                        {item.artwork.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-stone-600">
                      <div>
                        <span className="block font-medium text-stone-400 text-xs uppercase">Order Reference</span>
                        <span className="font-mono text-stone-800">#{item.order_id.slice(0, 8)}</span>
                      </div>
                      <div>
                        <span className="block font-medium text-stone-400 text-xs uppercase">Date Ordered</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="block font-medium text-stone-400 text-xs uppercase">Customer</span>
                        <span className="text-stone-800 font-medium">@{item.customer_username}</span>
                      </div>
                      <div>
                        <span className="block font-medium text-stone-400 text-xs uppercase">Quantity & Price</span>
                        <span>{item.quantity} x NPR {item.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fulfillment Controls */}
                  <div className="flex flex-col justify-between items-start md:items-end gap-4 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isPaid 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        Order: {item.order_payment_status.toUpperCase()}
                      </span>
                    </div>

                    {item.artwork.type === 'physical' && item.shipment ? (
                      <div className="w-full space-y-3 bg-stone-50 border border-stone-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-600 mb-1">
                          <span>SHIPMENT STATUS</span>
                          <span className="text-stone-900">{item.shipment.status.toUpperCase()}</span>
                        </div>

                        {!isPaid ? (
                          <p className="text-xs text-yellow-700">Awaiting customer payment. Do not ship yet.</p>
                        ) : (
                          <>
                            {item.shipment.status !== 'delivered' && (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={trackingInputs[item.shipment.id] || ''}
                                  onChange={(e) => handleTrackingChange(item.shipment.id, e.target.value)}
                                  placeholder="Enter Tracking Number"
                                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                                />

                                <div className="flex gap-2">
                                  {item.shipment.status === 'pending' && (
                                    <button
                                      onClick={() => updateShipmentStatus(item.shipment.id, 'shipped')}
                                      disabled={updatingShipmentId === item.shipment.id}
                                      className="flex-1 rounded-lg bg-[#000] hover:bg-stone-800 text-white font-medium py-1.5 text-xs transition disabled:opacity-50"
                                    >
                                      Mark Shipped
                                    </button>
                                  )}
                                  {item.shipment.status === 'shipped' && (
                                    <button
                                      onClick={() => updateShipmentStatus(item.shipment.id, 'delivered')}
                                      disabled={updatingShipmentId === item.shipment.id}
                                      className="flex-1 rounded-lg bg-green-700 hover:bg-green-800 text-white font-medium py-1.5 text-xs transition disabled:opacity-50"
                                    >
                                      Mark Delivered
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {item.shipment.status === 'delivered' && (
                              <div className="text-xs text-stone-600">
                                <p className="text-green-700 font-semibold mb-1">Item delivered successfully.</p>
                                {item.shipment.tracking_number && (
                                  <span className="font-mono block">Tracking: {item.shipment.tracking_number}</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-stone-50 border border-stone-200 p-4 w-full text-center text-xs text-stone-600 font-medium">
                        Digital Artwork — Delivery is handled automatically upon payment.
                      </div>
                    )}
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
