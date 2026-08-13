/**
 * Integration exports — Supabase storage plus the Vercel API routes.
 *
 * `SendEmail`, `SendSMS`, `GenerateImage` and the `Core` aggregate used to be
 * re-exported here. They posted to /api/send-email, /api/send-sms and
 * /api/generate-image, none of which exist, and nothing in the app imported
 * them — three functions whose only possible outcome was a 404. Outbound mail
 * goes through the server endpoints in api/_lib/email.js.
 */

export {
  InvokeLLM,
  UploadFile,
  ExtractDataFromUploadedFile,
} from './supabaseIntegrations';
