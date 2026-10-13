import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('nexus_token', token);
      refreshSession().then(() => {
        navigate('/dashboard');
      });
    } else {
      navigate('/login?oauth_error=Token+not+received');
    }
  }, [searchParams, navigate, refreshSession]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center p-6">
      <div className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-100">Completing Secure Single Sign-On...</h2>
        <p className="text-xs text-slate-400">Verifying session signature and establishing workspace context.</p>
      </div>
    </div>
  );
};
