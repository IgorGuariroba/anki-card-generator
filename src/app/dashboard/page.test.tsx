import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardPage from './page';

afterEach(cleanup);

describe('configuração de provedores', () => {
  it('permite salvar a chave OpenRouter sem expô-la novamente', async () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByLabelText('Chave OpenRouter'), { target: { value: 'sk-or-v1-example-secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar configuração' }));

    expect(screen.getByRole('status')).toHaveTextContent('Chave OpenRouter configurada');
    expect(screen.queryByText('sk-or-v1-example-secret')).not.toBeInTheDocument();
    expect(screen.getByText('••••••••')).toBeInTheDocument();
  });

  it('permite buscar e escolher um modelo disponível do provedor', () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getAllByLabelText('Buscar modelo de texto')[0], { target: { value: 'Claude' } });
    expect(screen.getAllByRole('option', { name: /claude/i })[0]).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('option', { name: /claude/i })[0]);
    expect(screen.getAllByLabelText('Buscar modelo de texto')[0]).toHaveValue('anthropic/claude-3.5-sonnet');
  });

  it('mantém seleções independentes para texto, tradução, imagem e áudio', () => {
    render(<DashboardPage />);

    const translationSearch = screen.getByLabelText('Buscar modelo de tradução');
    fireEvent.change(translationSearch, { target: { value: 'gemini' } });
    fireEvent.click(screen.getAllByRole('option', { name: 'google/gemini-2.0-flash' })[0]);

    const audioSearch = screen.getByLabelText('Buscar modelo de áudio');
    fireEvent.change(audioSearch, { target: { value: 'eleven' } });
    fireEvent.click(screen.getByRole('option', { name: 'elevenlabs/eleven-v3' }));

    expect(translationSearch).toHaveValue('google/gemini-2.0-flash');
    expect(audioSearch).toHaveValue('elevenlabs/eleven-v3');
    expect(screen.getByLabelText('Buscar modelo de texto')).toHaveValue('openai/gpt-4o-mini');
    expect(screen.getByLabelText('Buscar modelo de imagem')).toHaveValue('openai/gpt-image-1');
  });

  it('permite escolher verbo e nível para iniciar uma geração', () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByLabelText('Verbo'), { target: { value: 'make' } });
    fireEvent.change(screen.getByLabelText('Nível'), { target: { value: 'intermediario' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(screen.getByRole('status')).toHaveTextContent('Geração iniciada para make no nível intermediário.');
  });

  it('exibe 10 frases estruturadas após iniciar a geração', () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByLabelText('Verbo'), { target: { value: 'make' } });
    fireEvent.change(screen.getByLabelText('Nível'), { target: { value: 'iniciante' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(screen.getByRole('region', { name: 'Cards gerados' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(10);
    expect(screen.getAllByText(/Frase \d+ de 10/)).toHaveLength(10);
  });

  it('exibe imagem gerada ou reutilizada em cada card', () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByLabelText('Verbo'), { target: { value: 'make' } });
    fireEvent.change(screen.getByLabelText('Nível'), { target: { value: 'iniciante' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(screen.getAllByRole('img')).toHaveLength(10);
    expect(screen.getAllByText(/Imagem (gerada|reutilizada)/)).toHaveLength(10);
  });

  it('configura voz, sotaque e velocidade do áudio', () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByLabelText('Voz do áudio'), { target: { value: 'alloy' } });
    fireEvent.change(screen.getByLabelText('Sotaque do áudio'), { target: { value: 'britânico' } });
    fireEvent.change(screen.getByLabelText('Velocidade do áudio'), { target: { value: '0.75' } });

    expect(screen.getByLabelText('Voz do áudio')).toHaveValue('alloy');
    expect(screen.getByLabelText('Sotaque do áudio')).toHaveValue('britânico');
    expect(screen.getByLabelText('Velocidade do áudio')).toHaveValue('0.75');
  });

  it('exibe áudio reproduzível em cada card gerado', () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByLabelText('Verbo'), { target: { value: 'make' } });
    fireEvent.change(screen.getByLabelText('Nível'), { target: { value: 'iniciante' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(screen.getAllByLabelText(/Áudio da frase/)).toHaveLength(10);
    expect(screen.getAllByText('Áudio gerado')).toHaveLength(10);
  });

  it('evita gerar novamente uma combinação já presente no histórico', () => {
    render(<DashboardPage />);

    fireEvent.change(screen.getByLabelText('Verbo'), { target: { value: 'make' } });
    fireEvent.change(screen.getByLabelText('Nível'), { target: { value: 'iniciante' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Essa combinação já foi gerada nesta sessão.');
    expect(screen.getAllByRole('article')).toHaveLength(10);
  });

  it('rejeita geração sem verbo ou nível', () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Selecione um verbo e um nível.');
  });

  it('rejeita configuração sem chave OpenRouter', async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Salvar configuração' })[0]);

    expect(screen.getByRole('alert')).toHaveTextContent('Informe a chave OpenRouter.');
  });
});
