import React, { useState, useEffect } from 'react';
import { Survey, SurveyResponse, PlatformSettings, EmailMessageTemplate, EmailColorTheme } from '../types';
import { 
  getDefaultEmailTemplate, 
  getDefaultColorTheme,
  COLOR_PALETTE_PRESETS,
  buildSurveyEmailContent, 
  sendInstantSurveyEmail, 
  getSavedGoogleToken 
} from '../services/googleWorkspaceService';
import { 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Send, 
  Eye, 
  Copy, 
  Check, 
  Sliders, 
  Laptop,
  Smartphone,
  AlertTriangle,
  Palette,
  Layers,
  Compass,
  Type
} from 'lucide-react';

interface EmailTemplateEditorProps {
  platformSettings: PlatformSettings;
  surveys: Survey[];
  responses: SurveyResponse[];
  onUpdatePlatformSettings: (settings: PlatformSettings) => void;
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  platformSettings,
  surveys,
  responses,
  onUpdatePlatformSettings,
}) => {
  const defaultTpl = getDefaultEmailTemplate();
  const defaultColors = getDefaultColorTheme();

  // Active sub-tab in the editor: 'content' | 'colors'
  const [editorTab, setEditorTab] = useState<'content' | 'colors'>('colors');

  // Template state
  const [template, setTemplate] = useState<Required<EmailMessageTemplate>>({
    subjectTemplate: platformSettings.emailTemplate?.subjectTemplate ?? defaultTpl.subjectTemplate,
    badgeText: platformSettings.emailTemplate?.badgeText ?? defaultTpl.badgeText,
    headerTitle: platformSettings.emailTemplate?.headerTitle ?? defaultTpl.headerTitle,
    headerSubtitle: platformSettings.emailTemplate?.headerSubtitle ?? defaultTpl.headerSubtitle,
    greeting: platformSettings.emailTemplate?.greeting ?? defaultTpl.greeting,
    mainMessage: platformSettings.emailTemplate?.mainMessage ?? defaultTpl.mainMessage,
    secondaryMessage: platformSettings.emailTemplate?.secondaryMessage ?? defaultTpl.secondaryMessage,
    includeMetaBox: platformSettings.emailTemplate?.includeMetaBox ?? defaultTpl.includeMetaBox,
    includeResponsesTable: platformSettings.emailTemplate?.includeResponsesTable ?? defaultTpl.includeResponsesTable,
    tableTitle: platformSettings.emailTemplate?.tableTitle ?? defaultTpl.tableTitle,
    footerNotice: platformSettings.emailTemplate?.footerNotice ?? defaultTpl.footerNotice,
    signature: platformSettings.emailTemplate?.signature ?? defaultTpl.signature,
    colors: {
      ...defaultColors,
      ...(platformSettings.emailTemplate?.colors || {}),
    },
  });

  // Current color theme shortcuts
  const currentColors = template.colors || defaultColors;

  // Sync if platformSettings updates from cloud
  useEffect(() => {
    if (platformSettings.emailTemplate) {
      setTemplate({
        subjectTemplate: platformSettings.emailTemplate.subjectTemplate ?? defaultTpl.subjectTemplate,
        badgeText: platformSettings.emailTemplate.badgeText ?? defaultTpl.badgeText,
        headerTitle: platformSettings.emailTemplate.headerTitle ?? defaultTpl.headerTitle,
        headerSubtitle: platformSettings.emailTemplate.headerSubtitle ?? defaultTpl.headerSubtitle,
        greeting: platformSettings.emailTemplate.greeting ?? defaultTpl.greeting,
        mainMessage: platformSettings.emailTemplate.mainMessage ?? defaultTpl.mainMessage,
        secondaryMessage: platformSettings.emailTemplate.secondaryMessage ?? defaultTpl.secondaryMessage,
        includeMetaBox: platformSettings.emailTemplate.includeMetaBox ?? defaultTpl.includeMetaBox,
        includeResponsesTable: platformSettings.emailTemplate.includeResponsesTable ?? defaultTpl.includeResponsesTable,
        tableTitle: platformSettings.emailTemplate.tableTitle ?? defaultTpl.tableTitle,
        footerNotice: platformSettings.emailTemplate.footerNotice ?? defaultTpl.footerNotice,
        signature: platformSettings.emailTemplate.signature ?? defaultTpl.signature,
        colors: {
          ...defaultColors,
          ...(platformSettings.emailTemplate.colors || {}),
        },
      });
    }
  }, [platformSettings.emailTemplate]);

  // Preview settings
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(
    surveys.length > 0 ? surveys[0].id : ''
  );
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState<string>(
    platformSettings.googleIntegration?.notificationEmail || 'grupoulep@gmail.com'
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeSurvey = surveys.find((s) => s.id === selectedSurveyId) || surveys[0] || {
    id: 'demo-survey',
    title: 'Evaluación Institucional de Servicios GRUPO ULEP SAS',
    description: 'Encuesta de satisfacción y calidad en la prestación de servicios.',
    isActive: true,
    questions: [
      { id: 'q1', title: '¿Cómo califica la atención recibida por nuestro personal?', type: 'rating', required: true },
      { id: 'q2', title: '¿Recomendaría nuestros servicios a otras personas?', type: 'yes_no', required: true },
      { id: 'q3', title: '¿Tiene algún comentario o sugerencia de mejora?', type: 'text', required: false },
    ],
    createdAt: new Date().toISOString(),
  };

  const sampleResponse: SurveyResponse = {
    id: 'RESP-ULEP-2026',
    surveyId: activeSurvey.id,
    participantName: 'Carlos Mendoza Ruiz',
    participantEmail: 'carlos.mendoza@ejemplo.com',
    submittedAt: new Date().toISOString(),
    registeredBy: 'Ana Morales (Auxiliar)',
    answers: {
      q1: '5 Estrellas (Excelente)',
      q2: 'Sí',
      q3: 'Excelente atención de todo el equipo de GRUPO ULEP SAS. Muy amables y puntuales.',
    },
  };

  // Build current HTML preview with current colors and text
  const previewData = buildSurveyEmailContent({
    survey: activeSurvey,
    response: sampleResponse,
    platformTitle: platformSettings.title || 'Sistema de Encuestas GRUPO ULEP SAS',
    institutionName: platformSettings.institutionName || 'GRUPO ULEP SAS',
    isParticipantReceipt: true,
    emailTemplate: template,
    senderEmail: 'grupoulep@gmail.com',
  });

  // Handle Variable insertion
  const handleCopyVariable = (variableTag: string) => {
    navigator.clipboard.writeText(variableTag);
    setCopiedVar(variableTag);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  // Apply a curated color palette preset
  const handleApplyPalette = (palette: typeof COLOR_PALETTE_PRESETS[0]) => {
    setTemplate((prev) => ({
      ...prev,
      colors: {
        ...palette.theme,
      },
    }));
  };

  // Update specific color attribute
  const updateColorProp = (prop: keyof EmailColorTheme, value: any) => {
    setTemplate((prev) => ({
      ...prev,
      colors: {
        ...(prev.colors || defaultColors),
        presetId: 'custom',
        [prop]: value,
      },
    }));
  };

  // Quick gradient presets for the banner
  const quickGradients = [
    { name: 'Índigo Violeta', start: '#1e1b4b', mid: '#312e81', end: '#4338ca' },
    { name: 'Esmeralda Menta', start: '#064e3b', mid: '#047857', end: '#059669' },
    { name: 'Zafiro Océano', start: '#082f49', mid: '#0369a1', end: '#0284c7' },
    { name: 'Púrpura Neón', start: '#3b0764', mid: '#6b21a8', end: '#9333ea' },
    { name: 'Rubí Atardecer', start: '#881337', mid: '#be123c', end: '#e11d48' },
    { name: 'Ámbar Cálido', start: '#451a03', mid: '#78350f', end: '#b45309' },
    { name: 'Carbón Ónice', start: '#0f172a', mid: '#1e293b', end: '#334155' },
    { name: 'Turquesa Nórdico', start: '#134e4a', mid: '#0f766e', end: '#0d9488' },
    { name: 'Azul a Púrpura', start: '#1d4ed8', mid: '#4338ca', end: '#7c3aed' },
    { name: 'Magenta Coral', start: '#9d174d', mid: '#be185d', end: '#f97316' },
  ];

  // Save changes
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdatePlatformSettings({
      ...platformSettings,
      emailTemplate: template,
    });
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3500);
  };

  // Reset to default
  const handleResetToDefault = () => {
    const d = getDefaultEmailTemplate();
    setTemplate(d);
    onUpdatePlatformSettings({
      ...platformSettings,
      emailTemplate: d,
    });
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3500);
  };

  // Send test email
  const handleSendTestEmail = async () => {
    const cleanTo = testEmailAddress.trim();
    if (!cleanTo || !cleanTo.includes('@')) {
      setTestStatus({
        type: 'error',
        message: 'Por favor, introduce un correo electrónico válido para la prueba.',
      });
      return;
    }

    setIsSendingTest(true);
    setTestStatus(null);

    const googleToken = getSavedGoogleToken(
      platformSettings.googleIntegration?.accessToken,
      platformSettings.googleIntegration?.tokenExpiry
    );

    if (!googleToken) {
      setTestStatus({
        type: 'error',
        message: 'Google Workspace no está vinculado actualmente. Ve al panel "Google Sheets & Gmail" para autorizar el envío de correos por Gmail.',
      });
      setIsSendingTest(false);
      return;
    }

    try {
      await sendInstantSurveyEmail(
        googleToken,
        cleanTo,
        activeSurvey,
        sampleResponse,
        platformSettings.title || 'Sistema de Encuestas GRUPO ULEP SAS',
        true,
        template,
        platformSettings.institutionName || 'GRUPO ULEP SAS'
      );
      setTestStatus({
        type: 'success',
        message: `¡Correo de prueba enviado con éxito a ${cleanTo}! Revisa tu bandeja de entrada o spam.`,
      });
    } catch (err: any) {
      setTestStatus({
        type: 'error',
        message: `Error al enviar correo: ${err.message || 'Verifica la conexión con Gmail API.'}`,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const variablesList = [
    { tag: '{{participantName}}', desc: 'Nombre del participante' },
    { tag: '{{surveyTitle}}', desc: 'Título de la encuesta' },
    { tag: '{{institutionName}}', desc: 'Nombre de la empresa (GRUPO ULEP SAS)' },
    { tag: '{{platformTitle}}', desc: 'Título del sistema' },
    { tag: '{{date}}', desc: 'Fecha y hora' },
    { tag: '{{senderEmail}}', desc: 'grupoulep@gmail.com' },
    { tag: '{{participantEmail}}', desc: 'Correo del participante' },
    { tag: '{{responseId}}', desc: 'Folio de registro' },
    { tag: '{{year}}', desc: 'Año actual' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Edición Completa del Mensaje y Diseño de Correo
              </h2>
              <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                Gmail API
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalice la redacción, asunto, colores armónicos, degradados del encabezado y estilos por elemento del correo de agradecimiento.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {isSavedAlert && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Guardado con éxito!</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restaurar plantilla original de GRUPO ULEP SAS"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Restaurar Original</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar: Colores & Degradados VS Redacción & Contenido */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditorTab('colors')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            editorTab === 'colors'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Paletas Armónicas, Degradados & Colores</span>
        </button>

        <button
          type="button"
          onClick={() => setEditorTab('content')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            editorTab === 'content'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Redacción, Textos & Estructura</span>
        </button>
      </div>

      {/* 3. Interactive Variables Tool Bar (Accessible everywhere) */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Variables Dinámicas Disponibles (Haz clic para copiar):</span>
          </div>
          <span className="text-3xs text-slate-400">
            Se reemplazan automáticamente en el texto y asunto
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {variablesList.map((v) => {
            const isCopied = copiedVar === v.tag;
            return (
              <button
                key={v.tag}
                type="button"
                onClick={() => handleCopyVariable(v.tag)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-slate-700/80 hover:border-indigo-400'
                }`}
                title={`Copiar ${v.tag} (${v.desc})`}
              >
                {isCopied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{v.tag}</span>
                <span className="text-3xs text-slate-400 font-sans hidden md:inline">• {v.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Split View: Left (Editor Form) | Right (Realistic Live Preview) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ============================================================== */}
        {/* LEFT COLUMN: ACTIVE TAB CONTENT (COLORS OR COPYWRITING)        */}
        {/* ============================================================== */}
        <div className="xl:col-span-6 2xl:col-span-7 space-y-5">
          {/* TAB A: PALETAS ARMÓNICAS, DEGRADADOS Y COLORES INDIVIDUALES */}
          {editorTab === 'colors' && (
            <div className="space-y-6">
              {/* 1. Curated Harmonious Palettes */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Paletas Armónicas Predefinidas
                      </h3>
                      <p className="text-2xs text-slate-500">
                        Combinaciones de colores estudiadas para lograr máxima legibilidad y estética corporativa.
                      </p>
                    </div>
                  </div>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    1 Clic
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COLOR_PALETTE_PRESETS.map((palette) => {
                    const isSelected = currentColors.presetId === palette.id;
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => handleApplyPalette(palette)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer group flex items-start gap-3 ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/40 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl shrink-0 shadow-xs border border-white/40 flex items-center justify-center"
                          style={{ background: palette.previewGradient }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {palette.name}
                          </div>
                          <div className="text-3xs text-slate-500 line-clamp-1 mt-0.5">
                            {palette.tagline}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs" 
                              style={{ backgroundColor: palette.theme.bannerGradientStart }} 
                              title="Inicio"
                            />
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs" 
                              style={{ backgroundColor: palette.theme.bannerGradientEnd }} 
                              title="Fin"
                            />
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs" 
                              style={{ backgroundColor: palette.theme.primaryAccentColor }} 
                              title="Acento"
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Banner Header Gradient & Solid Controls */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Degradado del Encabezado (Banner Superior)
                      </h3>
                      <p className="text-2xs text-slate-500">
                        Configura degradados lineales suaves o colores sólidos para el banner principal.
                      </p>
                    </div>
                  </div>

                  {/* Mode switcher: Gradient vs Solid */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => updateColorProp('useGradient', true)}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        currentColors.useGradient !== false
                          ? 'bg-white text-indigo-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Degradado
                    </button>
                    <button
                      type="button"
                      onClick={() => updateColorProp('useGradient', false)}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        currentColors.useGradient === false
                          ? 'bg-white text-indigo-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Color Sólido
                    </button>
                  </div>
                </div>

                {/* Quick Gradient Presets Swatches */}
                {currentColors.useGradient !== false && (
                  <div className="space-y-2">
                    <span className="block text-2xs font-bold uppercase tracking-wider text-slate-500">
                      Presets Rápidos de Degradado:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {quickGradients.map((g) => (
                        <button
                          key={g.name}
                          type="button"
                          onClick={() => {
                            setTemplate((prev) => ({
                              ...prev,
                              colors: {
                                ...(prev.colors || defaultColors),
                                bannerGradientStart: g.start,
                                bannerGradientMid: g.mid,
                                bannerGradientEnd: g.end,
                                useGradient: true,
                              },
                            }));
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center gap-2 group"
                        >
                          <div
                            className="w-6 h-6 rounded-lg shrink-0 shadow-2xs border border-white/60"
                            style={{ background: `linear-gradient(135deg, ${g.start}, ${g.end})` }}
                          />
                          <span className="text-3xs font-semibold text-slate-700 group-hover:text-indigo-600 truncate">
                            {g.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gradient Color Inputs */}
                {currentColors.useGradient !== false ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                    <div>
                      <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Color Inicial
                      </label>
                      <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                        <input
                          type="color"
                          value={currentColors.bannerGradientStart}
                          onChange={(e) => updateColorProp('bannerGradientStart', e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={currentColors.bannerGradientStart}
                          onChange={(e) => updateColorProp('bannerGradientStart', e.target.value)}
                          className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Color Intermedio
                      </label>
                      <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                        <input
                          type="color"
                          value={currentColors.bannerGradientMid || currentColors.bannerGradientStart}
                          onChange={(e) => updateColorProp('bannerGradientMid', e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={currentColors.bannerGradientMid || currentColors.bannerGradientStart}
                          onChange={(e) => updateColorProp('bannerGradientMid', e.target.value)}
                          className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Color Final
                      </label>
                      <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                        <input
                          type="color"
                          value={currentColors.bannerGradientEnd}
                          onChange={(e) => updateColorProp('bannerGradientEnd', e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={currentColors.bannerGradientEnd}
                          onChange={(e) => updateColorProp('bannerGradientEnd', e.target.value)}
                          className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                        />
                      </div>
                    </div>

                    {/* Angle Selector */}
                    <div className="sm:col-span-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-slate-700 uppercase tracking-wider">
                          Dirección del Degradado:
                        </span>
                        <div className="flex gap-2">
                          {[
                            { label: 'Diagonal 135°', angle: 135 },
                            { label: 'Vertical 180°', angle: 180 },
                            { label: 'Horizontal 90°', angle: 90 },
                            { label: 'Inverso 45°', angle: 45 },
                          ].map((a) => (
                            <button
                              key={a.angle}
                              type="button"
                              onClick={() => updateColorProp('bannerGradientAngle', a.angle)}
                              className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-colors cursor-pointer ${
                                (currentColors.bannerGradientAngle || 135) === a.angle
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Color Sólido del Banner
                    </label>
                    <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-300 bg-white max-w-sm">
                      <input
                        type="color"
                        value={currentColors.bannerSolidColor || currentColors.bannerGradientStart}
                        onChange={(e) => updateColorProp('bannerSolidColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentColors.bannerSolidColor || currentColors.bannerGradientStart}
                        onChange={(e) => updateColorProp('bannerSolidColor', e.target.value)}
                        className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Per-Element Color Customization */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Personalización Individual por Elemento
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Ajuste fino del color de textos, etiquetas, bordes, tablas y fondos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Banner Title Color */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Texto del Título (Banner)
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                      <input
                        type="color"
                        value={currentColors.bannerTitleColor}
                        onChange={(e) => updateColorProp('bannerTitleColor', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentColors.bannerTitleColor}
                        onChange={(e) => updateColorProp('bannerTitleColor', e.target.value)}
                        className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Banner Subtitle Color */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Texto del Subtítulo (Banner)
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                      <input
                        type="color"
                        value={currentColors.bannerSubtitleColor}
                        onChange={(e) => updateColorProp('bannerSubtitleColor', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentColors.bannerSubtitleColor}
                        onChange={(e) => updateColorProp('bannerSubtitleColor', e.target.value)}
                        className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Primary Accent Color */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Color de Acento Principal
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                      <input
                        type="color"
                        value={currentColors.primaryAccentColor}
                        onChange={(e) => updateColorProp('primaryAccentColor', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentColors.primaryAccentColor}
                        onChange={(e) => updateColorProp('primaryAccentColor', e.target.value)}
                        className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                      />
                    </div>
                    <span className="text-3xs text-slate-400 mt-1 block">
                      Usado en líneas divisorias, títulos de sección y enlaces
                    </span>
                  </div>

                  {/* Greeting / Headings Color */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Color del Saludo y Títulos
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                      <input
                        type="color"
                        value={currentColors.greetingColor}
                        onChange={(e) => updateColorProp('greetingColor', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentColors.greetingColor}
                        onChange={(e) => updateColorProp('greetingColor', e.target.value)}
                        className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Body Text Color */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Color de Texto del Mensaje
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                      <input
                        type="color"
                        value={currentColors.bodyTextColor}
                        onChange={(e) => updateColorProp('bodyTextColor', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentColors.bodyTextColor}
                        onChange={(e) => updateColorProp('bodyTextColor', e.target.value)}
                        className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Card Background Color */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Fondo de la Tarjeta del Correo
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                      <input
                        type="color"
                        value={currentColors.cardBgColor}
                        onChange={(e) => updateColorProp('cardBgColor', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentColors.cardBgColor}
                        onChange={(e) => updateColorProp('cardBgColor', e.target.value)}
                        className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Meta Box Background */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Fondo del Cuadro de Metadatos
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                      <input
                        type="color"
                        value={currentColors.metaBoxBgColor}
                        onChange={(e) => updateColorProp('metaBoxBgColor', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentColors.metaBoxBgColor}
                        onChange={(e) => updateColorProp('metaBoxBgColor', e.target.value)}
                        className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Table Header Background */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Fondo del Encabezado de Tabla
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-300 bg-white">
                      <input
                        type="color"
                        value={currentColors.tableHeaderBg}
                        onChange={(e) => updateColorProp('tableHeaderBg', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentColors.tableHeaderBg}
                        onChange={(e) => updateColorProp('tableHeaderBg', e.target.value)}
                        className="w-full text-xs font-mono font-semibold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => updateColorProp('presetId', 'indigo_royal')}
                    className="text-xs text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer"
                  >
                    Revertir a colores originales
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Colores y Plantilla</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB B: TEXTOS, REDACCIÓN Y ESTRUCTURA */}
          {editorTab === 'content' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Redacción y Campos del Mensaje
                </h3>
                <span className="text-xs text-slate-500">Edición en tiempo real</span>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Asunto */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Asunto del Correo Electrónico <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={template.subjectTemplate}
                    onChange={(e) => setTemplate({ ...template, subjectTemplate: e.target.value })}
                    placeholder="Agradecimiento por tu participación en la encuesta: {{surveyTitle}} - {{institutionName}}"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs font-semibold text-slate-900 shadow-2xs transition-all"
                    required
                  />
                  <p className="text-2xs text-slate-500 mt-1">
                    La línea de asunto que el participante verá en su bandeja de entrada.
                  </p>
                </div>

                {/* Banner Header Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Etiqueta Superior (Badge)
                    </label>
                    <input
                      type="text"
                      value={template.badgeText}
                      onChange={(e) => setTemplate({ ...template, badgeText: e.target.value })}
                      placeholder="Comprobante y Agradecimiento"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs text-slate-900 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Título del Banner Encabezado
                    </label>
                    <input
                      type="text"
                      value={template.headerTitle}
                      onChange={(e) => setTemplate({ ...template, headerTitle: e.target.value })}
                      placeholder="{{institutionName}}"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-900 shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Subtítulo del Banner Encabezado
                    </label>
                    <input
                      type="text"
                      value={template.headerSubtitle}
                      onChange={(e) => setTemplate({ ...template, headerSubtitle: e.target.value })}
                      placeholder='Agradecimiento por completar la encuesta "{{surveyTitle}}"'
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs text-slate-800 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Saludo */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Saludo Personalizado al Participante
                  </label>
                  <input
                    type="text"
                    value={template.greeting}
                    onChange={(e) => setTemplate({ ...template, greeting: e.target.value })}
                    placeholder="¡Estimado/a {{participantName}}!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-900 shadow-2xs"
                  />
                </div>

                {/* Mensaje Principal de Agradecimiento */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Cuerpo Principal del Mensaje (Párrafo de Agradecimiento) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={template.mainMessage}
                    onChange={(e) => setTemplate({ ...template, mainMessage: e.target.value })}
                    placeholder="En {{institutionName}} te agradecemos profundamente tu valioso tiempo..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs text-slate-800 leading-relaxed shadow-2xs resize-y"
                    required
                  />
                  <p className="text-2xs text-slate-500 mt-1">
                    Puedes separar párrafos presionando Enter dos veces.
                  </p>
                </div>

                {/* Mensaje Secundario / Conclusión */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Mensaje de Cierre / Introducción al Resumen de Respuestas
                  </label>
                  <textarea
                    rows={2}
                    value={template.secondaryMessage}
                    onChange={(e) => setTemplate({ ...template, secondaryMessage: e.target.value })}
                    placeholder="A continuación te compartimos una constancia oficial de tus respuestas registradas en nuestro sistema:"
                    className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs text-slate-800 leading-relaxed shadow-2xs resize-y"
                  />
                </div>

                {/* Opciones de Contenido Adicional */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Estructura y Tablas del Correo
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Switch Meta Box */}
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={template.includeMetaBox}
                        onChange={(e) => setTemplate({ ...template, includeMetaBox: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-900">
                          Cuadro de Metadatos
                        </span>
                        <span className="text-3xs text-slate-500">
                          Muestra nombre, correo, fecha y folio único
                        </span>
                      </div>
                    </label>

                    {/* Switch Responses Table */}
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={template.includeResponsesTable}
                        onChange={(e) => setTemplate({ ...template, includeResponsesTable: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-900">
                          Tabla de Respuestas
                        </span>
                        <span className="text-3xs text-slate-500">
                          Muestra las preguntas contestadas
                        </span>
                      </div>
                    </label>
                  </div>

                  {template.includeResponsesTable && (
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        Título de la Sección de Respuestas
                      </label>
                      <input
                        type="text"
                        value={template.tableTitle}
                        onChange={(e) => setTemplate({ ...template, tableTitle: e.target.value })}
                        placeholder="Detalle de Respuestas Proporcionadas:"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs text-slate-800 shadow-2xs"
                      />
                    </div>
                  )}
                </div>

                {/* Aviso Institucional de Pie de Correo */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Aviso Institucional de Pie de Correo
                  </label>
                  <textarea
                    rows={2}
                    value={template.footerNotice}
                    onChange={(e) => setTemplate({ ...template, footerNotice: e.target.value })}
                    placeholder="Este mensaje ha sido emitido formalmente por el {{platformTitle}}..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs text-slate-800 leading-relaxed shadow-2xs resize-y"
                  />
                </div>

                {/* Firma o Derechos */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Firma / Derechos Reservados
                  </label>
                  <input
                    type="text"
                    value={template.signature}
                    onChange={(e) => setTemplate({ ...template, signature: e.target.value })}
                    placeholder="© {{year}} {{institutionName}}. Todos los derechos reservados."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 outline-none text-xs text-slate-800 shadow-2xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-xs text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer"
                  >
                    Restaurar valores de fábrica
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Redacción y Plantilla</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: LIVE REALISTIC EMAIL CLIENT MOCKUP               */}
        {/* ============================================================== */}
        <div className="xl:col-span-6 2xl:col-span-5 space-y-4 sticky top-6">
          {/* Preview Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Vista Previa en Tiempo Real
                </span>
                <span className="text-3xs text-slate-500">
                  Refleja los colores, degradados y textos actuales
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Device switcher */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vista Escritorio"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vista Móvil"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Survey selector */}
              {surveys.length > 1 && (
                <select
                  value={selectedSurveyId}
                  onChange={(e) => setSelectedSurveyId(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                >
                  {surveys.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Email Client Window Mockup */}
          <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
            {/* Window Chrome Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-3xs text-slate-400 font-medium ml-2">
                  Gmail • Bandeja de Entrada del Participante
                </span>
              </div>
              <span className="text-3xs text-indigo-300 font-mono">
                {previewData.subject.slice(0, 36)}...
              </span>
            </div>

            {/* Email Meta Bar */}
            <div className="p-4 bg-slate-850 border-b border-slate-700/80 text-xs space-y-1 text-slate-300">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 font-semibold w-16 shrink-0">De:</span>
                <span className="font-bold text-white">GRUPO ULEP SAS</span>
                <span className="text-slate-400 text-2xs">&lt;grupoulep@gmail.com&gt;</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 font-semibold w-16 shrink-0">Para:</span>
                <span className="text-slate-200">Carlos Mendoza Ruiz &lt;carlos.mendoza@ejemplo.com&gt;</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 font-semibold w-16 shrink-0">Asunto:</span>
                <span className="font-semibold text-indigo-200">{previewData.subject}</span>
              </div>
            </div>

            {/* Rendered HTML Container */}
            <div 
              className={`p-4 overflow-y-auto max-h-[640px] flex justify-center transition-colors ${
                previewDevice === 'mobile' ? 'px-8 py-6' : 'p-4'
              }`}
              style={{ backgroundColor: currentColors.outerBgColor || '#f1f5f9' }}
            >
              <div 
                className={`w-full bg-transparent transition-all ${
                  previewDevice === 'mobile' ? 'max-w-sm shadow-lg rounded-2xl overflow-hidden' : 'max-w-xl'
                }`}
                dangerouslySetInnerHTML={{ __html: previewData.emailBodyHtml }}
              />
            </div>
          </div>

          {/* Test Email Dispatch Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Enviar Correo de Prueba a tu Bandeja
                </h4>
                <p className="text-3xs text-slate-500">
                  Prueba la plantilla enviando un correo real desde grupoulep@gmail.com
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="tu.correo@ejemplo.com"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 text-xs text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'Enviando...' : 'Enviar Prueba'}</span>
              </button>
            </div>

            {testStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                testStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
