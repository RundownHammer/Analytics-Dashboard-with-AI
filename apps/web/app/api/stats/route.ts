import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const stats = await analyticsService.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
