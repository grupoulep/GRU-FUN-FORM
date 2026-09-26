import firebaseConfig from '../../firebase-applet-config.json';
import { Survey, SurveyResponse, EmailMessageTemplate, EmailColorTheme } from '../types';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export const OAUTH_CLIENT_ID = firebaseConfig.oAuthClientId || '1065688809566-u39c2jr8bdbr62iiqem2bdp4aj55fjf2.apps.googleusercontent.com';
export const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ');

const TOKEN_STORAGE_KEY = 'google_workspace_oauth_token';
const TOKEN_EXPIRY_KEY = 'google_workspace_oauth_token_expiry';

export interface GoogleAuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
}

// Get cached access token if still valid
export function getSavedGoogleToken(fallbackToken?: string, fallbackExpiry?: number): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY) || fallbackToken;
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY) || (fallbackExpiry ? fallbackExpiry.toString() : null);
  if (!token) return null;

  if (expiry && Date.now() > parseInt(expiry, 10) - 30000) {
    // expired or expiring in less than 30s
    if (localStorage.getItem(TOKEN_STORAGE_KEY)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
    return fallbackToken && Date.now() < (fallbackExpiry || 0) ? fallbackToken : null;
  }
  return token;
}

export function saveGoogleToken(token: string, expiresInSeconds: number) {
  const expiryTimestamp = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
}

export function clearGoogleToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

// Check if token is expired or expiring soon (within threshold minutes)
export function isTokenExpiringSoon(thresholdMinutes: number = 10, fallbackExpiry?: number): boolean {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY) || (fallbackExpiry ? fallbackExpiry.toString() : null);
  if (!expiryStr) return true;
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry)) return true;
  return Date.now() > expiry - thresholdMinutes * 60 * 1000;
}

// Get minutes remaining until token expiration
export function getTokenMinutesRemaining(fallbackExpiry?: number): number {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY) || (fallbackExpiry ? fallbackExpiry.toString() : null);
  if (!expiryStr) return 0;
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry)) return 0;
  const diffMs = expiry - Date.now();
  return Math.max(0, Math.floor(diffMs / 60000));
}

// Request access token via Firebase Auth or Google Identity Services
export async function requestGoogleAccessToken(
  onSuccess: (token: string) => void,
  onError?: (err: any) => void,
  hintEmail: string = 'grupoulep@gmail.com',
  prompt: string = ''
): Promise<void> {
  // Method 1: Try Firebase Auth signInWithPopup (uses authDomain gen-lang-client-0359071638.firebaseapp.com to prevent origin mismatch)
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      saveGoogleToken(credential.accessToken, 3599);
      onSuccess(credential.accessToken);
      return;
    }
  } catch (firebaseErr: any) {
    console.warn('Firebase Auth popup attempt:', firebaseErr?.code || firebaseErr?.message);
    if (firebaseErr?.code === 'auth/popup-closed-by-user') {
      if (onError) onError(new Error('Ventana de autorización cancelada por el usuario.'));
      return;
    }
  }

  // Method 2: Fallback to Google Identity Services client
  if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: REQUIRED_SCOPES,
        hint: hintEmail,
        callback: (response: any) => {
          if (response.error) {
            console.error('Error al autorizar Google:', response);
            if (onError) onError(response);
            return;
          }
          if (response.access_token) {
            saveGoogleToken(response.access_token, response.expires_in || 3599);
            onSuccess(response.access_token);
          }
        },
        error_callback: (nonOAuthErr: any) => {
          console.error('Error en popup de Google OAuth:', nonOAuthErr);
          if (onError) onError(nonOAuthErr);
        },
      });

      client.requestAccessToken({ prompt });
      return;
    } catch (gisErr: any) {
      console.error('Error al inicializar cliente GIS:', gisErr);
      if (onError) onError(gisErr);
      return;
    }
  }

  const errorMsg = 'No se pudo inicializar la autenticación de Google en el navegador. Intente nuevamente en unos segundos.';
  if (onError) onError(new Error(errorMsg));
}

// Attempts silent token refresh in the background without UI interruption
export function attemptSilentTokenRenewal(
  onSuccess: (newToken: string) => void,
  onFail?: (err?: any) => void,
  hintEmail: string = 'grupoulep@gmail.com'
): void {
  requestGoogleAccessToken(
    (token) => {
      console.log('Token de Google renovado silenciosamente en segundo plano.');
      onSuccess(token);
    },
    (err) => {
      console.warn('Renovación silenciosa de Google omitida (requerirá interacción directa si la sesión caducó):', err);
      if (onFail) onFail(err);
    },
    hintEmail,
    '' // prompt: '' for silent background renewal
  );
}

