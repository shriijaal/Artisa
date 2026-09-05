import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ArtistSideNav from '../components/ArtistSideNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const ProfileEditor = () => {
  const { user } = useAuth();
  const { compact } = useSidebar();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    bio: '',
    cover_image: null,
    avatar: null,
    social_links: {
      instagram: '',
      website: '',
      facebook: '',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/auth/artist/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          bio: data.bio || '',
          cover_image: null,
          avatar: null,
          social_links: data.social_links || {
            instagram: '',
            website: '',
            facebook: '',
          },
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const formDataToSend = new FormData();
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('social_links', JSON.stringify(formData.social_links));
      
      if (formData.cover_image) {
        formDataToSend.append('cover_image', formData.cover_image);
      }

      const response = await fetch('/api/auth/artist/profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setError('');
        addToast('Profile saved successfully!', 'success');
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to save profile');
        addToast(err.error || 'Failed to save profile', 'error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      addToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvatar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const formDataToSend = new FormData();
      
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      const response = await fetch('/api/auth/artist/avatar/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({ ...profile, user: data });
        setFormData({ ...formData, avatar: null });
        setError('');
        addToast('Avatar updated successfully!', 'success');
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to save avatar');
        addToast(err.error || 'Failed to save avatar', 'error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      addToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading profile..." />;
  }

  const isApprovedArtist = profile?.status === 'approved' || user?.artist_profile?.status === 'approved';
  const isPendingArtist = profile?.status === 'pending' || user?.artist_profile?.status === 'pending';
  const isRejectedArtist = profile?.status === 'rejected' || user?.artist_profile?.status === 'rejected';

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <Header />

      {isApprovedArtist && <ArtistSideNav />}

      <main className={`mx-auto w-full max-w-3xl px-6 py-10 page-enter flex-1 ${isApprovedArtist ? (compact ? 'md:pl-16' : 'md:pl-60 xl:pl-72') : ''}`}>
        {/* Application Status Banners */}
        {isPendingArtist && (
          <div className="mb-8 rounded-lg bg-yellow-50/90 border border-yellow-200 p-5 flex items-start gap-4 text-yellow-900">
            <div className="h-9 w-9 rounded-lg bg-yellow-200/70 flex items-center justify-center text-lg flex-shrink-0">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm">Artist Application Under Review</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-200/80 text-yellow-800 px-2 py-0.5 rounded-full">Pending</span>
              </div>
              <p className="text-xs text-yellow-800 mt-1 leading-relaxed">
                Your portfolio application has been submitted and is currently being evaluated by the Artisa curation team. You will unlock the Artist Studio once approved.
              </p>
            </div>
          </div>
        )}

        {isRejectedArtist && (
          <div className="mb-8 rounded-lg bg-red-50 border border-red-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-red-900">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-200/70 flex items-center justify-center text-lg flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h4 className="font-bold text-sm">Artist Application: Not Approved</h4>
                <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                  Your previous artist application was not approved. You can update your portfolio samples and submit a new application.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/artist-application')}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition flex-shrink-0"
            >
              Re-apply Now
            </button>
          </div>
        )}

        {!isApprovedArtist && !isPendingArtist && !isRejectedArtist && (
          <div className="mb-8 rounded-lg bg-gradient-to-r from-amber-50/90 to-orange-50/90 border border-amber-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">Sell Your Art on Artisa</h4>
                <p className="text-xs text-stone-600 mt-0.5">Showcase your portfolio, sell original artworks, and accept bespoke commissions.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/artist-application')}
              className="rounded-lg bg-[#000] px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition flex-shrink-0 whitespace-nowrap"
            >
              Become an Artist →
            </button>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            {isApprovedArtist ? (
              <button onClick={() => navigate(`/artists/${user?.username}`)} className="hover:text-[#9c4327] transition-colors">
                Artist Studio
              </button>
            ) : (
              <button onClick={() => navigate('/orders')} className="hover:text-[#9c4327] transition-colors">
                My Purchases
              </button>
            )}
            <span>/</span>
            <span className="font-medium text-stone-800">Edit Profile</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Edit Profile</h1>
          <p className="mt-2 text-stone-600">
            {isApprovedArtist ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 border border-emerald-200">
                ✓ Verified Artist
              </span>
            ) : (
              <span className="text-stone-500">Update your public profile details and bio.</span>
            )}
          </p>
        </div>

        {/* Avatar Upload */}
        <div className="mb-8 rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="h-24 w-24 rounded-full border-2 border-stone-200 bg-stone-100 overflow-hidden">
              {profile?.user?.avatar ? (
                <img
                  src={`${profile.user.avatar}`}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-2xl font-bold text-stone-400">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, avatar: e.target.files[0] })}
                className="mb-2"
              />
              {formData.avatar && (
                <button
                  onClick={handleSaveAvatar}
                  disabled={saving}
                  className="rounded-lg bg-[#000] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Upload Avatar'}
                </button>
              )}
              <p className="mt-2 text-sm text-stone-500">Max 5MB. JPG, PNG, GIF, WEBP.</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-stone-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                rows={6}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                placeholder="Tell visitors about yourself, your artistic style, and your journey..."
              />
            </div>

            <div>
              <label htmlFor="cover_image" className="block text-sm font-medium text-stone-700 mb-2">
                Cover Image
              </label>
              <input
                id="cover_image"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.files[0] })}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-stone-100 file:text-stone-600 hover:file:bg-stone-200"
              />
              {profile?.cover_image && (
                <img
                  src={`${profile.cover_image}`}
                  alt="Cover"
                  className="mt-4 h-48 w-full object-cover rounded-lg"
                />
              )}
              <p className="mt-2 text-sm text-stone-500">Max 5MB. Recommended: 1920x600px.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Social Links
              </label>
              <div className="space-y-3">
                <div>
                  <label htmlFor="instagram" className="block text-xs font-medium text-stone-500 mb-1">
                    Instagram
                  </label>
                  <input
                    id="instagram"
                    type="url"
                    value={formData.social_links.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, instagram: e.target.value }
                    })}
                    className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-xs font-medium text-stone-500 mb-1">
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={formData.social_links.website}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, website: e.target.value }
                    })}
                    className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label htmlFor="facebook" className="block text-xs font-medium text-stone-500 mb-1">
                    Facebook
                  </label>
                  <input
                    id="facebook"
                    type="url"
                    value={formData.social_links.facebook}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, facebook: e.target.value }
                    })}
                    className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                    placeholder="https://facebook.com/yourusername"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[#000] px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Profile →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfileEditor;
