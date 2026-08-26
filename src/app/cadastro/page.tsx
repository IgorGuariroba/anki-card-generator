'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');

    setSuccess('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, confirmation }),
      });
      const payload = (await response.json()) as { email?: string; error?: string };

      if (!response.ok) {
        setError(payload.error ?? 'Não foi possível criar a conta.');
        return;
      }

      setSuccess(`Conta criada para ${payload.email}. Você já pode entrar.`);
      router.push('/login');
    } catch {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="auth-card" aria-labelledby="register-title">
        <p className="eyebrow">English Light Verbs</p>
        <h1 id="register-title">Criar conta</h1>
        <p className="hero-copy">Salve seu histórico de cards e continue praticando.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <label htmlFor="password">Senha</label>
          <input id="password" name="password" type="password" required autoComplete="new-password" />
          <label htmlFor="confirmation">Confirmar senha</label>
          <input id="confirmation" name="confirmation" type="password" required autoComplete="new-password" />
          {error && <p className="form-error" role="alert">{error}</p>}
          {success && <p className="form-success" role="status">{success}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>
      </section>
    </main>
  );
}
