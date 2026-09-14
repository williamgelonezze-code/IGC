'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Save, Eye, EyeOff, Lock, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCPF } from '@/lib/validations';

export default function GlobalSettingsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [authCpf, setAuthCpf] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hardcoded master credentials as requested
  const MASTER_CPF = '13507318890';
  const MASTER_PASSWORD = '@#@MASTER2026';

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setAdminPassword(data.settings?.ADMIN_PASSWORD || '@#@MASTER');
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSettings();
    }
  }, [unlocked]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const rawCpf = authCpf.replace(/\D/g, '');
    if (rawCpf === MASTER_CPF && authPassword === MASTER_PASSWORD) {
      setUnlocked(true);
    } else {
      setAuthError('Credenciais mestras inválidas.');
    }
  };

  const handleSave = async () => {
    if (!adminPassword.trim()) return;
    
    try {
      setSaving(true);
      setSaveSuccess(false);
      
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ADMIN_PASSWORD', value: adminPassword })
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save', e);
    } finally {
      setSaving(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200 relative">
        <Link href="/admin" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-full">
              <Shield className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">Acesso Restrito</h1>
          <p className="text-center text-slate-400 mb-8 text-sm">
            Esta área exige a Senha Master para alterar configurações globais.
          </p>
          
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                CPF Master (Padrão: <span className="font-mono text-rose-400">XXX.XXX.XXX-XX</span>)
              </label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono transition-colors"
                placeholder="000.000.000-00"
                value={authCpf}
                onChange={(e) => setAuthCpf(formatCPF(e.target.value))}
                maxLength={14}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Senha Master</label>
              <div className="relative">
                <input 
                  type="password" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono transition-colors"
                  placeholder="••••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            {authError && (
              <div className="text-red-400 text-sm flex items-center gap-1.5 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              Autenticar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-500" />
              Configurações Globais
            </h1>
            <p className="text-slate-400 mt-2">
              Gerenciamento de credenciais e senhas da aplicação.
            </p>
          </div>
          <Link href="/admin" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </header>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Senhas Guardadas no App
            </h2>

            <div className="space-y-6 max-w-lg">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">Senha do Painel Administrativo</label>
                <div className="relative">
                  <input 
                    type={showAdminPassword ? "text" : "password"} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-colors"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                  >
                    {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Esta é a senha utilizada juntamente com o CPF e RE para acesso à área administrativa.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  {saveSuccess && (
                    <span className="text-emerald-400 text-sm flex items-center gap-1">
                      <Settings className="w-4 h-4" /> Atualizado com sucesso
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Alterar Dado
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
