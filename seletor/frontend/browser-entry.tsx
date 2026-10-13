import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DashboardClient, { type DashboardView } from '../app/dashboard-client';
import GalleryClient from '../app/gallery/[slug]/gallery-client';
import ClientAccess from '../app/cliente/[slug]/client-access';
import LoginForm from '../app/login-form';
import BrandLogo from '../app/brand-logo';
import LogoutPage from '../app/sair/page';
import '../app/globals.css';
import '../app/gallery-design.css';
import '../app/usability.css';

type GallerySummary = { slug: string; name: string };
type GalleryDetails = { name: string; projectType: string; clientName: string; role: 'owner' | 'client' };
const views: Record<string, DashboardView> = { '/fotos/fotografo/painel': 'home', '/fotos/galerias': 'galleries', '/fotos/clientes': 'clients', '/fotos/pedidos': 'orders', '/fotos/entregas': 'deliveries', '/fotos/relatorios': 'reports', '/fotos/configuracoes': 'settings' };
const pathname = window.location.pathname.replace(/\/$/, '') || '/';

function Loading() { return <main className="boot"><BrandLogo /><p>Carregando…</p></main>; }
function Failure({ message }: { message: string }) { return <main className="boot"><BrandLogo /><p role="alert">{message}</p><button onClick={() => window.location.reload()}>Tentar novamente</button></main>; }
function ClientPortal() {
  const [items, setItems] = useState<GallerySummary[] | null>(null), [anonymous, setAnonymous] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    fetch('/fotos/api/client/galleries').then(async response => {
      if (cancelled) return;
      if (response.status === 401) { setAnonymous(true); return; }
      if (!response.ok) throw new Error('Não foi possível carregar suas galerias.');
      const data = await response.json() as { galleries: GallerySummary[] };
      if (!cancelled) setItems(data.galleries);
    }).catch(() => { if (!cancelled) setError('Não foi possível conectar. Tente novamente.'); });
    return () => { cancelled = true; };
  }, []);
  if (error) return <Failure message={error} />;
  if (anonymous) return <LoginForm />;
  if (!items) return <Loading />;
  return <main className="client-portal"><header><BrandLogo /><a href="/fotos/sair">Sair</a></header><p className="eyebrow">ÁREA DO CLIENTE</p><h1>Suas galerias</h1><p>Escolha um trabalho para ver suas fotografias.</p><section className="portal-galleries">{items.map(item => <a key={item.slug} href={'/fotos/cliente/' + item.slug}><span>▧</span><h2>{item.name}</h2><strong>Abrir galeria →</strong></a>)}</section></main>;
}
function Studio({ view }: { view?: DashboardView }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null), [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    fetch('/fotos/api/photographer/session').then(response => {
      if (cancelled) return;
      if (response.status === 401) { setAuthenticated(false); return; }
      if (!response.ok) throw new Error();
      setAuthenticated(true);
    }).catch(() => { if (!cancelled) setError('Não foi possível conferir seu acesso. Tente novamente.'); });
    return () => { cancelled = true; };
  }, []);
  if (error) return <Failure message={error} />;
  if (authenticated === null) return <Loading />;
  if (!authenticated) return <LoginForm photographer notice={new URLSearchParams(window.location.search).get('alterado') === '1' ? 'Login atualizado. Entre com seu e-mail e senha atuais.' : undefined} />;
  return <DashboardClient view={view ?? 'home'} />;
}
function Gallery({ slug, client }: { slug: string; client: boolean }) {
  const [details, setDetails] = useState<GalleryDetails | null>(null), [locked, setLocked] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    fetch('/fotos/api/gallery/' + encodeURIComponent(slug) + '/photos').then(async response => {
      if (cancelled) return;
      if (response.status === 401) { setLocked(true); return; }
      if (response.status === 404) throw new Error('Esta galeria não foi encontrada.');
      if (!response.ok) throw new Error('Não foi possível carregar a galeria.');
      const data = await response.json() as { gallery: GalleryDetails };
      if (!cancelled) setDetails(data.gallery);
    }).catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : 'Falha de conexão.'); });
    return () => { cancelled = true; };
  }, [slug]);
  if (error) return <Failure message={error} />;
  if (locked) return client ? <ClientAccess slug={slug} title="Sua galeria" /> : <LoginForm photographer />;
  if (!details) return <Loading />;
  return <GalleryClient title={details.name} slug={slug} initialProjectType={details.projectType} clientMode={client || details.role === 'client'} clientName={details.clientName} />;
}
function App() {
  if (pathname === '/fotos' || pathname === '/') return <ClientPortal />;
  if (pathname === '/fotografo' || pathname === '/fotos/fotografo') return <Studio />;
  if (views[pathname]) return <Studio view={views[pathname]} />;
  if (pathname === '/fotos/sair') return <LogoutPage />;
  const match = pathname.match(/^\/fotos\/(cliente|gallery)\/([^/]+)$/);
  if (match) { let slug: string; try { slug = decodeURIComponent(match[2]); } catch { return <Failure message="Endereço de galeria inválido." />; } return <Gallery slug={slug} client={match[1] === 'cliente'} />; }
  return <Failure message="Este endereço não foi encontrado." />;
}
createRoot(document.getElementById('root')!).render(<App />);
