import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const categories = await analyticsService.getCategorySpend();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching category spend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category spend' },
      { status: 500 }
    );
  }
}
