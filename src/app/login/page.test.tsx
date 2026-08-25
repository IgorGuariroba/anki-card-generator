import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('login page', () => {
  afterEach(() => {
    document.cookie = 'anki_session=; Path=/; Max-Age=0; SameSite=Lax';
    cleanup();
    vi.unstubAllGlobals();
    pushMock.mockClear();
  });

  it('rejeita credenciais inválidas sem entrar, sem chamar o backend', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/informe e-mail e senha/i);
    expect(screen.getByText(/entrar na sua conta/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejeita e-mail ou senha somente com espaços em branco, sem chamar o backend', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/informe e-mail e senha/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('autentica no backend real via /api/auth/login e mostra a tela conectada', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ email: 'aluno@example.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'aluno@example.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard'));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'aluno@example.com', password: 'senha-segura' }),
      }),
    );
  });

  it('exibe o erro determinístico do backend quando as credenciais são recusadas (401), sem inventar mensagem local', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'E-mail ou senha inválidos.' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'aluno@example.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'senha-errada' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/e-mail ou senha inválidos/i));
    expect(screen.getByText(/entrar na sua conta/i)).toBeInTheDocument();
  });

  it('redireciona para /dashboard após autenticar com sucesso, sem exigir clique extra', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ email: 'aluno@example.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'aluno@example.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
