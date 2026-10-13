'use client';
/* eslint-disable @next/next/no-html-link-for-pages */

import { FormEvent, type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import BrandLogo from './brand-logo';
import PhotoManager from './photo-manager';
import PhotographerCredentials from './photographer-credentials';
import DriveSettings from './drive-settings';
import { OrdersView, DeliveriesView, ReportsView, RecordModal } from './studio-views';
import { money, type StudioOrder, type StudioDelivery } from '@/lib/studio-data';

function foreground(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255).map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2] > .179 ? '#211b2d' : '#ffffff';
}

export type DashboardView = 'home' | 'galleries' | 'clients' | 'orders' | 'deliveries' | 'reports' | 'settings';

const TARGET_PHOTO_BYTES = 950 * 1024;

async function compressPhoto(file: File) {
  if (file.size <= TARGET_PHOTO_BYTES && (file.type === 'image/jpeg' || file.type === 'image/webp')) return file;

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  let width = bitmap.width;
  let height = bitmap.height;
  const initialScale = Math.min(1, 3200 / Math.max(width, height));
  width = Math.max(1, Math.round(width * initialScale));
  height = Math.max(1, Math.round(height * initialScale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) { bitmap.close(); throw new Error('Não foi possível preparar a imagem.'); }

  let quality = 0.88;
  let compressed: Blob | null = null;
  for (let attempt = 0; attempt < 14; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (compressed && compressed.size <= TARGET_PHOTO_BYTES) break;
    if (quality > 0.5) quality -= 0.08;
    else if (Math.max(width, height) > 900) {
      width = Math.max(1, Math.round(width * 0.84));
      height = Math.max(1, Math.round(height * 0.84));
      quality = 0.72;
    } else quality = Math.max(0.3, quality - 0.05);
  }
  bitmap.close();
  if (!compressed || compressed.size > TARGET_PHOTO_BYTES) throw new Error('A imagem não pôde ser reduzida para menos de 1 MB.');
  const optimizedName = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return new File([compressed], optimizedName, { type: 'image/webp', lastModified: file.lastModified });
}

const nav = [
  { view: 'home', href: '/fotos/fotografo/painel', icon: '⌂', label: 'Visão geral' },
  { view: 'galleries', href: '/fotos/galerias', icon: '▧', label: 'Galerias', count: '8' },
  { view: 'clients', href: '/fotos/clientes', icon: '♙', label: 'Clientes' },
  { view: 'orders', href: '/fotos/pedidos', icon: '▤', label: 'Pedidos', count: '4' },
  { view: 'deliveries', href: '/fotos/entregas', icon: '⇩', label: 'Entregas' },
  { view: 'reports', href: '/fotos/relatorios', icon: '▥', label: 'Relatórios' },
  { view: 'settings', href: '/fotos/configuracoes', icon: '⚙', label: 'Configurações' },
] as const;

type ProjectType = 'selection' | 'delivery' | 'album';
type SelectedPhoto = { id: string; filename: string; src: string; comment?: string };
type LinkedClient = { id: string; name: string; email: string; login?: string | null; hasAccess?: boolean };
type Gallery = { id?: string; clientId?: string | null; clientIds?: string[]; clients?: LinkedClient[]; projectType?: ProjectType; category?: string; eventDate?: string | null; slug: string; title: string; client: string; clientEmail?: string | null; selectionFinalizedAt?: string | null; selectionMessage?: string | null; date: string; status: string; statusClass: 'waiting' | 'active' | 'done' | 'expired'; selected: number; total: number; due: string; cover: string; selectedPhotos?: SelectedPhoto[] };
type SavedGallery = { id: string; clientId?: string | null; clientIds?: string[]; clients?: LinkedClient[]; slug: string; name: string; clientName: string; clientEmail?: string | null; selectionFinalizedAt?: string | null; selectionMessage?: string | null; projectType: ProjectType; category?: string; eventDate?: string | null; deadline: string; status: 'draft' | 'selecting' | 'completed' | 'expired'; createdAt: string; photoCount: number; selectionCount?: number; selectedPhotos?: SelectedPhoto[]; coverUrl: string | null };

function savedGalleryToCard(gallery: SavedGallery): Gallery {
  return { id: gallery.id, clientId: gallery.clientId, clientIds: gallery.clientIds ?? (gallery.clientId ? [gallery.clientId] : []), clients: gallery.clients ?? [], projectType: gallery.projectType, category: gallery.category, eventDate: gallery.eventDate, slug: gallery.slug, title: gallery.name, client: gallery.clientName, clientEmail: gallery.clientEmail, selectionFinalizedAt: gallery.selectionFinalizedAt, selectionMessage: gallery.selectionMessage, date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(gallery.createdAt)), status: gallery.status === 'completed' ? 'Seleção concluída' : gallery.status === 'expired' ? 'Expirada' : gallery.status === 'selecting' ? 'Em seleção' : 'Rascunho', statusClass: gallery.status === 'completed' ? 'done' : gallery.status === 'expired' ? 'expired' : gallery.status === 'selecting' ? 'active' : 'waiting', selected: gallery.selectionCount ?? 0, selectedPhotos: gallery.selectedPhotos ?? [], total: gallery.photoCount, due: gallery.deadline, cover: gallery.coverUrl ?? '' };
}

type Client = { id?: string; name: string; email: string; phone: string; projects: number; value: string; last: string; initials: string; tone: string; country?: string; language?: string; notes?: string; login?: string | null; hasAccess?: boolean };

const titles: Record<DashboardView, { eyebrow: string; title: string; copy: string; action: string }> = {
  home: { eyebrow: 'QUARTA-FEIRA, 26 DE AGOSTO', title: 'Bom dia, Felipe.', copy: 'Seu trabalho merece uma entrega à altura.', action: 'Nova galeria' },
  galleries: { eyebrow: 'SELEÇÃO E APROVAÇÃO', title: 'Galerias', copy: 'Crie experiências bonitas e acompanhe cada escolha.', action: 'Nova galeria' },
  clients: { eyebrow: 'RELACIONAMENTO', title: 'Clientes', copy: 'Histórico, contatos e trabalhos reunidos em um só lugar.', action: 'Novo cliente' },
  orders: { eyebrow: 'VENDAS', title: 'Pedidos', copy: 'Acompanhe pagamentos, extras e produtos do estúdio.', action: 'Novo pedido' },
  deliveries: { eyebrow: 'ARQUIVOS FINAIS', title: 'Entregas', copy: 'Envie arquivos finais com segurança e acompanhe downloads.', action: 'Nova entrega' },
  reports: { eyebrow: 'INTELIGÊNCIA DO ESTÚDIO', title: 'Relatórios', copy: 'Entenda o ritmo do seu negócio e tome decisões melhores.', action: 'Exportar relatório' },
  settings: { eyebrow: 'PERSONALIZAÇÃO E CONTA', title: 'Configurações', copy: 'Ajuste a identidade do site e os dados do estúdio.', action: 'Salvar alterações' },
};

type StudioSettings = { authenticationEmail?: string; displayName: string; studioName: string; loginEmail: string; primaryColor: string; accentColor: string; appearance: 'light' | 'dark' | 'system'; plan: 'essential' | 'studio' | 'pro' };
const defaultSettings: StudioSettings = { displayName: 'Felipe Costa', studioName: 'Zutere', loginEmail: '', primaryColor: '#6f4cc3', accentColor: '#a95072', appearance: 'light', plan: 'studio' };

