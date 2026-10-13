import React, { useState } from 'react';
import { WorkflowArtifact } from '../../types';
import { FileText, Copy, Check, Download, Layers } from 'lucide-react';

interface ArtifactViewerProps {
  artifacts: WorkflowArtifact[];
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifacts }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (artifacts.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">No artifacts generated for this workflow yet.</p>
        <p className="text-xs text-slate-600 mt-1">Artifacts are compiled upon step completion or final QA review.</p>
      </div>
    );
  }

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (artifact: WorkflowArtifact) => {
    const ext = artifact.type === 'json' ? 'json' : 'md';
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {artifacts.map((art) => (
        <div key={art.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-brand-950/60 text-brand-400 border border-brand-800/60">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">{art.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="uppercase font-semibold text-brand-400">{art.type}</span>
                  <span>•</span>
                  <span>Generated {new Date(art.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(art.id, art.content)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/80 transition-colors text-xs flex items-center gap-1 px-2.5"
                title="Copy artifact content"
              >
                {copiedId === art.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleDownload(art)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/80 transition-colors text-xs flex items-center gap-1 px-2.5"
                title="Download artifact file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Content Box */}
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/80 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {art.content}
          </div>
        </div>
      ))}
    </div>
  );
};
