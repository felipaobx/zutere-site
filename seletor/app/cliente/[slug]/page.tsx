import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { galleries } from '@/db/schema';
import ClientAccess from './client-access';
import { notFound } from 'next/navigation';
import { getGalleryAccess } from '@/lib/gallery-access';
import GalleryClient from '@/app/gallery/[slug]/gallery-client';

const names: Record<string, string> = { 'ana-e-caio': 'Casamento de Ana & Caio', 'familia-lima': 'Ensaio — Família Lima', 'luiza-e-theo': 'Pré-wedding Luiza & Theo' };
export const dynamic = 'force-dynamic';

async function resolveTitle(slug: string) {
  try {
    const gallery = await getDb().select({ name: galleries.name }).from(galleries).where(eq(galleries.slug, slug)).get();
    return gallery?.name ?? names[slug] ?? 'Sua galeria';
  } catch {
    return names[slug] ?? 'Sua galeria';
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const title = await resolveTitle(slug); const description = `Acesso protegido à galeria ${title}.`;
  return { title: `${title} — Zutere`, description, robots: { index: false, follow: false }, openGraph: { title, description, images: [] }, twitter: { title, description, images: [] } };
}

export default async function ClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await getDb().select().from(galleries).where(eq(galleries.slug, slug)).get();
  if (!gallery) notFound();
  const access = await getGalleryAccess(gallery.id, gallery.ownerId);
  if (access?.role === 'client') return <GalleryClient title={gallery.name} slug={slug} initialProjectType={gallery.projectType} clientMode clientName={gallery.clientName} />;
  return <ClientAccess slug={slug} title={gallery?.name ?? await resolveTitle(slug)} projectType={gallery?.projectType} />;
}
