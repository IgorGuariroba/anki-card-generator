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

  it('rejeita configuração sem chave OpenRouter', async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Salvar configuração' })[0]);

    expect(screen.getByRole('alert')).toHaveTextContent('Informe a chave OpenRouter.');
  });
});
