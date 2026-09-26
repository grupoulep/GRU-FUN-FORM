import React, { useState, useEffect } from 'react';
import { Survey, SurveyResponse, PlatformSettings } from '../types';
import { RealtimeReports } from './RealtimeReports';
import { SurveyManager } from './SurveyManager';
import { GoogleIntegrationsCard } from './GoogleIntegrationsCard';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { 
  BarChart3, 
  ClipboardList, 
  Settings, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw, 
  FileSpreadsheet,
  CheckCircle2,
  LogOut,
  Pencil,
  Sliders,
  Flame,
  Zap,
  Menu,
  X,
  Activity,
  Layers,
  ChevronRight,
  Mail
} from 'lucide-react';

interface AdminPanelProps {
  surveys: Survey[];
  responses: SurveyResponse[];
  platformSettings?: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void;
  onLogout?: () => void;
  onSaveSurvey: (survey: Survey) => void;
  onDeleteSurvey: (surveyId: string) => void;
  onToggleActive: (surveyId: string) => void;
  onSetPrimaryActive: (surveyId: string) => void;
  onTestSurveyAsParticipant: (survey: Survey) => void;
  onSimulateResponse: (surveyId: string, count?: number) => void;
  onResetToDefaults: () => void;
  onClearResponses: () => void;
  onDeleteResponse?: (responseId: string) => void;
}

