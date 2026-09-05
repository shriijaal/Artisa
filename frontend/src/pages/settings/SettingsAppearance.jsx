import { useState } from 'react';
import { useToast } from '../../components/Toast';

const SettingsAppearance = () => {
  const { addToast } = useToast();
  const [theme, setTheme] = useState(() => localStorage.getItem('artisa-theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('artisa-language') || 'en');

  const handleTheme = (t) => {
    setTheme(t);
    localStorage.setItem('artisa-theme', t);
    addToast(`Theme set to ${t}`, 'success');
  };

  const handleLanguage = (l) => {
    setLanguage(l);
    localStorage.setItem('artisa-language', l);
    addToast('Language preference saved', 'success');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Appearance & Language</h1>
      <p className="text-sm text-stone-500 mb-8">Customize how Artisa looks and feels.</p>

      {/* Theme */}
      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h3 className="font-semibold mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Light', desc: 'Bright and clean', bg: 'bg-white border-2', ring: 'ring-stone-900' },
            { value: 'dark', label: 'Dark', desc: 'Easy on the eyes', bg: 'bg-stone-900 border-2', ring: 'ring-stone-900' },
            { value: 'system', label: 'System', desc: 'Match your OS', bg: 'bg-gradient-to-br from-white to-stone-800 border-2', ring: 'ring-stone-900' },
          ].map((opt) => (
            <button key={opt.value} onClick={() => handleTheme(opt.value)}
              className={`p-4 rounded-lg border-2 text-left transition ${theme === opt.value ? 'border-stone-900 ring-2 ring-stone-900/10' : 'border-stone-200 hover:border-stone-300'}`}>
              <div className={`h-12 w-full rounded ${opt.bg} mb-3`} />
              <p className="text-sm font-medium text-stone-900">{opt.label}</p>
              <p className="text-xs text-stone-500">{opt.desc}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-3">Dark mode coming soon. Currently locked to light theme.</p>
      </div>

      {/* Language */}
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h3 className="font-semibold mb-4">Language</h3>
        <div className="space-y-2">
          {[
            { value: 'en', label: 'English', native: 'English' },
            { value: 'ne', label: 'Nepali', native: 'नेपाली' },
          ].map((opt) => (
            <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${language === opt.value ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:bg-stone-50'}`}>
              <input type="radio" name="lang" value={opt.value} checked={language === opt.value}
                onChange={() => handleLanguage(opt.value)} className="text-stone-900 focus:ring-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-900">{opt.label}</p>
                <p className="text-xs text-stone-500">{opt.native}</p>
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-3">Nepali translation coming soon.</p>
      </div>
    </div>
  );
};

export default SettingsAppearance;
