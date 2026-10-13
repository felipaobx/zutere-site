'use client';

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import BrandLogo from '../../brand-logo';

type GalleryPhoto = { id: string; src: string; filename: string };

function SelectionIcon({ filled = false }: { filled?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="m8 12 2.6 2.6L16 9" fill="none" stroke="currentColor" strokeWidth={filled ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function MagnifyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m15.5 15.5 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function HeartIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>;
}

export default function GalleryClient({ title, slug, initialPhotos, initialCoverUrl, initialSelectedPhotoIds = [], initialSelectionCompleted = false, initialCanEditCompleted = false, initialProjectType, clientMode = false, clientName = 'Cliente' }: { title: string; slug?: string; initialPhotos?: GalleryPhoto[]; initialCoverUrl?: string; initialSelectedPhotoIds?: string[]; initialSelectionCompleted?: boolean; initialCanEditCompleted?: boolean; initialProjectType?: string; clientMode?: boolean; clientName?: string }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos ?? []);
  const [loadingPhotos, setLoadingPhotos] = useState(clientMode);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedPhotoIds));
  const [filter, setFilter] = useState<'all' | 'selected'>('all');
  const [layout, setLayout] = useState<'story' | 'grid' | 'album'>(initialProjectType === 'album' ? 'album' : 'story');
  const [photoSize, setPhotoSize] = useState<'large' | 'medium'>('large');
  const [showPhotoDetails, setShowPhotoDetails] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const [heartBurst, setHeartBurst] = useState<{ id: number; photoId: string; x: number; y: number; selected: boolean } | null>(null);
  const heartBurstSequence = useRef(0);
  const [reviewing, setReviewing] = useState(false);
  const [finished, setFinished] = useState(false);
  const confirmationHeading = useRef<HTMLHeadingElement | null>(null);
  const [selectionSaving, setSelectionSaving] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const [selectionCompleted, setSelectionCompleted] = useState(initialSelectionCompleted);
  const [canEditCompleted, setCanEditCompleted] = useState(initialCanEditCompleted);
  const [selectionUpdating, setSelectionUpdating] = useState(false);
  const [selectionLoaded, setSelectionLoaded] = useState(!slug);
  const selectionBusy = useRef(false);
  const selectionLocked = selectionCompleted && !canEditCompleted && initialProjectType !== 'delivery';
  const [commentDraft, setCommentDraft] = useState<{ photoId: string | null; text: string }>({ photoId: null, text: '' });
  const [comments, setComments] = useState<Record<string, string>>({});
  const comment = commentDraft.photoId === opened ? commentDraft.text : opened ? comments[opened] ?? '' : '';
  function setComment(text: string) { setCommentDraft({ photoId: opened, text }); }
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [canDownload, setCanDownload] = useState(false);
  const isDelivery = initialProjectType === 'delivery';
  const [savedCommentPhoto, setSavedCommentPhoto] = useState<string | null>(null);
  const savedComment = opened !== null && savedCommentPhoto === opened;
  function setSavedComment(saved: boolean) { setSavedCommentPhoto(saved ? opened : null); }
  const [showWelcome, setShowWelcome] = useState(clientMode);
  const [showInfo, setShowInfo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [photoRatios, setPhotoRatios] = useState<Record<string, number>>({});
  const [reviewMessage, setReviewMessage] = useState('');
  const [playing, setPlaying] = useState(false);
  const galleryStart = useRef<HTMLElement | null>(null);
  const photoDialog = useRef<HTMLDivElement | null>(null);
  const reviewDialog = useRef<HTMLElement | null>(null);
  const welcomeDialog = useRef<HTMLElement | null>(null);
  const isOverlayOpen = reviewing || showWelcome;
  const isPhotoOpen = opened !== null;
  const visible = useMemo(() => filter === 'selected' ? photos.filter((photo) => selected.has(photo.id)) : photos, [filter, selected, photos]);
  const activePhoto = opened === null ? null : photos.find((photo) => photo.id === opened) ?? null;

  async function saveSelection(next: Set<string>) {
    if (isDelivery || selectionLocked || selectionBusy.current || selectionSaving || !selectionLoaded) return;
    const previous = selected;
    setSelected(next); setSelectionError('');
    if (!slug) return;
    selectionBusy.current = true; setSelectionUpdating(true);
    try {
      const response = await fetch(`/fotos/api/gallery/${slug}/selection`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photoIds: [...next] }) });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? 'Não foi possível salvar a seleção.');
    } catch (error) {
      setSelected(previous);
      setSelectionError(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      selectionBusy.current = false; setSelectionUpdating(false);
    }
  }
  function toggle(id: string) { const next = new Set(selected); if (next.has(id)) next.delete(id); else next.add(id); void saveSelection(next); }
  function rememberPhotoRatio(id: string, width: number, height: number) {
    if (!width || !height) return;
    const ratio = width / height;
    setPhotoRatios((current) => current[id] === ratio ? current : { ...current, [id]: ratio });
  }
  function move(direction: number) { if (opened === null) return; const index = photos.findIndex((p) => p.id === opened); setOpened(photos[(index + direction + photos.length) % photos.length].id); setComment(''); setSavedComment(false); }
  function toggleAll() { void saveSelection(selected.size === photos.length ? new Set() : new Set(photos.map((photo) => photo.id))); }
  async function savePhotoComment() {
    if (!slug || !activePhoto || commentSaving || selectionLocked) return;
    const photoId = activePhoto.id; const text = comment;
    setCommentSaving(true); setCommentError('');
    try {
      const response = await fetch(`/fotos/api/gallery/${slug}/comments`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photoId, comment: text }) });
      const data = await response.json() as { error?: string; comment?: string };
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível salvar o comentário.');
      setComments((current) => ({ ...current, [photoId]: data.comment ?? text })); setSavedCommentPhoto(photoId);
    } catch (cause) { setCommentError(cause instanceof Error ? cause.message : 'Não foi possível conectar. Tente novamente.'); }
    finally { setCommentSaving(false); }
  }
  async function submitSelection() {
    if (!slug || !selected.size || selectionLocked || selectionBusy.current || selectionSaving || !selectionLoaded) return;
    setSelectionSaving(true); setSelectionError('');
    try {
      const response = await fetch(`/fotos/api/gallery/${slug}/selection`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ photoIds: [...selected], message: reviewMessage }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? 'Não foi possível enviar a seleção.');
      setReviewing(false); setOpened(null); setPlaying(false); setSelectionCompleted(true); setFinished(true);
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : 'Não foi possível enviar a seleção. Tente novamente.');
    } finally {
      setSelectionSaving(false);
    }
  }
  useEffect(() => {
    if (!slug) return;
    fetch(`/fotos/api/gallery/${slug}/photos`).then(async (response) => {
      if (!response.ok) throw new Error('Não foi possível carregar as fotos.');
      const data = await response.json() as { photos: GalleryPhoto[]; coverUrl?: string | null; canDownload?: boolean };
      setPhotos(data.photos);
      setCoverUrl(data.coverUrl ?? data.photos[0]?.src ?? '');
      setCanDownload(Boolean(data.canDownload));
    }).catch(() => setSelectionError('Não foi possível carregar as fotos. Recarregue a página para tentar novamente.')).finally(() => setLoadingPhotos(false));
  }, [clientMode, slug]);
  useEffect(() => {
    if (!slug) return;
    fetch(`/fotos/api/gallery/${slug}/selection`).then(async (response) => {
      if (!response.ok) throw new Error('Não foi possível carregar sua seleção. Recarregue a página para tentar novamente.');
      const data = await response.json() as { photoIds?: string[]; completed?: boolean; canEditCompleted?: boolean; message?: string };
      setSelected(new Set(data.photoIds ?? []));
      setReviewMessage(data.message ?? '');
      setSelectionCompleted(Boolean(data.completed)); setCanEditCompleted(Boolean(data.canEditCompleted));
      setSelectionLoaded(true);
    }).catch((error) => setSelectionError(error instanceof Error ? error.message : 'Falha ao carregar a seleção.'));
  }, [slug]);
  useEffect(() => {
    if (!slug) return;
    fetch(`/fotos/api/gallery/${slug}/comments`).then(async (response) => {
      if (!response.ok) throw new Error('Não foi possível carregar os comentários.');
      const data = await response.json() as { comments: Array<{ photoId: string; comment: string }> };
      setComments(Object.fromEntries([...data.comments].reverse().map((item) => [item.photoId, item.comment])));
    }).catch(() => setCommentError('Não foi possível carregar os comentários. Recarregue a página.'));
  }, [slug]);
  useEffect(() => {
    if (!playing || opened === null) return;
    const timer = window.setInterval(() => setOpened((current) => {
      if (current === null) return null;
      const index = photos.findIndex((photo) => photo.id === current);
      return photos[(index + 1) % photos.length].id;
    }), 2800);
    return () => window.clearInterval(timer);
  }, [playing, opened, photos]);
  useEffect(() => {
    if (!isPhotoOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    photoDialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previousFocus?.focus();
  }, [isPhotoOpen]);
  useEffect(() => {
    if (!isOverlayOpen) return;
    const dialog = reviewing ? reviewDialog.current : welcomeDialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !selectionSaving) { setReviewing(false); setShowWelcome(false); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, input, a[href]') ?? []).filter((element) => element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [isOverlayOpen, reviewing, selectionSaving]);
  useEffect(() => {
    if (opened === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpened(null); setPlaying(false); return; }
      if (event.key === 'Tab') {
        const controls = Array.from(photoDialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, input, a[href]') ?? []).filter((element) => element.getClientRects().length > 0);
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        return;
      }
      if (event.target instanceof HTMLElement && event.target.matches('textarea, input, [contenteditable=true]')) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      setOpened((current) => {
        if (current === null || !photos.length) return current;
        const index = photos.findIndex((photo) => photo.id === current);
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        return photos[(index + direction + photos.length) % photos.length].id;
      });
    }
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleKey); };
  }, [opened, photos]);

  useEffect(() => {
    if (!finished) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    confirmationHeading.current?.focus({ preventScroll: true });
  }, [finished]);

  if (finished) return <main className="selection-complete-page" aria-labelledby="selection-complete-title">
    <section className="selection-complete-message">
      <svg className="selection-complete-icon" viewBox="0 0 72 72" aria-hidden="true">
        <path d="M36 5c4 0 6 5 10 6s8-1 11 2 1 7 2 11 6 6 6 12-5 8-6 12 1 8-2 11-7 1-11 2-6 6-10 6-6-5-10-6-8 1-11-2-1-7-2-11-6-6-6-12 5-8 6-12-1-8 2-11 7-1 11-2 6-6 10-6Z" fill="#e0e0e0" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <path d="m25 36 7 7 15-15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h1 id="selection-complete-title" ref={confirmationHeading} tabIndex={-1}>Parabéns! Sua seleção foi finalizada!</h1>
      <p>Obrigado por revisar e realizar a seleção de suas fotos. Agradecemos por concluir essa etapa.</p>
    </section>
    <footer className="selection-complete-brand"><BrandLogo /></footer>
  </main>;

  return <main className="client-gallery proof-gallery">
    <section className="gallery-cover-hero"><div className="gallery-cover-image" style={coverUrl ? { backgroundImage: `linear-gradient(#0002,#0004),url(${coverUrl})` } : undefined} /><div className="gallery-cover-copy"><BrandLogo tone="light" /><h1>{title}</h1><button className="view-gallery-button" onClick={() => galleryStart.current?.scrollIntoView({ behavior: 'smooth' })}>Ver galeria</button></div><span className="scroll-hint">ZUTERE FOTOGRAFIA</span></section>
    <nav className="gallery-toolbar" ref={galleryStart} aria-label="Controles da galeria"><div className="proof-title"><h1>{title}</h1><BrandLogo /></div><div className="proof-tools"><div className="proof-menu-wrap"><button className="proof-filter-button" aria-expanded={showFilters} onClick={() => { setShowFilters((current) => !current); setShowInfo(false); }}>▽ Filtros</button>{showFilters && <aside className="proof-filter-menu"><p>Mostrar fotos</p><button aria-pressed={filter === 'all'} onClick={() => { setFilter('all'); setShowFilters(false); }}>Todas as fotos <span>{photos.length}</span></button>{!isDelivery && <><button aria-pressed={filter === 'selected'} onClick={() => { setFilter('selected'); setShowFilters(false); }}>Selecionadas <span>{selected.size}</span></button><button onClick={toggleAll} disabled={selectionLocked || selectionUpdating || !selectionLoaded}>{selected.size === photos.length ? 'Limpar seleção' : 'Selecionar todas'}</button></>}<p>Visualização</p><div className="proof-layout-options">{(['story', 'grid', 'album'] as const).map((value) => <button key={value} aria-pressed={layout === value} onClick={() => setLayout(value)}>{value === 'story' ? 'Mosaico' : value === 'grid' ? 'Grade' : 'Álbum'}</button>)}</div><p>Tamanho das fotos</p><div className="proof-layout-options"><button aria-pressed={photoSize === 'medium'} onClick={() => setPhotoSize('medium')}>Médias</button><button aria-pressed={photoSize === 'large'} onClick={() => setPhotoSize('large')}>Grandes</button></div></aside>}</div><div className="proof-menu-wrap"><button aria-expanded={showInfo} onClick={() => { setShowInfo((current) => !current); setShowFilters(false); }}>ⓘ Info</button>{showInfo && <aside className="gallery-info-menu"><div><span>Total de fotos</span><strong>{photos.length}</strong></div><div><span>Seleção mínima</span><strong>Livre</strong></div><div><span>Selecionadas</span><strong>{selected.size}</strong></div></aside>}</div>{!isDelivery && <button className="proof-selected-filter" aria-pressed={filter === 'selected'} onClick={() => setFilter((current) => current === 'selected' ? 'all' : 'selected')}><span className="proof-selected-count">✓<b>{selected.size}</b></span> Selecionadas</button>}{!isDelivery && <button className="proof-advance" disabled={!selected.size || selectionLocked || selectionUpdating || !selectionLoaded} onClick={() => setReviewing(true)}>{selectionLocked ? 'Finalizada ✓' : 'Avançar'}</button>}</div></nav>
    {selectionError && !reviewing && <p className="gallery-save-error" role="alert">{selectionError}</p>}
    {selectionUpdating && <span className="gallery-save-status" role="status">Salvando seleção…</span>}
    {!isDelivery && selectionLocked && <section className="selection-locked-banner"><span>✓</span><div><strong>Seleção finalizada</strong><small>Suas escolhas estão protegidas. Somente o fotógrafo pode liberar uma nova edição.</small></div></section>}
    <section className={`photo-masonry photo-size-${photoSize} ${layout === 'grid' ? 'uniform-grid' : layout === 'album' ? 'album-layout' : 'story-layout'}`} aria-live="polite">{visible.map((photo, index) => <article className={`photo-tile photo-${index + 1} ${selected.has(photo.id) ? 'chosen' : ''}`} key={photo.id} style={{ '--photo-ratio': photoRatios[photo.id] ?? 1 } as CSSProperties}><button className="open-photo" onClick={() => setOpened(photo.id)} aria-label={`Ampliar ${photo.filename}`}><img src={photo.src} alt={photo.filename} ref={(image) => { if (image?.complete) rememberPhotoRatio(photo.id, image.naturalWidth, image.naturalHeight); }} onLoad={(event) => rememberPhotoRatio(photo.id, event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)} loading={index > 3 ? 'lazy' : 'eager'} /></button><span className="photo-code"><span>{layout === 'album' ? `Página ${String(photos.findIndex((item) => item.id === photo.id) + 1).padStart(2, '0')} · ` : ''}{photo.filename}</span>{selected.has(photo.id) && <small>✓ Selecionada</small>}</span>{!isDelivery && <button className="heart" onClick={() => toggle(photo.id)} aria-label={selected.has(photo.id) ? 'Remover da seleção' : 'Selecionar foto'} aria-pressed={selected.has(photo.id)} disabled={selectionLocked || selectionUpdating || !selectionLoaded}><span><SelectionIcon filled={selected.has(photo.id)} /></span><small>{selected.has(photo.id) ? 'Remover' : 'Adicionar'}</small></button>}<button className="comment-badge" onClick={() => setOpened(photo.id)} aria-label={`Ampliar ${photo.filename}`}><MagnifyIcon /></button></article>)}</section>
    {loadingPhotos && <section className="empty-favorites"><span>◌</span><h2>Carregando suas fotografias…</h2><p>As imagens otimizadas estão sendo preparadas para exibição.</p></section>}
    {!loadingPhotos && photos.length === 0 && <section className="empty-favorites"><span>▧</span><h2>Esta galeria ainda não possui fotos</h2><p>Volte ao painel do fotógrafo e adicione as imagens deste trabalho.</p></section>}
    {!loadingPhotos && photos.length > 0 && visible.length === 0 && <section className="empty-favorites"><span>♡</span><h2>Nenhuma favorita ainda</h2><p>Volte para todas as fotos e marque as imagens que você mais ama.</p><button onClick={() => setFilter('all')}>Ver todas as fotos</button></section>}
    {activePhoto && <div ref={photoDialog} className={`lightbox ${showPhotoDetails ? 'with-details' : 'immersive-view'}`} role="dialog" aria-modal="true" aria-label={`Visualização de ${activePhoto.filename}`}><header><button className="proof-back" onClick={() => { setOpened(null); setPlaying(false); }} aria-label="Voltar para a galeria">← Voltar</button><div className="lightbox-header-center"><button aria-pressed={showPhotoDetails} onClick={() => setShowPhotoDetails((current) => !current)}>Detalhes</button><button onClick={() => setPlaying((current) => !current)}>{playing ? '❚❚ Pausar' : '▶ Apresentação'}</button></div>{isDelivery ? (canDownload ? <a className="proof-photo-download" href={activePhoto.src + '?download=1'} download={activePhoto.filename}>↓ Baixar foto</a> : <span className="delivery-pending">Download indisponível</span>) : <button className="proof-photo-select" onClick={() => toggle(activePhoto.id)} aria-pressed={selected.has(activePhoto.id)} disabled={selectionLocked || selectionUpdating || !selectionLoaded}>{selected.has(activePhoto.id) ? 'Remover' : 'Adicionar'} <SelectionIcon filled={selected.has(activePhoto.id)} /></button>}<button onClick={() => { setOpened(null); setPlaying(false); }} aria-label="Fechar">×</button></header><button className="lightbox-arrow previous" onClick={() => move(-1)} aria-label="Foto anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg></button><figure onDoubleClick={(event) => { if (!(event.target instanceof Element) || event.target.closest('button') || isDelivery || selectionLocked || selectionBusy.current || selectionSaving || !selectionLoaded) return; setHeartBurst({ id: ++heartBurstSequence.current, photoId: activePhoto.id, x: event.clientX, y: event.clientY, selected: !selected.has(activePhoto.id) }); toggle(activePhoto.id); }}><div className="fullscreen-photo-frame"><img src={activePhoto.src} alt={activePhoto.filename} />{!isDelivery && <button className="fullscreen-selection-heart" onClick={() => toggle(activePhoto.id)} aria-pressed={selected.has(activePhoto.id)} aria-label={selected.has(activePhoto.id) ? 'Remover foto da seleção' : 'Selecionar esta foto'} title={selected.has(activePhoto.id) ? 'Foto selecionada · Remover' : 'Foto não selecionada · Adicionar'} disabled={selectionLocked || selectionUpdating || !selectionLoaded}><HeartIcon /></button>}</div><figcaption className="proof-photo-caption"><span>{activePhoto.filename}</span><span>Foto {photos.findIndex((photo) => photo.id === activePhoto.id) + 1} de {photos.length}</span></figcaption>{heartBurst?.photoId === activePhoto.id && <span key={heartBurst.id} className={`selection-heart-burst ${heartBurst.selected ? 'is-selected' : 'is-removed'}`} style={{ left: heartBurst.x, top: heartBurst.y }} aria-hidden="true" onAnimationEnd={() => setHeartBurst((current) => current?.id === heartBurst.id ? null : current)}><HeartIcon /></span>}</figure><button className="lightbox-arrow next" onClick={() => move(1)} aria-label="Próxima foto"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></button><aside hidden={!showPhotoDetails}>{!isDelivery && <button className={`lightbox-favorite ${selected.has(activePhoto.id) ? 'selected' : ''}`} onClick={() => toggle(activePhoto.id)} disabled={selectionLocked || selectionUpdating || !selectionLoaded}><SelectionIcon filled={selected.has(activePhoto.id)} /> {selectionLocked ? 'Seleção finalizada' : selected.has(activePhoto.id) ? 'Selecionada' : 'Selecionar foto'}</button>}<button className="proof-slideshow-toggle" onClick={() => { setPlaying((current) => !current); setShowPhotoDetails(false); }}>{playing ? 'Pausar apresentação' : 'Iniciar apresentação'}</button><div><h3>Comentário para o fotógrafo</h3><p>Peça um retoque ou deixe uma observação sobre esta foto.</p><textarea value={comment} onChange={(e) => { setComment(e.target.value); setSavedComment(false); }} maxLength={1000} disabled={selectionLocked || commentSaving} placeholder="Ex.: Pode suavizar a luz no rosto?" /><button disabled={selectionLocked || commentSaving || comment === (comments[activePhoto.id] ?? '')} onClick={() => void savePhotoComment()}>{commentSaving ? 'Salvando…' : savedComment ? 'Comentário salvo ✓' : 'Salvar comentário'}</button>{commentError && <p className="access-error" role="alert">{commentError}</p>}</div></aside></div>}
    {reviewing && <div className="modal-backdrop"><section ref={reviewDialog} className="selection-review-modal" role="dialog" aria-modal="true" aria-labelledby="selection-review-title"><button className="modal-close" disabled={selectionSaving} onClick={() => setReviewing(false)} aria-label="Fechar">×</button><p className="eyebrow">ÚLTIMA CONFERÊNCIA</p><h2 id="selection-review-title">Revise suas {selected.size} fotografias</h2><p>Confira cada imagem antes de enviar definitivamente ao fotógrafo. Você ainda pode remover alguma foto.</p><div className="selection-review-grid">{photos.filter((photo) => selected.has(photo.id)).map((photo) => <article key={photo.id}><img src={photo.src} alt={photo.filename} /><span>{photo.filename}</span><button onClick={() => toggle(photo.id)} disabled={selectionSaving || selectionUpdating} aria-label={`Remover ${photo.filename}`}>×</button></article>)}</div><div className="review-order-summary"><div><span>Seleção mínima</span><strong>Livre</strong></div><div><span>Total selecionado</span><strong>{selected.size}</strong></div></div><label className="review-message">Deseja enviar uma mensagem ao fotógrafo?<textarea value={reviewMessage} onChange={(event) => setReviewMessage(event.target.value)} placeholder="Digite seu comentário ou observação final" /></label><div className="review-confirmation"><span>✓</span><p><strong>{selected.size} fotos prontas para envio</strong><small>Depois de confirmar, o fotógrafo poderá abrir e analisar sua seleção.</small></p></div>{selectionError && <p className="access-error" role="alert">{selectionError}</p>}<footer><button onClick={() => setReviewing(false)} disabled={selectionSaving}>Voltar e continuar escolhendo</button><button disabled={!selected.size || selectionSaving || selectionUpdating || !selectionLoaded} onClick={submitSelection}>{selectionSaving ? 'Enviando seleção…' : selectionCompleted ? 'Atualizar seleção →' : 'Enviar seleção →'}</button></footer></section></div>}
    {showWelcome && <div className="modal-backdrop"><section ref={welcomeDialog} className="gallery-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="gallery-welcome-title"><span className="welcome-spark">✦</span><p className="eyebrow">BEM-VINDA À SUA GALERIA</p><h2 id="gallery-welcome-title">Informações importantes</h2><p>Bem-vindo(a), {clientName}. Confira suas fotografias e marque as que deseja selecionar.</p><div className="welcome-selection-info"><div><span>Total de fotos</span><strong>{photos.length}</strong></div><div><span>Seleção mínima</span><strong>Livre</strong></div></div><button onClick={() => setShowWelcome(false)}>Acessar galeria →</button></section></div>}
  </main>;
}
