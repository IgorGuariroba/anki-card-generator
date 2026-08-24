import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoginPage from './page';

describe('login page', () => {
  it('permite entrar com credenciais válidas e oferece logout após entrar', () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'aluno@example.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByText(/você está conectado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
  });

  it('rejeita credenciais inválidas sem entrar', () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/informe e-mail e senha/i);
    expect(screen.getByText(/entrar na sua conta/i)).toBeInTheDocument();
  });
});
