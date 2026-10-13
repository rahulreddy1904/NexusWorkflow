import React from 'react';

interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const norm = priority?.toLowerCase() || 'normal';

  let color = 'bg-slate-800 text-slate-300 border-slate-700';
  if (norm === 'low') color = 'bg-blue-950/60 text-blue-400 border-blue-900';
  if (norm === 'high') color = 'bg-amber-950/60 text-amber-400 border-amber-900';
  if (norm === 'urgent') color = 'bg-rose-950/60 text-rose-400 border-rose-900 font-semibold';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border uppercase tracking-wider ${color}`}>
      {norm}
    </span>
  );
};
