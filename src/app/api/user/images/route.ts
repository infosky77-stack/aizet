import { NextRequest, NextResponse } from 'next/server';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser, getRegenCount } from '@/lib/users';
import { getTemplateForIndustry } from '@/lib/ai/imageTemplates';

export const dynamic = 'force-dynamic';

const REGEN_LIMIT = 3;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUser(session.sub);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (!user.slug) return NextResponse.json({ images: [], regenCount: 0, regenLimit: REGEN_LIMIT });

  const template = getTemplateForIndustry(user.industry);
  const saveDir = path.join(process.cwd(), 'data', 'site-images', user.slug);

  const images = template.images.map(img => {
    const filePath = path.join(saveDir, `${img.key}.jpg`);
    const exists = existsSync(filePath);
    let url: string | null = null;
    if (exists) {
      const mtime = statSync(filePath).mtimeMs;
      url = `/api/images/${user.slug}/${img.key}.jpg?v=${Math.floor(mtime)}`;
    }
    return { key: img.key, label: img.label, url, exists };
  });

  return NextResponse.json({
    images,
    regenCount: getRegenCount(user.id),
    regenLimit: REGEN_LIMIT,
  });
}
