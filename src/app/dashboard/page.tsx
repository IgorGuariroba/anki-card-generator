'use client';

import { FormEvent, useState } from 'react';

const models = {
  texto: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash'],
  imagem: ['openai/gpt-image-1', 'google/gemini-2.5-flash-image'],
  traducao: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
};

function ModelPicker({ label, models: availableModels }: { label: string; models: string[] }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(availableModels[0]);
  const [open, setOpen] = useState(false);
  const filteredModels = availableModels.filter((model) => model.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="model-picker">
      <label htmlFor={`${label}-search`}>{label}</label>
      <input id={`${label}-search`} type="search" placeholder="Buscar modelo disponível" aria-label={`Buscar modelo de ${label.toLowerCase()}`} role="combobox" aria-expanded={open} aria-controls={`${label}-options`} value={open ? query : selected} onFocus={() => { setOpen(true); setQuery(''); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} />
      {open && <div id={`${label}-options`} className="model-options" role="listbox" aria-label={`Modelos disponíveis de ${label.toLowerCase()}`}>
        {filteredModels.map((model) => <button key={model} type="button" role="option" aria-selected={model === selected} onClick={() => { setSelected(model); setQuery(''); setOpen(false); }}>{model}</button>)}
        {!filteredModels.length && <p className="field-help">Nenhum modelo encontrado.</p>}
      </div>}
    </div>
  );
}

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
          <ModelPicker label="Texto" models={models.texto} />
          <ModelPicker label="Imagem" models={models.imagem} />
          <ModelPicker label="Tradução" models={models.traducao} />
          <button className="primary-button" type="submit">Salvar configuração</button>
        </form>
      </section>
    </main>
  );
}
