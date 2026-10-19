import { useState, useEffect, useCallback, Fragment } from 'react';
import authFetch from '../utils/authFetch';
import CustomSelect from '../components/CustomSelect';
import CommissionPill from '../components/CommissionPill';
import { generateStrongPassword } from '../utils/passwordStrength';
import { PROVINCES, getDistrictsForProvince } from '../utils/nepalLocations';
import RichTextEditor from '../components/editor/RichTextEditor';
import RichTextView from '../components/editor/RichTextView';

const roleConfig = {
  admin: { label: 'Admin', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  artist: { label: 'Artist', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  customer: { label: 'Customer', bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400' },
};

const artistStatusColors = {
  approved: { pill: 'bg-emerald-50 text-emerald-700 shadow-sm', dot: 'bg-emerald-500' },
  pending: { pill: 'bg-amber-50 text-amber-700 shadow-sm', dot: 'bg-amber-500' },
  rejected: { pill: 'bg-red-50 text-red-700 shadow-sm', dot: 'bg-red-500' },
  none: { pill: 'bg-stone-100 text-stone-500 shadow-sm', dot: 'bg-stone-400' },
};

const emptyVendorForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  province: '',
  district: '',
  bio: '',
  specialties: [],
  commission_available: false,
  commission_starting_price: '',
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);
  const [vendorErrors, setVendorErrors] = useState({});
  const [vendorError, setVendorError] = useState('');
  const [vendorProcessing, setVendorProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [categories, setCategories] = useState([]);
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (roleFilter) params.set('role', roleFilter);
    authFetch(`/api/admin/users/?${params}`)
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (showAddVendor) {
      fetch('/api/artworks/categories/')
        .then((r) => r.json())
        .then((d) => setCategories(Array.isArray(d) ? d : []))
        .catch(() => setCategories([]));
    } else {
      setSpecialtyOpen(false);
      setShowPassword(false);
    }
  }, [showAddVendor]);

  useEffect(() => {
    if (!toast) { setCountdown(0); return; }
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setToast(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [toast]);

  const showToast = (message) => setToast({ message });

  const fetchDetail = async (userId) => {
    if (expandedId === userId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(userId);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await authFetch(`/api/admin/users/${userId}/`);
      if (!res.ok) throw new Error('Failed to load details');
      const data = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeactivate = (userId, username, isActive) => {
    setConfirmModal({ id: userId, username, isActive });
  };

  const confirmAction = async () => {
    if (!confirmModal) return;
    setProcessing(true);
    const res = await authFetch(`/api/admin/users/${confirmModal.id}/deactivate/`, { method: 'PUT' });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => prev.map((u) =>
        u.id === confirmModal.id ? { ...u, is_active: data.is_active } : u
      ));
      if (detail && detail.id === confirmModal.id) {
        setDetail((prev) => prev ? { ...prev, is_active: data.is_active } : prev);
      }
      showToast(`${confirmModal.username} ${data.is_active ? 'activated' : 'deactivated'}`);
    } else {
      showToast('Failed to update user');
    }
    setProcessing(false);
    setConfirmModal(null);
  };

  const openAddVendor = () => {
    setVendorForm(emptyVendorForm);
    setVendorErrors({});
    setVendorError('');
    setCredentials(null);
    setShowAddVendor(true);
  };

  const closeAddVendor = () => {
    if (vendorProcessing) return;
    setShowAddVendor(false);
    setVendorErrors({});
    setVendorError('');
    setCredentials(null);
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    setVendorErrors({});
    setVendorError('');
    if (vendorForm.password && vendorForm.password.length < 6) {
      setVendorErrors({ password: 'Password must be at least 6 characters.' });
      return;
    }
    setVendorProcessing(true);
    try {
      const body = {
        username: vendorForm.username,
        email: vendorForm.email,
        password: vendorForm.password || '',
        first_name: vendorForm.first_name,
        last_name: vendorForm.last_name,
        province: vendorForm.province,
        district: vendorForm.district,
        bio: vendorForm.bio,
        specialties: vendorForm.specialties,
        commission_available: vendorForm.commission_available,
        commission_starting_price:
          vendorForm.commission_starting_price === '' ? null : vendorForm.commission_starting_price,
      };
      const res = await authFetch('/api/admin/vendors/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const { temporary_password: temporaryPassword, ...newUser } = data;
        setUsers((prev) => [newUser, ...prev]);
        setVendorForm(emptyVendorForm);
        if (temporaryPassword) {
          setCredentials({
            username: newUser.username,
            email: newUser.email,
            password: temporaryPassword,
          });
        } else {
          setShowAddVendor(false);
          showToast(`Vendor created — ${newUser.username} · welcome email sent`);
        }
      } else {
        const fieldErrors = {};
        let nonField = '';
        Object.entries(data || {}).forEach(([key, val]) => {
          if (key === 'non_field_errors' || key === 'detail') {
            nonField = Array.isArray(val) ? val[0] : String(val);
          } else {
            fieldErrors[key] = Array.isArray(val) ? val[0] : String(val);
          }
        });
        if (nonField) setVendorError(nonField);
        if (Object.keys(fieldErrors).length) setVendorErrors(fieldErrors);
        if (!nonField && !Object.keys(fieldErrors).length) {
          setVendorError('Failed to create vendor.');
        }
      }
    } catch {
      setVendorError('Something went wrong.');
    }
    setVendorProcessing(false);
  };

  const getRole = (user) => {
    if (user.role === 'admin') return roleConfig.admin;
    if (user.is_artist) return roleConfig.artist;
    return roleConfig.customer;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const Avatar = ({ user, size = 'md' }) => {
    const sizeClass = size === 'lg' ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-sm';
    return (
      <div className={`${sizeClass} rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-semibold ring-1 ring-stone-200 overflow-hidden shrink-0`}>
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          user.username.charAt(0).toUpperCase()
        )}
      </div>
    );
  };

  const HoverCard = ({ user, role }) => (
    <div className="absolute left-0 top-full mt-2 z-30 w-72 bg-white rounded-xl border border-stone-200 shadow-xl p-4 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-150 pointer-events-none">
      <div className="flex items-center gap-3">
        <Avatar user={user} size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 truncate tracking-tight">{user.username}</p>
          <p className="text-xs text-stone-500 truncate">{user.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${role.bg} ${role.text}`}>
              <span className={`h-1 w-1 rounded-full ${role.dot}`} />
              {role.label}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm ${
              user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              <span className={`h-1 w-1 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100">
        <div>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Joined</p>
          <p className="text-xs text-stone-700 font-medium tabular-nums mt-0.5">{formatDate(user.date_joined)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Artworks</p>
          <p className="text-xs text-stone-700 font-medium tabular-nums mt-0.5">{user.artwork_count}</p>
        </div>
      </div>
      <p className="text-[10px] text-stone-400 mt-2.5 text-center">Click row for full details</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Users</h1>
          <p className="text-sm text-stone-500 mt-1">
            {loading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <button
          onClick={openAddVendor}
          className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
        >
          Add Vendor
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-80 bg-stone-900 text-white rounded-xl shadow-lg overflow-hidden animate-[slideUp_0.2s_ease-out]">
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="text-sm flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-stone-400 hover:text-white transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="h-0.5 bg-stone-700">
            <div
              className="h-full bg-stone-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition"
          />
        </div>
        <CustomSelect
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="All Roles"
          options={[
            { value: '', label: 'All Roles' },
            { value: 'admin', label: 'Admin' },
            { value: 'artist', label: 'Artist' },
            { value: 'customer', label: 'Customer' },
          ]}
          className="w-full sm:w-44"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-200 border-t-stone-900" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-stone-700 tracking-tight">No users found</p>
            <p className="text-xs text-stone-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Artworks</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Joined</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => {
                const role = getRole(user);
                return (
                  <Fragment key={user.id}>
                    <tr
                      onClick={() => fetchDetail(user.id)}
                      className="hover:bg-stone-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="relative group/avatar">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-sm font-semibold ring-1 ring-stone-200 overflow-hidden shrink-0">
                              {user.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                user.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-stone-900 truncate tracking-tight">{user.username}</p>
                              <p className="text-xs text-stone-500 truncate mt-0.5">{user.email}</p>
                            </div>
                          </div>
                          <HoverCard user={user} role={role} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm ${role.bg} ${role.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                          {role.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-stone-700 tabular-nums">{user.artwork_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-stone-500 tabular-nums">{formatDate(user.date_joined)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm ${
                          user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.role !== 'admin' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeactivate(user.id, user.username, user.is_active); }}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                              user.is_active
                                ? 'text-red-600 border-red-200 bg-white hover:bg-red-50'
                                : 'text-emerald-600 border-emerald-200 bg-white hover:bg-emerald-50'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          title={expandedId === user.id ? 'Hide details' : 'Show details'}
                          aria-label={expandedId === user.id ? 'Hide details' : 'Show details'}
                          onClick={(e) => { e.stopPropagation(); fetchDetail(user.id); }}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                        >
                          <svg className={`h-4 w-4 transition-transform ${expandedId === user.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      </td>
                    </tr>

                    {expandedId === user.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-0">
                          <div className="py-4 border-t border-stone-100">
                            {detailLoading ? (
                              <div className="flex items-center justify-center h-24">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-900" />
                              </div>
                            ) : detail ? (
                              <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start gap-4">
                                  <Avatar user={detail} size="lg" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-base font-semibold text-stone-900 tracking-tight">{detail.username}</p>
                                      <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm ${getRole(detail).bg} ${getRole(detail).text}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${getRole(detail).dot}`} />
                                        {getRole(detail).label}
                                      </span>
                                      <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm ${
                                        detail.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                      }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${detail.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {detail.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-stone-500 mt-0.5">{detail.email}</p>
                                    {(detail.first_name || detail.last_name) && (
                                      <p className="text-xs text-stone-400 mt-0.5">{detail.first_name} {detail.last_name}</p>
                                    )}
                                  </div>
                                </div>

                                {/* Account + stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {[
                                    { label: 'Joined', value: formatDate(detail.date_joined) },
                                    { label: 'Artworks', value: detail.artwork_stats?.total ?? detail.artwork_count },
                                    { label: 'Orders', value: detail.order_count },
                                    { label: 'Sold', value: detail.sold_count },
                                  ].map((s) => (
                                    <div key={s.label} className="rounded-lg bg-stone-50 border border-stone-100 px-3 py-2.5">
                                      <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">{s.label}</p>
                                      <p className="text-sm font-semibold text-stone-900 tabular-nums mt-0.5">{s.value}</p>
                                    </div>
                                  ))}
                                </div>

                                {/* Artist profile */}
                                {detail.artist_profile && (
                                  <div className="rounded-xl border border-stone-200 p-4 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Artist Profile</h4>
                                      {(() => {
                                        const sc = artistStatusColors[detail.artist_profile.status] || artistStatusColors.none;
                                        return (
                                          <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${sc.pill}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                            {detail.artist_profile.status}
                                          </span>
                                        );
                                      })()}
                                      {detail.artist_profile.verified_badge && (
                                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-700 shadow-sm">
                                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                          Verified
                                        </span>
                                      )}
                                      {detail.artist_profile.commission_available && (
                                        <CommissionPill
                                          price={detail.artist_profile.commission_starting_price}
                                          estimatedDays={detail.artist_profile.commission_estimated_days}
                                        />
                                      )}
                                    </div>

                                    {detail.artist_profile.bio && (
                                      <RichTextView html={detail.artist_profile.bio} className="text-stone-600" />
                                    )}

                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                                      {detail.artist_profile.province && (
                                        <span className="text-stone-500"><span className="font-semibold text-stone-700">Province:</span> {detail.artist_profile.province}</span>
                                      )}
                                      {detail.artist_profile.district && (
                                        <span className="text-stone-500"><span className="font-semibold text-stone-700">District:</span> {detail.artist_profile.district}</span>
                                      )}
                                      {detail.artist_profile.commission_starting_price != null && (
                                        <span className="text-stone-500"><span className="font-semibold text-stone-700">From:</span> NPR {Number(detail.artist_profile.commission_starting_price).toLocaleString()}</span>
                                      )}
                                      <span className="text-stone-500"><span className="font-semibold text-stone-700">Since:</span> {formatDate(detail.artist_profile.created_at)}</span>
                                    </div>

                                    {detail.artist_profile.specialties?.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Specialties</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {detail.artist_profile.specialties.map((s) => (
                                            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-medium">
                                              {s}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {Object.keys(detail.artist_profile.social_links || {}).length > 0 && (
                                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        {Object.entries(detail.artist_profile.social_links).map(([platform, url]) => url && (
                                          <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-stone-700 hover:text-stone-900">
                                            <span className="font-medium capitalize">{platform}</span>
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Artwork stats */}
                                {detail.artwork_stats?.total > 0 && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Artworks</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {[
                                        { key: 'published', label: 'Published', bg: 'bg-emerald-50 text-emerald-700' },
                                        { key: 'pending_review', label: 'Pending', bg: 'bg-amber-50 text-amber-700' },
                                        { key: 'draft', label: 'Draft', bg: 'bg-stone-100 text-stone-600' },
                                        { key: 'removed', label: 'Removed', bg: 'bg-red-50 text-red-700' },
                                      ].filter((s) => detail.artwork_stats[s.key] > 0).map((s) => (
                                        <span key={s.key} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${s.bg}`}>
                                          {s.label}: <strong className="tabular-nums">{detail.artwork_stats[s.key]}</strong>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Recent artworks */}
                                {detail.recent_artworks?.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Recent Artworks</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                      {detail.recent_artworks.map((art) => (
                                        <div key={art.id} className="group/art rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                                          <div className="aspect-square bg-stone-100 overflow-hidden">
                                            {art.primary_image ? (
                                              <img src={art.primary_image} alt={art.title} className="w-full h-full object-cover group-hover/art:scale-105 transition-transform duration-500" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-stone-300">
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
                                                </svg>
                                              </div>
                                            )}
                                          </div>
                                          <div className="p-1.5">
                                            <p className="text-[10px] font-medium text-stone-700 truncate">{art.title}</p>
                                            <p className="text-[10px] text-stone-400 tabular-nums">NPR {Number(art.price).toLocaleString()}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-stone-500 py-4 text-center">Could not load user details.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !processing && setConfirmModal(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-stone-900 tracking-tight">
              {confirmModal.isActive ? 'Deactivate User' : 'Activate User'}
            </h3>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              Are you sure you want to <span className={`font-semibold ${confirmModal.isActive ? 'text-red-600' : 'text-emerald-600'}`}>{confirmModal.isActive ? 'deactivate' : 'activate'}</span>{' '}
              <span className="font-semibold text-stone-900">{confirmModal.username}</span>?
              {confirmModal.isActive && (
                <span className="block mt-1 text-stone-500">They will no longer be able to log in or access their account.</span>
              )}
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={processing}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${
                  confirmModal.isActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {processing ? 'Processing...' : (confirmModal.isActive ? 'Deactivate' : 'Activate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeAddVendor}>
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-stone-100">
              <h3 className="text-base font-semibold text-stone-900 tracking-tight">Add Vendor</h3>
              <p className="text-xs text-stone-500 mt-1">Create an approved artist/vendor account with a welcome email</p>
            </div>

            {credentials ? (
              <div className="p-6 space-y-4">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                  Vendor created. Share these credentials once — the password is shown only now.
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2">
                    <span className="text-stone-500 font-medium">Username</span>
                    <span className="font-semibold text-stone-900 select-all">{credentials.username}</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2">
                    <span className="text-stone-500 font-medium">Email</span>
                    <span className="font-semibold text-stone-900 select-all truncate">{credentials.email}</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2">
                    <span className="text-stone-500 font-medium">Password</span>
                    <span className="font-mono font-semibold text-stone-900 select-all">{credentials.password}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `Username: ${credentials.username}\nEmail: ${credentials.email}\nPassword: ${credentials.password}`
                      );
                      showToast('Credentials copied');
                    }}
                    className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const username = credentials.username;
                      setCredentials(null);
                      setShowAddVendor(false);
                      showToast(`Vendor created — ${username} · welcome email sent`);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateVendor} className="p-6 space-y-5">
                {vendorError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{vendorError}</div>
                )}

                {/* Account */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Account</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">First Name</label>
                      <input
                        type="text"
                        value={vendorForm.first_name}
                        onChange={(e) => setVendorForm(f => ({ ...f, first_name: e.target.value }))}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Last Name</label>
                      <input
                        type="text"
                        value={vendorForm.last_name}
                        onChange={(e) => setVendorForm(f => ({ ...f, last_name: e.target.value }))}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Username *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.username}
                      onChange={(e) => setVendorForm(f => ({ ...f, username: e.target.value }))}
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 transition ${
                        vendorErrors.username
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                          : 'border-stone-200 focus:border-stone-400 focus:ring-stone-400'
                      }`}
                    />
                    {vendorErrors.username && <p className="text-xs text-red-600 mt-1">{vendorErrors.username}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Email *</label>
                    <input
                      type="email"
                      required
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm(f => ({ ...f, email: e.target.value }))}
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 transition ${
                        vendorErrors.email
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                          : 'border-stone-200 focus:border-stone-400 focus:ring-stone-400'
                      }`}
                    />
                    {vendorErrors.email && <p className="text-xs text-red-600 mt-1">{vendorErrors.email}</p>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Password</label>
                      <button
                        type="button"
                        onClick={() => setVendorForm(f => ({ ...f, password: generateStrongPassword() }))}
                        className="text-xs font-medium text-stone-600 hover:text-stone-900 underline underline-offset-2"
                      >
                        Generate strong
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={vendorForm.password}
                        onChange={(e) => setVendorForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Leave blank to auto-generate"
                        className={`w-full rounded-lg border bg-white pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 transition ${
                          vendorErrors.password
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                            : 'border-stone-200 focus:border-stone-400 focus:ring-stone-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                      >
                        {showPassword ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {!vendorForm.password && (
                      <p className="text-xs text-stone-400 mt-1">Minimum 6 characters, or leave blank to auto-generate</p>
                    )}
                    {vendorErrors.password && <p className="text-xs text-red-600 mt-1">{vendorErrors.password}</p>}
                  </div>
                </div>

                {/* Vendor profile */}
                <div className="space-y-3 pt-1 border-t border-stone-100">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider pt-3">Vendor Profile</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Province</label>
                      <CustomSelect
                        value={vendorForm.province}
                        onChange={(value) => setVendorForm(f => ({
                          ...f,
                          province: value,
                          district: '',
                        }))}
                        placeholder="Select province"
                        options={PROVINCES.map((p) => ({ value: p, label: p }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">District</label>
                      <CustomSelect
                        value={vendorForm.district}
                        onChange={(value) => setVendorForm(f => ({ ...f, district: value }))}
                        disabled={!vendorForm.province}
                        placeholder={vendorForm.province ? 'Select district' : 'Select province first'}
                        options={getDistrictsForProvince(vendorForm.province).map((d) => ({ value: d, label: d }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Specialties</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSpecialtyOpen(o => !o)}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-left focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 flex items-center justify-between gap-2"
                      >
                        <span className={`truncate ${vendorForm.specialties.length ? 'text-stone-900' : 'text-stone-400'}`}>
                          {vendorForm.specialties.length
                            ? `${vendorForm.specialties.length} selected`
                            : 'Pick categories'}
                        </span>
                        <svg className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${specialtyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      {specialtyOpen && (
                        <div className="absolute z-20 mt-1 w-full max-h-44 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-xl p-2">
                          {categories.length === 0 ? (
                            <p className="text-xs text-stone-400 px-2 py-2">No categories available</p>
                          ) : categories.map((cat) => {
                            const active = vendorForm.specialties.includes(cat.name);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setVendorForm(f => ({
                                  ...f,
                                  specialties: active
                                    ? f.specialties.filter(s => s !== cat.name)
                                    : [...f.specialties, cat.name],
                                }))}
                                className={`w-full text-left text-sm px-2.5 py-1.5 rounded-md transition-colors ${
                                  active ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50/60'
                                }`}
                              >
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {vendorForm.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {vendorForm.specialties.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-medium">
                            {s}
                            <button
                              type="button"
                              onClick={() => setVendorForm(f => ({ ...f, specialties: f.specialties.filter(x => x !== s) }))}
                              className="text-stone-400 hover:text-stone-700"
                              title={`Remove ${s}`}
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Bio</label>
                    <RichTextEditor
                      value={vendorForm.bio}
                      onChange={(html) => setVendorForm(f => ({ ...f, bio: html }))}
                      placeholder="Short introduction for this vendor..."
                    />
                    {vendorErrors.bio && <p className="text-xs text-red-600 mt-1">{vendorErrors.bio}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-stone-800">Commissions open</p>
                      <p className="text-xs text-stone-400 mt-0.5">Allow commission requests for this vendor</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={vendorForm.commission_available}
                      onClick={() => setVendorForm(f => ({ ...f, commission_available: !f.commission_available }))}
                      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
                        vendorForm.commission_available ? 'bg-stone-900' : 'bg-stone-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        vendorForm.commission_available ? 'translate-x-4' : ''
                      }`} />
                    </button>
                  </div>
                  {vendorForm.commission_available && (
                    <div>
                      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Starting price (NPR)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vendorForm.commission_starting_price}
                        onChange={(e) => setVendorForm(f => ({ ...f, commission_starting_price: e.target.value }))}
                        placeholder="e.g. 2500"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                      {vendorErrors.commission_starting_price && (
                        <p className="text-xs text-red-600 mt-1">{vendorErrors.commission_starting_price}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={closeAddVendor}
                    disabled={vendorProcessing}
className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={vendorProcessing}
                    className="px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition disabled:opacity-50"
                  >
                    {vendorProcessing ? 'Creating...' : 'Create Vendor'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
