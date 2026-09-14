'use client';

import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <button
      onClick={handleLogout}
      className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 rounded-lg transition-all duration-300"
      title="Sair / Atualizar"
    >
      <LogOut className="w-5 h-5" />
      <span className="font-medium text-sm">Sair</span>
    </button>
  );
}
