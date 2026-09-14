'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, CheckCircle2, Lock, Key } from 'lucide-react';
import { isValidCPF, isValidRE, formatCPF, formatRE } from '@/lib/validations';

export default function AdminButton({ 
  targetRoute = '/admin', 
  buttonIcon = Lock, 
  buttonLabel,
  buttonClassName = "absolute top-6 right-6 md:top-8 md:right-8 p-2 text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 rounded-full transition-all duration-300"
}: { 
  targetRoute?: string,
  buttonIcon?: any,
  buttonLabel?: string,
  buttonClassName?: string
}) {
  const [showModal, setShowModal] = useState(false);
  const ButtonIcon = buttonIcon;
  
  const [cpf, setCpf] = useState('');
  const [re, setRe] = useState('');
  const [password, setPassword] = useState('');
  
  const [cpfError, setCpfError] = useState('');
  const [reError, setReError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (cpf.length === 14) {
      if (!isValidCPF(cpf)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCpfError('CPF inválido pelo algoritmo da Receita Federal (Padrão: XXX.XXX.XXX-XX)');
      }
    }
  }, [cpf]);

  useEffect(() => {
    if (re.length === 8) {
      if (!isValidRE(re)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReError('RE inválido. Falha no Módulo 11 da PMESP (Padrão: XXXXXX-X)');
      }
    }
  }, [re]);

  const handleValidate = async () => {
    let valid = true;
    setCpfError('');
    setReError('');
    setPasswordError('');

    if (cpf.length !== 14 || !isValidCPF(cpf)) {
      setCpfError('CPF inválido pelo algoritmo da Receita Federal (Padrão: XXX.XXX.XXX-XX)');
      valid = false;
    }

    if (re.length !== 8 || !isValidRE(re)) {
      setReError('RE inválido. Falha no Módulo 11 da PMESP (Padrão: XXXXXX-X)');
      valid = false;
    }
    
    // Fetch current admin password from settings
    let currentAdminPassword = '@#@MASTER';
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.ADMIN_PASSWORD) {
          currentAdminPassword = data.settings.ADMIN_PASSWORD;
        }
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }

    if (password !== currentAdminPassword) {
      setPasswordError('dados errados');
      valid = false;
    }

    if (valid) {
      setIsSuccess(true);
      
      try {
        let ipAddress = 'unknown';
        let locationData: any = {
          city: 'Desconhecido',
          region: '',
          country: '',
          latitude: null,
          longitude: null,
          precise: false,
        };
        
        try {
          // Obtendo IPv4 ou IPv6 real do cliente
          const ipRes = await fetch('https://api64.ipify.org?format=json').catch(() => null);
          if (ipRes && ipRes.ok) {
            try {
              const ipData = await ipRes.json();
              if (ipData?.ip) ipAddress = ipData.ip;
            } catch {
              // Ignore non-json response
            }
          }

          const geoRes = await fetch('https://ipapi.co/json/').catch(() => null);
          if (geoRes && geoRes.ok) {
            try {
              const geo = await geoRes.json();
              if (ipAddress === 'unknown' && geo?.ip) ipAddress = geo.ip;
              if (geo) {
                locationData.city = geo.city || 'Desconhecido';
                locationData.region = geo.region || '';
                locationData.country = geo.country_name || '';
                locationData.latitude = geo.latitude || null;
                locationData.longitude = geo.longitude || null;
              }
            } catch {
              // Ignore non-json response
            }
          }
        } catch (e) {
          console.error("Failed to fetch geo data", e);
        }

        if ('geolocation' in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 0 });
            });
            locationData.latitude = pos.coords.latitude;
            locationData.longitude = pos.coords.longitude;
            locationData.precise = true;
          } catch(e) {
            console.log("Precise geolocation denied or timeout", e);
          }
        }

        const logEntry = {
          cpf: cpf + ' (ADMIN)',
          re,
          ipAddress,
          locationData,
          timestamp: new Date().toISOString()
        };

        const existingLogs = JSON.parse(localStorage.getItem('access_logs') || '[]');
        existingLogs.push(logEntry);
        localStorage.setItem('access_logs', JSON.stringify(existingLogs));

        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      } catch (error) {
        console.error("Error saving admin logs", error);
      }

      setTimeout(() => {
        setIsSuccess(false);
        setShowModal(false);
        router.push(targetRoute);
      }, 1200);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={buttonClassName}
        title={buttonLabel || "Acesso do Administrador"}
      >
        {buttonLabel ? (
          <div className="flex items-center gap-2">
            <ButtonIcon className="w-5 h-5" />
            <span className="font-semibold text-sm">{buttonLabel}</span>
          </div>
        ) : (
          <ButtonIcon className="w-5 h-5" />
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            
            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-500 ${isSuccess ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <Key className="w-8 h-8" />}
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Painel Administrativo</h2>
              <p className="text-slate-400 text-sm text-center mt-2">
                Autenticação extra necessária.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  CPF (Padrão: <span className="font-mono text-cyan-400">XXX.XXX.XXX-XX</span>)
                </label>
                <input
                  type="text"
                  value={cpf}
                  maxLength={14}
                  onChange={(e) => {
                    setCpf(formatCPF(e.target.value));
                    if (cpfError) setCpfError('');
                  }}
                  placeholder="000.000.000-00"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
                    cpfError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-800 focus:border-slate-600 focus:ring-slate-600'
                  }`}
                />
                {cpfError && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {cpfError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  RE Militar (Padrão: <span className="font-mono text-cyan-400">XXXXXX-X</span> • Módulo 11 PMESP)
                </label>
                <input
                  type="text"
                  value={re}
                  maxLength={8}
                  onChange={(e) => {
                    setRe(formatRE(e.target.value));
                    if (reError) setReError('');
                  }}
                  placeholder="Ex: 123456-7"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 transition-all uppercase ${
                    reError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-800 focus:border-slate-600 focus:ring-slate-600'
                  }`}
                />
                {reError && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {reError}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Senha Master
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
                    passwordError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-800 focus:border-slate-600 focus:ring-slate-600'
                  }`}
                />
                {passwordError && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {passwordError}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidate}
                disabled={isSuccess}
                className={`flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                  isSuccess 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-red-500/90 hover:bg-red-500 text-white'
                }`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Liberado
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Acessar
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
