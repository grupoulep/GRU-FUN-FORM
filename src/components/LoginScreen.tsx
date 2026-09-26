import React, { useState } from 'react';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { PlatformSettings } from '../types';

interface LoginScreenProps {
  onLogin: (name: string, email?: string) => void;
  onGoogleLogin?: (user: any) => void;
  isFirebaseConnected?: boolean;
  platformSettings?: PlatformSettings;
  activeSurvey?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  platformSettings,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const platformTitle = platformSettings?.title || 'Sistema de Encuestas GRUPO ULEP SAS';
  const platformSubtitle = platformSettings?.subtitle || 'Gestión y Evaluación de Servicios - GRUPO ULEP SAS';

  const validateEmail = (mail: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError('Por favor ingresa tu nombre.');
      return;
    }

    // Secret entry: if ADMINULEP or ADMINIULEP is entered in the name field,
    // directly grant admin access without requiring participant email.
    const upper = cleanName.toUpperCase();
    const isSecretAdmin = upper === 'ADMINULEP' || upper === 'ADMINIULEP' || upper === 'ADMINIOLEP';

    if (isSecretAdmin) {
      setError('');
      onLogin(cleanName, cleanEmail || undefined);
      return;
    }

    // Also check if admin code was placed in the email input
    const emailUpper = cleanEmail.toUpperCase();
    if (emailUpper === 'ADMINULEP' || emailUpper === 'ADMINIULEP' || emailUpper === 'ADMINIOLEP') {
      setError('');
      onLogin(cleanEmail, undefined);
      return;
    }

    // Participant path requires valid email
    if (!cleanEmail) {
      setError('Por favor ingresa tu correo.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError('Por favor ingresa un correo válido.');
      return;
    }

    setError('');
    onLogin(cleanName, cleanEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200 p-6 sm:p-8"
      >
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b border-slate-100">
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

        {/* Clean, simple form: Name & Email only */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="user-name-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Nombre
            </label>
            <input
              id="user-name-input"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ingresa tu nombre"
              autoFocus
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>

          <div>
            <label
              htmlFor="user-email-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Correo
            </label>
            <input
              id="user-email-input"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            id="btn-login-submit"
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer group mt-2"
          >
            <span>Continuar</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
