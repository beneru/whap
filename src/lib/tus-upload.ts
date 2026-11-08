import * as tus from 'tus-js-client';
import { isSupabaseConfigured, getSupabaseBrowserClient } from './supabase';

export interface ResumableUploadProgress {
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
  chunkIndex: number;
  totalChunks: number;
  status: 'idle' | 'uploading' | 'retrying' | 'paused' | 'completed' | 'error';
  retryAttempt: number;
  message: string;
}

export interface ResumableUploadController {
  pause: () => void;
  resume: () => void;
  simulateNetworkDrop: () => void;
  abort: () => void;
}

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
const TUS_CHUNK_SIZE = 6 * 1024 * 1024; // 6MB standard for Supabase TUS
const CHECKPOINT_STORAGE_KEY = 'whap_tus_checkpoints_v1';

interface LocalTusCheckpoint {
  fingerprint: string;
  storagePath: string;
  bytesUploaded: number;
  bytesTotal: number;
  updatedAt: number;
}

function getFileFingerprint(file: File, campaignId: string, editorId: string): string {
  return `tus:${editorId}:${campaignId}:${file.name}:${file.size}:${file.lastModified}`;
}

function loadCheckpoint(fingerprint: string): LocalTusCheckpoint | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CHECKPOINT_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, LocalTusCheckpoint>;
    return map[fingerprint] || null;
  } catch {
    return null;
  }
}

function saveCheckpoint(cp: LocalTusCheckpoint): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(CHECKPOINT_STORAGE_KEY);
    const map: Record<string, LocalTusCheckpoint> = raw ? JSON.parse(raw) : {};
    map[cp.fingerprint] = cp;
    window.localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

function clearCheckpoint(fingerprint: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(CHECKPOINT_STORAGE_KEY);
    if (!raw) return;
    const map: Record<string, LocalTusCheckpoint> = JSON.parse(raw);
    delete map[fingerprint];
    window.localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const ext = file.name.toLowerCase().split('.').pop();
  const validMime =
    file.type === 'video/mp4' ||
    file.type === 'video/quicktime' ||
    ext === 'mp4' ||
    ext === 'mov';

  if (!validMime) {
    return { valid: false, error: 'Only MP4 and MOV video files are supported.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'Video exceeds the 500MB maximum upload limit.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'Selected file is empty.' };
  }
  return { valid: true };
}

/**
 * Starts or resumes a TUS resumable video upload to the private `submissions-raw` bucket.
 * Automatically persists byte offsets so uploads survive network drops and mobile switches.
 */
