import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Check,
  X,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { WorkflowApproval } from '../types';

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<WorkflowApproval[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.listApprovals(filter);
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  const handleDecision = async (id: string, approved: boolean) => {
    setIsSubmitting(id);
    const note = decisionNotes[id] || '';
    try {
      await apiClient.decideApproval(id, approved, note);
      setBannerMsg(`Approval ${approved ? 'approved' : 'rejected'} successfully. Workflow engine resumed.`);
      setTimeout(() => setBannerMsg(null), 4000);
      await fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to resolve approval.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'high':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'medium':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Human Approval Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review and govern high-impact actions, financial thresholds, and policy exceptions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'pending'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div className="rounded-xl bg-emerald-950/40 border border-emerald-900 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{bannerMsg}</span>
        </div>
      )}

      {/* Approvals List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading approval queue...</div>
      ) : approvals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No Approvals Waiting in Queue</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All autonomous agent workflows are executing smoothly within configured policy risk thresholds.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((appr) => {
            const isPending = appr.status === 'pending';

            return (
              <div
                key={appr.id}
                className={`bg-slate-900 border rounded-2xl p-6 space-y-4 transition-all ${
                  isPending
                    ? 'border-amber-600/60 shadow-lg shadow-amber-950/15'
                    : 'border-slate-800 opacity-80'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400">Run:</span>
                      <Link
                        to={`/workflows/${appr.workflow_run_id}`}
                        className="text-xs font-bold text-brand-400 hover:underline"
                      >
                        {appr.workflow_title || appr.workflow_run_id}
                      </Link>
                      <span className="text-slate-600">•</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getRiskBadge(appr.risk_level)}`}>
                        {appr.risk_level} Risk
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{appr.action_summary}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase self-start sm:self-auto border ${
                      isPending
                        ? 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                        : appr.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}
                  >
                    {appr.status}
                  </span>
                </div>

                {/* Risk Rationale */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <span className="font-semibold text-slate-300 block">Governance Evaluation Rationale:</span>
                  <p className="text-slate-400 leading-relaxed">{appr.risk_reason}</p>
                </div>

                {/* If resolved, show decision note */}
                {!isPending && appr.decision_note && (
                  <div className="text-xs text-slate-400 italic">
                    Operator Decision Note: "{appr.decision_note}"
                  </div>
                )}

                {/* Action Section (if pending) */}
                {isPending && (
                  <div className="space-y-3 pt-2">
                    <input
                      type="text"
                      placeholder="Add an optional review or audit verification note..."
                      value={decisionNotes[appr.id] || ''}
                      onChange={(e) =>
                        setDecisionNotes({
                          ...decisionNotes,
                          [appr.id]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    />

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleDecision(appr.id, false)}
                        disabled={isSubmitting === appr.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold disabled:opacity-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject & Stop Workflow</span>
                      </button>

                      <button
                        onClick={() => handleDecision(appr.id, true)}
                        disabled={isSubmitting === appr.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md disabled:opacity-50 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Continue</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
