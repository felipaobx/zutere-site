export type StudioOrder = {
  id: string; clientId: string | null; client: string; description: string;
  amountCents: number; status: 'pending' | 'paid' | 'production' | 'completed' | 'cancelled';
  createdAt: string; dueAt: string | null;
};
export type StudioDelivery = {
  id: string; galleryId: string; slug: string; title: string; client: string;
  status: 'preparing' | 'uploading' | 'ready' | 'delivered' | 'expired';
  photoCount: number; size: number; downloadCount: number; expiresAt: string | null;
};
export const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const orderLabels: Record<StudioOrder['status'], string> = { pending: 'Pagamento pendente', paid: 'Pago', production: 'Em produção', completed: 'Concluído', cancelled: 'Cancelado' };
export const deliveryLabels: Record<StudioDelivery['status'], string> = { preparing: 'Preparando', uploading: 'Enviando arquivos', ready: 'Pronta', delivered: 'Entregue', expired: 'Expirada' };
