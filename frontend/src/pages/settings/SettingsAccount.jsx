import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/Toast';

const SettingsAccount = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [userData, setUserData] = useState({ username: '', first_name: '', last_name: '' });
  const [userDirty, setUserDirty] = useState(false);

  const [formData, setFormData] = useState({
    bio: '', cover_image: null, avatar: null,
    social_links: { instagram: '', website: '', facebook: '' },
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const [resProfile, resUser] = await Promise.all([
        fetch('/api/auth/artist/profile/', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/auth/me/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (resProfile.ok) {
        const d = await resProfile.json();
        setProfile(d);
        setFormData({ bio: d.bio || '', cover_image: null, avatar: null, social_links: d.social_links || { instagram: '', website: '', facebook: '' } });
      }
      if (resUser.ok) {
        const u = await resUser.json();
        setUserData({ username: u.username || '', first_name: u.first_name || '', last_name: u.last_name || '' });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/auth/me/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: userData.username, first_name: userData.first_name, last_name: userData.last_name }),
      });
      if (res.ok) {
        const d = await res.json();
        setUser(d); setUserDirty(false);
        addToast('Account details updated!', 'success');
      } else {
        const err = await res.json();
        const msg = err.username?.[0] || err.error || 'Failed to update';
        setError(msg); addToast(msg, 'error');
      }
    } catch { setError('Network error.'); addToast('Network error', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveAvatar = async () => {
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('access_token');
      const fd = new FormData();
      if (formData.avatar) fd.append('avatar', formData.avatar);
      const res = await fetch('/api/auth/artist/avatar/', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (res.ok) {
        const d = await res.json();
        setProfile({ ...profile, user: d }); setFormData({ ...formData, avatar: null });
        addToast('Avatar updated!', 'success');
      } else { const err = await res.json(); addToast(err.error || 'Failed', 'error'); }
    } catch { addToast('Network error', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('access_token');
      const fd = new FormData();
      fd.append('bio', formData.bio);
      fd.append('social_links', JSON.stringify(formData.social_links));
      if (formData.cover_image) fd.append('cover_image', formData.cover_image);
      const res = await fetch('/api/auth/artist/profile/', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (res.ok) { const d = await res.json(); setProfile(d); addToast('Profile saved!', 'success'); }
      else { const err = await res.json(); addToast(err.error || 'Failed', 'error'); }
    } catch { addToast('Network error', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner label="Loading account..." />;

  const isApprovedArtist = profile?.status === 'approved' || user?.artist_profile?.status === 'approved';
  const isPendingArtist = profile?.status === 'pending' || user?.artist_profile?.status === 'pending';
  const isRejectedArtist = profile?.status === 'rejected' || user?.artist_profile?.status === 'rejected';

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Account Info</h1>
      <p className="text-sm text-stone-500 mb-8">Manage your profile details and public presence.</p>

      {/* Application Banners */}
      {isPendingArtist && (
        <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex items-start gap-3 text-yellow-900">
          <span className="text-lg">⏳</span>
          <div>
            <p className="font-semibold text-sm">Artist Application Under Review</p>
            <p className="text-xs mt-0.5">Your portfolio is being evaluated. You'll unlock the Artist Studio once approved.</p>
          </div>
        </div>
      )}
      {isRejectedArtist && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-center justify-between text-red-900">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <p className="font-semibold text-sm">Artist Application Not Approved</p>
          </div>
          <button onClick={() => navigate('/artist-application')} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition">Re-apply</button>
        </div>
      )}
      {!isApprovedArtist && !isPendingArtist && !isRejectedArtist && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎨</span>
            <p className="text-sm text-stone-700"><span className="font-semibold">Sell your art on Artisa.</span> Showcase your portfolio and accept commissions.</p>
          </div>
          <button onClick={() => navigate('/artist-application')} className="rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition whitespace-nowrap">Become an Artist →</button>
        </div>
      )}

      {/* Avatar */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h3 className="font-semibold mb-4">Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full border-2 border-stone-200 bg-stone-100 overflow-hidden shrink-0">
            {profile?.user?.avatar ? (
              <img src={profile.user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-xl font-bold text-stone-400">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, avatar: e.target.files[0] })} className="mb-2 text-sm" />
            {formData.avatar && (
              <button onClick={handleSaveAvatar} disabled={saving} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Upload Avatar'}
              </button>
            )}
            <p className="text-xs text-stone-400 mt-1">JPG, PNG, GIF, WEBP. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h3 className="font-semibold mb-4">Account Details</h3>
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">First Name</label>
              <input type="text" value={userData.first_name} onChange={(e) => { setUserData({ ...userData, first_name: e.target.value }); setUserDirty(true); }}
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" placeholder="First name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Last Name</label>
              <input type="text" value={userData.last_name} onChange={(e) => { setUserData({ ...userData, last_name: e.target.value }); setUserDirty(true); }}
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Username</label>
            <div className="flex rounded-lg border border-stone-200 overflow-hidden focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400">
              <span className="flex items-center px-3 text-sm text-stone-400 bg-stone-50 border-r border-stone-200">artisa.com/</span>
              <input type="text" value={userData.username} onChange={(e) => { setUserData({ ...userData, username: e.target.value }); setUserDirty(true); }}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent" placeholder="username" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {userDirty && (
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Artist Profile */}
      {isApprovedArtist && (
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="font-semibold mb-4">Artist Profile</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Bio</label>
              <textarea rows={4} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" placeholder="Tell visitors about yourself..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Cover Image</label>
              <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, cover_image: e.target.files[0] })}
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-stone-100 file:text-stone-600 hover:file:bg-stone-200" />
              {profile?.cover_image && <img src={profile.cover_image} alt="" className="mt-3 h-32 w-full object-cover rounded-lg" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Social Links</label>
              <div className="space-y-2">
                <input type="url" value={formData.social_links.instagram} placeholder="Instagram URL"
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                <input type="url" value={formData.social_links.website} placeholder="Website URL"
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, website: e.target.value } })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                <input type="url" value={formData.social_links.facebook} placeholder="Facebook URL"
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Save Artist Profile'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsAccount;
