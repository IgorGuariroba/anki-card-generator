import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import Home from './page';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

afterEach(cleanup);

describe('home page', () => {
  it('apresenta o gerador de cards para o usuário', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: /english light verbs/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /começar/i })).toBeInTheDocument();
  });

  it('leva o usuário para /login ao clicar em Começar, não para uma âncora inexistente', () => {
    render(<Home />);

    const link = screen.getByRole('link', { name: /começar/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});
