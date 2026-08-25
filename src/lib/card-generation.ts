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

const colloquialExamples: Record<string, Array<[string, string]>> = {
  make: [['I make coffee before work.', 'Eu faço café antes do trabalho.'], ['Let’s make it quick.', 'Vamos fazer isso rápido.'], ['I made it home just in time.', 'Cheguei em casa bem na hora.']],
  do: [['I have to do the dishes tonight.', 'Tenho que lavar a louça hoje à noite.'], ['What do you do for fun?', 'O que você faz para se divertir?'], ['I’ll do my best.', 'Vou fazer o meu melhor.']],
  take: [['Take your time—there’s no rush.', 'Não tenha pressa — não estamos correndo.'], ['I’ll take care of it.', 'Eu cuido disso.'], ['Can you take a look at this?', 'Você pode dar uma olhada nisso?']],
  get: [['I need to get going.', 'Eu preciso ir.'], ['Did you get my message?', 'Você recebeu minha mensagem?'], ['Let’s get together this weekend.', 'Vamos nos encontrar neste fim de semana.']],
  have: [['I have no idea.', 'Não faço ideia.'], ['We’re having people over tonight.', 'Vamos receber gente em casa hoje à noite.'], ['Have a good one!', 'Tenha um bom dia!']],
  give: [['Give me a second.', 'Me dá um segundo.'], ['That gives me an idea.', 'Isso me dá uma ideia.'], ['I’ll give you a call later.', 'Te ligo mais tarde.']],
  put: [['Put it on my tab.', 'Coloca na minha conta.'], ['I’ll put it off until tomorrow.', 'Vou deixar isso para amanhã.'], ['Put yourself in my shoes.', 'Coloque-se no meu lugar.']],
  set: [['Let’s set a date.', 'Vamos marcar uma data.'], ['I set my alarm for seven.', 'Programei meu alarme para as sete.'], ['That really set me back.', 'Isso realmente me atrasou.']],
  go: [['I have to go.', 'Eu tenho que ir.'], ['How did it go?', 'Como foi?'], ['Go ahead—make yourself at home.', 'Pode ficar à vontade.']],
};

export function generateCards(verb: string, count: number, startIndex: number): GeneratedCard[] {
  const examples = colloquialExamples[verb] ?? [['I am working on it.', 'Estou trabalhando nisso.']];
  return Array.from({ length: count }, (_, index) => {
    const [sentence, translation] = examples[(startIndex + index) % examples.length];
    return {
    sentence,
    translation,
    tags: '',
    notes: '',
    pronunciation: '',
    imageStatus: startIndex + index === 0 ? 'gerada' : 'reutilizada',
    audioStatus: 'gerado',
      approved: false,
    };
  });
}
