/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Database, 
  FileSpreadsheet, 
  FileText, 
  HardDrive, 
  ShieldCheck, 
  UserCheck, 
  Calendar,
  Sparkles,
  Trash2,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';

export interface OperationalDocHoverCardProps {
  id: number;
  fileName: string;
  tableName?: 'operational_documents' | 'dejem_documents' | 'api_reports' | 'audit_reports' | 'authorized_deletion_audits' | string;
  tableDisplayName?: string;
  badgeColor?: 'emerald' | 'rose' | 'amber' | 'blue' | 'purple' | 'red';
  fileSize?: string | null;
  fileType?: string; // 'xls' | 'pdf' | 'xlsx'
  description?: string | null;
  uploadedByCpf?: string | null;
  uploadedByRe?: string | null;
  createdAt?: string | null;
  maxDisplayWidth?: string;
  metadata?: any;
  customBadge?: string;
  isDeleted?: boolean;
  wrapName?: boolean;
}

interface PopupCoords {
  top: number;
  left: number;
  width: number;
  useTranslateY: boolean;
}

export default function OperationalDocHoverCard({
  id,
  fileName,
  tableName = 'operational_documents',
  tableDisplayName,
  badgeColor,
  fileSize,
  fileType = 'xls',
  description,
  uploadedByCpf,
  uploadedByRe,
  createdAt,
  maxDisplayWidth = 'max-w-[280px]',
  metadata,
  customBadge,
  isDeleted = false,
  wrapName = false,
}: OperationalDocHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState<PopupCoords | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Normalize file type
  const isPdf = fileType.toLowerCase().includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isXls = fileType.toLowerCase().includes('xls') || fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx');

  // Determine theme color
  const colorTheme = badgeColor || (
    isDeleted ? 'red' :
    tableName === 'dejem_documents' ? 'rose' :
    tableName === 'api_reports' || tableName === 'audit_reports' ? 'amber' :
    isPdf ? 'rose' : 'emerald'
  );

  // Theme styling dictionaries
  const themeStyles = {
    emerald: {
      triggerBg: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
      triggerText: 'group-hover:text-emerald-300 group-hover:border-emerald-400/60',
      triggerIcon: 'group-hover:text-emerald-400',
      badgeBg: 'bg-emerald-950 border-emerald-700 text-emerald-300',
      popupBorder: 'border-emerald-500/90 shadow-emerald-950/70',
      headerBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      headerText: 'text-emerald-300',
      boxBorder: 'border-emerald-500/50',
      boxText: 'text-emerald-300',
      iconColor: 'text-emerald-400',
    },
    rose: {
      triggerBg: 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20',
      triggerText: 'group-hover:text-rose-300 group-hover:border-rose-400/60',
      triggerIcon: 'group-hover:text-rose-400',
      badgeBg: 'bg-rose-950 border-rose-700 text-rose-300',
      popupBorder: 'border-rose-500/90 shadow-rose-950/70',
      headerBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
      headerText: 'text-rose-300',
      boxBorder: 'border-rose-500/50',
      boxText: 'text-rose-300',
      iconColor: 'text-rose-400',
    },
    amber: {
      triggerBg: 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20',
      triggerText: 'group-hover:text-amber-300 group-hover:border-amber-400/60',
      triggerIcon: 'group-hover:text-amber-400',
      badgeBg: 'bg-amber-950 border-amber-700 text-amber-300',
      popupBorder: 'border-amber-500/90 shadow-amber-950/70',
      headerBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
      headerText: 'text-amber-300',
      boxBorder: 'border-amber-500/50',
      boxText: 'text-amber-300',
      iconColor: 'text-amber-400',
    },
    red: {
      triggerBg: 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20',
      triggerText: 'group-hover:text-red-300 group-hover:border-red-400/60',
      triggerIcon: 'group-hover:text-red-400',
      badgeBg: 'bg-red-950 border-red-700 text-red-300',
      popupBorder: 'border-red-500/90 shadow-red-950/70',
      headerBg: 'bg-red-500/20 text-red-400 border border-red-500/40',
      headerText: 'text-red-300',
      boxBorder: 'border-red-500/50',
      boxText: 'text-red-300',
      iconColor: 'text-red-400',
    },
    blue: {
      triggerBg: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
      triggerText: 'group-hover:text-blue-300 group-hover:border-blue-400/60',
      triggerIcon: 'group-hover:text-blue-400',
      badgeBg: 'bg-blue-950 border-blue-700 text-blue-300',
      popupBorder: 'border-blue-500/90 shadow-blue-950/70',
      headerBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
      headerText: 'text-blue-300',
      boxBorder: 'border-blue-500/50',
      boxText: 'text-blue-300',
      iconColor: 'text-blue-400',
    },
    purple: {
      triggerBg: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20',
      triggerText: 'group-hover:text-purple-300 group-hover:border-purple-400/60',
      triggerIcon: 'group-hover:text-purple-400',
      badgeBg: 'bg-purple-950 border-purple-700 text-purple-300',
      popupBorder: 'border-purple-500/90 shadow-purple-950/70',
      headerBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
      headerText: 'text-purple-300',
      boxBorder: 'border-purple-500/50',
      boxText: 'text-purple-300',
      iconColor: 'text-purple-400',
    },
  }[colorTheme] || {
    triggerBg: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
    triggerText: 'group-hover:text-emerald-300 group-hover:border-emerald-400/60',
    triggerIcon: 'group-hover:text-emerald-400',
    badgeBg: 'bg-emerald-950 border-emerald-700 text-emerald-300',
    popupBorder: 'border-emerald-500/90 shadow-emerald-950/70',
    headerBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    headerText: 'text-emerald-300',
    boxBorder: 'border-emerald-500/50',
    boxText: 'text-emerald-300',
    iconColor: 'text-emerald-400',
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    
    // Desired card width, responsive to viewport
    const popupWidth = Math.min(380, Math.max(300, window.innerWidth - 32));
    const estimatedHeight = 260;
    
    // SEMPRE ABRIR PARA CIMA DA TELA (conforme solicitado)
    // Se a linha estiver perto do topo da janela (menos que estimatedHeight + 16),
    // ancoramos no topo (12px) para não cortar a exibição
    let top = rect.top - 8;
    let useTranslateY = true;

    if (rect.top - estimatedHeight < 12) {
      top = 12;
      useTranslateY = false;
    }

    // X position with boundary clamping
    let left = rect.left;
    if (left + popupWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popupWidth - 16);
    }
    if (left < 16) {
      left = 16;
    }

    setCoords({
      top,
      left,
      width: popupWidth,
      useTranslateY,
    });
  }, []);

  const handleMouseEnter = () => {
    updatePosition();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Keep card positioned during scroll or resize
  useEffect(() => {
    if (!isHovered) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isHovered, updatePosition]);

  const displayTableName = tableDisplayName || tableName;

  return (
    <div
      ref={triggerRef}
      className="relative inline-block align-middle"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Target item that triggers hover */}
      <div className="cursor-pointer group flex items-start gap-2 py-0.5">
        <div className={`mt-0.5 p-1 rounded transition-colors shrink-0 ${themeStyles.triggerBg}`}>
          {isDeleted ? (
            <Trash2 className="w-4 h-4" />
          ) : isPdf ? (
            <FileText className="w-4 h-4" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
        </div>

        <div className="text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-semibold text-white transition-colors block ${wrapName ? 'break-all whitespace-normal' : 'truncate'} ${maxDisplayWidth} border-b border-dashed border-slate-700 pb-0.5 ${themeStyles.triggerText}`}
              title={`Arquivo no Banco de Dados: ${fileName}\nTabela: ${displayTableName} (ID: #${id})`}
            >
              {fileName}
            </span>
            <Database className={`w-3 h-3 text-slate-500 transition-colors shrink-0 ${themeStyles.triggerIcon}`} />
          </div>

          {description && (
            <span className={`text-xs text-slate-400 block truncate ${maxDisplayWidth} mt-0.5`} title={description}>
              {description}
            </span>
          )}

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded flex items-center gap-1 ${themeStyles.badgeBg}`}>
              <Database className="w-2.5 h-2.5" />
              <span>{tableName} #{id}</span>
            </span>
            {customBadge && (
              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                {customBadge}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Detailed Hover Popover rendered via createPortal directly into document.body */}
      {mounted && isHovered && coords && createPortal(
        <div
          className={`fixed z-[9999] p-3.5 rounded-xl bg-slate-950 border-2 shadow-[0_25px_60px_rgba(0,0,0,0.98)] animate-in fade-in zoom-in-95 duration-150 text-left pointer-events-none transition-all ${themeStyles.popupBorder}`}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            transform: coords.useTranslateY ? 'translateY(-100%)' : 'none',
          }}
        >
          {/* Header with Title and Table ID */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${themeStyles.headerBg}`}>
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Registro no Banco de Dados SGBD</span>
                  <span title="Posicionado acima da linha para facilitar a leitura">
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </h4>
                <p className="text-[11px] font-mono text-slate-400">
                  Tabela: <span className={`font-semibold ${themeStyles.headerText}`}>{tableName}</span>
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-200 px-2 py-0.5 rounded-full font-bold">
              ID #{id}
            </span>
          </div>

          {/* Stored File Name Box */}
          <div className={`bg-[#030712] border rounded-lg p-2 mb-2 space-y-0.5 ${themeStyles.boxBorder}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <HardDrive className={`w-3 h-3 ${themeStyles.iconColor}`} />
              Nome do Arquivo Gravado no Banco:
            </span>
            <p className={`text-xs font-mono font-bold break-all select-all ${themeStyles.boxText}`}>
              {fileName}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="space-y-1.5 text-xs">
            {description && (
              <div className="bg-[#030712] p-1.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block font-medium">Descrição Operacional:</span>
                <span className="text-slate-200 text-xs line-clamp-2">{description}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-[#030712] p-1.5 rounded-lg border border-slate-800 text-[11px]">
                <span className="text-slate-400 block text-[10px]">Formato / Tipo:</span>
                <span className="text-white font-mono font-semibold uppercase">
                  .{fileType} ({isPdf ? 'PDF' : isXls ? 'XLS/XLSX' : 'Arquivo'})
                </span>
              </div>
              <div className="bg-[#030712] p-1.5 rounded-lg border border-slate-800 text-[11px]">
                <span className="text-slate-400 block text-[10px]">Tamanho Gravado:</span>
                <span className="text-white font-mono font-semibold">{fileSize || 'Automático'}</span>
              </div>
            </div>

            {(uploadedByCpf || uploadedByRe) && (
              <div className="bg-[#030712] p-1.5 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] gap-2">
                <span className="text-slate-400 flex items-center gap-1 text-[10px] shrink-0">
                  <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{isDeleted ? 'Autorizador:' : 'Responsável:'}</span>
                </span>
                <span className="text-slate-200 font-mono text-right text-[10.5px] truncate" title={`${uploadedByCpf ? `CPF: ${uploadedByCpf}` : ''} ${uploadedByRe ? `• RE: ${uploadedByRe}` : ''}`}>
                  {uploadedByCpf ? `CPF: ${uploadedByCpf}` : ''} {uploadedByRe ? `• RE: ${uploadedByRe}` : ''}
                </span>
              </div>
            )}

            {createdAt && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 py-0.5">
                <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>{isDeleted ? 'Data Exclusão:' : 'Data Arquivamento:'}</span>
                </span>
                <span className="font-mono text-slate-200 text-[11px]">{createdAt}</span>
              </div>
            )}

            {/* If there are custom metadata keys */}
            {metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0 && (
              <div className="bg-[#030712] p-1.5 rounded-lg border border-slate-800/80 text-[10px]">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1 font-medium">
                  <Info className="w-3 h-3 text-slate-400" /> Metadados Complementares:
                </span>
                <div className="text-slate-300 font-mono text-[10px] space-y-0.5 truncate">
                  {metadata.sourceDocName && <div>Doc Origem: {metadata.sourceDocName}</div>}
                  {metadata.total_ids_avaliados !== undefined && <div>IDs Avaliados: {metadata.total_ids_avaliados}</div>}
                  {metadata.ip && <div>IP Origem: {metadata.ip}</div>}
                  {metadata.cidade && <div>Local: {metadata.cidade}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Footer Security Badge */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className={`flex items-center gap-1 font-medium ${themeStyles.iconColor}`}>
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>{isDeleted ? 'Auditoria Permanente de Exclusão' : 'Banco de Dados Cloud SQL Ativo'}</span>
            </span>
            <span className="text-slate-400 font-mono font-medium">Segurança Orgânica IGC/PM</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
