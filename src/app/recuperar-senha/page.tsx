'use client';

import { FormEvent, useState } from 'react';

export default function RecoverPasswordPage() {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim();

    if (!email) {
      setSent(false);
      setError('Informe seu e-mail para recuperar a senha.');
      return;
    }

    setError('');
    setSent(true);
  }

  return (
    <main className="page-shell">
      <section className="auth-card" aria-labelledby="recover-title">
        <p className="eyebrow">English Light Verbs</p>
        <h1 id="recover-title">Recuperar senha</h1>
        <p className="hero-copy">Enviaremos instruções para você criar uma nova senha.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          {error && <p className="form-error" role="alert">{error}</p>}
          {sent && (
            <p className="form-success" role="status">
              Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
            </p>
          )}
          <button className="primary-button" type="submit">Enviar link</button>
        </form>
      </section>
    </main>
  );
}
