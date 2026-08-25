/**
 * Geração do pacote `.apkg` a partir dos cards aprovados na revisão
 * (etapa export-2).
 *
 * Reutiliza o deck e o note-type definidos em src/lib/anki-template.ts
 * (etapa export-1) e a biblioteca `ankipack` (avaliada na pesquisa desta
 * subetapa) para produzir bytes de um `.apkg` válido, com mídia
 * incorporada quando disponível.
 *
 * A função é pura em relação aos dados de entrada: recebe os cards já
 * aprovados pelo usuário (mesmos campos usados na revisão em
 * src/app/dashboard/page.tsx) e uma instância de sql.js já inicializada
 * pelo chamador, para não depender de rede/DOM dentro deste módulo e
 * permanecer testável com Vitest puro.
 */
import { Deck, Note, Notetype, Package } from 'ankipack';
import type { SqlJsStatic } from 'sql.js';
import { DECK_NAME, ankiModel } from './anki-template';

export interface ReviewedCard {
  sentence: string;
  translation: string;
  tags: string;
  notes: string;
  pronunciation: string;
  /** Bytes reais da imagem, quando disponíveis; ausentes nesta simulação. */
  imageBytes?: Uint8Array;
  imageFilename?: string;
  /** Bytes reais do áudio, quando disponíveis; ausentes nesta simulação. */
  audioBytes?: Uint8Array;
  audioFilename?: string;
  approved: boolean;
}

/**
 * Monta o note type do ankipack a partir do template determinístico de
 * src/lib/anki-template.ts, preservando id, nome e ordem de campos entre
 * chamadas para permitir atualização incremental do deck no Anki.
 */
export function buildNotetype(): Notetype {
  return new Notetype({
    id: Number(ankiModel.id),
    name: ankiModel.name,
    fields: ankiModel.flds.map((field) => ({ name: field.name })),
    templates: ankiModel.tmpls.map((template) => ({
      name: template.name,
      questionFormat: template.qfmt,
      answerFormat: template.afmt,
    })),
    css: ankiModel.css,
  });
}

function fieldsFor(card: ReviewedCard): string[] {
  const imageField = card.imageFilename ? `<img src="${card.imageFilename}">` : '';
  const audioField = card.audioFilename ? `[sound:${card.audioFilename}]` : '';
  return [card.sentence, card.translation, card.tags, card.notes, card.pronunciation, imageField, audioField];
}

/**
 * Constrói o pacote `.apkg` do deck único `English Light Verbs` contendo
 * apenas os cards aprovados, com mídia incorporada quando os bytes
 * estiverem disponíveis.
 *
 * Guardrails:
 * - Cards não aprovados nunca são incluídos na exportação.
 * - O pacote não é gerado quando não há nenhum card aprovado, para evitar
 *   um `.apkg` vazio e enganoso.
 */
/**
 * Monta o Package (deck + notas + mídia) antes da serialização, para que
 * a montágem em si seja testável independentemente do sql.js.
 */
export function buildAnkiPackageDocument(cards: ReviewedCard[]): Package {
  const approvedCards = cards.filter((card) => card.approved);
  if (approvedCards.length === 0) {
    throw new Error('Nenhum card aprovado para exportação.');
  }

  const notetype = buildNotetype();
  const deck = new Deck({ name: DECK_NAME });

  for (const card of approvedCards) {
    const tags = card.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    deck.addNote(new Note({ notetype, fields: fieldsFor(card), tags }));
  }

  const pkg = new Package();
  pkg.addDeck(deck);

  for (const card of approvedCards) {
    if (card.imageFilename && card.imageBytes) {
      pkg.addMedia(card.imageFilename, card.imageBytes);
    }
    if (card.audioFilename && card.audioBytes) {
      pkg.addMedia(card.audioFilename, card.audioBytes);
    }
  }

  return pkg;
}

export async function buildAnkiPackage(cards: ReviewedCard[], SQL: SqlJsStatic): Promise<Uint8Array> {
  const pkg = buildAnkiPackageDocument(cards);
  return pkg.toUint8Array(SQL);
}
