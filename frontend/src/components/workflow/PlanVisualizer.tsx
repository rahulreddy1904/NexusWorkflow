import React from 'react';
import { WorkflowStep } from '../../types';
import {
  CheckCircle2,
  Clock,
  Play,
  ShieldAlert,
  XCircle,
  Cpu,
  Bot,
  Search,
  CheckCheck,
  FileCheck2,
} from 'lucide-react';

interface PlanVisualizerProps {
  steps: WorkflowStep[];
  selectedStepId?: string;
  onSelectStep: (step: WorkflowStep) => void;
}

export const PlanVisualizer: React.FC<PlanVisualizerProps> = ({
  steps,
  selectedStepId,
  onSelectStep,
}) => {
  const getAgentBadge = (agent: string) => {
    switch (agent) {
      case 'triage_specialist':
        return { label: 'Triage Specialist', icon: Bot, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800' };
      case 'researcher':
        return { label: 'Research Agent', icon: Search, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800' };
      case 'executor':
        return { label: 'Execution Specialist', icon: Cpu, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' };
      case 'reviewer':
        return { label: 'Quality Reviewer', icon: CheckCheck, color: 'text-purple-400 bg-purple-950/40 border-purple-800' };
      default:
        return { label: agent, icon: Bot, color: 'text-slate-400 bg-slate-900 border-slate-700' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'running':
        return <Play className="w-5 h-5 text-blue-400 animate-pulse" />;
      case 'awaiting_approval':
        return <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const isSelected = selectedStepId === step.id;
        const agent = getAgentBadge(step.assigned_agent);
        const AgentIcon = agent.icon;

        return (
          <div
            key={step.id}
            onClick={() => onSelectStep(step)}
            className={`cursor-pointer rounded-xl p-4 transition-all duration-200 border ${
              isSelected
                ? 'bg-slate-800/90 border-brand-500 shadow-md shadow-brand-500/10 ring-1 ring-brand-500/30'
                : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                {/* Step index & status indicator */}
                <div className="flex flex-col items-center mt-0.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-semibold text-slate-300">
                    {idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="w-0.5 h-6 bg-slate-800 mt-2"></div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-semibold text-slate-100">{step.title}</h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${agent.color}`}
                    >
                      <AgentIcon className="w-3 h-3" />
                      <span>{agent.label}</span>
                    </span>
                    {step.requires_approval && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800">
                        HITL Gated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{step.description}</p>
                </div>
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0 mt-1">{getStatusIcon(step.status)}</div>
            </div>

            {/* Micro progress footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="font-mono text-slate-400">
                Tool: <span className="text-slate-300 font-medium">{step.tool_name}</span>
              </div>
              <div className="capitalize font-medium">
                Status: <span className="text-slate-200">{step.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
