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

function sanitizeString(str: any, maxLength = 500): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, 'feedback', 5, 5 * 60 * 1000); // 5 submissions per 5 mins
  if (rateCheck.limited) {
    res.setHeader?.('Retry-After', String(rateCheck.resetInSec));
    return res.status(429).json({
      error: `Sila tunggu ${rateCheck.resetInSec} saat sebelum menghantar maklum balas baharu.`
    });
  }

  try {
    const { rating, name, email, comment, userId } = req.body || {};

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Sila berikan penilaian bintang antara 1 hingga 5.' });
    }

    const cleanEmail = sanitizeString(email, 100).toLowerCase();
    if (cleanEmail) {
      const emailDomain = cleanEmail.split('@')[1];
      if (emailDomain && DISPOSABLE_DOMAINS.includes(emailDomain)) {
        return res.status(400).json({ error: 'Sila gunakan alamat emel peribadi atau kerja yang sah.' });
      }
    }

    const cleanName = sanitizeString(name, 100);
    const cleanComment = sanitizeString(comment, 1000);
    const cleanUserId = sanitizeString(userId, 100) || 'anonymous';

    await addDoc(collection(db, 'toma_feedback'), {
      user_id: cleanUserId,
      rating: numericRating,
      name: cleanName,
      email: cleanEmail,
      comment: cleanComment,
      created_at: serverTimestamp(),
      ip_address: clientIp
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Feedback submit error:', error);
    return res.status(500).json({ error: 'Gagal menghantar maklum balas. Sila cuba lagi.' });
  }
}
