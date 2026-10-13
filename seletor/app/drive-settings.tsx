'use client';
import { useEffect, useState } from 'react';
type Status = { configured: boolean; connected: boolean; encryptionReady: boolean; clientId: string; email: string; folderUrl: string | null; redirectUri: string };
const results: Record<string, string> = { connected: 'Google Drive conectado. As próximas fotos serão armazenadas na pasta da Zutere.', cancelled: 'A conexão foi cancelada no Google. Você pode tentar novamente.', invalid: 'A autorização expirou. Clique em conectar novamente.', permissions: 'Autorize o armazenamento de arquivos e conecte novamente.', account: 'Use a mesma conta Google já conectada para preservar o acesso às fotos.', failed: 'Não foi possível conectar. Confira a configuração do aplicativo Google e tente novamente.' };
export default function DriveSettings() {
  const [status, setStatus] = useState<Status | null>(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const [clientId, setClientId] = useState(''), [secret, setSecret] = useState(''), [password, setPassword] = useState(''), [setup, setSetup] = useState(false);
  const [remaining, setRemaining] = useState<{ id: string; filename: string }[]>([]);
  async function refresh() {
    const response = await fetch('/fotos/api/drive/status'); if (!response.ok) throw new Error('Não foi possível carregar a conexão.');
    const data = await response.json() as Status; setStatus(data); setClientId(data.clientId);
    const files = await fetch('/fotos/api/drive/migrate'); if (files.ok) setRemaining((await files.json() as { photos: { id: string; filename: string }[] }).photos);
  }
  useEffect(() => { const result = new URLSearchParams(window.location.search).get('drive'); if (result) setMessage(results[result] ?? 'Confira a conexão do Drive.'); refresh().catch(error => setMessage(error.message)); }, []);
  async function save() {
    setBusy(true); setMessage('');
    try { const response = await fetch('/fotos/api/drive/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, clientSecret: secret, currentPassword: password }) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error); setSecret(''); setPassword(''); setSetup(false); await refresh(); setMessage('Configuração salva. Agora clique em Conectar Google Drive.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.'); } finally { setBusy(false); }
  }
  async function connect() {
    setBusy(true); setMessage('');
    try { const response = await fetch('/fotos/api/drive/connect', { method: 'POST' }); const data = await response.json() as { url?: string; error?: string }; if (!response.ok || !data.url) throw new Error(data.error ?? 'Não foi possível iniciar a conexão.'); window.location.assign(data.url); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível conectar.'); setBusy(false); }
  }
  async function migrate() {
    setBusy(true); setMessage(''); let done = 0;
    try { for (const photo of remaining) { setMessage(`Movendo ${done + 1} de ${remaining.length}: ${photo.filename}`); const response = await fetch('/fotos/api/drive/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId: photo.id }) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error ?? 'Não foi possível mover esta foto.'); done++; } await refresh(); setMessage('Fotos movidas para o Google Drive. Seus links e seleções foram mantidos.'); }
    catch (error) { await refresh().catch(() => {}); setMessage(error instanceof Error ? error.message : 'Não foi possível mover as fotos.'); } finally { setBusy(false); }
  }
  return <>
    <div className="settings-title"><span>☁</span><div><h2>Armazenamento das fotos</h2><p>Use o espaço da sua conta Google Drive para guardar suas fotografias.</p></div></div>
    {message && <p className="modal-copy" role="status">{message}</p>}
    {!status ? <p>Carregando conexão…</p> : <>
      <div className="account-security"><span>{status.connected ? '✓' : '☁'}</span><div><strong>{status.connected ? 'Google Drive conectado' : 'Google Drive ainda não conectado'}</strong><small>{status.connected ? status.email : 'Enquanto isso, suas fotos continuam no armazenamento atual.'}</small>{status.folderUrl && <a href={status.folderUrl} target="_blank" rel="noreferrer">Abrir pasta da Zutere no Drive</a>}</div></div>
      <p className="modal-copy">O seletor usa apenas os arquivos criados pelo aplicativo. As fotos ficam privadas e seus clientes continuam acessando pelo login da galeria.</p>
      <button type="button" className="primary-button" disabled={busy || !status.configured || !status.encryptionReady} onClick={connect}>{busy ? 'Aguarde…' : status.connected ? 'Reconectar Google Drive' : 'Conectar Google Drive'}</button>
      {status.connected && remaining.length > 0 && <div className="account-security"><div><strong>{remaining.length} fotos no armazenamento anterior</strong><small>Mova os arquivos para liberar o espaço antigo, mantendo os links e seleções. Deixe esta página aberta até terminar.</small><button type="button" className="outline-button" disabled={busy} onClick={migrate}>Mover fotos existentes para o Drive</button></div></div>}
      <p className="modal-copy">Fotos de seleção continuam otimizadas para uma navegação rápida. Entregas no Drive aceitam JPG, PNG ou WebP com menos de 20 MB por arquivo.</p>
      <button type="button" className="inline-setting-button" onClick={() => setSetup(current => !current)} disabled={busy}>{setup ? 'Ocultar configuração inicial' : 'Configuração inicial do Google'}</button>
      {setup && <div className="settings-fields">
        <p className="modal-copy">Esta configuração é feita uma única vez. No projeto Google, ative a API do Drive, configure a tela de autorização e crie um cliente OAuth do tipo “Aplicativo da Web”. Cadastre o endereço de retorno abaixo. Não é necessário ativar faturamento. Publique o aplicativo Google em produção para evitar que a autorização expire após sete dias no modo de teste.</p>
        <label>Endereço de retorno<input readOnly value={status.redirectUri} onFocus={event => event.target.select()} /></label>
        <label>ID do aplicativo Google<input value={clientId} onChange={event => setClientId(event.target.value)} autoComplete="off" placeholder="…apps.googleusercontent.com" /></label>
        <label>Chave do aplicativo Google<input type="password" value={secret} onChange={event => setSecret(event.target.value)} autoComplete="off" /></label>
        <label>Sua senha atual do seletor<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></label>
        <button id="drive-config-save" type="button" className="primary-button" onClick={save} disabled={busy || !status.encryptionReady}>Salvar configuração do Drive</button>
      </div>}
    </>}
  </>;
}
