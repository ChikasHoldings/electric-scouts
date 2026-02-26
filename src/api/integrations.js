/**
 * Integration exports — now powered by Supabase + Vercel API routes
 * Maintains the same export names for backward compatibility
 */

export {
  Core,
  InvokeLLM,
  UploadFile,
  ExtractDataFromUploadedFile,
  SendEmail,
  SendSMS,
  GenerateImage,
} from './supabaseIntegrations';