// ----------------------------------------------------
// Google Sheets Integration
// ----------------------------------------------------

/**
 * Creates a brand new Google Spreadsheet with proper column headers for a survey.
 */
export async function createSurveySpreadsheet(
  accessToken: string,
  surveyTitle: string,
  questions: { id: string; title: string }[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const headers = [
    'ID Respuesta',
    'Fecha y Hora (ISO)',
    'Fecha y Hora (Local)',
    'Nombre del Participante',
    'Correo Electrónico',
    'Registrado Por',
    ...questions.map((q) => q.title),
  ];

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Respuestas: ${surveyTitle}`,
      },
      sheets: [
        {
          properties: {
            title: 'Respuestas',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error al crear hoja de cálculo (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write header row and format header
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Respuestas!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headers],
      }),
    }
  );

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Appends a new survey response row into Google Sheets.
 */
export async function appendResponseToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  survey: Survey,
  response: SurveyResponse,
  sheetName: string = 'Respuestas'
): Promise<boolean> {
  const safeSheet = sheetName.trim() || 'Respuestas';

  // Format row values corresponding to headers
  const rowValues: any[] = [
    response.id,
    response.submittedAt,
    new Date(response.submittedAt).toLocaleString('es-ES'),
    response.participantName || 'Anónimo',
    response.participantEmail || 'No especificado',
    response.registeredBy || 'Directo (Participante)',
  ];

  survey.questions.forEach((q) => {
    const ans = response.answers[q.id];
    if (ans === undefined || ans === null) {
      rowValues.push('');
    } else if (Array.isArray(ans)) {
      rowValues.push(ans.join(', '));
    } else if (typeof ans === 'object') {
      rowValues.push(JSON.stringify(ans));
    } else {
      rowValues.push(ans.toString());
    }
  });

  const range = `${encodeURIComponent(safeSheet)}!A1:append`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Error al sincronizar fila con Google Sheets:', err);
    throw new Error(err.error?.message || `Fallo al escribir en Google Sheets (${res.status})`);
  }

  return true;
}

// ----------------------------------------------------
// Gmail Instant Notification Integration
// ----------------------------------------------------

/**
 * Encodes string to URL-safe base64 format without Latin1 restrictions.
 */
function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * RFC 2047 UTF-8 encoded-word format for email headers.
 */
function encodeUtf8Header(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

/**
 * Sends an instant email notification via Gmail API.
 * Supports both participant receipts and admin alerts.
 */
/**
 * Default color theme for participant thank-you email.
 */
export function getDefaultColorTheme(): Required<EmailColorTheme> {
  return {
    presetId: 'indigo_royal',
    useGradient: true,
    bannerGradientStart: '#1e1b4b',
    bannerGradientMid: '#312e81',
    bannerGradientEnd: '#4338ca',
    bannerGradientAngle: 135,
    bannerSolidColor: '#312e81',
    bannerTitleColor: '#ffffff',
    bannerSubtitleColor: '#c7d2fe',
    badgeBgColor: 'rgba(255, 255, 255, 0.16)',
    badgeTextColor: '#e0e7ff',
    cardBgColor: '#ffffff',
    outerBgColor: '#f1f5f9',
    primaryAccentColor: '#4338ca',
    greetingColor: '#1e293b',
    bodyTextColor: '#334155',
    metaBoxBgColor: '#f8fafc',
    metaBoxBorderColor: '#e2e8f0',
    tableHeaderBg: '#f1f5f9',
    tableHeaderTextColor: '#475569',
    tableAltRowBg: '#fafaf9',
    footerNoticeBg: '#f8fafc',
    footerNoticeBorder: '#4338ca',
    footerTextColor: '#94a3b8',
  };
}

/**
 * Curated harmonious color palettes & gradients designed for corporate emails.
 */
export interface ColorPalettePreset {
  id: string;
  name: string;
  tagline: string;
  category: 'gradient' | 'classic' | 'modern';
  theme: Required<EmailColorTheme>;
  previewGradient: string;
}

export const COLOR_PALETTE_PRESETS: ColorPalettePreset[] = [
  {
    id: 'indigo_royal',
    name: 'Índigo Real & Violeta',
    tagline: 'Elegancia institucional y prestigio corporativo',
    category: 'gradient',
    previewGradient: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)',
    theme: {
      presetId: 'indigo_royal',
      useGradient: true,
      bannerGradientStart: '#1e1b4b',
      bannerGradientMid: '#312e81',
      bannerGradientEnd: '#4338ca',
      bannerGradientAngle: 135,
      bannerSolidColor: '#312e81',
      bannerTitleColor: '#ffffff',
      bannerSubtitleColor: '#c7d2fe',
      badgeBgColor: 'rgba(255, 255, 255, 0.16)',
      badgeTextColor: '#e0e7ff',
      cardBgColor: '#ffffff',
      outerBgColor: '#f1f5f9',
      primaryAccentColor: '#4338ca',
      greetingColor: '#1e293b',
      bodyTextColor: '#334155',
      metaBoxBgColor: '#f8fafc',
      metaBoxBorderColor: '#e2e8f0',
      tableHeaderBg: '#f1f5f9',
      tableHeaderTextColor: '#475569',
      tableAltRowBg: '#fafaf9',
      footerNoticeBg: '#f8fafc',
      footerNoticeBorder: '#4338ca',
      footerTextColor: '#94a3b8',
    },
  },
  {
    id: 'emerald_forest',
    name: 'Esmeralda & Verde Bosque',
    tagline: 'Frescura, confianza y excelencia en servicio',
    category: 'gradient',
    previewGradient: 'linear-gradient(135deg, #064e3b, #047857, #059669)',
    theme: {
      presetId: 'emerald_forest',
      useGradient: true,
      bannerGradientStart: '#064e3b',
      bannerGradientMid: '#047857',
      bannerGradientEnd: '#059669',
      bannerGradientAngle: 135,
      bannerSolidColor: '#047857',
      bannerTitleColor: '#ffffff',
      bannerSubtitleColor: '#a7f3d0',
      badgeBgColor: 'rgba(255, 255, 255, 0.18)',
      badgeTextColor: '#d1fae5',
      cardBgColor: '#ffffff',
      outerBgColor: '#f0fdf4',
      primaryAccentColor: '#059669',
      greetingColor: '#064e3b',
      bodyTextColor: '#1f2937',
      metaBoxBgColor: '#f0fdf4',
      metaBoxBorderColor: '#bbf7d0',
      tableHeaderBg: '#ecfdf5',
      tableHeaderTextColor: '#065f46',
      tableAltRowBg: '#f7fee7',
      footerNoticeBg: '#f0fdf4',
      footerNoticeBorder: '#059669',
      footerTextColor: '#6b7280',
    },
  },
  {
    id: 'sapphire_ocean',
    name: 'Zafiro & Océano Pacífico',
    tagline: 'Seguridad ejecutiva y claridad analítica',
    category: 'gradient',
    previewGradient: 'linear-gradient(135deg, #082f49, #0369a1, #0284c7)',
    theme: {
      presetId: 'sapphire_ocean',
      useGradient: true,
      bannerGradientStart: '#082f49',
      bannerGradientMid: '#0369a1',
      bannerGradientEnd: '#0284c7',
      bannerGradientAngle: 135,
      bannerSolidColor: '#0369a1',
      bannerTitleColor: '#ffffff',
      bannerSubtitleColor: '#bae6fd',
      badgeBgColor: 'rgba(255, 255, 255, 0.18)',
      badgeTextColor: '#e0f2fe',
      cardBgColor: '#ffffff',
      outerBgColor: '#f0f9ff',
      primaryAccentColor: '#0284c7',
      greetingColor: '#0c4a6e',
      bodyTextColor: '#334155',
      metaBoxBgColor: '#f0f9ff',
      metaBoxBorderColor: '#bae6fd',
      tableHeaderBg: '#e0f2fe',
      tableHeaderTextColor: '#0369a1',
      tableAltRowBg: '#f8fafc',
      footerNoticeBg: '#f0f9ff',
      footerNoticeBorder: '#0284c7',
      footerTextColor: '#64748b',
    },
  },
  {
    id: 'amethyst_purple',
    name: 'Púrpura & Amatista Imperial',
    tagline: 'Distinción, creatividad y alta calidad',
    category: 'gradient',
    previewGradient: 'linear-gradient(135deg, #3b0764, #6b21a8, #9333ea)',
    theme: {
      presetId: 'amethyst_purple',
      useGradient: true,
      bannerGradientStart: '#3b0764',
      bannerGradientMid: '#6b21a8',
      bannerGradientEnd: '#9333ea',
      bannerGradientAngle: 135,
      bannerSolidColor: '#6b21a8',
      bannerTitleColor: '#ffffff',
      bannerSubtitleColor: '#f3e8ff',
      badgeBgColor: 'rgba(255, 255, 255, 0.18)',
      badgeTextColor: '#fae8ff',
      cardBgColor: '#ffffff',
      outerBgColor: '#faf5ff',
      primaryAccentColor: '#7e22ce',
      greetingColor: '#3b0764',
      bodyTextColor: '#374151',
      metaBoxBgColor: '#faf5ff',
      metaBoxBorderColor: '#e9d5ff',
      tableHeaderBg: '#f3e8ff',
      tableHeaderTextColor: '#6b21a8',
      tableAltRowBg: '#fdf4ff',
      footerNoticeBg: '#faf5ff',
      footerNoticeBorder: '#7e22ce',
      footerTextColor: '#6b7280',
    },
  },
  {
    id: 'sunset_ruby',
    name: 'Atardecer Rubí & Coral',
    tagline: 'Cálido, enérgico y altamente visible',
    category: 'gradient',
    previewGradient: 'linear-gradient(135deg, #881337, #be123c, #e11d48)',
    theme: {
      presetId: 'sunset_ruby',
      useGradient: true,
      bannerGradientStart: '#881337',
      bannerGradientMid: '#be123c',
      bannerGradientEnd: '#e11d48',
      bannerGradientAngle: 135,
      bannerSolidColor: '#be123c',
      bannerTitleColor: '#ffffff',
      bannerSubtitleColor: '#ffe4e6',
      badgeBgColor: 'rgba(255, 255, 255, 0.18)',
      badgeTextColor: '#ffe4e6',
      cardBgColor: '#ffffff',
      outerBgColor: '#fff1f2',
      primaryAccentColor: '#e11d48',
      greetingColor: '#881337',
      bodyTextColor: '#334155',
      metaBoxBgColor: '#fff1f2',
      metaBoxBorderColor: '#fecdd3',
      tableHeaderBg: '#ffe4e6',
      tableHeaderTextColor: '#be123c',
      tableAltRowBg: '#fffafb',
      footerNoticeBg: '#fff1f2',
      footerNoticeBorder: '#e11d48',
      footerTextColor: '#64748b',
    },
  },
  {
    id: 'amber_ebony',
    name: 'Ámbar Dorado & Ébano VIP',
    tagline: 'Exclusividad, tono cálido y prestigio',
    category: 'classic',
    previewGradient: 'linear-gradient(135deg, #451a03, #78350f, #b45309)',
    theme: {
      presetId: 'amber_ebony',
      useGradient: true,
      bannerGradientStart: '#451a03',
      bannerGradientMid: '#78350f',
      bannerGradientEnd: '#b45309',
      bannerGradientAngle: 135,
      bannerSolidColor: '#78350f',
      bannerTitleColor: '#ffffff',
      bannerSubtitleColor: '#fef3c7',
      badgeBgColor: 'rgba(255, 255, 255, 0.18)',
      badgeTextColor: '#fef3c7',
      cardBgColor: '#ffffff',
      outerBgColor: '#fffbeb',
      primaryAccentColor: '#b45309',
      greetingColor: '#451a03',
      bodyTextColor: '#334155',
      metaBoxBgColor: '#fffbeb',
      metaBoxBorderColor: '#fde68a',
      tableHeaderBg: '#fef3c7',
      tableHeaderTextColor: '#78350f',
      tableAltRowBg: '#fdfbf7',
      footerNoticeBg: '#fffbeb',
      footerNoticeBorder: '#b45309',
      footerTextColor: '#78716c',
    },
  },
  {
    id: 'graphite_tech',
    name: 'Grafito & Carbón Tecnológico',
    tagline: 'Minimalista contemporáneo de alta fidelidad',
    category: 'modern',
    previewGradient: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)',
    theme: {
      presetId: 'graphite_tech',
      useGradient: true,
      bannerGradientStart: '#0f172a',
      bannerGradientMid: '#1e293b',
      bannerGradientEnd: '#334155',
      bannerGradientAngle: 135,
      bannerSolidColor: '#1e293b',
      bannerTitleColor: '#ffffff',
      bannerSubtitleColor: '#cbd5e1',
      badgeBgColor: 'rgba(255, 255, 255, 0.14)',
      badgeTextColor: '#f1f5f9',
      cardBgColor: '#ffffff',
      outerBgColor: '#f8fafc',
      primaryAccentColor: '#2563eb',
      greetingColor: '#0f172a',
      bodyTextColor: '#334155',
      metaBoxBgColor: '#f8fafc',
      metaBoxBorderColor: '#e2e8f0',
      tableHeaderBg: '#f1f5f9',
      tableHeaderTextColor: '#334155',
      tableAltRowBg: '#f8fafc',
      footerNoticeBg: '#f8fafc',
      footerNoticeBorder: '#2563eb',
      footerTextColor: '#64748b',
    },
  },
  {
    id: 'teal_nordic',
    name: 'Turquesa Nórdico & Menta',
    tagline: 'Moderno, limpio y de lectura placentera',
    category: 'modern',
    previewGradient: 'linear-gradient(135deg, #134e4a, #0f766e, #0d9488)',
    theme: {
      presetId: 'teal_nordic',
      useGradient: true,
      bannerGradientStart: '#134e4a',
      bannerGradientMid: '#0f766e',
      bannerGradientEnd: '#0d9488',
      bannerGradientAngle: 135,
      bannerSolidColor: '#0f766e',
      bannerTitleColor: '#ffffff',
      bannerSubtitleColor: '#ccfbf1',
      badgeBgColor: 'rgba(255, 255, 255, 0.16)',
      badgeTextColor: '#ccfbf1',
      cardBgColor: '#ffffff',
      outerBgColor: '#f0fdfa',
      primaryAccentColor: '#0d9488',
      greetingColor: '#134e4a',
      bodyTextColor: '#334155',
      metaBoxBgColor: '#f0fdfa',
      metaBoxBorderColor: '#99f6e4',
      tableHeaderBg: '#ccfbf1',
      tableHeaderTextColor: '#0f766e',
      tableAltRowBg: '#f7fee7',
      footerNoticeBg: '#f0fdfa',
      footerNoticeBorder: '#0d9488',
      footerTextColor: '#64748b',
    },
  },
];

/**
 * Default editable email template for participant thank-you messages.
 */
export function getDefaultEmailTemplate(): Required<EmailMessageTemplate> {
  return {
    subjectTemplate: 'Agradecimiento por tu participación en la encuesta: {{surveyTitle}} - {{institutionName}}',
    badgeText: 'Comprobante y Agradecimiento',
    headerTitle: '{{institutionName}}',
    headerSubtitle: 'Agradecimiento por completar la encuesta "{{surveyTitle}}"',
    greeting: '¡Estimado/a {{participantName}}!',
    mainMessage: 'En {{institutionName}} te agradecemos profundamente tu valioso tiempo y dedicación para responder nuestra encuesta.\n\nTus aportes son esenciales para la evaluación continua, excelencia y optimización de nuestros procesos de servicio y atención.',
    secondaryMessage: 'A continuación te compartimos una constancia oficial de tus respuestas registradas en nuestro sistema:',
    includeMetaBox: true,
    includeResponsesTable: true,
    tableTitle: 'Detalle de Respuestas Proporcionadas:',
    footerNotice: 'Este mensaje ha sido emitido formalmente por el {{platformTitle}} desde nuestra cuenta oficial {{senderEmail}}. Si tienes alguna duda, sugerencia o requieres mayor información, puedes responder directamente a este correo.',
    signature: '© {{year}} {{institutionName}}. Todos los derechos reservados.',
    colors: getDefaultColorTheme(),
  };
}

/**
 * Replaces placeholders like {{participantName}}, {{surveyTitle}}, {{institutionName}} in templates.
 */
export function replaceEmailVariables(
  text: string,
  variables: {
    participantName?: string;
    surveyTitle?: string;
    institutionName?: string;
    platformTitle?: string;
    date?: string;
    senderEmail?: string;
    participantEmail?: string;
    responseId?: string;
    year?: string;
  }
): string {
  if (!text) return '';
  const currentYear = variables.year || String(new Date().getFullYear());
  return text
    .replace(/\{\{participantName\}\}/g, variables.participantName || 'Participante')
    .replace(/\{\{surveyTitle\}\}/g, variables.surveyTitle || 'Encuesta de Satisfacción')
    .replace(/\{\{institutionName\}\}/g, variables.institutionName || 'GRUPO ULEP SAS')
    .replace(/\{\{platformTitle\}\}/g, variables.platformTitle || 'Sistema de Encuestas GRUPO ULEP SAS')
    .replace(/\{\{date\}\}/g, variables.date || new Date().toLocaleString('es-ES'))
    .replace(/\{\{senderEmail\}\}/g, variables.senderEmail || 'grupoulep@gmail.com')
    .replace(/\{\{participantEmail\}\}/g, variables.participantEmail || '')
    .replace(/\{\{responseId\}\}/g, variables.responseId || 'FOLIO-001')
    .replace(/\{\{year\}\}/g, currentYear);
}

/**
 * Builds HTML and Subject for survey email (used for both sending and live preview).
 */
export function buildSurveyEmailContent(params: {
  survey: Survey;
  response: SurveyResponse;
  platformTitle?: string;
  institutionName?: string;
  isParticipantReceipt?: boolean;
  emailTemplate?: EmailMessageTemplate;
  senderEmail?: string;
}): { subject: string; emailBodyHtml: string } {
  const {
    survey,
    response,
    platformTitle = 'Sistema de Encuestas GRUPO ULEP SAS',
    institutionName = 'GRUPO ULEP SAS',
    isParticipantReceipt = false,
    emailTemplate,
    senderEmail = 'grupoulep@gmail.com',
  } = params;

  const defaultTpl = getDefaultEmailTemplate();
  const defaultColors = getDefaultColorTheme();
  const tpl = {
    ...defaultTpl,
    ...(emailTemplate || {}),
  };
  const colors: Required<EmailColorTheme> = {
    ...defaultColors,
    ...(emailTemplate?.colors || {}),
  };

  const bannerBg = colors.useGradient !== false
    ? `background: linear-gradient(${colors.bannerGradientAngle || 135}deg, ${colors.bannerGradientStart} 0%, ${colors.bannerGradientMid || colors.bannerGradientStart} 50%, ${colors.bannerGradientEnd} 100%);`
    : `background: ${colors.bannerSolidColor || colors.bannerGradientStart};`;

  const submissionDate = new Date(response.submittedAt || Date.now()).toLocaleString('es-ES', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const vars = {
    participantName: response.participantName,
    surveyTitle: survey.title,
    institutionName,
    platformTitle,
    date: submissionDate,
    senderEmail,
    participantEmail: response.participantEmail || '',
    responseId: response.id || `RESP-${Date.now()}`,
    year: String(new Date().getFullYear()),
  };

  // Determine Subject
  let subject = '';
  if (isParticipantReceipt) {
    subject = replaceEmailVariables(tpl.subjectTemplate, vars);
  } else {
    subject = `[${platformTitle}] Nueva respuesta recibida: ${survey.title} - ${response.participantName}`;
  }

  // Build clean HTML summary of survey responses
  const questionsRows = survey.questions
    .map((q, idx) => {
      const ans = response.answers[q.id];
      let displayAns = 'Sin respuesta';
      if (ans !== undefined && ans !== null) {
        if (Array.isArray(ans)) {
          displayAns = ans.join(', ');
        } else {
          displayAns = String(ans);
        }
      }
      return `
        <tr style="border-bottom: 1px solid ${colors.metaBoxBorderColor || '#f1f5f9'};">
          <td style="padding: 12px 14px; font-weight: 600; color: ${colors.greetingColor || '#1e293b'}; width: 42%; font-size: 13px; line-height: 1.4; vertical-align: top;">
            ${idx + 1}. ${q.title}
          </td>
          <td style="padding: 12px 14px; color: ${colors.bodyTextColor || '#334155'}; font-size: 13px; font-weight: 500; line-height: 1.4; vertical-align: top; background-color: ${colors.tableAltRowBg || '#fafaf9'};">
            ${displayAns}
          </td>
        </tr>
      `;
    })
    .join('');

  // Resolved text elements
  const resolvedBadge = replaceEmailVariables(tpl.badgeText, vars);
  const resolvedHeaderTitle = replaceEmailVariables(tpl.headerTitle, vars);
  const resolvedHeaderSubtitle = replaceEmailVariables(tpl.headerSubtitle, vars);
  const resolvedGreeting = replaceEmailVariables(tpl.greeting, vars);
  const resolvedMainMessage = replaceEmailVariables(tpl.mainMessage, vars)
    .split('\n\n')
    .map(p => `<p style="font-size: 14px; color: ${colors.bodyTextColor || '#334155'}; line-height: 1.6; margin: 0 0 12px 0;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  const resolvedSecondaryMessage = replaceEmailVariables(tpl.secondaryMessage, vars);
  const resolvedTableTitle = replaceEmailVariables(tpl.tableTitle, vars);
  const resolvedFooterNotice = replaceEmailVariables(tpl.footerNotice, vars);
  const resolvedSignature = replaceEmailVariables(tpl.signature, vars);

  const metaBoxHtml = tpl.includeMetaBox !== false ? `
    <!-- Summary Meta Box -->
    <div style="background: ${colors.metaBoxBgColor || '#f8fafc'}; border: 1px solid ${colors.metaBoxBorderColor || '#e2e8f0'}; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-weight: 600; width: 35%;">Participante:</td>
          <td style="padding: 4px 0; color: ${colors.greetingColor || '#0f172a'}; font-weight: 700;">${response.participantName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Correo Electrónico:</td>
          <td style="padding: 4px 0; color: ${colors.primaryAccentColor || '#4338ca'}; font-weight: 600;">${response.participantEmail || 'No especificado'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Fecha y Hora:</td>
          <td style="padding: 4px 0; color: ${colors.bodyTextColor || '#334155'};">${submissionDate}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Folio de Envío:</td>
          <td style="padding: 4px 0; color: #475569; font-family: monospace; font-size: 12px;">${vars.responseId}</td>
        </tr>
      </table>
    </div>
  ` : '';

  const responsesTableHtml = tpl.includeResponsesTable !== false ? `
    <!-- Responses Table -->
    <h3 style="margin: 0 0 14px 0; font-size: 15px; color: ${colors.greetingColor || '#0f172a'}; font-weight: 800; border-bottom: 2px solid ${colors.primaryAccentColor || '#4338ca'}; padding-bottom: 8px; display: inline-block;">
      ${resolvedTableTitle}
    </h3>

    <div style="border: 1px solid ${colors.metaBoxBorderColor || '#e2e8f0'}; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: ${colors.tableHeaderBg || '#f1f5f9'}; border-bottom: 1px solid ${colors.metaBoxBorderColor || '#e2e8f0'};">
            <th style="padding: 10px 14px; font-size: 12px; color: ${colors.tableHeaderTextColor || '#475569'}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Pregunta</th>
            <th style="padding: 10px 14px; font-size: 12px; color: ${colors.tableHeaderTextColor || '#475569'}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Tu Respuesta</th>
          </tr>
        </thead>
        <tbody>
          ${questionsRows}
        </tbody>
      </table>
    </div>
  ` : '';

  const emailBodyHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${colors.outerBgColor || '#f1f5f9'}; margin: 0; padding: 24px; color: ${colors.bodyTextColor || '#0f172a'};">
      <div style="max-width: 620px; margin: 0 auto; background: ${colors.cardBgColor || '#ffffff'}; border-radius: 20px; overflow: hidden; border: 1px solid ${colors.metaBoxBorderColor || '#e2e8f0'}; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
        
        <!-- Header Banner -->
        <div style="${bannerBg} padding: 32px 28px; color: ${colors.bannerTitleColor || '#ffffff'}; text-align: left;">
          <div style="display: inline-block; padding: 5px 12px; background: ${colors.badgeBgColor || 'rgba(255, 255, 255, 0.15)'}; border-radius: 9999px; margin-bottom: 12px;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${colors.badgeTextColor || '#e0e7ff'}; font-weight: 700;">
              ${isParticipantReceipt ? resolvedBadge : 'Notificación Administrativa de Encuesta'}
            </p>
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: ${colors.bannerTitleColor || '#ffffff'}; letter-spacing: -0.02em;">
            ${isParticipantReceipt ? resolvedHeaderTitle : institutionName}
          </h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.bannerSubtitleColor || '#c7d2fe'}; font-weight: 500;">
            ${isParticipantReceipt ? resolvedHeaderSubtitle : `Nueva respuesta registrada para la encuesta "${survey.title}"`}
          </p>
        </div>
        
        <div style="padding: 28px;">
          <!-- Greeting and Gratitude text -->
          ${isParticipantReceipt ? `
            <div style="margin-bottom: 24px;">
              <p style="font-size: 16px; color: ${colors.greetingColor || '#1e293b'}; font-weight: 700; margin: 0 0 12px 0;">
                ${resolvedGreeting}
              </p>
              ${resolvedMainMessage}
              ${resolvedSecondaryMessage ? `
                <p style="font-size: 14px; color: ${colors.bodyTextColor || '#334155'}; line-height: 1.6; margin: 12px 0 0 0;">
                  ${resolvedSecondaryMessage}
                </p>
              ` : ''}
            </div>
          ` : `
            <div style="margin-bottom: 24px;">
              <p style="font-size: 15px; color: ${colors.greetingColor || '#1e293b'}; font-weight: 700; margin: 0 0 8px 0;">
                Registro de nueva respuesta
              </p>
              <p style="font-size: 13px; color: ${colors.bodyTextColor || '#475569'}; line-height: 1.5; margin: 0;">
                El participante <strong>${response.participantName}</strong> ha finalizado la encuesta <strong>"${survey.title}"</strong>.
              </p>
            </div>
          `}

          ${metaBoxHtml}
          ${responsesTableHtml}

          <!-- Institutional Contact Info -->
          ${resolvedFooterNotice ? `
            <div style="background: ${colors.footerNoticeBg || '#f8fafc'}; border-left: 4px solid ${colors.footerNoticeBorder || colors.primaryAccentColor || '#4338ca'}; padding: 14px 18px; border-radius: 8px; margin-top: 16px;">
              <p style="margin: 0; font-size: 12px; color: ${colors.bodyTextColor || '#475569'}; line-height: 1.5;">
                ${resolvedFooterNotice}
              </p>
            </div>
          ` : ''}

          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid ${colors.metaBoxBorderColor || '#e2e8f0'}; font-size: 11px; color: ${colors.footerTextColor || '#94a3b8'}; text-align: center; line-height: 1.6;">
            ${resolvedSignature}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, emailBodyHtml };
}

