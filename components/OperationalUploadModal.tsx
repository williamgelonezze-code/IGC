'use client';

import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Loader2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { formatCPF, formatRE, isValidCPF, isValidRE } from '@/lib/validations';

interface OperationalUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export default function OperationalUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: OperationalUploadModalProps) {
  const [authCpf, setAuthCpf] = useState('');
  const [authRe, setAuthRe] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [reError, setReError] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setAuthCpf('');
    setAuthRe('');
    setCpfError('');
    setReError('');
    setAuthorized(false);
    setSelectedFile(null);
    setDescription('');
    setGeneralError('');
    onClose();
  };

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    setCpfError('');
    setReError('');
    setGeneralError('');

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
      const validExtensions = ['.xls', '.xlsx', '.csv'];
      const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (validExtensions.includes(fileExt) || file.type.includes('spreadsheet') || file.type.includes('excel') || file.type.includes('csv')) {
        setSelectedFile(file);
      } else {
        alert('Por favor, selecione apenas arquivos de planilha (.XLS, .XLSX ou .CSV).');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !authorized) return;

    try {
      setUploading(true);
      setGeneralError('');

      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'xls';
      const fileSizeFormatted = `${(selectedFile.size / 1024).toFixed(1)} KB`;

      // Capture location data for access log
      let ipAddress = 'unknown';
      let locationData: any = {
        city: 'Desconhecido',
        region: '',
        country: '',
        latitude: null,
        longitude: null,
      };

      try {
        const ipRes = await fetch('https://api64.ipify.org?format=json').catch(() => null);
        if (ipRes && ipRes.ok) {
          const ipJson = await ipRes.json().catch(() => null);
          if (ipJson?.ip) ipAddress = ipJson.ip;
        }
      } catch (err) {
        console.warn('IP check error:', err);
      }

      const res = await fetch('/api/operational-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileData: base64data,
          fileType: fileExt,
          fileSize: fileSizeFormatted,
          description: description.trim() || `Planilha operacional enviada em ${new Date().toLocaleDateString('pt-BR')}`,
          uploadedByCpf: authCpf,
          uploadedByRe: authRe,
          metadata: {
            originalSize: selectedFile.size,
            uploadedAt: new Date().toISOString(),
            ipAddress,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha no upload da planilha');
      }

      // Log in access_logs
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cpf: `${authCpf} (UPLOAD PLANILHA OPERACIONAL - ${selectedFile.name})`,
            re: authRe,
            ipAddress,
            locationData,
          }),
        });
      } catch (logErr) {
        console.warn('Log error:', logErr);
      }

      handleClose();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      console.error(err);
      setGeneralError(err.message || 'Erro ao realizar upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Upload de Planilha Operacional</h3>
              <p className="text-slate-400 text-xs mt-0.5">Arquivamento permanente no banco de dados SGBD</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {generalError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {!authorized ? (
            <form onSubmit={handleAuthorize} className="space-y-4">
              <p className="text-slate-400 text-xs leading-relaxed">
                Para enviar arquivos de dados operacionais ao banco de dados Cloud, identifique-se com suas credenciais funcionais.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  CPF do Policial Militar (Padrão: <span className="font-mono text-emerald-400">XXX.XXX.XXX-XX</span>)
                </label>
                <input
                  type="text"
                  className={`w-full bg-slate-950 border ${
                    cpfError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-800'
                  } rounded-lg px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors`}
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
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  RE Militar (Padrão: <span className="font-mono text-emerald-400">XXXXXX-X</span> • Módulo 11 PMESP)
                </label>
                <input
                  type="text"
                  className={`w-full bg-slate-950 border ${
                    reError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-800'
                  } rounded-lg px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors uppercase`}
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4 text-sm shadow-md"
              >
                <ShieldCheck className="w-4 h-4" /> Autorizar Upload
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-emerald-400 font-medium text-xs">Responsável Autorizado</p>
                  <p className="text-slate-300 text-xs font-mono mt-0.5">CPF: {authCpf} • RE: {authRe}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Selecione a Planilha (.XLS / .XLSX / .CSV)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-400
                    file:mr-3 file:py-2 file:px-3.5
                    file:rounded-lg file:border-0
                    file:text-xs file:font-semibold
                    file:bg-slate-800 file:text-white
                    hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Descrição do Conteúdo Operacional (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Dados de Efetivo e Viaturas - ADAGA Junho/2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2 text-sm shadow-md"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Armazenando no Banco de Dados...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Iniciar Arquivamento Cloud</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
