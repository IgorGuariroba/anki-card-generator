/**
 * Testes de duplicidade e falhas de provedores (etapa quality-3).
 *
 * Guardrails cobertos (ver SPEC.md linhas 38, 71 e 141):
 * - Uma combinação verbo+nível já gerada na sessão não pode ser gerada
 *   novamente (duplicidade), inclusive quando "Gerar novamente apenas os
 *   faltantes" é usado depois de uma falha parcial.
 * - Quando o provedor de geração falha, a aplicação exibe um alerta
 *   acessível e determinístico e NÃO tenta automaticamente outro modelo
 *   ou provedor (sem fallback automático, conforme SPEC.md linha 71).
 * - Uma falha de provedor não deve deixar cards parcialmente
 *   inconsistentes: nenhum card é adicionado quando a geração falha.
 *
 * `@/lib/card-generation` é mockado para simular deterministicamente uma
 * falha de provedor, seguindo o mesmo padrão de
 * generation-review-export-flow.test.tsx (mock de módulo em vez de
 * depender de rede real, que ainda não existe nesta etapa).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const generateCards = vi.fn();

vi.mock('@/lib/card-generation', () => ({ generateCards: (...args: unknown[]) => generateCards(...args) }));

const { default: DashboardPage } = await import('./page');

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function selectVerbAndLevel() {
  fireEvent.change(screen.getByLabelText('Verbo'), { target: { value: 'make' } });
  fireEvent.change(screen.getByLabelText('Nível'), { target: { value: 'iniciante' } });
}

describe('falha de provedor sem fallback automático', () => {
  it('exibe um alerta determinístico e não gera cards quando o provedor falha', () => {
    generateCards.mockImplementation(() => {
      throw new Error('Falha do provedor de texto: limite de requisições excedido.');
    });

    render(<DashboardPage />);
    selectVerbAndLevel();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Falha do provedor de texto: limite de requisições excedido.');
    expect(screen.queryByRole('region', { name: 'Cards gerados' })).not.toBeInTheDocument();
    expect(generateCards).toHaveBeenCalledTimes(1);
  });

  it('não tenta automaticamente outro modelo após a falha (sem fallback automático)', () => {
    generateCards.mockImplementation(() => {
      throw new Error('Falha do provedor de imagem.');
    });

    render(<DashboardPage />);
    selectVerbAndLevel();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(generateCards).toHaveBeenCalledTimes(1);
    expect(generateCards).toHaveBeenCalledWith('make', 10, 0);
  });

  it('permite tentar novamente a mesma combinação após uma falha, sem bloqueio por duplicidade', () => {
    generateCards.mockImplementationOnce(() => {
      throw new Error('Falha temporária do provedor.');
    });
    generateCards.mockImplementationOnce(() => Array.from({ length: 10 }, (_, index) => ({
      sentence: `Exemplo ${index + 1}: I make something.`,
      translation: `Exemplo ${index + 1}: Eu make alguma coisa.`,
      tags: '',
      notes: '',
      pronunciation: '',
      imageStatus: index === 0 ? 'gerada' as const : 'reutilizada' as const,
      audioStatus: 'gerado' as const,
      approved: false,
    })));

    render(<DashboardPage />);
    selectVerbAndLevel();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Falha temporária do provedor.');

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(screen.getByRole('region', { name: 'Cards gerados' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(10);
  });
});

describe('duplicidade de combinação verbo+nível', () => {
  it('bloqueia a repetição da combinação mesmo após regenerar apenas os faltantes', () => {
    generateCards.mockImplementation((verb: string, count: number, startIndex: number) =>
      Array.from({ length: count }, (_, index) => ({
        sentence: `Exemplo ${startIndex + index + 1}: I ${verb} something.`,
        translation: `Exemplo ${startIndex + index + 1}: Eu ${verb} alguma coisa.`,
        tags: '',
        notes: '',
        pronunciation: '',
        imageStatus: startIndex + index === 0 ? 'gerada' as const : 'reutilizada' as const,
        audioStatus: 'gerado' as const,
        approved: false,
      })),
    );

    render(<DashboardPage />);
    selectVerbAndLevel();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir card 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar novamente apenas os faltantes' }));

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Essa combinação já foi gerada nesta sessão.');
    expect(screen.getAllByRole('article')).toHaveLength(10);
  });
});
