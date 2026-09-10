import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { getClientIp, checkRateLimit } from './lib/rateLimit';

const DISPOSABLE_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com',
  'mailinator.com', 'yopmail.com', 'getairmail.com', 'throwawaymail.com',
  'temp-mail.org', 'fake-email.com', 'dispostable.com', 'maildrop.cc',
  'bccto.me', 'mailpoof.com', 'protonmail.com', 'tutanota.com',
  'dayrep.com', 'teleworm.us', 'jourrapide.com', 'rhyta.com', 'superrito.com',
  'armyspy.com', 'cuvox.de', 'einrot.com', 'fleckens.hu', 'gustr.com',
  'weber.edu', 'spam4.me', 'emailfake.com'
];

function sanitizeString(str: any, maxLength = 300): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, 'survey', 5, 5 * 60 * 1000); // 5 submissions per 5 mins
  if (rateCheck.limited) {
    res.setHeader?.('Retry-After', String(rateCheck.resetInSec));
    return res.status(429).json({
      error: `Sila tunggu ${rateCheck.resetInSec} saat sebelum menghantar kaji selidik baharu.`
    });
  }

  try {
    const data = req.body || {};

    const cleanEmail = sanitizeString(data.email, 100).toLowerCase();
    if (cleanEmail) {
      const emailDomain = cleanEmail.split('@')[1];
      if (emailDomain && DISPOSABLE_DOMAINS.includes(emailDomain)) {
        return res.status(400).json({ error: 'Sila gunakan alamat emel peribadi atau kerja yang sah.' });
      }
    }

    const cleanUserId = sanitizeString(data.userId, 100) || 'anonymous';
    const cleanDesiredFeatures = Array.isArray(data.desiredFeatures) 
      ? data.desiredFeatures.map((f: any) => sanitizeString(f, 100)).filter(Boolean)
      : [];

    await addDoc(collection(db, 'toma_surveys'), {
      user_id: cleanUserId,
      gender: sanitizeString(data.gender, 50),
      occupation: sanitizeString(data.occupation, 50),
      cooking_frequency: sanitizeString(data.cookingFrequency, 100),
      cooking_challenge: sanitizeString(data.cookingChallenge, 100),
      food_waste: sanitizeString(data.foodWaste, 100),
      recipe_accuracy: Number(data.recipeAccuracy) || 0,
      step_clarity: Number(data.stepClarity) || 0,
      halal_importance: Number(data.halalImportance) || 0,
      voice_search_utility: sanitizeString(data.voiceSearchUtility, 100),
      time_saved: sanitizeString(data.timeSaved, 100),
      pmf_feeling: sanitizeString(data.pmfFeeling, 100),
      desired_features: cleanDesiredFeatures,
      willing_to_pay: sanitizeString(data.willingToPay, 100),
      name: sanitizeString(data.name, 100),
      email: cleanEmail,
      created_at: serverTimestamp(),
      ip_address: clientIp
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Survey submit error:', error);
    return res.status(500).json({ error: 'Gagal menghantar kaji selidik. Sila cuba lagi.' });
  }
}
