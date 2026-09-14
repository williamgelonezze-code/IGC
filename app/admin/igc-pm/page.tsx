/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, Download, Trash2, Calendar, FileDown, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import logoPic from '../../../src/assets/images/logo.png';
import AuthorizedDeleteModal, { DeleteTarget } from '@/components/AuthorizedDeleteModal';

export default function AdminIgcPmPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, envie apenas arquivos PDF.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result;
      
      try {
        const res = await fetch('/api/igc-pm-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            uploadedByCpf: 'ADMIN',
            uploadedByRe: 'ADMIN',
            metadata: {
              size: file.size,
              type: file.type
            }
          })
        });
        
        if (res.ok) {
          fetchReports();
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          alert('Erro ao fazer upload do arquivo.');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Erro ao conectar com o servidor.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-6 pt-12 md:p-12">
      <div className="w-full max-w-7xl space-y-12 flex-grow">
        <header className="space-y-4 text-center relative">
          <div className="flex justify-center mb-6">
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-300 absolute left-0 top-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Admin</span>
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
            Gerenciamento IGC-PM
            <span className="block mt-2 text-cyan-400 text-xl md:text-2xl font-medium">Área Administrativa</span>
          </h1>
        </header>

        {/* Upload Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-12 shadow-xl shadow-cyan-900/10">
          <h3 className="text-xl font-bold text-white text-center mb-2">Guardar Novo Relatório IGC-PM</h3>
          <p className="text-slate-400 text-center mb-8">Faça o upload do arquivo PDF (como o Painel Estratégico) para armazená-lo permanentemente no banco de dados Cloud SQL.</p>
          
          <div className="max-w-2xl mx-auto bg-slate-950 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center hover:border-cyan-500/50 transition-colors">
            <input 
              type="file" 
              accept="application/pdf"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <Upload className={`w-8 h-8 ${uploading ? 'text-cyan-500 animate-bounce' : 'text-slate-400'}`} />
              </div>
              
              {uploading ? (
                <p className="text-cyan-400 font-medium text-lg">Fazendo upload para a nuvem...</p>
              ) : (
                <>
                  <h4 className="text-white font-semibold text-lg mb-2">Selecione o arquivo PDF</h4>
                  <p className="text-slate-500 text-sm mb-8">Tamanho máximo recomendado: 5MB</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold border border-slate-700 transition-colors"
                  >
                    Procurar Arquivo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 min-h-[400px]">
          <h3 className="text-xl font-bold text-white mb-6">Relatórios Arquivados (Cloud SQL)</h3>
          
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
                <div key={report.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col hover:border-cyan-500/50 transition-colors relative overflow-hidden group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-slate-900 rounded-lg text-cyan-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">ID: {report.id}</span>
                  </div>
                  <h4 className="font-semibold text-white truncate mb-2" title={report.fileName}>
                    {report.fileName}
                  </h4>
                  <div className="flex flex-col text-xs text-slate-400 mb-6 gap-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Enviado por: {report.uploadedByRe || 'ADMIN'}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = report.fileData;
                        a.download = report.fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors border border-slate-600"
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </button>
                    <button 
                      onClick={() => setDeleteTarget({
                        recordId: report.id,
                        targetTable: 'igc_pm_reports',
                        fileName: report.fileName,
                        description: 'Relatório IGC-PM',
                        fileType: 'pdf'
                      })}
                      className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/50"
                      title="Excluir (Auditoria)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthorizedDeleteModal 
        isOpen={!!deleteTarget}
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleteSuccess={() => {
          setDeleteTarget(null);
          fetchReports();
        }}
      />
    </main>
  );
}
