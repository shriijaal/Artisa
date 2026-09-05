import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import ArtistApplication from './pages/ArtistApplication'
import PublicArtistProfile from './pages/PublicArtistProfile'
import ProfileEditor from './pages/ProfileEditor'
import CreateArtwork from './pages/CreateArtwork'
import MyArtworks from './pages/MyArtworks'
import Marketplace from './pages/Marketplace'
import Artists from './pages/Artists'
import CommissionLanding from './pages/CommissionLanding'
import Home from './pages/Home'
import ArtworkDetail from './pages/ArtworkDetail'
import Wishlist from './pages/Wishlist'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import ArtistOrders from './pages/ArtistOrders'
import ArtistEarnings from './pages/ArtistEarnings'
import PaymentVerify from './pages/PaymentVerify'
import CommissionRequest from './pages/CommissionRequest'
import CommissionDetail from './pages/CommissionDetail'
import ArtistCommissions from './pages/ArtistCommissions'
import MyCommissions from './pages/MyCommissions'
import AdminDashboard from './pages/AdminDashboard'
import AdminApplications from './pages/AdminApplications'
import AdminArtworks from './pages/AdminArtworks'
import AdminCategories from './pages/AdminCategories'
import AdminUsers from './pages/AdminUsers'
import AdminOrders from './pages/AdminOrders'
import ArtistInbox from './pages/ArtistInbox'

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.artist_profile?.status === 'approved') {
    return <Navigate to={`/artists/${user.username}`} replace />;
  }
  return <Navigate to="/profile/edit" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/commissions/landing" element={<CommissionLanding />} />
          <Route path="/artworks/:id" element={<ArtworkDetail />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist-application"
            element={
              <ProtectedRoute>
                <ArtistApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artworks/create"
            element={
              <ProtectedRoute>
                <CreateArtwork />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-artworks"
            element={
              <ProtectedRoute>
                <MyArtworks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/history"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/orders"
            element={
              <ProtectedRoute>
                <ArtistOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/inboxes"
            element={
              <ProtectedRoute>
                <ArtistInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/earnings"
            element={
              <ProtectedRoute>
                <ArtistEarnings />
              </ProtectedRoute>
            }
          />
          <Route path="/artists/:username" element={<PublicArtistProfile />} />
          <Route path="/payment-verify" element={<PaymentVerify />} />
          <Route
            path="/commissions/new"
            element={
              <ProtectedRoute>
                <CommissionRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/commissions/inbox"
            element={
              <ProtectedRoute>
                <ArtistCommissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/commissions/mine"
            element={
              <ProtectedRoute>
                <MyCommissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/commissions/:id"
            element={
              <ProtectedRoute>
                <CommissionDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Home />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="artworks" element={<AdminArtworks />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
        </Routes>
      </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
