'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, ArrowLeft, Upload, FileText, Download, Clock, ShieldCheck, AlertCircle, X, FileUp, Sparkles, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatCPF, formatRE, isValidCPF, isValidRE } from '@/lib/validations';
import AuthorizedDeleteModal, { DeleteTarget } from '@/components/AuthorizedDeleteModal';
import OperationalDocHoverCard from '@/components/OperationalDocHoverCard';
import DejemAiValidatorModal from '@/components/DejemAiValidatorModal';

interface DejemDoc {
  id: number;
  fileName: string;
  uploadedByCpf: string;
  uploadedByRe: string;
  createdAt: string;
}

export default function ApiAiDejemPage() {
  const [docs, setDocs] = useState<DejemDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [authCpf, setAuthCpf] = useState('');
  const [authRe, setAuthRe] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [reError, setReError] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Authorized Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAiValidatorOpen, setIsAiValidatorOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dejem-docs');
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocs(data.docs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocs();
  }, []);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    setCpfError('');
    setReError('');

    if (!isValidCPF(authCpf)) {
      setCpfError('CPF inválido pelo algoritmo da Receita Federal (Padrão: XXX.XXX.XXX-XX).');
      valid = false;
    }
    
    if (!isValidRE(authRe)) {
      setReError('RE inválido. Falha no Módulo 11 da PMESP (Padrão: XXXXXX-X).');
      valid = false;
    }

    if (valid) {
      setAuthorized(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Por favor, selecione apenas arquivos PDF.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !authorized) return;
    
    try {
      setUploading(true);
      
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
        
      const res = await fetch('/api/dejem-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileData: base64data,
          uploadedByCpf: authCpf,
          uploadedByRe: authRe
        })
      });

      if (res.ok) {
        // Registrar atividade no Access Logs
        try {
          let ipAddress = 'unknown';
          let locationData: any = {
            city: 'Desconhecido',
            region: '',
            country: '',
            latitude: null,
            longitude: null,
            precise: false,
          };
          
          try {
            const ipRes = await fetch('https://api64.ipify.org?format=json').catch(() => null);
            if (ipRes && ipRes.ok) {
              try {
                const ipData = await ipRes.json();
                if (ipData?.ip) ipAddress = ipData.ip;
              } catch {
                // Ignore non-json response
              }
            }

            const geoRes = await fetch('https://ipapi.co/json/').catch(() => null);
            if (geoRes && geoRes.ok) {
              try {
                const geo = await geoRes.json();
                if (ipAddress === 'unknown' && geo?.ip) ipAddress = geo.ip;
                if (geo) {
                  locationData.city = geo.city || 'Desconhecido';
                  locationData.region = geo.region || '';
                  locationData.country = geo.country_name || '';
                  locationData.latitude = geo.latitude || null;
                  locationData.longitude = geo.longitude || null;
                }
              } catch {
                // Ignore non-json response
              }
            }
          } catch (e) {
            console.error("Failed to fetch geo data", e);
          }

          if ('geolocation' in navigator) {
            try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 0 });
              });
              locationData.latitude = pos.coords.latitude;
              locationData.longitude = pos.coords.longitude;
              locationData.precise = true;
            } catch(e) {
              console.log("Precise geolocation denied or timeout", e);
            }
          }

          const logEntry = {
            cpf: authCpf + ' (UPLOAD DE PDF)',
            re: authRe,
            ipAddress,
            locationData,
            timestamp: new Date().toISOString()
          };

          const existingLogs = JSON.parse(localStorage.getItem('access_logs') || '[]');
          existingLogs.push(logEntry);
          localStorage.setItem('access_logs', JSON.stringify(existingLogs));

          await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry)
          });
        } catch (logError) {
          console.error("Error saving upload log", logError);
        }

        setShowUploadModal(false);
        resetUploadState();
        fetchDocs();
      } else {
        throw new Error('Upload falhou');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar upload do arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadState = () => {
    setAuthCpf('');
    setAuthRe('');
    setCpfError('');
    setReError('');
    setAuthorized(false);
    setSelectedFile(null);
  };

  const handleDownload = async (docId: number, fileName: string) => {
    try {
      setDownloadingId(docId);
      const res = await fetch(`/api/dejem-docs/${docId}`);
      if (!res.ok) throw new Error('Failed to download');
      const data = await res.json();
      
      if (data.doc && data.doc.fileData) {
        const a = document.createElement('a');
        a.href = data.doc.fileData;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao baixar arquivo.');
    } finally {
      setDownloadingId(null);
    }
  };

  const promptDelete = (doc: DejemDoc) => {
    setDeleteTarget({
      recordId: doc.id,
      targetTable: 'dejem_documents',
      fileName: doc.fileName,
      description: 'Documento Operacional DEJEM',
      fileType: 'pdf',
    });
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(new Date(dateStr));
  };

  const handleGenerateReport = async (docId: number) => {
    try {
      setAnalyzingId(docId);
      
      let geoData = { latitude: null, longitude: null };
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 0 });
          });
          geoData.latitude = pos.coords.latitude as any;
          geoData.longitude = pos.coords.longitude as any;
        } catch(e) {
          console.log("Geolocation denied or timeout", e);
        }
      }

      const res = await fetch(`/api/dejem-docs/${docId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geoData)
      });
      
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Erro na resposta do servidor (HTTP ${res.status}).`);
      }

      if (!res.ok) throw new Error(data?.error || 'Falha ao gerar relatório automático');
      
      alert('Relatório gerado e salvo com sucesso! Acesse a aba Relatórios para visualizar e baixar.');
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao gerar relatório.');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bot className="w-8 h-8 text-rose-500" />
              API AI DEJEM - Base de Dados
            </h1>
            <p className="text-slate-400 mt-2">
              Gerenciamento de arquivos PDF para processamento de IA.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              id="btn-validar-ia-dejem"
              onClick={() => setIsAiValidatorOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-lg transition-all font-medium flex items-center gap-2 shadow-lg shadow-rose-950/40"
            >
              <Sparkles className="w-4 h-4" /> Validar por IA
            </button>
            <button 
              onClick={() => { setShowUploadModal(true); resetUploadState(); }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 border border-slate-700"
            >
              <Upload className="w-4 h-4" /> Autorizar Upload
            </button>
            <Link href="/admin" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors font-medium flex items-center gap-2 border border-slate-800">
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

        <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-semibold text-white">Arquivos PDF Armazenados</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-950/50 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">ID (Seq)</th>
                  <th className="px-6 py-4 font-medium">Nome do Arquivo</th>
                  <th className="px-6 py-4 font-medium">Data / Hora do Upload</th>
                  <th className="px-6 py-4 font-medium">Responsável (CPF)</th>
                  <th className="px-6 py-4 font-medium">RE</th>
                  <th className="px-6 py-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                      Carregando arquivos do banco de dados...
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Nenhum arquivo PDF armazenado.
                    </td>
                  </tr>
                ) : (
                  docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-rose-500">#{doc.id}</td>
                      <td className="px-6 py-4 text-slate-200 font-medium">
                        <OperationalDocHoverCard
                          id={doc.id}
                          fileName={doc.fileName}
                          tableName="dejem_documents"
                          tableDisplayName="dejem_documents (Escalas e Documentos DEJEM)"
                          fileType="pdf"
                          badgeColor="rose"
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
                      <td className="px-6 py-4 font-mono text-slate-300">{doc.uploadedByCpf}</td>
                      <td className="px-6 py-4 font-mono text-slate-300">{doc.uploadedByRe}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleGenerateReport(doc.id)}
                            disabled={analyzingId === doc.id}
                            className="p-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/50 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                            title="Emitir Relatório Automático"
                          >
                            {analyzingId === doc.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
                            ) : (
                              <><Sparkles className="w-4 h-4" /> Emitir Relatório</>
                            )}
                          </button>
                          <button 
                            onClick={() => handleDownload(doc.id, doc.fileName)}
                            disabled={downloadingId === doc.id}
                            className="p-2 bg-slate-800 hover:bg-green-600 disabled:bg-slate-800/50 text-slate-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-2"
                            title="Baixar Arquivo"
                          >
                            {downloadingId === doc.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Baixando...</>
                            ) : (
                              <><Download className="w-4 h-4" /> Baixar</>
                            )}
                          </button>
                          <button 
                            onClick={() => promptDelete(doc)}
                            className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-2"
                            title="Autorizar Exclusão de Documento"
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
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileUp className="w-6 h-6 text-rose-500" />
                Upload de PDF
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {!authorized ? (
                <form onSubmit={handleAuthorize} className="space-y-4">
                  <p className="text-slate-400 text-sm mb-4">
                    Para enviar arquivos para o banco de dados da Inteligência Artificial, por favor identifique-se.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      CPF do Policial Militar (Padrão: <span className="font-mono text-rose-400">XXX.XXX.XXX-XX</span>)
                    </label>
                    <input 
                      type="text" 
                      className={`w-full bg-slate-950 border ${cpfError ? 'border-red-500' : 'border-slate-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono transition-colors`}
                      placeholder="000.000.000-00"
                      value={authCpf}
                      onChange={(e) => {
                        const val = formatCPF(e.target.value);
                        setAuthCpf(val);
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
                      maxLength={14}
                      required
                    />
                    {cpfError && <p className="text-red-400 text-xs mt-1 font-medium">{cpfError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      RE Militar (Padrão: <span className="font-mono text-rose-400">XXXXXX-X</span> • Módulo 11 PMESP)
                    </label>
                    <input 
                      type="text" 
                      className={`w-full bg-slate-950 border ${reError ? 'border-red-500' : 'border-slate-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono transition-colors uppercase`}
                      placeholder="Ex: 123456-7"
                      value={authRe}
                      onChange={(e) => {
                        const val = formatRE(e.target.value);
                        setAuthRe(val);
                        if (val.length === 8) {
                          if (!isValidRE(val)) {
                            setReError('RE inválido. Falha no Módulo 11 da PMESP (Padrão: XXXXXX-X).');
                          } else {
                            setReError('');
                          }
                        } else {
                          setReError('');
                        }
                      }}
                      maxLength={8}
                      required
                    />
                    {reError && <p className="text-red-400 text-xs mt-1 font-medium">{reError}</p>}
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4"
                  >
                    <ShieldCheck className="w-5 h-5" /> Autorizar Upload
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-emerald-400 font-medium text-sm">Autorizado</p>
                      <p className="text-slate-400 text-xs mt-1 font-mono">CPF: {authCpf} • RE: {authRe}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Selecione o arquivo PDF</label>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-400
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-slate-800 file:text-white
                        hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>
                  
                  <button 
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">Fazendo Upload...</span>
                    ) : (
                      <><Upload className="w-5 h-5" /> Iniciar Upload</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* AI Validator Modal */}
      <DejemAiValidatorModal
        isOpen={isAiValidatorOpen}
        onClose={() => setIsAiValidatorOpen(false)}
      />
    </div>
  );
}
