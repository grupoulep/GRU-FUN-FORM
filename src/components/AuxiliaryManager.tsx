import React, { useState } from 'react';
import { Auxiliary, Survey } from '../types';
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  KeyRound, 
  Building2, 
  ClipboardCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit,
  X,
  Sparkles,
  Users
} from 'lucide-react';

interface AuxiliaryManagerProps {
  auxiliaries: Auxiliary[];
  surveys: Survey[];
  onSaveAuxiliary: (aux: Auxiliary) => void;
  onDeleteAuxiliary: (auxId: string) => void;
  onSimulateLoginAsAux: (aux: Auxiliary) => void;
}

export const AuxiliaryManager: React.FC<AuxiliaryManagerProps> = ({
  auxiliaries,
  surveys,
  onSaveAuxiliary,
  onDeleteAuxiliary,
  onSimulateLoginAsAux,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAux, setEditingAux] = useState<Auxiliary | null>(null);

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formAssignedSurveys, setFormAssignedSurveys] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [auxToDelete, setAuxToDelete] = useState<Auxiliary | null>(null);

  const handleOpenCreate = () => {
    setEditingAux(null);
    setFormName('');
    setFormCode('AUX-');
    setFormDept('Atención al Usuario');
    // By default assign first survey if available
    setFormAssignedSurveys(surveys.slice(0, 1).map((s) => s.id));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (aux: Auxiliary) => {
    setEditingAux(aux);
    setFormName(aux.name);
    setFormCode(aux.accessCode);
    setFormDept(aux.department);
    setFormAssignedSurveys([...aux.assignedSurveyIds]);
    setIsModalOpen(true);
  };

  const handleToggleSurveyAssignment = (surveyId: string) => {
    if (formAssignedSurveys.includes(surveyId)) {
      setFormAssignedSurveys(formAssignedSurveys.filter((id) => id !== surveyId));
    } else {
      setFormAssignedSurveys([...formAssignedSurveys, surveyId]);
    }
  };

  const handleSelectAllSurveys = () => {
    if (formAssignedSurveys.length === surveys.length) {
      setFormAssignedSurveys([]);
    } else {
      setFormAssignedSurveys(surveys.map((s) => s.id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor ingrese el nombre del auxiliar.');
      return;
    }
    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      alert('Por favor ingrese el código de acceso del auxiliar.');
      return;
    }

    if (cleanCode === 'ADMINIULEP' || cleanCode === 'ADMINIOLEP') {
      alert('ADMINIULEP está reservado exclusivamente para el Administrador Maestro.');
      return;
    }

    // Check duplicate code if creating or changing
    const codeExists = auxiliaries.some(
      (a) => a.accessCode.toUpperCase() === cleanCode && a.id !== editingAux?.id
    );
    if (codeExists) {
      alert(`El código ${cleanCode} ya está en uso por otro auxiliar.`);
      return;
    }

    const auxData: Auxiliary = {
      id: editingAux ? editingAux.id : `aux_${Date.now()}`,
      name: formName.trim(),
      accessCode: cleanCode,
      department: formDept.trim() || 'General',
      assignedSurveyIds: formAssignedSurveys,
      createdAt: editingAux ? editingAux.createdAt : new Date().toISOString(),
    };

    onSaveAuxiliary(auxData);
    setIsModalOpen(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Auto-generate access code from name as user types
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingAux) {
      const firstWord = val.trim().split(' ')[0] || '';
      if (firstWord.length >= 2) {
        setFormCode(`AUX-${firstWord.toUpperCase().replace(/[^A-Z0-9]/g, '')}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Módulo de Auxiliares y Control de Permisos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cree auxiliares con acceso delimitado y asignación granular a encuestas específicas.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Auxiliar</span>
        </button>
      </div>

      {/* Auxiliaries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {auxiliaries.map((aux) => {
          const assignedSurveysList = surveys.filter((s) =>
            aux.assignedSurveyIds.includes(s.id)
          );

          return (
            <div
              key={aux.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shadow-2xs">
                      {aux.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{aux.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{aux.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(aux)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Editar auxiliar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAuxToDelete(aux)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar auxiliar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Access Code badge */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">Código de Acceso:</span>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {aux.accessCode}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(aux.accessCode)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                    title="Copiar código para iniciar sesión"
                  >
                    {copiedCode === aux.accessCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Assigned Surveys */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Encuestas Asignadas ({assignedSurveysList.length}):</span>
                  </p>

                  {assignedSurveysList.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      Sin encuestas asignadas aún. Este auxiliar no podrá ver reportes ni registrar respuestas.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedSurveysList.map((s) => (
                        <span
                          key={s.id}
                          className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 font-medium flex items-center gap-1"
                        >
                          <ClipboardCheck className="w-3 h-3 text-indigo-600" />
                          <span className="truncate max-w-[200px]">{s.title}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Login simulation button */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Creado: {new Date(aux.createdAt).toLocaleDateString('es-ES')}
                </span>
                <button
                  onClick={() => onSimulateLoginAsAux(aux)}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                  <span>Probar vista auxiliar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create / Edit Auxiliary */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingAux ? 'Editar Auxiliar' : 'Crear Nuevo Auxiliar'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Asigne un código y seleccione las encuestas a las que tendrá acceso.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Carlos Mendoza"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Código de Acceso:
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="Ej: AUX-CARLOS"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                  />
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    Usado para iniciar sesión al inicio
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Departamento / Área:
                  </label>
                  <input
                    type="text"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="Ej: Atención al Usuario"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Survey permissions checkboxes */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Encuestas Permitidas:
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllSurveys}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    {formAssignedSurveys.length === surveys.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {surveys.map((s) => {
                    const isChecked = formAssignedSurveys.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSurveyAssignment(s.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-semibold block">{s.title}</span>
                          <span className="text-slate-500">
                            {s.category} • {s.questions.length} preguntas • {s.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal footer buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{editingAux ? 'Guardar Cambios' : 'Crear Auxiliar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Auxiliary Confirmation Modal */}
      {auxToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¿Eliminar auxiliar?
                </h3>
                <p className="text-xs text-slate-500">
                  {auxToDelete.name} ({auxToDelete.accessCode})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Este auxiliar perderá el acceso de inicio de sesión y no podrá seguir recolectando datos.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAuxToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = auxToDelete.id;
                  setAuxToDelete(null);
                  onDeleteAuxiliary(id);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Auxiliar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
