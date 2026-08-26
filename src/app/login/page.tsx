'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '').trim();

    if (!email || !password) {
      setError('Informe e-mail e senha para entrar.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { email?: string; error?: string };

      if (!response.ok) {
        setError(payload.error ?? 'Não foi possível entrar.');
        setSubmitting(false);
        return;
      }

      // Login bem-sucedido: a sessão já foi definida via cookie HttpOnly pelo
      // backend (POST /api/auth/login). Redireciona imediatamente para o
      // dashboard, sem exigir clique extra do usuário, conforme SPEC.md
      // (fluxo principal: Login → Configurações/dashboard).
      router.push('/dashboard');
    } catch {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">English Light Verbs</p>
        <h1 id="login-title">Entrar na sua conta</h1>
        <p className="hero-copy">Acesse seu histórico de cards e continue praticando.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <label htmlFor="password">Senha</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
          <a href="/recuperar-senha">Esqueci minha senha</a>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
