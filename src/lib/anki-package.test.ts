import initSqlJs, { type SqlJsStatic } from 'sql.js';
import JSZip from 'jszip';
import { Collection } from 'ankipack';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildAnkiPackage, buildAnkiPackageDocument, buildNotetype, type ReviewedCard } from './anki-package';
import { DECK_NAME } from './anki-template';

let SQL: SqlJsStatic;

beforeAll(async () => {
  SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), 'node_modules/sql.js/dist', file),
  });
});

function makeCard(overrides: Partial<ReviewedCard> = {}): ReviewedCard {
  return {
    sentence: 'I make something.',
    translation: 'Eu faço algo.',
    tags: '',
    notes: '',
    pronunciation: '',
    approved: true,
    ...overrides,
  };
}

describe('buildNotetype', () => {
  it('reflete os campos e templates determinísticos de anki-template.ts', () => {
    const notetype = buildNotetype();
    expect(notetype.name).toBe('English Light Verbs');
    expect(notetype.fields.map((field) => field.name)).toEqual([
      'Sentence',
      'Translation',
      'Tags',
      'Notes',
      'Pronunciation',
      'Image',
      'Audio',
    ]);
  });
});

describe('buildAnkiPackage', () => {
  it('lança erro determinístico quando nenhum card está aprovado', async () => {
    await expect(buildAnkiPackage([makeCard({ approved: false })], SQL)).rejects.toThrow(
      'Nenhum card aprovado para exportação.',
    );
  });

  it('gera bytes de um .apkg válido (zip) contendo apenas os cards aprovados', async () => {
    const cards = [makeCard({ sentence: 'Card aprovado' }), makeCard({ sentence: 'Card reprovado', approved: false })];
    const bytes = await buildAnkiPackage(cards, SQL);
    expect(bytes.length).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files)).toContain('collection.anki21b');
  });

  it('incorpora mídia de imagem e áudio quando os bytes estão disponíveis', async () => {
    const cards = [
      makeCard({
        imageFilename: 'img-1.png',
        imageBytes: new Uint8Array([137, 80, 78, 71]),
        audioFilename: 'audio-1.mp3',
        audioBytes: new Uint8Array([1, 2, 3, 4]),
      }),
    ];
    const bytes = await buildAnkiPackage(cards, SQL);
    const zip = await JSZip.loadAsync(bytes);
    expect(zip.file('media')).not.toBeNull();

    // buildAnkiPackageDocument expõe o Package antes da serialização, para
    // confirmar que os dois arquivos foram realmente anexados sem depender
    // do formato binário interno do manifesto de mídia.
    const document = buildAnkiPackageDocument(cards);
    const collection = await document.toCollection();
    const mediaNames = collection.media.map((entry) => entry.name);
    expect(mediaNames).toContain('img-1.png');
    expect(mediaNames).toContain('audio-1.mp3');
  });

  it('produz um .apkg cujo deck e campos podem ser abertos e lidos de volta pelo ankipack (round-trip real)', async () => {
    const cards = [
      makeCard({
        sentence: 'I make breakfast.',
        translation: 'Eu preparo o café da manhã.',
        tags: 'rotina, trabalho',
        notes: 'Contexto profissional.',
        pronunciation: 'meik',
      }),
      makeCard({ sentence: 'Card reprovado', approved: false }),
    ];

    const bytes = await buildAnkiPackage(cards, SQL);
    const collection = Collection.open(bytes, SQL);

    expect(collection.deckNames()).toEqual([DECK_NAME]);

    const notesInDeck = collection.notes({ deck: DECK_NAME });
    expect(notesInDeck).toHaveLength(1);
    expect(notesInDeck[0].fields).toEqual([
      'I make breakfast.',
      'Eu preparo o café da manhã.',
      'rotina, trabalho',
      'Contexto profissional.',
      'meik',
      '',
      '',
    ]);
    expect(notesInDeck[0].tags).toEqual(['rotina', 'trabalho']);
  });

  it('anexa mídia reproduzível: os bytes lidos de volta do .apkg são idênticos aos originais', async () => {
    const imageBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const audioBytes = new Uint8Array([73, 68, 51, 3, 0, 0, 0]);
    const cards = [
      makeCard({
        imageFilename: 'img-round-trip.png',
        imageBytes,
        audioFilename: 'audio-round-trip.mp3',
        audioBytes,
      }),
    ];

    const bytes = await buildAnkiPackage(cards, SQL);
    const collection = Collection.open(bytes, SQL);

    const readImage = collection.data.media.find((file) => file.name === 'img-round-trip.png');
    const readAudio = collection.data.media.find((file) => file.name === 'audio-round-trip.mp3');
    expect(readImage).toBeDefined();
    expect(readAudio).toBeDefined();
    expect(Array.from(readImage!.data)).toEqual(Array.from(imageBytes));
    expect(Array.from(readAudio!.data)).toEqual(Array.from(audioBytes));
  });
});
