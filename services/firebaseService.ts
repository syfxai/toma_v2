
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  getCountFromServer,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import type { FeedbackData, FeedbackItem } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase for client side
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const getUserId = (): string => {
  let userId = localStorage.getItem('toma_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('toma_user_id', userId);
  }
  return userId;
};

export const recordGeneration = async (): Promise<void> => {
  try {
    const userId = getUserId();
    await addDoc(collection(db, 'toma_interactions'), {
      user_id: userId,
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error recording generation:', error);
  }
};

export const getGenerationCount = async (): Promise<number | null> => {
  try {
    const coll = collection(db, 'toma_interactions');
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error fetching generation count:', error);
    return null;
  }
};

export const submitFeedback = async (data: FeedbackData): Promise<void> => {
  try {
    const userId = getUserId();
    await addDoc(collection(db, 'toma_feedback'), {
      user_id: userId,
      rating: data.rating,
      name: data.name,
      email: data.email,
      comment: data.comment,
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Failed to submit feedback. Please try again.');
  }
};

export const getFeedbackList = async (): Promise<FeedbackItem[]> => {
  try {
    const q = query(collection(db, 'toma_feedback'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to ISO string for compatibility with FeedbackItem type
        created_at: data.created_at?.toDate()?.toISOString() || new Date().toISOString()
      } as unknown as FeedbackItem;
    });
  } catch (error) {
    console.error('Error fetching feedback list:', error);
    throw new Error('Failed to load feedback data.');
  }
};

export const getCachedRecipe = async (recipeId: string): Promise<any | null> => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'recipes', recipeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error checking recipe cache:", error);
    return null;
  }
};

export const saveRecipeToCache = async (recipeId: string, data: any, originalInput: string): Promise<void> => {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'recipes', recipeId), {
      ...data,
      cached_at: new Date().toISOString(),
      original_input: originalInput
    });
  } catch (error) {
    console.error("Error saving recipe to cache:", error);
  }
};

// Empty function to keep interface compatibility if needed
export const keepAlive = async (): Promise<void> => {};
