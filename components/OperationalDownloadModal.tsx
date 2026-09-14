'use client';

import { useState } from 'react';
import { ShieldCheck, Download, X, AlertCircle, Loader2, FileSpreadsheet, MapPin, CheckCircle2 } from 'lucide-react';
import { formatCPF, formatRE, isValidCPF, isValidRE } from '@/lib/validations';

interface OperationalDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: number;
    fileName: string;
    fileSize?: string | null;
    fileType?: string;
    description?: string | null;
  } | null;
  onDownloadSuccess?: () => void;
}

export default function OperationalDownloadModal({
  isOpen,
  onClose,
  document,
  onDownloadSuccess,
}: OperationalDownloadModalProps) {
  const [cpf, setCpf] = useState('');
  const [re, setRe] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [reError, setReError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [auditInfo, setAuditInfo] = useState<{ id: number; timestamp: string } | null>(null);

  if (!isOpen || !document) return null;

  const handleClose = () => {
    setCpf('');
    setRe('');
    setCpfError('');
    setReError('');
    setGeneralError('');
    setDownloadCompleted(false);
    setAuditInfo(null);
    onClose();
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

    if (hasError) return;

    try {
      setDownloading(true);
      setGeneralError('');

      // Capture IP and Geolocation
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
        const ipRes = await fetch('https://api64.ipify.org?format=json').catch(() => null);
        if (ipRes && ipRes.ok) {
          const ipJson = await ipRes.json().catch(() => null);
          if (ipJson?.ip) ipAddress = ipJson.ip;
        }

        const geoRes = await fetch('https://ipapi.co/json/').catch(() => null);
        if (geoRes && geoRes.ok) {
          const geoJson = await geoRes.json().catch(() => null);
          if (geoJson) {
            locationData.city = geoJson.city || 'Desconhecido';
            locationData.region = geoJson.region || '';
            locationData.country = geoJson.country_name || '';
            locationData.latitude = geoJson.latitude || null;
            locationData.longitude = geoJson.longitude || null;
          }
        }
      } catch (geoErr) {
        console.warn('Geolocation lookup notice:', geoErr);
      }

      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, maximumAge: 0 });
          });
          locationData.latitude = pos.coords.latitude;
          locationData.longitude = pos.coords.longitude;
          locationData.precise = true;
        } catch {
          // Geolocation optional fallback
        }
      }

      // Authorize and trigger download via API
      const res = await fetch(`/api/operational-docs/${document.id}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadedByCpf: cpf,
          downloadedByRe: re,
          ipAddress,
          locationData,
          metadata: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconhecido',
            downloadTime: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autorizar download');
      }

      // Download file in browser
      if (data.fileData) {
        let downloadUrl = data.fileData;
        if (!downloadUrl.startsWith('data:')) {
          downloadUrl = `data:application/vnd.ms-excel;base64,${data.fileData}`;
        }

        const a = window.document.createElement('a');
        a.href = downloadUrl;
        a.download = data.fileName || document.fileName;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      }

      setDownloadCompleted(true);
      setAuditInfo({
        id: data.downloadId,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });

      if (onDownloadSuccess) {
        onDownloadSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setGeneralError(err.message || 'Erro ao realizar download autorizado.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Autorização de Download (XLS)</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Segurança Operacional • Validação de Credenciais PM
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* File Card Info */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                  {document.fileType?.toUpperCase() || 'XLS'}
                </span>
                <p className="text-white font-medium text-sm break-all">{document.fileName}</p>
                {document.description && (
                  <p className="text-slate-400 text-xs line-clamp-2">{document.description}</p>
                )}
              </div>
              {document.fileSize && (
                <span className="text-xs text-slate-400 font-mono shrink-0 ml-2">{document.fileSize}</span>
              )}
            </div>
          </div>

          {generalError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {downloadCompleted ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Download Concluído com Sucesso!</h4>
                <p className="text-slate-400 text-xs">
                  O arquivo XLS foi transferido e o registro de auditoria foi armazenado no banco de dados SGBD Cloud.
                </p>
              </div>

              {auditInfo && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-left space-y-1 font-mono text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registro de Auditoria:</span>
                    <span className="text-emerald-400 font-bold">#{auditInfo.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Horário:</span>
                    <span>{auditInfo.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operador:</span>
                    <span>CPF {cpf} (RE {re})</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Concluir e Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-start gap-2.5 text-xs text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Por determinação de segurança orgânica, o download de dados operacionais em planilha requer identificação funcional e registra metadados de acesso (CPF, RE, IP e Geolocalização).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  CPF do Policial Militar (Padrão: <span className="font-mono text-emerald-400">XXX.XXX.XXX-XX</span>)
                </label>
                <input
                  type="text"
                  className={`w-full bg-slate-950 border ${
                    cpfError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-800'
                  } rounded-lg px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors`}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => {
                    const val = formatCPF(e.target.value);
                    setCpf(val);
                    if (val.length === 14) {
                      if (!isValidCPF(val)) {
                        setCpfError('CPF inválido pelo algoritmo da Receita Federal (Padrão: XXX.XXX.XXX-XX).');
                      } else {
                        setCpfError('');
                      }
                    } else {
                      setCpfError('');
                    }
                  }}
                  maxLength={14}
                  required
                />
                {cpfError && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium">{cpfError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  RE Militar (Padrão: <span className="font-mono text-emerald-400">XXXXXX-X</span> • Módulo 11 PMESP)
                </label>
                <input
                  type="text"
                  className={`w-full bg-slate-950 border ${
                    reError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-800'
                  } rounded-lg px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors uppercase`}
                  placeholder="Ex: 123456-7"
                  value={re}
                  onChange={(e) => {
                    const val = formatRE(e.target.value);
                    setRe(val);
                    if (val.length === 8) {
                      if (!isValidRE(val)) {
                        setReError('RE inválido. Falha no Módulo 11 da PMESP (Padrão: XXXXXX-X).');
                      } else {
                        setReError('');
                      }
                    } else {
                      setReError('');
                    }
                  }}
                  maxLength={8}
                  required
                />
                {reError && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium">{reError}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={downloading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-emerald-950/40 text-sm"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando Credenciais e Baixando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Autorizar e Baixar Arquivo XLS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
