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
  const [voice, setVoice] = useState('nova');
  const [accent, setAccent] = useState('americano');
  const [speed, setSpeed] = useState('1');
  const [generatedCards, setGeneratedCards] = useState<Array<{ sentence: string; translation: string; tags: string; notes: string; pronunciation: string; imageStatus: 'gerada' | 'reutilizada' | 'regenerada'; audioStatus: 'gerado' | 'regenerado' }>>([]);
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
      translation: `Exemplo ${index + 1}: Eu ${verb} alguma coisa.`,
      tags: '',
      notes: '',
      pronunciation: '',
      imageStatus: index === 0 ? 'gerada' : 'reutilizada',
      audioStatus: 'gerado',
    })));
    setGenerationHistory((history) => new Set(history).add(historyKey));
  }

  function handleRegenerateImage(index: number) {
    setGeneratedCards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, imageStatus: 'regenerada' } : item));
  }

  function handleRegenerateAudio(index: number) {
    setGeneratedCards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, audioStatus: 'regenerado' } : item));
  }

  function handleRetryMissing() {
    if (generatedCards.length === 10) {
      setGenerationMessage('Não há cards faltantes para regenerar.');
      setError('');
      return;
    }

    const missing = 10 - generatedCards.length;
    setGeneratedCards((cards) => [...cards, ...Array.from({ length: missing }, (_, index) => ({
      sentence: `Card regenerado ${cards.length + index + 1}: I ${verb} something.`,
      translation: `Card regenerado ${cards.length + index + 1}: Eu ${verb} alguma coisa.`,
      tags: '',
      notes: '',
      pronunciation: '',
      imageStatus: 'gerada' as const,
      audioStatus: 'gerado' as const,
    }))]);
    setGenerationMessage(`${missing} card(s) faltante(s) regenerado(s).`);
    setError('');
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
          <fieldset className="audio-settings">
            <legend>Preferências de áudio</legend>
            <label htmlFor="audio-voice">Voz do áudio</label>
            <select id="audio-voice" value={voice} onChange={(event) => setVoice(event.target.value)}>
              <option value="nova">Nova</option>
              <option value="alloy">Alloy</option>
              <option value="shimmer">Shimmer</option>
            </select>
            <label htmlFor="audio-accent">Sotaque do áudio</label>
            <select id="audio-accent" value={accent} onChange={(event) => setAccent(event.target.value)}>
              <option value="americano">Americano</option>
              <option value="britânico">Britânico</option>
            </select>
            <label htmlFor="audio-speed">Velocidade do áudio</label>
            <select id="audio-speed" value={speed} onChange={(event) => setSpeed(event.target.value)}>
              <option value="0.75">0,75×</option>
              <option value="1">1×</option>
              <option value="1.25">1,25×</option>
            </select>
          </fieldset>
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
            <>
              <button className="secondary-button" type="button" onClick={handleRetryMissing}>Gerar novamente apenas os faltantes</button>
              <section aria-label="Cards gerados" className="generated-cards">
              {generatedCards.map((card, index) => (
                <article key={`${card.sentence}-${index}`} className="generated-card">
                  <p className="eyebrow">Frase {index + 1} de 10</p>
                  <label htmlFor={`sentence-${index}`}>Frase em inglês</label>
                  <input id={`sentence-${index}`} aria-label={`Frase em inglês do card ${index + 1}`} value={card.sentence} onChange={(event) => setGeneratedCards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, sentence: event.target.value } : item))} />
                  <div className="audio-control">
                    <span className="audio-label">Pronúncia do texto em inglês</span>
                    <audio controls aria-label={`Áudio da frase em inglês ${index + 1}`} preload="none">
                      <track kind="captions" />
                    </audio>
                  </div>
                  <p className="field-help"><span>{card.audioStatus === 'gerado' ? 'Áudio gerado' : card.audioStatus === 'regenerado' ? 'Áudio regenerado' : 'Áudio pendente'}</span> · voz {voice}, sotaque {accent}, velocidade {speed}×</p>
                  <button className="secondary-button" type="button" onClick={() => handleRegenerateAudio(index)}>Regenerar áudio do card {index + 1}</button>
                  <label htmlFor={`translation-${index}`}>Tradução em português</label>
                  <input id={`translation-${index}`} aria-label={`Tradução em português do card ${index + 1}`} value={card.translation} onChange={(event) => setGeneratedCards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, translation: event.target.value } : item))} />
                  <div className="card-image" role="img" aria-label={`Imagem ${card.sentence}`}>
                    <span>Visual da frase</span>
                    <small>aguardando mídia</small>
                  </div>
                  <p className="field-help">Imagem {card.imageStatus} · representação visual pendente</p>
                  <button className="secondary-button" type="button" onClick={() => handleRegenerateImage(index)}>Regenerar imagem do card {index + 1}</button>
                  <label htmlFor={`tags-${index}`}>Tags</label>
                  <input id={`tags-${index}`} aria-label={`Tags do card ${index + 1}`} value={card.tags} placeholder="ex.: rotina, trabalho" onChange={(event) => setGeneratedCards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, tags: event.target.value } : item))} />
                  <label htmlFor={`notes-${index}`}>Observações</label>
                  <textarea id={`notes-${index}`} aria-label={`Observações do card ${index + 1}`} value={card.notes} placeholder="Anotações para revisar depois" onChange={(event) => setGeneratedCards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, notes: event.target.value } : item))} />
                  <label htmlFor={`pronunciation-${index}`}>Pronúncia personalizada</label>
                  <input id={`pronunciation-${index}`} aria-label={`Pronúncia personalizada do card ${index + 1}`} value={card.pronunciation} placeholder="ex.: meik" onChange={(event) => setGeneratedCards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, pronunciation: event.target.value } : item))} />
                </article>
              ))}
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
