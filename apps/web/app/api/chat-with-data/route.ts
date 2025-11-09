import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/chat-with-data
 * Server-side health proxy to avoid browser CORS when waking the Vanna service.
 */
export async function GET(_request: NextRequest) {
  try {
    const vannaUrl = process.env.VANNA_SERVICE_URL;
    if (!vannaUrl) {
      return NextResponse.json(
        { error: 'VANNA_SERVICE_URL env var not set' },
        { status: 500 }
      );
    }
    const base = vannaUrl.replace(/\/+$/, ''); // remove trailing slashes
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
    const vannaUrl = process.env.VANNA_SERVICE_URL;
    if (!vannaUrl) {
      return NextResponse.json(
        { error: 'VANNA_SERVICE_URL env var not set' },
        { status: 500 }
      );
    }

    const base = vannaUrl.replace(/\/+$/, '');
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
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
