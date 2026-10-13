import React from 'react';
import { Play, CheckCircle2, AlertTriangle, XCircle, Clock, Pause, ShieldAlert, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const norm = status?.toLowerCase() || 'pending';

  let config = {
    label: norm.replace('_', ' ').toUpperCase(),
    icon: Clock,
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-700',
    pulse: false,
  };

  switch (norm) {
    case 'running':
      config = {
        label: 'RUNNING',
        icon: Play,
        bg: 'bg-blue-950/80',
        text: 'text-blue-400',
        border: 'border-blue-800',
        pulse: true,
      };
      break;
    case 'planning':
      config = {
        label: 'PLANNING',
        icon: Sparkles,
        bg: 'bg-purple-950/80',
        text: 'text-purple-400',
        border: 'border-purple-800',
        pulse: true,
      };
      break;
    case 'awaiting_approval':
      config = {
        label: 'AWAITING APPROVAL',
        icon: ShieldAlert,
        bg: 'bg-amber-950/80',
        text: 'text-amber-400',
        border: 'border-amber-800',
        pulse: true,
      };
      break;
    case 'completed':
      config = {
        label: 'COMPLETED',
        icon: CheckCircle2,
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-400',
        border: 'border-emerald-800',
        pulse: false,
      };
      break;
    case 'failed':
      config = {
        label: 'FAILED',
        icon: XCircle,
        bg: 'bg-rose-950/80',
        text: 'text-rose-400',
        border: 'border-rose-800',
        pulse: false,
      };
      break;
    case 'paused':
      config = {
        label: 'PAUSED',
        icon: Pause,
        bg: 'bg-slate-900/80',
        text: 'text-slate-400',
        border: 'border-slate-700',
        pulse: false,
      };
      break;
    case 'cancelled':
      config = {
        label: 'CANCELLED',
        icon: AlertTriangle,
        bg: 'bg-slate-900/80',
        text: 'text-slate-400',
        border: 'border-slate-700',
        pulse: false,
      };
      break;
  }

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${padding} ${className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.pulse ? 'animate-pulse' : ''}`} />
      <span>{config.label}</span>
    </span>
  );
};
