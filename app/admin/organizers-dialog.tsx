'use client';

import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, UserPlus } from 'lucide-react';
import type { Organizer } from '@/lib/organizer-session';
import Dialog from './dialog';
import { roleLabel } from '../account';

type Account = Organizer & { active: boolean };

async function call(method: 'GET' | 'POST' | 'PATCH', body?: object) {
  const response = await fetch('/api/admin/organizers', {
    method, cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json() as { organizers?: Account[]; error?: string };
  if (!response.ok) throw new Error(data.error || 'Не удалось выполнить действие.');
  return data.organizers ?? [];
}

/** Owner manages judge accounts; every organizer can change their own password. */
export default function OrganizersDialog({ me, onClose }: { me: Organizer; onClose: () => void }) {
  const owner = me.role === 'owner';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', login: '', password: '', role: 'judge' });
  const [own, setOwn] = useState({ currentPassword: '', password: '' });

  useEffect(() => {
    if (!owner) return;
    call('GET').then(setAccounts).catch((error: Error) => setMessage(error.message));
  }, [owner]);

  async function run(work: () => Promise<Account[]>, done: string) {
    setBusy(true);
    try {
      const list = await work();
      if (owner) setAccounts(list);
      setMessage(done);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось выполнить действие.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    if (await run(() => call('POST', form), `Добавлен организатор «${form.name}». Передайте ему логин и пароль.`)) setForm({ name: '', login: '', password: '', role: 'judge' });
  }

  async function changeOwn(event: FormEvent) {
    event.preventDefault();
    if (await run(() => call('PATCH', { id: me.id, ...own }), 'Пароль изменён. На других устройствах нужно войти заново.')) setOwn({ currentPassword: '', password: '' });
  }

  function resetPassword(account: Account) {
    const password = window.prompt(`Новый пароль для «${account.name}» (не короче 8 символов):`);
    if (password) void run(() => call('PATCH', { id: account.id, password }), `Пароль для «${account.name}» изменён.`);
  }

  return <Dialog title={owner ? 'Организаторы' : 'Мой аккаунт'} onClose={onClose}>
    {message && <p className="admin-dialog-message" role="status">{message}</p>}
    {owner && <>
      <ul className="organizer-list">{accounts.map((account) => <li key={account.id} className={account.active ? undefined : 'is-off'}>
        <div><strong>{account.name}{account.id === me.id && ' (вы)'}</strong><small>{account.login} · {roleLabel[account.role]}{account.active ? '' : ' · отключён'}</small></div>
        {account.id !== me.id && <div className="organizer-actions">
          <button type="button" className="refresh" disabled={busy} onClick={() => resetPassword(account)}><KeyRound size={14}/>Пароль</button>
          <button type="button" className="refresh" disabled={busy} onClick={() => void run(() => call('PATCH', { id: account.id, active: !account.active }), account.active ? `«${account.name}» отключён.` : `«${account.name}» снова может входить.`)}>{account.active ? 'Отключить' : 'Включить'}</button>
        </div>}
      </li>)}</ul>
      <form className="admin-form" onSubmit={add}>
        <h3><UserPlus size={16}/>Добавить организатора</h3>
        <label>Имя<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={60} placeholder="Например, Анна — судья «Крокодила»"/></label>
        <div className="admin-form-row">
          <label>Логин<input value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} required autoCapitalize="none" spellCheck={false} pattern="[a-zA-Z0-9._\-]{3,32}" title="3–32 символа: латиница, цифры, точка, дефис"/></label>
          <label>Пароль<input type="text" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} autoComplete="off"/></label>
        </div>
        <label>Роль<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="judge">Судья — вносит баллы</option><option value="owner">Админ — ещё и управляет аккаунтами</option></select></label>
        <button className="save-button" disabled={busy}>Добавить</button>
      </form>
    </>}
    <form className="admin-form" onSubmit={changeOwn}>
      <h3><KeyRound size={16}/>Сменить мой пароль</h3>
      <div className="admin-form-row">
        <label>Текущий пароль<input type="password" autoComplete="current-password" value={own.currentPassword} onChange={(event) => setOwn({ ...own, currentPassword: event.target.value })} required/></label>
        <label>Новый пароль<input type="password" autoComplete="new-password" minLength={8} value={own.password} onChange={(event) => setOwn({ ...own, password: event.target.value })} required/></label>
      </div>
      <button className="save-button" disabled={busy}>Сменить пароль</button>
    </form>
  </Dialog>;
}
