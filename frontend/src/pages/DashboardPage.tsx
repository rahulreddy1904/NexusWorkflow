import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Play,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Bot,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { WorkflowRun, AuditEvent, WorkflowApproval } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<{
    totalRuns: number;
    completedRuns: number;
    runningRuns: number;
    pendingApprovals: number;
    failedRuns: number;
  }>({
    totalRuns: 0,
    completedRuns: 0,
    runningRuns: 0,
    pendingApprovals: 0,
    failedRuns: 0,
  });

  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowRun[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<WorkflowApproval[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [wsData, runsData, approvalsData, auditData] = await Promise.all([
          apiClient.getWorkspaceSummary(),
          apiClient.listWorkflows({ limit: 5 }),
          apiClient.listApprovals('pending'),
          apiClient.listAuditLogs({ limit: 6 }),
        ]);

        if (wsData?.stats) {
          setStats(wsData.stats);
        }
        setRecentWorkflows(runsData.items || []);
        setPendingApprovals(approvalsData || []);
        setRecentAudits(auditData || []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
    const interval = setInterval(loadDashboard, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Operations Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of autonomous multi-agent workflows and governance gates
          </p>
        </div>

        <Link
          to="/workflows/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-brand-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Autonomous Workflow</span>
        </Link>
      </div>

      {/* Pending Approval Callout Banner */}
      {pendingApprovals.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-600/60 rounded-xl p-4 flex items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                {pendingApprovals.length} Approval{pendingApprovals.length > 1 ? 's' : ''} Require Operator Action
              </span>
              <span className="text-xs text-slate-300">
                Autonomous execution is waiting for your review on high-impact steps.
              </span>
            </div>
          </div>
          <Link
            to="/approvals"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Workflows</span>
            <GitBranch className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalRuns}</div>
          <div className="text-[11px] text-slate-400">Recorded in PostgreSQL</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active / Running</span>
            <Play className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.runningRuns}</div>
          <div className="text-[11px] text-slate-400">Executing agent steps</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Awaiting Approvals</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.pendingApprovals}</div>
          <div className="text-[11px] text-slate-400">HITL Governance gated</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Completed Successfully</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.completedRuns}</div>
          <div className="text-[11px] text-slate-400">Quality verified by QA agent</div>
        </div>
      </div>

      {/* Main Grid: Active Workflows & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Workflows (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Recent Operational Workflows</span>
            </h2>
            <Link to="/workflows" className="text-xs text-brand-400 hover:underline flex items-center gap-1 font-medium">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
            {recentWorkflows.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No workflows submitted yet. Click "Launch Autonomous Workflow" to submit your first request.
              </div>
            ) : (
              recentWorkflows.map((run) => (
                <Link
                  key={run.id}
                  to={`/workflows/${run.id}`}
                  className="p-4 hover:bg-slate-850 flex items-center justify-between gap-4 transition-colors block"
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-200 truncate">{run.title}</h4>
                      <PriorityBadge priority={run.priority} />
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{run.goal}</p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Created {new Date(run.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Progress: {run.current_step_index} / {run.total_steps || 4} steps</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={run.status} size="sm" />
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Audit Event Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Audit Stream</span>
            </h2>
            <Link to="/audit" className="text-xs text-slate-400 hover:text-slate-200">
              Full Ledger
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            {recentAudits.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No audit events recorded.</div>
            ) : (
              recentAudits.map((evt) => (
                <div key={evt.id} className="pb-3 border-b border-slate-800/60 last:border-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-cyan-400 font-semibold">{evt.event_type}</span>
                    <span className="text-slate-400">
                      {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400">Actor:</span>{' '}
                    <span className="capitalize font-medium text-slate-300">{evt.actor_type}</span>
                    {evt.actor_id && <span className="text-slate-400"> ({evt.actor_id})</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
