/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  BrainCircuit, 
  ArrowLeft, 
  RefreshCw, 
  Database, 
  Lock, 
  Search, 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  Download, 
  TrendingUp, 
  Radio, 
  Building2, 
  Car, 
  Users, 
  AlertTriangle 
} from 'lucide-react';
import { isValidCPF, isValidRE, formatCPF, formatRE } from '@/lib/validations';
import OperationalDocHoverCard from '@/components/OperationalDocHoverCard';

interface CloudDocFile {
  id: number;
  downloadId?: number;
  fileName: string;
  tableName: string;
  tableDisplayName: string;
  fileSize: string;
  fileType: string;
  description?: string;
  downloadedByCpf?: string;
  downloadedByRe?: string;
  downloadedAt?: string;
  uploadedByCpf?: string;
  uploadedByRe?: string;
  createdAt?: string;
}

export default function ApiAiAnaliseCriminalPage() {
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [cloudFiles, setCloudFiles] = useState<CloudDocFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTableFilter, setSelectedTableFilter] = useState('operational_downloads');

  const [validatorCpf, setValidatorCpf] = useState('');
  const [validatorRe, setValidatorRe] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [reError, setReError] = useState('');
  const [analysisFocus, setAnalysisFocus] = useState('padronizacao_igcpm');

  const [analyzing, setAnalyzing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [analysisResponse, setAnalysisResponse] = useState<any | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch restricted files from Cloud SGBD table operational_downloads or dados_cap_processados
  const fetchCloudFiles = useCallback(async (targetTable: string = selectedTableFilter) => {
    try {
      setLoadingFiles(true);
      setApiError('');
      const res = await fetch(`/api/crime-analysis/cloud-files?table=${targetTable}`);
      if (!res.ok) throw new Error('Falha ao consultar tabela no Cloud SGBD');
      const data = await res.json();
      const files: CloudDocFile[] = data.files || [];
      setCloudFiles(files);

      if (files.length > 0) {
        setSelectedFileId(files[0].id);
      } else {
        setSelectedFileId(null);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Erro ao carregar arquivos do Cloud SGBD');
    } finally {
      setLoadingFiles(false);
    }
  }, [selectedTableFilter]);

  useEffect(() => {
    fetchCloudFiles(selectedTableFilter);
  }, [fetchCloudFiles, selectedTableFilter]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValidatorCpf(formatted);
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
    setValidatorRe(formatted);
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

  const handleExecuteAnalysis = async () => {
    setCpfError('');
    setReError('');
    setApiError('');

    if (!selectedFileId) {
      setApiError('Selecione uma planilha operacional XLS arquivada no Cloud SGBD.');
      return;
    }

    if (!validatorRe || !validatorRe.trim()) {
      setReError('Informe o RE do militar analista (Padrão: XXXXXX-X).');
      return;
    }
    if (!isValidRE(validatorRe)) {
      setReError('RE inválido. Falha na validação do dígito verificador pelo Módulo 11 (Padrão: XXXXXX-X).');
      return;
    }

    if (!validatorCpf || !validatorCpf.trim()) {
      setCpfError('Informe o CPF completo do analista (Padrão: XXX.XXX.XXX-XX).');
      return;
    }
    if (!isValidCPF(validatorCpf)) {
      setCpfError('CPF inválido segundo as regras da Receita Federal (Padrão: XXX.XXX.XXX-XX).');
      return;
    }

    try {
      setAnalyzing(true);
      const res = await fetch('/api/crime-analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedFileId,
          sourceTable: selectedTableFilter,
          validatorCpf,
          validatorRe,
          analysisFocus,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar análise criminal com IA');
      }

      setAnalysisResponse(data);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Erro inesperado ao consultar a API de Análise Criminal');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!analysisResponse) return;
    try {
      setDownloadingPdf(true);
      const res = await fetch('/api/crime-analysis/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisResponse)
      });

      if (!res.ok) throw new Error('Falha ao gerar o PDF da análise');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_Analise_Criminal_IA_${selectedFile?.fileName || 'SGBD'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadXls = () => {
    if (!analysisResponse?.standardization?.novoArquivoXls) return;
    try {
      const byteCharacters = atob(analysisResponse.standardization.novoArquivoXls);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = analysisResponse.standardization.nomeNovoArquivo || 'PLANILHA_PADRONIZADA.xls';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Erro no download da planilha padronizada: ' + (err.message || ''));
    }
  };

  const selectedFile = cloudFiles.find(f => f.id === selectedFileId);

  const filteredFiles = cloudFiles.filter(file => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      file.fileName.toLowerCase().includes(query) ||
      (file.description && file.description.toLowerCase().includes(query)) ||
      (file.downloadedByRe && file.downloadedByRe.toLowerCase().includes(query)) ||
      (file.uploadedByRe && file.uploadedByRe.toLowerCase().includes(query)) ||
      String(file.id).includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 md:p-12 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-800 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-semibold">
                SGBD Cloud SQL • operational_downloads
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs">
                Inteligência Policial AI
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <BrainCircuit className="w-8 h-8 text-cyan-400 shrink-0" />
              API AI ANÁLISE CRIMINAL - Base Documentos
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Exame analítico e correlação tática com IA sobre as planilhas XLS arquivadas no Banco de Dados Cloud SGBD na tabela operacional.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl transition-colors font-medium text-sm flex items-center gap-2 border border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
            </Link>
          </div>
        </header>

        {apiError && (
          <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <div className="font-bold">Aviso de Execução:</div>
              <div>{apiError}</div>
            </div>
          </div>
        )}

        {!analysisResponse ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Step 1: File Selection with dedicated scrollbar container */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold border border-cyan-500/30">1</span>
                    Campo de Seleção: Origem e Arquivo Cloud
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono flex items-center gap-1">
                      <Database className="w-3 h-3 text-cyan-400" />
                      {cloudFiles.length} Arquivos
                    </span>
                    <button 
                      onClick={() => fetchCloudFiles()}
                      disabled={loadingFiles}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                      title="Atualizar lista do banco"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingFiles ? 'animate-spin' : ''}`} />
                      Atualizar
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-300">Selecione a Tabela no Cloud SGBD:</label>
                  <select
                    value={selectedTableFilter}
                    onChange={(e) => setSelectedTableFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  >
                    <option value="operational_downloads">operational_downloads (Originais Recebidos)</option>
                    <option value="dados_cap_processados">dados_cap_processados (Arquivos Gerados/Padronizados)</option>
                  </select>
                </div>

                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Regra de Segurança:</span> Apenas as planilhas XLS arquivadas no Banco de Dados Cloud SGBD na tabela selecionada (<code className="text-white font-mono bg-cyan-950 px-1 py-0.5 rounded">{selectedTableFilter}</code>) estão disponíveis para seleção. Role a barra abaixo para escolher o arquivo.
                  </div>
                </div>

                {/* Filter / Search Bar */}
                {cloudFiles.length > 0 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Buscar por nome da planilha, ID ou RE..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    {searchFilter && (
                      <button
                        onClick={() => setSearchFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* SCROLLABLE LIST CONTAINER WITH SCROLLBAR */}
                {loadingFiles ? (
                  <div className="p-10 text-center bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                    <Loader2 className="w-7 h-7 animate-spin text-cyan-400 mx-auto" />
                    <p className="text-xs text-slate-400 font-mono">Carregando planilhas da tabela operational_downloads...</p>
                  </div>
                ) : cloudFiles.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl">
                    <FileSpreadsheet className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-300 font-medium">Nenhum arquivo XLS encontrado na tabela operacional do Cloud SGBD.</p>
                    <p className="text-xs text-slate-500 mt-1">Acesse a aba Dados Operacionais para realizar o arquivamento inicial.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
                      <span>Role a barra de rolagem para escolher a planilha:</span>
                      <span>{filteredFiles.length} de {cloudFiles.length}</span>
                    </div>

                    <div 
                      id="scrollable-operational-files"
                      tabIndex={0}
                      aria-label="Lista de arquivos na tabela operational_downloads do Cloud SGBD"
                      className="border-2 border-slate-800 bg-slate-950/90 rounded-xl p-2.5 max-h-72 overflow-y-scroll space-y-2 shadow-inner focus:border-cyan-500/60 focus:outline-none"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#06b6d4 #0f172a'
                      }}
                    >
                      {filteredFiles.map((file) => {
                        const isSelected = selectedFileId === file.id;
                        return (
                          <div 
                            key={`cloud-file-${file.id}-${file.downloadId || 0}`}
                            id={`file-card-${file.id}`}
                            onClick={() => setSelectedFileId(file.id)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isSelected 
                                ? 'bg-cyan-950/50 border-cyan-400 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-500/40' 
                                : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                <FileSpreadsheet className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <OperationalDocHoverCard 
                                    id={file.id}
                                    fileName={file.fileName}
                                    tableName="operational_downloads"
                                    tableDisplayName={file.tableDisplayName}
                                    fileSize={file.fileSize}
                                    fileType={file.fileType}
                                    description={file.description}
                                    uploadedByCpf={file.uploadedByCpf}
                                    uploadedByRe={file.uploadedByRe}
                                    createdAt={file.downloadedAt || file.createdAt}
                                    badgeColor="emerald"
                                    wrapName={true}
                                    maxDisplayWidth="max-w-[600px]"
                                  />
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                    ID #{file.id}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800 text-emerald-300">
                                    SGBD Cloud SQL
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1">
                                  {file.description || 'Planilha com registros de efetivo, abordagens e ocorrências criminais.'}
                                </p>
                                <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                                  <span>Tamanho: <strong className="text-slate-300 font-mono">{file.fileSize}</strong></span>
                                  {file.downloadedByRe && (
                                    <span>Operador: <strong className="text-slate-300 font-mono">RE {file.downloadedByRe}</strong></span>
                                  )}
                                  {(file.downloadedAt || file.createdAt) && (
                                    <span>Data: <strong className="text-slate-300 font-mono">{file.downloadedAt || file.createdAt}</strong></span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center self-center pl-2">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-slate-600 bg-transparent'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Selection Banner */}
                {selectedFile && (
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/50 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-slate-400 text-[11px]">Arquivo Selecionado para Iniciar o Processo de Análise:</div>
                        <div className="font-bold text-cyan-200 truncate font-mono">{selectedFile.fileName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-700 text-cyan-300 font-mono text-[10px]">
                        ID #{selectedFile.id}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-medium text-[10px]">
                        Pronto para Análise
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 & 3: Credentials & Execution */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <label className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold border border-cyan-500/30">2</span>
                  Colocar os Dados do Militar Analista:
                </label>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    CPF do Analista Militar (Padrão: <span className="font-mono text-cyan-300">XXX.XXX.XXX-XX</span>):
                  </label>
                  <input 
                    type="text"
                    value={validatorCpf}
                    onChange={handleCpfChange}
                    placeholder="Ex: 000.000.000-00"
                    maxLength={14}
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      cpfError ? 'border-rose-500 bg-rose-950/10' : 'border-slate-700'
                    }`}
                  />
                  {cpfError && <span className="text-[11px] text-rose-400 mt-1 block font-medium">{cpfError}</span>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    RE do Analista Militar (Padrão: <span className="font-mono text-cyan-300">XXXXXX-X</span> • Módulo 11 PMESP):
                  </label>
                  <input 
                    type="text"
                    value={validatorRe}
                    onChange={handleReChange}
                    placeholder="Ex: 123456-7"
                    maxLength={8}
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      reError ? 'border-rose-500 bg-rose-950/10' : 'border-slate-700'
                    }`}
                  />
                  {reError && <span className="text-[11px] text-rose-400 mt-1 block font-medium">{reError}</span>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Foco Tático e Diretriz de Padronização:
                  </label>
                  <select 
                    value={analysisFocus}
                    onChange={(e) => setAnalysisFocus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="padronizacao_igcpm">⭐ Padronização da Planilha e Arquivamento (PADRONIZAÇÃO USO NO IGCPM - CPA/M-7)</option>
                    <option value="agrupamento_delitos">⭐ Agrupamento por Delitos (PADRONIZAÇÃO POR DELITOS)</option>
                    <option value="municipios_cpam7">⭐ Análise por Municípios do CPA/M-7 (MUNICÍPIOS CPA/M-7)</option>
                    <option value="geral">Análise Criminal Ampla (Geral & Integrado)</option>
                    <option value="patrimonio">Foco em Crimes Patrimoniais (Roubo / Furto)</option>
                    <option value="vida">Foco em Crimes Contra a Vida (Homicídio / Tentativa)</option>
                    <option value="trafico">Foco em Tráfico de Drogas e Pontos de Tráfico</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button 
                    id="btn-iniciar-analise-criminal-ai"
                    onClick={handleExecuteAnalysis}
                    disabled={analyzing || !selectedFileId}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processando Padronização e Análise com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {analysisFocus === 'agrupamento_delitos'
                          ? 'Executar Agrupamento por Delitos e Arquivar'
                          : analysisFocus === 'municipios_cpam7'
                          ? 'Executar Análise por Municípios CPA/M-7 e Arquivar'
                          : 'Executar Padronização da Planilha e Arquivar'}
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    A IA examina os dados arquivados no SGBD Cloud, executa rotina de padronização, cria a nova tabela e gera laudo pericial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-6">
            {/* Standardization Banner */}
            {analysisResponse.standardization && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border-2 border-emerald-500/60 shadow-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Arquivado no Cloud SQL SGBD
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {analysisResponse.standardization.codigoProcessamento}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
                        Tabela: <strong className="text-cyan-300">{analysisResponse.standardization.nomeTabela}</strong>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Nova Planilha Gerada: <span className="font-mono text-cyan-300">{analysisResponse.standardization.nomeNovoArquivo}</span>
                    </h3>
                  </div>

                  <button
                    onClick={handleDownloadXls}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Baixar Nova Planilha XLS
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950/60 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Linhas Originais</span>
                    <span className="font-mono font-bold text-white">{analysisResponse.standardization.totalOriginalRows}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Linhas Consolidadas</span>
                    <span className="font-mono font-bold text-emerald-400">{analysisResponse.standardization.totalProcessedRows}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">BOs Duplicados Unificados</span>
                    <span className="font-mono font-bold text-amber-400">{analysisResponse.standardization.totalDuplicateBoCount}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                    <span className="font-mono font-bold text-cyan-300 text-xs truncate block">100% PERSISTIDO</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-blue-950/50 border border-cyan-500/30 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white">
                    Parecer Técnico de Inteligência Criminal Policial
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  Arquivo Examinado: <strong className="text-cyan-300">{analysisResponse.fileInfo?.fileName}</strong> • ID #{analysisResponse.fileInfo?.id}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {analysisResponse.standardization && (
                  <button
                    onClick={handleDownloadXls}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Baixar XLS Padronizado
                  </button>
                )}
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Baixar Relatório PDF
                </button>
                <button
                  onClick={() => setAnalysisResponse(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                >
                  Examinar Outra Planilha
                </button>
              </div>
            </div>

            {/* Analysis details */}
            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-base font-bold text-cyan-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Síntese Executiva de Inteligência
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  {analysisResponse.analysis?.sumarioExecutivo}
                </p>
              </div>

              {analysisResponse.analysis?.hotspotsCriticos?.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-rose-400 mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Pontos Críticos e Padrões Identificados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResponse.analysis.hotspotsCriticos.map((item: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{item.bairroOuRegiao || `Ponto Crítico #${i+1}`}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono border border-rose-800">
                            {item.crimePredominante || 'Alerta Tático'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{item.descricao || item.motivo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResponse.analysis?.recomendacoesOperacionais?.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Diretrizes Operacionais Recomendadas
                  </h3>
                  <ul className="space-y-2">
                    {analysisResponse.analysis.recomendacoesOperacionais.map((rec: string, i: number) => (
                      <li key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          {i+1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
