import { cookies } from 'next/headers';
import { and, eq, gt, desc } from 'drizzle-orm';
import { getDb } from '@/db';
import { clientSessions, clientCredentials, galleryClients, galleries, galleryCredentials, gallerySessions } from '@/db/schema';
import { hashToken } from '@/lib/credentials';
import LoginForm from './login-form';
import BrandLogo from './brand-logo';
export const dynamic='force-dynamic';
export default async function Page(){
 const token=(await cookies()).get('lumea_gallery_session')?.value;
 if(!token)return <LoginForm/>;
 const hash=await hashToken(token),db=getDb();
 const assigned=await db.select({slug:galleries.slug,name:galleries.name}).from(clientSessions).innerJoin(clientCredentials,eq(clientSessions.credentialId,clientCredentials.id)).innerJoin(galleryClients,eq(galleryClients.clientId,clientCredentials.clientId)).innerJoin(galleries,eq(galleryClients.galleryId,galleries.id)).where(and(eq(clientSessions.tokenHash,hash),gt(clientSessions.expiresAt,new Date()))).orderBy(desc(galleries.createdAt));
 const legacy=await db.select({slug:galleries.slug,name:galleries.name}).from(gallerySessions).innerJoin(galleryCredentials,eq(gallerySessions.credentialId,galleryCredentials.id)).innerJoin(galleries,eq(galleryCredentials.galleryId,galleries.id)).where(and(eq(gallerySessions.tokenHash,hash),gt(gallerySessions.expiresAt,new Date())));
 const items=[...assigned,...legacy];if(!items.length)return <LoginForm/>;
 return <main className="client-portal"><header><BrandLogo/><a href="/fotos/sair">Sair</a></header><p className="eyebrow">ÁREA DO CLIENTE</p><h1>Suas galerias</h1><p>Escolha um trabalho para ver suas fotografias.</p><section className="portal-galleries">{items.map(item=><a key={item.slug} href={'/fotos/cliente/'+item.slug}><span>▧</span><h2>{item.name}</h2><strong>Abrir galeria →</strong></a>)}</section></main>;
}
