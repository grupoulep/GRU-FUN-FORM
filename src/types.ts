export type UserRole = 'admin' | 'auxiliary' | 'participant';

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

export interface Auxiliary {
  id: string;
  name: string;
  accessCode: string;
  department: string;
  assignedSurveyIds: string[];
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  participantName: string;
  submittedAt: string;
  answers: Record<string, any>; // questionId -> answer (string, string[], number)
  registeredBy?: string; // auxiliary name or 'direct'
}

export interface CurrentUser {
  name: string;
  role: UserRole;
  auxiliaryData?: Auxiliary;
}

export interface PlatformSettings {
  title: string;
  subtitle?: string;
  institutionName?: string;
}
