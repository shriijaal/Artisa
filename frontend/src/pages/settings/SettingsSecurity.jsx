import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';

const SettingsSecurity = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (passwords.new.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/auth/change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: passwords.current, new_password: passwords.new }),
      });
      if (res.ok) {
        setPasswords({ current: '', new: '', confirm: '' });
        addToast('Password changed successfully!', 'success');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to change password', 'error');
      }
    } catch { addToast('Network error', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Password & Security</h1>
      <p className="text-sm text-stone-500 mb-8">Manage your password and security preferences.</p>

      {/* Change Password */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h3 className="font-semibold mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Current Password</label>
            <input type={showPasswords ? 'text' : 'password'} value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">New Password</label>
            <input type={showPasswords ? 'text' : 'password'} value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" required minLength={8} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Confirm New Password</label>
            <input type={showPasswords ? 'text' : 'password'} value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400" required minLength={8} />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
              <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)}
                className="rounded border-stone-300 text-stone-900 focus:ring-stone-400" />
              Show passwords
            </label>
            <button type="submit" disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
              className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition">
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-stone-500 mt-1">Add an extra layer of security to your account.</p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">Coming Soon</span>
        </div>
        <div className="mt-4 rounded-lg bg-stone-50 p-4 text-sm text-stone-500">
          Two-factor authentication will be available soon. You'll be able to use an authenticator app or SMS to verify your identity.
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="font-semibold mb-4">Active Sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.406A2.25 2.25 0 012.25 5.498V5.25" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">Current Session</p>
                <p className="text-xs text-stone-500">This device · Active now</p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">Active</span>
          </div>
        </div>
        <p className="text-xs text-stone-400 mt-3">Session management will be fully available soon.</p>
      </div>
    </div>
  );
};

export default SettingsSecurity;
