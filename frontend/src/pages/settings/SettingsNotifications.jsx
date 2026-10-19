import { useEffect, useState } from 'react';
import { useToast } from '../../components/Toast';
import authFetch from '../../utils/authFetch';

const FIELD_MAP = {
  emailCommissionUpdates: 'email_commission_updates',
  emailOrderUpdates: 'email_order_updates',
  emailApplicationUpdates: 'email_application_updates',
  pushNewMessages: 'push_new_messages',
};

const SettingsNotifications = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    emailCommissionUpdates: true,
    emailOrderUpdates: true,
    emailApplicationUpdates: true,
    pushNewMessages: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/auth/me/');
        if (res.ok) {
          const d = await res.json();
          if (!cancelled) {
            setSettings({
              emailCommissionUpdates: d.email_commission_updates ?? true,
              emailOrderUpdates: d.email_order_updates ?? true,
              emailApplicationUpdates: d.email_application_updates ?? true,
              pushNewMessages: d.push_new_messages ?? true,
            });
          }
        }
      } catch { /* keep defaults */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const save = async (key, value) => {
    const prev = settings;
    setSettings({ ...settings, [key]: value });
    try {
      const res = await authFetch('/api/auth/me/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [FIELD_MAP[key]]: value }),
      });
      if (res.ok) {
        addToast('Settings saved', 'success');
      } else {
        setSettings(prev);
        addToast('Could not save settings', 'error');
      }
    } catch {
      setSettings(prev);
      addToast('Could not save settings', 'error');
    }
  };

  const handleToggle = (key) => {
    save(key, !settings[key]);
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
              aria-pressed={settings[item.key]}
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
        { key: 'emailCommissionUpdates', label: 'Commission updates', desc: 'Requests, acceptances, deliveries, cancellations' },
        { key: 'emailOrderUpdates', label: 'Order updates', desc: 'Confirmations, payments, shipping, delivery' },
        { key: 'emailApplicationUpdates', label: 'Artist application updates', desc: 'Approval or rejection of your application' },
      ]} />

      <Section title="Push Notifications" items={[
        { key: 'pushNewMessages', label: 'New messages', desc: 'Desktop alert when a message arrives while the tab is hidden' },
      ]} />
    </div>
  );
};

export default SettingsNotifications;
