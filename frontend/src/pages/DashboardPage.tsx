import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  ChevronDown,
  Clock,
  Circle,
  Cpu,
  Bot,
  Zap,
  Users,
  Compass,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { WorkflowRun, WorkflowApproval } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';

export const DashboardPage: React.FC = () => {
  const { workspace } = useAuth();
  const navigate = useNavigate();

  // Mode Selection
  const [selectedMode, setSelectedMode] = useState<'orchestrator' | 'fast' | 'council' | 'autoroute'>('orchestrator');
  const [promptGoal, setPromptGoal] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Data
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowRun[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<WorkflowApproval[]>([]);
  const [stats, setStats] = useState({
    totalRuns: 0,
    completedRuns: 0,
    runningRuns: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [wsData, runsData, approvalsData] = await Promise.all([
          apiClient.getWorkspaceSummary(),
          apiClient.listWorkflows({ limit: 5 }),
          apiClient.listApprovals('pending'),
        ]);

        if (wsData?.stats) {
          setStats(wsData.stats);
        }
        setRecentWorkflows(runsData.items || []);
        setPendingApprovals(approvalsData || []);
      } catch (err) {
        // ignore
      }
    };

    loadDashboard();
    const interval = setInterval(loadDashboard, 8000);
    return () => clearInterval(interval);
  }, [workspace?.id]);

  const handleCopyCode = () => {
    if (workspace?.joinCode) {
      navigator.clipboard.writeText(workspace.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLaunch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptGoal.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const constraints: string[] = [];
      if (selectedMode === 'council') {
        constraints.push('Requires explicit human operator approval sign-off before finalization.');
      }
      if (priority === 'urgent' || priority === 'high') {
        constraints.push(`Priority set to ${priority}. Expedite execution and flag compliance risks.`);
      }

      const res = await apiClient.createWorkflow({
        title: promptGoal.substring(0, 60),
        goal: promptGoal.trim(),
        priority,
        constraints,
      });

      navigate(`/workflows/${res.runId}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to start workflow execution.');
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleLaunch();
    }
  };

  const exampleGoals = [
    { label: 'Vendor Risk Review', text: 'Assess vendor ISO 27001 certificate, evaluate data residency risks, and prepare approval request for security officer.' },
    { label: 'SOC2 Access Audit', text: 'Scan privileged access lists, verify multi-factor authentication enrollment, and prepare compliance summary report.' },
    { label: 'Invoice Reconciliation', text: 'Cross-check invoices against Stripe receipts, flag discrepancies over $500 for human signoff, and compile journal artifact.' },
    { label: 'Incident Post-Mortem', text: 'Synthesize production incident telemetry, verify mitigation tasks, and compile formal executive root cause analysis artifact.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-2">
      {/* 1. Multi Header Stage */}
      <div className="text-center space-y-4 pt-4">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181d28] border border-[#273042] text-xs font-medium text-slate-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Gemini 2.5 Flash · One operational goal · Autonomous execution</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
          Orchestrate once. Get the<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-500 font-extrabold italic">
            most out of autonomous AI.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Write your operational prompt and choose your workflow. Decompose into specialized agent steps, enforce human approval gates, or let Orchestrator coordinate everything.
        </p>

        {/* Orchestrator Banner card */}
        <div className="pt-2">
          <Link
            to="/workflows/new"
            className="inline-flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-[#141822] border border-[#232a3b] hover:border-cyan-500/50 transition-all text-xs group"
          >
            <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">✦</span>
            <span className="text-slate-300">
              <b className="text-white">Not sure which workflow?</b> Let Orchestrator plan, run, and verify it.
            </span>
            <span className="text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              Open Orchestrator →
            </span>
          </Link>
        </div>
      </div>

      {/* 2. Workspace Team Collaboration Banner (If Owner / Member) */}
      {workspace && (
        <div className="p-4 rounded-2xl bg-[#121620] border border-[#202738] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{workspace.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold uppercase">
                  {workspace.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Share your invite code so team members can join this workspace and run workflows together.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-500/20 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Join Code:</span>
              <code className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
                {workspace.joinCode || 'NX-DEMO-2026'}
              </code>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Copy code to share with team"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. The Multi Mode Grid Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-400">
          <span>Choose how Multi should run it</span>
          <span className="text-[11px] text-slate-500">Configurable before launch</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Mode 1: Orchestrator */}
          <button
            type="button"
            onClick={() => setSelectedMode('orchestrator')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              selectedMode === 'orchestrator'
                ? 'bg-[#181d28] border-cyan-500 shadow-md shadow-cyan-500/10'
                : 'bg-[#12151c] border-[#222733] hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-cyan-400 font-bold text-sm">✦</span>
              {selectedMode === 'orchestrator' && <span className="text-[11px] text-cyan-400 font-bold">✓</span>}
            </div>
            <div className="font-bold text-xs text-white">Orchestrator</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              One goal, autonomous multi-agent DAG
            </div>
          </button>

          {/* Mode 2: Fast Execute */}
          <button
            type="button"
            onClick={() => setSelectedMode('fast')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              selectedMode === 'fast'
                ? 'bg-[#181d28] border-cyan-500 shadow-md shadow-cyan-500/10'
                : 'bg-[#12151c] border-[#222733] hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-indigo-400 font-bold text-sm">⚡</span>
              {selectedMode === 'fast' && <span className="text-[11px] text-cyan-400 font-bold">✓</span>}
            </div>
            <div className="font-bold text-xs text-white">Fast Execute</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Rapid procedural task dispatch
            </div>
          </button>

          {/* Mode 3: Council / HITL */}
          <button
            type="button"
            onClick={() => setSelectedMode('council')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              selectedMode === 'council'
                ? 'bg-[#181d28] border-cyan-500 shadow-md shadow-cyan-500/10'
                : 'bg-[#12151c] border-[#222733] hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-amber-400 font-bold text-sm">◈</span>
              {selectedMode === 'council' && <span className="text-[11px] text-cyan-400 font-bold">✓</span>}
            </div>
            <div className="font-bold text-xs text-white">Council (HITL)</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Mandatory human sign-off gates
            </div>
          </button>

          {/* Mode 4: Auto-route */}
          <button
            type="button"
            onClick={() => setSelectedMode('autoroute')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              selectedMode === 'autoroute'
                ? 'bg-[#181d28] border-cyan-500 shadow-md shadow-cyan-500/10'
                : 'bg-[#12151c] border-[#222733] hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-emerald-400 font-bold text-sm">⇄</span>
              {selectedMode === 'autoroute' && <span className="text-[11px] text-cyan-400 font-bold">✓</span>}
            </div>
            <div className="font-bold text-xs text-white">Auto-route</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Agent-selected specialized tools
            </div>
          </button>
        </div>
      </div>

      {/* 4. Configure Mode Details Accordion */}
      <div className="rounded-2xl bg-[#12151c] border border-[#222733] overflow-hidden">
        <button
          type="button"
          onClick={() => setConfigOpen(!configOpen)}
          className="w-full p-3.5 px-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white capitalize">Configure {selectedMode}</span>
            <span className="text-[11px] text-slate-400">· Model, priority, and governance controls</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Optional</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${configOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {configOpen && (
          <div className="p-4 pt-2 border-t border-[#222733] grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#101319]">
            {/* Model Card */}
            <div className="p-2.5 rounded-xl bg-[#151922] border border-[#242938]">
              <span className="text-[10px] text-slate-400 block">AI Reasoning Engine</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold text-white">Gemini 2.5 Flash</span>
                <span className="text-[10px] text-emerald-400 font-medium">✓ Ready</span>
              </div>
            </div>

            {/* Priority Selector */}
            <div className="p-2.5 rounded-xl bg-[#151922] border border-[#242938]">
              <span className="text-[10px] text-slate-400 block mb-1">Execution Priority</span>
              <div className="flex gap-1">
                {(['normal', 'high', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                      priority === p ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Database Persistence */}
            <div className="p-2.5 rounded-xl bg-[#151922] border border-[#242938]">
              <span className="text-[10px] text-slate-400 block">Ledger & State</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold text-white">PostgreSQL Persistence</span>
                <span className="text-[10px] text-emerald-400 font-medium">Synced</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. The Centerpiece Composer Box (getmulti.ai style) */}
      <div className="space-y-2">
        <form onSubmit={handleLaunch} className="relative rounded-2xl bg-[#141720] border border-[#242a38] p-4 shadow-2xl focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all">
          <textarea
            rows={3}
            value={promptGoal}
            onChange={(e) => setPromptGoal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What operational request should the multi-agent orchestrator solve? (e.g. Audit SOC2 access lists, perform ISO 27001 vendor review, or cross-check invoice receipts)"
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-3 border-t border-[#202533] mt-2">
            {/* Quick Template Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pr-2 max-w-[80%] no-scrollbar">
              {exampleGoals.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setPromptGoal(ex.text)}
                  className="px-2.5 py-1 rounded-lg bg-[#191e2b] hover:bg-[#202738] text-[11px] text-slate-300 border border-[#2b3347] whitespace-nowrap transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSubmitting || !promptGoal.trim()}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white flex items-center justify-center shrink-0 shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              title="Launch with Orchestrator (Enter)"
            >
              <span className="text-base font-bold group-hover:-translate-y-0.5 transition-transform">↑</span>
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
          <span>
            <b className="text-slate-400 capitalize">{selectedMode}</b> is ready · Enter to send · Shift + Enter for newline
          </span>
          <span className="font-mono text-cyan-400/80">Gemini 2.5 Flash Online</span>
        </div>
      </div>

      {/* 6. Metrics & Recent Work Stage */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        <div className="p-3.5 rounded-2xl bg-[#12151c] border border-[#202533]">
          <span className="text-[11px] text-slate-400 block font-medium">Total Workflows</span>
          <span className="text-xl font-black text-white mt-0.5 block">{stats.totalRuns}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#12151c] border border-[#202533]">
          <span className="text-[11px] text-slate-400 block font-medium">Completed</span>
          <span className="text-xl font-black text-emerald-400 mt-0.5 block">{stats.completedRuns}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#12151c] border border-[#202533]">
          <span className="text-[11px] text-slate-400 block font-medium">Running DAGs</span>
          <span className="text-xl font-black text-cyan-400 mt-0.5 block">{stats.runningRuns}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#12151c] border border-[#202533]">
          <span className="text-[11px] text-slate-400 block font-medium">Pending Approvals</span>
          <span className="text-xl font-black text-amber-400 mt-0.5 block">{stats.pendingApprovals}</span>
        </div>
      </div>

      {/* 7. Live Recent Work Table */}
      <div className="rounded-2xl bg-[#12151c] border border-[#202533] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Active & Recent Workflows</h3>
            <p className="text-[11px] text-slate-400">Autonomous runs orchestrated in this workspace</p>
          </div>
          <Link
            to="/workflows"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentWorkflows.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No workflows executed yet. Type a goal in the composer above to start!
          </div>
        ) : (
          <div className="space-y-2">
            {recentWorkflows.map((run) => (
              <Link
                key={run.id}
                to={`/workflows/${run.id}`}
                className="p-3 rounded-xl bg-[#161a24] border border-[#222838] hover:border-cyan-500/40 flex items-center justify-between gap-3 transition-colors block group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {run.title}
                    </span>
                    <PriorityBadge priority={run.priority} />
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {run.goal}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={run.status} />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardPage;
