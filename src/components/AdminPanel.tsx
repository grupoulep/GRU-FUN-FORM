import React, { useState, useEffect } from 'react';
import { Survey, Auxiliary, SurveyResponse, PlatformSettings } from '../types';
import { RealtimeReports } from './RealtimeReports';
import { SurveyManager } from './SurveyManager';
import { AuxiliaryManager } from './AuxiliaryManager';
import { 
  BarChart3, 
  ClipboardList, 
  Users, 
  Settings, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw, 
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Lock,
  LogOut,
  Pencil,
  Sliders,
  Building2,
  Flame
} from 'lucide-react';

interface AdminPanelProps {
  surveys: Survey[];
  auxiliaries: Auxiliary[];
  responses: SurveyResponse[];
  platformSettings?: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void;
  onLogout?: () => void;
  onSaveSurvey: (survey: Survey) => void;
  onDeleteSurvey: (surveyId: string) => void;
  onToggleActive: (surveyId: string) => void;
  onSetPrimaryActive: (surveyId: string) => void;
  onSaveAuxiliary: (aux: Auxiliary) => void;
  onDeleteAuxiliary: (auxId: string) => void;
  onSimulateLoginAsAux: (aux: Auxiliary) => void;
  onTestSurveyAsParticipant: (survey: Survey) => void;
  onSimulateResponse: (surveyId: string, count?: number) => void;
  onResetToDefaults: () => void;
  onClearResponses: () => void;
  onDeleteResponse?: (responseId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  surveys,
  auxiliaries,
  responses,
  platformSettings,
  onUpdatePlatformSettings,
  onLogout,
  onSaveSurvey,
  onDeleteSurvey,
  onToggleActive,
  onSetPrimaryActive,
  onSaveAuxiliary,
  onDeleteAuxiliary,
  onSimulateLoginAsAux,
  onTestSurveyAsParticipant,
  onSimulateResponse,
  onResetToDefaults,
  onClearResponses,
  onDeleteResponse,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'surveys' | 'auxiliaries' | 'settings'>('reports');
  const [confirmAction, setConfirmAction] = useState<'reset' | 'clear' | null>(null);

  // Platform Title Form State
  const [titleForm, setTitleForm] = useState<PlatformSettings>({
    title: platformSettings?.title || 'Sistema de Encuestas IULEP',
    subtitle: platformSettings?.subtitle || 'Instituto Universitario Latinoamericano de Posgrado',
    institutionName: platformSettings?.institutionName || 'IULEP',
  });
  const [titleSavedNotification, setTitleSavedNotification] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);

  useEffect(() => {
    if (platformSettings) {
      setTitleForm({
        title: platformSettings.title || 'Sistema de Encuestas IULEP',
        subtitle: platformSettings.subtitle || '',
        institutionName: platformSettings.institutionName || '',
      });
    }
  }, [platformSettings]);

