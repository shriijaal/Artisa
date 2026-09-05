import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ArtistSideNav from '../components/ArtistSideNav';
import { formatPrice } from '../utils/formatPrice';
import LoadingSpinner from '../components/LoadingSpinner';

const ArtistEarnings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [earningsData, setEarningsData] = useState({ total_earnings: 0, sales_count: 0, orders: [] });
  const [loading, setLoading] = useState(true);

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
    fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/orders/artist/earnings/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEarningsData(data);
      }
    } catch (err) {
      console.error('Error fetching artist earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading earnings data..." />;
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
            <span className="font-medium text-stone-800">Earnings</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">Earnings Summary</h1>
              <p className="text-stone-500 mt-1">Your revenue metrics and sales transactions.</p>
            </div>
            <button
              onClick={() => navigate('/artist/orders')}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition"
            >
              Manage Fulfillment
            </button>
          </div>
        </div>

        {/* Premium Dashboard Metrics Cards */}
        <div className="grid gap-6 sm:grid-cols-2 mb-10">
          <div className="rounded-lg border border-stone-200 bg-white p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">Total Revenue</span>
              <span className="text-3xl font-bold text-stone-950">NPR {earningsData.total_earnings.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">Units Sold</span>
              <span className="text-3xl font-bold text-stone-950">{earningsData.sales_count}</span>
            </div>
          </div>
        </div>

        {/* Transactions list */}
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Transaction History</h3>

        {earningsData.orders.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
            <p className="text-stone-600">No completed transactions found. Earnings accrue after customer payment.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase text-stone-500">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Artwork</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Earnings</th>
                    <th className="px-6 py-4 text-center">Shipment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {earningsData.orders.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/30 transition">
                      <td className="px-6 py-4 font-mono font-medium text-stone-900">
                        #{item.order_id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-stone-900">
                        {item.artwork_title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 uppercase">
                          {item.artwork_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        NPR {formatPrice(item.price)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 font-semibold text-stone-950 text-right">
                        NPR {item.earnings.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.shipment_status === 'delivered' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : item.shipment_status === 'shipped'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-stone-50 text-stone-700 border border-stone-200'
                        }`}>
                          {item.shipment_status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArtistEarnings;
