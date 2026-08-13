/**
 * Supabase Integrations Layer
 * Integration service layer for AI, file uploads, and data extraction
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
 * @returns {Promise<any>} - LLM response
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
 * @returns {Promise<any>} - { file_url }
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
 * @returns {Promise<any>} - Extracted data
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
// ─── SendSMS ─────────────────────────────────────────────────
// ─── GenerateImage ───────────────────────────────────────────
// ─── Core namespace (for backward compatibility) ─────────────
