import React, { useState } from 'react';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { PlatformSettings } from '../types';

interface LoginScreenProps {
  onLogin: (name: string) => void;
  onGoogleLogin?: (user: any) => void;
  isFirebaseConnected?: boolean;
  platformSettings?: PlatformSettings;
  activeSurvey?: any;
  auxiliaries?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  platformSettings,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const platformTitle = platformSettings?.title || 'Sistema de Encuestas IULEP';
  const platformSubtitle = platformSettings?.subtitle || 'Instituto Universitario Latinoamericano de Posgrado';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError('Por favor ingresa tu nombre o código de acceso para continuar.');
      return;
    }
    setError('');
    onLogin(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200 p-6 sm:p-8"
      >
        {/* Platform Title Header */}
        <div className="text-center mb-6 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-200">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            {platformTitle}
          </h1>
          {platformSubtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium max-w-xs mx-auto">
              {platformSubtitle}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="user-name-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Nombre o Código de Acceso
            </label>
            <div className="relative">
              <input
                id="user-name-input"
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ej: Carlos Mendoza o ADMINIULEP"
                autoFocus
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-xs"
              />
            </div>
            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer group"
          >
            <span>Continuar</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

