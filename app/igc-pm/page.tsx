/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Download, Calendar, FileDown, Shield } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import logoPic from '../../src/assets/images/logo.png';
import AdminButton from '@/components/AdminButton';

export default function IgcPmPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/igc-pm-reports');
      const data = await res.json();
      if (data.reports) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = (report: any) => {
    const a = document.createElement('a');
    a.href = report.fileData;
    a.download = report.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <main className="min-h-screen flex flex-col p-6 pt-12 md:p-12 relative">
      <AdminButton 
        targetRoute="/admin/igc-pm" 
        buttonIcon={Shield}
        buttonLabel="Gerenciar (Admin)"
        buttonClassName="absolute top-6 right-6 md:top-8 md:right-8 px-4 py-2 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-300 shadow-sm hover:shadow-cyan-900/20"
      />
      
      <div className="w-full max-w-7xl mx-auto space-y-8 flex-grow">
        <header className="space-y-4 text-center relative">
          <div className="flex justify-center mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-300 absolute left-0 top-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </Link>
          </div>
          <div className="flex justify-center mb-6 mt-12 md:mt-0">
            <div className="relative w-24 h-24 md:w-32 md:h-32">
              <Image 
                src={logoPic}
                alt="Brasão CPA/M-7" 
                fill
                className="object-contain"
                priority
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white uppercase leading-tight">
            Índice de Gestão Corporativa - IGC-PM
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-slate-400 tracking-widest uppercase">
            CPA/M-7
          </h2>
        </header>

        {/* Tab Content */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 min-h-[400px]">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Relatórios Arquivados (Cloud SQL)</h3>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 rounded-xl border border-dashed border-slate-700">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum relatório IGC-PM foi arquivado ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                  <div key={report.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col hover:border-cyan-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-slate-900 rounded-lg text-cyan-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">ID: {report.id}</span>
                    </div>
                    <h4 className="font-semibold text-white truncate mb-2" title={report.fileName}>
                      {report.fileName}
                    </h4>
                    <div className="flex items-center text-xs text-slate-400 mb-6 mt-auto pt-4 gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDownload(report)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        <FileDown className="w-4 h-4" />
                        Baixar PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
