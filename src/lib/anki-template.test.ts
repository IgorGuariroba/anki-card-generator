import { describe, expect, it } from 'vitest';
import { ankiModel, DECK_NAME } from './anki-template';

describe('template de exportação para o Anki', () => {
  it('declara o deck único English Light Verbs', () => {
    expect(DECK_NAME).toBe('English Light Verbs');
  });

  it('declara exatamente os campos usados na revisão dos cards', () => {
    const fieldNames = ankiModel.flds.map((field) => field.name);
    expect(fieldNames).toEqual(['Sentence', 'Translation', 'Tags', 'Notes', 'Pronunciation', 'Image', 'Audio']);
  });

  it('tem id e nome estáveis para permitir atualização incremental do deck', () => {
    expect(ankiModel.id).toBe('1735689600000');
    expect(ankiModel.name).toBe('English Light Verbs');
  });

  it('a frente mostra frase, imagem e áudio, nunca a tradução', () => {
    const [template] = ankiModel.tmpls;
    expect(template.qfmt).toContain('{{Sentence}}');
    expect(template.qfmt).toContain('{{Image}}');
    expect(template.qfmt).toContain('{{Audio}}');
    expect(template.qfmt).not.toContain('{{Translation}}');
  });

  it('a imagem ilustra o significado da frase em inglês, nunca a tradução', () => {
    const [template] = ankiModel.tmpls;
    const frontIndexOfSentence = template.qfmt.indexOf('{{Sentence}}');
    const frontIndexOfImage = template.qfmt.indexOf('{{Image}}');
    expect(frontIndexOfSentence).toBeGreaterThanOrEqual(0);
    expect(frontIndexOfImage).toBeGreaterThan(frontIndexOfSentence);
    expect(template.afmt).not.toContain('{{Image}}');
  });

  it('o verso mostra a frente, a tradução e, quando preenchidos, observações e pronúncia', () => {
    const [template] = ankiModel.tmpls;
    expect(template.afmt).toContain('{{FrontSide}}');
    expect(template.afmt).toContain('{{Translation}}');
    expect(template.afmt).toContain('{{#Notes}}');
    expect(template.afmt).toContain('{{Notes}}');
    expect(template.afmt).toContain('{{#Pronunciation}}');
    expect(template.afmt).toContain('{{Pronunciation}}');
  });
});
