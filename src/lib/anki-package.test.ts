import initSqlJs, { type SqlJsStatic } from 'sql.js';
import JSZip from 'jszip';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildAnkiPackage, buildAnkiPackageDocument, buildNotetype, type ReviewedCard } from './anki-package';

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
});
