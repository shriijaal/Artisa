import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImageCropModal from '../../components/ImageCropModal';
import { useToast } from '../../components/Toast';
import authFetch from '../../utils/authFetch';

const SPECIALTIES = [
  'Painting', 'Digital Art', 'Sculpture', 'Photography', 'Illustration',
  'Printmaking', 'Mixed Media', 'Textile Art', 'Ceramics', 'Calligraphy',
  '3D Art', 'Sketching', 'Other',
];

const DropZone = ({ children, onDrop, className = '' }) => {
  const [over, setOver] = useState(false);
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  return (
    <div
      onDragEnter={(e) => { handleDrag(e); setOver(true); }}
      onDragOver={(e) => { handleDrag(e); setOver(true); }}
      onDragLeave={(e) => { handleDrag(e); setOver(false); }}
      onDrop={(e) => { handleDrag(e); setOver(false); onDrop(e.dataTransfer.files); }}
      className={`${className} ${over ? 'ring-2 ring-stone-400 ring-offset-2' : ''}`}
    >
      {children}
    </div>
  );
};

const SettingsAccount = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ user: false, avatar: false, profile: false });
  const [error, setError] = useState('');

  const [userData, setUserData] = useState({ username: '', first_name: '', last_name: '' });
  const [userDirty, setUserDirty] = useState(false);

  const [bio, setBio] = useState('');
  const [bioDirty, setBioDirty] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [province, setProvince] = useState('');
  const [provinceDirty, setProvinceDirty] = useState(false);
  const [socialLinks, setSocialLinks] = useState({ instagram: '', website: '', facebook: '' });
  const [socialDirty, setSocialDirty] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [cropModal, setCropModal] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const [resProfile, resUser] = await Promise.all([
        authFetch('/api/auth/artist/profile/'),
        authFetch('/api/auth/me/'),
      ]);
      if (resProfile.ok) {
        const d = await resProfile.json();
        setProfile(d);
        setBio(d.bio || '');
        setSpecialties(d.specialties || []);
        setProvince(d.province || '');
        setSocialLinks(d.social_links || { instagram: '', website: '', facebook: '' });
      }
      if (resUser.ok) {
        const u = await resUser.json();
        setUserData({ username: u.username || '', first_name: u.first_name || '', last_name: u.last_name || '' });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAvatarDrop = (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarFile(file);
    setCropModal({ type: 'avatar', file, aspect: 1 });
  };

  const handleCoverDrop = (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setCoverFile(file);
    setCropModal({ type: 'cover', file, aspect: 16 / 5 });
  };

  const handleCrop = (croppedFile) => {
    if (cropModal.type === 'avatar') {
      setAvatarFile(croppedFile);
      setAvatarPreview(URL.createObjectURL(croppedFile));
    } else {
      setCoverFile(croppedFile);
      setCoverPreview(URL.createObjectURL(croppedFile));
    }
    setCropModal(null);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving((s) => ({ ...s, user: true })); setError('');
    try {
      const res = await authFetch('/api/auth/me/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    finally { setSaving((s) => ({ ...s, user: false })); }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    setSaving((s) => ({ ...s, avatar: true }));
    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);
      const res = await authFetch('/api/auth/artist/avatar/', { method: 'PUT', body: fd });
      if (res.ok) {
        const d = await res.json();
        setProfile((p) => ({ ...p, user: d }));
        setAvatarFile(null); setAvatarPreview(null);
        addToast('Avatar updated!', 'success');
      } else { const err = await res.json(); addToast(err.error || 'Failed', 'error'); }
    } catch { addToast('Network error', 'error'); }
    finally { setSaving((s) => ({ ...s, avatar: false })); }
  };

  const handleSaveProfile = async () => {
    setSaving((s) => ({ ...s, profile: true })); setError('');
    try {
      const fd = new FormData();
      fd.append('bio', bio);
      fd.append('social_links', JSON.stringify(socialLinks));
      fd.append('specialties', JSON.stringify(specialties));
      fd.append('province', province);
      if (coverFile) fd.append('cover_image', coverFile);
      const res = await authFetch('/api/auth/artist/profile/', { method: 'PUT', body: fd });
      if (res.ok) {
        const d = await res.json();
        setProfile(d); setCoverFile(null); setCoverPreview(null); setBioDirty(false); setSocialDirty(false);
        addToast('Profile saved!', 'success');
      } else { const err = await res.json(); addToast(err.error || 'Failed', 'error'); }
    } catch { addToast('Network error', 'error'); }
    finally { setSaving((s) => ({ ...s, profile: false })); }
  };

  const toggleSpecialty = (s) => {
    setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  if (loading) return <LoadingSpinner label="Loading account..." />;

  const isApprovedArtist = profile?.status === 'approved' || user?.artist_profile?.status === 'approved';
  const isPendingArtist = profile?.status === 'pending' || user?.artist_profile?.status === 'pending';
  const isRejectedArtist = profile?.status === 'rejected' || user?.artist_profile?.status === 'rejected';
  const displayName = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.username;
  const displayAvatar = avatarPreview || profile?.user?.avatar;
  const displayCover = coverPreview || profile?.cover_image;

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

      {/* Live Profile Preview */}
      <div className="mb-6 rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Profile Preview</p>
        </div>
        <div className="relative h-32 sm:h-40 bg-stone-100">
          {displayCover ? (
            <img src={displayCover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-stone-200 to-stone-100" />
          )}
          <div className="absolute -bottom-8 left-5">
            <div className="h-16 w-16 rounded-full border-3 border-white bg-stone-100 overflow-hidden shadow-md">
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-lg font-bold text-stone-400">{userData.username?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pt-10 pb-4 px-5">
          <h3 className="font-semibold text-stone-900 text-sm">{displayName}</h3>
          <p className="text-xs text-stone-500">@{userData.username}</p>
          {isApprovedArtist && specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {specialties.map((s) => (
                <span key={s} className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">{s}</span>
              ))}
            </div>
          )}
          {isApprovedArtist && bio && (
            <p className="text-xs text-stone-500 mt-2 line-clamp-2">{bio}</p>
          )}
        </div>
      </div>

      {/* Avatar */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h3 className="font-semibold mb-4">Profile Picture</h3>
        <DropZone onDrop={handleAvatarDrop} className="rounded-lg border-2 border-dashed border-stone-200 hover:border-stone-300 transition-colors">
          <div className="flex items-center gap-6 p-4">
            <div className="h-20 w-20 rounded-full border-2 border-stone-200 bg-stone-100 overflow-hidden shrink-0">
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xl font-bold text-stone-400">{user?.username?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-stone-700 font-medium">Drag & drop an image here</p>
              <p className="text-xs text-stone-400 mt-0.5">or click to browse. JPG, PNG, GIF, WEBP. Max 5MB.</p>
              <label className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors">
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files[0]) handleAvatarDrop(e.target.files); }}
                />
              </label>
            </div>
          </div>
        </DropZone>
        {avatarFile && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-stone-500 truncate max-w-[200px]">{avatarFile.name}</span>
            <button
              onClick={handleSaveAvatar}
              disabled={saving.avatar}
              className="rounded-lg bg-[#000] px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition"
            >
              {saving.avatar ? 'Uploading...' : 'Upload Avatar'}
            </button>
            <button
              onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
              className="text-xs text-stone-400 hover:text-stone-600 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Account Details */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h3 className="font-semibold mb-1">Account Details</h3>
        <p className="text-sm text-stone-500 mb-5">Your display name and username visible across Artisa.</p>
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
              <button type="submit" disabled={saving.user} className="rounded-lg bg-[#000] px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition">
                {saving.user ? 'Saving...' : 'Save Account Details'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Artist Profile */}
      {isApprovedArtist && (
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="font-semibold mb-1">Artist Profile</h3>
          <p className="text-sm text-stone-500 mb-5">Your public artist profile shown to visitors.</p>

          {/* Cover Image */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-2">Cover Image</label>
            <DropZone onDrop={handleCoverDrop} className="rounded-lg border-2 border-dashed border-stone-200 hover:border-stone-300 transition-colors">
              <div className="p-4">
                {displayCover ? (
                  <div className="relative group">
                    <img src={displayCover} alt="" className="h-32 w-full object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Click or drag to replace</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 flex flex-col items-center justify-center text-stone-400">
                    <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs font-medium">Drag & drop or click to upload</p>
                    <p className="text-[10px] text-stone-300 mt-0.5">Recommended: 1920×600px</p>
                  </div>
                )}
                <label className="block mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { if (e.target.files[0]) handleCoverDrop(e.target.files); }}
                  />
                  <span className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors">
                    {displayCover ? 'Change Cover' : 'Choose Cover'}
                  </span>
                </label>
              </div>
            </DropZone>
          </div>

          {/* Bio */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-2">Bio</label>
            <textarea rows={4} value={bio} onChange={(e) => { setBio(e.target.value); setBioDirty(true); }}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              placeholder="Tell visitors about yourself, your artistic style, and your journey..." />
          </div>

          {/* Specialties */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-2">Specialties</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    specialties.includes(s)
                      ? 'bg-[#000] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-400 mt-2">Select all that apply to your work.</p>
          </div>

          {/* Province */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-2">Province</label>
            <select
              value={province}
              onChange={(e) => { setProvince(e.target.value); setProvinceDirty(true); }}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              <option value="">Select your province</option>
              <option value="Koshi">Koshi</option>
              <option value="Madhesh">Madhesh</option>
              <option value="Bagmati">Bagmati</option>
              <option value="Gandaki">Gandaki</option>
              <option value="Lumbini">Lumbini</option>
              <option value="Karnali">Karnali</option>
              <option value="Sudurpashchim">Sudurpashchim</option>
            </select>
            <p className="text-[11px] text-stone-400 mt-1">Used to calculate shipping costs for your buyers.</p>
          </div>

          {/* Social Links */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-2">Social Links</label>
            <div className="space-y-2">
              <input type="url" value={socialLinks.instagram} placeholder="https://instagram.com/yourusername"
                onChange={(e) => { setSocialLinks({ ...socialLinks, instagram: e.target.value }); setSocialDirty(true); }}
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" />
              <input type="url" value={socialLinks.website} placeholder="https://yourwebsite.com"
                onChange={(e) => { setSocialLinks({ ...socialLinks, website: e.target.value }); setSocialDirty(true); }}
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" />
              <input type="url" value={socialLinks.facebook} placeholder="https://facebook.com/yourusername"
                onChange={(e) => { setSocialLinks({ ...socialLinks, facebook: e.target.value }); setSocialDirty(true); }}
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" />
            </div>
          </div>

          {(bioDirty || socialDirty || coverFile || provinceDirty || specialties.length > 0) && (
            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                onClick={handleSaveProfile}
                disabled={saving.profile}
                className="rounded-lg bg-[#000] px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition"
              >
                {saving.profile ? 'Saving...' : 'Save Artist Profile'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Crop Modal */}
      {cropModal && (
        <ImageCropModal
          file={cropModal.file}
          type={cropModal.type}
          aspect={cropModal.aspect}
          onCrop={handleCrop}
          onCancel={() => setCropModal(null)}
        />
      )}
    </div>
  );
};

export default SettingsAccount;
