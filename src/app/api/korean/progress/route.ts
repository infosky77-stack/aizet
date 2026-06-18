import { NextRequest, NextResponse } from 'next/server';
import { getAllStudents, getStudent, upsertStudent, completeUnit } from '@/lib/korean/progress';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (studentId) {
    const student = getStudent(studentId);
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ student });
  }
  return NextResponse.json({ students: getAllStudents() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === 'completeUnit') {
    const { studentId, unitId, score } = body;
    if (!studentId || !unitId || score == null) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
    }
    const student = completeUnit(studentId, unitId, score);
    return NextResponse.json({ student });
  }

  if (body.action === 'register') {
    const student = upsertStudent({
      studentId: `student-${Date.now()}`,
      name: body.name,
      email: body.email,
      lang: body.lang,
      level: body.level ?? 'beginner',
    });
    return NextResponse.json({ student }, { status: 201 });
  }

  return NextResponse.json({ error: '알 수 없는 action' }, { status: 400 });
}
