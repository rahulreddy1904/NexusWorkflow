import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Copy,
  Check,
  Plus,
  KeyRound,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'join' | 'manage';
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  mode = 'create',
}) => {
  const { workspace, createWorkspace, joinWorkspace, switchWorkspace, regenerateJoinCode } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'list'>('create');
  const [workspaceName, setWorkspaceName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [myWorkspaces, setMyWorkspaces] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (mode === 'join') setActiveTab('join');
    else if (mode === 'manage') setActiveTab('list');
    else setActiveTab('create');
  }, [mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadWorkspaces();
    }
  }, [isOpen]);

  const loadWorkspaces = async () => {
    setLoadingList(true);
    try {
      const data = await apiClient.listMyWorkspaces();
      setMyWorkspaces(data || []);
    } catch (err) {
      // ignore
    } finally {
      setLoadingList(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (workspace?.joinCode) {
      navigator.clipboard.writeText(workspace.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createWorkspace(workspaceName.trim());
      setWorkspaceName('');
      onClose();
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
      setJoinCode('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid or expired workspace code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitch = async (id: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await switchWorkspace(id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to switch workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateJoinCode();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to regenerate code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12151c] border border-[#242938] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Workspace Management</h2>
            <p className="text-xs text-slate-400">Collaborate with your team in a shared AI operations environment</p>
          </div>
        </div>

        {/* Current Workspace Invite Banner (if user already has a workspace) */}
        {workspace && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#171b24] border border-[#232836] flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{workspace.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase font-bold tracking-wider">
                  {workspace.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                <span>Team Invite Code:</span>
                <code className="px-2 py-0.5 rounded bg-black/40 text-cyan-300 font-mono font-bold tracking-wider text-xs border border-cyan-500/20">
                  {workspace.joinCode || 'NX-DEMO-2026'}
                </code>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                title="Copy Invite Code to Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              {workspace.role === 'owner' && (
                <button
                  onClick={handleRegenerate}
                  title="Regenerate Join Code"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-[#242938] mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-semibold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'create' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Workspace (Take Ownership)
            {activeTab === 'create' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`pb-2.5 px-3 text-xs font-semibold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'join' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Join with Code
            {activeTab === 'join' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          {myWorkspaces.length > 1 && (
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-2.5 px-3 text-xs font-semibold transition-colors relative flex items-center gap-1.5 ${
                activeTab === 'list' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Switch Workspace ({myWorkspaces.length})
              {activeTab === 'list' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Content 1: Create Workspace */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                New Workspace Name
              </label>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Cloud Operations"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171b24] border border-[#262c3d] text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-500"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                As the owner, you will receive a shareable invite code so other members can join and run workflows together.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !workspaceName.trim()}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-xs tracking-wide shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Workspace & Become Owner'}</span>
            </button>
          </form>
        )}

        {/* Tab Content 2: Join Workspace by Code */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Workspace Invite Code
              </label>
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. NX-DEMO-2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171b24] border border-[#262c3d] text-white text-sm font-mono tracking-wider focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 uppercase"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Ask your workspace owner for their team code. You will join their workspace as an active operator with access to shared workflows.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !joinCode.trim()}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs tracking-wide shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>{isSubmitting ? 'Joining...' : 'Join Team Workspace'}</span>
            </button>
          </form>
        )}

        {/* Tab Content 3: Switch Workspace */}
        {activeTab === 'list' && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {myWorkspaces.map((ws) => (
              <div
                key={ws.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  ws.isActive
                    ? 'bg-indigo-950/20 border-indigo-500/40'
                    : 'bg-[#171b24] border-[#242938] hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{ws.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-300 uppercase font-mono">
                      {ws.role}
                    </span>
                    {ws.isActive && (
                      <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Code: {ws.joinCode || 'NX-DEMO-2026'}
                  </div>
                </div>

                {!ws.isActive && (
                  <button
                    onClick={() => handleSwitch(ws.id)}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <span>Switch</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default WorkspaceModal;
