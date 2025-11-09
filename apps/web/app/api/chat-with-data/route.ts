import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/chat-with-data
 * Server-side health proxy to avoid browser CORS when waking the Vanna service.
 */
export async function GET(_request: NextRequest) {
  try {
    const vannaUrl = process.env.VANNA_SERVICE_URL || 'http://localhost:8000';
    const res = await fetch(`${vannaUrl}/health`, { method: 'GET' });
    const json = await res.json().catch(() => ({ status: 'unknown' }));
    return NextResponse.json(json, { status: res.ok ? 200 : 500 });
  } catch (error) {
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
    const vannaUrl = process.env.VANNA_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${vannaUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`Vanna service returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding to Vanna service:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
