import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUser, getSiteConfig, updateSiteConfig } from '@/lib/users';
import type { SiteConfig } from '@/lib/users';

const ALLOWED_THEMES = ['amber', 'rose', 'violet', 'emerald', 'blue', 'orange', 'slate'];
const ALLOWED_SECTIONS = ['gallery', 'menu', 'cta'];

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const config = getSiteConfig(session.sub);
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUser(session.sub);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const config: SiteConfig = {};

  if (typeof body.tagline === 'string') config.tagline = body.tagline.slice(0, 100);
  if (typeof body.cta_text === 'string') config.cta_text = body.cta_text.slice(0, 50);
  if (typeof body.theme === 'string' && ALLOWED_THEMES.includes(body.theme)) config.theme = body.theme;
  if (Array.isArray(body.sections_hidden)) {
    config.sections_hidden = body.sections_hidden.filter((s: unknown) =>
      typeof s === 'string' && ALLOWED_SECTIONS.includes(s)
    );
  }

  updateSiteConfig(session.sub, config);
  return NextResponse.json({ config });
}
