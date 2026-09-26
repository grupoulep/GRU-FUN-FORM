import { Survey, SurveyResponse, PlatformSettings } from '../types';
import { INITIAL_SURVEYS, INITIAL_RESPONSES } from '../data/initialData';

const STORAGE_KEYS = {
  SURVEYS: 'iulep_surveys_v2',
  RESPONSES: 'iulep_responses_v2',
  SETTINGS: 'iulep_platform_settings_v1',
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  title: 'Sistema de Encuestas GRUPO ULEP SAS',
  subtitle: 'Gestión y Evaluación de Servicios - GRUPO ULEP SAS',
  institutionName: 'GRUPO ULEP SAS',
  googleIntegration: {
    autoSyncSheets: true,
    autoSendEmailNotification: true,
    sheetName: 'Respuestas',
    notificationEmail: 'grupoulep@gmail.com',
  },
};

export const getStoredPlatformSettings = (): PlatformSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_PLATFORM_SETTINGS));
      return DEFAULT_PLATFORM_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const title = parsed.title && !parsed.title.includes('IULEP') && !parsed.title.toLowerCase().includes('instituto')
      ? parsed.title
      : DEFAULT_PLATFORM_SETTINGS.title;
    const institutionName = parsed.institutionName && !parsed.institutionName.includes('IULEP') && !parsed.institutionName.toLowerCase().includes('instituto')
      ? parsed.institutionName
      : DEFAULT_PLATFORM_SETTINGS.institutionName;
    const subtitle = parsed.subtitle && !parsed.subtitle.toLowerCase().includes('instituto') && !parsed.subtitle.toLowerCase().includes('posgrado')
      ? parsed.subtitle
      : DEFAULT_PLATFORM_SETTINGS.subtitle;

    return {
      title,
      subtitle,
      institutionName,
      googleIntegration: {
        autoSyncSheets: parsed.googleIntegration?.autoSyncSheets ?? true,
        autoSendEmailNotification: parsed.googleIntegration?.autoSendEmailNotification ?? true,
        sheetName: parsed.googleIntegration?.sheetName || 'Respuestas',
        notificationEmail: parsed.googleIntegration?.notificationEmail || 'grupoulep@gmail.com',
        spreadsheetId: parsed.googleIntegration?.spreadsheetId || '',
        accessToken: parsed.googleIntegration?.accessToken,
        tokenExpiry: parsed.googleIntegration?.tokenExpiry,
      },
    };
  } catch (e) {
    console.error('Error reading platform settings from storage', e);
    return DEFAULT_PLATFORM_SETTINGS;
  }
};

export const saveStoredPlatformSettings = (settings: PlatformSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving platform settings', e);
  }
};

export const getStoredSurveys = (): Survey[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SURVEYS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(INITIAL_SURVEYS));
      return INITIAL_SURVEYS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading surveys from storage', e);
    return INITIAL_SURVEYS;
  }
};

export const saveStoredSurveys = (surveys: Survey[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
  } catch (e) {
    console.error('Error saving surveys', e);
  }
};

export const getStoredResponses = (): SurveyResponse[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(INITIAL_RESPONSES));
      return INITIAL_RESPONSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading responses', e);
    return INITIAL_RESPONSES;
  }
};

export const saveStoredResponses = (responses: SurveyResponse[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
  } catch (e) {
    console.error('Error saving responses', e);
  }
};

export const resetToDefaultData = () => {
  localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(INITIAL_SURVEYS));
  localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(INITIAL_RESPONSES));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_PLATFORM_SETTINGS));
};

export const exportResponsesToCSV = (survey: Survey, responses: SurveyResponse[]) => {
  const surveyResponses = responses.filter((r) => r.surveyId === survey.id);
  if (surveyResponses.length === 0) {
    alert('No hay respuestas registradas para exportar en esta encuesta.');
    return;
  }

  const questionHeaders = survey.questions.map((q) => `"${q.title.replace(/"/g, '""')}"`);
  const headerRow = ['"ID Respuesta"', '"Participante"', '"Correo Electrónico"', '"Fecha"', '"Registrado Por"', ...questionHeaders].join(',');

  const rows = surveyResponses.map((res) => {
    const dateStr = new Date(res.submittedAt).toLocaleString('es-ES');
    const answerCols = survey.questions.map((q) => {
      const val = res.answers[q.id];
      if (val === undefined || val === null) return '""';
      if (Array.isArray(val)) {
        return `"${val.join('; ').replace(/"/g, '""')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });

    return [
      `"${res.id}"`,
      `"${res.participantName.replace(/"/g, '""')}"`,
      `"${(res.participantEmail || '').replace(/"/g, '""')}"`,
      `"${dateStr}"`,
      `"${res.registeredBy || 'direct'}"`,
      ...answerCols,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_${survey.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportResponsesToJSON = (survey: Survey, responses: SurveyResponse[]) => {
  const surveyResponses = responses.filter((r) => r.surveyId === survey.id);
  if (surveyResponses.length === 0) {
    alert('No hay respuestas registradas para exportar en esta encuesta.');
    return;
  }

  const exportPayload = {
    survey: {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      category: survey.category,
      exportedAt: new Date().toISOString(),
      totalResponses: surveyResponses.length,
    },
    questions: survey.questions,
    responses: surveyResponses,
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_${survey.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
