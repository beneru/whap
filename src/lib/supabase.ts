import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url.startsWith('https://') &&
      !url.includes('your-project-ref.supabase.co') &&
      key !== 'your-anon-key'
  );
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export function getSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || url.includes('your-project-ref')) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Generates either a short-lived signed preview URL (300s expiry, watermarked player only)
 * or a clean download URL (unlocked only when submission status is selected, posted, or paid).
 */
export async function createProtectedSubmissionUrl(params: {
  storagePath: string;
  mode: 'stream_preview' | 'clean_download';
  submissionStatus: string;
  editorUsername: string;
}): Promise<{
  url: string;
  expiresInSeconds: number;
  watermarked: boolean;
  downloadAllowed: boolean;
}> {
  const isCleanUnlocked = ['selected', 'posted', 'paid'].includes(params.submissionStatus);

  if (params.mode === 'clean_download' && !isCleanUnlocked) {
    throw new Error(
      'Clean file download is locked until the Account Holder selects this clip and locks the editor rate.'
    );
  }

  const expiresInSeconds = params.mode === 'stream_preview' ? 300 : 3600;
  const sb = getSupabaseServiceClient() || getSupabaseBrowserClient();

  if (sb) {
    const { data, error } = await sb.storage
      .from('submissions-raw')
      .createSignedUrl(params.storagePath, expiresInSeconds, {
        download: params.mode === 'clean_download',
      });
    if (!error && data?.signedUrl) {
      return {
        url: data.signedUrl,
        expiresInSeconds,
        watermarked: params.mode === 'stream_preview',
        downloadAllowed: params.mode === 'clean_download' && isCleanUnlocked,
      };
    }
  }

  // Fallback signed token URL for local/preview mode
  const token = Buffer.from(
    JSON.stringify({
      path: params.storagePath,
      mode: params.mode,
      editor: params.editorUsername,
      exp: Date.now() + expiresInSeconds * 1000,
    })
  ).toString('base64url');

  return {
    url: `/api/submissions/media?path=${encodeURIComponent(params.storagePath)}&mode=${params.mode}&token=${token}`,
    expiresInSeconds,
    watermarked: params.mode === 'stream_preview',
    downloadAllowed: params.mode === 'clean_download' && isCleanUnlocked,
  };
}
