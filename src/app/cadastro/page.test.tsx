import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';


afterEach(() => cleanup());
import RegisterPage from './page';

describe('cadastro', () => {
  it('permite preencher dados de uma nova conta', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('heading', { name: /criar conta/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'aluna@example.com' } });
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'segredo123' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'segredo123' } });

    expect(screen.getByRole('button', { name: /criar conta/i })).toBeEnabled();
  });

  it('informa quando as senhas não coincidem', () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'segredo123' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'outra123' } });
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/senhas não coincidem/i);
  });

  it('bloqueia senha com menos de 8 caracteres mesmo quando a confirmação coincide', () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/^senha$/i), { target: { value: 'curta1' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'curta1' } });
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/pelo menos 8 caracteres/i);
  });
});
