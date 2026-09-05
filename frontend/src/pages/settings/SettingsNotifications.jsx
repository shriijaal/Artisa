import { useState } from 'react';
import { useToast } from '../../components/Toast';

const SettingsNotifications = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    emailOrderUpdates: true,
    emailNewMessages: true,
    emailPromotional: false,
    emailArtistUpdates: true,
    pushOrderUpdates: true,
    pushNewMessages: true,
    pushPromotional: false,
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    addToast('Notification preferences saved', 'success');
  };

  const Section = ({ title, items }) => (
    <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {items.map((item) => (
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
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Notifications</h1>
      <p className="text-sm text-stone-500 mb-8">Choose what notifications you receive and how.</p>

      <Section title="Email Notifications" items={[
        { key: 'emailOrderUpdates', label: 'Order updates', desc: 'Shipping status, delivery confirmations' },
        { key: 'emailNewMessages', label: 'New messages', desc: 'When someone sends you a message' },
        { key: 'emailArtistUpdates', label: 'Artist updates', desc: 'Application status, earnings notifications' },
        { key: 'emailPromotional', label: 'Promotional emails', desc: 'New features, marketplace highlights' },
      ]} />

      <Section title="Push Notifications" items={[
        { key: 'pushOrderUpdates', label: 'Order updates', desc: 'Real-time order status changes' },
        { key: 'pushNewMessages', label: 'New messages', desc: 'Instant message notifications' },
        { key: 'pushPromotional', label: 'Promotional notifications', desc: 'Recommendations and announcements' },
      ]} />
    </div>
  );
};

export default SettingsNotifications;
