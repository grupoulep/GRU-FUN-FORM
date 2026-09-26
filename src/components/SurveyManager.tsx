import React, { useState, useMemo } from 'react';
import { Survey, Question, QuestionType, SurveyResponse } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Power, 
  Star, 
  ListOrdered, 
  CheckSquare, 
  MessageSquare, 
  HelpCircle, 
  Sparkles, 
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Layers,
  Search,
  BookOpen,
  ArrowUp,
  ArrowDown,
  AlertTriangle
} from 'lucide-react';

const SURVEY_TEMPLATES: {
  title: string;
  description: string;
  category: string;
  questions: Question[];
}[] = [
  {
    title: 'Evaluación de Atención y Calidad de Servicio',
    description: 'Medición de la experiencia del usuario, tiempos de respuesta y amabilidad del personal.',
    category: 'Calidad de Servicio',
    questions: [
      {
        id: 't_q1',
        title: 'Nivel general de satisfacción con la atención recibida:',
        type: 'rating',
        required: true,
        ratingScale: 5,
        minLabel: 'Muy Insatisfecho',
        maxLabel: 'Excelente',
      },
      {
        id: 't_q2',
        title: '¿Por cuál canal se comunicó o realizó su trámite?',
        type: 'dropdown',
        required: true,
        options: ['Atención Presencial', 'Línea Telefónica', 'Portal Web Oficial', 'WhatsApp Oficial', 'Correo Electrónico'],
      },
      {
        id: 't_q3',
        title: '¿Su requerimiento fue resuelto en el primer contacto?',
        type: 'yesno',
        required: true,
      },
      {
        id: 't_q4',
        title: '¿Qué tan probable es que recomiende nuestros servicios a colegas o conocidos?',
        type: 'nps',
        required: true,
      },
      {
        id: 't_q5',
        title: 'Comentarios o sugerencias para continuar optimizando el servicio:',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    title: 'Evaluación de Desempeño y Metodología Docente',
    description: 'Diagnóstico pedagógico, claridad didáctica, puntualidad y recursos utilizados.',
    category: 'Formación Continua',
    questions: [
      {
        id: 't_q1',
        title: 'Claridad en la explicación y dominio de los temas por el docente:',
        type: 'rating',
        required: true,
        ratingScale: 5,
        minLabel: 'Deficiente',
        maxLabel: 'Sobresaliente',
      },
      {
        id: 't_q2',
        title: '¿El material y lecturas facilitaron su aprendizaje efectivo?',
        type: 'yesno',
        required: true,
      },
      {
        id: 't_q3',
        title: 'Modalidad de estudio del participante:',
        type: 'dropdown',
        required: true,
        options: ['Presencial', 'Híbrida', 'Virtual Sincrónica', 'Virtual Asincrónica'],
      },
      {
        id: 't_q4',
        title: '¿Qué aspectos de la metodología pedagógica destacaría?',
        type: 'multiple',
        required: false,
        options: [
          'Ejemplos prácticos y casos reales',
          'Puntualidad e inicio a tiempo',
          'Retroalimentación oportuna en tareas',
          'Espacio abierto a preguntas y debate'
        ],
      },
      {
        id: 't_q5',
        title: 'Recomendaciones constructivas para el docente o programa:',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    title: 'Diagnóstico de Clima Laboral y Bienestar Interno',
    description: 'Evaluación interna de confianza, balance de vida y herramientas de trabajo.',
    category: 'Recursos Humanos',
    questions: [
      {
        id: 't_q1',
        title: 'Área funcional o coordinación a la que pertenece:',
        type: 'dropdown',
        required: true,
        options: ['Dirección General', 'Gestión Comercial y Proyectos', 'Sistemas y Tecnología', 'Atención al Cliente', 'Operaciones y Logística'],
      },
      {
        id: 't_q2',
        title: '¿Cuenta con el equipo informático y ergonómico necesario?',
        type: 'yesno',
        required: true,
      },
      {
        id: 't_q3',
        title: 'Ambiente de comunicación y respeto mutuo en su equipo:',
        type: 'rating',
        required: true,
        ratingScale: 5,
        minLabel: 'Muy tenso',
        maxLabel: 'Excelente',
      },
      {
        id: 't_q4',
        title: '¿Qué tan probable es que recomiende trabajar en GRUPO ULEP SAS (eNPS)?',
        type: 'nps',
        required: true,
      },
      {
        id: 't_q5',
        title: '¿Qué iniciativa en la empresa aumentaría más su bienestar diario?',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    title: 'Encuesta Rápida de Eventos, Talleres y Foros',
    description: 'Feedback ágil post-evento con fecha, evaluación de ponencias y Net Promoter Score.',
    category: 'Eventos',
    questions: [
      {
        id: 't_q1',
        title: 'Fecha del evento al que asistió:',
        type: 'date',
        required: true,
      },
      {
        id: 't_q2',
        title: 'Relevancia y actualidad de las temáticas abordadas:',
        type: 'rating',
        required: true,
        ratingScale: 5,
        minLabel: 'Poco relevante',
        maxLabel: 'Muy innovador',
      },
      {
        id: 't_q3',
        title: '¿La organización logística y horarios cumplieron sus expectativas?',
        type: 'yesno',
        required: true,
      },
      {
        id: 't_q4',
        title: '¿Recomendaría nuestras próximas conferencias a sus colegas?',
        type: 'nps',
        required: true,
      },
      {
        id: 't_q5',
        title: '¿Qué otros ponentes o temáticas sugiere para el próximo evento?',
        type: 'text',
        required: false,
      }
    ]
  }
];

interface SurveyManagerProps {
  surveys: Survey[];
  responses: SurveyResponse[];
  onSaveSurvey: (survey: Survey) => void;
  onDeleteSurvey: (surveyId: string) => void;
  onToggleActive: (surveyId: string) => void;
  onSetPrimaryActive: (surveyId: string) => void;
  onTestSurvey: (survey: Survey) => void;
}

export const SurveyManager: React.FC<SurveyManagerProps> = ({
  surveys,
  responses,
  onSaveSurvey,
  onDeleteSurvey,
  onToggleActive,
  onSetPrimaryActive,
  onTestSurvey,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);

  // Form states for creating/editing a survey
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [formQuestions, setFormQuestions] = useState<Question[]>([]);

  // Distinct categories from existing surveys
  const categories = useMemo(() => {
    const set = new Set<string>();
    surveys.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ['Todas', ...Array.from(set)];
  }, [surveys]);

  // Filtered surveys list
  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      const matchSearch =
        searchQuery === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'Todas' || s.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [surveys, searchQuery, categoryFilter]);

  // Start new survey creation
  const handleStartCreate = () => {
    setEditingSurvey(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Calidad de Servicio');
    setFormIsActive(true);
    setFormIsPrimary(surveys.length === 0);
    setFormQuestions([
      {
        id: `q_${Date.now()}_1`,
        title: '¿Cuál es su nivel de satisfacción con la experiencia brindada?',
        type: 'rating',
        required: true,
        ratingScale: 5,
        minLabel: 'Muy bajo',
        maxLabel: 'Excelente',
      },
      {
        id: `q_${Date.now()}_2`,
        title: '¿Recomendaría nuestros programas y servicios?',
        type: 'yesno',
        required: true,
      },
    ]);
    setIsCreating(true);
  };

  // Apply quick template
  const handleApplyTemplate = (tpl: (typeof SURVEY_TEMPLATES)[0]) => {
    setEditingSurvey(null);
    setFormTitle(tpl.title);
    setFormDescription(tpl.description);
    setFormCategory(tpl.category);
    setFormIsActive(true);
    setFormIsPrimary(false);
    setFormQuestions(JSON.parse(JSON.stringify(tpl.questions)));
    setShowTemplatesModal(false);
    setIsCreating(true);
  };

  // Clone / duplicate survey
  const handleDuplicateSurvey = (survey: Survey) => {
    const cloned: Survey = {
      ...JSON.parse(JSON.stringify(survey)),
      id: `survey_${Date.now()}`,
      title: `Copia de ${survey.title}`,
      isPrimaryActive: false,
      createdAt: new Date().toISOString(),
    };
    onSaveSurvey(cloned);
  };

  // Edit existing survey
  const handleStartEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setFormTitle(survey.title);
    setFormDescription(survey.description);
    setFormCategory(survey.category);
    setFormIsActive(survey.isActive);
    setFormIsPrimary(survey.isPrimaryActive);
    setFormQuestions(JSON.parse(JSON.stringify(survey.questions)));
    setIsCreating(true);
  };

  // Add question
  const handleAddQuestion = (type: QuestionType = 'single') => {
    const newQ: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title:
        type === 'nps'
          ? '¿Qué tan probable es que recomiende nuestros servicios? (0 al 10)'
          : type === 'date'
          ? 'Indique la fecha correspondiente:'
          : 'Nueva Pregunta',
      type: type,
      required: true,
      options:
        type === 'single' || type === 'multiple' || type === 'dropdown'
          ? ['Opción 1', 'Opción 2', 'Opción 3']
          : undefined,
      ratingScale: type === 'rating' ? 5 : type === 'nps' ? 10 : undefined,
      minLabel: type === 'rating' ? 'Deficiente' : type === 'nps' ? '0 - Nada probable' : undefined,
      maxLabel: type === 'rating' ? 'Excelente' : type === 'nps' ? '10 - Muy probable' : undefined,
    };
    setFormQuestions([...formQuestions, newQ]);
  };

  // Move question order
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formQuestions.length - 1) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    const list = [...formQuestions];
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setFormQuestions(list);
  };

  // Update question title / props
  const handleUpdateQuestion = (qId: string, updates: Partial<Question>) => {
    setFormQuestions(
      formQuestions.map((q) => {
        if (q.id === qId) {
          const updated = { ...q, ...updates };
          // If changing type to single, multiple, or dropdown and options don't exist
          if (
            (updated.type === 'single' || updated.type === 'multiple' || updated.type === 'dropdown') &&
            !updated.options
          ) {
            updated.options = ['Opción A', 'Opción B', 'Opción C'];
          }
          if (updated.type === 'nps') {
            updated.ratingScale = 10;
            updated.minLabel = '0 - Nada probable';
            updated.maxLabel = '10 - Muy probable';
          }
          return updated;
        }
        return q;
      })
    );
  };

  // Remove question
  const handleRemoveQuestion = (qId: string) => {
    if (formQuestions.length <= 1) {
      alert('La encuesta debe tener al menos una pregunta.');
      return;
    }
    setFormQuestions(formQuestions.filter((q) => q.id !== qId));
  };

  // Options management for single/multiple/dropdown
  const handleAddOption = (qId: string) => {
    setFormQuestions(
      formQuestions.map((q) => {
        if (q.id === qId) {
          const curOpts = q.options || [];
          return { ...q, options: [...curOpts, `Opción ${curOpts.length + 1}`] };
        }
        return q;
      })
    );
  };

  const handleUpdateOption = (qId: string, optIndex: number, newVal: string) => {
    setFormQuestions(
      formQuestions.map((q) => {
        if (q.id === qId && q.options) {
          const newOpts = [...q.options];
          newOpts[optIndex] = newVal;
          return { ...q, options: newOpts };
        }
        return q;
      })
    );
  };

  const handleRemoveOption = (qId: string, optIndex: number) => {
    setFormQuestions(
      formQuestions.map((q) => {
        if (q.id === qId && q.options) {
          if (q.options.length <= 2) {
            alert('Debe conservar al menos dos opciones.');
            return q;
          }
          return { ...q, options: q.options.filter((_, idx) => idx !== optIndex) };
        }
        return q;
      })
    );
  };

  // Save survey form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Por favor ingrese el título de la encuesta.');
      return;
    }

    if (formQuestions.length === 0) {
      alert('Por favor agregue al menos una pregunta.');
      return;
    }

    const surveyData: Survey = {
      id: editingSurvey ? editingSurvey.id : `survey_${Date.now()}`,
      title: formTitle.trim(),
      description: formDescription.trim() || 'Sin descripción.',
      category: formCategory.trim() || 'General',
      isActive: formIsActive,
      isPrimaryActive: formIsPrimary,
      createdAt: editingSurvey ? editingSurvey.createdAt : new Date().toISOString(),
      questions: formQuestions,
    };

    onSaveSurvey(surveyData);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Survey button and Templates */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Gestión Centralizada de Encuestas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cree, configure y active encuestas escalables para todos los departamentos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowTemplatesModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Plantillas Rápidas</span>
          </button>

          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Encuesta</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, categoría o descripción..."
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List of Existing Surveys */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSurveys.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-slate-500 text-sm font-medium">
              No se encontraron encuestas que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          filteredSurveys.map((survey) => {
            const respCount = responses.filter((r) => r.surveyId === survey.id).length;

            return (
              <div
                key={survey.id}
                className={`bg-white rounded-2xl p-6 border transition-all shadow-sm ${
                  survey.isPrimaryActive
                    ? 'border-indigo-300 ring-2 ring-indigo-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {survey.isPrimaryActive && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          Encuesta Activa Principal
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          survey.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            survey.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {survey.isActive ? 'En Línea' : 'Pausada'}
                      </span>

                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                        {survey.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {survey.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                      {survey.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pt-1">
                      <span>{survey.questions.length} preguntas configuradas</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800">{respCount} respuestas recibidas</span>
                      <span>•</span>
                      <span>ID: {survey.id}</span>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Primary Active Switch */}
                    {!survey.isPrimaryActive && (
                      <button
                        onClick={() => onSetPrimaryActive(survey.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Fijar como la encuesta activa principal"
                      >
                        Fijar como Principal
                      </button>
                    )}

                    {/* Toggle Active state */}
                    <button
                      onClick={() => onToggleActive(survey.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        survey.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{survey.isActive ? 'Pausar' : 'Activar'}</span>
                    </button>

                    {/* Test survey button */}
                    <button
                      onClick={() => onTestSurvey(survey)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Responder esta encuesta como participante de prueba"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Probar</span>
                    </button>

                    {/* Duplicate button */}
                    <button
                      onClick={() => handleDuplicateSurvey(survey)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Duplicar encuesta para crear una copia exacta"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(survey)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Editar encuesta"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setSurveyToDelete(survey)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                      title="Eliminar encuesta y todos sus registros asociados"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Survey Modal / Overlay */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSurvey ? 'Editar Encuesta' : 'Diseñar Nueva Encuesta'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Defina los parámetros generales y agregue preguntas interactivas.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Basic Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Título de la Encuesta:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej: Evaluación de Clima Laboral 2026..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Categoría / Área:
                    </label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="Ej: Calidad de Servicio, Clima Laboral, Proyectos..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4 sm:pt-6">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Publicar como Activa</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-indigo-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsPrimary}
                        onChange={(e) => setFormIsPrimary(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Activa Principal</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Descripción o Instrucciones para el encuestado:
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Detalle el objetivo del sondeo o instrucciones pertinentes..."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Preguntas de la Encuesta ({formQuestions.length})
                    </h4>
                    <p className="text-xs text-slate-500">Configure los tipos de respuesta y opciones.</p>
                  </div>

                  {/* Add question type buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('rating')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3 h-3" />
                      <span>+ Estrellas (1-5)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('nps')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>+ NPS (0-10)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('single')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                    >
                      <ListOrdered className="w-3 h-3" />
                      <span>+ Opción Única</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('multiple')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>+ Múltiple</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('dropdown')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3 h-3 text-purple-600" />
                      <span>+ Desplegable</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('yesno')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>+ Sí/No</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('date')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-cyan-600" />
                      <span>+ Fecha</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('text')}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>+ Texto</span>
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  {formQuestions.map((q, qIndex) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          {/* Reordering buttons */}
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={qIndex === 0}
                              onClick={() => handleMoveQuestion(qIndex, 'up')}
                              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                              title="Mover arriba"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={qIndex === formQuestions.length - 1}
                              onClick={() => handleMoveQuestion(qIndex, 'down')}
                              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                              title="Mover abajo"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                            {qIndex + 1}
                          </span>
                          <input
                            type="text"
                            required
                            value={q.title}
                            onChange={(e) => handleUpdateQuestion(q.id, { title: e.target.value })}
                            placeholder="Texto de la pregunta..."
                            className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                          />
                        </div>

                        {/* Question type selector */}
                        <select
                          value={q.type}
                          onChange={(e) => handleUpdateQuestion(q.id, { type: e.target.value as QuestionType })}
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="rating">Escala (1-5)</option>
                          <option value="nps">Net Promoter Score (0-10)</option>
                          <option value="single">Opción Única</option>
                          <option value="multiple">Selección Múltiple</option>
                          <option value="dropdown">Menú Desplegable</option>
                          <option value="yesno">Sí / No</option>
                          <option value="date">Fecha</option>
                          <option value="text">Texto Libre</option>
                        </select>

                        {/* Remove question */}
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Options editor for single, multiple or dropdown */}
                      {(q.type === 'single' || q.type === 'multiple' || q.type === 'dropdown') && (
                        <div className="pl-8 space-y-2">
                          <p className="text-xs font-semibold text-slate-600">Opciones de respuesta:</p>
                          {q.options?.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">•</span>
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => handleUpdateOption(q.id, optIdx, e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs rounded-md border border-slate-300 bg-white text-slate-800 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(q.id, optIdx)}
                                className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddOption(q.id)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir opción</span>
                          </button>
                        </div>
                      )}

                      {/* Required checkbox */}
                      <div className="pl-8 flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => handleUpdateQuestion(q.id, { required: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span>Respuesta obligatoria</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Encuesta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 my-auto overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">Plantillas Predefinidas de Encuesta</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Seleccione una plantilla validada para iniciar con un cuestionario listo en 1 clic.
                </p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {SURVEY_TEMPLATES.map((tpl, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer"
                  onClick={() => handleApplyTemplate(tpl)}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {tpl.category}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {tpl.questions.length} preguntas pre-configuradas
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {tpl.title}
                    </h4>
                    <p className="text-xs text-slate-500">{tpl.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyTemplate(tpl);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    Usar Plantilla
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Confirmation Modal for Deleting Survey & Its Records */}
      {surveyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  ¿Eliminar encuesta y todos sus registros?
                </h3>
                <p className="text-xs text-slate-600">
                  Está a punto de eliminar de manera permanente la encuesta:
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800">{surveyToDelete.title}</div>
                  <div className="text-slate-500 text-2xs">
                    {surveyToDelete.questions.length} preguntas •{' '}
                    <span className="font-semibold text-rose-600">
                      {responses.filter((r) => r.surveyId === surveyToDelete.id).length} registros de respuestas asociados
                    </span>
                  </div>
                </div>
                <p className="text-2xs text-rose-600 font-semibold pt-1">
                  ⚠️ Esta acción no se puede deshacer. Se eliminarán tanto la encuesta como todos sus registros de respuestas en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSurveyToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = surveyToDelete.id;
                  setSurveyToDelete(null);
                  onDeleteSurvey(idToDelete);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Permanentemente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
