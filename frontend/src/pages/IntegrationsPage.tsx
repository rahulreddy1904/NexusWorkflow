import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Database,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { SystemStatusData } from '../types';

export const IntegrationsPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getConfigStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load system config status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading || !status) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        Inspecting system integration health...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            AI & Integrations Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verification of backend credentials, AI providers, and database persistence
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Google Gemini AI Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Google Gemini AI Engine</h3>
                <span className="text-xs text-slate-400">Autonomous Reasoning & Multi-Agent Planning</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                status.geminiAi.configured
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {status.geminiAi.status}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Configured Model:</span>
              <span className="font-mono text-purple-300 font-semibold">{status.geminiAi.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Request Timeout:</span>
              <span className="font-mono text-slate-300">{status.geminiAi.timeoutMs}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Execution Mode:</span>
              <span className="font-semibold text-slate-200">
                {status.geminiAi.configured ? 'Google Gemini 3.8 Flash (Live)' : 'Rule-Based Offline Fallback'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{status.geminiAi.instructions}</p>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-brand-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Get Gemini API Key (Google AI Studio)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 2. Database (Supabase PostgreSQL) Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Primary Database</h3>
                <span className="text-xs text-slate-400">Supabase PostgreSQL Schema & State Storage</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                status.database.connected
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}
            >
              {status.database.connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Storage Engine:</span>
              <span className="font-semibold text-emerald-300">{status.database.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Connection Host:</span>
              <span className="font-mono text-slate-300">{status.database.host || 'local'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Query Ping Latency:</span>
              <span className="font-mono text-slate-300">{status.database.latencyMs}ms</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{status.database.instructions}</p>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-brand-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Supabase Cloud Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 3. Google OAuth 2.0 Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Google OAuth 2.0</h3>
                <span className="text-xs text-slate-400">Server-Side Single Sign-On</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                status.oauth.google.configured
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {status.oauth.google.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-slate-400 font-medium">Authorized Redirect URI:</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={status.oauth.google.callbackUrl}
                className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300"
              />
              <button
                onClick={() => handleCopy('google', status.oauth.google.callbackUrl)}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1"
              >
                {copiedKey === 'google' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'google' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <a
              href={status.oauth.google.setupGuideUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brand-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Google Cloud Console Credentials</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 4. Facebook OAuth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Facebook OAuth</h3>
                <span className="text-xs text-slate-400">Meta Login Provider</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                status.oauth.facebook.configured
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {status.oauth.facebook.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-slate-400 font-medium">Valid OAuth Redirect URI:</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={status.oauth.facebook.callbackUrl}
                className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300"
              />
              <button
                onClick={() => handleCopy('facebook', status.oauth.facebook.callbackUrl)}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1"
              >
                {copiedKey === 'facebook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'facebook' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <a
              href={status.oauth.facebook.setupGuideUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brand-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Meta for Developers Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
