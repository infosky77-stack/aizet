import { notFound } from 'next/navigation';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { getUserBySlug, getMenuItems } from '@/lib/users';
import SiteHomePage from '@/components/SiteHomePage';
import { getTemplateForIndustry } from '@/lib/ai/imageTemplates';

export const dynamic = 'force-dynamic';

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = getUserBySlug(slug);
  if (!user) notFound();

  const menuItems = getMenuItems(user.id);

  const imageDir = path.join(process.cwd(), 'data', 'site-images', slug);
  let generatedImages: { key: string; label: string; path: string }[] = [];

  if (existsSync(imageDir)) {
    const template = getTemplateForIndustry(user.industry);
    const keyToLabel = Object.fromEntries(template.images.map(t => [t.key, t.label]));
    const files = readdirSync(imageDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    generatedImages = files.map(f => {
      const key = f.replace(/\.(png|jpg)$/, '');
      return { key, label: keyToLabel[key] ?? key, path: `/api/images/${slug}/${f}` };
    });
  }

  return <SiteHomePage user={user} menuItems={menuItems} generatedImages={generatedImages} />;
}
