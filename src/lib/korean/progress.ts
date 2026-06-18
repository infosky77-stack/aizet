import { StudentProgress, KoreanLevel, StudyLang } from '@/types/korean';

const store: Map<string, StudentProgress> = new Map();

const DEMO_STUDENTS: StudentProgress[] = [
  {
    studentId: 'student-001',
    name: 'Emily Chen',
    email: 'emily@example.com',
    lang: 'en',
    level: 'elementary',
    joinedAt: '2026-05-01',
    lastActiveAt: '2026-06-17',
    attendanceDays: 34,
    completedUnits: ['consonant-basic', 'vowel-basic', 'word-greetings'],
    scores: { 'consonant-basic': 92, 'vowel-basic': 88, 'word-greetings': 95 },
    totalScore: 91,
    streak: 7,
  },
  {
    studentId: 'student-002',
    name: '王芳',
    email: 'wangfang@example.com',
    lang: 'zh',
    level: 'intermediate',
    joinedAt: '2026-04-10',
    lastActiveAt: '2026-06-18',
    attendanceDays: 58,
    completedUnits: ['consonant-basic', 'vowel-basic', 'word-greetings', 'sentence-basic'],
    scores: { 'consonant-basic': 96, 'vowel-basic': 94, 'word-greetings': 90, 'sentence-basic': 85 },
    totalScore: 91,
    streak: 12,
  },
  {
    studentId: 'student-003',
    name: '田中さくら',
    email: 'tanaka@example.com',
    lang: 'ja',
    level: 'advanced',
    joinedAt: '2026-03-15',
    lastActiveAt: '2026-06-18',
    attendanceDays: 82,
    completedUnits: ['consonant-basic', 'vowel-basic', 'word-greetings', 'sentence-basic', 'conversation-daily'],
    scores: { 'consonant-basic': 98, 'vowel-basic': 97, 'word-greetings': 94, 'sentence-basic': 92, 'conversation-daily': 89 },
    totalScore: 94,
    streak: 25,
  },
  {
    studentId: 'student-004',
    name: 'Nguyễn Minh',
    email: 'nguyen@example.com',
    lang: 'vi',
    level: 'beginner',
    joinedAt: '2026-06-01',
    lastActiveAt: '2026-06-16',
    attendanceDays: 12,
    completedUnits: ['consonant-basic'],
    scores: { 'consonant-basic': 78 },
    totalScore: 78,
    streak: 3,
  },
  {
    studentId: 'student-005',
    name: 'Michael Park',
    email: 'michael@example.com',
    lang: 'en',
    level: 'intermediate',
    joinedAt: '2026-04-20',
    lastActiveAt: '2026-06-17',
    attendanceDays: 45,
    completedUnits: ['consonant-basic', 'vowel-basic', 'word-greetings', 'sentence-basic'],
    scores: { 'consonant-basic': 88, 'vowel-basic': 82, 'word-greetings': 91, 'sentence-basic': 79 },
    totalScore: 85,
    streak: 5,
  },
];

DEMO_STUDENTS.forEach(s => store.set(s.studentId, s));

export function getAllStudents(): StudentProgress[] {
  return Array.from(store.values());
}

export function getStudent(id: string): StudentProgress | undefined {
  return store.get(id);
}

export function upsertStudent(data: Partial<StudentProgress> & { studentId: string }): StudentProgress {
  const existing = store.get(data.studentId);
  const now = new Date().toISOString().split('T')[0];
  const updated: StudentProgress = {
    studentId: data.studentId,
    name: data.name ?? existing?.name ?? 'Anonymous',
    email: data.email ?? existing?.email ?? '',
    lang: data.lang ?? existing?.lang ?? 'en',
    level: data.level ?? existing?.level ?? 'beginner',
    joinedAt: existing?.joinedAt ?? now,
    lastActiveAt: now,
    attendanceDays: data.attendanceDays ?? (existing?.attendanceDays ?? 0) + 1,
    completedUnits: data.completedUnits ?? existing?.completedUnits ?? [],
    scores: { ...(existing?.scores ?? {}), ...(data.scores ?? {}) },
    totalScore: 0,
    streak: data.streak ?? existing?.streak ?? 1,
  };
  const scores = Object.values(updated.scores);
  updated.totalScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  store.set(data.studentId, updated);
  return updated;
}

export function completeUnit(studentId: string, unitId: string, score: number): StudentProgress {
  const s = store.get(studentId);
  if (!s) throw new Error('Student not found');
  const completedUnits = Array.from(new Set([...s.completedUnits, unitId]));
  return upsertStudent({ studentId, completedUnits, scores: { ...s.scores, [unitId]: score } });
}

export function getStats() {
  const students = getAllStudents();
  const levelCounts: Record<KoreanLevel, number> = { beginner: 0, elementary: 0, intermediate: 0, advanced: 0 };
  const langCounts: Record<StudyLang, number> = { en: 0, zh: 0, ja: 0, vi: 0 };
  let totalScore = 0;
  let totalAttendance = 0;

  for (const s of students) {
    levelCounts[s.level]++;
    langCounts[s.lang]++;
    totalScore += s.totalScore;
    totalAttendance += s.attendanceDays;
  }

  return {
    total: students.length,
    levelCounts,
    langCounts,
    avgScore: students.length ? Math.round(totalScore / students.length) : 0,
    avgAttendance: students.length ? Math.round(totalAttendance / students.length) : 0,
    activeToday: students.filter(s => s.lastActiveAt === new Date().toISOString().split('T')[0]).length,
  };
}