export default function DashboardClient({ view }: { view: DashboardView }) {
  const [search, setSearch] = useState('');
  const [shareGallery, setShareGallery] = useState<Gallery | null>(null);
  const [shareCredentials, setShareCredentials] = useState<{ login: string; password: string; path: string } | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [copied, setCopied] = useState<'link' | 'message' | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [galleryClientName, setGalleryClientName] = useState('');
  const [galleryItems, setGalleryItems] = useState<Gallery[]>([]);
  const [uploadGallery, setUploadGallery] = useState<Gallery | null>(null);
  const [showClientCreate, setShowClientCreate] = useState(false);
  const [clientItems, setClientItems] = useState<Client[]>([]);
  const [clientSaveError, setClientSaveError] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [credentialClient, setCredentialClient] = useState<Client | null>(null);
  const [selectionGallery, setSelectionGallery] = useState<Gallery | null>(null);
  const [linkGallery, setLinkGallery] = useState<Gallery | null>(null);
  const [galleryActionError, setGalleryActionError] = useState('');
  const [orderItems, setOrderItems] = useState<StudioOrder[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<StudioDelivery[]>([]);
  const [operationModal, setOperationModal] = useState<'order' | 'delivery' | 'help' | 'notifications' | 'plan' | 'report' | null>(null);
  const [studioSettings, setStudioSettings] = useState<StudioSettings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [dataError, setDataError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const heading = view === 'home' ? { ...titles.home, eyebrow: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase(), title: 'Olá, ' + studioSettings.displayName.split(/\s+/)[0] + '.' } : titles[view];
  const visibleGalleries = useMemo(() => galleryItems.filter((g) => `${g.title} ${g.client}`.toLowerCase().includes(search.toLowerCase())), [search, galleryItems]);
  const visibleClients = useMemo(() => clientItems.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase())), [search, clientItems]);

  useEffect(() => {
    fetch('/fotos/api/clients').then(async (response) => {
      if (!response.ok) throw new Error('Não foi possível carregar os clientes.');
      const data = await response.json() as { clients?: Array<{ id: string; name: string; email: string; phone: string | null; country?: string; language?: string; login?: string | null; hasAccess?: boolean }> };
      const saved = (data.clients ?? []).map((client) => ({ ...client, phone: client.phone ?? 'Não informado', projects: 0, value: 'R$ 0', last: 'salvo', initials: client.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(''), tone: 'violet' })) as Client[];
      setClientItems(saved);
    }).catch(() => setDataError('Não foi possível carregar os clientes. Recarregue para tentar novamente.'));
  }, []);

  useEffect(() => {
    fetch('/fotos/api/settings').then(async (response) => {
      if (!response.ok) throw new Error('Não foi possível carregar as configurações.');
      const data = await response.json() as { settings?: StudioSettings };
      if (data.settings) setStudioSettings({ ...defaultSettings, ...data.settings });
    }).catch(() => setDataError('Não foi possível carregar as configurações.')).finally(() => setSettingsLoaded(true));
  }, []);

  const refreshGalleries = useCallback(async () => {
    const response = await fetch('/fotos/api/galleries');
    if (!response.ok) throw new Error('Não foi possível carregar as galerias.');
    const data = await response.json() as { galleries: SavedGallery[] };
    setGalleryItems(data.galleries.map(savedGalleryToCard));
  }, []);
  const refreshRecords = useCallback(async () => {
    const [orderResponse, deliveryResponse] = await Promise.all([fetch('/fotos/api/orders'), fetch('/fotos/api/deliveries')]);
    if (!orderResponse.ok || !deliveryResponse.ok) throw new Error('Não foi possível carregar pedidos e entregas.');
    const [orderData, deliveryData] = await Promise.all([orderResponse.json(), deliveryResponse.json()]) as [{ orders: StudioOrder[] }, { deliveries: StudioDelivery[] }];
    setOrderItems(orderData.orders); setDeliveryItems(deliveryData.deliveries);
  }, []);
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch('/fotos/api/galleries'), fetch('/fotos/api/orders'), fetch('/fotos/api/deliveries')]).then(async (responses) => {
      if (responses.some((response) => !response.ok)) throw new Error('Não foi possível carregar os dados do painel.');
      const [galleryData, orderData, deliveryData] = await Promise.all(responses.map((response) => response.json())) as [{ galleries: SavedGallery[] }, { orders: StudioOrder[] }, { deliveries: StudioDelivery[] }];
      if (!cancelled) { setGalleryItems(galleryData.galleries.map(savedGalleryToCard)); setOrderItems(orderData.orders); setDeliveryItems(deliveryData.deliveries); }
    }).catch((error) => { if (!cancelled) setDataError(error instanceof Error ? error.message : 'Falha ao carregar o painel.'); }).finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    const refresh = () => { void Promise.all([refreshGalleries(), refreshRecords()]).catch(() => setDataError('Não foi possível atualizar os dados.')); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refreshGalleries, refreshRecords]);
  useEffect(() => {
    const backdrop = document.querySelector('.app-shell .modal-backdrop');
    if (!backdrop) return;
    const oldOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    (backdrop.querySelector('input, select, button') as HTMLElement | null)?.focus();
    const handleKey = (event: KeyboardEvent) => {
      const modals = document.querySelectorAll('.app-shell .modal-backdrop');
      const active = modals[modals.length - 1];
      if (!active) return;
      if (event.key === 'Escape') { (active.querySelector('.modal-close:not(:disabled)') as HTMLButtonElement | null)?.click(); return; }
      if (event.key !== 'Tab') return;
      const controls = Array.from(active.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea, a[href]')).filter((element) => element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [shareGallery, selectionGallery, linkGallery, showCreate, uploadGallery, showClientCreate, selectedClient, credentialClient, operationModal]);
  async function addGallery(values: { name: string; clientIds: string[]; projectType: ProjectType; category: string; eventDate: string; deadline: string; watermarkEnabled: boolean }) {
    try {

    const response = await fetch('/fotos/api/galleries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) });
    if (!response.ok) return { ok: false as const, message: 'Não foi possível criar a galeria. Confira os campos e tente novamente.' };
    const data = await response.json() as { gallery: { id: string; clientId: string; clientIds: string[]; clients: LinkedClient[]; slug: string; name: string; clientName: string; projectType: ProjectType; category: string; eventDate: string | null; deadline: string } };
    const item: Gallery = { id: data.gallery.id, clientId: data.gallery.clientId, clientIds: data.gallery.clientIds, clients: data.gallery.clients, projectType: data.gallery.projectType, category: data.gallery.category, eventDate: data.gallery.eventDate, slug: data.gallery.slug, title: data.gallery.name, client: data.gallery.clients.map((client) => client.name).join(', ') || data.gallery.clientName, date: 'agora', status: 'Rascunho', statusClass: 'waiting', selected: 0, total: 0, due: data.gallery.deadline, cover: '' };
    setGalleryItems((current) => [item, ...current]);
    setShowCreate(false);
    setUploadGallery(item);
    return { ok: true as const };

    } catch { return { ok: false as const, message: 'A conexão foi interrompida. Tente novamente.' }; }
}

  async function openShare(gallery: Gallery) {
    setShareGallery(gallery); setShareCredentials(null); setShareError(''); setShareLoading(false);
    if (!gallery.id) { setShareError('Crie uma galeria real para compartilhar o acesso.'); return; }
    const clientWithAccess = gallery.clients?.find((client) => client.hasAccess && client.login);
    if (!clientWithAccess?.login) { setShareError('Configure o login e a senha de pelo menos um cliente antes de compartilhar. Acesse Clientes, abra o cadastro e escolha “Configurar login e senha”.'); return; }
    setShareCredentials({ login: clientWithAccess.login, password: 'Senha cadastrada', path: `/fotos/cliente/${gallery.slug}` });
  }

  function exportReport() {
    const rows = [['Indicador', 'Valor'], ['Clientes', String(clientItems.length)], ['Galerias', String(galleryItems.length)], ['Fotos selecionadas', String(galleryItems.reduce((sum, gallery) => sum + gallery.selected, 0))], ['Receita registrada', money(orderItems.filter((order) => ['paid', 'production', 'completed'].includes(order.status)).reduce((sum, order) => sum + order.amountCents, 0))]];
    const csv = '\uFEFF' + rows.map((row) => row.map((value) => '"' + value.replaceAll('"', '""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'relatorio-zutere.csv'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setOperationModal('report');
  }

  async function addClient(client: Client) {
    setClientSaveError('');
    try {
      const response = await fetch('/fotos/api/clients', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: client.name, email: client.email, phone: client.phone, country: client.country, language: client.language, notes: client.notes }) });
      if (!response.ok) { const result = await response.json().catch(() => null) as { error?: string } | null; throw new Error(result?.error ?? 'Não foi possível salvar o cliente.'); }
      const data = await response.json() as { client?: { id: string } };
      const savedClient = { ...client, id: data.client?.id };
      setClientItems((current) => [savedClient, ...current.filter((item) => item.email !== client.email)]);
      setShowClientCreate(false);
      setGalleryClientName(client.name);
      setShowCreate(true);
      return true;
    } catch (error) {
      setClientSaveError(error instanceof Error ? error.message : 'Não foi possível salvar o cliente.');
      return false;
    }
  }

  async function removeGallery(gallery: Gallery) {
    try {

    if (!gallery.id || !window.confirm(`Excluir a galeria “${gallery.title}”? As fotos, seleções e acessos também serão removidos.`)) return;
    setGalleryActionError('');
    const response = await fetch(`/fotos/api/galleries/${gallery.id}`, { method: 'DELETE' });
    if (!response.ok) { setGalleryActionError('Não foi possível excluir a galeria. Tente novamente.'); return; }
    setGalleryItems((current) => current.filter((item) => item.id !== gallery.id));

    } catch { setGalleryActionError('A conexão foi interrompida. Tente novamente.'); }
}

  async function reopenGallerySelection(gallery: Gallery) {
    try {

    if (!gallery.id || !window.confirm(`Liberar “${gallery.title}” para o cliente editar a seleção novamente?`)) return;
    setGalleryActionError('');
    const response = await fetch(`/fotos/api/galleries/${gallery.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reopenSelection: true }) });
    if (!response.ok) { setGalleryActionError('Não foi possível liberar a edição desta galeria. Tente novamente.'); return; }
    setGalleryItems((current) => current.map((item) => item.id === gallery.id ? { ...item, status: 'Em seleção', statusClass: 'active' } : item));

    } catch { setGalleryActionError('A conexão foi interrompida. Tente novamente.'); }
}

  async function linkClientToGallery(gallery: Gallery, clientIds: string[]) {
    try {

    if (!gallery.id) return { ok: false, message: 'Esta galeria não pode ser alterada.' };
    const response = await fetch(`/fotos/api/galleries/${gallery.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientIds }) });
    const data = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) return { ok: false, message: data?.error ?? 'Não foi possível vincular o cliente.' };
    await refreshGalleries(); setLinkGallery(null);
    return { ok: true };

    } catch { return { ok: false as const, message: 'A conexão foi interrompida. Tente novamente.' }; }
}

  async function saveClientCredentials(client: Client, login: string, password: string) {
    try {

    if (!client.id) return { ok: false, message: 'Salve o cliente antes de criar o acesso.' };
    const response = await fetch(`/fotos/api/clients/${client.id}/credentials`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login, password }) });
    const data = await response.json().catch(() => null) as { login?: string; error?: string } | null;
    if (!response.ok) return { ok: false, message: data?.error ?? 'Não foi possível salvar o acesso.' };
    setClientItems((current) => current.map((item) => item.id === client.id ? { ...item, login: data?.login ?? login, hasAccess: true } : item));
    setSelectedClient((current) => current && current.id === client.id ? { ...current, login: data?.login ?? login, hasAccess: true } : current);
    await refreshGalleries(); setCredentialClient(null);
    return { ok: true };

    } catch { return { ok: false as const, message: 'A conexão foi interrompida. Tente novamente.' }; }
}

  const shareLink = shareGallery && shareCredentials ? `${typeof window === 'undefined' ? 'https://lumea.app' : window.location.origin}${shareCredentials.path}` : '';
  const shareMessage = shareGallery && shareCredentials ? `Olá! Sua galeria “${shareGallery.title}” está pronta para seleção.\n\nAcesse: ${shareLink}\nLogin: ${shareCredentials.login}\nSenha: use a senha cadastrada para seu acesso.\n\nO prazo para concluir é de ${shareGallery.due}.` : '';

  async function copy(kind: 'link' | 'message') {
    try { await navigator.clipboard.writeText(kind === 'link' ? shareLink : shareMessage); setCopied(kind); window.setTimeout(() => setCopied(null), 1500); } catch { setShareError('Não foi possível copiar. Selecione o link e copie manualmente.'); }
  }

  return (
    <main className={`app-shell appearance-${studioSettings.appearance}`} style={{ '--brand-color': studioSettings.primaryColor, '--brand-foreground': foreground(studioSettings.primaryColor), '--accent-color': studioSettings.accentColor } as CSSProperties}>
      <header className="site-header">
        <div className="site-header-inner">
        <a className="brand" href="/fotos/fotografo/painel"><BrandLogo tone={studioSettings.appearance === 'dark' ? 'light' : studioSettings.appearance === 'system' ? 'system' : 'dark'} /></a>
        <nav className="nav" aria-label="Navegação principal">{nav.map((item) => <a className={`nav-item ${view === item.view ? 'active' : ''}`} href={item.href} key={item.view}><span className="icon">{item.icon}</span>{item.label}{item.view === 'galleries' && galleryItems.length > 0 && <span className="nav-count">{galleryItems.length}</span>}{item.view === 'orders' && orderItems.filter((order) => order.status === 'pending').length > 0 && <span className="nav-count">{orderItems.filter((order) => order.status === 'pending').length}</span>}</a>)}</nav>
        <div className="header-tools"><a href="/fotos/sair" className="outline-button">Sair</a>{view !== 'settings' && view !== 'reports' && <div className="search"><span>⌕</span><input aria-label="Pesquisar" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>}<button className="icon-button notification" onClick={() => setOperationModal('notifications')} aria-label="Notificações">♢</button><a className="header-profile" href="/fotos/configuracoes"><span className="avatar">{studioSettings.displayName.split(/\s+/).slice(0,2).map((part) => part[0]).join('').toUpperCase()}</span><span><strong>{studioSettings.displayName.split(/\s+/)[0]}</strong><small>{studioSettings.studioName}</small></span></a></div>
        </div>
      </header>
      <section className="workspace">
        <div className="content"><section className="welcome page-heading"><div><p className="eyebrow">{heading.eyebrow}</p><h1>{heading.title}</h1><p>{heading.copy}</p></div><button className="primary-button" onClick={() => view === 'clients' ? setShowClientCreate(true) : view === 'galleries' || view === 'home' ? (setGalleryClientName(''), setShowCreate(true)) : view === 'orders' ? setOperationModal('order') : view === 'deliveries' ? setOperationModal('delivery') : view === 'reports' ? exportReport() : view === 'settings' ? (document.getElementById('settings-form') as HTMLFormElement | null)?.requestSubmit() : undefined}><span>{view === 'reports' ? '⇩' : view === 'settings' ? '✓' : '＋'}</span>{heading.action}</button></section>
          {dataLoading && <p className="panel-status" role="status">Carregando seus dados…</p>}
          {dataError && <p className="access-error" role="alert">{dataError}</p>}
          {view === 'home' && <HomeView galleries={visibleGalleries} onShare={openShare} onViewSelection={setSelectionGallery} />}
          {view === 'galleries' && <GalleriesView galleries={visibleGalleries} onShare={openShare} onViewSelection={setSelectionGallery} onLink={setLinkGallery} onDelete={removeGallery} onUnlock={reopenGallerySelection} onManagePhotos={setUploadGallery} error={galleryActionError} />}
          {view === 'clients' && <ClientsView clients={visibleClients.map((client) => ({ ...client, projects: galleryItems.filter((gallery) => client.id && gallery.clientIds?.includes(client.id)).length, value: money(orderItems.filter((order) => order.clientId === client.id && order.status !== 'cancelled').reduce((sum, order) => sum + order.amountCents, 0)) }))} onSelect={setSelectedClient} saveError={clientSaveError} />}
          {view === 'orders' && <OrdersView items={orderItems.filter((order) => `${order.client} ${order.description}`.toLowerCase().includes(search.toLowerCase()))} onUpdated={refreshRecords} />}
          {view === 'deliveries' && <DeliveriesView items={deliveryItems.filter((delivery) => `${delivery.client} ${delivery.title}`.toLowerCase().includes(search.toLowerCase()))} />}
          {view === 'reports' && <ReportsView orders={orderItems} galleries={galleryItems} clientCount={clientItems.length} />}
          {view === 'settings' && settingsLoaded && <SettingsView settings={studioSettings} onSaved={setStudioSettings} />}
        </div>
      </section>
      {shareGallery && <ShareModal gallery={shareGallery} link={shareLink} login={shareCredentials?.login} password={shareCredentials?.password} loading={shareLoading} error={shareError} copied={copied} onCopy={copy} onClose={() => { setShareGallery(null); setShareCredentials(null); setShareError(''); }} />}
      {selectionGallery && <SelectionModal gallery={selectionGallery} onClose={() => setSelectionGallery(null)} />}
      {linkGallery && <LinkClientModal gallery={linkGallery} clients={clientItems.filter((client) => client.id)} onLink={linkClientToGallery} onClose={() => setLinkGallery(null)} />}
      {showCreate && <CreateModal defaultClient={galleryClientName} clients={clientItems.filter((client) => client.id)} onClose={() => setShowCreate(false)} onCreate={addGallery} />}
      {uploadGallery && <PhotoManager gallery={uploadGallery} compressPhoto={compressPhoto} onClose={() => { setUploadGallery(null); void refreshGalleries().catch(() => setDataError('Não foi possível atualizar a galeria.')); }} />}
      {showClientCreate && <ClientCreateModal onClose={() => setShowClientCreate(false)} onCreate={addClient} />}
      {selectedClient && <ClientDetailsModal client={selectedClient} galleries={galleryItems} onConfigureAccess={() => setCredentialClient(selectedClient)} onClose={() => setSelectedClient(null)} />}
      {credentialClient && <ClientCredentialsModal client={credentialClient} onSave={saveClientCredentials} onClose={() => setCredentialClient(null)} />}
      {operationModal && (operationModal === 'order' || operationModal === 'delivery' ? <RecordModal kind={operationModal} clients={clientItems} galleries={galleryItems} onSaved={refreshRecords} onClose={() => setOperationModal(null)} /> : <OperationModal kind={operationModal} galleries={galleryItems} onClose={() => setOperationModal(null)} />)}
    </main>
  );
}

