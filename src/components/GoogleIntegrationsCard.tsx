import React, { useState, useEffect } from 'react';
import { PlatformSettings, Survey, SurveyResponse } from '../types';
import {
  getSavedGoogleToken,
  requestGoogleAccessToken,
  clearGoogleToken,
  createSurveySpreadsheet,
  appendResponseToGoogleSheet,
  sendInstantSurveyEmail,
  getTokenMinutesRemaining,
  attemptSilentTokenRenewal,
} from '../services/googleWorkspaceService';
import {
  Sheet,
  Mail,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Send,
  AlertCircle,
  FileSpreadsheet,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface GoogleIntegrationsCardProps {
  platformSettings: PlatformSettings;
  surveys: Survey[];
  responses: SurveyResponse[];
  onUpdatePlatformSettings: (settings: PlatformSettings) => void;
}

export const GoogleIntegrationsCard: React.FC<GoogleIntegrationsCardProps> = ({
  platformSettings,
  surveys,
  responses,
  onUpdatePlatformSettings,
}) => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Settings local state
  const integration = platformSettings?.googleIntegration || {
    autoSyncSheets: false,
    autoSendEmailNotification: false,
    spreadsheetId: '',
    sheetName: 'Respuestas',
    notificationEmail: 'grupoulep@gmail.com',
  };

  const [spreadsheetId, setSpreadsheetId] = useState(integration.spreadsheetId || '');
  const [sheetName, setSheetName] = useState(integration.sheetName || 'Respuestas');
  const [autoSyncSheets, setAutoSyncSheets] = useState(integration.autoSyncSheets || false);
  const [notificationEmail, setNotificationEmail] = useState(integration.notificationEmail || 'grupoulep@gmail.com');
  const [autoSendEmailNotification, setAutoSendEmailNotification] = useState(
    integration.autoSendEmailNotification || false
  );

  // Status for actions
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string>('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const [minutesRemaining, setMinutesRemaining] = useState<number>(() =>
    getTokenMinutesRemaining(integration?.tokenExpiry)
  );

  useEffect(() => {
    const updateTokenStatus = () => {
      const token = getSavedGoogleToken(integration?.accessToken, integration?.tokenExpiry);
      setHasToken(!!token);
      setMinutesRemaining(getTokenMinutesRemaining(integration?.tokenExpiry));
    };

    updateTokenStatus();
    const interval = setInterval(updateTokenStatus, 15000);
    return () => clearInterval(interval);
  }, [integration?.accessToken, integration?.tokenExpiry]);

  const handleRenewNow = () => {
    setIsAuthorizing(true);
    setAuthError('');
    attemptSilentTokenRenewal(
      (token) => {
        setIsAuthorizing(false);
        setHasToken(true);
        const expiry = Date.now() + 3599 * 1000;
        const updatedSettings: PlatformSettings = {
          ...platformSettings,
          googleIntegration: {
            ...platformSettings?.googleIntegration,
            accessToken: token,
            tokenExpiry: expiry,
          },
        };
        onUpdatePlatformSettings(updatedSettings);
        setMinutesRemaining(60);
        setSuccessMessage('¡Token renovado con éxito! Vigencia extendida por 60 minutos adicionales.');
        setTimeout(() => setSuccessMessage(''), 4000);
      },
      () => {
        // If silent refresh requires interaction, prompt directly
        handleAuthorize();
      },
      notificationEmail || 'grupoulep@gmail.com'
    );
  };

  const handleAuthorize = () => {
    setIsAuthorizing(true);
    setAuthError('');
    setSuccessMessage('');
    requestGoogleAccessToken(
      (token) => {
        setIsAuthorizing(false);
        setHasToken(true);
        const expiry = Date.now() + 3599 * 1000;
        const updatedSettings: PlatformSettings = {
          ...platformSettings,
          googleIntegration: {
            ...platformSettings?.googleIntegration,
            spreadsheetId: spreadsheetId.trim(),
            sheetName: sheetName.trim() || 'Respuestas',
            autoSyncSheets: true,
            notificationEmail: notificationEmail.trim() || 'grupoulep@gmail.com',
            autoSendEmailNotification: true,
            accessToken: token,
            tokenExpiry: expiry,
          },
        };
        setAutoSyncSheets(true);
        setAutoSendEmailNotification(true);
        onUpdatePlatformSettings(updatedSettings);
        setSuccessMessage('¡Conexión exitosa con tu cuenta de Google! Notificaciones automáticas de correo activadas.');
        setTimeout(() => setSuccessMessage(''), 5000);
      },
      (err) => {
        setIsAuthorizing(false);
        console.error('Google Auth Error:', err);
        setAuthError(
          err?.message ||
            'No se pudo completar la vinculación con Google. Asegúrate de permitir las ventanas emergentes (popups).'
        );
      }
    );
  };

  const handleDisconnect = () => {
    clearGoogleToken();
    setHasToken(false);
    const updatedSettings: PlatformSettings = {
      ...platformSettings,
      googleIntegration: {
        ...platformSettings?.googleIntegration,
        spreadsheetId: spreadsheetId.trim(),
        sheetName: sheetName.trim() || 'Respuestas',
        autoSyncSheets,
        notificationEmail: notificationEmail.trim(),
        autoSendEmailNotification,
        accessToken: undefined,
        tokenExpiry: undefined,
      },
    };
    onUpdatePlatformSettings(updatedSettings);
    setSuccessMessage('Sesión de Google Workspace cerrada.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveSettings = () => {
    const existingToken = getSavedGoogleToken(integration?.accessToken, integration?.tokenExpiry);
    const updatedSettings: PlatformSettings = {
      ...platformSettings,
      googleIntegration: {
        spreadsheetId: spreadsheetId.trim(),
        sheetName: sheetName.trim() || 'Respuestas',
        autoSyncSheets,
        notificationEmail: notificationEmail.trim() || 'grupoulep@gmail.com',
        autoSendEmailNotification,
        accessToken: existingToken || integration?.accessToken,
        tokenExpiry: integration?.tokenExpiry,
      },
    };
    onUpdatePlatformSettings(updatedSettings);
    setSuccessMessage('Configuraciones de Google Sheets y Gmail guardadas correctamente.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Helper to ensure token or prompt
  const getValidTokenOrPrompt = async (): Promise<string> => {
    const existing = getSavedGoogleToken();
    if (existing) return existing;

    return new Promise((resolve, reject) => {
      requestGoogleAccessToken(
        (token) => {
          setHasToken(true);
          resolve(token);
        },
        (err) => reject(err)
      );
    });
  };

  // Create a new spreadsheet automatically
  const handleAutoCreateSpreadsheet = async () => {
    try {
      setIsCreatingSheet(true);
      setAuthError('');
      const token = await getValidTokenOrPrompt();
      const activeSurvey = surveys.find((s) => s.isActive && s.isPrimaryActive) || surveys[0];
      const title = activeSurvey ? activeSurvey.title : platformSettings.title || 'Encuestas GRUPO ULEP SAS';
      const questions = activeSurvey ? activeSurvey.questions : [];

      const result = await createSurveySpreadsheet(token, title, questions);
      setSpreadsheetId(result.spreadsheetId);
      setCreatedSheetUrl(result.spreadsheetUrl);
      setSuccessMessage('¡Hoja de cálculo de Google creada con éxito!');

      // Auto update settings
      const updated: PlatformSettings = {
        ...platformSettings,
        googleIntegration: {
          ...integration,
          spreadsheetId: result.spreadsheetId,
          sheetName: 'Respuestas',
          autoSyncSheets: true,
        },
      };
      setAutoSyncSheets(true);
      onUpdatePlatformSettings(updated);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Error al generar la hoja de cálculo en Google Drive.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Test sending a notification email via Gmail
  const handleSendTestEmail = async () => {
    if (!notificationEmail.trim()) {
      setAuthError('Por favor ingresa un correo electrónico de destino válido.');
      return;
    }

    try {
      setIsTestingEmail(true);
      setAuthError('');
      const token = await getValidTokenOrPrompt();
      const mockSurvey: Survey = surveys[0] || {
        id: 'test_survey',
        title: 'Encuesta de Prueba de Notificación',
        description: 'Prueba de integración instantánea con Gmail',
        category: 'Prueba',
        isActive: true,
        isPrimaryActive: true,
        createdAt: new Date().toISOString(),
        questions: [
          { id: 'q1', title: 'Satisfacción general del servicio', type: 'rating', required: true, ratingScale: 5 },
          { id: 'q2', title: 'Comentarios o sugerencias', type: 'text', required: false },
        ],
      };

      const mockResponse: SurveyResponse = {
        id: `test_${Date.now()}`,
        surveyId: mockSurvey.id,
        participantName: 'Participante de Prueba (Verificación)',
        submittedAt: new Date().toISOString(),
        answers: {
          q1: 5,
          q2: 'El sistema funciona de manera instantánea y excelente.',
        },
        registeredBy: 'ADMIN ULEP',
      };

      await sendInstantSurveyEmail(
        token,
        notificationEmail.trim(),
        mockSurvey,
        mockResponse,
        platformSettings.title || 'Sistema de Encuestas GRUPO ULEP SAS',
        true,
        platformSettings.emailTemplate,
        platformSettings.institutionName || 'GRUPO ULEP SAS'
      );

      setSuccessMessage(`¡Correo de prueba enviado con éxito a ${notificationEmail.trim()}! Revisa tu bandeja de entrada.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Error enviando correo de prueba:', err);
      setAuthError(err.message || 'Error al enviar el correo a través de Gmail API.');
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Sync all existing responses to the spreadsheet
  const handleSyncAllResponses = async () => {
    if (!spreadsheetId.trim()) {
      setAuthError('Debes ingresar o crear un ID de Google Spreadsheet primero.');
      return;
    }
    if (responses.length === 0) {
      setAuthError('No hay respuestas registradas para sincronizar.');
      return;
    }

    try {
      setIsSyncingAll(true);
      setAuthError('');
      setSyncStatus(`Iniciando sincronización de ${responses.length} respuestas...`);
      const token = await getValidTokenOrPrompt();

      let count = 0;
      for (const resp of responses) {
        const matchingSurvey = surveys.find((s) => s.id === resp.surveyId) || surveys[0];
        if (matchingSurvey) {
          await appendResponseToGoogleSheet(token, spreadsheetId.trim(), matchingSurvey, resp, sheetName);
          count++;
          setSyncStatus(`Sincronizadas ${count} de ${responses.length}...`);
        }
      }

      setSyncStatus('');
      setSuccessMessage(`¡${count} respuestas sincronizadas exitosamente en Google Sheets!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Fallo al sincronizar respuestas con Google Sheets.');
    } finally {
      setIsSyncingAll(false);
      setSyncStatus('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/50 via-indigo-50/30 to-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Integración con Google Sheets & Gmail</span>
              <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                En Tiempo Real
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Sincroniza respuestas automáticamente en Google Sheets y despacha notificaciones instantáneas vía Gmail.
            </p>
          </div>
        </div>

        {/* Authorization Button */}
        <div>
          {hasToken ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Conectado</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-2xs font-semibold" title="La app renueva automáticamente el token silenciosamente antes de que expire.">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Auto-renovable ({minutesRemaining} min restantes)</span>
              </span>
              <button
                type="button"
                onClick={handleRenewNow}
                disabled={isAuthorizing}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                title="Renovar token inmediatamente por 60 minutos adicionales"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuthorizing ? 'animate-spin' : ''}`} />
                <span>Renovar</span>
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                title="Desconectar sesión local de Google"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAuthorize}
              disabled={isAuthorizing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAuthorizing ? 'Conectando...' : 'Conectar Cuenta Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMessage && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {authError && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{authError}</span>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Google Sheets Configuration */}
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span>Google Sheets (Hojas de Cálculo)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncSheets}
                onChange={(e) => setAutoSyncSheets(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-700">Auto-sincronizar</span>
            </label>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Cada vez que un participante o auxiliar envíe una respuesta, se añadirá automáticamente una fila con los datos en tu hoja de Google Sheets.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                ID de la Hoja de Cálculo (Spreadsheet ID)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                {spreadsheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center shrink-0"
                    title="Abrir en Google Sheets"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                  </a>
                )}
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                Puedes copiar el ID desde la URL de tu hoja o hacer clic abajo para generar una automáticamente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de Pestaña
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Respuestas"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAutoCreateSpreadsheet}
                  disabled={isCreatingSheet}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{isCreatingSheet ? 'Creando...' : 'Crear Hoja Nueva'}</span>
                </button>
              </div>
            </div>

            {/* Sync All Historical Responses */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-2xs text-slate-500">
                {responses.length} respuesta(s) registradas actualmente
              </span>
              <button
                type="button"
                onClick={handleSyncAllResponses}
                disabled={isSyncingAll || !spreadsheetId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? (syncStatus || 'Sincronizando...') : 'Sincronizar Todo el Historial'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel 2: Gmail Instant Notifications */}
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <span>Gmail (Mensajes Instantáneos)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSendEmailNotification}
                onChange={(e) => setAutoSendEmailNotification(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-700">Notificar</span>
            </label>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Envía un correo electrónico instantáneo con el desglose completo de respuestas cada vez que se finalice una encuesta.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico de Destino
              </label>
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="grupoulep@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="text-2xs text-slate-500 mt-1">
                Recibirá un resumen estructurado y estilizado en tiempo real.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-2xs text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Formato HTML enriquecido</span>
              </div>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isTestingEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingEmail ? 'Enviando prueba...' : 'Enviar Correo de Prueba'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Save Action */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <p className="text-2xs text-slate-500">
          Los cambios se guardan y se sincronizan con las reglas de Firestore.
        </p>
        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Guardar Configuración de Google</span>
        </button>
      </div>
    </div>
  );
};
