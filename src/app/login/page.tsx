'use client';

import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    if (!email || !password) {
      setError('Informe e-mail e senha para entrar.');
      return;
    }

    setError('');
    setAuthenticated(true);
  }

  if (authenticated) {
    return (
      <main className="page-shell">
        <section className="auth-card" aria-labelledby="welcome-title">
          <p className="eyebrow">English Light Verbs</p>
          <h1 id="welcome-title">Você está conectado</h1>
          <p className="hero-copy">Pronto para continuar praticando seus cards.</p>
          <button className="secondary-button" type="button" onClick={() => setAuthenticated(false)}>Sair</button>
        </section>
      </main>
    );
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
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}
