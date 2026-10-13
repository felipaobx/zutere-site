'use client';
import { useState } from 'react';

export default function PhotographerCredentials({ email }: { email: string }) {
  const [visible, setVisible] = useState(false);
  return <>
    <div className="settings-title"><span>♢</span><div><h2>Conta e login</h2><p>Altere seu e-mail de acesso ou escolha uma nova senha.</p></div></div>
    <div className="settings-fields">
      <label>E-mail de login<input name="accountEmail" type="email" autoComplete="username" defaultValue={email} maxLength={254} required /></label>
      <label>Senha atual<input name="currentPassword" type={visible ? 'text' : 'password'} autoComplete="current-password" maxLength={512} required /></label>
      <label>Nova senha<input name="newPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={512} placeholder="Deixe em branco para manter sua senha" /></label>
      <label>Confirmar nova senha<input name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={512} /></label>
    </div>
    <label className="check-label"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} />Mostrar senhas enquanto digito</label>
    <p className="modal-copy">Use pelo menos 12 caracteres na nova senha. Ao salvar, suas sessões serão encerradas e você entrará novamente com os dados atualizados.</p>
  </>;
}
