import React, { useEffect, useState } from 'react';
import { Settings, Users, Shield, Database, Sliders, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const SettingsPage: React.FC = () => {
  const { user, workspace } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [limits, setLimits] = useState<any>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [wsData, configData] = await Promise.all([
          apiClient.getWorkspaceSummary(),
          apiClient.getConfigStatus(),
        ]);
        if (wsData?.members) setMembers(wsData.members);
        if (configData?.limits) setLimits(configData.limits);
      } catch (err) {
        // ignore
      }
    };
    loadSettings();
  }, []);

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
          Workspace Settings & Governance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage workspace members, operational roles, and orchestration execution boundaries
        </p>
      </div>

      {/* Workspace Information */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-400" />
          <span>Workspace Overview</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400">Workspace Name:</span>
            <div className="font-semibold text-slate-200 text-sm">{workspace?.name}</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400">Slug Identifier:</span>
            <div className="font-mono text-slate-300 text-sm">{workspace?.slug}</div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Workspace Members ({members.length})</span>
        </h2>

        <div className="divide-y divide-slate-800/80">
          {members.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400">
                  {m.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">{m.name}</div>
                  <div className="text-[11px] text-slate-400">{m.email}</div>
                </div>
              </div>

              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Orchestration Boundaries & Limits */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Execution Limits & Safety Boundaries</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400">Max Steps per Workflow:</span>
            <div className="font-mono font-bold text-slate-200 text-base">
              {limits?.maxStepsPerWorkflow || 12}
            </div>
            <span className="text-[10px] text-slate-400">Guards against infinite loops</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400">Step Execution Timeout:</span>
            <div className="font-mono font-bold text-slate-200 text-base">
              {limits ? `${limits.stepTimeoutMs / 1000}s` : '60s'}
            </div>
            <span className="text-[10px] text-slate-400">Per-tool execution ceiling</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400">Bounded Retry Limit:</span>
            <div className="font-mono font-bold text-slate-200 text-base">
              {limits?.maxRetries || 3}
            </div>
            <span className="text-[10px] text-slate-400">Exponential backoff recovery</span>
          </div>
        </div>
      </div>
    </div>
  );
};
