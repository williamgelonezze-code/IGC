import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import logoPic from '../../../src/assets/images/logo.png';

const meses = [
  { nome: "JANEIRO", status: "Em Desenvolvimento", link: "#" },
  { nome: "FEVEREIRO", status: "Em Desenvolvimento", link: "#" },
  { nome: "MARÇO", status: "Em Desenvolvimento", link: "#" },
  { nome: "ABRIL", status: "Em Desenvolvimento", link: "#" },
  { nome: "MAIO", status: "Em Desenvolvimento", link: "#" },
  { nome: "JUNHO", status: "ATIVO", link: "https://1drv.ms/x/c/5ed99b317b7f88d6/IQC8ShIEhWVTT4QeW1Nz501-ATNgDTEzF93yW5cqvhdSaek?e=Kq3x5S" },
  { nome: "JULHO", status: "ATIVO", link: "https://1drv.ms/x/c/5ed99b317b7f88d6/IQB6JQd0v2-1Q6MPNl5ZdEqxAbX_yZCj-ottE5A0c7jwD3w?e=CZKdLH" },
  { nome: "AGOSTO", status: "ATIVO", link: "https://1drv.ms/x/c/5ed99b317b7f88d6/IQBqXJRKzgCvSo_Rks0twfd5ATenvJngJsMqWCNzCaaIP2k?e=UNdrUy" },
  { nome: "SETEMBRO", status: "Em Desenvolvimento", link: "#" },
  { nome: "OUTUBRO", status: "Em Desenvolvimento", link: "#" },
  { nome: "NOVEMBRO", status: "Em Desenvolvimento", link: "#" },
  { nome: "DEZEMBRO", status: "Em Desenvolvimento", link: "#" }
];

export default function RacMensalPage() {
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
            RAC MENSAL II
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-slate-400 tracking-widest uppercase whitespace-nowrap">
            Comando de Policiamento de Área Metropolitana Sete - CPA/M-7
          </h2>
        </header>

        <nav className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
          {meses.map((mes) => {
            const isAtiva = mes.status === "ATIVO";
            const innerContent = (
              <>
                <Calendar className={`w-10 h-10 mb-3 ${isAtiva ? 'text-green-500 group-hover:scale-110 transition-transform duration-300' : 'text-slate-500'}`} />
                <span className={`text-lg font-semibold tracking-wide text-center uppercase mb-2 ${isAtiva ? 'text-slate-200 group-hover:text-white' : 'text-slate-300'}`}>
                  {mes.nome}
                </span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wider border ${
                  isAtiva 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {mes.status}
                </span>
              </>
            );

            if (isAtiva && mes.link !== "#") {
              return (
                <Link 
                  key={mes.nome}
                  href={mes.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center p-6 bg-slate-900/80 border border-slate-700 rounded-2xl hover:bg-slate-800 hover:border-green-500/50 transition-all duration-300 shadow-lg hover:shadow-green-900/20 relative overflow-hidden cursor-pointer"
                >
                  {innerContent}
                </Link>
              );
            }

            return (
              <div 
                key={mes.nome}
                className="group flex flex-col items-center justify-center p-6 bg-slate-900/80 border border-slate-800 rounded-2xl transition-all duration-300 shadow-lg relative overflow-hidden opacity-80 cursor-default"
              >
                {innerContent}
              </div>
            );
          })}
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
