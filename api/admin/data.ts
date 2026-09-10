import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Rate limiting in-memory for brute-force protection
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record) return true;
  if (now > record.resetAt) {
    failedAttempts.delete(ip);
    return true;
  }
  return record.count < 5;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record || now > record.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 mins
  } else {
    record.count += 1;
  }
}

function clearFailedAttempts(ip: string) {
  failedAttempts.delete(ip);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  if (!checkRateLimit(String(clientIp))) {
    return res.status(429).json({ 
      error: 'Terlalu banyak percubaan gagal. Sila cuba lagi selepas 15 minit.' 
    });
  }

  const { pin } = req.body || {};
  const expectedPin = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN || '2024';

  if (!pin || String(pin).trim() !== String(expectedPin).trim()) {
    recordFailedAttempt(String(clientIp));
    return res.status(401).json({ error: 'PIN Salah!' });
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(String(clientIp));

  try {
    const [feedbackSnap, surveySnap] = await Promise.all([
      getDocs(query(collection(db, 'toma_feedback'), orderBy('created_at', 'desc'))),
      getDocs(query(collection(db, 'toma_surveys'), orderBy('created_at', 'desc')))
    ]);

    const feedbackList = feedbackSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString?.() || data.created_at || new Date().toISOString()
      };
    });

    const surveyList = surveySnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        gender: data.gender || '',
        occupation: data.occupation || '',
        cookingFrequency: data.cooking_frequency || '',
        cookingChallenge: data.cooking_challenge || '',
        foodWaste: data.food_waste || '',
        recipeAccuracy: data.recipe_accuracy || 0,
        stepClarity: data.step_clarity || 0,
        halalImportance: data.halal_importance || 0,
        voiceSearchUtility: data.voice_search_utility || '',
        timeSaved: data.time_saved || '',
        pmfFeeling: data.pmf_feeling || '',
        desiredFeatures: data.desired_features || [],
        willingToPay: data.willing_to_pay || '',
        name: data.name || '',
        email: data.email || '',
        created_at: data.created_at?.toDate?.()?.toISOString?.() || data.created_at || new Date().toISOString(),
        user_id: data.user_id || ''
      };
    });

    return res.status(200).json({ feedbackList, surveyList });
  } catch (error: any) {
    console.error('Admin data fetch error:', error);
    return res.status(500).json({ 
      error: 'Gagal mengambil data dari pangkalan data. Sila pastikan sambungan Firebase aktif dan Rules telah ditetapkan.' 
    });
  }
}
