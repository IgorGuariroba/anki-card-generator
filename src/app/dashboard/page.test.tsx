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
