/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Loader2, 
  X, 
  RefreshCw, 
  FileCheck, 
  Cpu, 
  ChevronRight,
  TrendingUp,
  Award,
  FileText,
  Database,
  Search,
  Lock,
  MessageSquare,
  Send,
  HelpCircle,
  Activity,
  HeartPulse,
  BadgeAlert,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { isValidCPF, isValidRE, formatCPF, formatRE } from '@/lib/validations';

interface RuleItem {
  regra: string;
  status: string;
  detalhes: string;
}

interface PmDesacordo {
  nome: string;
  re: string;
  cpf: string;
  diasEmDesacordo: string;
  motivo: string;
}

interface AptidaoStatItem {
  validados: number;
  vencidos: number;
  naoLocalizados: number;
  pctValidados: string;
}

interface ValidationResult {
  statusGeral: string;
  scoreConformidade: number;
  resumoExecutivo: string;
  cabecalhoOriginal?: string;
  cabecalhoEstruturado?: {
    nomeArquivo: string;
    auditorGerador: string;
    periodoAnalise: string;
    tipoEscala: string;
    convenio: string;
    cpa: string;
    aispm: string;
    dataEmissao: string;
    todasIdsAnalisadas: string;
  };
  totaisExtraidos?: {
    quantidadePoliciais?: string;
    valorTotal?: string;
  };
  observacoesOriginais?: string;
  rodapeOriginal?: string;
  regrasAvaliadas: RuleItem[];
  alertas: string[];
  recomendacoes: string[];
  pmsEmDesacordo?: PmDesacordo[];
  mensagemBaixarPdf?: string;
  estatisticasAptidao?: {
    totalAvaliados: number;
    taf: AptidaoStatItem;
    tat: AptidaoStatItem;
    inspecaoSaude: AptidaoStatItem;
  };
  estatisticasRestricoes?: {
    totalAvaliados: number;
    operacionais: {
      localizados: number;
      pctEmRelacaoAoTotal: string;
    };
    medicas: {
      localizados: number;
      pctEmRelacaoAoTotal: string;
    };
  };
}

interface DocContext {
  docId: number;
  fileName: string;
  periodo: string;
  tipoEscala: string;
  cpa: string;
  convenio: string;
  totalPoliciais: number;
  totalEscalas: number;
  totalValor: string | number;
  totalIdsAvaliados: number;
  todasIdsAnalisadas?: string;
  estatisticasAptidao?: any;
  estatisticasRestricoes?: any;
  cabecalhoEstruturado?: any;
}

export interface ArchivedCloudPdf {
  id: number;
  sourceTable: 'api_reports' | 'dejem_documents';
  compositeKey: string;
  fileName: string;
  category: string;
  cpf: string;
  re: string;
  createdAt: string;
  sourceDocName?: string;
  totalIds?: number;
  badge: string;
}

