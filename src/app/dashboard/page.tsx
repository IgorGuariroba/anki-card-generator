'use client';

import { FormEvent, useState } from 'react';

const models = {
  texto: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet'],
  imagem: ['openai/gpt-image-1', 'google/gemini-2.5-flash-image'],
  traducao: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
};

export default function DashboardPage() {
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!openRouterKey.trim()) {
      setError('Informe a chave OpenRouter.');
      setSaved(false);
      return;
    }
    setOpenRouterKey('');
    setError('');
    setSaved(true);
  }

  return (
    <main className="page-shell">
      <section className="settings-card" aria-labelledby="dashboard-title">
        <p className="eyebrow">Configurações</p>
        <h1 id="dashboard-title">Seus provedores</h1>
        <p className="hero-copy">Use suas próprias chaves para controlar os modelos e os custos da geração.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="openrouter-key">Chave OpenRouter</label>
          <input id="openrouter-key" aria-label="Chave OpenRouter" type="password" value={openRouterKey} onChange={(event) => setOpenRouterKey(event.target.value)} autoComplete="off" />
          <p className="field-help">A chave é protegida e nunca fica visível depois de salva.</p>
          {saved && <p className="form-success" role="status">Chave OpenRouter configurada <span aria-label="chave protegida">••••••••</span></p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <label htmlFor="text-model">Modelo de texto</label>
          <select id="text-model" defaultValue={models.texto[0]}>{models.texto.map((model) => <option key={model}>{model}</option>)}</select>
          <label htmlFor="image-model">Modelo de imagem</label>
          <select id="image-model" defaultValue={models.imagem[0]}>{models.imagem.map((model) => <option key={model}>{model}</option>)}</select>
          <label htmlFor="translation-model">Modelo de tradução</label>
          <select id="translation-model" defaultValue={models.traducao[0]}>{models.traducao.map((model) => <option key={model}>{model}</option>)}</select>
          <button className="primary-button" type="submit">Salvar configuração</button>
        </form>
      </section>
    </main>
  );
}
