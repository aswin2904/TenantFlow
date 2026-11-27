import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Layers } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@tenantflow.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register, fetchProfile } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      await fetchProfile();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-600 rounded-xl">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TenantFlow</h1>
            <p className="text-xs text-slate-400">Multi-Tenant SaaS Workspace</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-1">
          {isLogin ? 'Sign in to your workspace' : 'Create a new account'}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {isLogin ? 'Enter your credentials to access your organizations.' : 'Start collaborating across isolated tenants.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aswin R"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tenantflow.com"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-medium text-sm transition cursor-pointer"
          >
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {isLogin && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-2">Quick Demo Role Switch (Password: password123):</p>
            <div className="flex gap-2">
              {[
                { label: 'Admin', mail: 'admin@tenantflow.com' },
                { label: 'Developer', mail: 'dev@tenantflow.com' },
                { label: 'Viewer', mail: 'viewer@tenantflow.com' },
              ].map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => {
                    setEmail(demo.mail);
                    setPassword('password123');
                  }}
                  className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:underline font-medium cursor-pointer"
          >
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
