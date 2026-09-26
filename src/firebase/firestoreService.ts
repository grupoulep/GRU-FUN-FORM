import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './config';
import { Survey, SurveyResponse, PlatformSettings } from '../types';
import { INITIAL_SURVEYS, INITIAL_RESPONSES } from '../data/initialData';
import { DEFAULT_PLATFORM_SETTINGS } from '../utils/storage';

const PATHS = {
  SURVEYS: 'surveys',
  RESPONSES: 'surveyResponses',
  SETTINGS: 'platformSettings',
  ADMINS: 'admins',
};

// 1. Surveys Realtime Subscription
export function subscribeToSurveys(
  onUpdate: (surveys: Survey[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, PATHS.SURVEYS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Survey[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as Survey), id: docSnap.id });
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('Firestore surveys subscription notice:', error.message);
      if (onError) onError(error);
    }
  );
}

export async function saveSurveyToFirestore(survey: Survey): Promise<void> {
  const path = `${PATHS.SURVEYS}/${survey.id}`;
  try {
    const docRef = doc(db, PATHS.SURVEYS, survey.id);
    await setDoc(docRef, survey, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSurveyFromFirestore(surveyId: string): Promise<void> {
  const path = `${PATHS.SURVEYS}/${surveyId}`;
  try {
    const docRef = doc(db, PATHS.SURVEYS, surveyId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 2. Survey Responses Realtime Subscription
export function subscribeToSurveyResponses(
  onUpdate: (responses: SurveyResponse[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, PATHS.RESPONSES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: SurveyResponse[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as SurveyResponse), id: docSnap.id });
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('Firestore surveyResponses subscription notice:', error.message);
      if (onError) onError(error);
    }
  );
}

export async function addSurveyResponseToFirestore(response: SurveyResponse): Promise<void> {
  const path = `${PATHS.RESPONSES}/${response.id}`;
  try {
    const docRef = doc(db, PATHS.RESPONSES, response.id);
    const cleanData: Record<string, any> = {
      surveyId: response.surveyId,
      participantName: response.participantName,
      submittedAt: response.submittedAt,
      answers: response.answers,
    };
    if (response.participantEmail) {
      cleanData.participantEmail = response.participantEmail;
    }
    if (response.registeredBy) {
      cleanData.registeredBy = response.registeredBy;
    }
    await setDoc(docRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSurveyResponseFromFirestore(responseId: string): Promise<void> {
  const path = `${PATHS.RESPONSES}/${responseId}`;
  try {
    const docRef = doc(db, PATHS.RESPONSES, responseId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 4. Platform Settings Realtime Subscription
export function subscribeToPlatformSettings(
  onUpdate: (settings: PlatformSettings) => void,
  onError?: (err: any) => void
): () => void {
  const docRef = doc(db, PATHS.SETTINGS, 'current');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as PlatformSettings);
      }
    },
    (error) => {
      console.warn('Firestore platform settings subscription notice:', error.message);
      if (onError) onError(error);
    }
  );
}

export async function savePlatformSettingsToFirestore(settings: PlatformSettings): Promise<void> {
  const path = `${PATHS.SETTINGS}/current`;
  try {
    const docRef = doc(db, PATHS.SETTINGS, 'current');
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 5. Seed initial data to Firestore if empty and user is authenticated admin
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    // Only attempt seed if admin is signed in
    if (!auth.currentUser) {
      return;
    }
    // Check if surveys collection is empty
    const surveysSnap = await getDocs(collection(db, PATHS.SURVEYS));
    if (surveysSnap.empty) {
      const batch = writeBatch(db);
      for (const survey of INITIAL_SURVEYS) {
        const sRef = doc(db, PATHS.SURVEYS, survey.id);
        batch.set(sRef, survey);
      }
      for (const resp of INITIAL_RESPONSES) {
        const rRef = doc(db, PATHS.RESPONSES, resp.id);
        batch.set(rRef, resp);
      }
      const settingsRef = doc(db, PATHS.SETTINGS, 'current');
      batch.set(settingsRef, {
        ...DEFAULT_PLATFORM_SETTINGS,
        updatedAt: new Date().toISOString(),
      });
      await batch.commit();
      console.log('Successfully seeded initial Firestore data');
    }
  } catch (error) {
    console.warn('Seed initial Firestore data check:', error);
  }
}
