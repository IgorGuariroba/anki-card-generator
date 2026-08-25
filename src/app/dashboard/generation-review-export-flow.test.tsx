/**
 * Teste de integração do fluxo completo geração → revisão → exportação
 * (etapa quality-2).
 *
 * Guardrails cobertos por este arquivo (ver project-plan.json > quality > research):
 * - As edições feitas na revisão (frase, tradução, tags, observações,
 *   pronúncia) devem ser exatamente os dados enviados para a exportação,
 *   sem perda nem mistura entre cards.
 * - Somente cards aprovados chegam à construção do pacote `.apkg`; cards
 *   não aprovados e cards excluídos nunca são exportados.
 * - Uma falha na geração do pacote (`buildAnkiPackage`) deve ser
 *   comunicada por um alerta acessível, sem quebrar a tela nem descartar
 *   os cards já revisados.
 * - O nome do arquivo baixado (retornado por `triggerApkgDownload`) deve
 *   aparecer na mensagem de sucesso exibida ao usuário.
 *
 * `sql.js`, `@/lib/anki-package` e `@/lib/apkg-download` são mockados
 * porque dependem de I/O real (arquivo .wasm em disco e APIs de DOM de
 * download não implementadas pelo jsdom) já cobertos isoladamente por
 * src/lib/anki-package.test.ts e src/lib/apkg-download.test.ts; este
 * arquivo verifica apenas a integração dos dados entre as três etapas do
 * fluxo dentro do componente React.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const buildAnkiPackage = vi.fn();
const triggerApkgDownload = vi.fn();

vi.mock('sql.js', () => ({ default: vi.fn().mockResolvedValue({}) }));
vi.mock('@/lib/anki-package', () => ({ buildAnkiPackage: (...args: unknown[]) => buildAnkiPackage(...args) }));
vi.mock('@/lib/apkg-download', () => ({ triggerApkgDownload: (...args: unknown[]) => triggerApkgDownload(...args) }));

const { default: DashboardPage } = await import('./page');

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function generateCards() {
  fireEvent.change(screen.getByLabelText('Verbo'), { target: { value: 'make' } });
  fireEvent.change(screen.getByLabelText('Nível'), { target: { value: 'iniciante' } });
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar geração' }));
}

describe('fluxo geração → revisão → exportação', () => {
  it('envia exatamente os dados editados na revisão para a exportação, somente dos cards aprovados', async () => {
    buildAnkiPackage.mockResolvedValue(new Uint8Array([1, 2, 3]));
    triggerApkgDownload.mockReturnValue({ fileName: 'english-light-verbs-make-2026-01-01.apkg' });

    render(<DashboardPage />);
    generateCards();

    fireEvent.change(screen.getByLabelText('Frase em inglês do card 1'), { target: { value: 'I make breakfast every day.' } });
    fireEvent.change(screen.getByLabelText('Tradução em português do card 1'), { target: { value: 'Eu preparo o café da manhã todos os dias.' } });
    fireEvent.change(screen.getByLabelText('Tags do card 1'), { target: { value: 'rotina, trabalho' } });
    fireEvent.change(screen.getByLabelText('Observações do card 1'), { target: { value: 'Usar em contexto profissional.' } });
    fireEvent.change(screen.getByLabelText('Pronúncia personalizada do card 1'), { target: { value: 'meik' } });

    fireEvent.click(screen.getByLabelText('Aprovar card 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir card 2' }));

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar geração final' }));

    await waitFor(() => expect(buildAnkiPackage).toHaveBeenCalledTimes(1));

    const [exportedCards] = buildAnkiPackage.mock.calls[0] as [
      Array<{ sentence: string; translation: string; tags: string; notes: string; pronunciation: string; approved: boolean }>,
    ];

    expect(exportedCards).toHaveLength(9);
    const approvedCards = exportedCards.filter((card) => card.approved);
    expect(approvedCards).toHaveLength(1);
    expect(approvedCards[0]).toMatchObject({
      sentence: 'I make breakfast every day.',
      translation: 'Eu preparo o café da manhã todos os dias.',
      tags: 'rotina, trabalho',
      notes: 'Usar em contexto profissional.',
      pronunciation: 'meik',
    });

    await waitFor(() => expect(triggerApkgDownload).toHaveBeenCalledTimes(1));
    const [bytesArg] = triggerApkgDownload.mock.calls[0] as [Uint8Array, string];
    expect(bytesArg).toEqual(new Uint8Array([1, 2, 3]));

    const successMessages = await screen.findAllByRole('status');
    expect(successMessages.some((node) => node.textContent?.includes('english-light-verbs-make-2026-01-01.apkg gerado com os cards aprovados.'))).toBe(true);
  });

  it('exibe um alerta acessível e preserva os cards revisados quando a geração do pacote falha', async () => {
    buildAnkiPackage.mockRejectedValue(new Error('Falha simulada ao gerar o pacote.'));

    render(<DashboardPage />);
    generateCards();

    fireEvent.change(screen.getByLabelText('Frase em inglês do card 1'), { target: { value: 'I make breakfast every day.' } });
    fireEvent.click(screen.getByLabelText('Aprovar card 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar geração final' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha simulada ao gerar o pacote.');
    expect(triggerApkgDownload).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Frase em inglês do card 1')).toHaveValue('I make breakfast every day.');
    expect(screen.getAllByRole('article')).toHaveLength(10);
  });
});
