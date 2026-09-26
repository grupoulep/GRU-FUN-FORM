import React from 'react';
import { CurrentUser } from '../types';
import { ShieldCheck, Users, LogOut, Activity } from 'lucide-react';

interface NavbarProps {
  currentUser: CurrentUser | null;
  onLogout: () => void;
  onSwitchToParticipant?: () => void;
  activeSurveyTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  activeSurveyTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <span className="font-extrabold text-lg tracking-wider">I</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">GRUPO ULEP</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Encuestas
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {activeSurveyTitle ? `Activa: ${activeSurveyTitle}` : 'Plataforma de Consulta y Gestión'}
            </p>
          </div>
        </div>

        {/* Live status badge & User Session */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              Tiempo Real
            </span>
          </div>

          {currentUser && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Role badge */}
              {currentUser.role === 'admin' && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Admin Total:</span>
                  <span>ADMIN ULEP</span>
                </div>
              )}

              {currentUser.role === 'participant' && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Participante:</span>
                  <span className="font-medium text-slate-900">{currentUser.name}</span>
                </div>
              )}

              {/* Logout / Switch */}
              <button
                onClick={onLogout}
                title="Cambiar usuario o salir"
                className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
