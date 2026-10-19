import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/password-reset/`, { email });
      setSent(true);
      setDevLink(res.data.reset_link || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-stone-200 p-10 page-enter">
          <h1 className="text-3xl font-bold text-center mb-2 text-stone-900 font-heading">Forgot password?</h1>
          <p className="text-stone-500 text-center mb-8">
            Enter your account email and we'll send you a reset link
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {sent ? (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 text-sm">
                If an account exists for <span className="font-medium">{email}</span>, a reset
                link has been sent. Check your inbox (and spam).
              </div>
              {devLink && (
                <a
                  href={devLink}
                  className="inline-block text-sm font-medium text-[#9c4327] hover:text-[#7a3520] transition"
                >
                  Dev shortcut: open reset link →
                </a>
              )}
              <div>
                <Link to="/login" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition">
                  ← Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                  className="peer w-full px-0 pt-5 pb-2 bg-transparent border-b-2 border-stone-200 text-sm text-stone-900 placeholder-transparent focus:outline-none focus:border-stone-900 transition-colors"
                />
                <label
                  htmlFor="reset-email"
                  className="absolute left-0 top-3.5 text-sm text-stone-400 transition-all duration-200 pointer-events-none
                    peer-focus:-top-0.5 peer-focus:text-xs peer-focus:text-stone-500
                    peer-[:not(:placeholder-shown)]:-top-0.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-stone-500"
                >
                  Email
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#000] text-white py-3 rounded-lg font-semibold hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending link...' : 'Send reset link →'}
              </button>
            </form>
          )}

          {!sent && (
            <p className="text-center text-sm text-stone-500 mt-6">
              Remembered it?{' '}
              <Link to="/login" className="font-medium text-[#9c4327] hover:text-[#7a3520] transition">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
