import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const trends = await analyticsService.getInvoiceTrends();
    return NextResponse.json(trends);
  } catch (error) {
    console.error('Error fetching invoice trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice trends' },
      { status: 500 }
    );
  }
}
