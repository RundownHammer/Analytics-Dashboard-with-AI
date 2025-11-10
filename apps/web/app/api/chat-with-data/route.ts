import { NextRequest, NextResponse } from 'next/server';

function resolveVannaBase(): { ok: true; base: string } | { ok: false; error: string } {
  const raw = (process.env.VANNA_SERVICE_URL || '').trim();
  if (!raw) return { ok: false, error: 'VANNA_SERVICE_URL env var not set' };
  try {
    const u = new URL(raw);
    // Block localhost/127.0.0.1 in production deployments
    const isLocal = ['localhost', '127.0.0.1'].includes(u.hostname);
    const inProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    if (isLocal && inProd) {
      return { ok: false, error: 'VANNA_SERVICE_URL points to localhost in production' };
    }
    const base = `${u.protocol}//${u.host}`.replace(/\/+$/, '');
    return { ok: true, base };
  } catch {
    return { ok: false, error: 'VANNA_SERVICE_URL is not a valid absolute URL' };
  }
}

/**
 * GET /api/chat-with-data
 * Server-side health proxy to avoid browser CORS when waking the Vanna service.
 */
export async function GET(_request: NextRequest) {
  try {
    const resolved = resolveVannaBase();
    if (!resolved.ok) {
      return NextResponse.json({ error: (resolved as any).error }, { status: 500 });
    }
    const base = (resolved as any).base; // already sanitized
    console.log('[chat-with-data][GET] base URL:', base);
    const res = await fetch(`${base}/health`, { method: 'GET' });
    const json = await res.json().catch(() => ({ status: 'unknown' }));
    return NextResponse.json(json, { status: res.ok ? 200 : 500 });
  } catch (error) {
    console.error('[chat-with-data][GET] health error:', error);
    return NextResponse.json(
      { error: 'Vanna health check failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat-with-data
 * Chat endpoint - forwards requests to Vanna AI service.
 * Note: The actual Vanna AI logic is in services/vanna/app.py (deployed on Render)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question } = body;
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Forward request to Vanna AI service (FastAPI on Render)
    const resolved = resolveVannaBase();
    if (!resolved.ok) {
      return NextResponse.json({ error: (resolved as any).error }, { status: 500 });
    }
    const base = (resolved as any).base;
    console.log('[chat-with-data][POST] forwarding question to', `${base}/query`);
    const response = await fetch(`${base}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Vanna service returned ${response.status}: ${text}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[chat-with-data][POST] Error forwarding to Vanna service:', error);
    const vannaUrl = process.env.VANNA_SERVICE_URL || '';
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        diagnostic: {
          vannaUrlPresent: Boolean(vannaUrl),
          vannaUrlLength: vannaUrl.length,
          message: (error as Error)?.message || 'unknown'
        }
      },
      { status: 500 }
    );
  }
}
