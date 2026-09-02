import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const EyeIcon = ({ visible }) => (
  visible ? (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
);

const UnderlineInput = ({ label, id, name, type = 'text', value, onChange, required, endIcon, onEndIconClick }) => (
  <div className="relative">
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder=" "
      className={`peer w-full px-0 pt-5 pb-2 bg-transparent border-b-2 border-stone-200 text-sm text-stone-900 placeholder-transparent focus:outline-none focus:border-stone-900 transition-colors ${endIcon ? 'pr-10' : ''}`}
      required={required}
    />
    <label
      htmlFor={id}
      className="absolute left-0 top-3.5 text-sm text-stone-400 transition-all duration-200 pointer-events-none
        peer-focus:-top-0.5 peer-focus:text-xs peer-focus:text-stone-500
        peer-[:not(:placeholder-shown)]:-top-0.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-stone-500"
    >
      {label}
    </label>
    {endIcon && (
      <button
        type="button"
        onClick={onEndIconClick}
        className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
        tabIndex={-1}
      >
        {endIcon}
      </button>
    )}
  </div>
);

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
    setLoading(true);

    localStorage.setItem('rememberMe', rememberMe);

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate(result.user?.role === 'admin' ? '/admin' : '/');
    } else {
      setError(result.error.detail || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-stone-200 p-10 page-enter">
          <h1 className="text-3xl font-bold text-center mb-2 text-stone-900 font-heading">Welcome back</h1>
          <p className="text-stone-500 text-center mb-8">Sign in to your Artisa account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <UnderlineInput
              label="Email or username"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <UnderlineInput
              label="Password"
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              endIcon={<EyeIcon visible={showPassword} />}
              onEndIconClick={() => setShowPassword(!showPassword)}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-stone-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-[#9c4327] hover:text-[#7a3520] transition">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#000] text-white py-3 rounded-lg font-semibold hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#9c4327] hover:text-[#7a3520]">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
