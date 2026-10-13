import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, AlertCircle, ArrowRight, Lock, Mail, ExternalLink, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(searchParams.get('oauth_error'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // OAuth missing config modal state
  const [oauthModal, setOauthModal] = useState<{
    provider: 'Google' | 'Facebook';
    details: any;
  } | null>(null);

  const [copiedUri, setCopiedUri] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setError(null);
    try {
      const res = provider === 'google'
        ? await apiClient.initiateGoogleOAuth()
        : await apiClient.initiateFacebookOAuth();

      if (res.configured && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.details) {
        setOauthModal({
          provider: provider === 'google' ? 'Google' : 'Facebook',
          details: data.details,
        });
      } else {
        setError(data?.error?.message || `Failed to initiate ${provider} login.`);
      }
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@nexusworkflow.ai');
    setPassword('NexusDemo2026!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white tracking-wider text-lg">
            NEXUS <span className="text-brand-400 font-medium">WORKFLOW</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-100">Sign in to your workspace</h2>
        <p className="mt-1 text-xs text-slate-400">
          Autonomous multi-agent orchestration with human governance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-xl border border-slate-800 sm:rounded-2xl sm:px-10 space-y-6">
          {/* Demo User Fast Fill Banner */}
          <div className="bg-brand-950/40 border border-brand-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-brand-300 font-semibold block">Quick Evaluator Login</span>
              <span className="text-slate-400 text-[11px]">Demo account pre-seeded with sample workflows</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition-colors"
            >
              Fill Demo
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-950/40 border border-rose-900 p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300">Email Address</label>
              <div className="mt-1 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Social Logins */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-slate-800 rounded-lg bg-slate-950 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('facebook')}
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-slate-800 rounded-lg bg-slate-950 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-current text-blue-500" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          <div className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
              Create a workspace
            </Link>
          </div>
        </div>
      </div>

      {/* Honest OAuth Missing Configuration Modal */}
      {oauthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {oauthModal.provider} OAuth Not Configured
                  </h3>
                  <p className="text-xs text-slate-400">
                    Credentials required in backend environment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOauthModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Per production security requirements, {oauthModal.provider} Single Sign-On requires valid developer credentials in <code className="text-brand-400">backend/.env</code>. The application never simulates fake authentication states.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-300">Required Environment Variables:</div>
              <ul className="list-disc list-inside text-slate-400 space-y-1 font-mono text-[11px]">
                {oauthModal.details.missingEnv.map((envVar: string) => (
                  <li key={envVar} className="text-amber-400">{envVar}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-400">
                Authorized Redirect URI to register in Developer Console:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={oauthModal.details.callbackUrl}
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(oauthModal.details.callbackUrl);
                    setCopiedUri(true);
                    setTimeout(() => setCopiedUri(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUri ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <a
                href={oauthModal.details.setupGuideUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>Open {oauthModal.provider} Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setOauthModal(null)}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