function HomeView({ galleries: items, onShare, onViewSelection }: { galleries: Gallery[]; onShare: (gallery: Gallery) => void; onViewSelection: (gallery: Gallery) => void }) {
  const selectedCount = items.reduce((total, gallery) => total + gallery.selected, 0);
  const waitingCount = items.filter((gallery) => gallery.statusClass === 'waiting' || gallery.statusClass === 'active').length;
  return <><section className="stats"><article><div className="stat-icon purple">▧</div><div><span>GALERIAS ATIVAS</span><strong>{items.filter((gallery) => gallery.statusClass !== 'done' && gallery.statusClass !== 'expired').length}</strong><small>Em preparação ou seleção</small></div></article><article><div className="stat-icon green">✓</div><div><span>FOTOS SELECIONADAS</span><strong>{selectedCount}</strong><small>Nas galerias da conta</small></div></article><article><div className="stat-icon amber">◷</div><div><span>AGUARDANDO CLIENTE</span><strong>{waitingCount}</strong><small>Acessos ainda em andamento</small></div></article><article><div className="stat-icon blue">↗</div><div><span>FINALIZADAS</span><strong>{items.filter((gallery) => gallery.statusClass === 'done').length}</strong><small>Seleções recebidas</small></div></article></section><section className="section"><div className="section-heading"><div><h2>Galerias recentes</h2><p>Acompanhe as últimas seleções.</p></div><a href="/fotos/galerias">Ver todas →</a></div>{items.length ? <GalleryCards items={items.slice(0, 3)} onShare={onShare} onViewSelection={onViewSelection} /> : <section className="empty-search">Nenhuma galeria criada ainda. Use “Nova galeria” para começar.</section>}</section><section className="bottom-grid"><article className="activity-card"><div className="section-heading compact"><div><h2>Seleções recebidas</h2><p>Galerias finalizadas pelos clientes.</p></div></div><ul>{items.filter((gallery) => gallery.statusClass === 'done').slice(0, 3).map((gallery) => <li key={gallery.slug}><span className="activity-icon selected">♥</span><div><strong>{gallery.client} selecionou {gallery.selected} fotos</strong><p>{gallery.title}</p></div><button onClick={() => onViewSelection(gallery)}>Ver fotos</button></li>)}{!items.some((gallery) => gallery.statusClass === 'done') && <li><div><strong>Nenhuma seleção finalizada ainda</strong><p>As aprovações aparecerão aqui automaticamente.</p></div></li>}</ul></article><article className="tip-card"><span className="tip-icon">✦</span><div><p>PRÓXIMO PASSO</p><h3>Compartilhe com segurança</h3><span>Configure o acesso do cliente e compartilhe o link por WhatsApp ou e-mail.</span><a href="/fotos/galerias">Gerar acesso →</a></div></article></section></>;
}

