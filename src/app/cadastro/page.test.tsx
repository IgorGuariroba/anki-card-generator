import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  pushMock.mockClear();
});

import RegisterPage from './page';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('cadastro', () => {
  it('permite preencher dados de uma nova conta', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('heading', { name: /criar conta/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'aluna@example.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'segredo123' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'segredo123' } });

    expect(screen.getByRole('button', { name: /criar conta/i })).toBeEnabled();
  });

  it('informa quando as senhas não coincidem, sem chamar o backend', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'segredo123' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'outra123' } });
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/senhas não coincidem/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('bloqueia senha com menos de 8 caracteres mesmo quando a confirmação coincide, sem chamar o backend', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'curta1' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'curta1' } });
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/pelo menos 8 caracteres/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envia o cadastro para /api/auth/register e mostra sucesso quando o backend confirma', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ email: 'nova@example.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'nova@example.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'segredo123' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/conta criada/i));
    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'nova@example.com', password: 'segredo123', confirmation: 'segredo123' }),
      }),
    );
  });

  it('exibe erro determinístico do backend quando o e-mail já está cadastrado (409), sem inventar a mensagem localmente', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'E-mail já cadastrado.' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'dup@example.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'segredo123' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'segredo123' } });
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/e-mail já cadastrado/i));
  });
});
