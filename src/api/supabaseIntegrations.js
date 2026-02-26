/**
 * Supabase Integrations Layer
 * Drop-in replacement for base44.integrations.Core.* calls
 * 
 * These call Vercel serverless API routes (created in Phase 6)
 * which securely hold API keys on the server side.
 */

import { supabase } from '@/lib/supabaseClient';

// ─── Helper: Get auth token for API calls ────────────────────
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

// ─── InvokeLLM ───────────────────────────────────────────────
/**
 * Call an LLM via the serverless API route
 * @param {Object} params - { prompt, system_prompt, model, response_format }
 * @returns {Object} - LLM response
 */
export async function InvokeLLM(params) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/invoke-llm', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'LLM invocation failed');
  }
  return response.json();
}

// ─── UploadFile ──────────────────────────────────────────────
/**
 * Upload a file to Supabase Storage
 * @param {Object} params - { file, bucket? }
 * @returns {Object} - { file_url }
 */
export async function UploadFile({ file, bucket = 'bill-uploads' }) {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL for public buckets, or signed URL for private
  if (['logos', 'articles', 'assets'].includes(bucket)) {
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    return { file_url: urlData.publicUrl };
  } else {
    // Private bucket — create a signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 3600);
    if (urlError) throw urlError;
    return { file_url: urlData.signedUrl };
  }
}

// ─── ExtractDataFromUploadedFile ─────────────────────────────
/**
 * Extract data from an uploaded file (e.g., electricity bill OCR)
 * Calls the serverless API route which uses an LLM for extraction
 * @param {Object} params - { file_url, extraction_prompt }
 * @returns {Object} - Extracted data
 */
export async function ExtractDataFromUploadedFile(params) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/extract-data', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Data extraction failed');
  }
  return response.json();
}

// ─── SendEmail ───────────────────────────────────────────────
/**
 * Send an email via the serverless API route
 * @param {Object} params - { to, subject, body }
 * @returns {Object} - Send result
 */
export async function SendEmail(params) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Email sending failed');
  }
  return response.json();
}

// ─── SendSMS ─────────────────────────────────────────────────
/**
 * Send an SMS via the serverless API route
 * @param {Object} params - { to, message }
 * @returns {Object} - Send result
 */
export async function SendSMS(params) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/send-sms', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'SMS sending failed');
  }
  return response.json();
}

// ─── GenerateImage ───────────────────────────────────────────
/**
 * Generate an image via the serverless API route
 * @param {Object} params - { prompt, size }
 * @returns {Object} - { image_url }
 */
export async function GenerateImage(params) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Image generation failed');
  }
  return response.json();
}

// ─── Core namespace (for backward compatibility) ─────────────
export const Core = {
  InvokeLLM,
  UploadFile,
  ExtractDataFromUploadedFile,
  SendEmail,
  SendSMS,
  GenerateImage,
};
