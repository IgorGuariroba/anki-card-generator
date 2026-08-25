import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import LoginPage from './page';

describe('login page', () => {
  afterEach(() => {
    document.cookie = 'anki_session=; Path=/; Max-Age=0; SameSite=Lax';
    cleanup();
  });

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

  it('rejeita e-mail ou senha somente com espaços em branco', () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/informe e-mail e senha/i);
  });

  it('remove a sessão e volta para a tela de login ao sair', () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'aluno@example.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    expect(document.cookie).toContain('anki_session=active');

    fireEvent.click(screen.getByRole('button', { name: /sair/i }));

    expect(screen.getByText(/entrar na sua conta/i)).toBeInTheDocument();
    expect(document.cookie).not.toContain('anki_session=active');
  });
});
