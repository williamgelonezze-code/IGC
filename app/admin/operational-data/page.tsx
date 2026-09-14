/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, ArrowLeft, Upload, Download, Clock, ShieldCheck, AlertCircle, RefreshCw, Trash2, Loader2, FileText, Database, MapPin, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import OperationalDownloadModal from '@/components/OperationalDownloadModal';
import OperationalUploadModal from '@/components/OperationalUploadModal';
import OperationalDocHoverCard from '@/components/OperationalDocHoverCard';
import AuthorizedDeleteModal, { DeleteTarget } from '@/components/AuthorizedDeleteModal';
import CrimeAnalysisAiModal from '@/components/CrimeAnalysisAiModal';

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

interface OperationalDownloadLog {
  id: number;
  documentId: number;
  fileName: string;
  downloadedByCpf: string;
  downloadedByRe: string;
  ipAddress?: string | null;
  locationData?: any;
  metadata?: any;
  downloadedAt: string;
}

export default function OperationalDataPage() {
  const [activeTab, setActiveTab] = useState<'files' | 'audit'>('files');
  const [docs, setDocs] = useState<OperationalDoc[]>([]);
  const [downloads, setDownloads] = useState<OperationalDownloadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modals state
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedDocForDownload, setSelectedDocForDownload] = useState<OperationalDoc | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCrimeAnalysisModalOpen, setIsCrimeAnalysisModalOpen] = useState(false);
  const [selectedDocIdForAi, setSelectedDocIdForAi] = useState<number | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/operational-docs');
      if (!res.ok) throw new Error('Falha ao carregar planilhas operacionais');
      const data = await res.json();
      setDocs(data.docs || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar planilhas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/operational-docs/downloads');
      if (!res.ok) throw new Error('Falha ao carregar histórico de downloads');
      const data = await res.json();
      setDownloads(data.downloads || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar histórico de downloads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'files') {
      fetchDocs();
    } else {
      fetchDownloads();
    }
  }, [activeTab]);

  const promptDelete = (doc: OperationalDoc) => {
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

  const openDownloadModal = (doc: OperationalDoc) => {
    setSelectedDocForDownload(doc);
    setIsDownloadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
              Arquivamento de Dados Operacionais (XLS)
            </h1>
            <p className="text-slate-400 mt-2">
              Repositório seguro de planilhas operacionais com controle de download e validação de metadados do usuário.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => activeTab === 'files' ? fetchDocs() : fetchDownloads()}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-emerald-950/30 text-sm"
            >
              <Upload className="w-4 h-4" /> Upload de Planilha
            </button>
            <Link href="/admin" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm">
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'files'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Planilhas Arquivadas ({docs.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === 'audit'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Auditoria de Downloads
          </button>
        </div>

        {/* Tab 1: Files Table */}
        {activeTab === 'files' && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-semibold text-white">Planilhas Operacionais Armazenadas</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Formato Autorizado: Extensão .XLS / .XLSX</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-950/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Seq</th>
                    <th className="px-6 py-4 font-medium">Nome da Planilha</th>
                    <th className="px-6 py-4 font-medium">Tamanho</th>
                    <th className="px-6 py-4 font-medium">Data de Arquivamento</th>
                    <th className="px-6 py-4 font-medium">Responsável (CPF / RE)</th>
                    <th className="px-6 py-4 font-medium">Downloads</th>
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
                  ) : docs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Nenhuma planilha de dados operacionais arquivada.
                      </td>
                    </tr>
                  ) : (
                    docs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-emerald-400">#{doc.id}</td>
                        <td className="px-6 py-4 text-slate-200 font-medium">
                          <OperationalDocHoverCard
                            id={doc.id}
                            fileName={doc.fileName}
                            tableName="operational_documents"
                            tableDisplayName="operational_documents (Planilhas Operacionais)"
                            fileSize={doc.fileSize}
                            fileType={doc.fileType || 'xls'}
                            description={doc.description}
                            uploadedByCpf={doc.uploadedByCpf}
                            uploadedByRe={doc.uploadedByRe}
                            createdAt={formatDate(doc.createdAt)}
                            maxDisplayWidth="max-w-[280px]"
                          />
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                          {doc.fileSize || 'Auto'}
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
                            {doc.downloadCount} {doc.downloadCount === 1 ? 'download' : 'downloads'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedDocIdForAi(doc.id);
                                setIsCrimeAnalysisModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-xs shadow-md shadow-cyan-950/20"
                              title="Executar Análise Criminal com IA"
                            >
                              <BrainCircuit className="w-3.5 h-3.5" /> Análise IA
                            </button>
                            <button
                              onClick={() => openDownloadModal(doc)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-xs shadow-md shadow-emerald-950/20"
                              title="Autorizar e Baixar Planilha"
                            >
                              <Download className="w-3.5 h-3.5" /> Autorizar Download
                            </button>
                            <button
                              onClick={() => promptDelete(doc)}
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
        )}

        {/* Tab 2: Audit Logs Table */}
        {activeTab === 'audit' && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-semibold text-white">Auditoria de Downloads de Planilhas</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Metadados de Usuário Guardados em Banco</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-950/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Reg #</th>
                    <th className="px-6 py-4 font-medium">Planilha Baixada</th>
                    <th className="px-6 py-4 font-medium">Data / Hora</th>
                    <th className="px-6 py-4 font-medium">Policial (CPF)</th>
                    <th className="px-6 py-4 font-medium">RE</th>
                    <th className="px-6 py-4 font-medium">Endereço IP</th>
                    <th className="px-6 py-4 font-medium">Localização / Cidade</th>
                    <th className="px-6 py-4 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                        Carregando registros de auditoria...
                      </td>
                    </tr>
                  ) : downloads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Nenhum registro de download realizado até o momento.
                      </td>
                    </tr>
                  ) : (
                    downloads.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-emerald-400">#{log.id}</td>
                        <td className="px-6 py-4 text-slate-300 font-medium">
                          <OperationalDocHoverCard
                            id={log.documentId || log.id}
                            fileName={log.fileName}
                            tableName="operational_documents"
                            tableDisplayName="operational_documents (Auditoria de Download)"
                            fileType="xls"
                            uploadedByCpf={log.downloadedByCpf}
                            uploadedByRe={log.downloadedByRe}
                            createdAt={formatDate(log.downloadedAt)}
                            metadata={{ ip: log.ipAddress, cidade: log.locationData?.city }}
                            maxDisplayWidth="max-w-[220px]"
                          />
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            {formatDate(log.downloadedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-300">{log.downloadedByCpf}</td>
                        <td className="px-6 py-4 font-mono text-slate-300">{log.downloadedByRe}</td>
                        <td className="px-6 py-4 font-mono text-slate-400 text-xs">{log.ipAddress || 'Não disp.'}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {log.locationData?.city ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {log.locationData.city}{log.locationData.region ? `, ${log.locationData.region}` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedDocIdForAi(log.documentId);
                              setIsCrimeAnalysisModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-xs"
                            title="Examinar com IA"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" /> Análise IA
                          </button>
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

      {/* Download Authorization Modal */}
      <OperationalDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => {
          setIsDownloadModalOpen(false);
          setSelectedDocForDownload(null);
        }}
        document={selectedDocForDownload}
        onDownloadSuccess={() => {
          fetchDocs();
        }}
      />

      {/* Upload Authorization Modal */}
      <OperationalUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          fetchDocs();
        }}
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
            setDocs(prev => prev.filter(d => d.id !== deleteTarget.recordId));
          }
          fetchDocs();
        }}
      />

      {/* Crime Analysis AI Modal */}
      <CrimeAnalysisAiModal
        isOpen={isCrimeAnalysisModalOpen}
        onClose={() => {
          setIsCrimeAnalysisModalOpen(false);
          setSelectedDocIdForAi(null);
        }}
        initialDocId={selectedDocIdForAi}
      />
    </div>
  );
}
