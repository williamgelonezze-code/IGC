import { Users, Clock, BarChart2, CalendarDays, Package, Megaphone, HeartPulse, GraduationCap, Wallet, ShieldCheck, Building2, Car, ArrowLeft, ClipboardList, Brain } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import logoPic from '../../src/assets/images/logo.png';

export default function IndicadoresPage() {
  return (
    <main className="min-h-screen flex flex-col items-center p-6 pt-12 md:p-12">
      <div className="w-full max-w-7xl space-y-12 flex-grow">
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
            Indicadores e Métricas - IGC-PM
            <span className="block mt-2">CPA/M-7</span>
          </h1>
        </header>

        <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
          <Link 
            href="https://1drv.ms/x/c/5ed99b317b7f88d6/IQCX3yr5ugqwQ7mGicg5GtxbAY9OX_GBisTChO0Yjt4O3-Q?e=9U7nUH" 
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-900/20 relative overflow-hidden"
          >
            <Users className="w-14 h-14 mb-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Recursos Humanos
            </span>
            <span className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Ativo
            </span>
          </Link>

          <Link 
            href="https://1drv.ms/x/c/5ed99b317b7f88d6/IQB9BqjzTafdSp2AFzOiYFwgAUGNnMOLHrgwRTdvTXUniog?e=a6Uusj" 
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-emerald-500/50 transition-all duration-300 shadow-lg hover:shadow-emerald-900/20 relative overflow-hidden"
          >
            <ClipboardList className="w-14 h-14 mb-4 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Registros Funcionais
            </span>
            <span className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Ativo
            </span>
          </Link>

          <Link 
            href="https://1drv.ms/x/c/5ed99b317b7f88d6/IQB1tyR1qbilQJz9Kugq9YRaASAKdRsLWZkIs6THOxXWtLM?e=yocQ1f" 
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-amber-900/20 relative overflow-hidden"
          >
            <Clock className="w-14 h-14 mb-4 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de DEJEM
            </span>
            <span className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Ativo
            </span>
          </Link>

          <Link 
            href="https://1drv.ms/x/c/5ed99b317b7f88d6/IQDxO8x0dNvVRK9X3dZaw1oCAWOp_s5l6LwtSSXX2Gx3jBk?e=c4BwXm" 
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-emerald-500/50 transition-all duration-300 shadow-lg hover:shadow-emerald-900/20 relative overflow-hidden"
          >
            <BarChart2 className="w-14 h-14 mb-4 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicadores Criminais
              <span className="block mt-1">(CPA/M-7 - Série Histórica)</span>
            </span>
            <span className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Ativo
            </span>
          </Link>

          <Link 
            href="/operacoes/rac-mensal" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-purple-900/20 relative overflow-hidden"
          >
            <CalendarDays className="w-14 h-14 mb-4 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicadores Criminais
              <span className="block mt-1">(RAC II)</span>
            </span>
            <span className="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Ativo
            </span>
          </Link>

          <Link 
            href="#" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-orange-500/50 transition-all duration-300 shadow-lg hover:shadow-orange-900/20 relative overflow-hidden"
          >
            <Package className="w-14 h-14 mb-4 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Logística
            </span>
            <span className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Desenvolvimento
            </span>
          </Link>

          <Link 
            href="#" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-indigo-500/50 transition-all duration-300 shadow-lg hover:shadow-indigo-900/20 relative overflow-hidden"
          >
            <Megaphone className="w-14 h-14 mb-4 text-indigo-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Comunicação Social
            </span>
            <span className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Desenvolvimento
            </span>
          </Link>
          <Link 
            href="#" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-teal-500/50 transition-all duration-300 shadow-lg hover:shadow-teal-900/20 relative overflow-hidden"
          >
            <HeartPulse className="w-14 h-14 mb-4 text-teal-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicadores de Saúde Ocupacional (UIS)
            </span>
            <span className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Desenvolvimento
            </span>
          </Link>

          <Link 
            href="#" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-violet-500/50 transition-all duration-300 shadow-lg hover:shadow-violet-900/20 relative overflow-hidden"
          >
            <Brain className="w-14 h-14 mb-4 text-violet-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Saúde Mental (NAPS)
            </span>
            <span className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Desenvolvimento
            </span>
          </Link>

          <Link 
            href="#" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-yellow-500/50 transition-all duration-300 shadow-lg hover:shadow-yellow-900/20 relative overflow-hidden"
          >
            <GraduationCap className="w-14 h-14 mb-4 text-yellow-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Instrução e Treinamentos
            </span>
            <span className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Desenvolvimento
            </span>
          </Link>

          <Link 
            href="#" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-lime-500/50 transition-all duration-300 shadow-lg hover:shadow-lime-900/20 relative overflow-hidden"
          >
            <Wallet className="w-14 h-14 mb-4 text-lime-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Finanças
            </span>
            <span className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Desenvolvimento
            </span>
          </Link>

          <Link 
            href="#" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-900/20 relative overflow-hidden"
          >
            <ShieldCheck className="w-14 h-14 mb-4 text-red-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Redução de Letalidade Policial
            </span>
            <span className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Desenvolvimento
            </span>
          </Link>

          <Link 
            href="#" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-stone-500/50 transition-all duration-300 shadow-lg hover:shadow-stone-900/20 relative overflow-hidden"
          >
            <Building2 className="w-14 h-14 mb-4 text-stone-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Gestão Patrimonial
            </span>
            <span className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Desenvolvimento
            </span>
          </Link>

          <Link 
            href="#" 
            className="group flex flex-col items-center justify-center p-10 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-fuchsia-500/50 transition-all duration-300 shadow-lg hover:shadow-fuchsia-900/20 relative overflow-hidden"
          >
            <Car className="w-14 h-14 mb-4 text-fuchsia-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg font-semibold tracking-wide text-slate-200 group-hover:text-white text-center">
              Indicador de Controle de Frota
            </span>
            <span className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-widest uppercase whitespace-nowrap">
              Em Desenvolvimento
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
