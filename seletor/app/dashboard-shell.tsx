import { requireChatGPTUser } from './chatgpt-auth';
import DashboardClient from './dashboard-client';

type DashboardView = 'home' | 'galleries' | 'clients' | 'orders' | 'deliveries' | 'reports' | 'settings';

const paths: Record<DashboardView, string> = {
  home: '/fotos/fotografo/painel',
  galleries: '/fotos/galerias',
  clients: '/fotos/clientes',
  orders: '/fotos/pedidos',
  deliveries: '/fotos/entregas',
  reports: '/fotos/relatorios',
  settings: '/fotos/configuracoes',
};

export default async function DashboardShell({ view }: { view: DashboardView }) {
  await requireChatGPTUser(paths[view]);
  return <DashboardClient view={view} />;
}
