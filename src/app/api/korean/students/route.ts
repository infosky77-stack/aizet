import { NextResponse } from 'next/server';
import { getAllStudents, getStats } from '@/lib/korean/progress';

export async function GET() {
  const students = getAllStudents();
  const stats = getStats();
  return NextResponse.json({ students, stats });
}
