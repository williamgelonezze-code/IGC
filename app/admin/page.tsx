'use client';

import { useState } from 'react';
import { ArrowLeft, Users, Settings, Database, Activity, ShieldCheck, FileText, Lock, Bot, Scale, FileSpreadsheet, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import DejemAiValidatorModal from '@/components/DejemAiValidatorModal';
import CrimeAnalysisAiModal from '@/components/CrimeAnalysisAiModal';

export default function AdminPage() {
  const [isAiValidatorOpen, setIsAiValidatorOpen] = useState(false);
  const [isCrimeAnalysisModalOpen, setIsCrimeAnalysisModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col p-6 pt-12 md:p-12">
      <div className="w-full max-w-7xl mx-auto space-y-12 flex-grow">

        <header className="space-y-4 relative flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </Link>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-wider uppercase">Modo Administrador</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-lg mb-2">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Painel <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-200">Administrativo</span>
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Gerencie usuários, configure acessos, audite dados e execute a validação de regras DEJEM e análise criminal de planilhas XLS por Inteligência Artificial.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard 
            id="card-api-ai-analise-criminal"
            icon={<BrainCircuit className="w-8 h-8 text-cyan-400" />}
            title="API AI ANÁLISE CRIMINAL - Base Documentos"
            description="Exame e correlação analítica de inteligência policial com IA sobre as planilhas XLS arquivadas no Banco de Dados Cloud SGBD na tabela operational_downloads."
            colorClass="hover:border-cyan-500/60 hover:shadow-cyan-900/30 border-cyan-500/30 bg-gradient-to-b from-cyan-950/30 to-slate-900"
            badge="Inteligência AI"
            badgeColor="cyan"
            onClick={() => setIsCrimeAnalysisModalOpen(true)}
          />
          <AdminCard 
            id="card-inspecao-correlacional"
            icon={<Scale className="w-8 h-8 text-rose-500" />}
            title="Inspeção Correlacional de Regras - DEJEM / DELEGADA"
            description="Inspeção e cruzamento correlacional de escalas, tetos de diárias, restrições operacionais e administrativas, EAP e TAF/TAT."
            colorClass="hover:border-rose-500/60 hover:shadow-rose-900/30 border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-slate-900"
            badge="Inspeção"
            onClick={() => setIsAiValidatorOpen(true)}
          />
          <AdminCard 
            id="card-api-ai-dejem"
            icon={<Bot className="w-8 h-8 text-rose-500" />}
            title="API AI DEJEM - Base de Documentos"
            description="Gerenciamento de arquivos PDF enviados para a base de conhecimento e processamento da IA."
            colorClass="hover:border-rose-500/50 hover:shadow-rose-900/20 border-rose-500/20 bg-gradient-to-b from-rose-950/10 to-slate-900"
            badge="Base IA"
            href="/admin/api-ai-dejem"
          />
          <AdminCard 
            id="card-dados-operacionais-xls"
            icon={<FileSpreadsheet className="w-8 h-8 text-emerald-500" />}
            title="Dados Operacionais (Planilhas XLS)"
            description="Rotinas de arquivamento, upload e download autorizado de planilhas de dados operacionais em formato XLS com metadados e validação."
            colorClass="hover:border-emerald-500/50 hover:shadow-emerald-950/20 border-emerald-500/20 bg-gradient-to-b from-emerald-950/10 to-slate-900"
            badge="Planilhas XLS"
            badgeColor="emerald"
            href="/admin/operational-data"
          />
          <AdminCard 
            id="card-gestao-usuarios"
            icon={<Users className="w-8 h-8 text-blue-500" />}
            title="Gestão de Usuários"
            description="Cadastrar, editar ou remover acessos de usuários e operadores do sistema."
            colorClass="hover:border-blue-500/50 hover:shadow-blue-900/20"
            badge="Operadores"
            badgeColor="blue"
            onClick={() => alert('Módulo de Gestão de Usuários e Operadores em fase de integração com as permissões de acesso.')}
          />
          <AdminCard 
            id="card-logs-acesso"
            icon={<Activity className="w-8 h-8 text-emerald-500" />}
            title="Logs de Acesso"
            description="Monitoramento em tempo real de entradas e atividades no painel."
            colorClass="hover:border-emerald-500/50 hover:shadow-emerald-900/20"
            href="/admin/logs"
          />
          <AdminCard 
            id="card-banco-dados"
            icon={<Database className="w-8 h-8 text-purple-500" />}
            title="Banco de Dados"
            description="Visualização dos arquivos de dados brutos dispostos no SGBD Cloud."
            colorClass="hover:border-purple-500/50 hover:shadow-purple-900/20"
            badgeColor="purple"
            href="/admin/database"
          />
          <AdminCard 
            id="card-relatorios"
            icon={<FileText className="w-8 h-8 text-amber-500" />}
            title="Relatórios"
            description="Geração de estatísticas gerais e exportação de dados analíticos."
            colorClass="hover:border-amber-500/50 hover:shadow-amber-900/20"
            badgeColor="amber"
            href="/admin/reports"
          />
          <AdminCard 
            id="card-configuracoes"
            icon={<Settings className="w-8 h-8 text-slate-300" />}
            title="Configurações Globais"
            description="Ajuste de parâmetros, variáveis de ambiente e regras de negócio."
            colorClass="hover:border-slate-500/50 hover:shadow-slate-900/20"
            href="/admin/settings"
          />
          <AdminCard 
            id="card-igc-pm"
            icon={<FileText className="w-8 h-8 text-cyan-500" />}
            title="Gerenciamento IGC-PM"
            description="Uploads e Exclusões de Relatórios do Índice de Gestão Corporativa."
            colorClass="hover:border-cyan-500/50 hover:shadow-cyan-900/20"
            badgeColor="cyan"
            href="/admin/igc-pm"
          />
        </section>
      </div>

      <DejemAiValidatorModal 
        isOpen={isAiValidatorOpen}
        onClose={() => setIsAiValidatorOpen(false)}
      />

      <CrimeAnalysisAiModal
        isOpen={isCrimeAnalysisModalOpen}
        onClose={() => setIsCrimeAnalysisModalOpen(false)}
      />
    </main>
  );
}

function AdminCard({ 
  id,
  icon, 
  title, 
  description, 
  colorClass, 
  href,
  badge,
  badgeColor = 'rose',
  onClick
}: { 
  id?: string;
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  colorClass: string; 
  href?: string;
  badge?: string;
  badgeColor?: 'rose' | 'cyan' | 'emerald' | 'blue' | 'purple' | 'amber';
  onClick?: () => void;
}) {
  const badgeColors = {
    rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  const CardContent = (
    <>
      <div className="w-full flex items-start justify-between mb-6">
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        {badge && (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${badgeColors[badgeColor] || badgeColors.rose}`}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        {description}
      </p>
    </>
  );

  if (href) {
    return (
      <Link 
        id={id}
        href={href} 
        className={`group flex flex-col items-start p-8 bg-slate-900 border border-slate-800 rounded-2xl transition-all duration-300 shadow-lg text-left ${colorClass}`}
      >
        {CardContent}
      </Link>
    );
  }

  return (
    <button 
      id={id}
      onClick={onClick}
      className={`group flex flex-col items-start p-8 bg-slate-900 border border-slate-800 rounded-2xl transition-all duration-300 shadow-lg text-left w-full cursor-pointer ${colorClass}`}
    >
      {CardContent}
    </button>
  );
}
