import { Target, LineChart, Activity } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import logoPic from '../src/assets/images/logo.png';
import AdminButton from '@/components/AdminButton';
import LogoutButton from '@/components/LogoutButton';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center p-6 relative">
      <AdminButton />
      <LogoutButton />

      <div className="w-full max-w-6xl space-y-16 text-center flex-grow flex flex-col justify-center">
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
            Comando de Policiamento de Área Metropolitana Sete - CPA/M-7
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-slate-400 tracking-widest uppercase whitespace-nowrap">
            Painel de Gestão Corporativa
          </h2>
        </header>

        <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
          <Link 
            href="/operacoes" 
            className="col-span-1 md:col-span-2 lg:col-span-4 group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-rose-500/50 transition-all duration-300 shadow-lg hover:shadow-rose-900/20 relative overflow-hidden"
          >
            <Target className="w-14 h-14 mb-4 text-rose-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Div Op - CPA/M-7
              <span className="block mt-1">(RAC e Operações)</span>
            </span>
            <span className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Ativo
            </span>
          </Link>

          <Link 
            href="/igc-pm" 
            className="col-span-1 md:col-span-2 lg:col-span-4 group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-900/20 relative overflow-hidden"
          >
            <LineChart className="w-14 h-14 mb-4 text-cyan-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Índice de Gestão Corporativa
              <span className="block mt-1">(IGC-PM)</span>
              <span className="block mt-1">CPA/M-7</span>
              <span className="block mt-1">( Resumo Indexado)</span>
            </span>
            <span className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Ativo
            </span>
          </Link>

          <Link 
            href="/indicadores" 
            className="col-span-1 md:col-span-2 lg:col-span-4 group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-900/20 relative overflow-hidden"
          >
            <Activity className="w-14 h-14 mb-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicadores e Métricas IGC-PM do CPA/M-7
            </span>
            <span className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Ativo
            </span>
          </Link>
        </nav>
      </div>

      <footer className="w-full text-center py-6 mt-8">
        <p className="text-slate-500 text-xs md:text-sm tracking-widest uppercase font-medium">
          DESENVOLVIDO PELA Div Op do CPA/M-7 (versão 1.0.0)
        </p>
      </footer>
    </main>
  );
}
