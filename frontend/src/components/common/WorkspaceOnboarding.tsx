import React, { useState } from 'react';
import { Building2, Users, Sparkles, KeyRound, ArrowRight, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const WorkspaceOnboarding: React.FC = () => {
  const { user, createWorkspace, joinWorkspace, logout } = useAuth();
  const [activeChoice, setActiveChoice] = useState<'create' | 'join'>('create');
  const [workspaceName, setWorkspaceName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createWorkspace(workspaceName.trim());
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await joinWorkspace(joinCode.trim());
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid or expired workspace invite code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-100 flex flex-col justify-between p-6">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-wider text-sm flex items-center gap-1">
            NEXUS <span className="text-cyan-400 font-medium">WORKFLOW</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Signed in as <b className="text-white">{user?.email}</b></span>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="max-w-3xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 text-[11px] font-semibold mb-4">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Workspace Setup & Team Collaboration</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How would you like to get started?
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
            Create your own workspace to take ownership and invite team members, or join an existing workspace with an invite code.
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Choice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
          {/* Card 1: Create Workspace */}
          <div
            onClick={() => setActiveChoice('create')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeChoice === 'create'
                ? 'bg-[#181d28] border-cyan-500 shadow-lg shadow-cyan-500/10'
                : 'bg-[#13161c] border-[#222733] hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold uppercase tracking-wider">
                Owner Role
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Create Workspace</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start a new operational workspace. You become Owner and receive an invite code to share with your team.
            </p>
          </div>

          {/* Card 2: Join Workspace */}
          <div
            onClick={() => setActiveChoice('join')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeChoice === 'join'
                ? 'bg-[#181d28] border-cyan-500 shadow-lg shadow-cyan-500/10'
                : 'bg-[#13161c] border-[#222733] hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold uppercase tracking-wider">
                Team Member
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Join with Code</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Join your team's existing workspace using an invite code provided by your workspace owner.
            </p>
          </div>
        </div>

        {/* Selected Form Area */}
        <div className="max-w-md mx-auto bg-[#13161c] border border-[#222733] rounded-2xl p-6 shadow-xl">
          {activeChoice === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Operations"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f1115] border border-[#262c3d] text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !workspaceName.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-xs tracking-wide shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating...' : 'Create & Take Ownership'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Workspace Invite Code
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. NX-DEMO-2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f1115] border border-[#262c3d] text-white text-sm font-mono tracking-wider uppercase focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !joinCode.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs tracking-wide shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>{isSubmitting ? 'Joining...' : 'Join Workspace'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 py-2">
        NEXUS Multi-Agent Orchestration Engine · Google Gemini AI & Supabase
      </div>
    </div>
  );
};
export default WorkspaceOnboarding;
