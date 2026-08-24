import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RecoverPasswordPage from './page';

describe('recuperação de senha', () => {
  afterEach(cleanup);
  it('solicita um e-mail válido e confirma o envio do link', () => {
    render(<RecoverPasswordPage />);

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'aluno@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/se o e-mail estiver cadastrado/i);
  });

  it('exibe erro quando o e-mail não é informado', () => {
    render(<RecoverPasswordPage />);

    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/informe seu e-mail/i);
  });
});
