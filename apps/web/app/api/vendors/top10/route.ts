import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    const vendors = await analyticsService.getTopVendors(limit);
    console.log('🔍 Top Vendors DB Response:', JSON.stringify(vendors, null, 2));
    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching top vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top vendors' },
      { status: 500 }
    );
  }
}
