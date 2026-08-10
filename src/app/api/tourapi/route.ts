import { NextResponse } from 'next/server';
import { fetchTourApiRealtime } from '@/lib/tourapi';

export async function GET() {
  try {
    const data = await fetchTourApiRealtime();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch TourAPI data' },
      { status: 500 }
    );
  }
}
