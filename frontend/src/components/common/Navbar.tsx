import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Database, Cpu, Copy, Check, Users, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/client';
import { SystemStatusData } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { workspace } = useAuth();
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiClient.getConfigStatus();
        setStatus(data);
      } catch (err) {
        // ignore
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCode = () => {
    if (workspace?.joinCode) {
      navigator.clipboard.writeText(workspace.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="h-14 border-b border-[#1f242e] bg-[#0f1115]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Active Workspace & Invite Code Pill */}
      <div className="flex items-center gap-3">
        {workspace && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-lg bg-[#161a22] border border-[#242a38]">
              {workspace.name}
            </span>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#141821] border border-cyan-500/20 text-xs">
              <span className="text-[10px] text-slate-400">Team Code:</span>
              <code className="text-[11px] font-mono font-bold text-cyan-300">
                {workspace.joinCode || 'NX-DEMO-2026'}
              </code>
              <button
                onClick={handleCopyCode}
                className="ml-1 p-0.5 text-slate-400 hover:text-white rounded transition-colors"
                title="Copy Team Invite Code"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Engine Indicator & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Gemini AI Status */}
        <Link
          to="/integrations"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#161a24] text-slate-300 border border-[#242b3b] hover:border-slate-600 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Gemini 2.5 Flash</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </Link>

        {/* DB Status */}
        <Link
          to="/integrations"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#161a24] text-slate-400 border border-[#242b3b] hover:border-slate-600 transition-colors"
        >
          <Database className="w-3 h-3 text-emerald-400" />
          <span className="text-[11px]">{status?.database?.isSupabase ? 'Supabase' : 'pg-mem'}</span>
        </Link>

        {/* New Workflow button */}
        <Link
          to="/workflows/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workflow</span>
        </Link>
      </div>
    </header>
  );
};
export default Navbar;