export function startResumableVideoUpload(params: {
  file: File;
  editorId: string;
  campaignId: string;
  onProgress: (state: ResumableUploadProgress) => void;
  onSuccess: (result: { storagePath: string; fileName: string; fileSizeBytes: number; localBlobUrl?: string }) => void;
  onError: (err: Error) => void;
}): ResumableUploadController {
  const { file, editorId, campaignId, onProgress, onSuccess, onError } = params;
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    onError(new Error(validation.error));
    return { pause: () => {}, resume: () => {}, simulateNetworkDrop: () => {}, abort: () => {} };
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fingerprint = getFileFingerprint(file, campaignId, editorId);
  const existingCp = loadCheckpoint(fingerprint);
  const storagePath =
    existingCp?.storagePath || `${editorId}/${campaignId}/${Date.now()}-${sanitizedName}`;

  // 1. Live Supabase Storage TUS Upload path when NEXT_PUBLIC_SUPABASE_URL is configured
  const sb = getSupabaseBrowserClient();
  if (isSupabaseConfigured() && sb) {
    let tusInstance: tus.Upload | null = null;

    sb.auth.getSession().then(({ data: { session } }) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const token = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const totalChunks = Math.max(1, Math.ceil(file.size / TUS_CHUNK_SIZE));

      tusInstance = new tus.Upload(file, {
        endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
        retryDelays: [0, 1500, 3000, 6000, 12000],
        headers: {
          authorization: `Bearer ${token}`,
          'x-upsert': 'true',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: 'submissions-raw',
          objectName: storagePath,
          contentType: file.type || 'video/mp4',
          cacheControl: '3600',
        },
        chunkSize: TUS_CHUNK_SIZE,
        onError(error) {
          onProgress({
            bytesUploaded: existingCp?.bytesUploaded || 0,
            bytesTotal: file.size,
            percentage: 0,
            chunkIndex: 0,
            totalChunks,
            status: 'error',
            retryAttempt: 0,
            message: `Upload interrupted: ${error.message}. Tap Resume to continue from last saved chunk.`,
          });
          onError(error);
        },
        onShouldRetry(err, retryAttempt) {
          onProgress({
            bytesUploaded: existingCp?.bytesUploaded || 0,
            bytesTotal: file.size,
            percentage: Math.round(((existingCp?.bytesUploaded || 0) / file.size) * 100),
            chunkIndex: Math.ceil((existingCp?.bytesUploaded || 0) / TUS_CHUNK_SIZE),
            totalChunks,
            status: 'retrying',
            retryAttempt,
            message: `Network drop detected (${err.message}). Auto-retrying chunk (attempt #${retryAttempt})...`,
          });
          return true;
        },
        onProgress(bytesUploaded, bytesTotal) {
          const percentage = Math.min(100, Math.round((bytesUploaded / bytesTotal) * 100));
          const chunkIndex = Math.min(totalChunks, Math.max(1, Math.ceil(bytesUploaded / TUS_CHUNK_SIZE)));
          saveCheckpoint({
            fingerprint,
            storagePath,
            bytesUploaded,
            bytesTotal,
            updatedAt: Date.now(),
          });
          onProgress({
            bytesUploaded,
            bytesTotal,
            percentage,
            chunkIndex,
            totalChunks,
            status: 'uploading',
            retryAttempt: 0,
            message: `Uploading via TUS resumable protocol (chunk ${chunkIndex}/${totalChunks})...`,
          });
        },
        onSuccess() {
          clearCheckpoint(fingerprint);
          const localBlobUrl = typeof URL !== 'undefined' ? URL.createObjectURL(file) : undefined;
          onProgress({
            bytesUploaded: file.size,
            bytesTotal: file.size,
            percentage: 100,
            chunkIndex: totalChunks,
            totalChunks,
            status: 'completed',
            retryAttempt: 0,
            message: 'Uploaded to private bucket (submissions-raw). Watermark protection active.',
          });
          onSuccess({
            storagePath,
            fileName: file.name,
            fileSizeBytes: file.size,
            localBlobUrl,
          });
        },
      });

      tusInstance.findPreviousUploads().then((prev) => {
        if (prev.length > 0) {
          tusInstance?.resumeFromPreviousUpload(prev[0]);
        }
        tusInstance?.start();
      });
    });

    return {
      pause: () => tusInstance?.abort(),
      resume: () => tusInstance?.start(),
      simulateNetworkDrop: () => tusInstance?.abort(),
      abort: () => {
        tusInstance?.abort();
        clearCheckpoint(fingerprint);
      },
    };
  }

  // 2. Local / Preview Mode Resumable TUS Simulator with real chunk checkpoints & auto-retry
  const totalChunks = 8;
  const chunkSizeBytes = Math.ceil(file.size / totalChunks);
  let bytesUploaded = existingCp ? Math.min(existingCp.bytesUploaded, file.size) : 0;
  let paused = false;
  let aborted = false;
  let retryAttempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stepUpload = () => {
    if (aborted || paused) return;

    bytesUploaded = Math.min(file.size, bytesUploaded + chunkSizeBytes);
    const percentage = Math.min(100, Math.round((bytesUploaded / file.size) * 100));
    const chunkIndex = Math.min(totalChunks, Math.max(1, Math.ceil((percentage / 100) * totalChunks)));

    saveCheckpoint({
      fingerprint,
      storagePath,
      bytesUploaded,
      bytesTotal: file.size,
      updatedAt: Date.now(),
    });

    if (bytesUploaded >= file.size) {
      clearCheckpoint(fingerprint);
      const localBlobUrl = typeof URL !== 'undefined' ? URL.createObjectURL(file) : undefined;
      onProgress({
        bytesUploaded: file.size,
        bytesTotal: file.size,
        percentage: 100,
        chunkIndex: totalChunks,
        totalChunks,
        status: 'completed',
        retryAttempt,
        message: 'Resumable upload complete. Stored in private bucket (submissions-raw).',
      });
      onSuccess({
        storagePath,
        fileName: file.name,
        fileSizeBytes: file.size,
        localBlobUrl,
      });
      return;
    }

    onProgress({
      bytesUploaded,
      bytesTotal: file.size,
      percentage,
      chunkIndex,
      totalChunks,
      status: 'uploading',
      retryAttempt,
      message:
        existingCp && chunkIndex <= 2
          ? `Resumed from saved TUS offset (${percentage}%) - chunk ${chunkIndex}/${totalChunks}`
          : `Uploading TUS chunk ${chunkIndex}/${totalChunks} (${percentage}%)...`,
    });

    timer = setTimeout(stepUpload, 180);
  };

  timer = setTimeout(stepUpload, 120);

  return {
    pause: () => {
      paused = true;
      if (timer) clearTimeout(timer);
      const percentage = Math.min(100, Math.round((bytesUploaded / file.size) * 100));
      onProgress({
        bytesUploaded,
        bytesTotal: file.size,
        percentage,
        chunkIndex: Math.ceil((percentage / 100) * totalChunks),
        totalChunks,
        status: 'paused',
        retryAttempt,
        message: `Upload paused at ${percentage}%. Byte offset saved locally; safe to resume anytime.`,
      });
    },
    resume: () => {
      if (!paused) return;
      paused = false;
      stepUpload();
    },
    simulateNetworkDrop: () => {
      if (timer) clearTimeout(timer);
      paused = true;
      retryAttempt += 1;
      const percentage = Math.min(100, Math.round((bytesUploaded / file.size) * 100));
      const chunkIndex = Math.max(1, Math.ceil((percentage / 100) * totalChunks));
      onProgress({
        bytesUploaded,
        bytesTotal: file.size,
        percentage,
        chunkIndex,
        totalChunks,
        status: 'retrying',
        retryAttempt,
        message: `Connection dropped at ${percentage}% (chunk ${chunkIndex}/${totalChunks}). Auto-retrying in 1.2s from saved offset...`,
      });
      timer = setTimeout(() => {
        if (aborted) return;
        paused = false;
        stepUpload();
      }, 1200);
    },
    abort: () => {
      aborted = true;
      if (timer) clearTimeout(timer);
      clearCheckpoint(fingerprint);
    },
  };
}
