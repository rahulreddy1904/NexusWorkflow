import React, { useEffect, useState } from 'react';
import { History, Search, Filter, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { apiClient } from '../api/client';
import { AuditEvent } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.listAuditLogs({
        limit: 100,
        type: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
      });
      setEvents(data);
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventTypeFilter]);

  const eventTypes = [
    { id: 'all', label: 'All Events' },
    { id: 'workflow.created', label: 'Workflows Created' },
    { id: 'workflow.planned', label: 'Workflows Planned' },
    { id: 'step.started', label: 'Step Started' },
    { id: 'tool.executed', label: 'Tools Executed' },
    { id: 'approval.requested', label: 'Approvals Requested' },
    { id: 'approval.decided', label: 'Approvals Decided' },
    { id: 'workflow.completed', label: 'Workflows Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            System Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable chronological ledger of multi-agent decisions, tool executions, and operator approvals
          </p>
        </div>

        {/* Filter select */}
        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500 self-start sm:self-auto"
        >
          {eventTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading audit ledger...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No audit events match the selected criteria.</div>
        ) : (
          events.map((evt) => {
            const isExpanded = expandedId === evt.id;

            return (
              <div key={evt.id} className="p-4 space-y-2 hover:bg-slate-850/50 transition-colors">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                      {evt.event_type}
                    </span>
                    <span className="text-xs text-slate-400">
                      Actor: <strong className="text-slate-200 capitalize">{evt.actor_type}</strong>
                      {evt.actor_id && <span className="text-slate-400"> ({evt.actor_id})</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono text-[11px] text-slate-400">ID: {evt.id}</span>
                    <span>•</span>
                    <span>{new Date(evt.created_at).toLocaleString()}</span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[11px] transition-colors ml-2"
                    >
                      {isExpanded ? 'Hide Payload' : 'View Payload'}
                    </button>
                  </div>
                </div>

                {/* Expanded Payload view */}
                {isExpanded && (
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 mt-2">
                    {JSON.stringify(evt.payload, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
