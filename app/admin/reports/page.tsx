'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  Activity, 
  FileSpreadsheet, 
  Upload, 
  Database,
  Sparkles,
  Layers,
  Eye,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import OperationalDownloadModal from '@/components/OperationalDownloadModal';
import OperationalUploadModal from '@/components/OperationalUploadModal';
import OperationalStandardizeModal from '@/components/OperationalStandardizeModal';
import CapProcessedDetailsModal from '@/components/CapProcessedDetailsModal';
import OperationalDocHoverCard from '@/components/OperationalDocHoverCard';
import AuthorizedDeleteModal, { DeleteTarget } from '@/components/AuthorizedDeleteModal';

interface ApiReport {
  id: number;
  fileName: string;
  cpf?: string;
  re?: string;
  validatorCpf?: string;
  validatorRe?: string;
  ipAddress?: string;
  metadata: any;
  createdAt: string;
}

interface OperationalDoc {
  id: number;
  fileName: string;
  fileType: string;
  fileSize?: string | null;
  description?: string | null;
  uploadedByCpf: string;
  uploadedByRe: string;
  metadata: any;
  createdAt: string;
  downloadCount: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'audit' | 'operational' | 'processed_cap'>('api');
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [operationalDocs, setOperationalDocs] = useState<OperationalDoc[]>([]);
  const [processedCapRecords, setProcessedCapRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Operational modals
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedDocForDownload, setSelectedDocForDownload] = useState<OperationalDoc | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // CAP Standardization & Details modals
  const [isStandardizeModalOpen, setIsStandardizeModalOpen] = useState(false);
  const [selectedDocForStandardize, setSelectedDocForStandardize] = useState<OperationalDoc | null>(null);
  const [isProcessedDetailsModalOpen, setIsProcessedDetailsModalOpen] = useState(false);
  const [selectedProcessedRecordId, setSelectedProcessedRecordId] = useState<number | null>(null);

