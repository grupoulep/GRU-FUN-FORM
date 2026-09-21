import { Survey, Auxiliary, SurveyResponse, PlatformSettings } from '../types';
import { INITIAL_SURVEYS, INITIAL_AUXILIARIES, INITIAL_RESPONSES } from '../data/initialData';

const STORAGE_KEYS = {
  SURVEYS: 'iulep_surveys_v2',
  AUXILIARIES: 'iulep_auxiliaries_v2',
  RESPONSES: 'iulep_responses_v2',
  SETTINGS: 'iulep_platform_settings_v1',
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  title: 'Sistema de Encuestas IULEP',
  subtitle: 'Instituto Universitario Latinoamericano de Posgrado',
  institutionName: 'IULEP',
};

export const getStoredPlatformSettings = (): PlatformSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_PLATFORM_SETTINGS));
      return DEFAULT_PLATFORM_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      title: parsed.title || DEFAULT_PLATFORM_SETTINGS.title,
      subtitle: parsed.subtitle !== undefined ? parsed.subtitle : DEFAULT_PLATFORM_SETTINGS.subtitle,
      institutionName: parsed.institutionName || DEFAULT_PLATFORM_SETTINGS.institutionName,
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

export const getStoredAuxiliaries = (): Auxiliary[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUXILIARIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUXILIARIES, JSON.stringify(INITIAL_AUXILIARIES));
      return INITIAL_AUXILIARIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading auxiliaries', e);
    return INITIAL_AUXILIARIES;
  }
};

export const saveStoredAuxiliaries = (auxiliaries: Auxiliary[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUXILIARIES, JSON.stringify(auxiliaries));
  } catch (e) {
    console.error('Error saving auxiliaries', e);
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
  localStorage.setItem(STORAGE_KEYS.AUXILIARIES, JSON.stringify(INITIAL_AUXILIARIES));
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
  const headerRow = ['"ID Respuesta"', '"Participante"', '"Fecha"', '"Registrado Por"', ...questionHeaders].join(',');

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
