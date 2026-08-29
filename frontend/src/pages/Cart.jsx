import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/orders/cart/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/orders/cart/${itemId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`/api/orders/cart/${itemId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchCart();
      addToast('Item removed from cart', 'info');
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      await fetch('/api/orders/cart/clear/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchCart();
    } catch (err) {
      console.error('Error clearing cart:', err);
    } finally {
      setUpdating(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.artwork.price * item.quantity), 0);
  };

  if (loading) {
    return <LoadingSpinner label="Loading your cart..." />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-10 page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <button onClick={() => navigate('/marketplace')} className="hover:text-amber-600 transition-colors">Marketplace</button>
            <span>/</span>
            <span className="font-medium text-stone-800">Shopping Cart</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>Shopping Cart</h1>
              <p className="mt-1 text-stone-500">
                {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
              </p>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                disabled={updating}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
            <p className="text-stone-600 mb-4">Your cart is empty.</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Browse Artworks
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const primaryImage = item.artwork.images?.find(img => img.is_primary) || item.artwork.images?.[0];

                return (
                  <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                    <div className="flex gap-6">
                      {primaryImage && (
                        <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                          <img
                            src={primaryImage.image}
                            alt={item.artwork.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-stone-900">{item.artwork.title}</h3>
                            <p className="mt-1 text-sm text-stone-600">
                              by {item.artwork.artist?.username}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 transition"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <p className="mt-2 font-semibold text-stone-900">
                          NPR {item.artwork.price}
                        </p>
                        
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updating || item.quantity <= 1}
                            className="rounded-lg border border-stone-200 px-3 py-1 text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updating || (item.artwork.type === 'digital')}
                            className="rounded-lg border border-stone-200 px-3 py-1 text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition"
                          >
                            +
                          </button>
                        </div>
                        
                        {item.artwork.type === 'digital' && (
                          <p className="mt-2 text-xs text-stone-500">
                            Digital artwork - quantity fixed at 1
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sticky top-8">
                <h3 className="font-semibold text-stone-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span>NPR {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-stone-200 pt-3 flex justify-between font-semibold text-stone-900">
                    <span>Total</span>
                    <span>NPR {calculateSubtotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/checkout')}
                  className="mt-6 w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