function GalleriesView({ galleries: items, onShare, onViewSelection, onLink, onDelete, onUnlock, onManagePhotos, error }: { galleries: Gallery[]; onShare: (gallery: Gallery) => void; onViewSelection: (gallery: Gallery) => void; onLink: (gallery: Gallery) => void; onDelete: (gallery: Gallery) => void; onUnlock: (gallery: Gallery) => void; onManagePhotos: (gallery: Gallery) => void; error: string }) {
  const [projectType, setProjectType] = useState<ProjectType>('selection');
  const [filter, setFilter] = useState<'all' | 'selecting' | 'completed' | 'expired'>('all');
  const [newestFirst, setNewestFirst] = useState(true);
  const [layout, setLayout] = useState<'kanban' | 'list'>('list');
  const typedItems = items.filter((gallery) => (gallery.projectType ?? 'selection') === projectType);
  const filtered = typedItems.filter((gallery) => filter === 'all' || filter === 'selecting' && ['active', 'waiting'].includes(gallery.statusClass) || filter === 'completed' && gallery.statusClass === 'done' || filter === 'expired' && gallery.statusClass === 'expired');
  const ordered = newestFirst ? filtered : [...filtered].reverse();
  const completed = typedItems.filter((gallery) => gallery.statusClass === 'done').length;
  const stages = [{ key: 'waiting', label: 'Em preparação' }, { key: 'active', label: 'Em andamento' }, { key: 'expired', label: 'Expirados' }, { key: 'done', label: 'Finalizado' }] as const;
  return <><div className="project-tabs" role="tablist"><button role="tab" aria-selected={projectType === 'selection'} onClick={() => setProjectType('selection')}>♥ Seleção de fotos</button><button role="tab" aria-selected={projectType === 'delivery'} onClick={() => setProjectType('delivery')}>⇩ Entrega <span>Novo</span></button><button role="tab" aria-selected={projectType === 'album'} onClick={() => setProjectType('album')}>▤ Prova de Álbum</button></div><section className="mini-stats"><div><span>{typedItems.filter((gallery) => gallery.statusClass !== 'expired').length}</span><p>Ativos</p></div><div><span>{typedItems.filter((gallery) => gallery.statusClass === 'waiting').length}</span><p>Em preparação</p></div><div><span>{completed}</span><p>Finalizados</p></div><div><span>{typedItems.length ? Math.round(completed / typedItems.length * 100) : 0}%</span><p>Taxa de conclusão</p></div></section>{error && <p className="access-error gallery-action-error" role="alert">{error}</p>}<div className="filter-row project-filter"><div><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Todos</button><button className={filter === 'selecting' ? 'selected' : ''} onClick={() => setFilter('selecting')}>Ativos</button><button className={filter === 'completed' ? 'selected' : ''} onClick={() => setFilter('completed')}>Finalizados</button><button className={filter === 'expired' ? 'selected' : ''} onClick={() => setFilter('expired')}>Expirados</button></div><div className="project-view-actions"><button onClick={() => setNewestFirst((current) => !current)}>⇅ {newestFirst ? 'Recentes' : 'Antigas'}</button><button className={layout === 'kanban' ? 'selected' : ''} onClick={() => setLayout('kanban')} aria-label="Visualização Kanban">▥</button><button className={layout === 'list' ? 'selected' : ''} onClick={() => setLayout('list')} aria-label="Visualização em lista">☷</button></div></div>{ordered.length ? layout === 'list' ? <GalleryCards items={ordered} onShare={onShare} onViewSelection={onViewSelection} onLink={onLink} onDelete={onDelete} onUnlock={onUnlock} onManagePhotos={onManagePhotos} large /> : <div className="project-kanban">{stages.map((stage) => { const stageItems = ordered.filter((gallery) => gallery.statusClass === stage.key); return <section key={stage.key}><header><span>{stage.label}</span><b>{stageItems.length}</b></header><div>{stageItems.length ? stageItems.map((gallery) => <article className="kanban-card" key={gallery.slug}>{gallery.cover ? <img src={gallery.cover} alt="" /> : <div className="gallery-cover-placeholder">▧</div>}<p>{gallery.client}</p><h3><a href={`/fotos/gallery/${gallery.slug}`}>{gallery.title}</a></h3><small>{gallery.total} arquivos • {gallery.selected} selecionadas</small><footer><button onClick={() => onManagePhotos(gallery)}>Gerenciar fotos</button>{gallery.selected > 0 && <button onClick={() => onViewSelection(gallery)}>Ver seleção</button>}<button onClick={() => onShare(gallery)}>Compartilhar</button><button onClick={() => onLink(gallery)}>{gallery.clientIds?.length || gallery.clientId ? 'Gerenciar clientes' : 'Vincular clientes'}</button>{gallery.statusClass === 'done' && <button className="unlock-action" onClick={() => onUnlock(gallery)}>Liberar edição</button>}<button className="danger-action" onClick={() => onDelete(gallery)}>Excluir</button></footer></article>) : <p className="kanban-empty">Nenhum projeto nesta etapa</p>}</div></section>; })}</div> : <section className="empty-search">Nenhum projeto deste tipo encontrado. Clique em “Nova galeria” para criar o primeiro.</section>}</>;
}