type TabType = 'reports' | 'surveys' | 'email' | 'google' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  surveys,
  responses,
  platformSettings,
  onUpdatePlatformSettings,
  onLogout,
  onSaveSurvey,
  onDeleteSurvey,
  onToggleActive,
  onSetPrimaryActive,
  onTestSurveyAsParticipant,
  onSimulateResponse,
  onResetToDefaults,
  onClearResponses,
  onDeleteResponse,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reset' | 'clear' | null>(null);

  // Platform Title Form State
  const [titleForm, setTitleForm] = useState<PlatformSettings>({
    title: platformSettings?.title || 'Sistema de Encuestas GRUPO ULEP SAS',
    subtitle: platformSettings?.subtitle || 'Gestión y Evaluación de Servicios - GRUPO ULEP SAS',
    institutionName: platformSettings?.institutionName || 'GRUPO ULEP SAS',
  });
  const [titleSavedNotification, setTitleSavedNotification] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);

  useEffect(() => {
    if (platformSettings) {
      setTitleForm({
        title: platformSettings.title || 'Sistema de Encuestas GRUPO ULEP SAS',
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
      title: 'Sistema de Encuestas GRUPO ULEP SAS',
      subtitle: 'Gestión y Evaluación de Servicios - GRUPO ULEP SAS',
      institutionName: 'GRUPO ULEP SAS',
    };
    setTitleForm(defaultVals);
    if (onUpdatePlatformSettings) {
      onUpdatePlatformSettings(defaultVals);
    }
    setTitleSavedNotification(true);
    setTimeout(() => setTitleSavedNotification(false), 3000);
  };

  // Metrics
  const totalResponses = responses.length;
  const activeSurveysCount = surveys.filter((s) => s.isActive).length;

  const currentPlatformTitle = platformSettings?.title || 'Sistema de Encuestas GRUPO ULEP SAS';
  const currentInstitution = platformSettings?.institutionName || 'GRUPO ULEP SAS';

  const navItems: {
    id: TabType;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: 'reports',
      label: 'Reportes en Tiempo Real',
      description: 'Métricas, análisis y gráficas en vivo',
      icon: BarChart3,
      badge: `${totalResponses} respuestas`,
    },
    {
      id: 'surveys',
      label: 'Gestión de Encuestas',
      description: 'Crear, editar y activar cuestionarios',
      icon: ClipboardList,
      badge: `${surveys.length} (${activeSurveysCount} activas)`,
    },
    {
      id: 'email',
      label: 'Mensaje de Correo',
      description: 'Edición completa del mensaje al participante',
      icon: Mail,
      badge: 'Gmail API',
    },
    {
      id: 'google',
      label: 'Google Sheets & Gmail',
      description: 'Sincronización en la nube y correos',
      icon: Zap,
      badge: 'Workspace',
    },
    {
      id: 'settings',
      label: 'Título & Configuración',
      description: 'Identidad corporativa y mantenimiento',
      icon: Settings,
    },
  ];

  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (PANELES DE ADMIN EN EL LADO IZQUIERDO)      */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 xl:w-80 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand & System Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/30 shrink-0">
              U
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 truncate">
                {currentInstitution}
              </div>
              <h2 className="text-sm font-bold text-white truncate leading-tight">
                {currentPlatformTitle}
              </h2>
            </div>
          </div>

          {/* Admin badge & Firestore live status */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col gap-1.5 text-2xs">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>ADMIN ULEP • Privilegios Totales</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Firestore • Sincronizado en Vivo</span>
            </div>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <span className="block text-base font-extrabold text-white">{activeSurveysCount}</span>
            <span className="text-3xs uppercase tracking-wider text-slate-400">Encuestas Activas</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <span className="block text-base font-extrabold text-indigo-400">{totalResponses}</span>
            <span className="text-3xs uppercase tracking-wider text-slate-400">Respuestas Totales</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-4 py-5 space-y-6">
          <div>
            <div className="px-3 mb-2 text-3xs font-extrabold uppercase tracking-widest text-slate-400">
              Paneles de Control
            </div>

            <nav className="space-y-1.5" aria-label="Paneles de administración">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className={`text-3xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-indigo-800/80 text-indigo-100'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-2xs truncate mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 space-y-2 bg-slate-950/30">
          <button
            onClick={() => setShowTitleModal(true)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700/60"
            title="Editar el título que verán los participantes"
          >
            <Pencil className="w-3.5 h-3.5 text-indigo-400" />
            <span>Editar Título del Sistema</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full px-3.5 py-2 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE TOP BAR & DRAWER (FOR PHONES AND TABLETS)          */}
      {/* ============================================================ */}
      <div className="lg:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              U
            </div>
            <div className="min-w-0">
              <div className="text-2xs text-indigo-300 font-bold uppercase truncate">
                {currentInstitution}
              </div>
              <div className="text-xs font-bold text-white truncate">
                {currentNav.label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTitleModal(true)}
              className="p-2 rounded-lg bg-slate-800 text-indigo-300 hover:text-white text-xs"
              title="Editar título"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
              aria-label="Abrir menú de paneles"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Fast Tabs */}
        <div className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-slate-800/60 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile slide-down drawer if opened */}
        {mobileMenuOpen && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="text-2xs font-bold uppercase text-slate-400">
              Seleccionar Panel de Administración
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs font-semibold ${
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-3xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {onLogout && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={onLogout}
                  className="w-full py-2 text-center text-xs font-semibold text-rose-400 hover:text-rose-300"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. RIGHT MAIN CONTENT AREA                                   */}
      {/* ============================================================ */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Header of the Active Panel */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <currentNav.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    {currentNav.label}
                  </h1>
                  {currentNav.badge && (
                    <span className="hidden sm:inline-block text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {currentNav.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentNav.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                onClick={() => setShowTitleModal(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Personalizar título de la plataforma"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Título de Plataforma</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Tiempo Real</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* TAB 1: REPORTES */}
          {activeTab === 'reports' && (
            <RealtimeReports
              surveys={surveys}
              responses={responses}
              onSimulateResponse={onSimulateResponse}
              onDeleteResponse={onDeleteResponse}
            />
          )}

          {/* TAB 2: GESTIÓN DE ENCUESTAS */}
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

          {/* TAB 3: MENSAJE DE CORREO (EDICIÓN COMPLETA) */}
          {activeTab === 'email' && onUpdatePlatformSettings && (
            <EmailTemplateEditor
              platformSettings={platformSettings || { title: 'Sistema de Encuestas GRUPO ULEP SAS' }}
              surveys={surveys}
              responses={responses}
              onUpdatePlatformSettings={onUpdatePlatformSettings}
            />
          )}

          {/* TAB 5: GOOGLE SHEETS & GMAIL */}
          {activeTab === 'google' && onUpdatePlatformSettings && (
            <GoogleIntegrationsCard
              platformSettings={platformSettings || { title: 'Sistema de Encuestas GRUPO ULEP SAS' }}
              surveys={surveys}
              responses={responses}
              onUpdatePlatformSettings={onUpdatePlatformSettings}
            />
          )}

          {/* TAB 5: TÍTULO & CONFIGURACIÓN */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* 1. TÍTULO E IDENTIDAD DE LA PLATAFORMA */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Título e Identidad de la Plataforma
                      </h2>
                      <p className="text-xs text-slate-500">
                        Personalice el nombre oficial y subtítulo de la empresa que verán los participantes y auxiliares.
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

                <form onSubmit={handleSavePlatformTitle} className="space-y-5">
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
                        placeholder="Ej: Sistema de Encuestas GRUPO ULEP SAS / Evaluación 2026"
                        className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-900 transition-all shadow-2xs"
                        required
                      />
                      <p className="text-2xs text-slate-500 mt-1">
                        Este título aparecerá en el encabezado general, pantalla de ingreso de participantes y pestaña del navegador.
                      </p>
                    </div>

                    {/* Subtítulo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        Subtítulo o Lema Institucional
                      </label>
                      <input
                        type="text"
                        value={titleForm.subtitle || ''}
                        onChange={(e) => setTitleForm({ ...titleForm, subtitle: e.target.value })}
                        placeholder="Ej: Gestión y Evaluación de Servicios - GRUPO ULEP SAS"
                        className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm text-slate-800 transition-all shadow-2xs"
                      />
                    </div>

                    {/* Siglas / Nombre Corto */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        Nombre Corto / Razón Social
                      </label>
                      <input
                        type="text"
                        value={titleForm.institutionName || ''}
                        onChange={(e) => setTitleForm({ ...titleForm, institutionName: e.target.value })}
                        placeholder="Ej: GRUPO ULEP SAS"
                        className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm text-slate-800 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Vista previa en vivo:</span>
                    </div>
                    <div className="flex items-center gap-3.5 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
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

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleResetTitleToDefault}
                      className="text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
                    >
                      Restaurar Valores por Defecto (GRUPO ULEP SAS)
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

              {/* 2. MANTENIMIENTO Y PERSISTENCIA */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Mantenimiento y Respaldo de Datos
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Opciones para reiniciar datos de prueba o limpiar respuestas de sondeos antiguos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Reset to defaults */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <RotateCcw className="w-4 h-4 text-indigo-600" />
                      <span>Restaurar Datos Iniciales de Muestra</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Restaura las 3 encuestas modelo, auxiliares de ejemplo y 10 respuestas analíticas iniciales para pruebas.
                    </p>
                    <button
                      onClick={() => setConfirmAction('reset')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      Restaurar Datos de Demostración
                    </button>
                  </div>

                  {/* Clear responses */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <FileSpreadsheet className="w-4 h-4 text-rose-600" />
                      <span>Limpiar Todas las Respuestas</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Conserva las encuestas y auxiliares pero reinicia el contador de respuestas a 0 para empezar un sondeo limpio.
                    </p>
                    <button
                      onClick={() => setConfirmAction('clear')}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Vaciar Respuestas Registradas
                    </button>
                  </div>
                </div>

                {/* Firestore info */}
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-indigo-900">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Sincronización en la Nube y Almacenamiento Local
                  </p>
                  <p className="text-slate-600">
                    Toda la información se sincroniza automáticamente con Firebase Firestore y dispone de respaldo seguro en el navegador.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================================ */}
      {/* 4. MODALS & CONFIRMATIONS                                    */}
      {/* ============================================================ */}

      {/* Confirmation Modal */}
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
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-2xs ${
                  confirmAction === 'clear' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmAction === 'clear' ? 'Sí, Vaciar Respuestas' : 'Sí, Restaurar Datos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Title Modal */}
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
                    Actualice el nombre oficial y subtítulo de la plataforma al instante.
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
                  placeholder="Ej: Sistema de Encuestas GRUPO ULEP SAS"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-900 shadow-2xs"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Subtítulo o Descripción
                </label>
                <input
                  type="text"
                  value={titleForm.subtitle || ''}
                  onChange={(e) => setTitleForm({ ...titleForm, subtitle: e.target.value })}
                  placeholder="Ej: Gestión y Evaluación de Servicios - GRUPO ULEP SAS"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm text-slate-800 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Nombre Corto / Razón Social
                </label>
                <input
                  type="text"
                  value={titleForm.institutionName || ''}
                  onChange={(e) => setTitleForm({ ...titleForm, institutionName: e.target.value })}
                  placeholder="Ej: GRUPO ULEP SAS"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-sm text-slate-800 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetTitleToDefault}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
                >
                  Restaurar GRUPO ULEP SAS
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
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
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
