import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import logoPic from '../../../src/assets/images/logo.png';

export default function AdagaPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-16 text-center">
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
            Operação ADAGA
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-slate-400 tracking-widest uppercase whitespace-nowrap">
            Comando de Policiamento de Área Metropolitana Sete - CPA/M-7
          </h2>
        </header>

        <nav className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          <Link 
            href="https://adagam7.netlify.app/" 
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-900/20 relative overflow-hidden"
          >
            <Shield className="w-14 h-14 mb-4 text-red-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center uppercase">
              Operação ADAGA XV
            </span>
            <span className="mt-4 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Concluída em 03JUN26
            </span>
          </Link>

          <a 
            href="/arquivos/operacao-adaga/FINAL_ADAGACPAM7.pdf"
            download="FINAL_ADAGACPAM7.pdf"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-900/20 relative overflow-hidden"
          >
            <Shield className="w-14 h-14 mb-4 text-red-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center uppercase">
              Operação ADAGA XVI
            </span>
            <span className="mt-4 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Concluída em 08JUL26
            </span>
          </a>

          <Link 
            href="https://adaga-cpam7-17.ai.studio" 
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-900/20 relative overflow-hidden"
          >
            <Shield className="w-14 h-14 mb-4 text-red-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center uppercase">
              Operação ADAGA XVII
            </span>
            <span className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Execução
            </span>
          </Link>
        </nav>
        
        <div className="mt-12 flex justify-center">
          <Link 
            href="/operacoes" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 hover:border-slate-600 shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium uppercase tracking-wide">Voltar para Operações</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