function GalleryCards({ items, onShare, onViewSelection, onLink, onDelete, onUnlock, onManagePhotos, large = false }: { items: Gallery[]; onShare: (gallery: Gallery) => void; onViewSelection: (gallery: Gallery) => void; onLink?: (gallery: Gallery) => void; onDelete?: (gallery: Gallery) => void; onUnlock?: (gallery: Gallery) => void; onManagePhotos?: (gallery: Gallery) => void; large?: boolean }) {
  return <div className={`gallery-grid ${large ? 'large-grid' : ''}`}>{items.map((g) => <article className="gallery-card" key={g.slug}><a href={`/fotos/gallery/${g.slug}`}><div className={`cover ${g.cover ? '' : 'empty-cover'}`} style={g.cover ? { backgroundImage: `url(${g.cover})` } : undefined}><span className={`status ${g.statusClass}`}><i />{g.status}</span>{!g.cover && <b>▧</b>}</div><div className="gallery-info"><p>{g.date} • {g.client}</p><h3>{g.title}</h3><div className="gallery-meta"><span>{g.selected} selecionadas</span><span>{g.total} fotos</span></div><div className="gallery-progress"><span style={{ width: `${g.total ? Math.max(8, g.selected / g.total * 100) : 0}%` }} /></div></div></a><div className="gallery-actions">{onManagePhotos && <button onClick={() => onManagePhotos(g)}>Gerenciar fotos</button>}{g.selected > 0 && <button onClick={() => onViewSelection(g)}>♥ Ver seleção</button>}<button onClick={() => onShare(g)}>⌁ Compartilhar</button>{onLink && <button onClick={() => onLink(g)}>{g.clientIds?.length || g.clientId ? 'Gerenciar clientes' : 'Vincular clientes'}</button>}{onUnlock && g.statusClass === 'done' && <button className="unlock-action" onClick={() => onUnlock(g)}>Liberar edição</button>}{onDelete && <button className="danger-action" onClick={() => onDelete(g)}>Excluir</button>}</div></article>)}</div>;
}

function ClientsView({ clients: items, onSelect, saveError }: { clients: Client[]; onSelect: (client: Client) => void; saveError: string }) {
  return <>{saveError && <p className="access-error" role="alert">{saveError}</p>}<section className="client-summary"><article><span>CLIENTES ATIVOS</span><strong>{items.length}</strong><small>Cadastros visíveis nesta conta</small></article><article><span>ACESSOS CONFIGURADOS</span><strong>{items.filter((client) => client.hasAccess).length}</strong><small>Clientes com login e senha</small></article><article><span>GALERIAS VINCULADAS</span><strong>{items.reduce((sum, client) => sum + client.projects, 0)}</strong><small>Vínculos com os clientes</small></article></section><section className="data-card"><div className="table-toolbar"><div><h2>Todos os clientes</h2><p>Clique em um cliente para ver galerias e seleções</p></div></div><div className="client-list">{items.map((c) => <article className="clickable-client" key={c.email} onClick={() => onSelect(c)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(c); } }}><div className={`client-avatar ${c.tone}`}>{c.initials}</div><div className="client-name"><strong>{c.name}</strong><span>{c.email}</span>{c.hasAccess && <small className="access-badge">Acesso: {c.login}</small>}</div><div><span className="cell-label">TELEFONE</span><strong>{c.phone}</strong></div><div><span className="cell-label">TRABALHOS</span><strong>{c.projects}</strong></div><div><span className="cell-label">VALOR TOTAL</span><strong>{c.value}</strong></div><div><span className="cell-label">ÚLTIMA ATIVIDADE</span><strong>{c.last}</strong></div><span aria-hidden="true">→</span></article>)}</div></section></>;
}

