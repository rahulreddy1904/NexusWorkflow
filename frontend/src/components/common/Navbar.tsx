import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Bell, Shield, Database, Cpu, ExternalLink } from 'lucide-react';
import { apiClient } from '../../api/client';
import { SystemStatusData } from '../../types';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SystemStatusData | null>(null);

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

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: System Status Pills */}
      <div className="flex items-center gap-3">
        {/* DB Status */}
        <Link
          to="/integrations"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/80 transition-colors"
          title={status?.database?.instructions || 'Database status'}
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>DB: {status?.database?.isSupabase ? 'Supabase PostgreSQL' : 'Local Postgres (pg-mem)'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </Link>

        {/* AI Status */}
        <Link
          to="/integrations"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            status?.geminiAi?.configured
              ? 'bg-purple-950/40 text-purple-300 border-purple-800 hover:bg-purple-900/40'
              : 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-900/40'
          }`}
          title={status?.geminiAi?.instructions || 'AI Reasoning Status'}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>
            Gemini: {status?.geminiAi?.configured ? status.geminiAi.model : 'Offline Rule-Based Planner'}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status?.geminiAi?.configured ? 'bg-purple-400' : 'bg-amber-400'
            }`}
          ></span>
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Link
          to="/workflows/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </Link>
      </div>
    </header>
  );
};
