import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCode2,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { WorkflowTemplate } from '../types';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const list = await apiClient.listTemplates();
        setTemplates(list);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
          Operational Workflow Templates
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Production-vetted blueprints seeded for cross-functional operations teams
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800">
                    {tmpl.category}
                  </span>
                  {tmpl.is_system && (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> System Blueprint
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-100">{tmpl.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{tmpl.description}</p>

                {/* Default Goal preview */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Default Objective
                  </span>
                  <p className="text-xs text-slate-300 line-clamp-2">{tmpl.default_goal}</p>
                </div>

                {/* Constraints & Tools */}
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Governance: Requires human approval on sensitive gates</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">ID: {tmpl.id}</span>
                <Link
                  to={`/workflows/new?template=${tmpl.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