function SettingsView({ settings, onSaved }: { settings: StudioSettings; onSaved: (settings: StudioSettings) => void }) {
  const [draft, setDraft] = useState(settings);
  const [section, setSection] = useState<'appearance' | 'profile' | 'account' | 'plans' | 'storage'>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('drive') ? 'storage' : 'appearance');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  function update<K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) { setDraft((current) => ({ ...current, [key]: value })); }
  async function save(event: FormEvent<HTMLFormElement>) {
    if (section === 'storage') { event.preventDefault(); document.getElementById('drive-config-save')?.click(); return; }
    try {

    event.preventDefault(); setSaving(true); setMessage('');
    if (section === 'account') {
      const form = new FormData(event.currentTarget);
      const newPassword = String(form.get('newPassword') ?? '');
      const confirmPassword = String(form.get('confirmPassword') ?? '');
      if (newPassword !== confirmPassword) { setMessage('A nova senha e a confirmação precisam ser iguais.'); return; }
      const response = await fetch('/fotos/api/photographer/credentials', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: String(form.get('accountEmail') ?? ''), currentPassword: String(form.get('currentPassword') ?? ''), newPassword, confirmPassword }) });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (response.ok) window.location.assign('/fotos/fotografo?alterado=1');
      else setMessage(data?.error ?? 'Não foi possível atualizar o acesso.');
      return;
    }
    const response = await fetch('/fotos/api/settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft) });
    const data = await response.json().catch(() => null) as { settings?: StudioSettings; error?: string } | null;
    if (response.ok && data?.settings) { onSaved(data.settings); setDraft(data.settings); setMessage('Configurações salvas com sucesso.'); }
    else setMessage(data?.error ?? 'Não foi possível salvar as configurações.');
    setSaving(false);

    } catch { setMessage('A conexão foi interrompida. Tente novamente.'); } finally { setSaving(false); }
}
  return <form id="settings-form" className="settings-layout" onSubmit={save}>
    <aside className="settings-nav"><p>CONFIGURAÇÕES</p><button type="button" className={section === 'appearance' ? 'active' : ''} onClick={() => setSection('appearance')}><span>◐</span><div><strong>Aparência</strong><small>Cores e tema</small></div></button><button type="button" className={section === 'profile' ? 'active' : ''} onClick={() => setSection('profile')}><span>◎</span><div><strong>Perfil</strong><small>Nome e estúdio</small></div></button><button type="button" className={section === 'account' ? 'active' : ''} onClick={() => setSection('account')}><span>♢</span><div><strong>Conta e login</strong><small>E-mail e segurança</small></div></button><button type="button" className={section === 'storage' ? 'active' : ''} onClick={() => setSection('storage')}><span>☁</span><div><strong>Google Drive</strong><small>Armazenamento das fotos</small></div></button><button type="button" className={section === 'plans' ? 'active' : ''} onClick={() => setSection('plans')}><span>✦</span><div><strong>Recursos</strong><small>Ferramentas da conta</small></div></button></aside>
    <section className="settings-panel">
      {section === 'appearance' && <><div className="settings-title"><span>◐</span><div><h2>Aparência do site</h2><p>Escolha as cores usadas nos botões, destaques e elementos de seleção.</p></div></div><div className={`theme-preview theme-preview-${draft.appearance}`} style={{ '--preview-primary': draft.primaryColor, '--preview-foreground': foreground(draft.primaryColor), '--preview-accent': draft.accentColor, '--preview-accent-foreground': foreground(draft.accentColor) } as CSSProperties}><div><BrandLogo tone={draft.appearance === 'dark' ? 'light' : draft.appearance === 'system' ? 'system' : 'dark'} /><strong>{draft.studioName}</strong></div><h3>Sua galeria, com sua identidade.</h3><button type="button">Botão principal</button><i>Foto selecionada</i></div><div className="settings-fields color-fields"><label>Cor principal<div><input type="color" value={/^#[0-9a-f]{6}$/i.test(draft.primaryColor) ? draft.primaryColor : '#6f4cc3'} onChange={(event) => update('primaryColor', event.target.value)} /><input value={draft.primaryColor} onChange={(event) => update('primaryColor', event.target.value)} pattern="#[0-9a-fA-F]{6}" /></div></label><label>Cor de seleção<div><input type="color" value={/^#[0-9a-f]{6}$/i.test(draft.accentColor) ? draft.accentColor : '#a95072'} onChange={(event) => update('accentColor', event.target.value)} /><input value={draft.accentColor} onChange={(event) => update('accentColor', event.target.value)} pattern="#[0-9a-fA-F]{6}" /></div></label></div><fieldset className="appearance-options"><legend>Tema do painel</legend>{(['light','dark','system'] as const).map((value) => <label key={value} className={draft.appearance === value ? 'selected' : ''}><input type="radio" name="appearance" checked={draft.appearance === value} onChange={() => update('appearance', value)} /><span>{value === 'light' ? 'Claro' : value === 'dark' ? 'Escuro' : 'Automático'}</span><small>{value === 'system' ? 'Segue o computador' : `Interface em modo ${value === 'light' ? 'claro' : 'escuro'}`}</small></label>)}</fieldset></>}
      {section === 'profile' && <><div className="settings-title"><span>◎</span><div><h2>Perfil profissional</h2><p>Esses dados identificam você no painel e nas galerias.</p></div></div><div className="profile-editor"><div className="profile-photo-preview">{draft.displayName.split(/\s+/).slice(0,2).map((part) => part[0]).join('').toUpperCase()}</div><small>As iniciais acompanham o nome do perfil.</small></div><div className="settings-fields"><label>Seu nome<input value={draft.displayName} onChange={(event) => update('displayName', event.target.value)} required /></label><label>Nome do estúdio<input value={draft.studioName} onChange={(event) => update('studioName', event.target.value)} required /></label><label>E-mail de contato<input type="email" value={draft.loginEmail} onChange={(event) => update('loginEmail', event.target.value)} /></label></div></>}
      {section === 'account' && <PhotographerCredentials email={settings.authenticationEmail ?? ''} />}
      {section === 'storage' && <DriveSettings />}
      {section === 'plans' && <><div className="settings-title"><span>✦</span><div><h2>Recursos da conta</h2><p>Galerias, seleção de fotografias, provas de álbum e entregas protegidas.</p></div></div><p className="modal-copy">Gerencie as galerias, clientes e arquivos pelo painel. Não há cobrança de assinatura configurada nesta instalação.</p></>}

      {section !== 'storage' && <footer className="settings-footer"><span className={message.includes('sucesso') ? 'success' : ''}>{message}</span><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Salvando…' : section === 'account' ? 'Salvar login e senha' : 'Salvar alterações'}</button></footer>}
    </section>
  </form>;
}

function ShareModal({ gallery, link, login, password, loading, error, copied, onCopy, onClose }: { gallery: Gallery; link: string; login?: string; password?: string; loading: boolean; error: string; copied: 'link' | 'message' | null; onCopy: (kind: 'link' | 'message') => void; onClose: () => void }) {
  const ready = Boolean(link && login && password);
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="share-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose}>×</button><span className="share-symbol">⌁</span><p className="eyebrow">ACESSO DO CLIENTE</p><h2>Compartilhar galeria</h2><p className="modal-copy">Envie o link e as credenciais abaixo. O cliente verá apenas esta galeria.</p><div className="share-gallery"><img src={gallery.cover} alt="" /><div><strong>{gallery.title}</strong><span>{gallery.client} • prazo de {gallery.due}</span></div></div>{loading && <div className="share-loading">Preparando o acesso do cliente…</div>}{error && <p className="access-error" role="alert">{error}</p>}{ready && <><label>Link exclusivo<div className="copy-field"><span>{link}</span><button onClick={() => onCopy('link')}>{copied === 'link' ? 'Copiado ✓' : 'Copiar'}</button></div></label><div className="credential-grid"><label>Login<div><strong>{login}</strong></div></label><label>Senha<div><strong>{password}</strong></div></label></div><div className="security-note"><span>♢</span><p><strong>Acesso protegido</strong>O acesso respeita todas as galerias vinculadas ao cliente.</p></div><button className="whatsapp-button" onClick={() => onCopy('message')}>{copied === 'message' ? 'Mensagem copiada ✓' : 'Copiar mensagem para WhatsApp'}</button><a className="preview-link" href={`/fotos/cliente/${gallery.slug}`}>Ver como o cliente verá →</a></>}</section></div>;
}

function SelectionModal({ gallery, onClose }: { gallery: Gallery; onClose: () => void }) {
  const photos = gallery.selectedPhotos ?? [];
  const [display, setDisplay] = useState<'images' | 'names'>('images');
  const [platform, setPlatform] = useState<'lightroom' | 'capture' | 'windows' | 'mac'>('lightroom');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [normalized, setNormalized] = useState(false);
  const filenames = photos.map((photo) => normalized ? photo.filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_') : photo.filename);
  const stems = filenames.map((filename) => filename.replace(/\.[^.]+$/, ''));
  const code = platform === 'windows'
    ? stems.map((name) => `"${name}."`).join(' OR ')
    : platform === 'lightroom'
      ? stems.map((name) => `${name}.`).join(',')
      : platform === 'capture'
        ? stems.join(' ')
        : stems.map((name) => `${name}.`).join(' OR ');
  const finalized = gallery.selectionFinalizedAt
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(gallery.selectionFinalizedAt))
    : 'Data não registrada';
  const platformCopy = {
    lightroom: { title: 'Adobe Lightroom', text: 'Na Biblioteca, abra Filtro → Texto, escolha “Nome do arquivo” e cole a sequência separada por vírgulas no campo de busca.' },
    capture: { title: 'Capture One', text: 'Copie a sequência separada por espaços e cole no campo de busca da pasta onde estão os arquivos originais, JPG ou RAW.' },
    windows: { title: 'Microsoft Windows', text: 'Copie o código com nomes entre aspas e operadores OR. Cole na busca do Explorador de Arquivos dentro da pasta das fotos.' },
    mac: { title: 'Apple macOS', text: 'Copie o código com operadores OR e cole na busca do Finder dentro da pasta das fotos originais.' },
  }[platform];
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyError('');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError('Não foi possível copiar automaticamente. Selecione e copie o texto abaixo.');
    }
  }
  return <div className="modal-backdrop selection-workspace-backdrop" onMouseDown={onClose}><section className="selection-workspace" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Fechar">×</button><header className="selection-workspace-header"><div><p className="eyebrow">{gallery.statusClass === 'done' ? 'SELEÇÃO FINALIZADA' : 'SELEÇÃO EM ANDAMENTO'}</p><h2><strong>{gallery.selected}</strong> fotos selecionadas</h2></div><dl><div><dt>Finalizada em</dt><dd>{finalized}</dd></div><div><dt>Fotos na galeria</dt><dd>{gallery.total}</dd></div></dl><dl><div><dt>Cliente</dt><dd>{gallery.client}{gallery.clientEmail ? <small>{gallery.clientEmail}</small> : null}</dd></div><div><dt>Galeria</dt><dd>{gallery.title}</dd></div></dl></header>{gallery.selectionMessage && <div className="selection-client-message"><strong>Mensagem do cliente</strong><p>{gallery.selectionMessage}</p></div>}<div className="selection-workspace-body"><section className="selection-files"><nav><button className={display === 'images' ? 'active' : ''} onClick={() => setDisplay('images')}>▦ Imagens e nomes</button><button className={display === 'names' ? 'active' : ''} onClick={() => setDisplay('names')}>▤ Nome dos arquivos</button><button onClick={() => window.print()}>▣ Imprimir seleção</button></nav>{display === 'images' ? <div className="selection-file-grid">{photos.map((photo) => <article key={photo.id}><img src={photo.src} alt={photo.filename} /><strong>{photo.filename}</strong>{photo.comment && <p className="photo-comment">{photo.comment}</p>}</article>)}</div> : <ol className="selection-name-list">{filenames.map((filename) => <li key={filename}>{filename}</li>)}</ol>}{!photos.length && <div className="empty-search">As fotos selecionadas não puderam ser carregadas. Atualize o painel e tente novamente.</div>}</section><aside className="selection-separator"><p className="eyebrow">FLUXO DE PÓS-PRODUÇÃO</p><h3>Separe as fotos no seu computador</h3><div className="selection-platform-tabs"><button className={platform === 'lightroom' ? 'active' : ''} onClick={() => setPlatform('lightroom')}>Lightroom</button><button className={platform === 'capture' ? 'active' : ''} onClick={() => setPlatform('capture')}>Capture One</button><button className={platform === 'windows' ? 'active' : ''} onClick={() => setPlatform('windows')}>Windows</button><button className={platform === 'mac' ? 'active' : ''} onClick={() => setPlatform('mac')}>macOS</button></div><div className="selection-instructions"><strong>{platformCopy.title}</strong><p>{platformCopy.text}</p></div><p className="selection-normalize-note">Se algum nome tiver acentos ou caracteres especiais, gere uma versão compatível antes de copiar.</p><button className="normalize-button" onClick={() => setNormalized((current) => !current)}>{normalized ? 'Usar nomes originais' : 'Corrigir caracteres especiais'}</button><div className="selection-code-heading"><strong>Código da seleção</strong><button onClick={copyCode}>{copied ? 'Copiado ✓' : 'Copiar código'}</button></div>{copyError && <p className="access-error" role="alert">{copyError}</p>}<textarea readOnly value={code} aria-label="Código com os nomes dos arquivos selecionados" /></aside></div><footer><a href={`/fotos/gallery/${gallery.slug}`}>Abrir galeria completa</a><button className="primary-button" onClick={onClose}>Fechar</button></footer></section></div>;
}

function ClientCreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (client: Client) => Promise<boolean> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name')); const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
    if (saving) return;
    setSaving(true); setError('');
    try {
      const ok = await onCreate({ name, email: String(data.get('email')), phone: String(data.get('phone')), country: String(data.get('country')), language: String(data.get('language')), notes: String(data.get('notes') ?? ''), projects: 0, value: 'R$ 0', last: 'agora', initials, tone: 'violet' });
      if (!ok) setError('Não foi possível cadastrar o cliente. Confira os dados e tente novamente.');
    } finally { setSaving(false); }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="create-modal client-create-modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Fechar">×</button><p className="eyebrow">NOVO CONTATO</p><h2>Cadastrar cliente</h2><p className="modal-copy">Depois do cadastro, você poderá criar o álbum e enviar o acesso por link ou WhatsApp.</p><form onSubmit={submit}><label>Nome completo<input name="name" required placeholder="Ex.: Juliana Ferreira" autoFocus /></label><label>E-mail<input name="email" type="email" required placeholder="cliente@exemplo.com" /></label><div className="form-row"><label>País<select name="country" defaultValue="Brasil (+55)"><option>Brasil (+55)</option><option>Portugal (+351)</option><option>Estados Unidos (+1)</option><option>Outro</option></select></label><label>WhatsApp<input name="phone" required placeholder="(11) 99999-9999" /></label></div><label>Idioma<select name="language" defaultValue="Português (BR)"><option>Português (BR)</option><option>Português (PT)</option><option>English</option><option>Español</option></select></label><label>Observações <small>opcional</small><textarea name="notes" maxLength={300} placeholder="Ex.: Prefere contato pelo WhatsApp, álbum 30×30…" /></label><small className="required-note">Os campos marcados como obrigatórios precisam ser preenchidos.</small><div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button>{error && <p className="access-error" role="alert">{error}</p>}<button className="primary-button" disabled={saving} type="submit">{saving ? 'Cadastrando…' : 'Cadastrar e criar galeria →'}</button></div></form></section></div>;
}

function ClientDetailsModal({ client, galleries: galleryItems, onConfigureAccess, onClose }: { client: Client; galleries: Gallery[]; onConfigureAccess: () => void; onClose: () => void }) {
  const clientGalleries = galleryItems.filter((gallery) => client.id ? gallery.clientIds?.includes(client.id) || gallery.clientId === client.id : gallery.client === client.name);
  const portalPath = clientGalleries[0] ? `/fotos/cliente/${clientGalleries[0].slug}` : null;
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="client-detail-modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><header><div className={`client-avatar ${client.tone}`}>{client.initials}</div><div><p className="eyebrow">DETALHES DO CLIENTE</p><h2>{client.name}</h2><span>{client.email} • {client.phone}</span></div></header><div className={`client-access-status ${client.hasAccess ? 'ready' : ''}`}><span>{client.hasAccess ? '✓' : '⌁'}</span><div><strong>{client.hasAccess ? `Acesso ativo: ${client.login}` : 'Login ainda não configurado'}</strong><small>A mesma credencial permite entrar em todas as galerias vinculadas a este cliente.</small></div><button onClick={onConfigureAccess}>{client.hasAccess ? 'Alterar login e senha' : 'Configurar login e senha'}</button></div><div className="client-detail-stats"><div><span>TRABALHOS</span><strong>{clientGalleries.length}</strong></div><div><span>FOTOS ESCOLHIDAS</span><strong>{clientGalleries.reduce((total, gallery) => total + gallery.selected, 0)}</strong></div><div><span>VALOR TOTAL</span><strong>{client.value}</strong></div></div><section className="client-selections"><div className="section-heading"><div><h3>Galerias e seleções</h3><p>Acompanhe o progresso deste cliente.</p></div></div>{clientGalleries.length ? clientGalleries.map((gallery) => <article key={gallery.slug}>{gallery.cover ? <img src={gallery.cover} alt="" /> : <div className="client-gallery-placeholder">▧</div>}<div><strong>{gallery.title}</strong><span>{gallery.selected} de {gallery.total} fotos selecionadas</span><div className="gallery-progress"><span style={{ width: `${gallery.total ? gallery.selected / gallery.total * 100 : 0}%` }} /></div></div><span className={`pill ${gallery.statusClass === 'done' ? 'green' : gallery.statusClass === 'active' ? 'violet' : 'amber'}`}>{gallery.status}</span><a href={`/fotos/gallery/${gallery.slug}`}>Ver seleção →</a></article>) : <div className="no-client-gallery"><span>▧</span><p><strong>Nenhuma galeria vinculada</strong>Crie uma galeria e selecione este cliente para começar.</p></div>}</section><footer>{portalPath ? <a href={portalPath}>⌁ Abrir portal do cliente</a> : <span /> }<button onClick={onClose}>Fechar</button></footer></section></div>;
}

