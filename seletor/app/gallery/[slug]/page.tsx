import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { galleries, photos, selections } from '@/db/schema';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import GalleryClient from './gallery-client';
import { notFound, redirect } from 'next/navigation';
import { getGalleryAccess } from '@/lib/gallery-access';

const galleryNames: Record<string, string> = {
  'ana-e-caio': 'Casamento de Ana & Caio',
  'familia-lima': 'Ensaio — Família Lima',
  'luiza-e-theo': 'Pré-wedding Luiza & Theo',
};
export const dynamic = 'force-dynamic';

async function resolveTitle(slug: string) {
  try {
    const gallery = await getDb().select({ name: galleries.name }).from(galleries).where(eq(galleries.slug, slug)).get();
    return gallery?.name ?? galleryNames[slug] ?? 'Sua galeria';
  } catch {
    return galleryNames[slug] ?? 'Sua galeria';
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = await resolveTitle(slug);
  const description = `Selecione suas fotos favoritas em ${title}.`;
  return {
    title: `${title} — Zutere`,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: `${title} — Zutere`, description, images: [] },
    twitter: { card: 'summary', title: `${title} — Zutere`, description, images: [] },
  };
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getChatGPTUser();
  const gallery = await getDb().select().from(galleries).where(eq(galleries.slug, slug)).get();
  if (!gallery) notFound();
  const access = await getGalleryAccess(gallery.id, gallery.ownerId);
  if (!access) redirect(`/fotos/cliente/${slug}`);
  const galleryPhotos = gallery && user?.userId === gallery.ownerId
    ? await getDb().select({ id: photos.id, filename: photos.filename, isCover: photos.isCover }).from(photos).where(eq(photos.galleryId, gallery.id)).orderBy(asc(photos.sortOrder))
    : undefined;
  const selectedPhotos = gallery && user?.userId === gallery.ownerId
    ? await getDb().select({ photoId: selections.photoId }).from(selections).where(eq(selections.galleryId, gallery.id))
    : [];
  const cover = galleryPhotos?.find((photo) => photo.isCover) ?? galleryPhotos?.[0];
  return <GalleryClient title={gallery.name} slug={slug} clientMode={access.role !== 'owner'} initialProjectType={gallery.projectType} clientName={gallery.clientName} initialPhotos={galleryPhotos?.map((photo) => ({ ...photo, src: `/fotos/api/gallery/${slug}/photos/${photo.id}` }))} initialCoverUrl={cover ? `/fotos/api/gallery/${slug}/photos/${cover.id}` : undefined} initialSelectedPhotoIds={selectedPhotos.map((item) => item.photoId)} initialSelectionCompleted={gallery.status === 'completed'} initialCanEditCompleted={access.role === 'owner'} />;
}
