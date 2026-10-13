'use client';

import { FormEvent, useState } from 'react';
import GalleryClient from '../../gallery/[slug]/gallery-client';
import BrandLogo from '../../brand-logo';

export default function ClientAccess({ slug, title, projectType }: { slug: string; title: string; projectType?: string }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [clientName, setClientName] = useState('Cliente');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const data = new FormData(event.currentTarget); const login = String(data.get('login') ?? ''); const password = String(data.get('password') ?? '');
    try {
      const response = await fetch('/fotos/api/client/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug, login, password }) });
      const result = await response.json().catch(() => null) as { clientName?: string; error?: string } | null;
      if (response.ok) { setClientName(result?.clientName?.trim() || login); setAuthenticated(true); window.location.reload(); }
      else setError(result?.error ?? 'Login ou senha incorretos. Confira a mensagem enviada pelo fotógrafo.');
    } catch { setError('Não foi possível entrar agora. Tente novamente.'); }
    setLoading(false);
  }

  if (authenticated) return <GalleryClient title={title} slug={slug} initialProjectType={projectType} clientMode clientName={clientName} />;

  return <main className="access-page"><div className="access-photo" /><section className="access-panel"><div className="brand"><BrandLogo /></div><div className="access-content"><p className="eyebrow">GALERIA PARTICULAR</p><h1>Suas memórias estão aqui.</h1><p>Entre com os dados enviados pelo fotógrafo para visualizar e escolher suas fotografias.</p><div className="access-gallery-name"><span>✦</span><div><small>GALERIA</small><strong>{title}</strong></div></div><form onSubmit={signIn}><label>Login<input name="login" autoComplete="username" placeholder="Digite seu login" required /></label><label>Senha<div className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? '◌' : '◉'}</button></div></label>{error && <p className="access-error" role="alert">{error}</p>}<button disabled={loading}>{loading ? 'Entrando...' : 'Entrar na galeria →'}</button></form><small className="privacy-note">♢ Ambiente protegido • Seus dados e escolhas são privados</small></div><footer>© {new Date().getFullYear()} Zutere • Galeria particular</footer></section></main>;
}
