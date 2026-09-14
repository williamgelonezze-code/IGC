'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  X, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet, 
  CheckCircle2, 
  Database, 
  Download, 
  Layers, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Info
} from 'lucide-react';
import { formatCPF, formatRE, isValidCPF, isValidRE } from '@/lib/validations';

interface OperationalStandardizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: number;
    fileName: string;
    fileSize?: string | null;
    fileType?: string;
    description?: string | null;
  } | null;
  onSuccess?: () => void;
  onNavigateToProcessedTab?: () => void;
}

export default function OperationalStandardizeModal({
  isOpen,
  onClose,
  document,
  onSuccess,
  onNavigateToProcessedTab,
}: OperationalStandardizeModalProps) {
  const [cpf, setCpf] = useState('');
  const [re, setRe] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [reError, setReError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [completedResult, setCompletedResult] = useState<any | null>(null);

  if (!isOpen || !document) return null;

  const handleClose = () => {
    if (processing) return;
    setCpf('');
    setRe('');
    setCpfError('');
    setReError('');
    setGeneralError('');
    setCompletedResult(null);
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
      setProcessing(true);
      setGeneralError('');

      // Capture IP and Geolocation
      let ipAddress = '127.0.0.1';
      let latitude: number | null = null;
      let longitude: number | null = null;
      let locationData: any = { city: 'São Paulo', region: 'SP', country: 'Brasil' };

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
            latitude = geoJson.latitude || null;
            longitude = geoJson.longitude || null;
            locationData = {
              city: geoJson.city,
              region: geoJson.region,
              country: geoJson.country_name,
            };
          }
        }
      } catch (networkErr) {
        console.warn('Não foi possível obter geolocalização exata:', networkErr);
      }

      // Try HTML5 Geolocation API for maximum GPS accuracy
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        try {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
                resolve();
              },
              () => resolve(),
              { timeout: 2000 }
            );
          });
        } catch {
          // ignore
        }
      }

      const res = await fetch(`/api/operational-docs/${document.id}/standardize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validatorRe: re,
          validatorCpf: cpf,
          ipAddress,
          latitude,
          longitude,
          locationData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar e padronizar a planilha.');
      }

      setCompletedResult(data.processed);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setGeneralError(err.message || 'Erro ao executar padronização.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadNewXls = () => {
    if (!completedResult || !completedResult.fileData) return;
    const a = window.document.createElement('a');
    a.href = completedResult.fileData;
    a.download = completedResult.nomeNovoArquivo || 'DADOS_CAP_PROCESSADOS.xls';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Padronização de Dados CAP (XLS)
              </h2>
              <p className="text-xs text-slate-400">
                Rotina inteligente de desduplicação por <span className="font-mono text-indigo-400 font-semibold">NumeroBO</span> e consolidação de <span className="font-mono text-indigo-400 font-semibold">Historico</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={processing}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Target File Info */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planilha de Origem</p>
                <p className="text-sm font-medium text-slate-200 truncate">{document.fileName}</p>
                <p className="text-xs text-slate-400">Identificador Operacional: #{document.id}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 shrink-0">
              Rotina CAP
            </span>
          </div>

          {!completedResult ? (
            <>
              {/* Explanation of Business Rule */}
              <div className="bg-indigo-950/20 border border-indigo-800/30 rounded-xl p-4 space-y-2 text-xs text-indigo-200">
                <div className="flex items-center gap-2 font-semibold text-indigo-300">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                  Regras Oficiais do Processamento:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>O sistema examinará cada linha do arquivo verificando a coluna <strong className="text-white">NumeroBO</strong>.</li>
                  <li>Em caso de linhas duplicadas: <strong className="text-emerald-400">a última linha permanecerá</strong>.</li>
                  <li>A coluna <strong className="text-white">Historico</strong> receberá todos os dados das outras linhas repetidas unificados.</li>
                  <li>As linhas repetidas anteriores serão eliminadas da nova planilha.</li>
                  <li>O resultado será gravado definitivamente no banco Cloud na tabela <strong className="text-indigo-400 font-mono">DADOS_CAP_PROCESSADOS_XXX</strong>.</li>
                </ul>
              </div>

              {generalError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Form for Validator Credentials */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      RE do Solicitante <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={re}
                      onChange={(e) => setRe(formatRE(e.target.value))}
                      placeholder="Ex: 123456-7"
                      maxLength={8}
                      disabled={processing}
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        reError ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                      }`}
                    />
                    {reError && <p className="text-[11px] text-red-400 mt-1">{reError}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      CPF do Solicitante <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      placeholder="Ex: 000.000.000-00"
                      maxLength={14}
                      disabled={processing}
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        cpfError ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                      }`}
                    />
                    {cpfError && <p className="text-[11px] text-red-400 mt-1">{cpfError}</p>}
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 flex items-center gap-2 text-slate-400 text-xs">
                  <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Serão gravados no banco de dados Cloud: RE, CPF, Data/Hora, IP e Georreferenciamento do solicitante.</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={processing}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-950/30 disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando e Padronizando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Executar Padronização e Salvar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Success & Results Panel */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Padronização Concluída com Sucesso!
                  </h3>
                  <p className="text-xs text-emerald-300 mt-0.5">
                    A tabela <span className="font-mono font-semibold">{completedResult.codigoProcessamento}</span> foi gravada de forma definitiva no Cloud SQL.
                  </p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Linhas Originais</p>
                  <p className="text-lg font-bold text-white font-mono mt-0.5">{completedResult.totalOriginalRows}</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Linhas Finais (Padronizadas)</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{completedResult.totalProcessedRows}</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Duplicidades Unificadas</p>
                  <p className="text-lg font-bold text-indigo-400 font-mono mt-0.5">{completedResult.totalDuplicateBoCount}</p>
                </div>
              </div>

              {/* Consolidated Details Snippet */}
              {completedResult.duplicateDetails && completedResult.duplicateDetails.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    BOs com Histórico Consolidado:
                  </p>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {completedResult.duplicateDetails.map((dup: any, idx: number) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs">
                        <div className="flex items-center justify-between text-indigo-300 font-mono font-bold">
                          <span>{dup.numeroBo}</span>
                          <span className="text-[11px] px-2 py-0.5 bg-indigo-950/80 border border-indigo-800/60 rounded">
                            {dup.occurrences} ocorrências unificadas na última linha
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">
                          {dup.consolidatedHistorySnippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Metadata Recorded */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-xs space-y-1 font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Tabela Cloud SQL:</span>
                  <span className="text-purple-400 font-semibold">{completedResult.nomeTabela}</span>
                </div>
                <div className="flex justify-between">
                  <span>Novo Arquivo XLS:</span>
                  <span className="text-slate-200">{completedResult.nomeNovoArquivo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Validador:</span>
                  <span className="text-slate-200">RE {completedResult.reValidador} | CPF {completedResult.cpfValidador}</span>
                </div>
                <div className="flex justify-between">
                  <span>Endereço IP / Georref:</span>
                  <span className="text-slate-300">{completedResult.ipAddress} {completedResult.latitude ? `(${completedResult.latitude}, ${completedResult.longitude})` : ''}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadNewXls}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/30"
                >
                  <Download className="w-4 h-4" />
                  Baixar Nova Planilha XLS
                </button>
                {onNavigateToProcessedTab && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onNavigateToProcessedTab();
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-950/30"
                  >
                    <Layers className="w-4 h-4" />
                    Ver Aba de Processados
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
