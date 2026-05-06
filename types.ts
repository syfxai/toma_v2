
export type LanguageCode = string;

export interface Language {
  code: LanguageCode;
  name: string;
}

export interface Recipe {
  recipeName: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
}

export interface RecipeSearchResult {
  title: string;
  description: string;
}

export interface RecipeList {
  results: RecipeSearchResult[];
}

export type GenAIResponse = Recipe | RecipeList;

export interface ShortenedRecipe {
  n: string;
  d: string;
  pt: string;
  ct: string;
  tt: string;
  s: string;
  i: string[];
  x: string[];
}

export interface FeedbackData {
  rating: number;
  name: string;
  email: string;
  comment: string;
}

export interface FeedbackItem extends FeedbackData {
  id: number;
  created_at: string;
  user_id?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UiText {
  headerTitle: string;
  headerSubtitle: string;
  inputLabel: string;
  inputPlaceholder: string;
  generateButton: string;
  generateButtonLoading: string;
  searchButton: string;
  searchButtonLoading: string;
  resetButton: string;
  recipeIngredients: string;
  recipeInstructions: string;
  recipePrepTime: string;
  recipeCookTime: string;
  recipeTotalTime: string;
  recipeServings: string;
  exportTitle: string;
  saveAsText: string;
  saveAsImage: string;
  saveAsPdf: string;
  saveAsImageSaving: string;
  saveAsPdfSaving: string;
  errorPrefix: string;
  errorIngredients: string;
  loadingMessages: string[];
  translatingMessage: string;
  tagline: string;
  usageTips: string[];
  feedbackButton: string;
  feedbackSubject: string;
  shareTitle: string;
  shareInstructions: string;
  copyLinkButton: string;
  linkCopiedButton: string;
  generationCounterText: string;
  generationCounterTextSingle: string;
  
  // Search Results
  searchResultsTitle: string;
  searchResultsSubtitle: string;
  backToResults: string;

  // History
  historyTitle: string;
  clearHistory: string;
  historyStorageNote: string;

  // Cooldown
  cooldownMessage: string;

  // PWA
  installButton: string;
  installMessage: string;
  
  // Feedback Form
  feedbackTitle: string;
  feedbackSubtitle: string;
  labelName: string;
  labelEmail: string;
  labelRating: string;
  labelComment: string;
  placeholderName: string;
  placeholderEmail: string;
  placeholderComment: string;
  submitFeedbackButton: string;
  submittingFeedback: string;
  feedbackSuccessTitle: string;
  feedbackSuccessMessage: string;
  closeButton: string;
}

export type ExportImageLayout = 'mobile' | 'desktop';