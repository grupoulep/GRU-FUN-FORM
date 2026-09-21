import React, { useState, useEffect, useMemo } from 'react';
import { Survey, Auxiliary, SurveyResponse, CurrentUser, PlatformSettings } from './types';
import {
  getStoredSurveys,
  saveStoredSurveys,
  getStoredAuxiliaries,
  saveStoredAuxiliaries,
  getStoredResponses,
  saveStoredResponses,
  getStoredPlatformSettings,
  saveStoredPlatformSettings,
  resetToDefaultData,
} from './utils/storage';
import {
  subscribeToSurveys,
  saveSurveyToFirestore,
  deleteSurveyFromFirestore,
  subscribeToAuxiliaries,
  saveAuxiliaryToFirestore,
  deleteAuxiliaryFromFirestore,
  subscribeToSurveyResponses,
  addSurveyResponseToFirestore,
  deleteSurveyResponseFromFirestore,
  subscribeToPlatformSettings,
  savePlatformSettingsToFirestore,
  seedInitialFirestoreData,
} from './firebase/firestoreService';
import { testFirestoreConnection, auth, logOutUser } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginScreen } from './components/LoginScreen';
import { ParticipantSurveyView } from './components/ParticipantSurveyView';
import { AdminPanel } from './components/AdminPanel';
import { AuxiliaryView } from './components/AuxiliaryView';
import { AlertCircle, HelpCircle, ArrowLeft, ClipboardX } from 'lucide-react';

