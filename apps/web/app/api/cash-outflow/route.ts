import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const outflow = await analyticsService.getCashOutflow();
    console.log('🔍 Cash Outflow DB Response:', JSON.stringify(outflow, null, 2));
    return NextResponse.json(outflow);
  } catch (error) {
    console.error('Error fetching cash outflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash outflow' },
      { status: 500 }
    );
  }
}