  // Authorized Delete Modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'operational') {
        const res = await fetch('/api/operational-docs');
        if (!res.ok) throw new Error('Falha ao buscar planilhas operacionais');
        const data = await res.json();
        setOperationalDocs(data.docs || []);
      } else if (activeTab === 'processed_cap') {
        const res = await fetch('/api/dados-cap-processados');
        if (!res.ok) throw new Error('Falha ao buscar dados CAP processados');
        const data = await res.json();
        setProcessedCapRecords(data.records || []);
      } else {
        const endpoint = activeTab === 'api' ? '/api/reports' : '/api/audit-reports';
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Falha ao carregar relatórios');
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDownload = async (reportId: number, fileName: string) => {
    try {
      setDownloadingId(reportId);
      const endpoint = activeTab === 'api' ? `/api/reports/${reportId}` : `/api/audit-reports/${reportId}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Falha ao baixar');
      const data = await res.json();
      
      if (data.report && data.report.fileData) {
        let fileData = data.report.fileData;
        if (!fileData.startsWith('data:')) {
          fileData = `data:application/pdf;base64,${fileData}`;
        }
        const a = document.createElement('a');
        a.href = fileData;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao baixar relatório.');
    } finally {
      setDownloadingId(null);
    }
  };

  const promptDeleteReport = (report: ApiReport) => {
    setDeleteTarget({
      recordId: report.id,
      targetTable: activeTab === 'api' ? 'api_reports' : 'audit_reports',
      fileName: report.fileName,
      description: activeTab === 'api' ? 'Relatório de API do Sistema' : 'Relatório de Auditoria IA',
      fileType: 'pdf',
    });
    setIsDeleteModalOpen(true);
  };

  const promptDeleteOperationalDoc = (doc: OperationalDoc) => {
    setDeleteTarget({
      recordId: doc.id,
      targetTable: 'operational_documents',
      fileName: doc.fileName,
      description: doc.description,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
    });
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'America/Sao_Paulo'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-amber-500" />
              Relatórios e Arquivamento do Sistema
            </h1>
            <p className="text-slate-400 mt-2">
              Visualização de relatórios de atividades, auditorias de IA e planilhas de dados operacionais (XLS).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchReports} 
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            </button>
            <Link href="/admin" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs md:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'api' ? 'bg-amber-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" /> Relatórios API
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs md:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'audit' ? 'bg-amber-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Auditoria IA
          </button>
          <button
            onClick={() => setActiveTab('operational')}
            className={`flex-1 min-w-[160px] py-2 px-3 rounded-lg text-xs md:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'operational' ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Dados Operacionais (XLS)
          </button>
          <button
            onClick={() => setActiveTab('processed_cap')}
            className={`flex-1 min-w-[210px] py-2 px-3 rounded-lg text-xs md:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'processed_cap' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Dados CAP Processados (XLS)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'processed_cap' ? (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Dados CAP Processados (DADOS_CAP_PROCESSADOS_XXX)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Planilhas padronizadas por <span className="text-indigo-400 font-mono">NumeroBO</span> com histórico consolidado e arquivadas no Cloud SQL
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('operational')}
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Padronizar Nova Planilha
                </button>
                <Link
                  href="/admin/database"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" /> SGBD Cloud
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-950/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Código Sequencial</th>
                    <th className="px-6 py-4 font-medium">Arquivo Padronizado</th>
                    <th className="px-6 py-4 font-medium">Planilha de Origem</th>
                    <th className="px-6 py-4 font-medium">Data Processamento</th>
                    <th className="px-6 py-4 font-medium">Validador (RE / CPF)</th>
                    <th className="px-6 py-4 font-medium">IP & Georref</th>
                    <th className="px-6 py-4 font-medium">Consolidação BO</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                        Carregando registros de dados CAP processados...
                      </td>
                    </tr>
                  ) : processedCapRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mx-auto rounded-full">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-medium text-slate-300">Nenhum dado CAP processado ainda.</p>
                          <p className="text-xs text-slate-500">
                            Acesse a aba &quot;Dados Operacionais (XLS)&quot; e clique no botão &quot;Padronização dos Dados&quot; na linha de qualquer planilha para gerar a sequência DADOS_CAP_PROCESSADOS_XXX.
                          </p>
                          <button
                            onClick={() => setActiveTab('operational')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors"
                          >
                            Ir para Dados Operacionais (XLS)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    processedCapRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                          <span className="px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-800/60 text-indigo-300">
                            {rec.codigoProcessamento}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-200 font-medium font-mono text-xs">
                          {rec.nomeNovoArquivo}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs max-w-[200px] truncate" title={rec.nomeArquivoOrigem}>
                          {rec.nomeArquivoOrigem}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {formatDate(rec.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <div className="text-slate-200">RE: {rec.reValidador}</div>
                          <div className="text-slate-400">CPF: {rec.cpfValidador}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          <div>IP: {rec.ipAddress || '127.0.0.1'}</div>
                          {rec.latitude && rec.longitude && (
                            <div className="text-[11px] text-slate-500">{rec.latitude}, {rec.longitude}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className="text-emerald-400 font-semibold">{rec.totalLinhasProcessadas} mantidas</div>
                          <div className="text-indigo-400 text-[11px]">{rec.totalBoDuplicados} unificadas</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedProcessedRecordId(rec.id);
                                setIsProcessedDetailsModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-xs"
                              title="Visualizar Registros e Detalhes da Tabela"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver Registros
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  setDownloadingId(rec.id);
                                  const res = await fetch(`/api/dados-cap-processados/${rec.id}`);
                                  const data = await res.json();
                                  if (data.record?.novoArquivoXls) {
                                    const a = document.createElement('a');
                                    a.href = data.record.novoArquivoXls;
                                    a.download = rec.nomeNovoArquivo || `${rec.codigoProcessamento}.xls`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  }
                                } catch (e) {
                                  console.error(e);
                                  alert('Erro ao baixar XLS padronizado.');
                                } finally {
                                  setDownloadingId(null);
                                }
                              }}
                              disabled={downloadingId === rec.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-xs shadow-md shadow-emerald-950/20"
                              title="Baixar Nova Planilha XLS Padronizada"
                            >
                              {downloadingId === rec.id ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Baixando...</>
                              ) : (
                                <><Download className="w-3.5 h-3.5" /> Baixar XLS</>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : activeTab === 'operational' ? (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-semibold text-white">
                  Download de Planilhas de Dados Operacionais (.XLS)
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950/20"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Planilha
                </button>
                <Link
                  href="/admin/operational-data"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" /> Módulo Completo
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-950/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Seq</th>
                    <th className="px-6 py-4 font-medium">Nome do Arquivo (XLS)</th>
                    <th className="px-6 py-4 font-medium">Data de Arquivamento</th>
                    <th className="px-6 py-4 font-medium">Responsável (CPF / RE)</th>
                    <th className="px-6 py-4 font-medium">Downloads</th>
                    <th className="px-6 py-4 font-medium">Metadados</th>
                    <th className="px-6 py-4 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                        Carregando planilhas operacionais do banco de dados...
                      </td>
                    </tr>
                  ) : operationalDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Nenhuma planilha de dados operacionais encontrada.
                      </td>
                    </tr>
                  ) : (
                    operationalDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-emerald-400">#{doc.id}</td>
                        <td className="px-6 py-4 text-slate-200 font-medium">
                          <OperationalDocHoverCard
                            id={doc.id}
                            fileName={doc.fileName}
                            fileSize={doc.fileSize}
                            fileType={doc.fileType}
                            description={doc.description}
                            uploadedByCpf={doc.uploadedByCpf}
                            uploadedByRe={doc.uploadedByRe}
                            createdAt={formatDate(doc.createdAt)}
                            maxDisplayWidth="max-w-[240px]"
                          />
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            {formatDate(doc.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-300 text-xs">
                          <div>CPF: {doc.uploadedByCpf}</div>
                          <div className="text-slate-400">RE: {doc.uploadedByRe}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                            {doc.downloadCount} downloads
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs max-w-[150px] truncate" title={JSON.stringify(doc.metadata)}>
                          {doc.metadata ? JSON.stringify(doc.metadata) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedDocForStandardize(doc);
                                setIsStandardizeModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-xs shadow-md shadow-indigo-950/20"
                              title="Padronização dos Dados (CAP): Desduplica por NumeroBO, unifica Histórico na última linha e salva no Cloud SQL"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Padronização dos Dados
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocForDownload(doc);
                                setIsDownloadModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-xs shadow-md shadow-emerald-950/20"
                              title="Autorizar e Baixar Arquivo XLS"
                            >
                              <Download className="w-3.5 h-3.5" /> Autorizar Download
                            </button>
                            <button
                              onClick={() => promptDeleteOperationalDoc(doc)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                              title="Autorizar Exclusão de Planilha"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center gap-2">
              {activeTab === 'api' ? <FileText className="w-5 h-5 text-amber-500" /> : <ShieldCheck className="w-5 h-5 text-amber-500" />}
              <h2 className="text-xl font-semibold text-white">
                {activeTab === 'api' ? 'Relatórios em PDF Gerados' : 'Relatórios de Auditoria da Inteligência Artificial'}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-950/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">ID (Seq)</th>
                    <th className="px-6 py-4 font-medium">Nome do Arquivo</th>
                    <th className="px-6 py-4 font-medium">Produção (Data / Hora)</th>
                    {activeTab === 'api' ? (
                      <>
                        <th className="px-6 py-4 font-medium">CPF</th>
                        <th className="px-6 py-4 font-medium">RE</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 font-medium">CPF (Validador)</th>
                        <th className="px-6 py-4 font-medium">RE (Validador)</th>
                        <th className="px-6 py-4 font-medium">Endereço IP (v4/v6)</th>
                      </>
                    )}
                    <th className="px-6 py-4 font-medium">Metadados</th>
                    <th className="px-6 py-4 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={activeTab === 'api' ? 7 : 8} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                        Carregando relatórios do banco de dados...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'api' ? 7 : 8} className="px-6 py-8 text-center text-slate-500">
                        Nenhum relatório encontrado.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-amber-500">#{report.id}</td>
                        <td className="px-6 py-4 text-slate-200 font-medium">
                          <OperationalDocHoverCard
                            id={report.id}
                            fileName={report.fileName}
                            tableName={activeTab === 'api' ? 'api_reports' : 'audit_reports'}
                            tableDisplayName={activeTab === 'api' ? 'api_reports (Relatórios Analíticos Automatizados)' : 'audit_reports (Auditoria Permanente IA)'}
                            fileType="pdf"
                            badgeColor={activeTab === 'api' ? 'amber' : 'rose'}
                            uploadedByCpf={activeTab === 'api' ? report.cpf : report.validatorCpf}
                            uploadedByRe={activeTab === 'api' ? report.re : report.validatorRe}
                            createdAt={formatDate(report.createdAt)}
                            metadata={report.metadata}
                            maxDisplayWidth="max-w-[240px]"
                          />
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            {formatDate(report.createdAt)}
                          </div>
                        </td>
                        {activeTab === 'api' ? (
                          <>
                            <td className="px-6 py-4 font-mono text-slate-300">{report.cpf}</td>
                            <td className="px-6 py-4 font-mono text-slate-300">{report.re}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 font-mono text-slate-300">{report.validatorCpf}</td>
                            <td className="px-6 py-4 font-mono text-slate-300">{report.validatorRe}</td>
                            <td className="px-6 py-4 font-mono text-slate-400 text-xs">{report.ipAddress}</td>
                          </>
                        )}
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs max-w-[150px] truncate" title={JSON.stringify(report.metadata)}>
                          {report.metadata ? JSON.stringify(report.metadata) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleDownload(report.id, report.fileName)}
                              disabled={downloadingId === report.id}
                              className="p-2 bg-slate-800 hover:bg-emerald-600 disabled:bg-slate-800/50 text-slate-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-2"
                              title="Baixar Arquivo"
                            >
                              {downloadingId === report.id ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Baixando...</>
                              ) : (
                                <><Download className="w-4 h-4" /> Baixar</>
                              )}
                            </button>
                            <button 
                              onClick={() => promptDeleteReport(report)}
                              className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-2"
                              title="Autorizar Exclusão de Relatório"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Operational Download Authorization Modal */}
      <OperationalDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => {
          setIsDownloadModalOpen(false);
          setSelectedDocForDownload(null);
        }}
        document={selectedDocForDownload}
        onDownloadSuccess={() => {
          fetchReports();
        }}
      />

      {/* Operational Upload Authorization Modal */}
      <OperationalUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          fetchReports();
        }}
      />

      {/* Operational Standardization Modal */}
      <OperationalStandardizeModal
        isOpen={isStandardizeModalOpen}
        onClose={() => {
          setIsStandardizeModalOpen(false);
          setSelectedDocForStandardize(null);
        }}
        document={selectedDocForStandardize}
        onSuccess={() => {
          fetchReports();
        }}
        onNavigateToProcessedTab={() => {
          setActiveTab('processed_cap');
        }}
      />

      {/* CAP Processed Details & Table Viewer Modal */}
      <CapProcessedDetailsModal
        isOpen={isProcessedDetailsModalOpen}
        onClose={() => {
          setIsProcessedDetailsModalOpen(false);
          setSelectedProcessedRecordId(null);
        }}
        recordId={selectedProcessedRecordId}
      />

      {/* Authorized Delete Modal */}
      <AuthorizedDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        target={deleteTarget}
        onDeleteSuccess={(fileName) => {
          if (deleteTarget) {
            if (deleteTarget.targetTable === 'operational_documents') {
              setOperationalDocs(prev => prev.filter(d => d.id !== deleteTarget.recordId));
            } else {
              setReports(prev => prev.filter(r => r.id !== deleteTarget.recordId));
            }
          }
          fetchReports();
        }}
      />
    </div>
  );
}
