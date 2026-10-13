import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle, Building2, KeyRound, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Workspace choice: 'create' | 'join' | 'none'
  const [workspaceAction, setWorkspaceAction] = useState<'create' | 'join' | 'none'>('none');
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (workspaceAction === 'create' && !workspaceName.trim()) {
      setError('Please provide a name for your workspace.');
      return;
    }

    if (workspaceAction === 'join' && !joinCode.trim()) {
      setError('Please provide the team invite code.');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name, {
        workspaceAction,
        workspaceName: workspaceAction === 'create' ? workspaceName.trim() : undefined,
        joinCode: workspaceAction === 'join' ? joinCode.trim() : undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-white tracking-wider text-lg">
            MULTI <span className="text-cyan-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-white tracking-tight">Create your account</h2>
        <p className="mt-1 text-xs text-slate-400">
          Autonomous multi-agent orchestration for enterprise operations
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-[#12151c] py-8 px-6 shadow-2xl border border-[#222733] sm:rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="rounded-xl bg-rose-950/40 border border-rose-800/50 p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Connor"
                className="w-full px-3.5 py-2.5 text-sm bg-[#171b24] border border-[#262c3d] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@nexus.ai"
                className="w-full px-3.5 py-2.5 text-sm bg-[#171b24] border border-[#262c3d] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password (Min. 8 chars)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-[#171b24] border border-[#262c3d] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Workspace Choice Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Workspace Setup Choice
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setWorkspaceAction('none')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    workspaceAction === 'none'
                      ? 'bg-[#1a202c] border-cyan-500 text-white shadow-sm'
                      : 'bg-[#151922] border-[#242938] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4 mx-auto mb-1 text-slate-300" />
                  <span className="text-[11px] font-bold block leading-tight">Choose Later</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Recommended</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceAction('create')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    workspaceAction === 'create'
                      ? 'bg-[#1a202c] border-cyan-500 text-white shadow-sm'
                      : 'bg-[#151922] border-[#242938] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                  <span className="text-[11px] font-bold block leading-tight">Create Workspace</span>
                  <span className="text-[9px] text-indigo-300 block mt-0.5">Become Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceAction('join')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    workspaceAction === 'join'
                      ? 'bg-[#1a202c] border-cyan-500 text-white shadow-sm'
                      : 'bg-[#151922] border-[#242938] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                  <span className="text-[11px] font-bold block leading-tight">Join by Code</span>
                  <span className="text-[9px] text-cyan-300 block mt-0.5">Team Member</span>
                </button>
              </div>

              {/* Conditional Input based on choice */}
              {workspaceAction === 'create' && (
                <div className="mt-3 p-3 rounded-xl bg-[#171b24] border border-[#242938]">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Workspace Name</label>
                  <input
                    type="text"
                    required
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. Apex Operations"
                    className="w-full px-3 py-2 text-sm bg-[#12151c] border border-[#262c3d] rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    You will become the Owner and receive an invite code for your team.
                  </span>
                </div>
              )}

              {workspaceAction === 'join' && (
                <div className="mt-3 p-3 rounded-xl bg-[#171b24] border border-[#242938]">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Team Invite Code</label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. NX-DEMO-2026"
                    className="w-full px-3 py-2 text-sm font-mono tracking-wider bg-[#12151c] border border-[#262c3d] rounded-lg text-white uppercase focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Enter the code given by your workspace owner to join as a collaborating member.
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs tracking-wide shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Creating account...' : 'Create Account & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
