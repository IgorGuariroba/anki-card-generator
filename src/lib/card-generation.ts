/**
 * Módulo puro de geração de cards (etapa quality-3).
 *
 * Isola a chamada ao provedor de texto/imagem/áudio do componente do
 * dashboard, para permitir:
 * - testar de forma determinística o cenário de falha de provedor sem
 *   fallback automático (SPEC.md linha 71: "Falhas de modelo não terão
 *   fallback automático: a aplicação exibirá o erro e permitirá ao
 *   usuário escolher outro modelo");
 * - reutilizar a mesma função tanto na geração inicial (10 cards) quanto
 *   na regeneração de cards faltantes (generation-7).
 *
 * Nesta etapa ainda não há integração real com OpenRouter/TTS (ver
 * research da etapa providers); a função simula a resposta do provedor
 * localmente, mas já expõe o ponto único de chamada que lançará o erro
 * real do provedor quando a integração existir, sem qualquer tentativa
 * automática de outro modelo.
 */
export type GeneratedCard = {
  sentence: string;
  translation: string;
  tags: string;
  notes: string;
  pronunciation: string;
  imageStatus: 'gerada' | 'reutilizada' | 'regenerada';
  audioStatus: 'gerado' | 'regenerado';
  approved: boolean;
};

export function generateCards(verb: string, count: number, startIndex: number): GeneratedCard[] {
  return Array.from({ length: count }, (_, index) => ({
    sentence: `Exemplo ${startIndex + index + 1}: I ${verb} something.`,
    translation: `Exemplo ${startIndex + index + 1}: Eu ${verb} alguma coisa.`,
    tags: '',
    notes: '',
    pronunciation: '',
    imageStatus: startIndex + index === 0 ? 'gerada' : 'reutilizada',
    audioStatus: 'gerado',
    approved: false,
  }));
}
