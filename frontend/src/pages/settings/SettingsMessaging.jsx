import { useState } from 'react';
import { useToast } from '../../components/Toast';

const SettingsMessaging = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    allowInquiries: 'everyone',
    readReceipts: true,
    typingIndicators: true,
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    addToast('Settings saved', 'success');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Messaging</h1>
      <p className="text-sm text-stone-500 mb-8">Control who can contact you and messaging features.</p>

      {/* Who can message */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h3 className="font-semibold mb-4">Who Can Send Inquiries</h3>
        <div className="space-y-3">
          {[
            { value: 'everyone', label: 'Everyone', desc: 'Any user can send you artwork inquiries' },
            { value: 'artists', label: 'Artists Only', desc: 'Only verified artists can contact you' },
            { value: 'nobody', label: 'Nobody', desc: 'Disable incoming inquiries' },
          ].map((opt) => (
            <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${settings.allowInquiries === opt.value ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:bg-stone-50'}`}>
              <input type="radio" name="inquiries" value={opt.value} checked={settings.allowInquiries === opt.value}
                onChange={() => { setSettings({ ...settings, allowInquiries: opt.value }); addToast('Settings saved', 'success'); }}
                className="text-stone-900 focus:ring-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-900">{opt.label}</p>
                <p className="text-xs text-stone-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Messaging Features */}
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="font-semibold mb-4">Messaging Features</h3>
        <div className="space-y-4">
          {[
            { key: 'readReceipts', label: 'Read receipts', desc: 'Show when you\'ve read a message' },
            { key: 'typingIndicators', label: 'Typing indicators', desc: 'Show when you\'re typing a message' },
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
    </div>
  );
};

export default SettingsMessaging;