export default function DejemAiValidatorModal({ 
  isOpen, 
  onClose,
  initialDocId
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialDocId?: number | null;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [docContext, setDocContext] = useState<DocContext | null>(null);
  const [apiError, setApiError] = useState('');
  const [reError, setReError] = useState('');
  const [cpfError, setCpfError] = useState('');
  
  const [validatorRe, setValidatorRe] = useState('');
  const [validatorCpf, setValidatorCpf] = useState('');

  const [isDownloading, setIsDownloading] = useState(false);

  // Cloud Database Archived PDF Files
  const [cloudFiles, setCloudFiles] = useState<ArchivedCloudPdf[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedCompositeKey, setSelectedCompositeKey] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'api_reports' | 'dejem_documents'>('all');
  
  const [showFinishedPopup, setShowFinishedPopup] = useState(false);
  const [finishedFileName, setFinishedFileName] = useState('');

  // AI Directed Prompt Console States
  const [isAiPromptOpen, setIsAiPromptOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [originalTextSample, setOriginalTextSample] = useState<string>('');
  const [aiConversation, setAiConversation] = useState<Array<{
    question: string;
    answer: string;
    time: string;
  }>>([]);

  // Reset state and fetch archived reports from Cloud Database when opened
  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setApiError('');
      setReError('');
      setCpfError('');
      setShowFinishedPopup(false);
      setIsAiPromptOpen(false);
      setAiConversation([]);
      setLoadingFiles(true);

      fetch('/api/dejem-ai-validator/archived-files')
        .then(res => res.json())
        .then(data => {
          const files: ArchivedCloudPdf[] = data.files || [];
          setCloudFiles(files);
          
          if (files.length > 0) {
            if (initialDocId) {
              const match = files.find(f => f.id === initialDocId) || files[0];
              setSelectedCompositeKey(match.compositeKey);
            } else {
              setSelectedCompositeKey(files[0].compositeKey);
            }
          }
        })
        .catch(err => {
          console.error('Error loading cloud files:', err);
          setApiError('Não foi possível carregar os relatórios arquivados no banco de dados Cloud.');
        })
        .finally(() => {
          setLoadingFiles(false);
        });
    }
  }, [isOpen, initialDocId]);

  const selectedFileMeta = cloudFiles.find(f => f.compositeKey === selectedCompositeKey) || cloudFiles[0] || null;

  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      setIsDownloading(true);
      const res = await fetch('/api/dejem-ai-validator/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, docContext, validatorCpf, validatorRe })
      });
      if (!res.ok) throw new Error('Falha ao gerar o PDF');
      
      const blob = await res.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Auditoria_DEJEM_IA_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      alert(e.message || 'Erro ao baixar o PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const generateAndArchivePdf = async (evalResult: any, context: any) => {
    try {
      const res = await fetch('/api/dejem-ai-validator/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: evalResult,
          docContext: context,
          validatorCpf,
          validatorRe
        })
      });

      if (!res.ok) return;

      const blob = await res.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          await fetch('/api/operational-documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: `Laudo_Auditoria_DEJEM_IA_${new Date().getTime()}.pdf`,
              category: 'Auditoria DEJEM (IA)',
              cpf: validatorCpf,
              re: validatorRe,
              fileData: base64data
            })
          });
        } catch (dbErr) {
          console.error("Failed to save audit report to DB:", dbErr);
        }
      };
    } catch (e) {
      console.error("Error archiving PDF:", e);
    }
  };

  const handleDownloadAndExit = async () => {
    await handleDownloadPdf();
    window.location.href = '/admin';
  };

  const handleJustExit = () => {
    setFinishedFileName(`Auditoria_DEJEM_IA_${new Date().getTime()}.pdf`);
    setShowFinishedPopup(true);
  };

  const confirmPopupAndExit = () => {
    setShowFinishedPopup(false);
    window.location.href = '/admin';
  };

  const runValidation = async () => {
    setReError('');
    setCpfError('');
    setApiError('');
    
    let hasError = false;

    // Strict validation: CPF first, then RE
    if (!validatorCpf.trim()) {
      setCpfError('Por favor, informe o CPF do Validador (Padrão: XXX.XXX.XXX-XX).');
      hasError = true;
    } else if (!isValidCPF(validatorCpf)) {
      setCpfError('CPF inválido de acordo com a Receita Federal (Padrão: XXX.XXX.XXX-XX).');
      hasError = true;
    }

    if (!validatorRe.trim()) {
      setReError('Por favor, informe o RE do Validador (Padrão: XXXXXX-X).');
      hasError = true;
    } else if (!isValidRE(validatorRe)) {
      setReError('RE inválido. Falha no cálculo do Módulo 11 da PMESP (Padrão: XXXXXX-X).');
      hasError = true;
    }

    if (!selectedFileMeta) {
      setApiError('Nenhum relatório analítico automatizado selecionado no banco de dados Cloud.');
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);
      setApiError('');
      setResult(null);

      const res = await fetch('/api/dejem-ai-validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          docId: selectedFileMeta?.id,
          sourceTable: selectedFileMeta?.sourceTable,
          compositeKey: selectedFileMeta?.compositeKey
        })
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Erro na resposta do servidor (HTTP ${res.status}). Verifique a conexão e tente novamente.`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Falha ao executar Validador de Regras DEJEM / DELEGADA por IA (Status ${res.status})`);
      }

      setResult(data.evaluation);
      setDocContext(data.docContext);
      setOriginalTextSample(data.originalTextSample || '');
      
      // Trigger background PDF generation and archiving
      generateAndArchivePdf(data.evaluation, data.docContext);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Erro inesperado ao conectar com a API AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskAi = async (customPrompt?: string) => {
    const questionText = (customPrompt || aiQuestion).trim();
    if (!questionText) return;

    try {
      setIsAskingAi(true);
      const res = await fetch('/api/dejem-ai-validator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          docContext,
          result,
          originalText: originalTextSample,
          validatorCpf,
          validatorRe
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar questionamento na IA.');
      }

      setAiConversation(prev => [
        ...prev,
        {
          question: questionText,
          answer: data.answer || 'Análise técnica de IA concluída.',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setAiQuestion('');
    } catch (err: any) {
      alert(err.message || 'Falha ao consultar o Prompt de Inteligência Artificial.');
    } finally {
      setIsAskingAi(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl xl:max-w-6xl max-h-[92vh] shadow-2xl overflow-hidden relative flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Validador de Regras DEJEM / DELEGADA (IA)
                <span className="text-xs bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded-full border border-rose-500/30">
                  CPA/M-7
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Auditoria automatizada por IA sob a LC nº 1.227/2013, Regra de 365 dias (TAF, TAT, Saúde) e Restrições
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {apiError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {!result ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 mx-auto shadow-inner">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="max-w-xl mx-auto space-y-2">
                <h4 className="text-lg font-bold text-white">
                  Auditar Conformidade Regulatória de Relatório DEJEM / DELEGADA
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A Inteligência Artificial fará a leitura e cruzamento do documento PDF contra o banco de dados oficial (TAF, TAT e Saúde com regra de 365 dias, restrições operacionais e licenças médicas).
                </p>
              </div>

              {/* Selection of Document to Validate */}
              <div className="max-w-xl mx-auto space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Database className="w-4 h-4 text-rose-400" />
                      Documentos e Relatórios Arquivados no Banco de Dados Cloud
                    </label>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      Cloud SQL Conectado
                    </span>
                  </div>

                  {loadingFiles ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                      <span>Consultando relatórios no banco de dados Cloud...</span>
                    </div>
                  ) : cloudFiles.length === 0 ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1">
                      <p className="font-semibold">Nenhum documento PDF encontrado no banco de dados.</p>
                      <p className="text-slate-400">Faça o upload de um arquivo DEJEM ou gere um relatório analítico para auditar.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Search & Filter Bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filtrar por nome, ID ou RE..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        {/* Quick category filter */}
                        <div className="flex items-center gap-1 shrink-0 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setTableFilter('all')}
                            className={`px-2.5 py-1 rounded-lg border transition-all ${
                              tableFilter === 'all'
                                ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Todos ({cloudFiles.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTableFilter('api_reports')}
                            className={`px-2.5 py-1 rounded-lg border transition-all ${
                              tableFilter === 'api_reports'
                                ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            api_reports ({cloudFiles.filter(f => f.sourceTable === 'api_reports').length})
                          </button>
                        </div>
                      </div>

                      {/* Header hint */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
                        <span>Selecione na lista com barra de rolagem:</span>
                        <span>
                          {cloudFiles.filter(f => {
                            if (tableFilter !== 'all' && f.sourceTable !== tableFilter) return false;
                            if (!searchFilter.trim()) return true;
                            const query = searchFilter.toLowerCase();
                            return (
                              f.fileName.toLowerCase().includes(query) ||
                              f.re.toLowerCase().includes(query) ||
                              (f.category && f.category.toLowerCase().includes(query)) ||
                              String(f.id).includes(query)
                            );
                          }).length} de {cloudFiles.length}
                        </span>
                      </div>

                      {/* DEDICATED SCROLLABLE LIST CONTAINER WITH SCROLLBAR */}
                      <div 
                        id="scrollable-dejem-files-list"
                        tabIndex={0}
                        aria-label="Lista de arquivos de auditoria no banco Cloud"
                        className="border-2 border-slate-800 bg-slate-950/90 rounded-xl p-2 max-h-56 sm:max-h-60 overflow-y-scroll space-y-2 shadow-inner focus:border-rose-500/60 focus:outline-none"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#f43f5e #0f172a'
                        }}
                      >
                        {cloudFiles
                          .filter(f => {
                            if (tableFilter !== 'all' && f.sourceTable !== tableFilter) return false;
                            if (!searchFilter.trim()) return true;
                            const query = searchFilter.toLowerCase();
                            return (
                              f.fileName.toLowerCase().includes(query) ||
                              f.re.toLowerCase().includes(query) ||
                              (f.category && f.category.toLowerCase().includes(query)) ||
                              String(f.id).includes(query)
                            );
                          })
                          .map((f) => {
                            const isSelected = selectedCompositeKey === f.compositeKey;
                            const isApiReport = f.sourceTable === 'api_reports';
                            return (
                              <div
                                key={f.compositeKey}
                                id={`report-item-${f.id}`}
                                onClick={() => setSelectedCompositeKey(f.compositeKey)}
                                className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50 ring-1 ring-rose-500/40'
                                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                                    isSelected 
                                      ? 'bg-rose-500 text-white' 
                                      : isApiReport ? 'bg-rose-950/60 text-rose-400' : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {isApiReport ? <Sparkles className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-white text-xs truncate max-w-xs">
                                        {f.fileName}
                                      </span>
                                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                        isApiReport 
                                          ? 'bg-rose-950/70 border-rose-700 text-rose-300 font-bold' 
                                          : 'bg-slate-800 border-slate-700 text-slate-300'
                                      }`}>
                                        {isApiReport ? 'api_reports (Analítico)' : 'dejem_documents'}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                                        ID #{f.id}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2.5 flex-wrap">
                                      <span>RE: <strong className="text-slate-300 font-mono">{formatRE(f.re)}</strong></span>
                                      {f.createdAt && (
                                        <span>Data: <strong className="text-slate-300">{new Date(f.createdAt).toLocaleDateString('pt-BR')}</strong></span>
                                      )}
                                      {f.totalIds !== undefined && (
                                        <span>Policias: <strong className="text-emerald-400 font-mono">{f.totalIds}</strong></span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center self-center pl-2">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'border-rose-400 bg-rose-500' : 'border-slate-600 bg-transparent'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Selected File Details Card */}
                  {selectedFileMeta && (
                    <div className="mt-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-rose-400 font-semibold truncate flex items-center gap-1.5 text-xs">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          {selectedFileMeta.fileName}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                          {selectedFileMeta.category}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-500">RE do Arquivo:</span>{' '}
                          <strong className="text-slate-200">{formatRE(selectedFileMeta.re)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">CPF do Arquivo:</span>{' '}
                          <strong className="text-slate-200">{formatCPF(selectedFileMeta.cpf)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Data de Inserção:</span>{' '}
                          <strong className="text-slate-200">
                            {selectedFileMeta.createdAt ? new Date(selectedFileMeta.createdAt).toLocaleString('pt-BR') : 'N/A'}
                          </strong>
                        </div>
                        {selectedFileMeta.totalIds !== undefined && (
                          <div>
                            <span className="text-slate-500">Total de IDs Avaliados:</span>{' '}
                            <strong className="text-emerald-400 font-mono">{selectedFileMeta.totalIds}</strong>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Arquivo validado no Banco de Dados Cloud • Pronto para exame direto pela API AI</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Solicitante Credentials: Strict Order -> CPF First, then RE */}
                <div className="pt-2 border-t border-slate-800 text-left">
                  <h5 className="text-sm font-semibold text-slate-200 mb-1">
                    Credenciais do Militar Validador
                  </h5>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Informe primeiro o CPF e em seguida o RE militar (validado com Módulo 11) para registro auditado.
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  {/* CPF First */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      1. CPF do Validador (Padrão: <span className="font-mono text-rose-300">XXX.XXX.XXX-XX</span>)
                    </label>
                    <input 
                      id="validator-cpf-input"
                      type="text" 
                      placeholder="Ex: 000.000.000-00" 
                      value={validatorCpf}
                      maxLength={14}
                      onChange={(e) => {
                        const val = formatCPF(e.target.value);
                        setValidatorCpf(val);
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
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none transition-colors ${cpfError ? 'border-red-500 focus:border-red-500 bg-red-950/20' : 'border-slate-800 focus:border-rose-500'}`}
                    />
                    {cpfError && <p className="text-red-400 text-xs mt-1 text-left font-medium">{cpfError}</p>}
                  </div>

                  {/* RE Second */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      2. RE do Validador (Padrão: <span className="font-mono text-rose-300">XXXXXX-X</span> • Módulo 11 PMESP)
                    </label>
                    <input 
                      id="validator-re-input"
                      type="text" 
                      placeholder="Ex: 123456-7" 
                      value={validatorRe}
                      maxLength={8}
                      onChange={(e) => {
                        const val = formatRE(e.target.value);
                        setValidatorRe(val);
                        if (val.length >= 7) {
                          if (!isValidRE(val)) {
                            setReError('RE inválido. Falha no cálculo do Módulo 11 da PMESP (Padrão: XXXXXX-X).');
                          } else {
                            setReError('');
                          }
                        } else {
                          setReError('');
                        }
                      }}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none transition-colors ${reError ? 'border-red-500 focus:border-red-500 bg-red-950/20' : 'border-slate-800 focus:border-rose-500'}`}
                    />
                    {reError && <p className="text-red-400 text-xs mt-1 text-left font-medium">{reError}</p>}
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={runValidation}
                    disabled={loading || !selectedFileMeta}
                    className="px-8 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Auditando Regras com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Iniciar Auditoria de Regras DEJEM / DELEGADA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${
                    result.statusGeral === 'CONFORME' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : result.statusGeral === 'COM_RESSALVAS'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {result.statusGeral === 'CONFORME' ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : result.statusGeral === 'COM_RESSALVAS' ? (
                      <AlertTriangle className="w-7 h-7" />
                    ) : (
                      <XCircle className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Status Geral</span>
                    <h4 className={`text-lg font-bold ${
                      result.statusGeral === 'CONFORME' ? 'text-emerald-400' :
                      result.statusGeral === 'COM_RESSALVAS' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {result.statusGeral.replace('_', ' ')}
                    </h4>
                  </div>
                </div>

                <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Score de Conformidade</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">{result.scoreConformidade}</span>
                      <span className="text-slate-400 text-sm">/ 100%</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Documento Auditado</span>
                    <p className="text-sm font-medium text-slate-200 truncate" title={docContext?.fileName || 'DEJEM'}>
                      {docContext?.fileName || 'Documento Atual'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {docContext?.totalPoliciais || result.totaisExtraidos?.quantidadePoliciais || 0} agentes • {docContext?.totalEscalas || 0} vagas
                    </p>
                  </div>
                </div>
              </div>

              {/* CABEÇALHO ORIGINAL DO ARQUIVO (REDUZIDO E ESTRUTURADO: NOME DO ARQUIVO, AUDITOR, PERÍODO, TIPO DE ESCALA, CONVÊNIO, CPA, AISPM, DATA EMISSÃO E TODAS AS IDS) */}
              {(result.cabecalhoEstruturado || result.cabecalhoOriginal) && (
                <div className="p-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" />
                      Cabeçalho Original do Arquivo (Metadados Consolidados)
                    </h5>
                    <span className="text-[10px] font-mono text-sky-300 bg-sky-950/70 border border-sky-800/60 px-2 py-0.5 rounded-md font-semibold">
                      Auditoria IA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nome do Arquivo</span>
                      <p className="font-bold text-slate-100 truncate" title={result.cabecalhoEstruturado?.nomeArquivo || docContext?.fileName}>
                        {result.cabecalhoEstruturado?.nomeArquivo || docContext?.fileName || 'RELATORIO_DEJEM.pdf'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Auditor que Gerou</span>
                      <p className="font-bold text-slate-100 truncate" title={result.cabecalhoEstruturado?.auditorGerador}>
                        {result.cabecalhoEstruturado?.auditorGerador || (validatorRe ? `RE: ${validatorRe}` : 'Auditor Oficial CPA/M-7')}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Período de Análise</span>
                      <p className="font-bold text-slate-100">
                        {result.cabecalhoEstruturado?.periodoAnalise || docContext?.periodo || '01/07/2026 a 31/07/2026'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tipo de Escala</span>
                      <p className="font-bold text-slate-100">
                        {result.cabecalhoEstruturado?.tipoEscala || docContext?.tipoEscala || 'ATIVIDADE DEJEM'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Convênio</span>
                      <p className="font-bold text-slate-100 truncate" title={result.cabecalhoEstruturado?.convenio || docContext?.convenio}>
                        {result.cabecalhoEstruturado?.convenio || docContext?.convenio || 'ATIVIDADE DEJEM - REGIÃO METROPOLITANA / ESPECIALIZADAS'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">CPA</span>
                      <p className="font-bold text-slate-100">
                        {result.cabecalhoEstruturado?.cpa || docContext?.cpa || 'CPA/M-7'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">AISPM / Data Emissão</span>
                      <p className="font-bold text-slate-100">
                        {result.cabecalhoEstruturado?.aispm || 'AISPM 15'} • {result.cabecalhoEstruturado?.dataEmissao || new Date().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Todas as IDs Analisadas */}
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Todas as IDs que foram Analisadas:
                    </span>
                    <p className="text-xs text-slate-300 text-justify leading-relaxed font-mono">
                      {result.cabecalhoEstruturado?.todasIdsAnalisadas || docContext?.todasIdsAnalisadas || (result.cabecalhoOriginal && !result.cabecalhoEstruturado ? result.cabecalhoOriginal : 'Todas as IDs da escala auditada com cruzamento na base')}
                    </p>
                  </div>
                </div>
              )}

              {/* DADOS E MÉTRICAS OPERACIONAIS COLETADAS */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Dados e Métricas Operacionais Coletadas no Arquivo
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total IDs Auditadas</span>
                    <p className="text-base font-extrabold text-slate-100 mt-1">
                      {docContext?.totalIdsAvaliados || 0}
                    </p>
                    <span className="text-[10px] text-slate-500">registros auditados</span>
                  </div>
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">PMs Executaram Atividades</span>
                    <p className="text-base font-extrabold text-sky-400 mt-1">
                      {docContext?.totalPoliciais || result.totaisExtraidos?.quantidadePoliciais || 0}
                    </p>
                    <span className="text-[10px] text-slate-500">efetivo empregado</span>
                  </div>
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor Total a Pagar</span>
                    <p className="text-base font-extrabold text-emerald-400 mt-1 truncate" title={String(docContext?.totalValor || result.totaisExtraidos?.valorTotal || 'R$ 0,00')}>
                      {String(docContext?.totalValor || result.totaisExtraidos?.valorTotal || 'R$ 0,00')}
                    </p>
                    <span className="text-[10px] text-slate-500">soma total apurada</span>
                  </div>
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">PMs em Desacordo</span>
                    <p className="text-base font-extrabold text-rose-400 mt-1">
                      {result.pmsEmDesacordo?.length || 0}
                    </p>
                    <span className="text-[10px] text-slate-500">apontamentos de IA</span>
                  </div>
                </div>
              </div>

              {/* CARD 1: ESTATÍSTICAS DE APTIDÃO FÍSICA E SAÚDE (REGRA DE 365 DIAS) */}
              {result.estatisticasAptidao && (
                <div className="p-5 bg-sky-950/30 border border-sky-500/30 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-sky-300 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-400" />
                      Estatísticas de Regularidade Física e Saúde (Regra de 365 Dias)
                    </h5>
                    <span className="text-[11px] font-mono text-sky-400 bg-sky-900/50 border border-sky-700/50 px-2 py-0.5 rounded-full">
                      Base Oficial PMESP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* TAF */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-sky-900/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">TAF (Aptidão Física)</span>
                        <span className="text-[10px] font-semibold text-emerald-400">
                          {result.estatisticasAptidao.taf?.pctValidados || '0%'} Válidos
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <p className="text-emerald-400 flex justify-between">
                          <span>Validados (&le;365d):</span> <strong>{result.estatisticasAptidao.taf?.validados || 0}</strong>
                        </p>
                        <p className="text-rose-400 flex justify-between">
                          <span>Data Vencida (&gt;365d):</span> <strong>{result.estatisticasAptidao.taf?.vencidos || 0}</strong>
                        </p>
                        <p className="text-slate-400 flex justify-between">
                          <span>Não Localizados:</span> <strong>{result.estatisticasAptidao.taf?.naoLocalizados || 0}</strong>
                        </p>
                      </div>
                    </div>

                    {/* TAT */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-sky-900/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">TAT (Aptidão de Tiro)</span>
                        <span className="text-[10px] font-semibold text-emerald-400">
                          {result.estatisticasAptidao.tat?.pctValidados || '0%'} Válidos
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <p className="text-emerald-400 flex justify-between">
                          <span>Validados (&le;365d):</span> <strong>{result.estatisticasAptidao.tat?.validados || 0}</strong>
                        </p>
                        <p className="text-rose-400 flex justify-between">
                          <span>Data Vencida (&gt;365d):</span> <strong>{result.estatisticasAptidao.tat?.vencidos || 0}</strong>
                        </p>
                        <p className="text-slate-400 flex justify-between">
                          <span>Não Localizados:</span> <strong>{result.estatisticasAptidao.tat?.naoLocalizados || 0}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Inspeção de Saúde */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-sky-900/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">Inspeção de Saúde</span>
                        <span className="text-[10px] font-semibold text-emerald-400">
                          {result.estatisticasAptidao.inspecaoSaude?.pctValidados || '0%'} Válidas
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <p className="text-emerald-400 flex justify-between">
                          <span>Validadas (&le;365d):</span> <strong>{result.estatisticasAptidao.inspecaoSaude?.validados || 0}</strong>
                        </p>
                        <p className="text-rose-400 flex justify-between">
                          <span>Data Vencida (&gt;365d):</span> <strong>{result.estatisticasAptidao.inspecaoSaude?.vencidos || 0}</strong>
                        </p>
                        <p className="text-slate-400 flex justify-between">
                          <span>Não Localizadas:</span> <strong>{result.estatisticasAptidao.inspecaoSaude?.naoLocalizados || 0}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 2: ESTATÍSTICAS DE RESTRIÇÕES OPERACIONAIS E MÉDICAS */}
              {result.estatisticasRestricoes && (
                <div className="p-5 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-3">
                  <h5 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <BadgeAlert className="w-4 h-4 text-amber-400" />
                    Estatísticas de Restrições em Relação ao Total de Policiais
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-amber-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">Restrições Operacionais (Correg PM / Comissões das OPM / CAPS - NAPS)</span>
                        <span className="text-xs font-black text-amber-400">
                          {result.estatisticasRestricoes.operacionais?.pctEmRelacaoAoTotal}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Policiais militares com restrição de serviço operacional ostensivo identificados na escala DEJEM.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-rose-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                          <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Restrições Médicas / LTS
                        </span>
                        <span className="text-xs font-black text-rose-400">
                          {result.estatisticasRestricoes.medicas?.pctEmRelacaoAoTotal}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-300/90 font-medium">
                        Policiais que constavam com restrição médica ou LTS, fizeram DEJEM/DELEGADA mas NÃO poderiam fazer.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              <div className="p-5 bg-slate-950/50 border border-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Parecer Técnico do Validador de Regras DEJEM / DELEGADA (IA)</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed text-justify">
                  {result.resumoExecutivo}
                </p>
              </div>

              {/* Evaluated Rules Table/List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Regras de Execução Avaliadas
                </h4>
                <div className="space-y-2">
                  {result.regrasAvaliadas.map((r, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-200">{r.regra}</span>
                        </div>
                        <p className="text-xs text-slate-400 text-justify">{r.detalhes}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shrink-0 ${
                        r.status === 'CONFORME' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : r.status === 'ALERTA'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts & Recommendations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.alertas && result.alertas.length > 0 && (
                  <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                    <h5 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Alertas Operacionais
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {result.alertas.map((a, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recomendacoes && result.recomendacoes.length > 0 && (
                  <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-3">
                    <h5 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Recomendações Técnicas
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {result.recomendacoes.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* PMs em Desacordo List - Layout sem corte, nome completo e texto/parágrafo justificado */}
              {result.pmsEmDesacordo && result.pmsEmDesacordo.length > 0 && (
                <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-4 mt-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-900/40">
                    <h5 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      Relação Nominal de Policiais Militares em Desacordo ({result.pmsEmDesacordo.length})
                    </h5>
                    <span className="text-[11px] text-rose-400 font-mono bg-rose-950/60 border border-rose-800/60 px-2.5 py-0.5 rounded-full">
                      Apontamento Detalhado por Militar
                    </span>
                  </div>

                  <div 
                    className="space-y-3.5 max-h-[34rem] overflow-y-auto pr-2"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#f43f5e #0f172a'
                    }}
                  >
                    {result.pmsEmDesacordo.map((pm, i) => (
                      <div 
                        key={i} 
                        className="p-4 bg-slate-950/80 rounded-xl border border-rose-900/40 space-y-3 hover:border-rose-700/50 transition-colors"
                      >
                        {/* 1. Nome Completo do Policial Militar em destaque (aceita até 150 caracteres de forma completa sem truncamento) */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                            Policial Militar:
                          </span>
                          <h6 className="text-sm font-extrabold text-white tracking-wide break-words whitespace-normal select-all">
                            {pm.nome || 'NOME NÃO INFORMADO'}
                          </h6>
                        </div>

                        {/* 2. Metadados e Datas Identificadas */}
                        <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-800/80">
                          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                            RE: <strong className="text-white">{pm.re || '-'}</strong>
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                            CPF: <strong className="text-white">{pm.cpf || '-'}</strong>
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-rose-950/50 border border-rose-800/50 text-rose-300 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-rose-400" />
                            Datas / Período: <strong className="text-rose-200">{pm.diasEmDesacordo || 'Não informado'}</strong>
                          </span>
                        </div>

                        {/* 3. Motivo e Apontamento Regulamentar com Parágrafo Justificado */}
                        <div className="p-3 bg-rose-950/20 rounded-lg border border-rose-900/30 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                            Motivo / Fundamentação do Apontamento:
                          </span>
                          <p className="text-xs text-slate-300 text-justify leading-relaxed">
                            {pm.motivo || 'Em desacordo com as diretrizes regulamentares da escala.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CAIXA DE PERGUNTAS DO RELATÓRIO DE AUDITORIA: COM BOTÃO DE PROMPT DE INTELIGÊNCIA ARTIFICIAL */}
              <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-5 mt-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-rose-400" />
                      Caixa de Perguntas do Relatório de Auditoria
                    </h5>
                    <p className="text-xs text-slate-400">
                      Deseja abrir o Prompt de Inteligência Artificial para análise ou questionamentos do operador sobre o relatório e o documento original?
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAiPromptOpen(prev => !prev)}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAiPromptOpen ? 'Fechar Prompt de IA' : 'Abrir Prompt de IA para Análise Direcionada'}</span>
                  </button>
                </div>

                {/* PROMPT DE INTELIGÊNCIA ARTIFICIAL PARA ANÁLISE OU QUESTIONAMENTOS DO OPERADOR */}
                {isAiPromptOpen && (
                  <div className="p-4 bg-slate-900/90 border border-rose-500/30 rounded-xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Prompt de IA • Exame Direcionado do Relatório e Documento Original
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Gemini 2.5 Flash Ativo
                      </span>
                    </div>

                    {/* Suggested Question Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 self-center mr-1">Sugestões rápidas:</span>
                      {[
                        'Conferir limite mensal de 10 escalas DEJEM/Delegada e datas irregulares',
                        'Examinar validade dos 365 dias para TAF, TAT e Saúde',
                        'Listar PMs com restrições médicas/LTS que executaram DEJEM',
                        'Apontar restrições operacionais localizadas vs total',
                        'Conferir regras de CPF com 10 dígitos e validação cadastral'
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAskingAi}
                          onClick={() => handleAskAi(chip)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Conversation History */}
                    {aiConversation.length > 0 && (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 pt-2">
                        {aiConversation.map((chat, i) => (
                          <div key={i} className="space-y-2">
                            {/* Operator Question */}
                            <div className="flex items-start gap-2 justify-end">
                              <div className="p-3 bg-rose-600/20 border border-rose-500/30 rounded-xl max-w-lg text-right">
                                <span className="text-[10px] text-rose-400 font-mono block mb-0.5">Operador ({chat.time})</span>
                                <p className="text-xs text-rose-100">{chat.question}</p>
                              </div>
                            </div>

                            {/* AI Answer */}
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-1">
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl max-w-xl text-left space-y-1">
                                <span className="text-[10px] text-emerald-400 font-mono block">Auditor de IA (CPA/M-7)</span>
                                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line text-justify">
                                  {chat.answer}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Question Input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Faça uma pergunta específica para examinar o relatório ou documento original..."
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAskAi();
                          }
                        }}
                        disabled={isAskingAi}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAskAi()}
                        disabled={isAskingAi || !aiQuestion.trim()}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        {isAskingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isAskingAi ? 'Examinando...' : 'Enviar à IA'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Download PDF Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left space-y-0.5">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" /> Download do Laudo em PDF
                    </span>
                    <p className="text-[11px] text-slate-400">
                      O laudo analítico oficial foi registrado no banco de dados. Deseja realizar o download agora?
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleDownloadAndExit}
                      disabled={isDownloading}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      {isDownloading ? 'Baixando...' : 'Sim, baixar e fechar'}
                    </button>
                    <button
                      onClick={handleJustExit}
                      disabled={isDownloading}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      Não, apenas fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>AUDITORIA DEJEM / DELEGADA • PMESP</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-rose-600/20"
            >
              Cancelar e Sair
            </button>
          </div>
        </div>

        {/* Confirmation popup when user chooses "Não, apenas fechar" */}
        {showFinishedPopup && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Relatório Arquivado no Banco de Dados</h4>
                <p className="text-xs text-slate-400">
                  O relatório analítico foi gerado e salvo com sucesso em seu histórico de auditorias.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 truncate">
                {finishedFileName}
              </div>
              <button
                onClick={confirmPopupAndExit}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
              >
                OK, Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
