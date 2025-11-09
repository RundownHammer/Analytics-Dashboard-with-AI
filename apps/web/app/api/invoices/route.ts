import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      q: searchParams.get('q') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc',
    };
    
    const invoices = await analyticsService.getInvoices(params);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