  const handleSavePlatformTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!titleForm.title.trim()) return;
    if (onUpdatePlatformSettings) {
      onUpdatePlatformSettings({
        title: titleForm.title.trim(),
        subtitle: titleForm.subtitle?.trim() || '',
        institutionName: titleForm.institutionName?.trim() || '',
      });
    }
    setTitleSavedNotification(true);
    setTimeout(() => setTitleSavedNotification(false), 3000);
    setShowTitleModal(false);
  };

  const handleResetTitleToDefault = () => {
    const defaultVals: PlatformSettings = {
      title: 'Sistema de Encuestas IULEP',
      subtitle: 'Instituto Universitario Latinoamericano de Posgrado',
      institutionName: 'IULEP',
    };
    setTitleForm(defaultVals);
    if (onUpdatePlatformSettings) {
      onUpdatePlatformSettings(defaultVals);
    }
    setTitleSavedNotification(true);
    setTimeout(() => setTitleSavedNotification(false), 3000);
  };

  // Total metrics
  const totalResponses = responses.length;
  const activeSurveysCount = surveys.filter((s) => s.isActive).length;
  const totalAuxiliaries = auxiliaries.length;

  const currentPlatformTitle = platformSettings?.title || 'Sistema de Encuestas IULEP';
  const currentPlatformSubtitle = platformSettings?.subtitle || 'Instituto Universitario Latinoamericano de Posgrado';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner with Platform Title, Admin Badge & Quick Stats */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/40 relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                ADMINIULEP • Privilegios Totales
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Firebase Cloud Firestore • Sincronizado
              </span>
              <button
                onClick={() => setShowTitleModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white border border-white/15 transition-colors cursor-pointer"
                title="Cambiar el título de la plataforma de encuestas"
              >
                <Pencil className="w-3 h-3" />
                <span>Poner Título a la Plataforma</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{currentPlatformTitle}</span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-2xl">
              {currentPlatformSubtitle ? `${currentPlatformSubtitle} • ` : ''}Supervise reportes analíticos en tiempo real, configure encuestas y asigne permisos a auxiliares.
            </p>
          </div>

          {/* Quick Metrics Pills & Logout */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="block text-xl font-extrabold text-white">{activeSurveysCount}</span>
              <span className="text-2xs uppercase tracking-wider text-indigo-200">Encuestas Activas</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="block text-xl font-extrabold text-white">{totalResponses}</span>
              <span className="text-2xs uppercase tracking-wider text-indigo-200">Respuestas Vivas</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="block text-xl font-extrabold text-white">{totalAuxiliaries}</span>
              <span className="text-2xs uppercase tracking-wider text-indigo-200">Auxiliares</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-red-500/80 text-white text-xs font-bold transition-all border border-white/15 flex items-center gap-2 cursor-pointer shadow-sm"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-indigo-700/40 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reportes en Tiempo Real</span>
          </button>

          <button
            onClick={() => setActiveTab('surveys')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'surveys'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Gestión de Encuestas ({surveys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('auxiliaries')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'auxiliaries'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Módulo de Auxiliares ({auxiliaries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-indigo-950 shadow-md'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Título & Configuración</span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'reports' && (
          <RealtimeReports
            surveys={surveys}
            responses={responses}
            onSimulateResponse={onSimulateResponse}
            onDeleteResponse={onDeleteResponse}
          />
        )}

        {activeTab === 'surveys' && (
          <SurveyManager
            surveys={surveys}
            responses={responses}
            onSaveSurvey={onSaveSurvey}
            onDeleteSurvey={onDeleteSurvey}
            onToggleActive={onToggleActive}
            onSetPrimaryActive={onSetPrimaryActive}
            onTestSurvey={onTestSurveyAsParticipant}
          />
        )}

        {activeTab === 'auxiliaries' && (
          <AuxiliaryManager
            auxiliaries={auxiliaries}
            surveys={surveys}
            onSaveAuxiliary={onSaveAuxiliary}
            onDeleteAuxiliary={onDeleteAuxiliary}
            onSimulateLoginAsAux={onSimulateLoginAsAux}
          />
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            {/* 1. TÍTULO E IDENTIDAD DE LA PLATAFORMA DE ENCUESTAS */}
            <div className="p-6 rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Título e Identidad de la Plataforma de Encuestas
                    </h3>
                    <p className="text-xs text-slate-500">
                      Personalice el nombre oficial y subtítulo institucional que verán los participantes, auxiliares y administradores.
                    </p>
                  </div>
                </div>

                {titleSavedNotification && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse self-start sm:self-auto">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Título guardado con éxito!</span>
                  </span>
                )}
              </div>

              <form onSubmit={handleSavePlatformTitle} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Título Principal */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Título de la Plataforma de Encuestas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={titleForm.title}
                      onChange={(e) => setTitleForm({ ...titleForm, title: e.target.value })}
                      placeholder="Ej: Sistema de Encuestas IULEP / Encuestas de Satisfacción 2026"
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-900 transition-all shadow-xs"
                      required
                    />
                    <p className="text-2xs text-slate-500 mt-1">
                      Este título aparecerá en el encabezado del sistema, en la pantalla de ingreso para participantes, en la pestaña del navegador y en los encabezados de cuestionarios.
                    </p>
                  </div>

                  {/* Subtítulo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Subtítulo o Entidad Patrocinante
                    </label>
                    <input
                      type="text"
                      value={titleForm.subtitle || ''}
                      onChange={(e) => setTitleForm({ ...titleForm, subtitle: e.target.value })}
                      placeholder="Ej: Instituto Universitario Latinoamericano de Posgrado"
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm text-slate-800 transition-all shadow-xs"
                    />
                  </div>

                  {/* Siglas / Nombre Corto */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Siglas o Nombre Corto Institucional
                    </label>
                    <input
                      type="text"
                      value={titleForm.institutionName || ''}
                      onChange={(e) => setTitleForm({ ...titleForm, institutionName: e.target.value })}
                      placeholder="Ej: IULEP"
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm text-slate-800 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Vista Previa en Vivo */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Vista Previa en Vivo (Encabezado y Pantalla de Ingreso):</span>
                  </div>
                  <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 leading-snug">
                        {titleForm.title.trim() || '(Sin título)'}
                      </div>
                      {titleForm.subtitle && (
                        <div className="text-xs text-slate-500 font-medium">
                          {titleForm.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResetTitleToDefault}
                    className="text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
                  >
                    Restaurar Título Predeterminado (IULEP)
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Título de la Plataforma</span>
                  </button>
                </div>
              </form>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Mantenimiento, Respaldo y Persistencia
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Opciones avanzadas para respaldar, resetear datos de demostración o gestionar la memoria local.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Reset to defaults */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  <span>Restaurar Datos Iniciales de Demostración</span>
                </div>
                <p className="text-xs text-slate-600">
                  Restaura las 3 encuestas preconfiguradas, los 3 auxiliares de ejemplo y las 10 respuestas analíticas iniciales para pruebas.
                </p>
                <button
                  onClick={() => setConfirmAction('reset')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Restaurar Valores por Defecto
                </button>
              </div>

              {/* Clear responses */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-rose-600" />
                  <span>Limpiar Respuestas de Encuestas</span>
                </div>
                <p className="text-xs text-slate-600">
                  Conserva las encuestas y auxiliares pero reinicia el contador de respuestas a 0 para empezar un sondeo completamente limpio.
                </p>
                <button
                  onClick={() => setConfirmAction('clear')}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Vaciar Respuestas Registradas
                </button>
              </div>
            </div>

            {/* In-app confirmation modal for Maintenance */}
            {confirmAction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      confirmAction === 'clear' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {confirmAction === 'clear' ? (
                        <FileSpreadsheet className="w-5 h-5" />
                      ) : (
                        <RotateCcw className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {confirmAction === 'clear' ? '¿Vaciar todas las respuestas?' : '¿Restaurar datos por defecto?'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {confirmAction === 'clear' 
                          ? 'Se eliminarán todos los registros de participantes pero se mantendrán las encuestas.'
                          : 'Se restablecerán las 3 encuestas iniciales, los auxiliares y 10 respuestas de muestra.'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (confirmAction === 'clear') {
                          onClearResponses();
                        } else {
                          onResetToDefaults();
                        }
                        setConfirmAction(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-xs ${
                        confirmAction === 'clear' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {confirmAction === 'clear' ? 'Sí, Vaciar Respuestas' : 'Sí, Restaurar Datos'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Garantía de Persistencia Local
              </p>
              <p className="text-slate-600">
                Todas las encuestas creadas, los auxiliares añadidos y las respuestas enviadas en vivo se almacenan automáticamente en el navegador y sobreviven recargas de página.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Title Edit Modal */}
      {showTitleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    Poner Título a la Plataforma de Encuestas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Actualice el nombre institucional de la plataforma al instante.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTitleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlatformTitle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Título de la Plataforma <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={titleForm.title}
                  onChange={(e) => setTitleForm({ ...titleForm, title: e.target.value })}
                  placeholder="Ej: Sistema de Encuestas IULEP"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-900 shadow-xs"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Subtítulo o Dependencia
                </label>
                <input
                  type="text"
                  value={titleForm.subtitle || ''}
                  onChange={(e) => setTitleForm({ ...titleForm, subtitle: e.target.value })}
                  placeholder="Ej: Instituto Universitario Latinoamericano de Posgrado"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm text-slate-800 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Siglas Institucionales
                </label>
                <input
                  type="text"
                  value={titleForm.institutionName || ''}
                  onChange={(e) => setTitleForm({ ...titleForm, institutionName: e.target.value })}
                  placeholder="Ej: IULEP"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm text-slate-800 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetTitleToDefault}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
                >
                  Restaurar IULEP
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTitleModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Título</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
