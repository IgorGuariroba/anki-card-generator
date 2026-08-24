import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardPage from './page';

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

  it('rejeita configuração sem chave OpenRouter', async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Salvar configuração' })[0]);

    expect(screen.getByRole('alert')).toHaveTextContent('Informe a chave OpenRouter.');
  });
});
