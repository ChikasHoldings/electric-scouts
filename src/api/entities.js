/**
 * Entity exports — now powered by Supabase
 * Maintains the same export names for backward compatibility
 */

export {
  ElectricityProvider,
  ElectricityPlan,
  Article,
  CustomBusinessQuote,
  ChatbotConversation,
  Profile,
} from './supabaseEntities';

// Auth is now handled by AuthContext / Supabase Auth directly
// The User export is kept for backward compatibility but points to null
export const User = null;

// Query is no longer needed
export const Query = null;
