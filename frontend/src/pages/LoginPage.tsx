import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  KeyRound,
  Building2,
  LogIn,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

type AuthMode = 'signin' | 'join' | 'create';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode: AuthMode =
    (searchParams.get('mode') as AuthMode) ||
    (searchParams.get('code') || searchParams.get('join') ? 'join' : 'signin');

  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>(
    searchParams.get('code') || searchParams.get('join') || ''
  );
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

    if (authMode === 'join' && !joinCode.trim()) {
      setError('Please enter a workspace invite code (e.g. NX-DEMO-2026).');
      return;
    }
    if (authMode === 'create' && !workspaceName.trim()) {
      setError('Please provide a name for your workspace.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password, {
        workspaceAction: authMode,
        name: name.trim() || undefined,
        workspaceName: authMode === 'create' ? workspaceName.trim() : undefined,
        joinCode: authMode === 'join' ? joinCode.trim().toUpperCase() : undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Authentication failed. Please check your credentials or join code.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setError(null);
    try {
      const res =
        provider === 'google'
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
    setAuthMode('signin');
    setEmail('demo@nexusworkflow.ai');
    setPassword('NexusDemo2026!');
  };

  const fillDemoJoin = () => {
    setAuthMode('join');
    setJoinCode('NX-DEMO-2026');
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-white tracking-wider text-lg">
            MULTI <span className="text-cyan-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-white tracking-tight">Sign in to your workspace</h2>
        <p className="mt-1 text-xs text-slate-400">
          Autonomous multi-agent orchestration with human governance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#12151c] py-7 px-6 shadow-2xl border border-[#222733] sm:rounded-2xl sm:px-8 space-y-5">
          {/* Demo User Fast Fill Banner */}
          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-cyan-300 font-semibold block">Quick Evaluator Login</span>
              <span className="text-slate-400 text-[11px]">Pre-configured workspace with live Gemini AI</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors shadow-sm"
            >
              Fill Demo
            </button>
          </div>

          {/* Interactive Login Action Tabs (Sign In / Join by Code / Create Workspace) */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Choose Workspace Action
            </div>
            <div className="bg-[#0b0e14] p-1 rounded-xl border border-[#1f2533] grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'signin'
                    ? 'bg-[#1a2130] text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131722]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('join');
                  setError(null);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'join'
                    ? 'bg-[#1a2130] text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131722]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Join by Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('create');
                  setError(null);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'create'
                    ? 'bg-[#1a2130] text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131722]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>New Space</span>
              </button>
            </div>
          </div>

          {/* Mode Context Description Banner */}
          {authMode === 'signin' && (
            <div className="text-xs text-slate-400 flex items-center gap-2 bg-[#0e121a] px-3 py-2 rounded-lg border border-[#1b2230]">
              <LogIn className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Sign in to access your existing workspaces as owner or operator.</span>
            </div>
          )}

          {authMode === 'join' && (
            <div className="text-xs text-slate-300 flex items-center justify-between bg-indigo-950/30 px-3 py-2 rounded-lg border border-indigo-800/40">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>Join an existing team workspace as an operator.</span>
              </div>
              <button
                type="button"
                onClick={fillDemoJoin}
                className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 underline font-semibold"
              >
                Try NX-DEMO-2026
              </button>
            </div>
          )}

          {authMode === 'create' && (
            <div className="text-xs text-slate-300 flex items-center gap-2 bg-emerald-950/20 px-3 py-2 rounded-lg border border-emerald-800/40">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>You will be the Workspace Owner and generate an invite code for your team.</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-950/40 border border-rose-900 p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {/* Join Workspace Code Field */}
            {authMode === 'join' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Workspace Invite Code <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="NX-DEMO-2026"
                    className="w-full px-3.5 py-2.5 text-sm font-mono tracking-wider bg-[#171b24] border border-[#262c3d] rounded-xl text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Ask your workspace owner for their team code, or click{' '}
                  <span
                    onClick={fillDemoJoin}
                    className="text-cyan-400 font-mono cursor-pointer hover:underline"
                  >
                    NX-DEMO-2026
                  </span>{' '}
                  to test.
                </p>
              </div>
            )}

            {/* Create Workspace Name Field */}
            {authMode === 'create' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Workspace Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. Acme Global Operations"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#171b24] border border-[#262c3d] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  You will have full owner controls and an invite code will be created automatically.
                </p>
              </div>
            )}

            {/* Name field for new users joining or creating */}
            {authMode !== 'signin' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Full Name <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Reddy"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#171b24] border border-[#262c3d] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#171b24] border border-[#262c3d] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#171b24] border border-[#262c3d] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 focus:outline-none disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : authMode === 'join' ? (
                <>
                  <span>Join Workspace by Code</span>
                  <KeyRound className="w-4 h-4" />
                </>
              ) : authMode === 'create' ? (
                <>
                  <span>Create Workspace & Take Ownership</span>
                  <Building2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Logins */}
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#12151c] px-2 text-slate-500">Or continue with</span>
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

          {/* Inline switcher footer */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#1d2332]">
            {authMode === 'signin' && (
              <p>
                Need to collaborate with a team?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('join')}
                  className="font-semibold text-cyan-400 hover:underline"
                >
                  Join by Code
                </button>
                {' or '}
                <button
                  type="button"
                  onClick={() => setAuthMode('create')}
                  className="font-semibold text-indigo-400 hover:underline"
                >
                  Create Workspace
                </button>
              </p>
            )}
            {authMode === 'join' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="font-semibold text-cyan-400 hover:underline"
                >
                  Sign In
                </button>
                {' or '}
                <button
                  type="button"
                  onClick={() => setAuthMode('create')}
                  className="font-semibold text-indigo-400 hover:underline"
                >
                  Create Workspace as Owner
                </button>
              </p>
            )}
            {authMode === 'create' && (
              <p>
                Have an invite code instead?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('join')}
                  className="font-semibold text-cyan-400 hover:underline"
                >
                  Join by Code
                </button>
                {' or '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="font-semibold text-cyan-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
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
