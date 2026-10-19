import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/password-reset-confirm/`, {
        uid,
        token,
        new_password: password,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset link is invalid or has expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-stone-200 p-10 page-enter">
          <h1 className="text-3xl font-bold text-center mb-2 text-stone-900 font-heading">Set new password</h1>
          <p className="text-stone-500 text-center mb-8">Choose a new password for your Artisa account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {done ? (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 text-sm">
                Your password has been reset. You can sign in with it now.
              </div>
              <Link
                to="/login"
                className="inline-block w-full bg-[#000] text-white py-3 rounded-lg font-semibold hover:bg-stone-800 transition"
              >
                Sign in →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <input
                  type="password"
                  id="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  required
                  className="peer w-full px-0 pt-5 pb-2 bg-transparent border-b-2 border-stone-200 text-sm text-stone-900 placeholder-transparent focus:outline-none focus:border-stone-900 transition-colors"
                />
                <label
                  htmlFor="new-password"
                  className="absolute left-0 top-3.5 text-sm text-stone-400 transition-all duration-200 pointer-events-none
                    peer-focus:-top-0.5 peer-focus:text-xs peer-focus:text-stone-500
                    peer-[:not(:placeholder-shown)]:-top-0.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-stone-500"
                >
                  New password
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  id="confirm-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder=" "
                  required
                  className="peer w-full px-0 pt-5 pb-2 bg-transparent border-b-2 border-stone-200 text-sm text-stone-900 placeholder-transparent focus:outline-none focus:border-stone-900 transition-colors"
                />
                <label
                  htmlFor="confirm-password"
                  className="absolute left-0 top-3.5 text-sm text-stone-400 transition-all duration-200 pointer-events-none
                    peer-focus:-top-0.5 peer-focus:text-xs peer-focus:text-stone-500
                    peer-[:not(:placeholder-shown)]:-top-0.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-stone-500"
                >
                  Confirm password
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#000] text-white py-3 rounded-lg font-semibold hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset password →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
