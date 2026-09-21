import React, { useState } from 'react';
import { Auxiliary, Survey, SurveyResponse, PlatformSettings } from '../types';
import { RealtimeReports } from './RealtimeReports';
import { ParticipantSurveyView } from './ParticipantSurveyView';
import { 
  UserCheck, 
  ClipboardList, 
  BarChart3, 
  PlusCircle, 
  Building2, 
  KeyRound, 
  ShieldAlert, 
  ExternalLink,
  Users,
  LogOut
} from 'lucide-react';

interface AuxiliaryViewProps {
  auxiliary: Auxiliary;
  surveys: Survey[];
  responses: SurveyResponse[];
  platformSettings?: PlatformSettings;
  onAddResponse: (surveyId: string, participantName: string, answers: Record<string, any>, registeredBy: string) => void;
  onExit: () => void;
}

export const AuxiliaryView: React.FC<AuxiliaryViewProps> = ({
  auxiliary,
  surveys,
  responses,
  platformSettings,
  onAddResponse,
  onExit,
}) => {
  const [activeTab, setActiveTab] = useState<'surveys' | 'reports'>('surveys');
  const [activeIntakeSurvey, setActiveIntakeSurvey] = useState<Survey | null>(null);
  const [intakeParticipantName, setIntakeParticipantName] = useState('');
  const [isStartingIntake, setIsStartingIntake] = useState(false);

  // Filter ONLY the surveys assigned to this auxiliary
  const assignedSurveys = surveys.filter((s) => auxiliary.assignedSurveyIds.includes(s.id));
  const assignedResponses = responses.filter((r) => auxiliary.assignedSurveyIds.includes(r.surveyId));

  // If in survey intake mode (registering responses in-person)
  if (activeIntakeSurvey && intakeParticipantName) {
    return (
      <ParticipantSurveyView
        survey={activeIntakeSurvey}
        participantName={intakeParticipantName}
        registeredBy={auxiliary.name}
        platformSettings={platformSettings}
        onSubmit={(answers) => {
          onAddResponse(activeIntakeSurvey.id, intakeParticipantName, answers, auxiliary.accessCode);
          setActiveIntakeSurvey(null);
          setIntakeParticipantName('');
        }}
        onExit={() => {
          setActiveIntakeSurvey(null);
          setIntakeParticipantName('');
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Action Bar with Salir Button */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium text-xs sm:text-sm">
          <span className="font-extrabold text-indigo-600">{platformSettings?.title || 'IULEP Encuestas'}</span>
          <span className="text-slate-300">•</span>
          <UserCheck className="w-4 h-4 text-amber-600" />
          <span>Panel de Auxiliar • <strong className="text-slate-900 font-bold">{auxiliary.name}</strong></span>
        </div>
        <button
          onClick={onExit}
          id="btn-aux-exit-top"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Salir</span>
        </button>
      </div>

      {/* Auxiliary Profile Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-orange-50/50 rounded-2xl p-6 border border-amber-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-amber-200">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                Rol: Auxiliar Autorizado
              </span>
              <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900">
                {auxiliary.accessCode}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {auxiliary.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{auxiliary.department}</span>
              <span>•</span>
              <span>{assignedSurveys.length} encuestas asignadas bajo supervisión</span>
            </p>
          </div>
        </div>

        {/* Tab switch buttons & Logout */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1.5 bg-white/80 p-1.5 rounded-xl border border-amber-200">
            <button
              onClick={() => setActiveTab('surveys')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'surveys'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Mis Encuestas</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reportes en Tiempo Real</span>
            </button>
          </div>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-amber-200 hover:border-rose-300 font-semibold text-xs transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* No assigned surveys warning */}
      {assignedSurveys.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Sin encuestas asignadas</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            El Administrador aún no le ha asignado permisos a ninguna encuesta. Solicite al Administrador (ADMINIULEP) que vincule encuestas a su perfil.
          </p>
        </div>
      ) : activeTab === 'surveys' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Encuestas Habilitadas para su Cargo
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Puede aplicar encuestas en ventanilla o campo registrando participantes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedSurveys.map((survey) => {
              const count = responses.filter((r) => r.surveyId === survey.id).length;
              const byThisAux = responses.filter(
                (r) => r.surveyId === survey.id && r.registeredBy === auxiliary.accessCode
              ).length;

              return (
                <div
                  key={survey.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-300 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {survey.category}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          survey.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {survey.isActive ? 'Activa' : 'Pausada'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {survey.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {survey.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                      <span>{survey.questions.length} preguntas</span>
                      <span>•</span>
                      <span>Total recibidas: <strong>{count}</strong></span>
                      <span>•</span>
                      <span className="text-amber-700 font-semibold">Tus registros: {byThisAux}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveIntakeSurvey(survey);
                        setIsStartingIntake(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm shadow-amber-200 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Aplicar a un participante</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver analítica</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Realtime Reports for assigned surveys */
        <RealtimeReports
          surveys={assignedSurveys}
          responses={assignedResponses}
        />
      )}

      {/* Modal to specify participant name before applying survey */}
      {isStartingIntake && activeIntakeSurvey && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Registro de Participante
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Aplicando: <span className="font-semibold text-slate-800">{activeIntakeSurvey.title}</span>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!intakeParticipantName.trim()) {
                  alert('Por favor ingrese el nombre del encuestado.');
                  return;
                }
                setIsStartingIntake(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nombre del Encuestado:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={intakeParticipantName}
                  onChange={(e) => setIntakeParticipantName(e.target.value)}
                  placeholder="Ej: Laura Méndez"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsStartingIntake(false);
                    setActiveIntakeSurvey(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Iniciar Toma</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
