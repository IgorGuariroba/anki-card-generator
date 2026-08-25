/**
 * Template de exportação para o Anki (English Light Verbs).
 *
 * Define o deck único e o modelo de note-type reutilizados pela exportação
 * `.apkg` (etapa export-2). Os nomes de campo espelham exatamente os dados
 * já coletados na revisão dos cards em src/app/dashboard/page.tsx
 * (sentence, translation, tags, notes, pronunciation, imageStatus,
 * audioStatus), para que a exportação não exija remapeamento adicional.
 *
 * Regras da SPEC.md: a frente contém frase, imagem e áudio; o verso contém
 * a tradução em pt-BR e pode conter observações e pronúncia personalizada.
 *
 * Importante: a imagem ilustra o SIGNIFICADO DA FRASE EM INGLÊS (campo
 * Sentence/Image ficam juntos na frente), para apoiar a fixação visual do
 * inglês antes de o usuário ver a tradução. A imagem nunca representa nem
 * fica associada ao campo Translation — a tradução só aparece no verso,
 * junto de {{FrontSide}}.
 */

export const DECK_NAME = 'English Light Verbs';

export const ankiModel = {
  // Id fixo e determinístico (não gerado por Date.now()) para permitir que
  // reexportações futuras atualizem o mesmo note-type no Anki em vez de
  // duplicá-lo.
  id: '1735689600000',
  name: 'English Light Verbs',
  flds: [
    { name: 'Sentence' },
    { name: 'Translation' },
    { name: 'Tags' },
    { name: 'Notes' },
    { name: 'Pronunciation' },
    { name: 'Image' },
    { name: 'Audio' },
  ],
  tmpls: [
    {
      name: 'Card 1',
      qfmt: '<div class="english-light-verbs">\n  <p class="sentence">{{Sentence}}</p>\n  {{Image}}\n  {{Audio}}\n</div>',
      afmt:
        '{{FrontSide}}\n<hr id="answer">\n<div class="english-light-verbs">\n  <p class="translation">{{Translation}}</p>\n  {{#Pronunciation}}<p class="pronunciation">{{Pronunciation}}</p>{{/Pronunciation}}\n  {{#Notes}}<p class="notes">{{Notes}}</p>{{/Notes}}\n</div>',
    },
  ],
  css:
    '.card { font-family: Arial, sans-serif; text-align: center; color: #4b4b4b; }\n' +
    '.sentence { font-size: 22px; font-weight: 700; }\n' +
    '.translation { font-size: 20px; color: #58cc02; font-weight: 700; }\n' +
    '.pronunciation, .notes { font-size: 15px; color: #777777; }',
};
