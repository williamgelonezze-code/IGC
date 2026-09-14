/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  Database, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Layers, 
  FileText,
  Search,
  CheckCircle2
} from 'lucide-react';

interface CapProcessedDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: number | null;
}

export default function CapProcessedDetailsModal({
  isOpen,
  onClose,
  recordId,
}: CapProcessedDetailsModalProps) {
  const [record, setRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecord = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/dados-cap-processados/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao buscar registro.');
      setRecord(data.record);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && recordId) {
      fetchRecord(recordId);
    } else if (!isOpen) {
      setRecord(null);
      setError('');
      setSearchTerm('');
    }
  }, [isOpen, recordId, fetchRecord]);

  const handleDownload = () => {
    if (!record || !record.novoArquivoXls) return;
    const a = window.document.createElement('a');
    a.href = record.novoArquivoXls;
    a.download = record.nomeNovoArquivo || `${record.codigoProcessamento}.xls`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  if (!isOpen) return null;

  const rows: any[] = record?.dadosProcessados || [];
  const filteredRows = rows.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(r).some(val => String(val || '').toLowerCase().includes(term));
  });

  // Extract column keys
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">
                  {record?.codigoProcessamento || 'Detalhes do Registro'}
                </h2>
                {record?.nomeTabela && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-950/80 border border-purple-800/60 text-purple-300">
                    Tabela: {record.nomeTabela}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Visualização completa dos dados padronizados e arquivados no SGBD Cloud
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {record?.novoArquivoXls && (
              <button
                onClick={handleDownload}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Planilha XLS
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-medium">Carregando dados da tabela Cloud SQL...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          ) : record ? (
            <>
              {/* Audit & Validator Metadata Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Arquivo de Origem:</span>
                  <p className="text-white font-medium truncate" title={record.nomeArquivoOrigem}>
                    {record.nomeArquivoOrigem}
                  </p>
                  <span className="text-[11px] text-slate-400">Doc ID: #{record.documentoOrigemId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Validador Solicitante:</span>
                  <p className="text-white font-medium">RE: {record.reValidador}</p>
                  <p className="text-slate-400 text-[11px]">CPF: {record.cpfValidador}</p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Metadados de Rede:</span>
                  <p className="text-white font-mono text-[11px]">IP: {record.ipAddress || 'Não registrado'}</p>
                  <p className="text-slate-400 text-[11px]">
                    {record.latitude && record.longitude ? `GPS: ${record.latitude}, ${record.longitude}` : 'GPS: Padrão CPA/M-7'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Estatísticas do Processamento:</span>
                  <p className="text-emerald-400 font-semibold">
                    {record.totalLinhasProcessadas} linhas mantidas
                  </p>
                  <p className="text-indigo-400 text-[11px]">
                    {record.totalBoDuplicados} duplicidades unificadas
                  </p>
                </div>
              </div>

              {/* Duplicate Details Summary */}
              {record.metadata?.duplicidadesDetalhadas && record.metadata.duplicidadesDetalhadas.length > 0 && (
                <div className="bg-indigo-950/20 border border-indigo-800/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Boletins de Ocorrência com Históricos Unificados ({record.metadata.duplicidadesDetalhadas.length}):</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                    {record.metadata.duplicidadesDetalhadas.map((dup: any, i: number) => (
                      <div key={i} className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg text-xs">
                        <div className="flex justify-between font-mono text-indigo-300 font-bold">
                          <span>{dup.numeroBo}</span>
                          <span className="text-[10px] text-slate-400">{dup.occurrences} linhas consolidadas</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{dup.consolidatedHistorySnippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search in Processed Rows */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por B.O., Histórico, Viatura..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="text-xs text-slate-400">
                  Mostrando <strong className="text-white">{filteredRows.length}</strong> de <strong className="text-white">{rows.length}</strong> registros
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold sticky top-0 z-10">
                        <th className="py-2.5 px-3 whitespace-nowrap">#</th>
                        {columns.map((col) => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap font-mono">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                          {columns.map((col) => {
                            const val = String(row[col] ?? '');
                            const isBo = col.toLowerCase().includes('bo');
                            const isHist = col.toLowerCase().includes('historico');

                            return (
                              <td 
                                key={col} 
                                className={`py-2 px-3 ${
                                  isBo 
                                    ? 'font-mono font-bold text-indigo-400 whitespace-nowrap' 
                                    : isHist 
                                      ? 'text-slate-300 min-w-[280px] max-w-[400px]' 
                                      : 'text-slate-300 whitespace-nowrap'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
