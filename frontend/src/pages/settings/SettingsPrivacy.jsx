import { useState } from 'react';
import { useToast } from '../../components/Toast';

const SettingsPrivacy = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    profilePublic: true,
    showPurchases: false,
    showFavorites: true,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    addToast('Settings saved', 'success');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Data & Privacy</h1>
      <p className="text-sm text-stone-500 mb-8">Control your data and privacy preferences.</p>

      {/* Profile Visibility */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h3 className="font-semibold mb-4">Profile Visibility</h3>
        <div className="space-y-4">
          {[
            { key: 'profilePublic', label: 'Public profile', desc: 'Allow others to view your profile page' },
            { key: 'showPurchases', label: 'Show purchase history', desc: 'Display your purchases on your profile' },
            { key: 'showFavorites', label: 'Show favorites', desc: 'Display your favorited artworks on your profile' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-900">{item.label}</p>
                <p className="text-xs text-stone-500">{item.desc}</p>
              </div>
              <button onClick={() => handleToggle(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[item.key] ? 'bg-stone-900' : 'bg-stone-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Download Data */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h3 className="font-semibold mb-2">Download Your Data</h3>
        <p className="text-sm text-stone-500 mb-4">Request a copy of all your data stored on Artisa.</p>
        <button onClick={() => addToast('Data export will be emailed to you shortly.', 'success')}
          className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition">
          Request Data Export
        </button>
      </div>

      {/* Delete Account */}
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-6">
        <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
        <p className="text-sm text-red-700 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button onClick={() => setShowDeleteModal(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition">
          Delete Account
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-stone-900 mb-2">Delete Account</h3>
            <p className="text-sm text-stone-600 mb-4">This will permanently delete your account, profile, artworks, orders, and all associated data.</p>
            <p className="text-sm text-stone-700 mb-2">Type <span className="font-mono font-bold">DELETE</span> to confirm:</p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm mb-4 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400" placeholder="DELETE" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-lg transition">Cancel</button>
              <button disabled={deleteConfirm !== 'DELETE'}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPrivacy;
