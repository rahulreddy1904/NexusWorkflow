import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  FileCode2,
  Send,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { WorkflowTemplate } from '../types';

export const NewWorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTemplateId = searchParams.get('template') || '';

  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);

  const [title, setTitle] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [constraints, setConstraints] = useState<string[]>([]);
  const [newConstraint, setNewConstraint] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const list = await apiClient.listTemplates();
        setTemplates(list);

        if (initialTemplateId) {
          const matched = list.find((t) => t.id === initialTemplateId);
          if (matched) applyTemplate(matched);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    loadTemplates();
  }, [initialTemplateId]);

  const applyTemplate = (tmpl: WorkflowTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setTitle(tmpl.name);
    setGoal(tmpl.default_goal);
    setContext(tmpl.default_context || '');
    setConstraints(tmpl.default_constraints || []);
  };

  const handleTemplateSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    if (!tId) return;

    const tmpl = templates.find((t) => t.id === tId);
    if (tmpl) applyTemplate(tmpl);
  };

  const handleAddConstraint = () => {
    if (!newConstraint.trim()) return;
    setConstraints([...constraints, newConstraint.trim()]);
    setNewConstraint('');
  };

  const handleRemoveConstraint = (idx: number) => {
    setConstraints(constraints.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await apiClient.createWorkflow({
        title,
        goal,
        context: context || undefined,
        constraints,
        priority,
        templateId: selectedTemplateId || undefined,
      });

      navigate(`/workflows/${result.runId}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit and plan workflow.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
          Submit Operational Request
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Define an operational objective for autonomous AI agent planning, reasoning, and tool execution.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-900 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Template Quick Selection */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-brand-400" />
              <span>Operational Workflow Template (Optional)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">Pre-configures goals & constraints</span>
          </div>

          <select
            value={selectedTemplateId}
            onChange={handleTemplateSelectChange}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">-- Custom Request (Start from scratch) --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Workflow Title */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">Workflow Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Production Redis Latency Spike Triage"
            className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Goal */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">
            Primary Operational Goal (What the AI agents must accomplish)
          </label>
          <textarea
            required
            rows={3}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Analyze latency telemetry, isolate root bottleneck, formulate mitigation tasks, and compile formal RCA artifact."
            className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Operational Context */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">
            Background Context & Relevant Parameters (Optional)
          </label>
          <textarea
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Cluster redis-east-01 reported 2400ms p99 at 14:15 UTC. Memory consumption at 88%."
            className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Operational Constraints */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Operational Constraints & Governance Rules</span>
            <span className="text-[11px] text-slate-500 font-normal">
              High-risk constraints enforce Human Approvals
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newConstraint}
              onChange={(e) => setNewConstraint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddConstraint();
                }
              }}
              placeholder="e.g. Do not reboot live database cluster without human approval"
              className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={handleAddConstraint}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {constraints.length > 0 && (
            <div className="space-y-1.5 pt-2">
              {constraints.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                    <span>{c}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveConstraint(idx)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Selector */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">Priority Level</label>
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border ${
                  priority === p
                    ? 'bg-brand-600/20 text-brand-300 border-brand-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Planner Agent autonomously compiles DAG on submission</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !title.trim() || !goal.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Decomposing & Planning...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit & Orchestrate</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
