import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const result = await register({
      username: formData.username,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      password: formData.password,
      password_confirm: formData.password_confirm
    });

    if (result.success) {
      navigate('/login');
    } else {
      setError(result.error.detail || 'Registration failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-200 p-10 page-enter">
          <h1 className="text-3xl font-bold text-center mb-2 text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>Create an account</h1>
          <p className="text-stone-500 text-center mb-6">Join Artisa today</p>

          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-6">
            <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-800 leading-relaxed">
              You&apos;ll start as a <span className="font-semibold">Collector</span> — able to browse, purchase artworks, and request <span className="font-semibold">Commissions</span> from artists. Once registered, you can apply to become a <span className="font-semibold">Verified Artist</span> to list, sell your own work, and accept commissions.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-stone-700 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 bg-white rounded-lg text-sm focus:ring-1 focus:ring-stone-400 focus:border-stone-400 outline-none transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-stone-700 mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 bg-white rounded-lg text-sm focus:ring-1 focus:ring-stone-400 focus:border-stone-400 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-stone-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 bg-white rounded-lg text-sm focus:ring-1 focus:ring-stone-400 focus:border-stone-400 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 bg-white rounded-lg text-sm focus:ring-1 focus:ring-stone-400 focus:border-stone-400 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 bg-white rounded-lg text-sm focus:ring-1 focus:ring-stone-400 focus:border-stone-400 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-stone-700 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                id="password_confirm"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-stone-200 bg-white rounded-lg text-sm focus:ring-1 focus:ring-stone-400 focus:border-stone-400 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-amber-600 hover:text-amber-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
