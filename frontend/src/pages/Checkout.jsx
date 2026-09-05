import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice } from '../utils/formatPrice';
import { useToast } from '../components/Toast';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // New address form state
  const [recipientName, setRecipientName] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const buyNowRun = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (buyNowRun.current) return;
    buyNowRun.current = true;
    handleBuyNow();
  }, [user]);

  const handleBuyNow = async () => {
    const buyNowId = searchParams.get('buy_now');
    if (!buyNowId) {
      fetchCartAndAddresses();
      return;
    }

    try {
      const token = localStorage.getItem('access_token');

      // Check if item is already in cart
      const cartRes = await fetch('/api/orders/cart/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const existingCart = await cartRes.json();
      const alreadyInCart = existingCart.some(item => String(item.artwork?.id) === String(buyNowId));

      if (!alreadyInCart) {
        // Add to cart
        const addRes = await fetch('/api/orders/cart/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ artwork_id: buyNowId, quantity: 1 })
        });

        if (!addRes.ok) {
          const data = await addRes.json();
          setError(data.error || 'Failed to add item to cart.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Buy now error:', err);
      setError('Failed to add item to cart.');
      setLoading(false);
      return;
    }

    fetchCartAndAddresses();
  };

  const fetchCartAndAddresses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch cart items
      const cartRes = await fetch('/api/orders/cart/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cartData = await cartRes.json();
      setCartItems(cartData);
      
      if (cartData.length === 0) {
        navigate('/cart');
        return;
      }

      // Fetch saved addresses
      const addrRes = await fetch('/api/orders/shipping-addresses/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const addrData = await addrRes.json();
      setAddresses(addrData);

      // Select default address if exists
      const defaultAddr = addrData.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (addrData.length > 0) {
        setSelectedAddressId(addrData[0].id);
      } else {
        setUseNewAddress(true);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.artwork.price * item.quantity), 0);
  };

  const hasPhysicalItems = () => {
    return cartItems.some(item => item.artwork.type === 'physical');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      let payload = {};

      if (hasPhysicalItems()) {
        if (useNewAddress) {
          if (!recipientName || !province || !district || !city || !street || !phone) {
            setError('Please fill in all required address fields.');
            setSubmitting(false);
            return;
          }
          payload = { recipient_name: recipientName, province, district, city, street, landmark, phone, is_default: isDefault };
        } else {
          if (!selectedAddressId) {
            setError('Please select a shipping address.');
            setSubmitting(false);
            return;
          }
          payload = { shipping_address_id: selectedAddressId };
        }
      }

      const response = await fetch('/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        const orderId = data.id;
        // Initiate Khalti Payment
        addToast('Order placed! Redirecting to payment...', 'success');
        const payRes = await fetch('/api/payments/khalti/initiate/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ order_id: orderId })
        });
        const payData = await payRes.json();
        if (payRes.ok && payData.payment_url) {
          // Redirect browser to Khalti sandbox
          window.location.href = payData.payment_url;
        } else {
          setError(payData.error || 'Payment initiation failed. Please try again.');
          addToast('Payment initiation failed.', 'error');
        }
      } else {
        setError(data.error || 'Failed to place order.');
        addToast(data.error || 'Failed to place order.', 'error');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Preparing checkout..." />;
  }

  const subtotal = calculateSubtotal();
  const shipping = hasPhysicalItems() ? 150 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10 page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate('/cart')} className="hover:text-[#9c4327] transition-colors">Shopping Cart</button>
            <span>/</span>
            <span className="font-medium text-stone-800">Checkout</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Checkout</h1>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Address Details Form */}
          <div className="lg:col-span-2 space-y-6">
            {hasPhysicalItems() ? (
              <div className="rounded-lg border border-stone-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Shipping Address (Nepal)</h3>
                
                {addresses.length > 0 && (
                  <div className="mb-6">
                    <label className="flex items-center gap-2 mb-4 cursor-pointer">
                      <input
                        type="radio"
                        name="addressMode"
                        checked={!useNewAddress}
                        onChange={() => setUseNewAddress(false)}
                        className="text-stone-900 focus:ring-stone-900"
                      />
                      <span className="text-sm font-medium text-stone-700">Use Saved Address</span>
                    </label>

                    {!useNewAddress && (
                      <div className="grid gap-3 pl-6">
                        {addresses.map(addr => (
                          <label
                            key={addr.id}
                            className={`flex flex-col rounded-lg border p-4 cursor-pointer transition ${
                              selectedAddressId === addr.id
                                ? 'border-stone-950 bg-stone-50/50'
                                : 'border-stone-200 hover:bg-stone-50/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-stone-900">
                                {addr.recipient_name || 'Recipient'} — {addr.street}, {addr.city}
                              </span>
                              <input
                                type="radio"
                                name="selectedAddress"
                                value={addr.id}
                                checked={selectedAddressId === addr.id}
                                onChange={(e) => setSelectedAddressId(e.target.value)}
                                className="text-stone-900 focus:ring-stone-900"
                              />
                            </div>
                            <span className="text-sm text-stone-600 mt-1">
                              {addr.district} District, {addr.province} Province
                            </span>
                            {addr.landmark && (
                              <span className="text-sm text-stone-500 mt-0.5">Landmark: {addr.landmark}</span>
                            )}
                            <span className="text-sm text-stone-600 mt-1">Phone: {addr.phone}</span>
                            {addr.is_default && (
                              <span className="inline-self-start mt-2 rounded bg-stone-200 px-2 py-0.5 text-xs text-stone-800">
                                Default
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {addresses.length > 0 && (
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input
                      type="radio"
                      name="addressMode"
                      checked={useNewAddress}
                      onChange={() => setUseNewAddress(true)}
                      className="text-stone-900 focus:ring-stone-900"
                    />
                    <span className="text-sm font-medium text-stone-700">Ship to a New Address</span>
                  </label>
                )}

                {(useNewAddress || addresses.length === 0) && (
                  <div className="space-y-4 pl-6">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Recipient Name *</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={e => setRecipientName(e.target.value)}
                        placeholder="Full name of the person receiving"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Province *</label>
                        <input
                          type="text"
                          value={province}
                          onChange={e => setProvince(e.target.value)}
                          placeholder="e.g. Bagmati Province"
                          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">District</label>
                        <input
                          type="text"
                          value={district}
                          onChange={e => setDistrict(e.target.value)}
                          placeholder="e.g. Kathmandu"
                          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          placeholder="e.g. Lalitpur"
                          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Street Address</label>
                        <input
                          type="text"
                          value={street}
                          onChange={e => setStreet(e.target.value)}
                          placeholder="e.g. Pulchowk, Ward 3"
                          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Landmark <span className="normal-case text-stone-400">(optional)</span></label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={e => setLandmark(e.target.value)}
                        placeholder="e.g. Near Big Mart, beside temple"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Phone Number *</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 9841XXXXXX"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="saveDefault"
                        checked={isDefault}
                        onChange={e => setIsDefault(e.target.checked)}
                        className="rounded border-stone-300 text-stone-950 focus:ring-stone-400"
                      />
                      <label htmlFor="saveDefault" className="text-sm text-stone-600">
                        Save as default shipping address
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-stone-200 bg-white p-6 text-center">
                <p className="text-stone-600">Your cart contains only digital artworks. No shipping address is required!</p>
              </div>
            )}

            {/* Cart items review */}
            <div className="rounded-lg border border-stone-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Review Items</h3>
              <div className="divide-y divide-stone-100">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-stone-900">{item.artwork.title}</h4>
                      <p className="text-sm text-stone-500">by {item.artwork.artist?.username}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-stone-600">{item.quantity} x</span>
                      <span className="font-semibold text-stone-900 ml-2">NPR {formatPrice(item.artwork.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-stone-200 bg-white p-6 sticky top-8">
              <h3 className="font-semibold text-stone-900 mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>NPR {formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Shipping</span>
                  <span>{shipping > 0 ? `NPR ${formatPrice(shipping)}` : 'Free'}</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between font-semibold text-stone-900">
                  <span>Total</span>
                  <span>NPR {formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-[#000] px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Place Order →'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
