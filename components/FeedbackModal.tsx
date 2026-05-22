import React, { useState, useRef, useEffect } from 'react';
import type { UiText, FeedbackData, SurveyData } from '../types';
import { submitFeedback, submitSurvey } from '../services/firebaseService';
import StarIcon from './icons/StarIcon';
import CheckIcon from './icons/CheckIcon';

interface FeedbackModalProps {
  uiText: UiText;
  onClose: () => void;
}

// List of common disposable/fake email domains to block
const DISPOSABLE_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com',
  'mailinator.com', 'yopmail.com', 'getairmail.com', 'throwawaymail.com',
  'temp-mail.org', 'fake-email.com', 'dispostable.com', 'maildrop.cc',
  'bccto.me', 'mailpoof.com', 'protonmail.com', 'tutanota.com',
  'dayrep.com', 'teleworm.us', 'jourrapide.com', 'rhyta.com', 'superrito.com',
  'armyspy.com', 'cuvox.de', 'einrot.com', 'fleckens.hu', 'gustr.com',
  'weber.edu', 'spam4.me', 'emailfake.com'
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({ uiText, onClose }) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'survey'>('feedback');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [successType, setSuccessType] = useState<'feedback' | 'survey'>('feedback');

  // Shared fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Feedback fields
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  // Survey fields
  const [surveyStep, setSurveyStep] = useState<number>(1);
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [cookingFrequency, setCookingFrequency] = useState('');
  const [cookingChallenge, setCookingChallenge] = useState('');
  const [foodWaste, setFoodWaste] = useState('');
  const [recipeAccuracy, setRecipeAccuracy] = useState<number>(0);
  const [stepClarity, setStepClarity] = useState<number>(0);
  const [halalImportance, setHalalImportance] = useState<number>(0);
  const [voiceSearchUtility, setVoiceSearchUtility] = useState('');
  const [timeSaved, setTimeSaved] = useState('');
  const [pmfFeeling, setPmfFeeling] = useState('');
  const [desiredFeatures, setDesiredFeatures] = useState<string[]>([]);
  const [willingToPay, setWillingToPay] = useState('');
  
  // Anti-Spam: Honeypot field (hidden from users, bots will fill it)
  const [honeyPot, setHoneyPot] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now()); // Track when modal opened

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const validateEmail = (email: string): string | null => {
    if (!email) return null; // Email is optional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Sila masukkan format emel yang sah.";
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
      return "Maaf, emel sementara (disposable email) tidak dibenarkan.";
    }

    return null;
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Honeypot check
    if (honeyPot) {
      setStep('success'); 
      setSuccessType('feedback');
      return;
    }

    const timeElapsed = Date.now() - startTimeRef.current;
    if (timeElapsed < 2000) return; 

    if (rating === 0) {
      setError('Sila berikan penilaian bintang.');
      return;
    }

    if (email) {
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    setIsSubmitting(true);

    const feedbackData: FeedbackData = {
      rating,
      name: name.trim(),
      email: email.trim(),
      comment: comment.trim()
    };

    try {
      await submitFeedback(feedbackData);
      setSuccessType('feedback');
      setStep('success');
      localStorage.setItem('toma_last_feedback', Date.now().toString());
    } catch (err) {
      console.error(err);
      setError("Gagal menghantar maklum balas. Sila cuba sebentar lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation for final step
    if (!timeSaved || !pmfFeeling || !willingToPay) {
      setError('Sila jawab semua soalan wajib sebelum menghantar.');
      return;
    }

    if (email) {
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    setIsSubmitting(true);

    const surveyData: SurveyData = {
      gender,
      occupation,
      cookingFrequency,
      cookingChallenge,
      foodWaste,
      recipeAccuracy,
      stepClarity,
      halalImportance,
      voiceSearchUtility,
      timeSaved,
      pmfFeeling,
      desiredFeatures,
      willingToPay,
      name: name.trim(),
      email: email.trim()
    };

    try {
      await submitSurvey(surveyData);
      setSuccessType('survey');
      setStep('success');
      localStorage.setItem('toma_last_survey', Date.now().toString());
    } catch (err) {
      console.error(err);
      setError("Gagal menghantar survey. Sila cuba sebentar lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateSurveyStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!gender || !occupation || !cookingFrequency || !cookingChallenge || !foodWaste) {
        setError('Sila jawab semua soalan pada Bahagian 1.');
        return false;
      }
    } else if (currentStep === 2) {
      if (recipeAccuracy === 0 || stepClarity === 0 || halalImportance === 0 || !voiceSearchUtility) {
        setError('Sila jawab semua soalan pada Bahagian 2.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateSurveyStep(surveyStep)) {
      setSurveyStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setSurveyStep(prev => prev - 1);
  };

  const toggleFeature = (feature: string) => {
    setDesiredFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp" style={{ animationDuration: '0.2s' }}>
      <div 
        ref={modalRef} 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh]"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'form' ? (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100 mb-6 mt-2">
              <button
                type="button"
                onClick={() => { setActiveTab('feedback'); setError(null); }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'feedback'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Maklum Balas Am
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('survey'); setError(null); }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'survey'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Jawab Survey Produk
              </button>
            </div>

            {/* HONEYPOT FIELD (Hidden) - Bot trap */}
            <input 
              type="text" 
              name="website_url_hp" 
              value={honeyPot}
              onChange={(e) => setHoneyPot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0 }}
              tabIndex={-1}
              autoComplete="off"
            />

            {activeTab === 'feedback' ? (
              /* --- FEEDBACK FORM --- */
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-emerald-800">{uiText.feedbackTitle}</h3>
                  <p className="text-sm text-gray-500 mt-1">{uiText.feedbackSubtitle}</p>
                </div>

                {/* Star Rating */}
                <div className="flex flex-col items-center justify-center mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{uiText.labelRating}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <StarIcon 
                          className={`w-10 h-10 transition-colors duration-200 ${
                            star <= (hoverRating || rating) 
                              ? 'text-amber-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{uiText.labelName}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={uiText.placeholderName}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{uiText.labelEmail}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={uiText.placeholderEmail}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 text-gray-800"
                  />
                  <p className="text-xs text-gray-400 mt-1 italic font-light">Kami tidak akan berkongsi emel anda.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{uiText.labelComment}</label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={uiText.placeholderComment}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 resize-none text-gray-800"
                  />
                </div>

                {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded animate-fadeInUp">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-70 disabled:cursor-wait mt-4 shadow-lg shadow-emerald-200"
                >
                  {isSubmitting ? uiText.submittingFeedback : uiText.submitFeedbackButton}
                </button>
              </form>
            ) : (
              /* --- MULTI-STEP SURVEY --- */
              <div className="space-y-6">
                {/* Header & Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-emerald-800">Kajian Penyelidikan Produk</h3>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Bahagian {surveyStep} dari 3</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${(surveyStep / 3) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Step 1: Cooking Habits */}
                {surveyStep === 1 && (
                  <div className="space-y-5 animate-fadeInUp" style={{ animationDuration: '0.2s' }}>
                    {/* Gender Q */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">1. Jantina *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Lelaki", "Perempuan"].map((option) => (
                          <button
                            key={option}
                            type="button; button"
                            onClick={() => setGender(option)}
                            className={`px-4 py-2.5 text-center text-sm rounded-lg border transition-all ${
                              gender === option 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Occupation Q */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">2. Kategori Pekerjaan / Status *</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          "Pelajar",
                          "Bekerja (Sektor Swasta / Awam)",
                          "Bekerja Sendiri / Usahawan",
                          "Suri Rumah",
                          "Tidak Bekerja / Lain-lain"
                        ].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setOccupation(option)}
                            className={`px-4 py-2.5 text-left text-sm rounded-lg border transition-all ${
                              occupation === option 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q3 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">3. Berapa kerap anda memasak di rumah dalam seminggu? *</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {["Setiap hari", "3-4 kali seminggu", "Jarang-jarang", "Hanya hujung minggu"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setCookingFrequency(option)}
                            className={`px-4 py-2.5 text-left text-sm rounded-lg border transition-all ${
                              cookingFrequency === option 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q4 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">4. Apakah cabaran terbesar anda setiap kali ingin menyediakan hidangan? *</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          "Tiada idea (masak apa hari ni)",
                          "Bahan dapur terhad",
                          "Kekangan masa",
                          "Tak pandai padankan bahan",
                          "Bimbang status Halal resipi"
                        ].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setCookingChallenge(option)}
                            className={`px-4 py-2.5 text-left text-sm rounded-lg border transition-all ${
                              cookingChallenge === option 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q5 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">5. Pernahkah anda terpaksa membuang bahan mentah di dapur kerana rosak akibat tidak tahu mahu masak apa dengannya? *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Ya, kerap berlaku", "Kadang-kadang", "Tidak pernah"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setFoodWaste(option)}
                            className={`px-3 py-2.5 text-center text-xs rounded-lg border transition-all ${
                              foodWaste === option 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Toma Experience */}
                {surveyStep === 2 && (
                  <div className="space-y-5 animate-fadeInUp" style={{ animationDuration: '0.2s' }}>
                    {/* Q6 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">6. Seberapa tepat resipi yang dijana oleh Toma berdasarkan bahan yang anda masukkan? *</label>
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 font-light">Tidak Tepat</span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRecipeAccuracy(num)}
                              className={`w-9 h-9 rounded-full border transition-all font-semibold flex items-center justify-center text-sm ${
                                recipeAccuracy === num
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 font-light">Sangat Tepat</span>
                      </div>
                    </div>

                    {/* Q7 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">7. Adakah langkah memasak yang diberikan Toma mudah diikuti dan praktikal untuk dapur rumah Malaysia? *</label>
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 font-light">Sukar</span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setStepClarity(num)}
                              className={`w-9 h-9 rounded-full border transition-all font-semibold flex items-center justify-center text-sm ${
                                stepClarity === num
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 font-light">Mudah</span>
                      </div>
                    </div>

                    {/* Q8 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">8. Seberapa penting bagi anda fungsi tapisan Halal dan sensitiviti tempatan (tiada bahan syubhah) dalam Toma? *</label>
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 font-light">Kurang Penting</span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setHalalImportance(num)}
                              className={`w-9 h-9 rounded-full border transition-all font-semibold flex items-center justify-center text-sm ${
                                halalImportance === num
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 font-light">Sangat Penting</span>
                      </div>
                    </div>

                    {/* Q9 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">9. Bagaimanakah fungsi carian suara (voice search) membantu anda semasa memasukkan bahan? *</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          "Sangat membantu (mudah cakap sahaja)",
                          "Biasa sahaja",
                          "Lebih selesa menaip secara manual"
                        ].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setVoiceSearchUtility(option)}
                            className={`px-4 py-2.5 text-left text-sm rounded-lg border transition-all ${
                              voiceSearchUtility === option 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Impact & Future */}
                {surveyStep === 3 && (
                  <div className="space-y-5 animate-fadeInUp" style={{ animationDuration: '0.2s' }}>
                    {/* Q10 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">10. Adakah Toma berjaya mengurangkan masa yang anda luangkan untuk berfikir tentang menu makanan? *</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          "Ya, menjimatkan masa",
                          "Sedikit sebanyak membantu",
                          "Tidak memberi kesan"
                        ].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setTimeSaved(option)}
                            className={`px-3 py-2.5 text-center text-xs rounded-lg border transition-all ${
                              timeSaved === option 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q11 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">11. Bagaimana perasaan anda jika esok Toma tidak lagi boleh digunakan? *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Sangat kecewa", "Sedikit kecewa", "Tidak kisah"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setPmfFeeling(option)}
                            className={`px-3 py-2.5 text-center text-xs rounded-lg border transition-all ${
                              pmfFeeling === option 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q12 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">12. Apakah fungsi tambahan yang paling anda harapkan ada dalam Toma selepas ini? (Pilih semua yang berkenaan)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          "Anggaran kos/harga bahan",
                          "Senarai beli-belah (grocery list)",
                          "Menu diet khas (Keto, sihat, dll)",
                          "Cadangan resipi chef terkenal"
                        ].map((option) => {
                          const isSelected = desiredFeatures.includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleFeature(option)}
                              className={`px-4 py-2.5 text-left text-sm rounded-lg border transition-all flex items-center justify-between ${
                                isSelected 
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span>{option}</span>
                              {isSelected && <CheckIcon className="w-4 h-4 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Q13 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">13. Adakah anda sanggup membayar sedikit caj bulanan jika Toma menawarkan resipi premium tanpa had dan fungsi perancang hidangan mingguan? *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Ya, pasti", "Mungkin ya", "Tidak, mahu percuma"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setWillingToPay(option)}
                            className={`px-2 py-2.5 text-center text-xs rounded-lg border transition-all ${
                              willingToPay === option 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium' 
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shared Contact Info (Optional) */}
                    <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                      <p className="text-xs text-gray-500 font-medium">Bantu kami hubungi anda jika kami melancarkan ciri premium (Pilihan):</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nama anda"
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-800"
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Emel anda"
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded animate-fadeInUp">{error}</p>}

                {/* Survey Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  {surveyStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-3 px-6 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors focus:outline-none"
                    >
                      Kembali
                    </button>
                  )}
                  {surveyStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-lg shadow-emerald-100"
                    >
                      Seterusnya
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSurveySubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-70 disabled:cursor-wait shadow-lg shadow-emerald-100"
                    >
                      {isSubmitting ? "Sedang Menghantar..." : "Hantar Survey"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* --- SUCCESS STATE --- */
          <div className="text-center py-10 animate-fadeInUp">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckIcon className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {successType === 'feedback' ? uiText.feedbackSuccessTitle : "Terima Kasih!"}
            </h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              {successType === 'feedback' 
                ? uiText.feedbackSuccessMessage 
                : "Maklum balas survey anda amat berharga bagi membantu kami memacu hala tuju produk Toma!"}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-md"
            >
              {uiText.closeButton}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;