import React from 'react';
import { WorkflowStep } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Cpu,
  Terminal,
  Brain,
  AlertCircle,
  RotateCcw,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface StepInspectorProps {
  step: WorkflowStep;
  onRetry?: (stepId: string) => void;
  isRetrying?: boolean;
}

export const StepInspector: React.FC<StepInspectorProps> = ({
  step,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-brand-400 font-semibold">
              STEP #{step.step_index}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">ID: {step.id}</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">{step.title}</h3>
          <p className="text-xs text-slate-400 mt-1">{step.description}</p>
        </div>
        <StatusBadge status={step.status} />
      </div>

      {/* Agent Reasoning */}
      {step.agent_reasoning && (
        <div className="bg-brand-950/20 border border-brand-900/50 rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
            <Brain className="w-3.5 h-3.5" />
            <span>Agent Reasoning & Thought Signature</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed italic">
            "{step.agent_reasoning}"
          </p>
        </div>
      )}

      {/* Tool Information */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-brand-400" />
          <span>Registered Tool Action:</span>
          <code className="px-2 py-0.5 rounded bg-slate-800 text-brand-300 font-mono text-xs border border-slate-700">
            {step.tool_name}
          </code>
        </div>

        {/* Arguments */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Tool Arguments (Validated JSON):
          </span>
          <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-44">
            {JSON.stringify(
              typeof step.tool_arguments === 'string'
                ? JSON.parse(step.tool_arguments)
                : step.tool_arguments,
              null,
              2
            )}
          </pre>
        </div>

        {/* Results */}
        {step.tool_result && (
          <div className="space-y-1 pt-2">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Execution Output (Persisted State):</span>
            </span>
            <pre className="bg-slate-950 p-3 rounded-lg border border-emerald-950 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-48">
              {JSON.stringify(
                typeof step.tool_result === 'string'
                  ? JSON.parse(step.tool_result)
                  : step.tool_result,
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Error state & Retry */}
      {step.error_message && (
        <div className="bg-rose-950/30 border border-rose-900 rounded-lg p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <span>Execution Failure Alert</span>
          </div>
          <p className="text-xs text-rose-300 font-mono">{step.error_message}</p>
          {onRetry && (
            <button
              onClick={() => onRetry(step.id)}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Retry Step Execution</span>
            </button>
          )}
        </div>
      )}

      {/* Metadata footer */}
      <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div>
          <span className="text-slate-400">Assigned Agent: </span>
          <span className="font-semibold text-slate-300 capitalize">
            {step.assigned_agent.replace('_', ' ')}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Retries: </span>
          <span className="font-semibold text-slate-300 font-mono">
            {step.retry_count} / {step.max_retries}
          </span>
        </div>
        {step.started_at && (
          <div className="col-span-2 text-[11px] text-slate-400">
            Started: {new Date(step.started_at).toLocaleString()}
            {step.completed_at && ` • Finished: ${new Date(step.completed_at).toLocaleString()}`}
          </div>
        )}
      </div>
    </div>
  );
};
