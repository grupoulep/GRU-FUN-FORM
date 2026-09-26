export type UserRole = 'admin' | 'participant';

export type QuestionType = 'single' | 'multiple' | 'rating' | 'text' | 'yesno' | 'dropdown' | 'nps' | 'date';

export interface Question {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  ratingScale?: number; // 5 or 10 (default 5)
  minLabel?: string;
  maxLabel?: string;
  placeholder?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  isPrimaryActive: boolean;
  createdAt: string;
  questions: Question[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  participantName: string;
  participantEmail?: string;
  submittedAt: string;
  answers: Record<string, any>; // questionId -> answer (string, string[], number)
  registeredBy?: string; // e.g. 'ADMIN' or 'Directo'
}

export interface CurrentUser {
  name: string;
  email?: string;
  role: UserRole;
}

export interface GoogleIntegrationSettings {
  spreadsheetId?: string;
  sheetName?: string;
  autoSyncSheets?: boolean;
  notificationEmail?: string;
  autoSendEmailNotification?: boolean;
  emailSubjectTemplate?: string;
  accessToken?: string;
  tokenExpiry?: number;
}

export interface EmailColorTheme {
  presetId?: string;
  useGradient?: boolean;
  bannerGradientStart?: string;
  bannerGradientMid?: string;
  bannerGradientEnd?: string;
  bannerGradientAngle?: number;
  bannerSolidColor?: string;
  bannerTitleColor?: string;
  bannerSubtitleColor?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  cardBgColor?: string;
  outerBgColor?: string;
  primaryAccentColor?: string;
  greetingColor?: string;
  bodyTextColor?: string;
  metaBoxBgColor?: string;
  metaBoxBorderColor?: string;
  tableHeaderBg?: string;
  tableHeaderTextColor?: string;
  tableAltRowBg?: string;
  footerNoticeBg?: string;
  footerNoticeBorder?: string;
  footerTextColor?: string;
}

export interface EmailMessageTemplate {
  subjectTemplate?: string;
  badgeText?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  greeting?: string;
  mainMessage?: string;
  secondaryMessage?: string;
  includeMetaBox?: boolean;
  includeResponsesTable?: boolean;
  tableTitle?: string;
  footerNotice?: string;
  signature?: string;
  colors?: EmailColorTheme;
}

export interface PlatformSettings {
  title: string;
  subtitle?: string;
  institutionName?: string;
  googleIntegration?: GoogleIntegrationSettings;
  emailTemplate?: EmailMessageTemplate;
}