/**
 * Sends an instant email notification via Gmail API.
 * Dispatches thank-you emails from grupoulep@gmail.com to participants
 * and operational alerts to administrators.
 */
export async function sendInstantSurveyEmail(
  accessToken: string,
  toEmail: string,
  survey: Survey,
  response: SurveyResponse,
  platformTitle: string = 'Sistema de Encuestas GRUPO ULEP SAS',
  isParticipantReceipt: boolean = false,
  emailTemplate?: EmailMessageTemplate,
  institutionName: string = 'GRUPO ULEP SAS'
): Promise<boolean> {
  const cleanEmail = toEmail.trim();
  if (!cleanEmail) {
    throw new Error('No se ha configurado un correo de destino.');
  }

  const senderEmail = 'grupoulep@gmail.com';
  const senderDisplayName = institutionName || 'GRUPO ULEP SAS';

  const { subject, emailBodyHtml } = buildSurveyEmailContent({
    survey,
    response,
    platformTitle,
    institutionName,
    isParticipantReceipt,
    emailTemplate,
    senderEmail,
  });

  // Standard RFC 2822 Message Format with explicit From and Reply-To
  const rawMessage = [
    `From: ${encodeUtf8Header(senderDisplayName)} <${senderEmail}>`,
    `Reply-To: ${senderEmail}`,
    `To: ${cleanEmail}`,
    `Subject: ${encodeUtf8Header(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    emailBodyHtml,
  ].join('\r\n');

  const base64UrlMessage = utf8ToBase64Url(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64UrlMessage,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error('Error al enviar correo por Gmail API:', errData);
    throw new Error(errData.error?.message || `Fallo al enviar correo (${res.status})`);
  }

  return true;
}

/**
 * Builds a direct mailto URI for emergency 1-click delivery fallback.
 */
export function getMailtoSurveySummaryUrl(
  toEmail: string,
  survey: Survey,
  response: SurveyResponse,
  platformTitle: string = 'Sistema de Encuestas GRUPO ULEP SAS'
): string {
  const subject = `Agradecimiento por tu participación en la encuesta: ${survey.title} - GRUPO ULEP SAS`;
  const lines: string[] = [
    `Estimado/a ${response.participantName},`,
    '',
    `En GRUPO ULEP SAS te agradecemos profundamente tu valioso tiempo y dedicación para completar la encuesta "${survey.title}".`,
    '',
    'Constancia de respuestas registradas:',
    `Participante: ${response.participantName}`,
    `Correo: ${response.participantEmail || ''}`,
    `Fecha: ${new Date(response.submittedAt).toLocaleString('es-ES')}`,
    `Folio: ${response.id}`,
    '',
    'Detalle de Respuestas:',
  ];

  survey.questions.forEach((q, idx) => {
    const ans = response.answers[q.id];
    lines.push(`${idx + 1}. ${q.title}: ${Array.isArray(ans) ? ans.join(', ') : (ans ?? 'Sin respuesta')}`);
  });

  lines.push('', '---', 'Enviado desde el Sistema de Encuestas GRUPO ULEP SAS (grupoulep@gmail.com)');

  return `mailto:${encodeURIComponent(toEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
