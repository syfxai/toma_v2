
import { createClient } from '@supabase/supabase-js';
import type { FeedbackData, FeedbackItem } from '../types';

const supabaseUrl = 'https://kwlsvdnzpndkwcqaejep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bHN2ZG56cG5ka3djcWFlamVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzQyNDgsImV4cCI6MjA3MjMxMDI0OH0.P2j0GOBYSRvuF-Og93o3ONGU5C2mPNmyTBMCGldUy-A';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { error } = await supabase
      .from('toma_interactions')
      .insert({ user_id: userId });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error recording generation:', error);
    // Fail silently so the user experience is not interrupted
  }
};

export const getGenerationCount = async (): Promise<number | null> => {
  try {
    const { count, error } = await supabase
      .from('toma_interactions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }
    
    return count;
  } catch (error) {
    console.error('Error fetching generation count:', error);
    return null;
  }
};

// Basic ping to keep the connection alive or wake up the DB
export const keepAlive = async (): Promise<void> => {
  try {
    // Making a lightweight HEAD request to check connectivity
    const { error } = await supabase
      .from('toma_interactions')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    // console.log('Supabase heartbeat sent 💓');
  } catch (error) {
    // Fail silently to prevent console spam for background connectivity checks
    // console.warn('Supabase heartbeat failed');
  }
};

export const submitFeedback = async (data: FeedbackData): Promise<void> => {
  try {
    const userId = getUserId();
    const { error } = await supabase
      .from('toma_feedback')
      .insert({
        user_id: userId,
        rating: data.rating,
        name: data.name,
        email: data.email,
        comment: data.comment
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Failed to submit feedback. Please try again.');
  }
};

export const getFeedbackList = async (): Promise<FeedbackItem[]> => {
  try {
    const { data, error } = await supabase
      .from('toma_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as FeedbackItem[];
  } catch (error) {
    console.error('Error fetching feedback list:', error);
    throw new Error('Failed to load feedback data.');
  }
};
