import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pause,
  Play,
  XCircle,
  RotateCcw,
  ShieldAlert,
  Layers,
  FileText,
  CheckSquare,
  History,
  Brain,
  Cpu,
  Bot,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { WorkflowRun, WorkflowStep, WorkflowApproval, WorkflowTask } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { PlanVisualizer } from '../components/workflow/PlanVisualizer';
import { StepInspector } from '../components/workflow/StepInspector';
import { ApprovalBanner } from '../components/workflow/ApprovalBanner';
import { ArtifactViewer } from '../components/workflow/ArtifactViewer';

export const WorkflowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'artifacts' | 'tasks' | 'audit'>('inspector');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  const fetchWorkflow = async () => {
    if (!id) return;
    try {
      const data = await apiClient.getWorkflowDetail(id);
      setWorkflow(data);

      // If no selected step yet, pick running step or first step
      if (!selectedStep && data.steps && data.steps.length > 0) {
        const active = data.steps.find((s: WorkflowStep) => s.status === 'running' || s.status === 'awaiting_approval') || data.steps[0];
        setSelectedStep(active);
      } else if (selectedStep && data.steps) {
        // Keep updated state for selected step
        const updated = data.steps.find((s: WorkflowStep) => s.id === selectedStep.id);
        if (updated) setSelectedStep(updated);
      }
    } catch (err) {
      console.error('Failed to load workflow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditEvents = async () => {
    if (!id) return;
    try {
      const events = await apiClient.getWorkflowEvents(id);
      setAuditEvents(events);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchWorkflow();
    fetchAuditEvents();

    // Auto-poll while in active states
    const interval = setInterval(() => {
      if (workflow && ['running', 'planning', 'awaiting_approval'].includes(workflow.status)) {
        fetchWorkflow();
        fetchAuditEvents();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [id, workflow?.status]);

  const handlePause = async () => {
    if (!id) return;
    setIsActionLoading(true);
    await apiClient.pauseWorkflow(id);
    await fetchWorkflow();
    setIsActionLoading(false);
  };

  const handleResume = async () => {
    if (!id) return;
    setIsActionLoading(true);
    await apiClient.resumeWorkflow(id);
    await fetchWorkflow();
    setIsActionLoading(false);
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to cancel this workflow?')) return;
    setIsActionLoading(true);
    await apiClient.cancelWorkflow(id);
    await fetchWorkflow();
    setIsActionLoading(false);
  };

  const handleRetryStep = async (stepId: string) => {
    if (!id) return;
    setIsActionLoading(true);
    await apiClient.retryStep(id, stepId);
    await fetchWorkflow();
    setIsActionLoading(false);
  };

  const handleApprovalDecision = async (approved: boolean, note: string) => {
    const pending = workflow?.approvals?.find((a: WorkflowApproval) => a.status === 'pending');
    if (!pending) return;
    setIsActionLoading(true);
    await apiClient.decideApproval(pending.id, approved, note);
    await fetchWorkflow();
    setIsActionLoading(false);
  };

  if (isLoading || !workflow) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        Loading workflow execution state...
      </div>
    );
  }

  const pendingApproval = workflow.approvals?.find((a: WorkflowApproval) => a.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <Link
            to="/workflows"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workflows</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-100">{workflow.title}</h1>
            <PriorityBadge priority={workflow.priority} />
            <StatusBadge status={workflow.status} />
          </div>
          <p className="text-xs text-slate-400 font-mono">ID: {workflow.id}</p>
        </div>

        {/* Workflow Lifecycle Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {workflow.status === 'running' && (
            <button
              onClick={handlePause}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {workflow.status === 'paused' && (
            <button
              onClick={handleResume}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          )}

          {['running', 'paused', 'awaiting_approval'].includes(workflow.status) && (
            <button
              onClick={handleCancel}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-800 text-xs font-semibold transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Goal & Operational Context Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Operational Goal</span>
          <span>Constraints: {(workflow.constraints || []).length} active</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">{workflow.goal}</p>
        {workflow.context && (
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
            <strong className="text-slate-300">Context:</strong> {workflow.context}
          </div>
        )}
      </div>

      {/* Pending Human-in-the-Loop Approval Banner */}
      {pendingApproval && (
        <ApprovalBanner
          approval={pendingApproval}
          onDecide={handleApprovalDecision}
          isSubmitting={isActionLoading}
        />
      )}

      {/* Final Executive Summary (When Completed) */}
      {workflow.final_summary && (
        <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span>Quality Reviewer Agent — Executive Completion Verdict</span>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            {workflow.final_summary}
          </p>
        </div>
      )}

      {/* Main Execution Inspector (Grid: Plan DAG vs Inspector Tabs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Steps Plan Visualizer */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Autonomous Plan Steps ({workflow.steps?.length || 0})
            </h3>
            <span className="text-[11px] text-brand-400 font-mono">
              Step {workflow.current_step_index} of {workflow.total_steps || 4}
            </span>
          </div>

          <PlanVisualizer
            steps={workflow.steps || []}
            selectedStepId={selectedStep?.id}
            onSelectStep={(step: WorkflowStep) => {
              setSelectedStep(step);
              setActiveTab('inspector');
            }}
          />
        </div>

        {/* Right Column (7 cols): Tabbed Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tabs bar */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'inspector'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Step Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('artifacts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'artifacts'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Artifacts ({workflow.artifacts?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks & Checklists ({workflow.tasks?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'audit'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log ({auditEvents.length})</span>
            </button>
          </div>

          {/* Tab 1: Step Inspector */}
          {activeTab === 'inspector' && (
            selectedStep ? (
              <StepInspector
                step={selectedStep}
                onRetry={handleRetryStep}
                isRetrying={isActionLoading}
              />
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select a step on the left to inspect inputs and execution outputs.
              </div>
            )
          )}

          {/* Tab 2: Artifacts */}
          {activeTab === 'artifacts' && (
            <ArtifactViewer artifacts={workflow.artifacts || []} />
          )}

          {/* Tab 3: Tasks & Checklists */}
          {activeTab === 'tasks' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Persisted Tasks & Operational Checklists
              </h4>
              {(!workflow.tasks || workflow.tasks.length === 0) ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No tasks or checklists created yet by agents.
                </div>
              ) : (
                workflow.tasks.map((task: WorkflowTask) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">{task.title}</div>
                      {task.details && <p className="text-slate-400 text-[11px]">{task.details}</p>}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px] uppercase">
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Audit Log */}
          {activeTab === 'audit' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Workflow Event Ledger
              </h4>
              <div className="space-y-2">
                {auditEvents.map((evt) => (
                  <div key={evt.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-semibold">{evt.event_type}</span>
                      <span className="text-[11px] text-slate-400">{new Date(evt.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Actor: <span className="text-slate-300 font-medium">{evt.actor_type}</span> ({evt.actor_id})
                    </div>
                    {evt.payload && Object.keys(evt.payload).length > 0 && (
                      <pre className="text-[10px] text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-850 overflow-x-auto">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
