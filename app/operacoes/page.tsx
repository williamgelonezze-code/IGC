import { Shield, Vote, Eye, Monitor, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import logoPic from '../../src/assets/images/logo.png';

export default function OperacoesPage() {
  return (
    <main className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-5xl space-y-16 text-center flex-grow flex flex-col justify-center">
        <header className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
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
            Div OP - CPA/M-7 (Indicadores e Operações)
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-slate-400 tracking-widest uppercase whitespace-nowrap">
            Comando de Policiamento de Área Metropolitana Sete - CPA/M-7
          </h2>
        </header>

        <nav className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          <Link 
            href="/operacoes/adaga"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-900/20"
          >
            <Shield className="w-14 h-14 mb-4 text-red-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center uppercase">
              Operação ADAGA (CPA/M-7)
            </span>
          </Link>

          <Link 
            href="https://cpam7eleicoes2026.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-900/20"
          >
            <Vote className="w-14 h-14 mb-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center uppercase">
              Operação Eleições - 2026
            </span>
          </Link>

          <Link 
            href="#operacao-alta-visibilidade" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-emerald-500/50 transition-all duration-300 shadow-lg hover:shadow-emerald-900/20"
          >
            <Eye className="w-14 h-14 mb-4 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center uppercase">
              Operação Alta Visibilidade - CPA/M-7
            </span>
          </Link>

          <Link 
            href="https://sistema-de-comando-cpa-m-7-386998221666.us-west1.run.app" 
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-amber-900/20"
          >
            <Monitor className="w-14 h-14 mb-4 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center uppercase">
              Sala de Comando e Controle - CPA/M-7 (CCCon)
            </span>
          </Link>

          <Link 
            href="/operacoes/rac-mensal" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-purple-900/20"
          >
            <FileText className="w-14 h-14 mb-4 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center uppercase">
              RAC MENSAL II
            </span>
          </Link>
        </nav>
        
        <div className="mt-12 flex justify-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 hover:border-slate-600 shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium uppercase tracking-wide">Voltar para a Página Principal</span>
          </Link>
        </div>
      </div>

      <footer className="w-full text-center py-6 mt-8">
        <p className="text-slate-500 text-xs md:text-sm tracking-widest uppercase font-medium">
          DESENVOLVIDO PELA Div Op do CPA/M-7 (versão 1.0.0)
        </p>
      </footer>
    </main>
  );
}
