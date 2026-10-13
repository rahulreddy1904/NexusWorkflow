import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  GitBranch,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { WorkflowRun } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';

export const WorkflowListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const currentStatus = searchParams.get('status') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState<string>(currentSearch);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.listWorkflows({
        status: currentStatus !== 'all' ? currentStatus : undefined,
        search: currentSearch || undefined,
        page: currentPage,
        limit: 10,
      });
      setWorkflows(data.items);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [currentStatus, currentSearch, currentPage]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'all') params.delete('status');
    else params.set('status', status);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) params.set('search', searchInput.trim());
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const statuses = [
    { id: 'all', label: 'All Workflows' },
    { id: 'running', label: 'Running' },
    { id: 'awaiting_approval', label: 'Awaiting Approval' },
    { id: 'completed', label: 'Completed' },
    { id: 'failed', label: 'Failed' },
    { id: 'paused', label: 'Paused' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Workflow Runs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Persisted operational executions, autonomous agent reasoning, and state machines
          </p>
        </div>

        <Link
          to="/workflows/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-brand-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStatusChange(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                currentStatus === s.id
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title or goal..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </form>
      </div>

      {/* Workflows List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading operational workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Layers className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium">No workflows match the selected criteria.</p>
            <p className="text-xs text-slate-600">Try clearing your filters or create a new workflow request.</p>
          </div>
        ) : (
          workflows.map((run) => {
            const totalSteps = run.total_steps || 4;
            const progressPct = Math.round((run.current_step_index / totalSteps) * 100);

            return (
              <Link
                key={run.id}
                to={`/workflows/${run.id}`}
                className="p-5 hover:bg-slate-850 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 block"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-100 hover:text-brand-400 transition-colors truncate">
                      {run.title}
                    </h3>
                    <PriorityBadge priority={run.priority} />
                    <span className="text-slate-600 font-mono text-[11px]">• {run.id}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{run.goal}</p>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          run.status === 'completed'
                            ? 'bg-emerald-500'
                            : run.status === 'failed'
                            ? 'bg-rose-500'
                            : 'bg-brand-500'
                        }`}
                        style={{ width: `${Math.min(progressPct, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Step {run.current_step_index} of {totalSteps}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(run.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <StatusBadge status={run.status} />
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <div>
            Showing page {currentPage} of {totalPages} ({total} workflows total)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(currentPage - 1));
                setSearchParams(params);
              }}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(currentPage + 1));
                setSearchParams(params);
              }}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
