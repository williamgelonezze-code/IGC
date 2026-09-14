/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { 
  Database, 
  Server, 
  RefreshCw, 
  Table2, 
  ArrowLeft, 
  AlertCircle, 
  Trash2, 
  ShieldAlert, 
  Search, 
  Clock, 
  MapPin, 
  UserCheck, 
  FileSpreadsheet, 
  FileText, 
  HardDrive,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Eye,
  Download,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import OperationalDocHoverCard from '@/components/OperationalDocHoverCard';
import CapProcessedDetailsModal from '@/components/CapProcessedDetailsModal';

interface DeletionAudit {
  id: number;
  fileName: string;
  targetTable: string;
  recordId: string;
  fileType?: string;
  deletedByCpf: string;
  deletedByRe: string;
  ipAddress?: string;
  latitude?: string;
  longitude?: string;
  locationData?: any;
  metadata?: any;
  deletedAt: string;
}

export default function DatabasePage() {
  const [activeTab, setActiveTab] = useState<'tables' | 'deletion_audits' | 'dados_cap_processados'>('tables');

  // Tables state
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  // Deletion audits state
  const [audits, setAudits] = useState<DeletionAudit[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  // CAP Processed Records state
  const [capRecords, setCapRecords] = useState<any[]>([]);
  const [loadingCap, setLoadingCap] = useState(false);
  const [selectedCapRecordId, setSelectedCapRecordId] = useState<number | null>(null);
  const [isCapDetailsModalOpen, setIsCapDetailsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      setError('');
      const res = await fetch('/api/db/tables');
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Serviço de banco de dados retornou código HTTP ${res.status}.`);
      }
      if (!res.ok) throw new Error(data?.error || 'Falha ao buscar tabelas do banco');
      setTables(data.tables || []);
      if (data.tables && data.tables.length > 0 && !selectedTable) {
        setSelectedTable(data.tables[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tabelas do banco de dados');
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    try {
      setLoadingData(true);
      setError('');
      const res = await fetch(`/api/db/data?table=${encodeURIComponent(tableName)}`);
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Serviço de banco de dados retornou código HTTP ${res.status}.`);
      }
      if (!res.ok) throw new Error(data?.error || 'Falha ao buscar registros da tabela');
      setTableData(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados da tabela');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAudits = async () => {
    try {
      setLoadingAudits(true);
      setError('');
      const res = await fetch('/api/admin/deletion-audits');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar auditoria de exclusões');
      setAudits(data.audits || []);
    } catch (err: any) {
      console.error('Failed to fetch deletion audits', err);
    } finally {
      setLoadingAudits(false);
    }
  };

  const fetchCapProcessed = async () => {
    try {
      setLoadingCap(true);
      setError('');
      const res = await fetch('/api/dados-cap-processados');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar registros CAP processados');
      setCapRecords(data.records || []);
    } catch (err: any) {
      console.error('Failed to fetch cap processed records', err);
    } finally {
      setLoadingCap(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchAudits();
    fetchCapProcessed();
  }, []);

  useEffect(() => {
    if (selectedTable && activeTab === 'tables') {
      fetchTableData(selectedTable);
    }
  }, [selectedTable, activeTab]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const filteredAudits = audits.filter((audit) => {
    const term = auditSearch.toLowerCase();
    return (
      audit.fileName.toLowerCase().includes(term) ||
      audit.targetTable.toLowerCase().includes(term) ||
      audit.deletedByCpf.toLowerCase().includes(term) ||
      audit.deletedByRe.toLowerCase().includes(term) ||
      (audit.ipAddress && audit.ipAddress.toLowerCase().includes(term))
    );
  });

  const getTableBadge = (table: string) => {
    if (table.startsWith('dados_cap_processados')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
          {table} (CAP Processado)
        </span>
      );
    }
    switch (table) {
      case 'operational_documents':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
            operational_documents (XLS)
          </span>
        );
      case 'api_reports':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/60 border border-blue-800/60 text-blue-400">
            api_reports (Relatório)
          </span>
        );
      case 'dejem_documents':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-950/60 border border-purple-800/60 text-purple-400">
            dejem_documents (DEJEM)
          </span>
        );
      case 'audit_reports':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 border border-amber-800/60 text-amber-400">
            audit_reports (Auditoria IA)
          </span>
        );
      case 'igc_pm_reports':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
            igc_pm_reports (IGC-PM)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
            {table}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-purple-500" />
              SGBD Cloud
            </h1>
            <p className="text-slate-400 mt-1">
              Visualização de arquivos, dados brutos e auditoria permanente de exclusões.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (activeTab === 'tables' && selectedTable) {
                  fetchTableData(selectedTable);
                } else if (activeTab === 'deletion_audits') {
                  fetchAudits();
                } else if (activeTab === 'dados_cap_processados') {
                  fetchCapProcessed();
                }
              }} 
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-4 h-4 ${(loadingData || loadingAudits || loadingCap) ? 'animate-spin text-purple-400' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <Link 
              href="/admin" 
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
          </div>
        </header>

        {/* Global Error Notice */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'tables'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <Table2 className="w-4 h-4" />
            <span>Tabelas do Banco (SGBD)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 ml-1">
              {tables.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('dados_cap_processados');
              fetchCapProcessed();
            }}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'dados_cap_processados'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>DADOS_CAP_PROCESSADOS (Cloud)</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ml-1 ${
              capRecords.length > 0 ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              {capRecords.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('deletion_audits');
              fetchAudits();
            }}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'deletion_audits'
                ? 'border-red-500 text-red-400 bg-red-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Auditoria de Arquivos Apagados</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ml-1 ${
              audits.length > 0 ? 'bg-red-900/80 text-red-200 border border-red-700/60' : 'bg-slate-800 text-slate-400'
            }`}>
              {audits.length}
            </span>
          </button>
        </div>

        {/* TAB 1: TABLES AND RAW DATA */}
        {activeTab === 'tables' && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar / Table List */}
            <div className="w-full md:w-64 shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                <Server className="w-4 h-4" /> Tabelas (Tipos)
              </h3>
              
              {loadingTables ? (
                <p className="text-slate-500 text-sm px-2 animate-pulse">Carregando tabelas...</p>
              ) : tables.length === 0 ? (
                <p className="text-slate-500 text-sm px-2">Nenhuma tabela encontrada.</p>
              ) : (
                <div className="space-y-1">
                  {tables.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTable(t)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        selectedTable === t 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                      }`}
                    >
                      <Table2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Content / Data Viewer */}
            <div className="flex-grow bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-purple-500" />
                  <span>Dados Brutos: <span className="font-mono text-purple-400">{selectedTable || 'Nenhuma tabela selecionada'}</span></span>
                </h2>
                {tableData.length > 0 && (
                  <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
                    {tableData.length} registro(s)
                  </span>
                )}
              </div>
              
              <div className="flex-grow overflow-auto p-0 relative min-h-[400px]">
                {loadingData ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                  </div>
                ) : null}
                
                {!loadingData && tableData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 p-12">
                    Nenhum registro encontrado nesta tabela.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 shadow-sm border-b border-slate-800">
                      <tr>
                        {tableData.length > 0 && Object.keys(tableData[0]).map((key) => (
                          <th key={key} className="px-6 py-3 font-medium border-r border-slate-800/50 last:border-r-0">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {tableData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                          {Object.entries(row).map(([key, value], j) => {
                            let displayValue = String(value);
                            if (value === null) displayValue = 'null';
                            else if (typeof value === 'object') displayValue = JSON.stringify(value);
                            else if (typeof value === 'boolean') displayValue = value ? 'true' : 'false';
                            
                            return (
                              <td key={j} className="px-6 py-3 text-slate-300 font-mono text-xs max-w-[300px] truncate border-r border-slate-800/50 last:border-r-0" title={displayValue}>
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDITORIA DE ARQUIVOS APAGADOS */}
        {activeTab === 'deletion_audits' && (
          <div className="space-y-6">
            {/* Header info & Filter */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Auditoria Permanente de Arquivos Deletados
                    </h2>
                    <p className="text-xs text-slate-400">
                      Registros compulsórios de todas as deleções de arquivos, autorizadas via CPF, RE (Módulo 11 da PM) e Senha Master.
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Filtrar por arquivo, RE, CPF ou tabela..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 block uppercase font-medium">Total de Exclusões</span>
                  <span className="text-xl font-bold font-mono text-white">{audits.length}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 block uppercase font-medium">Planilhas XLS</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {audits.filter(a => a.targetTable === 'operational_documents').length}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 block uppercase font-medium">Documentos DEJEM</span>
                  <span className="text-xl font-bold font-mono text-purple-400">
                    {audits.filter(a => a.targetTable === 'dejem_documents').length}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 block uppercase font-medium">Relatórios API</span>
                  <span className="text-xl font-bold font-mono text-blue-400">
                    {audits.filter(a => a.targetTable === 'api_reports').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Audits Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-red-400" />
                  <span>Histórico Consolidado de Exclusões Gravadas</span>
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
                  {filteredAudits.length} de {audits.length} registro(s)
                </span>
              </div>

              {loadingAudits ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                  <p className="text-sm">Carregando registros de auditoria...</p>
                </div>
              ) : filteredAudits.length === 0 ? (
                <div className="p-16 text-center space-y-3 text-slate-500">
                  <Trash2 className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-base font-semibold text-slate-400">Nenhum registro de exclusão encontrado.</p>
                  <p className="text-xs max-w-md mx-auto">
                    {auditSearch
                      ? 'Nenhum resultado corresponde ao termo de busca informado.'
                      : 'Quando qualquer arquivo do banco de dados for excluído com autorização de CPF, RE e Senha Master, os dados completos de rastreabilidade serão arquivados aqui.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-xs uppercase font-medium">
                      <tr>
                        <th className="px-6 py-3.5">Protocolo</th>
                        <th className="px-6 py-3.5">Nome do Arquivo Apagado</th>
                        <th className="px-6 py-3.5">Tabela / ID Origem</th>
                        <th className="px-6 py-3.5">Autorizado Por</th>
                        <th className="px-6 py-3.5">IP & Geolocalização</th>
                        <th className="px-6 py-3.5">Data / Hora Exclusão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredAudits.map((audit) => (
                        <tr key={audit.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Protocolo */}
                          <td className="px-6 py-4 font-mono text-xs text-red-400 font-bold whitespace-nowrap">
                            #AUD-DEL-{audit.id}
                          </td>

                          {/* Nome do Arquivo com Cartão Interativo SGBD */}
                          <td className="px-6 py-4">
                            <OperationalDocHoverCard
                              id={Number(audit.recordId) || audit.id}
                              fileName={audit.fileName}
                              tableName={audit.targetTable || 'authorized_deletion_audits'}
                              tableDisplayName={`Auditoria de Exclusão (${audit.targetTable})`}
                              fileType={audit.targetTable === 'operational_documents' ? 'xls' : 'pdf'}
                              badgeColor="red"
                              isDeleted={true}
                              description={audit.metadata?.description}
                              fileSize={audit.metadata?.fileSize}
                              uploadedByCpf={audit.deletedByCpf}
                              uploadedByRe={audit.deletedByRe}
                              createdAt={formatDate(audit.deletedAt)}
                              metadata={audit.metadata}
                              maxDisplayWidth="max-w-[280px]"
                            />
                          </td>

                          {/* Tabela de Origem */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div>{getTableBadge(audit.targetTable)}</div>
                              <span className="text-[10px] font-mono text-slate-500 block">
                                ID Original: #{audit.recordId}
                              </span>
                            </div>
                          </td>

                          {/* Autorizado Por (RE / CPF) */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-0.5 text-xs">
                              <div className="font-bold text-slate-200 font-mono flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-red-400" />
                                RE: {audit.deletedByRe}
                              </div>
                              <div className="text-slate-400 font-mono text-[11px]">
                                CPF: {audit.deletedByCpf}
                              </div>
                              <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1 rounded">
                                Senha Master Validada
                              </span>
                            </div>
                          </td>

                          {/* IP e Geolocalização */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1 text-xs font-mono">
                              <span className="text-slate-300 block">
                                IP: {audit.ipAddress || '127.0.0.1'}
                              </span>
                              {(audit.latitude || audit.longitude) ? (
                                <a
                                  href={`https://www.google.com/maps?q=${audit.latitude},${audit.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                                  title="Ver coordenadas no mapa"
                                >
                                  <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                                  <span>{audit.latitude?.slice(0, 8)}, {audit.longitude?.slice(0, 8)}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-600" />
                                  <span>Lat/Lon: Local</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Data/Hora */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{formatDate(audit.deletedAt)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DADOS CAP PROCESSADOS */}
        {activeTab === 'dados_cap_processados' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Arquivamento de Dados Operacionais CAP Processados
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tabelas sequenciais <span className="font-mono text-indigo-400">DADOS_CAP_PROCESSADOS_XXX</span> armazenadas de forma definitiva no Cloud SQL
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/reports"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-950/30"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Padronizar Planilha (Relatórios)
                </Link>
                <Link
                  href="/admin/operational-data"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Planilhas Originais
                </Link>
              </div>
            </div>

            {loadingCap ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">
                Carregando registros arquivados no banco de dados...
              </div>
            ) : capRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mx-auto rounded-full">
                    <Layers className="w-6 h-6" />
                  </div>
                  <p className="text-base font-semibold text-slate-200">Nenhum lote CAP processado encontrado</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Para iniciar a padronização, acesse a página de Relatórios e Arquivamento na aba &quot;Dados Operacionais (XLS)&quot; e clique no botão &quot;Padronização dos Dados&quot;.
                  </p>
                  <Link
                    href="/admin/reports"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Ir para Padronização de Planilhas
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Código / Tabela Cloud SQL</th>
                      <th className="px-6 py-4 font-medium">Arquivo Novo (.XLS)</th>
                      <th className="px-6 py-4 font-medium">Planilha Origem</th>
                      <th className="px-6 py-4 font-medium">Data do Processamento</th>
                      <th className="px-6 py-4 font-medium">Validador Solicitante</th>
                      <th className="px-6 py-4 font-medium">IP & Georreferenciamento</th>
                      <th className="px-6 py-4 font-medium">Linhas & BOs</th>
                      <th className="px-6 py-4 font-medium text-right">Ações no SGBD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {capRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-950/90 border border-indigo-700/70 text-indigo-300 inline-block">
                              {rec.codigoProcessamento}
                            </span>
                            <div className="text-[11px] font-mono text-slate-500">
                              tab: {rec.tabelaDestino}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-200 font-medium">
                          {rec.nomeNovoArquivo}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={rec.nomeArquivoOrigem}>
                          {rec.nomeArquivoOrigem}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {formatDate(rec.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <div className="text-slate-200 font-semibold">RE: {rec.reValidador}</div>
                          <div className="text-slate-400 text-[11px]">CPF: {rec.cpfValidador}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          <div>IP: {rec.ipAddress || '127.0.0.1'}</div>
                          {rec.latitude && rec.longitude && (
                            <div className="text-[11px] text-slate-500">
                              Lat: {rec.latitude?.slice(0, 8)}, Lon: {rec.longitude?.slice(0, 8)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-semibold mr-1.5">
                            {rec.totalLinhasProcessadas} linhas mantidas
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 text-[11px]">
                            {rec.totalBoDuplicados} BOs unificados
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedTable(rec.tabelaDestino);
                                setActiveTab('tables');
                              }}
                              className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/60 text-purple-300 rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-xs"
                              title="Inspecionar tabela no visualizador de tabelas do SGBD"
                            >
                              <Table2 className="w-3.5 h-3.5" /> Ver no SGBD
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCapRecordId(rec.id);
                                setIsCapDetailsModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-xs"
                              title="Visualizar Registros e Detalhes"
                            >
                              <Eye className="w-3.5 h-3.5" /> Detalhes
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CAP Processed Details & Table Viewer Modal */}
      <CapProcessedDetailsModal
        isOpen={isCapDetailsModalOpen}
        onClose={() => {
          setIsCapDetailsModalOpen(false);
          setSelectedCapRecordId(null);
        }}
        recordId={selectedCapRecordId}
      />
    </div>
  );
}
