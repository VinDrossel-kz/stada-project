'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось войти.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось войти.');
    } finally {
      setBusy(false);
    }
  }

  return <form className="organizer-login" onSubmit={submit}>
    <label htmlFor="organizer-password">Пароль организатора</label>
    <input id="organizer-password" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setMessage(''); }} aria-invalid={Boolean(message)} aria-describedby={message ? 'login-error' : undefined} required />
    <button className="save-button" disabled={busy}>{busy ? 'Проверяем…' : 'Войти'}</button>
    <p id="login-error" className="login-message" role="alert">{message}</p>
  </form>;
}