function CreateModal({ defaultClient, clients: clientOptions, onClose, onCreate }: { defaultClient: string; clients: Client[]; onClose: () => void; onCreate: (values: { name: string; clientIds: string[]; projectType: ProjectType; category: string; eventDate: string; deadline: string; watermarkEnabled: boolean }) => Promise<{ ok: boolean; message?: string }> }) {
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [projectType, setProjectType] = useState<ProjectType>('selection');
  const [category, setCategory] = useState('Ensaio');
  const [customCategory, setCustomCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    try {

    event.preventDefault();
    setSaving(true); setError('');
    const data = new FormData(event.currentTarget);
    const result = await onCreate({ name: String(data.get('name')), clientIds: data.getAll('clientIds').map(String), projectType, category: category === 'Outro' ? customCategory || 'Outro' : category, eventDate: String(data.get('eventDate') ?? ''), deadline: String(data.get('deadline')), watermarkEnabled: false });
    if (!result.ok) setError(result.message ?? 'Não foi possível criar a galeria.');
    setSaving(false);

    } catch { setError('A conexão foi interrompida. Tente novamente.'); } finally { setSaving(false); }
}
  if (step === 'type') return <div className="modal-backdrop" onMouseDown={onClose}><section className="create-modal project-type-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Fechar">×</button><p className="eyebrow">NOVO PROJETO</p><h2>O que você deseja criar?</h2><p className="modal-copy">Escolha o tipo de experiência que será enviada ao cliente.</p><div className="project-type-options"><button className={projectType === 'selection' ? 'selected' : ''} onClick={() => setProjectType('selection')}><span>♥</span><div><strong>Seleção e Venda</strong><small>O cliente escolhe as fotos e envia a seleção.</small></div></button><button className={projectType === 'delivery' ? 'selected' : ''} onClick={() => setProjectType('delivery')}><span>⇩</span><div><strong>Entrega</strong><small>Entrega das fotografias na resolução enviada.</small></div></button><button className={projectType === 'album' ? 'selected' : ''} onClick={() => setProjectType('album')}><span>▤</span><div><strong>Prova de Álbum</strong><small>Revisão, comentários e aprovação das páginas do álbum.</small></div></button></div><div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="button" className="primary-button" onClick={() => setStep('details')}>Continuar →</button></div></section></div>;
  const labels = projectType === 'selection' ? { eyebrow: 'SELEÇÃO E VENDA', title: 'Criar galeria de seleção', placeholder: 'Ex.: Casamento de Ana & Caio' } : projectType === 'delivery' ? { eyebrow: 'ENTREGA', title: 'Criar galeria de entrega', placeholder: 'Ex.: Entrega final — Ana & Caio' } : { eyebrow: 'PROVA DE ÁLBUM', title: 'Criar prova de álbum', placeholder: 'Ex.: Álbum — Ana & Caio' };
  const categories = ['Casamento', 'Ensaio', 'Formatura', 'Aniversário', 'Newborn', 'Batizado', 'Esporte', 'Outro'];
  const defaultClientId = clientOptions.find((client) => client.name === defaultClient)?.id ?? '';
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="create-modal gallery-details-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Fechar">×</button><p className="eyebrow">{labels.eyebrow}</p><h2>{labels.title}</h2><p className="modal-copy">Organize o trabalho agora para encontrar as imagens com facilidade depois.</p><form onSubmit={submit}><label>Nome do evento ou álbum<input name="name" required placeholder={labels.placeholder} autoFocus /></label><fieldset className="category-field"><legend>Categoria</legend><div>{categories.map((item) => <button type="button" key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item === 'Outro' ? '+ Criar novo' : item}</button>)}</div>{category === 'Outro' && <input value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} placeholder="Nome da nova categoria" required />}</fieldset><div className="form-row"><label>Data do evento <small>opcional</small><input name="eventDate" type="date" /></label><label>Prazo para o cliente<input name="deadline" required type="date" /></label></div><fieldset className="client-picker"><legend>Clientes com acesso <small>selecione um ou mais</small></legend>{clientOptions.map((client) => <label key={client.id}><input type="checkbox" name="clientIds" value={client.id} defaultChecked={client.id === defaultClientId} /><span><strong>{client.name}</strong><small>{client.email}</small></span></label>)}</fieldset>{!clientOptions.length && <p className="access-error">Cadastre um cliente antes de criar a galeria.</p>}{error && <p className="access-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" onClick={() => setStep('type')}>Voltar</button><button type="submit" className="primary-button" disabled={saving || !clientOptions.length}>{saving ? 'Criando…' : 'Avançar para os arquivos →'}</button></div></form></section></div>;
}

function LinkClientModal({ gallery, clients: clientOptions, onLink, onClose }: { gallery: Gallery; clients: Client[]; onLink: (gallery: Gallery, clientIds: string[]) => Promise<{ ok: boolean; message?: string }>; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    try {

    event.preventDefault(); setSaving(true); setError('');
    const data = new FormData(event.currentTarget);
    const result = await onLink(gallery, data.getAll('clientIds').map(String));
    if (!result.ok) setError(result.message ?? 'Não foi possível vincular o cliente.');
    setSaving(false);

    } catch { setError('A conexão foi interrompida. Tente novamente.'); } finally { setSaving(false); }
}
  const linkedIds = gallery.clientIds?.length ? gallery.clientIds : gallery.clientId ? [gallery.clientId] : [];
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="create-modal link-client-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Fechar">×</button><p className="eyebrow">ACESSOS DA GALERIA</p><h2>Vincular clientes</h2><p className="modal-copy">Escolha todas as pessoas que poderão acessar “{gallery.title}”. Cada uma usará o próprio login e senha.</p><form onSubmit={submit}><fieldset className="client-picker"><legend>Clientes vinculados</legend>{clientOptions.map((client) => <label key={client.id}><input type="checkbox" name="clientIds" value={client.id} defaultChecked={Boolean(client.id && linkedIds.includes(client.id))} /><span><strong>{client.name}</strong><small>{client.email} • {client.hasAccess ? `acesso ${client.login}` : 'sem login configurado'}</small></span></label>)}</fieldset>{!clientOptions.length && <p className="access-error">Nenhum cliente cadastrado. Acesse Clientes e crie o primeiro cadastro.</p>}{error && <p className="access-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving || !clientOptions.length}>{saving ? 'Salvando…' : 'Salvar clientes'}</button></div></form></section></div>;
}

function ClientCredentialsModal({ client, onSave, onClose }: { client: Client; onSave: (client: Client, login: string, password: string) => Promise<{ ok: boolean; message?: string }>; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    try {

    event.preventDefault(); setSaving(true); setError('');
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') ?? '');
    if (password !== String(data.get('confirmPassword') ?? '')) { setError('As duas senhas precisam ser iguais.'); setSaving(false); return; }
    const result = await onSave(client, String(data.get('login') ?? ''), password);
    if (!result.ok) setError(result.message ?? 'Não foi possível salvar o acesso.');
    setSaving(false);

    } catch { setError('A conexão foi interrompida. Tente novamente.'); } finally { setSaving(false); }
}
  const suggestedLogin = client.login ?? client.email.split('@')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9._-]/g, '.');
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="create-modal credentials-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Fechar">×</button><span className="access-lock">⌁</span><p className="eyebrow">ACESSO DO CLIENTE</p><h2>Login e senha de {client.name}</h2><p className="modal-copy">Estas credenciais funcionarão em todas as galerias vinculadas a este cliente.</p><form onSubmit={submit}><label>Login<input name="login" defaultValue={suggestedLogin} minLength={4} pattern="[a-zA-Z0-9._-]+" autoComplete="off" required /></label><div className="form-row"><label>Nova senha<input name="password" type={showPassword ? 'text' : 'password'} minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" required /></label><label>Confirmar senha<input name="confirmPassword" type={showPassword ? 'text' : 'password'} minLength={8} autoComplete="new-password" required /></label></div><label className="check-label"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Mostrar senha enquanto digito</label><div className="security-note"><span>♢</span><p><strong>Senha protegida</strong>A senha é armazenada de forma segura e não poderá ser visualizada depois. Você poderá redefini-la quando precisar.</p></div>{error && <p className="access-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Salvando…' : 'Salvar acesso'}</button></div></form></section></div>;
}

function OperationModal({ kind, galleries, onClose }: { kind: 'help' | 'notifications' | 'plan' | 'report'; galleries: Gallery[]; onClose: () => void }) {
  const completed = galleries.filter((gallery) => gallery.statusClass === 'done');
  const content = kind === 'help' ? { title: 'Como começar', copy: 'Cadastre um cliente, configure seu acesso, crie uma galeria e envie as fotografias. Depois, compartilhe o link com o cliente.' } : kind === 'notifications' ? { title: 'Seleções recebidas', copy: completed.length ? completed.map((gallery) => gallery.client + ' finalizou ' + gallery.title + ' (' + gallery.selected + ' fotos)').join(' • ') : 'Nenhuma seleção finalizada até agora.' } : kind === 'report' ? { title: 'Relatório exportado', copy: 'O arquivo CSV contém os dados registrados na sua conta.' } : { title: 'Uso da conta', copy: galleries.reduce((sum, gallery) => sum + gallery.total, 0) + ' fotografias em ' + galleries.length + ' galerias.' };
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="create-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Fechar" onClick={onClose}>×</button><h2>{content.title}</h2><p className="modal-copy">{content.copy}</p><button className="primary-button" onClick={onClose}>Entendi</button></section></div>;
}

