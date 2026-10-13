'use client';

import { type FormEvent, useState } from 'react';
import { deliveryLabels, money, orderLabels, type StudioDelivery, type StudioOrder } from '@/lib/studio-data';

type ClientOption = { id?: string; name: string };
type GalleryOption = { id?: string; slug: string; title: string; projectType?: string; selected: number; total: number; statusClass: string };

export function OrdersView({ items, onUpdated }: { items: StudioOrder[]; onUpdated: () => Promise<void> }) {
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const visible = items.filter((item) => filter === 'all' || item.status === filter);
  const active = items.filter((item) => item.status !== 'cancelled');
  const total = active.reduce((sum, item) => sum + item.amountCents, 0);
  async function changeStatus(id: string, status: StudioOrder['status']) {
    setBusy(id); setError('');
    try {
      const response = await fetch('/fotos/api/orders', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
      if (!response.ok) throw new Error('Não foi possível atualizar o pedido.');
      await onUpdated();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha na conexão.'); }
    finally { setBusy(null); }
  }
  return <><section className="order-stats"><article><span>TOTAL EM PEDIDOS</span><strong>{money(total)}</strong><small>{active.length} pedidos registrados</small></article><article><span>A RECEBER</span><strong>{money(items.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amountCents, 0))}</strong><small>Pagamentos pendentes</small></article><article><span>TICKET MÉDIO</span><strong>{money(active.length ? Math.round(total / active.length) : 0)}</strong><small>Por pedido registrado</small></article></section>{error && <p role="alert" className="access-error">{error}</p>}<section className="data-card"><div className="table-toolbar"><div><h2>Pedidos</h2><p>Registre as vendas e atualize o andamento.</p></div><label className="filter-label">Mostrar<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todos</option>{Object.entries(orderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="orders-table"><div className="table-head"><span>PEDIDO</span><span>CLIENTE / ITEM</span><span>DATA</span><span>VALOR</span><span>STATUS</span></div>{visible.map((item) => <article key={item.id}><strong title={item.id}>#{item.id.slice(0, 8)}</strong><div><strong>{item.client}</strong><span>{item.description}</span></div><span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span><strong>{money(item.amountCents)}</strong><select aria-label={`Status do pedido ${item.description}`} value={item.status} disabled={busy === item.id} onChange={(event) => void changeStatus(item.id, event.target.value as StudioOrder['status'])}>{Object.entries(orderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></article>)}</div>{!visible.length && <p className="empty-search">Nenhum pedido neste filtro. Use “Novo pedido” para registrar uma venda.</p>}</section></>;
}

export function DeliveriesView({ items }: { items: StudioDelivery[] }) {
  return <><section className="delivery-banner"><div><span>⇩</span><div><p>ENTREGA DAS FOTOGRAFIAS</p><h2>Arquivos disponíveis para seus clientes</h2><small>Libere uma galeria de entrega para permitir o download das fotos enviadas.</small></div></div><strong>{items.reduce((sum, item) => sum + item.photoCount, 0)} <small>fotografias</small></strong></section><div className="delivery-list">{items.map((item) => <article key={item.id}><div className="delivery-icon green">⇩</div><div className="delivery-main"><div><strong>{item.title}</strong><span>{item.client} · {item.photoCount} fotos · {(item.size / 1024 / 1024).toFixed(1)} MB</span></div><span className={`pill ${item.status === 'expired' ? 'amber' : 'green'}`}>{deliveryLabels[item.status]}</span><p>{item.downloadCount} downloads{item.expiresAt ? ` · disponível até ${new Date(item.expiresAt).toLocaleDateString('pt-BR')}` : ' · sem prazo de expiração'}</p></div><a className="outline-button" href={`/fotos/cliente/${item.slug}`}>Abrir entrega →</a></article>)}</div>{!items.length && <p className="empty-search">Crie uma galeria do tipo Entrega, envie as fotos e use “Nova entrega” para liberar os downloads.</p>}</>;
}

export function ReportsView({ orders, galleries, clientCount }: { orders: StudioOrder[]; galleries: GalleryOption[]; clientCount: number }) {
  const [period, setPeriod] = useState('6');
  const now = new Date();
  const paid = orders.filter((item) => ['paid', 'production', 'completed'].includes(item.status));
  const months = Array.from({ length: Number(period) }, (_, index) => new Date(now.getFullYear(), now.getMonth() - Number(period) + index + 1, 1));
  const bars = months.map((month) => ({ label: month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), value: paid.filter((item) => { const date = new Date(item.createdAt); return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth(); }).reduce((sum, item) => sum + item.amountCents, 0) }));
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  return <><div className="report-filter"><label className="filter-label">Período<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="3">Últimos 3 meses</option><option value="6">Últimos 6 meses</option><option value="12">Últimos 12 meses</option></select></label><span>Dados registrados nesta conta</span></div><section className="report-kpis"><article><span>RECEITA REGISTRADA NO PERÍODO</span><strong>{money(bars.reduce((sum, bar) => sum + bar.value, 0))}</strong><small>Pedidos pagos ou em produção</small></article><article><span>CLIENTES CADASTRADOS</span><strong>{clientCount}</strong><small>Total da conta</small></article><article><span>FOTOS SELECIONADAS</span><strong>{galleries.reduce((sum, gallery) => sum + gallery.selected, 0)}</strong><small>Nas galerias da conta</small></article><article><span>GALERIAS FINALIZADAS</span><strong>{galleries.filter((gallery) => gallery.statusClass === 'done').length}</strong><small>De {galleries.length} galerias</small></article></section><article className="chart-card"><h2>Receita por mês de cadastro do pedido</h2><p>Valores dos pedidos pagos, em produção ou concluídos.</p><div className="bar-chart real-bar-chart">{bars.map((bar) => <div key={bar.label}><b>{money(bar.value)}</b><span style={{ height: `${Math.max(2, bar.value / max * 75)}%` }} /><small>{bar.label}</small></div>)}</div></article></>;
}

export function RecordModal({ kind, clients, galleries, onSaved, onClose }: { kind: 'order' | 'delivery'; clients: ClientOption[]; galleries: GalleryOption[]; onSaved: () => Promise<void>; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const deliveryGalleries = galleries.filter((gallery) => gallery.id && gallery.projectType === 'delivery');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setSaving(true); setError('');
    try {
      const body = kind === 'order' ? { clientId: data.get('clientId'), description: data.get('description'), amountCents: Math.round(Number(data.get('amount')) * 100), dueAt: data.get('dueAt') || undefined } : { galleryId: data.get('galleryId'), expiresAt: data.get('expiresAt') || undefined };
      const response = await fetch(kind === 'order' ? '/fotos/api/orders' : '/fotos/api/deliveries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível salvar.');
      await onSaved(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível conectar. Tente novamente.'); }
    finally { setSaving(false); }
  }
  return <div className="modal-backdrop" onMouseDown={() => !saving && onClose()}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="record-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" disabled={saving} onClick={onClose} aria-label="Fechar">×</button><p className="eyebrow">{kind === 'order' ? 'NOVA VENDA' : 'ARQUIVOS FINAIS'}</p><h2 id="record-title">{kind === 'order' ? 'Criar pedido' : 'Liberar entrega'}</h2><form onSubmit={submit}>{kind === 'order' ? <><label>Cliente<select name="clientId" required defaultValue=""><option value="" disabled>Selecione um cliente</option>{clients.filter((client) => client.id).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label>Produto ou serviço<input name="description" required maxLength={300} /></label><div className="form-row"><label>Valor (R$)<input name="amount" type="number" required min="0" max="1000000" step="0.01" /></label><label>Vencimento (opcional)<input name="dueAt" type="date" /></label></div></> : <><label>Galeria de entrega<select name="galleryId" required defaultValue=""><option value="" disabled>Selecione uma galeria</option>{deliveryGalleries.map((gallery) => <option key={gallery.id} value={gallery.id}>{gallery.title} · {gallery.total} fotos</option>)}</select></label><label>Disponível até (opcional)<input name="expiresAt" type="date" min={new Date().toISOString().slice(0, 10)} /></label>{!deliveryGalleries.length && <p>Crie uma galeria do tipo Entrega e envie as fotografias primeiro.</p>}</>}{error && <p role="alert" className="access-error">{error}</p>}<div className="modal-actions"><button type="button" disabled={saving} onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving || (kind === 'delivery' ? !deliveryGalleries.length : !clients.some((client) => client.id))}>{saving ? 'Salvando…' : kind === 'order' ? 'Criar pedido' : 'Liberar downloads'}</button></div></form></section></div>;
}
