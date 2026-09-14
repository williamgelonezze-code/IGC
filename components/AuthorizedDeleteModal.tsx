/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  X, 
  AlertCircle, 
  Loader2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  FileText, 
  Database, 
  CheckCircle2, 
  HardDrive 
} from 'lucide-react';
import { formatCPF, formatRE, isValidCPF, isValidRE } from '@/lib/validations';

export interface DeleteTarget {
  recordId: number | string;
  targetTable: 'operational_documents' | 'api_reports' | 'dejem_documents' | 'audit_reports' | 'igc_pm_reports';
  fileName: string;
  description?: string | null;
  fileType?: string;
  fileSize?: string | null;
}

interface AuthorizedDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: DeleteTarget | null;
  onDeleteSuccess?: (deletedFileName: string) => void;
}

export default function AuthorizedDeleteModal({
  isOpen,
  onClose,
  target,
  onDeleteSuccess,
}: AuthorizedDeleteModalProps) {
  const [cpf, setCpf] = useState('');
  const [re, setRe] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [cpfError, setCpfError] = useState('');
  const [reError, setReError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [deleting, setDeleting] = useState(false);
  const [deleteCompleted, setDeleteCompleted] = useState(false);
  const [auditInfo, setAuditInfo] = useState<{ id: number; timestamp: string } | null>(null);

  // Reset form whenever modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setCpf('');
      setRe('');
      setMasterPassword('');
      setShowPassword(false);
      setCpfError('');
      setReError('');
      setPasswordError('');
      setGeneralError('');
      setDeleteCompleted(false);
      setAuditInfo(null);
    }
  }, [isOpen, target]);

  if (!isOpen || !target) return null;

  const handleClose = () => {
    if (deleting) return;
    setCpf('');
    setRe('');
    setMasterPassword('');
    setCpfError('');
    setReError('');
    setPasswordError('');
    setGeneralError('');
    setDeleteCompleted(false);
    setAuditInfo(null);
    onClose();
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    if (formatted.length === 14) {
      if (!isValidCPF(formatted)) {
        setCpfError('CPF inválido pelo algoritmo da Receita Federal (Padrão: XXX.XXX.XXX-XX).');
      } else {
        setCpfError('');
      }
    } else {
      setCpfError('');
    }
  };

  const handleReChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRE(e.target.value);
    setRe(formatted);
    if (formatted.length === 8) {
      if (!isValidRE(formatted)) {
        setReError('RE inválido. Falha no Módulo 11 da PMESP (Padrão: XXXXXX-X).');
      } else {
        setReError('');
      }
    } else {
      setReError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!isValidCPF(cpf)) {
      setCpfError('CPF inválido pelo algoritmo da Receita Federal (Padrão: XXX.XXX.XXX-XX).');
      hasError = true;
    } else {
      setCpfError('');
    }

    if (!isValidRE(re)) {
      setReError('RE inválido. Falha no Módulo 11 da PMESP (Padrão: XXXXXX-X).');
      hasError = true;
    } else {
      setReError('');
    }

    if (!masterPassword.trim()) {
      setPasswordError('A Senha Master é obrigatória para autorizar a exclusão.');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) return;

    try {
      setDeleting(true);
      setGeneralError('');

      // Capture IP and Geolocation
      let ipAddress = '127.0.0.1';
      let locationData: any = {
        latitude: null,
        longitude: null,
        city: 'Não detectado',
        region: '',
        country: '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      };

      try {
        const ipRes = await fetch('/api/logs');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData?.clientIp) {
            ipAddress = ipData.clientIp;
          }
        }
      } catch (err) {
        console.warn('Could not detect IP from /api/logs', err);
      }

      // Browser Geolocation if available
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              locationData.latitude = pos.coords.latitude;
              locationData.longitude = pos.coords.longitude;
              resolve();
            },
            () => {
              resolve();
            },
            { timeout: 3000, enableHighAccuracy: true }
          );
        });
      }

      // Execute authorized deletion
      const res = await fetch('/api/admin/authorized-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTable: target.targetTable,
          recordId: target.recordId,
          cpf,
          re,
          masterPassword,
          locationData: {
            ...locationData,
            screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
          },
          metadata: {
            fileName: target.fileName,
            fileType: target.fileType || 'arquivo',
            description: target.description || null,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autorizar exclusão do arquivo.');
      }

      setAuditInfo({
        id: data.audit?.id || 1,
        timestamp: new Date().toLocaleString('pt-BR'),
      });
      setDeleteCompleted(true);

      if (onDeleteSuccess) {
        onDeleteSuccess(target.fileName);
      }

    } catch (err: any) {
      setGeneralError(err.message || 'Erro inesperado durante a exclusão autorizada.');
    } finally {
      setDeleting(false);
    }
  };

  const getTableFriendlyName = (table: string) => {
    switch (table) {
      case 'operational_documents':
        return 'Dados Operacionais (Planilhas XLS)';
      case 'api_reports':
        return 'Relatórios de API';
      case 'dejem_documents':
        return 'Documentos Operacionais DEJEM';
      case 'audit_reports':
        return 'Relatórios de Auditoria IA';
      default:
        return table;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl shadow-red-950/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-red-500/20 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Autorização de Exclusão no Banco SGBD
              </h3>
              <p className="text-xs text-red-300/80 font-mono">
                Ação Irreversível • Auditoria Permanente de Exclusão
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={deleting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        {deleteCompleted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center mx-auto text-red-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Arquivo Excluído com Sucesso!</h4>
              <p className="text-sm text-slate-300 mt-1">
                O registro foi removido do banco de dados e devidamente protocolado na auditoria permanente.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Arquivo Excluído:</span>
                <span className="text-red-400 font-bold truncate max-w-[200px]" title={target.fileName}>{target.fileName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Protocolo de Auditoria:</span>
                <span className="text-emerald-400 font-bold">#AUD-DEL-{auditInfo?.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Tabela de Origem:</span>
                <span className="text-slate-200">{target.targetTable} (ID: #{target.recordId})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Autorizado Por (RE/CPF):</span>
                <span className="text-slate-200">{re} • {cpf}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data/Hora da Gravação:</span>
                <span className="text-slate-200">{auditInfo?.timestamp}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Target File Info Box */}
            <div className="bg-slate-950/80 border border-red-500/20 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-red-400" />
                  Arquivo Alvo a Ser Apagado:
                </span>
                <span className="text-[10px] font-mono text-red-400/90 bg-red-950/60 border border-red-800/50 px-2 py-0.5 rounded font-bold">
                  {getTableFriendlyName(target.targetTable)}
                </span>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <HardDrive className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-mono font-bold text-white break-all" title={target.fileName}>
                    {target.fileName}
                  </p>
                  {target.description && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[360px]" title={target.description}>
                      {target.description}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    ID no Banco: #{target.recordId} {target.fileSize ? `• Tamanho: ${target.fileSize}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Critical Security Warning */}
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                A exclusão exige conferência rigorosa de <strong>CPF</strong>, <strong>RE (Módulo 11 da PM)</strong> e <strong>Senha Master</strong>. Todos os metadados, IP, Geolocalização e data/hora serão gravados permanentemente para auditoria.
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* CPF Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  CPF do Responsável (Padrão: <span className="font-mono text-cyan-400">XXX.XXX.XXX-XX</span>) *
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  disabled={deleting}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
                    cpfError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-800 focus:border-red-500 focus:ring-red-500'
                  }`}
                />
                {cpfError && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {cpfError}
                  </p>
                )}
              </div>

              {/* RE Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  RE Militar (Padrão: <span className="font-mono text-cyan-400">XXXXXX-X</span> • Módulo 11 PMESP) *
                </label>
                <input
                  type="text"
                  value={re}
                  onChange={handleReChange}
                  placeholder="Ex: 123456-7"
                  maxLength={8}
                  required
                  disabled={deleting}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
                    reError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-800 focus:border-red-500 focus:ring-red-500'
                  }`}
                />
                {reError && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {reError}
                  </p>
                )}
              </div>

              {/* Senha Master Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-red-400" />
                    Senha Master do Sistema *
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Autenticação Administrativa</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={masterPassword}
                    onChange={(e) => {
                      setMasterPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Digite a senha master autorizada"
                    required
                    disabled={deleting}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-lg bg-slate-950 border text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
                      passwordError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-800 focus:border-red-500 focus:ring-red-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {passwordError}
                  </p>
                )}
              </div>
            </div>

            {/* General Error Feedback */}
            {generalError && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={deleting}
                className="px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={deleting || !cpf || !re || !masterPassword}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-sm shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validando e Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmar Exclusão Autorizada
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
