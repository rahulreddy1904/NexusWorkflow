import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  GitBranch,
  Bot,
  Database,
  Lock,
  CheckCircle2,
  Terminal,
  Activity,
  ChevronRight,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-wider text-base">
              NEXUS <span className="text-brand-400 font-medium">WORKFLOW</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#how-it-works" className="hover:text-slate-200 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-slate-200 transition-colors">Capabilities</a>
            <a href="#preview" className="hover:text-slate-200 transition-colors">Operations Preview</a>
            <a href="#security" className="hover:text-slate-200 transition-colors">Security & Governance</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              Open Console
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-800 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Multi-Agent Operations with HITL Governance</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Orchestrate Complex Operations with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-300 to-emerald-400">Collaborative AI Agents</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate repetitive operational triage, coordination delays, and fragmented handoffs.
            NEXUS autonomous agents plan, reason, execute database-backed tasks, and seek human approval where risk warrants it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 transition-all text-sm"
            >
              <span>Explore Live Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-all"
            >
              <span>Sign In with Demo Account</span>
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Google Gemini 3.8 Reasoning
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Supabase PostgreSQL Persistence
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Human-in-the-Loop Approval Gates
            </span>
          </div>
        </div>
      </section>

      {/* How It Works Architecture Diagram */}
      <section id="how-it-works" className="py-20 px-6 border-t border-slate-900 bg-slate-900/30">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-brand-400 uppercase tracking-widest">End-to-End Orchestration Architecture</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">How Autonomous Execution Meets Human Control</h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Every request traverses a deterministic lifecycle of bounded multi-agent planning, registered tool execution, and policy-governed approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h4 className="text-base font-bold text-white">Intake & Goal Definition</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operators submit goals, context, and operational constraints via pre-built templates or custom request forms.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h4 className="text-base font-bold text-white">Autonomous Planning</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Planner Agent deconstructs the objective into a typed, bounded DAG plan and assigns specialist agents (Triage, Research, Execution).
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h4 className="text-base font-bold text-white">HITL Governance Gate</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-impact mutations (refunds, access grants, service restarts) automatically pause execution until an authorized human signs off.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h4 className="text-base font-bold text-white">Durable Output & QA</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Reviewer Agent validates results against goal constraints and persists formal artifacts and tasks to Supabase PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Realistic Product Preview Section */}
      <section id="preview" className="py-20 px-6 border-t border-slate-900">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800">
              Illustrative Dashboard Preview
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Full Observability for Every Step</h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Real application UI with multi-agent timeline tracking, live tool input/output inspectors, and real-time approval queues.
            </p>
          </div>

          {/* Illustrative Dashboard Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Window bar */}
            <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-xs text-slate-400 font-mono ml-2">nexus-workflow // run_sample_it_triage_01</span>
              </div>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Status: Completed
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step DAG snippet */}
              <div className="md:col-span-1 space-y-3 border-r border-slate-800/80 pr-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Execution DAG Steps</h5>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-slate-200">1. Telemetry Ingestion</div>
                  <div className="text-[11px] text-cyan-400 font-mono">Agent: Triage Specialist</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-slate-200">2. Incident Checklist</div>
                  <div className="text-[11px] text-emerald-400 font-mono">Agent: Execution Specialist</div>
                </div>
                <div className="p-3 rounded-lg bg-brand-950/40 border border-brand-700 space-y-1">
                  <div className="text-xs font-semibold text-brand-200">3. Root Cause Analysis (RCA)</div>
                  <div className="text-[11px] text-purple-400 font-mono">Agent: Quality Reviewer</div>
                </div>
              </div>

              {/* Inspector Preview */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Tool Invoked:</span>
                    <span className="font-mono text-brand-400">db_artifact_save</span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono bg-slate-900/90 p-3 rounded border border-slate-800">
                    # Incident Summary: Checkout Latency Spikes{'\n'}
                    - Bottleneck: Redis connection pool exhaustion{'\n'}
                    - Action: Cap connections at 250 and add retry backoff{'\n'}
                    - Verification: Latency stabilized at 84ms.
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span>Persisted in: <strong className="text-slate-200">Supabase PostgreSQL</strong></span>
                  <span>Model: <strong className="text-purple-400">Gemini 3.8 Flash</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy Section */}
      <section id="security" className="py-20 px-6 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Enterprise Security Model</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Built for High-Stakes Operations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Strict Secret Isolation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All Gemini API keys, OAuth secrets, and database credentials remain exclusively on the server. No secrets are ever exposed to client bundles.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">SSRF & Prompt Injection Defense</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI outputs are treated as untrusted. Tools run strictly validated schemas, and network calls block loopback, private RFC1918 IPs, and cloud metadata endpoints.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Immutable Audit Trail</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every agent thought, tool argument, approval decision, and status mutation is recorded with correlation IDs in durable PostgreSQL tables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 border-t border-slate-900 bg-gradient-to-b from-slate-950 to-brand-950/30 text-center space-y-6">
        <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
          Ready to experience autonomous workflow orchestration?
        </h3>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Sign into the pre-seeded workspace or submit your first autonomous workflow now.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 transition-all text-sm"
          >
            Launch NEXUS Workspace
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 NEXUS Workflow. General-purpose agentic AI workflow orchestration with human-in-the-loop governance.</p>
      </footer>
    </div>
  );
};
