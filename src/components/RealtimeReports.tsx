import React, { useState, useMemo } from 'react';
import { Survey, SurveyResponse, Question } from '../types';
import { exportResponsesToCSV, exportResponsesToJSON } from '../utils/storage';
import { 
  BarChart3, 
  Users, 
  Star, 
  Download, 
  MessageSquare, 
  Search, 
  Calendar, 
  User, 
  CheckCircle2, 
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  Eye,
  X,
  Printer,
  FileJson,
  Layers,
  Filter,
  Smile,
  Meh,
  Frown,
  Trash2
} from 'lucide-react';

interface RealtimeReportsProps {
  surveys: Survey[];
  responses: SurveyResponse[];
  initialSurveyId?: string;
  onSimulateResponse?: (surveyId: string, count?: number) => void;
  onDeleteResponse?: (responseId: string) => void;
}

export const RealtimeReports: React.FC<RealtimeReportsProps> = ({
  surveys,
  responses,
  initialSurveyId,
  onSimulateResponse,
  onDeleteResponse,
}) => {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(
    initialSurveyId || surveys[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'direct' | 'auxiliary'>('all');
  const [selectedResponseDetail, setSelectedResponseDetail] = useState<SurveyResponse | null>(null);
  const [responseToDelete, setResponseToDelete] = useState<SurveyResponse | null>(null);

  const activeSurvey = surveys.find((s) => s.id === selectedSurveyId) || surveys[0];

  const surveyResponses = useMemo(() => {
    if (!activeSurvey) return [];
    return responses.filter((r) => r.surveyId === activeSurvey.id);
  }, [responses, activeSurvey]);

  // Key metrics calculation
  const totalCount = surveyResponses.length;

  const averageRating = useMemo(() => {
    if (!activeSurvey || totalCount === 0) return null;
    const ratingQuestions = activeSurvey.questions.filter((q) => q.type === 'rating');
    if (ratingQuestions.length === 0) return null;

    let totalSum = 0;
    let totalRatings = 0;

    surveyResponses.forEach((res) => {
      ratingQuestions.forEach((q) => {
        const val = Number(res.answers[q.id]);
        if (!isNaN(val) && val > 0) {
          totalSum += val;
          totalRatings += 1;
        }
      });
    });

    return totalRatings > 0 ? (totalSum / totalRatings).toFixed(1) : null;
  }, [activeSurvey, surveyResponses, totalCount]);

  const approvalRate = useMemo(() => {
    if (!activeSurvey || totalCount === 0) return null;
    const yesNoQuestions = activeSurvey.questions.filter((q) => q.type === 'yesno');
    if (yesNoQuestions.length === 0) return null;

    let yesCount = 0;
    let totalYesNo = 0;

    surveyResponses.forEach((res) => {
      yesNoQuestions.forEach((q) => {
        const val = res.answers[q.id];
        if (val === 'yes') yesCount += 1;
        if (val === 'yes' || val === 'no') totalYesNo += 1;
      });
    });

    return totalYesNo > 0 ? Math.round((yesCount / totalYesNo) * 100) : null;
  }, [activeSurvey, surveyResponses, totalCount]);

  // NPS metric if activeSurvey contains an NPS question
  const npsMetric = useMemo(() => {
    if (!activeSurvey || totalCount === 0) return null;
    const npsQ = activeSurvey.questions.find((q) => q.type === 'nps');
    if (!npsQ) return null;

    let promoters = 0; // 9-10
    let passives = 0;  // 7-8
    let detractors = 0; // 0-6
    let totalNps = 0;

    surveyResponses.forEach((res) => {
      const val = Number(res.answers[npsQ.id]);
      if (!isNaN(val) && val >= 0 && val <= 10) {
        totalNps++;
        if (val >= 9) promoters++;
        else if (val >= 7) passives++;
        else detractors++;
      }
    });

    if (totalNps === 0) return null;
    const score = Math.round(((promoters - detractors) / totalNps) * 100);
    return {
      score,
      promoters,
      passives,
      detractors,
      totalNps,
      promoterPct: Math.round((promoters / totalNps) * 100),
      passivePct: Math.round((passives / totalNps) * 100),
      detractorPct: Math.round((detractors / totalNps) * 100),
    };
  }, [activeSurvey, surveyResponses, totalCount]);

  // Filtered individual responses
  const filteredResponses = useMemo(() => {
    return surveyResponses.filter((r) => {
      const matchSearch =
        r.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.registeredBy && r.registeredBy.toLowerCase().includes(searchTerm.toLowerCase()));

      const isDirect = !r.registeredBy || r.registeredBy === 'direct';
      const matchChannel =
        channelFilter === 'all' ||
        (channelFilter === 'direct' && isDirect) ||
        (channelFilter === 'auxiliary' && !isDirect);

      return matchSearch && matchChannel;
    });
  }, [surveyResponses, searchTerm, channelFilter]);

  if (!activeSurvey) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
        <p className="text-slate-500">No hay encuestas disponibles para generar reportes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar with Survey Selector and Action Controls */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
              Analítica en Vivo
            </span>
            <span className="text-xs text-slate-500">• Actualización automática</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Reporte de Resultados: {activeSurvey.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {activeSurvey.category} • Creada el {new Date(activeSurvey.createdAt).toLocaleDateString('es-ES')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Survey Selector dropdown */}
          <select
            value={selectedSurveyId}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.isActive ? 'Activa' : 'Inactiva'})
              </option>
            ))}
          </select>

          {/* Export CSV button */}
          <button
            onClick={() => exportResponsesToCSV(activeSurvey, surveyResponses)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Exportar a archivo Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          {/* Export JSON button */}
          <button
            onClick={() => exportResponsesToJSON(activeSurvey, surveyResponses)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Exportar datos completos a JSON estructurado"
          >
            <FileJson className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>

          {/* Print report */}
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Imprimir o guardar como PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir</span>
          </button>

          {/* Quick Simulate Live Response */}
          {onSimulateResponse && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSimulateResponse(activeSurvey.id, 1)}
                className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Añadir 1 respuesta aleatoria para verificar actualización"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>+1 Simular</span>
              </button>
              <button
                onClick={() => onSimulateResponse(activeSurvey.id, 5)}
                className="px-2.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                title="Añadir lote de 5 respuestas aleatorias"
              >
                <span>+5</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${npsMetric ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        {/* Total Responses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Respuestas</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{totalCount}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Sondeo en vivo
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* NPS Card if survey has NPS question */}
        {npsMetric && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Promoter Score</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <h3 className={`text-3xl font-black ${npsMetric.score >= 50 ? 'text-emerald-600' : npsMetric.score >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  {npsMetric.score > 0 ? `+${npsMetric.score}` : npsMetric.score}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {npsMetric.promoterPct}% Promotores
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Smile className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Average Rating */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Promedio de Satisfacción</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <h3 className="text-3xl font-black text-slate-900">
                {averageRating ? averageRating : '--'}
              </h3>
              {averageRating && <span className="text-sm font-bold text-slate-400">/ 5.0</span>}
            </div>
            <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Evaluación ponderada
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Approval / Recommendation Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa de Aprobación</p>
            <div className="flex items-baseline gap-1 mt-1">
              <h3 className="text-3xl font-black text-slate-900">
                {approvalRate !== null ? `${approvalRate}%` : '--'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Respuestas afirmativas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Survey State */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado Operativo</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeSurvey.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-base font-bold text-slate-900">
                {activeSurvey.isActive ? 'En Línea' : 'Pausada'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeSurvey.isPrimaryActive ? 'Encuesta Principal' : 'Secundaria'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics by Question */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeSurvey.questions.map((question: Question, idx: number) => {
          return (
            <div
              key={question.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 block">
                      Pregunta {idx + 1} • {question.type.toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {question.title}
                    </h3>
                  </div>
                </div>

                {/* 1. Rating Breakdown */}
                {question.type === 'rating' && (
                  <div className="space-y-3 mt-3">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = surveyResponses.filter(
                        (r) => Number(r.answers[question.id]) === stars
                      ).length;
                      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-1 w-16 text-slate-700 font-semibold shrink-0">
                            <span>{stars}</span>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </div>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-20 text-right text-xs text-slate-600 font-medium shrink-0">
                            {count} ({pct}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. NPS (Net Promoter Score) Breakdown */}
                {question.type === 'nps' && (
                  <div className="mt-3 space-y-4">
                    {(() => {
                      const npsAnswers = surveyResponses
                        .map((r) => Number(r.answers[question.id]))
                        .filter((v) => !isNaN(v) && v >= 0 && v <= 10);
                      const npsTotal = npsAnswers.length;

                      const countPromoters = npsAnswers.filter((v) => v >= 9).length;
                      const countPassives = npsAnswers.filter((v) => v >= 7 && v <= 8).length;
                      const countDetractors = npsAnswers.filter((v) => v <= 6).length;

                      const pctPromoters = npsTotal > 0 ? Math.round((countPromoters / npsTotal) * 100) : 0;
                      const pctPassives = npsTotal > 0 ? Math.round((countPassives / npsTotal) * 100) : 0;
                      const pctDetractors = npsTotal > 0 ? Math.round((countDetractors / npsTotal) * 100) : 0;
                      const currentNpsScore = npsTotal > 0 ? Math.round(((countPromoters - countDetractors) / npsTotal) * 100) : 0;

                      return (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                              <div className="flex items-center justify-center gap-1 text-emerald-800 text-xs font-bold mb-0.5">
                                <Smile className="w-3.5 h-3.5" />
                                <span>Promotores (9-10)</span>
                              </div>
                              <div className="text-xl font-black text-emerald-900">{countPromoters}</div>
                              <div className="text-2xs text-emerald-700 font-medium">{pctPromoters}%</div>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                              <div className="flex items-center justify-center gap-1 text-amber-800 text-xs font-bold mb-0.5">
                                <Meh className="w-3.5 h-3.5" />
                                <span>Pasivos (7-8)</span>
                              </div>
                              <div className="text-xl font-black text-amber-900">{countPassives}</div>
                              <div className="text-2xs text-amber-700 font-medium">{pctPassives}%</div>
                            </div>

                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                              <div className="flex items-center justify-center gap-1 text-rose-800 text-xs font-bold mb-0.5">
                                <Frown className="w-3.5 h-3.5" />
                                <span>Detractores (0-6)</span>
                              </div>
                              <div className="text-xl font-black text-rose-900">{countDetractors}</div>
                              <div className="text-2xs text-rose-700 font-medium">{pctDetractors}%</div>
                            </div>
                          </div>

                          {/* Score visual summary */}
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">Índice NPS Calculado:</span>
                            <span className={`font-black text-sm px-2.5 py-0.5 rounded-lg ${
                              currentNpsScore >= 50 ? 'bg-emerald-100 text-emerald-800' :
                              currentNpsScore >= 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {currentNpsScore > 0 ? `+${currentNpsScore}` : currentNpsScore} pts
                            </span>
                          </div>

                          {/* 0-10 distribution bar */}
                          <div>
                            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                              Distribución de Puntuaciones (0 al 10)
                            </span>
                            <div className="grid grid-cols-11 gap-1 text-center">
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                                const count = npsAnswers.filter((v) => v === val).length;
                                const isPromoter = val >= 9;
                                const isPassive = val >= 7 && val <= 8;
                                return (
                                  <div key={val} className="flex flex-col items-center">
                                    <div className="text-2xs text-slate-400 font-bold mb-0.5">{count}</div>
                                    <div
                                      className={`w-full h-10 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                                        count > 0
                                          ? isPromoter
                                            ? 'bg-emerald-500 text-white shadow-xs'
                                            : isPassive
                                            ? 'bg-amber-400 text-white shadow-xs'
                                            : 'bg-rose-400 text-white shadow-xs'
                                          : 'bg-slate-100 text-slate-400'
                                      }`}
                                    >
                                      {val}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* 3. Single Choice & Dropdown Breakdown */}
                {(question.type === 'single' || question.type === 'dropdown') && question.options && (
                  <div className="space-y-3 mt-3">
                    {question.options.map((opt, optIdx) => {
                      const count = surveyResponses.filter(
                        (r) => r.answers[question.id] === opt
                      ).length;
                      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                      return (
                        <div key={optIdx} className="space-y-1">
                          <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-800">
                            <span className="truncate pr-2">{opt}</span>
                            <span className="shrink-0 text-slate-600 font-semibold">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Multiple Choice Breakdown */}
                {question.type === 'multiple' && question.options && (
                  <div className="space-y-3 mt-3">
                    {question.options.map((opt, optIdx) => {
                      const count = surveyResponses.filter((r) => {
                        const answersArr = r.answers[question.id];
                        return Array.isArray(answersArr) && answersArr.includes(opt);
                      }).length;
                      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                      return (
                        <div key={optIdx} className="space-y-1">
                          <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-800">
                            <span className="truncate pr-2">{opt}</span>
                            <span className="shrink-0 text-slate-600 font-semibold">
                              {count} votos ({pct}%)
                            </span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 5. Yes/No Breakdown */}
                {question.type === 'yesno' && (
                  <div className="mt-4">
                    {(() => {
                      const yesCount = surveyResponses.filter((r) => r.answers[question.id] === 'yes').length;
                      const noCount = surveyResponses.filter((r) => r.answers[question.id] === 'no').length;
                      const yesPct = totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : 0;
                      const noPct = totalCount > 0 ? Math.round((noCount / totalCount) * 100) : 0;

                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-emerald-800 uppercase">Sí / Favorable</span>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="text-2xl font-extrabold text-emerald-900">{yesCount}</div>
                            <div className="text-xs text-emerald-700 font-medium mt-0.5">{yesPct}% del total</div>
                          </div>
                          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-rose-800 uppercase">No / Desfavorable</span>
                              <X className="w-4 h-4 text-rose-600" />
                            </div>
                            <div className="text-2xl font-extrabold text-rose-900">{noCount}</div>
                            <div className="text-xs text-rose-700 font-medium mt-0.5">{noPct}% del total</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 6. Date Responses Breakdown */}
                {question.type === 'date' && (
                  <div className="mt-3">
                    {(() => {
                      const dateCounts: Record<string, number> = {};
                      surveyResponses.forEach((r) => {
                        const val = r.answers[question.id];
                        if (val && String(val).trim()) {
                          dateCounts[val] = (dateCounts[val] || 0) + 1;
                        }
                      });

                      const entries = Object.entries(dateCounts).sort((a, b) => b[1] - a[1]);

                      if (entries.length === 0) {
                        return (
                          <p className="text-xs text-slate-400 italic py-4 text-center">
                            No se han seleccionado fechas aún.
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {entries.slice(0, 6).map(([dateVal, count]) => {
                            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                            return (
                              <div key={dateVal} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                  <span className="font-semibold text-slate-800">{dateVal}</span>
                                </div>
                                <div className="text-slate-600 font-bold">
                                  {count} {count === 1 ? 'registro' : 'registros'} ({pct}%)
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 7. Open Text Responses */}
                {question.type === 'text' && (
                  <div className="mt-3">
                    {(() => {
                      const textFeedbacks = surveyResponses
                        .map((r) => ({
                          author: r.participantName,
                          comment: r.answers[question.id],
                          date: r.submittedAt,
                        }))
                        .filter((f) => f.comment && String(f.comment).trim().length > 0);

                      if (textFeedbacks.length === 0) {
                        return (
                          <p className="text-xs text-slate-400 italic py-4 text-center">
                            No se han registrado comentarios escritos aún.
                          </p>
                        );
                      }

                      return (
                        <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                          {textFeedbacks.slice(0, 5).map((fb, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                              <p className="text-slate-800 font-medium italic">&quot;{fb.comment}&quot;</p>
                              <div className="flex justify-between items-center text-slate-400 mt-2">
                                <span className="font-semibold text-slate-600">{fb.author}</span>
                                <span>{new Date(fb.date).toLocaleDateString('es-ES')}</span>
                              </div>
                            </div>
                          ))}
                          {textFeedbacks.length > 5 && (
                            <p className="text-center text-xs text-indigo-600 font-medium pt-1">
                              + {textFeedbacks.length - 5} comentarios adicionales en la tabla inferior
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Responses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registro Detallado de Participantes</h3>
            <p className="text-xs text-slate-500">Historial completo con respuestas individuales capturadas en vivo</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Channel filter buttons */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setChannelFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  channelFilter === 'all'
                    ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({surveyResponses.length})
              </button>
              <button
                onClick={() => setChannelFilter('direct')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  channelFilter === 'direct'
                    ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Directo
              </button>
              <button
                onClick={() => setChannelFilter('auxiliary')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  channelFilter === 'auxiliary'
                    ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Auxiliares
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar participante..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {filteredResponses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No se encontraron respuestas que coincidan con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Participante</th>
                  <th className="px-5 py-3">Fecha y Hora</th>
                  <th className="px-5 py-3">Canal / Registrado Por</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResponses.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {res.participantName.charAt(0).toUpperCase()}
                        </div>
                        <span>{res.participantName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(res.submittedAt).toLocaleString('es-ES')}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {res.registeredBy && res.registeredBy !== 'direct' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                          Aux: {res.registeredBy}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                          Directo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedResponseDetail(res)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Ver detalle de respuestas"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                        {onDeleteResponse && (
                          <button
                            onClick={() => setResponseToDelete(res)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar este registro de encuesta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponseDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Respuestas de {selectedResponseDetail.participantName}</h3>
                <p className="text-xs text-slate-500">
                  Enviado el {new Date(selectedResponseDetail.submittedAt).toLocaleString('es-ES')}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponseDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {activeSurvey.questions.map((q, idx) => {
                const answer = selectedResponseDetail.answers[q.id];
                return (
                  <div key={q.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-slate-800">
                        {idx + 1}. {q.title}
                      </p>
                      <span className="text-2xs font-bold uppercase text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {q.type}
                      </span>
                    </div>
                    <div className="text-indigo-950 font-medium pl-4">
                      {answer === undefined || answer === null || answer === '' ? (
                        <span className="text-slate-400 italic">Sin responder</span>
                      ) : Array.isArray(answer) ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {answer.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : q.type === 'rating' ? (
                        <div className="flex items-center gap-1 font-bold text-amber-600">
                          <span>{answer} / 5</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </div>
                      ) : q.type === 'nps' ? (
                        <div className="flex items-center gap-2 font-bold">
                          <span className="text-slate-900 text-base">{answer} / 10</span>
                          <span className={`text-2xs px-2 py-0.5 rounded-full font-bold ${
                            Number(answer) >= 9 ? 'bg-emerald-100 text-emerald-800' :
                            Number(answer) >= 7 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {Number(answer) >= 9 ? 'Promotor' : Number(answer) >= 7 ? 'Pasivo' : 'Detractor'}
                          </span>
                        </div>
                      ) : q.type === 'yesno' ? (
                        <span className={answer === 'yes' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {answer === 'yes' ? 'Sí' : 'No'}
                        </span>
                      ) : q.type === 'date' ? (
                        <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{String(answer)}</span>
                        </div>
                      ) : (
                        <span>{String(answer)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedResponseDetail(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Response Modal */}
      {responseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¿Eliminar este registro?
                </h3>
                <p className="text-xs text-slate-500">
                  Participante: <strong className="text-slate-800">{responseToDelete.participantName}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Registrado el {new Date(responseToDelete.submittedAt).toLocaleString('es-ES')}. Se eliminará esta respuesta individual de todos los cálculos analíticos.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResponseToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteResponse) {
                    onDeleteResponse(responseToDelete.id);
                  }
                  setResponseToDelete(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
