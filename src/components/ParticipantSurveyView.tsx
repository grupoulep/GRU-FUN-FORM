import React, { useState } from 'react';
import { Survey, Question, PlatformSettings } from '../types';
import { CheckCircle2, Star, ThumbsUp, ThumbsDown, AlertCircle, Send, ClipboardCheck, Sparkles, FileSpreadsheet, Mail, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface ParticipantSurveyViewProps {
  survey: Survey;
  participantName: string;
  participantEmail?: string;
  registeredBy?: string;
  platformSettings?: PlatformSettings;
  onSubmit: (answers: Record<string, any>, participantInfo?: { name: string; email: string }) => void;
  onExit: () => void;
}

export const ParticipantSurveyView: React.FC<ParticipantSurveyViewProps> = ({
  survey,
  participantName,
  participantEmail = '',
  registeredBy,
  platformSettings,
  onSubmit,
  onExit,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Handle answers for different question types
  const handleSingleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleMultipleAnswer = (questionId: string, option: string) => {
    const current: string[] = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    const exists = current.includes(option);
    const updated = exists ? current.filter((item) => item !== option) : [...current, option];
    setAnswers((prev) => ({ ...prev, [questionId]: updated }));
    if (updated.length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleRatingAnswer = (questionId: string, rating: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: rating }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
    if (text.trim()) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleYesNoAnswer = (questionId: string, value: 'yes' | 'no') => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // Validate required questions and participant details
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    const newErrors: Record<string, string> = {};

    survey.questions.forEach((q) => {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') {
          newErrors[q.id] = 'Esta pregunta es obligatoria.';
        } else if (Array.isArray(val) && val.length === 0) {
          newErrors[q.id] = 'Debe seleccionar al menos una opción.';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`question-card-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setSubmitted(true);
    onSubmit(answers, { name: participantName, email: participantEmail });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xl shadow-slate-100"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Muchas gracias, {participantName}!</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">
            Tus respuestas para <span className="font-semibold text-slate-800">&quot;{survey.title}&quot;</span> han sido registradas exitosamente.
          </p>

          <div className="flex justify-center">
            <button
              onClick={onExit}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              Volver al inicio
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {survey.title || platformSettings?.title || 'Sistema de Encuestas GRUPO ULEP SAS'}
            </h1>
          </div>
        </div>

        {registeredBy && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Auxiliar: {registeredBy}
            </span>
          </div>
        )}
      </div>

      {/* Form Questions */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {survey.questions.map((question: Question, index: number) => {
          const hasError = !!errors[question.id];
          const isAnswered = answers[question.id] !== undefined && answers[question.id] !== '';

          return (
            <div
              key={question.id}
              id={`question-card-${question.id}`}
              className={`bg-white rounded-2xl p-6 sm:p-7 border transition-all duration-200 shadow-sm ${
                hasError
                  ? 'border-red-300 ring-2 ring-red-100'
                  : isAnswered
                  ? 'border-slate-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {question.title}
                      {question.required && (
                        <span className="text-red-500 font-bold ml-1.5" title="Obligatoria">
                          *
                        </span>
                      )}
                    </h2>
                    {question.description && (
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">{question.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Input Controls */}
              <div className="mt-4 pl-0 sm:pl-10">
                {/* 1. Rating Question */}
                {question.type === 'rating' && (
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      {[1, 2, 3, 4, 5].map((score) => {
                        const isSelected = answers[question.id] === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleRatingAnswer(question.id, score)}
                            className={`flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 scale-105'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Star
                              className={`w-5 h-5 mb-1 ${
                                isSelected ? 'fill-yellow-300 text-yellow-300' : 'text-slate-400'
                              }`}
                            />
                            <span>{score}</span>
                          </button>
                        );
                      })}
                    </div>
                    {(question.minLabel || question.maxLabel) && (
                      <div className="flex justify-between text-xs text-slate-400 mt-2 max-w-xs font-medium">
                        <span>{question.minLabel || '1 (Bajo)'}</span>
                        <span>{question.maxLabel || '5 (Excelente)'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Single Choice (Radio) */}
                {question.type === 'single' && (
                  <div className="space-y-2.5">
                    {question.options?.map((option, optIdx) => {
                      const isSelected = answers[question.id] === option;
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleSingleAnswer(question.id, option)}
                          className={`flex items-center p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200/50 text-indigo-950 font-medium'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 shrink-0 ${
                              isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="text-sm">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 3. Multiple Choice (Checkbox) */}
                {question.type === 'multiple' && (
                  <div className="space-y-2.5">
                    {question.options?.map((option, optIdx) => {
                      const selectedArr: string[] = answers[question.id] || [];
                      const isSelected = selectedArr.includes(option);
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleMultipleAnswer(question.id, option)}
                          className={`flex items-center p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200/50 text-indigo-950 font-medium'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center mr-3 shrink-0 ${
                              isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </span>
                          <span className="text-sm">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 4. Yes/No Binary Choice */}
                {question.type === 'yesno' && (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleYesNoAnswer(question.id, 'yes')}
                      className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        answers[question.id] === 'yes'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4 text-emerald-600" />
                      <span>Sí</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleYesNoAnswer(question.id, 'no')}
                      className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        answers[question.id] === 'no'
                          ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-200'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4 text-rose-600" />
                      <span>No</span>
                    </button>
                  </div>
                )}

                {/* 5. Text / Comments */}
                {question.type === 'text' && (
                  <div>
                    <textarea
                      rows={3}
                      value={answers[question.id] || ''}
                      onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                      placeholder={question.placeholder || "Escriba aquí su comentario, opinión o sugerencia..."}
                      className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-400 resize-y"
                    />
                  </div>
                )}

                {/* 6. Dropdown Selection */}
                {question.type === 'dropdown' && (
                  <div className="max-w-md">
                    <select
                      value={answers[question.id] || ''}
                      onChange={(e) => handleSingleAnswer(question.id, e.target.value)}
                      className="w-full p-3.5 text-sm rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 cursor-pointer"
                    >
                      <option value="">-- Seleccione una opción --</option>
                      {question.options?.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 7. NPS (Net Promoter Score 0-10) */}
                {question.type === 'nps' && (
                  <div>
                    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                        const isSelected = answers[question.id] === score;
                        const isDetractor = score <= 6;
                        const isPassive = score >= 7 && score <= 8;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleRatingAnswer(question.id, score)}
                            className={`h-11 sm:h-12 rounded-xl border text-sm font-extrabold transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isSelected
                                ? isDetractor
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-105'
                                  : isPassive
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-105'
                                  : 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>{score}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                      <span className="text-rose-600/80">0 - Nada probable</span>
                      <span className="text-amber-600/80">7-8 Pasivo</span>
                      <span className="text-emerald-600/80">10 - Muy probable</span>
                    </div>
                  </div>
                )}

                {/* 8. Date Picker */}
                {question.type === 'date' && (
                  <div className="max-w-xs">
                    <input
                      type="date"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleSingleAnswer(question.id, e.target.value)}
                      className="w-full p-3.5 text-sm rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 cursor-pointer"
                    />
                  </div>
                )}

                {/* Error message */}
                <AnimatePresence>
                  {hasError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-2.5 text-xs text-red-600 flex items-center gap-1 font-semibold"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors[question.id]}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* Form Actions */}
        <div className="pt-4 pb-12 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onExit}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Send className="w-4 h-4" />
            Enviar mis respuestas
          </button>
        </div>
      </form>
    </div>
  );
};
