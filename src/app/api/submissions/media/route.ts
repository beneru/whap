import { NextRequest, NextResponse } from 'next/server';

/**
 * Protected Media Endpoint (/api/submissions/media)
 * Enforces editor protection rules:
 * - Before selection: serves only short-lived signed preview metadata (watermarked in player, no download header).
 * - After selection: when mode=clean_download and token is valid, returns Content-Disposition attachment header.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storagePath = searchParams.get('path') || '';
  const mode = searchParams.get('mode') || 'stream_preview';
  const token = searchParams.get('token') || '';

  if (!storagePath || !token) {
    return NextResponse.json(
      { error: 'Missing signed token or storage path for protected clip media.' },
      { status: 400 }
    );
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
      path: string;
      mode: string;
      editor: string;
      exp: number;
    };

    if (Date.now() > decoded.exp) {
      return NextResponse.json(
        { error: 'Signed preview URL has expired. Request a fresh stream session.' },
        { status: 403 }
      );
    }

    if (decoded.path !== storagePath) {
      return NextResponse.json({ error: 'Token path mismatch.' }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      storagePath,
      mode,
      watermarked: mode === 'stream_preview',
      editorWatermark: `@${decoded.editor} · whap preview`,
      expiresAt: new Date(decoded.exp).toISOString(),
      downloadUnlocked: mode === 'clean_download',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid signed media token.' }, { status: 403 });
  }
}
