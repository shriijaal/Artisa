import { useState, useEffect, useCallback } from 'react';
import authFetch from '../utils/authFetch';

const roleConfig = {
  admin: { label: 'Admin', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  artist: { label: 'Artist', bg: 'bg-[#fc8d6b]/10', text: 'text-[#9c4327]', dot: 'bg-[#9c4327]' },
  customer: { label: 'Customer', bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400' },
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

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

  const handleDeactivate = async (userId) => {
    const res = await authFetch(`/api/admin/users/${userId}/deactivate/`, { method: 'PUT' });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, is_active: data.is_active } : u
      ));
    }
  };

  const getRole = (user) => {
    if (user.role === 'admin') return roleConfig.admin;
    if (user.is_artist) return roleConfig.artist;
    return roleConfig.customer;
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight font-heading">Users</h1>
          <p className="text-sm text-stone-500 mt-1">
            {loading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

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
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23747878' stroke-width='1.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem', paddingRight: '2.5rem' }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="artist">Artist</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-200 border-t-stone-900" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-sm text-stone-500">No users found</p>
            <p className="text-xs text-stone-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-[0.05em]">User</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-[0.05em]">Role</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-[0.05em]">Artworks</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-[0.05em]">Joined</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-[0.05em]">Status</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-[0.05em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => {
                const role = getRole(user);
                return (
                  <tr key={user.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-sm font-semibold ring-1 ring-stone-200 overflow-hidden flex-shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">{user.username}</p>
                          <p className="text-xs text-stone-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${role.bg} ${role.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${role.dot}`} />
                        {role.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-700 tabular-nums">{user.artwork_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-stone-500">{formatDate(user.date_joined)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                        user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                            user.is_active
                              ? 'text-red-700 bg-red-50 hover:bg-red-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
