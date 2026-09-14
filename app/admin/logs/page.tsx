'use client';

import { useEffect, useState } from 'react';
import { Shield, MapPin, Clock, Server, Database, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Log {
  id?: number;
  cpf: string;
  re: string;
  ipAddress: string | null;
  locationData: any;
  createdAt?: string;
  timestamp?: string; // from local storage
}

export default function LogsPage() {
  const [dbLogs, setDbLogs] = useState<Log[]>([]);
  const [localLogs, setLocalLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load from local storage
    try {
      const stored = localStorage.getItem('access_logs');
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalLogs(JSON.parse(stored).reverse());
      }
    } catch (e) {
      console.error('Error loading local logs', e);
    }

    // Load from database
    const fetchDbLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (!res.ok) throw new Error('Failed to fetch from DB');
        const data = await res.json();
        setDbLogs(data.logs || []);
      } catch (err: any) {
        console.error('Database fetch error', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDbLogs();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(new Date(dateStr));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              Logs de Acesso do Sistema
            </h1>
            <p className="text-slate-400 mt-2">
              Auditoria de segurança permanente. Numeração sequencial via banco de dados (Nuvem).
            </p>
          </div>
          <Link href="/admin" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
            Voltar
          </Link>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-semibold text-white">Nuvem (PostgreSQL) - Permanente</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-950/50 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">ID (Seq)</th>
                  <th className="px-6 py-4 font-medium">Data / Hora</th>
                  <th className="px-6 py-4 font-medium">CPF</th>
                  <th className="px-6 py-4 font-medium">RE</th>
                  <th className="px-6 py-4 font-medium">IP (IPv4 / IPv6)</th>
                  <th className="px-6 py-4 font-medium">Região</th>
                  <th className="px-6 py-4 font-medium">Lat / Lon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                      Carregando logs do banco de dados...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-center justify-center gap-3 mx-auto max-w-lg">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>Falha ao conectar com o banco de dados.</p>
                      </div>
                    </td>
                  </tr>
                ) : dbLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Nenhum registro encontrado no banco de dados.
                    </td>
                  </tr>
                ) : (
                  dbLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-emerald-500">#{log.id}</td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">{log.cpf}</td>
                      <td className="px-6 py-4 font-mono text-slate-300">{log.re}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{log.ipAddress || 'Oculto'}</td>
                      <td className="px-6 py-4 text-slate-400 truncate max-w-[200px]" title={log.locationData?.city ? `${log.locationData.city}, ${log.locationData.region}` : 'Desconhecido'}>
                        {log.locationData?.city ? `${log.locationData.city}, ${log.locationData.region}` : 'Desconhecido'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {log.locationData?.latitude && log.locationData?.longitude 
                          ? `${Number(log.locationData.latitude).toFixed(5)}, ${Number(log.locationData.longitude).toFixed(5)}` 
                          : 'Sem Coordenadas'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Local Storage Redundancy Table */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col mt-8 opacity-80">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-white">Redundância Local (Navegador Atual)</h2>
          </div>
          
          <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-950/50 text-slate-400 sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-medium">Data / Hora</th>
                  <th className="px-6 py-3 font-medium">CPF</th>
                  <th className="px-6 py-3 font-medium">RE</th>
                  <th className="px-6 py-3 font-medium">IP (IPv4 / IPv6)</th>
                  <th className="px-6 py-3 font-medium">Lat / Lon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {localLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                      Nenhum registro encontrado na memória local.
                    </td>
                  </tr>
                ) : (
                  localLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-3 text-slate-400">{formatDate(log.timestamp)}</td>
                      <td className="px-6 py-3 font-mono text-slate-400">{log.cpf}</td>
                      <td className="px-6 py-3 font-mono text-slate-400">{log.re}</td>
                      <td className="px-6 py-3 font-mono text-slate-400">{log.ipAddress || 'Oculto'}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500">
                        {log.locationData?.latitude && log.locationData?.longitude 
                          ? `${Number(log.locationData.latitude).toFixed(5)}, ${Number(log.locationData.longitude).toFixed(5)}` 
                          : 'Sem Coordenadas'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
