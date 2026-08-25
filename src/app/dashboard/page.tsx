'use client';

import { FormEvent, useState } from 'react';

const verbs = ['make', 'do', 'take', 'get', 'have', 'give', 'put', 'set', 'go'] as const;
const levels = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' } as const;

const models = {
  texto: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash'],
  imagem: ['openai/gpt-image-1', 'google/gemini-2.5-flash-image'],
  traducao: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
  audio: ['openai/gpt-4o-mini-tts', 'elevenlabs/eleven-v3', 'google/gemini-2.5-flash-preview-tts'],
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
  const [verb, setVerb] = useState('');
  const [level, setLevel] = useState('');
  const [generationMessage, setGenerationMessage] = useState('');
  const [generatedCards, setGeneratedCards] = useState<Array<{ sentence: string; imageStatus: 'gerada' | 'reutilizada' }>>([]);
  const [generationHistory, setGenerationHistory] = useState<Set<string>>(new Set());

  function handleGeneration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verb || !level) {
      setGenerationMessage('');
      setError('Selecione um verbo e um nível.');
      return;
    }
    const historyKey = `${verb}:${level}`;
    if (generationHistory.has(historyKey)) {
      setGenerationMessage('');
      setError('Essa combinação já foi gerada nesta sessão.');
      return;
    }
    setError('');
    const difficulty = levels[level as keyof typeof levels].toLowerCase();
    setGenerationMessage(`Geração iniciada para ${verb} no nível ${difficulty}.`);
    setGeneratedCards(Array.from({ length: 10 }, (_, index) => ({
      sentence: `Exemplo ${index + 1}: I ${verb} something.`,
      imageStatus: index === 0 ? 'gerada' : 'reutilizada',
    })));
    setGenerationHistory((history) => new Set(history).add(historyKey));
  }

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
          <ModelPicker label="Áudio" models={models.audio} />
          <button className="primary-button" type="submit">Salvar configuração</button>
        </form>

        <section className="generation-section" aria-labelledby="generation-title">
          <p className="eyebrow">Nova sessão</p>
          <h2 id="generation-title">Gerar cards</h2>
          <p className="hero-copy">Escolha um verbo e a dificuldade para preparar 10 cards.</p>
          <form onSubmit={handleGeneration} noValidate>
            <label htmlFor="verb">Verbo</label>
            <select id="verb" value={verb} onChange={(event) => setVerb(event.target.value)}>
              <option value="">Selecione um verbo</option>
              {verbs.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <label htmlFor="level">Nível</label>
            <select id="level" value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="">Selecione um nível</option>
              {Object.entries(levels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="primary-button" type="submit">Iniciar geração</button>
          </form>
          {generationMessage && <p className="form-success" role="status">{generationMessage}</p>}
          {generatedCards.length > 0 && (
            <section aria-label="Cards gerados" className="generated-cards">
              {generatedCards.map((card, index) => (
                <article key={`${card.sentence}-${index}`} className="generated-card">
                  <p className="eyebrow">Frase {index + 1} de 10</p>
                  <p>{card.sentence}</p>
                  <div className="card-image" role="img" aria-label={`Imagem ${card.sentence}`}>
                    <span aria-hidden="true">🖼️</span>
                  </div>
                  <p className="field-help">Imagem {card.imageStatus} · representação visual pendente</p>
                  <p className="field-help">Tradução pendente</p>
                </article>
              ))}
            </section>
          )}
        </section>
      </section>
    </main>
  );
}
