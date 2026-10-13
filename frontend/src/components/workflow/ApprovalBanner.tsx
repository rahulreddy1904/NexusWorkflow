import React, { useState } from 'react';
import { WorkflowApproval } from '../../types';
import { ShieldAlert, Check, X, AlertTriangle } from 'lucide-react';

interface ApprovalBannerProps {
  approval: WorkflowApproval;
  onDecide: (approved: boolean, note: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const ApprovalBanner: React.FC<ApprovalBannerProps> = ({
  approval,
  onDecide,
  isSubmitting = false,
}) => {
  const [note, setNote] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);

  const getRiskColor = (level: string) => {
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
    <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-600/50 rounded-xl p-5 shadow-lg shadow-amber-950/20 space-y-4">
      {/* Title & Risk */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Human-in-the-Loop Governance Gate
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getRiskColor(
                  approval.risk_level
                )}`}
              >
                Risk Level: {approval.risk_level}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100">{approval.action_summary}</h3>
            <p className="text-xs text-slate-300 mt-1">{approval.risk_reason}</p>
          </div>
        </div>
      </div>

      {/* Decision Note Field */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-400">
          Operator Review Note / Policy Feedback (Optional):
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Verified SOC2 scope with Compliance Lead. Authorization confirmed."
          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
        <button
          onClick={() => onDecide(false, note)}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold disabled:opacity-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject & Halt</span>
        </button>
        <button
          onClick={() => onDecide(true, note)}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Approve Action & Resume Execution</span>
        </button>
      </div>
    </div>
  );
};
