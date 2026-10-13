import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Compass,
  Cpu,
  Layers,
  ShieldCheck,
  FileCode2,
  History,
  Settings,
  LogOut,
  Copy,
  Check,
  ChevronDown,
  Building2,
  Clock,
  Circle,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { WorkflowRun } from '../../types';
import { WorkspaceModal } from './WorkspaceModal';

export const Sidebar: React.FC = () => {
  const { user, workspace, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowRun[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'join' | 'manage'>('manage');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [approvals, runs] = await Promise.all([
          apiClient.listApprovals('pending'),
          apiClient.listWorkflows({ limit: 4 }),
        ]);
        setPendingApprovalsCount(approvals?.length || 0);
        setRecentWorkflows(runs?.items || []);
      } catch (err) {
        // ignore
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [workspace?.id]);

  const handleCopyCode = () => {
    if (workspace?.joinCode) {
      navigator.clipboard.writeText(workspace.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Compass },
    { to: '/workflows/new', label: 'Orchestrator', icon: Sparkles },
    { to: '/workflows', label: 'Workflows', icon: Layers },
    {
      to: '/approvals',
      label: 'Approvals',
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { to: '/templates', label: 'Templates', icon: FileCode2 },
    { to: '/integrations', label: 'Integrations & AI', icon: Cpu },
    { to: '/audit', label: 'Audit Ledger', icon: History },
  ];

  return (
    <>
      <aside className="w-64 bg-[#11141a] border-r border-[#1f242e] flex flex-col justify-between h-screen sticky top-0 select-none text-slate-300 z-30">
        <div className="flex flex-col flex-1 min-h-0">
          {/* 1. Head / Logo */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1f242e]">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-1">
                MULTI <span className="text-cyan-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">AI</span>
              </span>
            </Link>

            <button
              onClick={() => navigate('/workflows')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Search workflows"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Primary Action Button: New prompt / workflow */}
          <div className="p-3 border-b border-[#1f242e]">
            <button
              onClick={() => navigate('/workflows/new')}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600/90 to-cyan-600/90 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs tracking-wide shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all group border border-white/10"
            >
              <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
              <span>New Workflow</span>
            </button>
          </div>

          {/* 3. Navigation Links */}
          <div className="p-2 space-y-0.5 border-b border-[#1f242e]/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#1b202c] text-white border border-[#2b3345] shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#161a22]'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* 4. Model Pill Status (Multi-style free/model banner) */}
          <div className="p-3">
            <div className="p-2.5 rounded-xl bg-[#161922] border border-[#222733] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="truncate">
                  <span className="text-[11px] font-bold text-white block truncate">Gemini 2.5 Flash</span>
                  <span className="text-[10px] text-slate-400 block truncate">Autonomous Multi-Agent</span>
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-bold tracking-wider">
                Live
              </span>
            </div>
          </div>

          {/* 5. Recent Work History (Multi-style history list) */}
          <div className="flex-1 px-3 py-1 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
              <span>Recent work</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1b202c] text-slate-300 border border-[#262c3d]">
                {recentWorkflows.length}
              </span>
            </div>

            {recentWorkflows.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#141720]/50 border border-[#1f242e] text-center text-[11px] text-slate-500">
                <span>No workflows launched yet.</span>
              </div>
            ) : (
              <div className="space-y-1">
                {recentWorkflows.map((run) => (
                  <Link
                    key={run.id}
                    to={`/workflows/${run.id}`}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#161922] transition-colors truncate group"
                  >
                    <Circle
                      className={`w-2 h-2 shrink-0 ${
                        run.status === 'completed'
                          ? 'text-emerald-400 fill-emerald-400'
                          : run.status === 'running'
                          ? 'text-cyan-400 fill-cyan-400 animate-pulse'
                          : run.status === 'awaiting_approval'
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-500 fill-slate-500'
                      }`}
                    />
                    <span className="truncate group-hover:text-cyan-300 transition-colors">
                      {run.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 6. Bottom User & Workspace Footer (Multi user card) */}
        <div className="p-3 border-t border-[#1f242e] bg-[#0e1015]">
          {/* Team Invite Code Banner */}
          {workspace && (
            <div className="mb-2 p-2 rounded-xl bg-[#151922] border border-[#232836] flex items-center justify-between">
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block">Invite Code</span>
                <code className="text-[11px] font-mono font-bold text-cyan-300 tracking-wider">
                  {workspace.joinCode || 'NX-DEMO-2026'}
                </code>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-2 py-1 rounded bg-[#202636] hover:bg-[#283044] text-[11px] font-medium text-slate-200 flex items-center gap-1 transition-colors border border-white/5"
                title="Copy Team Invite Code"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* User & Workspace Switcher Card */}
          <div className="p-2 rounded-xl bg-[#13161c] border border-[#222733] flex items-center justify-between">
            <button
              onClick={() => {
                setModalMode('manage');
                setIsWorkspaceModalOpen(true);
              }}
              className="flex items-center gap-2.5 truncate text-left hover:opacity-90 transition-opacity"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                  <span>{workspace?.name || 'Workspace'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-400 truncate capitalize">
                  {workspace?.role || 'member'} · {user?.name?.split(' ')[0]}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-1">
              <Link
                to="/settings"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Workspace Switch / Create / Join Modal */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        mode={modalMode}
      />
    </>
  );
};
export default Sidebar;
