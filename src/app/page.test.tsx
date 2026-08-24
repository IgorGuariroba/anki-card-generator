import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('home page', () => {
  it('apresenta o gerador de cards para o usuário', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: /english light verbs/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /começar/i })).toBeInTheDocument();
  });
});