export default function App() {
  const [surveys, setSurveys] = useState<Survey[]>(() => getStoredSurveys());
  const [auxiliaries, setAuxiliaries] = useState<Auxiliary[]>(() => getStoredAuxiliaries());
  const [responses, setResponses] = useState<SurveyResponse[]>(() => getStoredResponses());
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => getStoredPlatformSettings());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentTestSurvey, setCurrentTestSurvey] = useState<Survey | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Initialize Firebase connection and live real-time listeners
  useEffect(() => {
    // 1. Connection validation (skill requirement)
    testFirestoreConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    // 3. Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email === 'grupoulep@gmail.com') {
          setCurrentUser({
            name: firebaseUser.displayName || firebaseUser.email || 'ADMINIULEP',
            role: 'admin',
          });
          seedInitialFirestoreData();
        }
      }
    });

    // 4. Realtime Firestore Subscriptions
    const unsubSurveys = subscribeToSurveys((remoteSurveys) => {
      if (remoteSurveys && remoteSurveys.length > 0) {
        setSurveys(remoteSurveys);
      }
    });

    const unsubAux = subscribeToAuxiliaries((remoteAux) => {
      if (remoteAux && remoteAux.length > 0) {
        setAuxiliaries(remoteAux);
      }
    });

    const unsubResponses = subscribeToSurveyResponses((remoteResp) => {
      if (remoteResp) {
        setResponses(remoteResp);
      }
    });

    const unsubSettings = subscribeToPlatformSettings((remoteSettings) => {
      if (remoteSettings && remoteSettings.title) {
        setPlatformSettings(remoteSettings);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubSurveys();
      unsubAux();
      unsubResponses();
      unsubSettings();
    };
  }, []);

  // Keep storage and page title in sync
  useEffect(() => {
    saveStoredSurveys(surveys);
  }, [surveys]);

  useEffect(() => {
    saveStoredAuxiliaries(auxiliaries);
  }, [auxiliaries]);

  useEffect(() => {
    saveStoredResponses(responses);
  }, [responses]);

  useEffect(() => {
    saveStoredPlatformSettings(platformSettings);
    if (platformSettings.title) {
      document.title = platformSettings.title;
    }
  }, [platformSettings]);

  // Primary active survey for regular participants
  const primaryActiveSurvey = useMemo(() => {
    const primary = surveys.find((s) => s.isActive && s.isPrimaryActive);
    if (primary) return primary;
    return surveys.find((s) => s.isActive) || null;
  }, [surveys]);

  // Login handler
  const handleLogin = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // 1. Check for ADMINIULEP (Case-insensitive) -> Full Admin Privileges
    if (trimmed.toUpperCase() === 'ADMINIULEP' || trimmed.toUpperCase() === 'ADMINIOLEP') {
      setCurrentUser({
        name: 'ADMINIULEP',
        role: 'admin',
      });
      return;
    }

    // 2. Check if it matches an Auxiliary's access code or name
    const matchedAux = auxiliaries.find(
      (a) =>
        a.accessCode.toUpperCase() === trimmed.toUpperCase() ||
        a.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (matchedAux) {
      setCurrentUser({
        name: matchedAux.name,
        role: 'auxiliary',
        auxiliaryData: matchedAux,
      });
      return;
    }

    // 3. Any other text enters the active survey as a participant
    setCurrentUser({
      name: trimmed,
      role: 'participant',
    });
  };

  const handleLogout = () => {
    logOutUser().catch(() => {});
    setCurrentUser(null);
    setCurrentTestSurvey(null);
  };

  const handleGoogleLogin = (user: any) => {
    if (user.email === 'grupoulep@gmail.com') {
      setCurrentUser({
        name: user.displayName || user.email || 'ADMINIULEP',
        role: 'admin',
      });
    } else {
      setCurrentUser({
        name: user.displayName || user.email || 'Participante',
        role: 'participant',
      });
    }
  };

  // Add response handler
  const handleAddResponse = (
    surveyId: string,
    participantName: string,
    answers: Record<string, any>,
    registeredBy: string = 'direct'
  ) => {
    const newResponse: SurveyResponse = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      surveyId,
      participantName,
      submittedAt: new Date().toISOString(),
      answers,
      registeredBy,
    };

    setResponses((prev) => [newResponse, ...prev]);
    addSurveyResponseToFirestore(newResponse).catch((err) => {
      console.warn('Firestore response write notice:', err);
    });
  };

  // Save survey (add or edit)
  const handleSaveSurvey = (surveyToSave: Survey) => {
    setSurveys((prev) => {
      const exists = prev.some((s) => s.id === surveyToSave.id);
      let updatedList = exists
        ? prev.map((s) => (s.id === surveyToSave.id ? surveyToSave : s))
        : [surveyToSave, ...prev];

      // If set as primary, unmark others
      if (surveyToSave.isPrimaryActive) {
        updatedList = updatedList.map((s) =>
          s.id === surveyToSave.id ? { ...s, isPrimaryActive: true } : { ...s, isPrimaryActive: false }
        );
      }

      return updatedList;
    });

    saveSurveyToFirestore(surveyToSave).catch((err) => {
      console.warn('Firestore survey write notice:', err);
    });
  };

  // Delete survey AND its responses (el registro de la encuesta)
  const handleDeleteSurvey = (surveyId: string) => {
    // 1. If it was the only survey, replace with a clean empty survey so app stays functional
    if (surveys.length <= 1) {
      const freshSurvey: Survey = {
        id: `survey_${Date.now()}`,
        title: 'Nueva Encuesta',
        description: 'Encuesta en blanco lista para configurar preguntas personalizadas.',
        category: 'General',
        isActive: true,
        isPrimaryActive: true,
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: `q_${Date.now()}_1`,
            title: '¿Cómo califica el servicio o atención recibida?',
            type: 'rating',
            required: true,
            ratingScale: 5,
            minLabel: 'Deficiente',
            maxLabel: 'Excelente',
          },
        ],
      };
      setSurveys([freshSurvey]);
      saveSurveyToFirestore(freshSurvey).catch(() => {});
    } else {
      setSurveys((prev) => {
        const remaining = prev.filter((s) => s.id !== surveyId);
        // If deleted was primary, assign first remaining as primary
        if (prev.find((s) => s.id === surveyId)?.isPrimaryActive && remaining.length > 0) {
          remaining[0].isPrimaryActive = true;
          saveSurveyToFirestore(remaining[0]).catch(() => {});
        }
        return remaining;
      });
      deleteSurveyFromFirestore(surveyId).catch(() => {});
    }

    // 2. Remove ALL survey response records for this survey!
    setResponses((prev) => prev.filter((r) => r.surveyId !== surveyId));

    // 3. Also remove from auxiliaries assigned list
    setAuxiliaries((prev) =>
      prev.map((a) => {
        const updated = {
          ...a,
          assignedSurveyIds: a.assignedSurveyIds.filter((id) => id !== surveyId),
        };
        saveAuxiliaryToFirestore(updated).catch(() => {});
        return updated;
      })
    );

    // 4. Close preview if testing this survey
    if (currentTestSurvey?.id === surveyId) {
      setCurrentTestSurvey(null);
    }
  };

  // Delete individual response record (registro de participante)
  const handleDeleteResponse = (responseId: string) => {
    setResponses((prev) => prev.filter((r) => r.id !== responseId));
    deleteSurveyResponseFromFirestore(responseId).catch(() => {});
  };

  // Toggle active
  const handleToggleActive = (surveyId: string) => {
    setSurveys((prev) =>
      prev.map((s) => {
        if (s.id === surveyId) {
          const nextActive = !s.isActive;
          const updated = {
            ...s,
            isActive: nextActive,
            isPrimaryActive: nextActive ? s.isPrimaryActive : false,
          };
          saveSurveyToFirestore(updated).catch(() => {});
          return updated;
        }
        return s;
      })
    );
  };

  // Set as primary active
  const handleSetPrimaryActive = (surveyId: string) => {
    setSurveys((prev) =>
      prev.map((s) => {
        const updated = {
          ...s,
          isActive: s.id === surveyId ? true : s.isActive,
          isPrimaryActive: s.id === surveyId,
        };
        saveSurveyToFirestore(updated).catch(() => {});
        return updated;
      })
    );
  };

  // Save auxiliary
  const handleSaveAuxiliary = (auxToSave: Auxiliary) => {
    setAuxiliaries((prev) => {
      const exists = prev.some((a) => a.id === auxToSave.id);
      return exists ? prev.map((a) => (a.id === auxToSave.id ? auxToSave : a)) : [auxToSave, ...prev];
    });
    saveAuxiliaryToFirestore(auxToSave).catch(() => {});
  };

  // Delete auxiliary
  const handleDeleteAuxiliary = (auxId: string) => {
    setAuxiliaries((prev) => prev.filter((a) => a.id !== auxId));
    deleteAuxiliaryFromFirestore(auxId).catch(() => {});
  };

  // Simulate logging in as an auxiliary
  const handleSimulateLoginAsAux = (aux: Auxiliary) => {
    setCurrentUser({
      name: aux.name,
      role: 'auxiliary',
      auxiliaryData: aux,
    });
  };

  // Simulate a live participant response for instant real-time visualization
  const handleSimulateResponse = (surveyId: string, count: number = 1) => {
    const survey = surveys.find((s) => s.id === surveyId) || primaryActiveSurvey;
    if (!survey) return;

    const sampleNames = [
      'Martín Silva',
      'Florencia Castro',
      'Gabriel Ortiz',
      'Beatriz Navas',
      'Hernán Delgado',
      'Alicia Pardo',
      'Cristian Barrientos',
      'Daniela Soto',
      'Rodrigo Peña',
      'Valeria Morales',
    ];

    for (let i = 0; i < count; i++) {
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const answers: Record<string, any> = {};

      survey.questions.forEach((q) => {
        if (q.type === 'rating') {
          answers[q.id] = Math.floor(Math.random() * 2) + 4; // 4 or 5
        } else if (q.type === 'nps') {
          // Weighted towards positive 8-10 with occasional 6 or 7
          const npsPool = [10, 10, 9, 9, 9, 8, 8, 7, 6];
          answers[q.id] = npsPool[Math.floor(Math.random() * npsPool.length)];
        } else if ((q.type === 'single' || q.type === 'dropdown') && q.options && q.options.length > 0) {
          answers[q.id] = q.options[Math.floor(Math.random() * q.options.length)];
        } else if (q.type === 'multiple' && q.options && q.options.length > 0) {
          const numSelections = Math.floor(Math.random() * 2) + 1;
          answers[q.id] = [...q.options].sort(() => 0.5 - Math.random()).slice(0, numSelections);
        } else if (q.type === 'yesno') {
          answers[q.id] = Math.random() > 0.15 ? 'yes' : 'no';
        } else if (q.type === 'date') {
          const d = new Date();
          d.setDate(d.getDate() - Math.floor(Math.random() * 14));
          answers[q.id] = d.toISOString().split('T')[0];
        } else if (q.type === 'text') {
          const comments = [
            'Proceso sumamente ágil y sin complicaciones.',
            'Muy buena disposición por parte del personal de atención.',
            'La plataforma respondió de inmediato, muy satisfecho.',
            'Excelente atención, sugeriría ampliar el horario de atención telefónica.',
            'Muy recomendada la plataforma, gran experiencia de usuario.',
          ];
          answers[q.id] = comments[Math.floor(Math.random() * comments.length)];
        }
      });

      handleAddResponse(survey.id, randomName, answers, 'Simulado en vivo');
    }
  };

  // Reset to default sample state
  const handleResetToDefaults = () => {
    resetToDefaultData();
    setSurveys(getStoredSurveys());
    setAuxiliaries(getStoredAuxiliaries());
    setResponses(getStoredResponses());
    setPlatformSettings(getStoredPlatformSettings());
  };

  const handleUpdatePlatformSettings = (newSettings: PlatformSettings) => {
    setPlatformSettings(newSettings);
    saveStoredPlatformSettings(newSettings);
    savePlatformSettingsToFirestore(newSettings).catch(() => {});
  };

  // Clear responses
  const handleClearResponses = () => {
    setResponses([]);
    saveStoredResponses([]);
    // Delete each response from firestore
    responses.forEach((r) => {
      deleteSurveyResponseFromFirestore(r.id).catch(() => {});
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <main className="flex-1">
        {/* 1. Unauthenticated: Login Screen */}
        {!currentUser && (
          <LoginScreen
            onLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            isFirebaseConnected={isFirebaseConnected}
            platformSettings={platformSettings}
          />
        )}

        {/* 2. Admin Role (ADMINIULEP) */}
        {currentUser && currentUser.role === 'admin' && (
          <>
            {currentTestSurvey ? (
              /* Admin testing a survey as participant */
              <div className="space-y-4">
                <div className="max-w-3xl mx-auto px-4 pt-6">
                  <button
                    onClick={() => setCurrentTestSurvey(null)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver al Panel de Administración</span>
                  </button>
                </div>
                <ParticipantSurveyView
                  survey={currentTestSurvey}
                  participantName="Administrador (Prueba)"
                  registeredBy="ADMINIULEP"
                  platformSettings={platformSettings}
                  onSubmit={(answers) => {
                    handleAddResponse(
                      currentTestSurvey.id,
                      'Administrador (Prueba)',
                      answers,
                      'ADMINIULEP'
                    );
                  }}
                  onExit={() => setCurrentTestSurvey(null)}
                />
              </div>
            ) : (
              <AdminPanel
                surveys={surveys}
                auxiliaries={auxiliaries}
                responses={responses}
                platformSettings={platformSettings}
                onUpdatePlatformSettings={handleUpdatePlatformSettings}
                onLogout={handleLogout}
                onSaveSurvey={handleSaveSurvey}
                onDeleteSurvey={handleDeleteSurvey}
                onToggleActive={handleToggleActive}
                onSetPrimaryActive={handleSetPrimaryActive}
                onSaveAuxiliary={handleSaveAuxiliary}
                onDeleteAuxiliary={handleDeleteAuxiliary}
                onSimulateLoginAsAux={handleSimulateLoginAsAux}
                onTestSurveyAsParticipant={(s) => setCurrentTestSurvey(s)}
                onSimulateResponse={handleSimulateResponse}
                onResetToDefaults={handleResetToDefaults}
                onClearResponses={handleClearResponses}
                onDeleteResponse={handleDeleteResponse}
              />
            )}
          </>
        )}

        {/* 3. Auxiliary Role */}
        {currentUser && currentUser.role === 'auxiliary' && currentUser.auxiliaryData && (
          <AuxiliaryView
            auxiliary={currentUser.auxiliaryData}
            surveys={surveys}
            responses={responses}
            platformSettings={platformSettings}
            onAddResponse={handleAddResponse}
            onExit={handleLogout}
          />
        )}

        {/* 4. Participant Role (entered any other text/name) */}
        {currentUser && currentUser.role === 'participant' && (
          <>
            {primaryActiveSurvey ? (
              <ParticipantSurveyView
                survey={primaryActiveSurvey}
                participantName={currentUser.name}
                platformSettings={platformSettings}
                onSubmit={(answers) => {
                  handleAddResponse(primaryActiveSurvey.id, currentUser.name, answers, 'direct');
                }}
                onExit={handleLogout}
              />
            ) : (
              <div className="max-w-xl mx-auto px-4 py-16 text-center">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <ClipboardX className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    No hay ninguna encuesta activa en este momento
                  </h2>
                  <p className="text-sm text-slate-500 mb-6">
                    Hola, <strong>{currentUser.name}</strong>. Actualmente las encuestas se encuentran en pausa o mantenimiento. Por favor intente más tarde.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    Volver a la pantalla de inicio
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
