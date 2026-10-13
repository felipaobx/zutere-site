'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Photo = { id: string; filename: string; src: string; isCover: boolean; size: number };
type QueueItem = { file: File; preview: string; status: 'pending' | 'sending' | 'done' | 'error'; error?: string };
export default function PhotoManager({ gallery, compressPhoto, onClose }: { gallery: { id?: string; title: string; slug: string; projectType?: string }; compressPhoto: (file: File) => Promise<File>; onClose: () => void }) {
  const [storage, setStorage] = useState({provider: 'database', maxPhotoBytes: 1_000_000});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const sending = useRef(false);
  const previewUrls = useRef(new Set<string>());
  const endpoint = `/fotos/api/galleries/${gallery.id}/photos`;
  const refresh = useCallback(async () => {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Não foi possível carregar as imagens.');
    const result = await response.json() as { photos: Photo[]; storage?: {provider:string;maxPhotoBytes:number} };
    setPhotos(result.photos); if(result.storage) setStorage(result.storage);
  }, [endpoint]);
  useEffect(() => {
    let cancelled = false;
    fetch(endpoint).then(async (response) => { if (!response.ok) throw new Error('Não foi possível carregar as imagens.'); const data = await response.json() as { photos: Photo[]; storage?: {provider:string;maxPhotoBytes:number} }; if (!cancelled) {setPhotos(data.photos);if(data.storage)setStorage(data.storage);} }).catch((cause) => { if (!cancelled) setError(cause.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [endpoint]);
  useEffect(() => { const urls = previewUrls.current; return () => { urls.forEach((url) => URL.revokeObjectURL(url)); urls.clear(); }; }, []);
  function choose(files: File[]) {
    if (sending.current) return;
    const accepted = files.filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size > 0 && file.size < (gallery.projectType === 'delivery' ? storage.maxPhotoBytes : 100 * 1024 * 1024));
    const next = accepted.filter((file) => !queue.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified)).map((file) => { const preview = URL.createObjectURL(file); previewUrls.current.add(preview); return { file, preview, status: 'pending' as const }; });
    setQueue((current) => [...current, ...next]);
    setError(accepted.length < files.length ? 'Alguns arquivos foram ignorados. Use JPG, PNG ou WebP dentro do limite mostrado para esta galeria.' : '');
  }
  function removeQueued(index: number) {
    const entry = queue[index];
    URL.revokeObjectURL(entry.preview); previewUrls.current.delete(entry.preview);
    setQueue((current) => current.filter((_, position) => position !== index));
  }
  async function upload() {
    if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    try {
      for (let index = 0; index < queue.length; index++) {
        const item = queue[index];
        if (item.status === 'done') continue;
        setQueue((current) => current.map((entry, position) => position === index ? { ...entry, status: 'sending', error: undefined } : entry));
        try {
          const file = gallery.projectType === 'delivery' ? item.file : await compressPhoto(item.file);
          const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': file.type, 'x-photo-filename': encodeURIComponent(file.name), 'x-original-filename': encodeURIComponent(item.file.name) }, body: file });
          const result = await response.json() as { error?: string };
          if (!response.ok) throw new Error(result.error ?? 'Falha no envio.');
          setQueue((current) => current.map((entry, position) => position === index ? { ...entry, status: 'done' } : entry));
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : 'Conexão interrompida.';
          setQueue((current) => current.map((entry, position) => position === index ? { ...entry, status: 'error', error: message } : entry));
          setError(`${item.file.name}: ${message} Você pode tentar novamente.`); break;
        }
      }
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar.'); }
    finally { sending.current = false; setBusy(false); }
  }
  async function mutate(photo: Photo, method: 'PATCH' | 'DELETE') {
    if (action || busy) return;
    if (method === 'DELETE' && !window.confirm(`Excluir “${photo.filename}” desta galeria? A seleção e os comentários desta foto também serão excluídos.`)) return;
    setAction(photo.id); setError('');
    try {
      const response = await fetch(endpoint, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photoId: photo.id }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível salvar a alteração.');
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha na conexão.'); }
    finally { setAction(''); }
  }
  return <div className="modal-backdrop" onMouseDown={() => !busy && !action && onClose()}><section className="create-modal upload-workflow-modal photo-manager" role="dialog" aria-modal="true" aria-labelledby="photo-manager-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} disabled={busy || Boolean(action)} aria-label="Fechar">×</button><p className="eyebrow">FOTOGRAFIAS DA GALERIA</p><h2 id="photo-manager-title">{gallery.title}</h2><p className="modal-copy">{storage.provider === 'drive' ? 'Google Drive: fotos guardadas na sua conta, sem o limite de espaço anterior.' : 'Armazenamento atual: 350 MiB. Conecte seu Google Drive em Configurações para ampliar o espaço.'}</p><p className="modal-copy">{gallery.projectType === 'delivery' ? (storage.provider === 'drive' ? 'Entregas preservam o arquivo enviado, com menos de 20 MB por foto.' : 'Entregas preservam o arquivo enviado, com menos de 1 MB por foto.') : 'As fotos são otimizadas para visualização. Os nomes originais são preservados.'}</p><label className="large-upload-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); choose(Array.from(event.dataTransfer.files)); }}><span>⇧</span><strong>Arraste ou selecione suas fotos</strong><small>JPG, PNG ou WebP · fotos otimizadas para menos de 1 MB</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || loading} onChange={(event) => { choose(Array.from(event.target.files ?? [])); event.target.value = ''; }} /></label>{queue.length > 0 && <div className="photo-upload-queue" aria-live="polite">{queue.map((item, index) => <div key={item.preview} className={`queued-photo queued-${item.status}`}><img src={item.preview} alt={item.file.name} loading="lazy" /><strong>{item.file.name}</strong><span>{item.status === 'done' ? 'Enviada ✓' : item.status === 'sending' ? 'Preparando e enviando…' : item.status === 'error' ? 'Tentar novamente' : 'Pronta para enviar'}</span>{item.status !== 'done' && <button disabled={busy} aria-label={`Remover ${item.file.name} da fila`} onClick={() => removeQueued(index)}>×</button>}</div>)}<button className="primary-button" onClick={upload} disabled={busy || queue.every((item) => item.status === 'done')}>{busy ? 'Enviando…' : 'Enviar fotos'}</button></div>}{error && <p className="access-error" role="alert">{error}</p>}<div className="section-heading"><h3>{photos.length} fotos na galeria</h3><a href={`/fotos/gallery/${gallery.slug}`}>Ver galeria →</a></div>{loading && <p role="status">Carregando imagens…</p>}<div className="managed-photo-grid">{photos.map((photo) => <article className={photo.isCover ? 'cover-selected' : ''} key={photo.id}><img src={photo.src} alt={photo.filename} loading="lazy" /><span title={photo.filename}>{photo.filename}</span><div className="managed-photo-actions"><button disabled={busy || Boolean(action) || photo.isCover} onClick={() => void mutate(photo, 'PATCH')}>{photo.isCover ? 'Capa atual ✓' : 'Usar como capa'}</button><button className="danger-action" disabled={busy || Boolean(action)} onClick={() => void mutate(photo, 'DELETE')} aria-label={`Excluir ${photo.filename}`}>Excluir</button></div></article>)}</div><div className="modal-actions"><button className="primary-button" onClick={onClose} disabled={busy || Boolean(action)}>Concluir</button></div></section></div>;
}

