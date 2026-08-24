'use client';

import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
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
          <button className="primary-button" type="submit">Criar conta</button>
        </form>
      </section>
    </main>
  );
}
