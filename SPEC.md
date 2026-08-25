# Especificação do MVP — Gerador de Cards para Anki

## Problem Statement

Estudantes brasileiros de inglês precisam praticar frases naturais e compreender os verbos estruturais `make`, `do`, `take`, `get`, `have`, `give`, `put`, `set` e `go`, mas criar cards completos manualmente — com frase, tradução, imagem e áudio — é demorado. Também é fácil repetir frases, perder o histórico de estudo e exportar um conjunto inconsistente para o Anki.

## Solution

Criar uma aplicação web responsiva, acessível principalmente pelo celular, que permita ao usuário escolher um dos 9 verbos e um nível de dificuldade, gerar 10 cards inéditos com IA, revisar e editar cada card e exportar o conjunto aprovado em um arquivo `.apkg` compatível com o Anki.

A aplicação manterá o histórico por usuário para evitar repetições ao longo dos dias. Texto, imagem, tradução e áudio serão produzidos por provedores configuráveis, com OpenRouter como provedor principal de texto e imagem e suporte a provedor externo de TTS quando necessário.

## User Stories

1. Como estudante de inglês, quero criar uma conta com e-mail e senha, para manter meu histórico de cards.
2. Como usuário, quero fazer login e logout, para acessar meus cards com segurança.
3. Como usuário, quero recuperar minha senha, para voltar a acessar minha conta caso a esqueça.
4. Como usuário, quero configurar uma chave do OpenRouter, para usar meus próprios créditos de IA.
5. Como usuário, quero configurar uma chave de um provedor TTS, para gerar áudios quando o OpenRouter não oferecer esse recurso.
6. Como usuário, quero validar uma chave ao salvá-la, para saber imediatamente se ela funciona.
7. Como usuário, quero ver saldo ou limite disponível quando o provedor oferecer essa informação, para controlar custos.
8. Como usuário, quero escolher um dos nove verbos estruturais, para praticar uma construção específica.
9. Como usuário, quero escolher entre iniciante, intermediário e avançado, para receber frases adequadas ao meu conhecimento.
10. Como usuário iniciante, quero frases com vocabulário frequente e gramática simples, para compreender o conteúdo.
11. Como usuário intermediário, quero frases com vocabulário contextual e estruturas variadas, para ampliar minha fluência.
12. Como usuário avançado, quero frases naturais, idiomáticas e gramaticalmente complexas, para refinar minha compreensão.
13. Como usuário, quero escolher modelos de texto, imagem e tradução, para equilibrar qualidade e custo.
14. Como usuário, quero escolher voz, sexo, sotaque e velocidade do áudio, para personalizar minha prática auditiva.
15. Como usuário, quero gerar exatamente 10 cards por solicitação, para criar uma sessão diária de estudo.
16. Como usuário, quero receber frases naturais em inglês relacionadas ao verbo escolhido, para aprender combinações usadas em conversas reais.
17. Como usuário, quero receber a tradução em pt-BR no verso, para conferir o significado.
18. Como usuário, quero receber uma imagem que represente a frase, para criar associação visual.
19. Como usuário, quero receber o áudio da frase em inglês, para praticar escuta e pronúncia.
20. Como usuário, quero que o sistema reutilize uma imagem adequada quando possível, para reduzir custos e tempo de geração.
21. Como usuário, quero que uma nova imagem seja gerada quando não houver uma adequada, para manter a qualidade do card.
22. Como usuário, quero que frases e combinações verbo-substantivo já usadas não sejam repetidas, para ampliar meu repertório.
23. Como usuário, quero ver o progresso da geração, para saber quais recursos já foram produzidos.
24. Como usuário, quero ser avisado quando um card falhar na geração, para decidir como resolver o problema.
25. Como usuário, quero escolher entre manter os cards válidos ou gerar novamente apenas os faltantes, para não perder uma geração parcial.
26. Como usuário, quero revisar todos os cards antes da exportação, para corrigir problemas.
27. Como usuário, quero editar a frase em inglês, para corrigir ou personalizar o exemplo.
28. Como usuário, quero editar a tradução, para adequá-la ao sentido que desejo estudar.
29. Como usuário, quero trocar ou regenerar a imagem, para melhorar a representação visual.
30. Como usuário, quero trocar ou regenerar o áudio, para escolher uma pronúncia mais adequada.
31. Como usuário, quero adicionar observações, para registrar explicações pessoais.
32. Como usuário, quero adicionar tags, para organizar meus estudos.
33. Como usuário, quero informar uma pronúncia personalizada, para guardar uma dica de fala.
34. Como usuário, quero excluir um card, para não exportar conteúdo inadequado.
35. Como usuário, quero regenerar um card individual, para substituir apenas o exemplo que não gostei.
36. Como usuário, quero confirmar a geração final, para exportar somente cards aprovados.
37. Como usuário, quero exportar os cards como `.apkg`, para importá-los facilmente no Anki.
38. Como usuário, quero que todos os cards sejam exportados para um único deck `English Light Verbs`, para manter meu estudo centralizado.
39. Como usuário, quero receber um nome de arquivo claro com verbo e data, para encontrar o pacote facilmente.
40. Como usuário, quero baixar o arquivo pelo celular, para importá-lo no Anki Mobile.
41. Como usuário, quero consultar minhas gerações anteriores, para revisar ou baixar novamente um pacote dentro do período de retenção.
42. Como usuário, quero excluir meus dados e arquivos, para controlar minha privacidade.

## Implementation Decisions

- A aplicação será web responsiva, otimizada para uso em telas de celular.
- O MVP terá autenticação por e-mail e senha.
- Cada usuário terá histórico isolado de frases, combinações, gerações, cards e exportações.
- O fluxo principal será: `Login → Configurações → Nova geração → Configuração da geração → Processamento → Revisão → Exportação`.
- Os nove verbos disponíveis serão: `make`, `do`, `take`, `get`, `have`, `give`, `put`, `set` e `go`.
- Cada geração terá um verbo, um nível e 10 cards solicitados.
- A dificuldade será definida principalmente por vocabulário e gramática.
- A IA deverá retornar conteúdo estruturado para cada card: frase em inglês, tradução pt-BR, contexto/descrição visual, tags e metadados de validação.
- Preferência de linguagem: as frases devem usar inglês coloquial e natural do dia a dia, incluindo expressões, phrasal verbs e combinações que ocorram naturalmente em conversas reais quando forem adequadas ao verbo e ao nível. Evitar frases artificiais, literais ou construídas apenas para conter o verbo; a naturalidade tem prioridade sobre a tradução palavra por palavra. Quando uma expressão não tiver tradução direta natural em pt-BR, a tradução deve transmitir seu significado/uso, sem forçar equivalência literal.
- A aplicação validará duplicidade exata e duplicidade da combinação verbo-substantivo antes de aceitar um card. O histórico deverá ser consultado antes da geração e novamente antes da persistência.
- A avaliação semântica avançada de frases semelhantes fica preparada para evolução, mas não é requisito do primeiro MVP.
- O usuário poderá selecionar modelos independentes para texto, imagem e tradução entre opções recomendadas pelos provedores.
- Falhas de modelo não terão fallback automático: a aplicação exibirá o erro e permitirá ao usuário escolher outro modelo.
- OpenRouter será o provedor principal configurável para texto e imagem. O áudio deverá usar OpenRouter quando houver suporte adequado ou um provedor TTS externo informado pelo usuário.
- Chaves de provedores nunca serão expostas ao navegador durante chamadas de geração; deverão ser armazenadas de forma segura/criptografada no backend.
- A tela de configurações terá cadastro, validação, remoção e status das chaves. Saldo/limite será exibido somente quando houver endpoint e permissão do provedor.
- O áudio deverá permitir configurar voz, sexo, sotaque e velocidade, conforme capacidades do provedor escolhido.
- A revisão deverá permitir editar todos os campos principais, regenerar imagem/áudio, adicionar observações, tags e pronúncia personalizada, e excluir cards.
- O usuário decidirá o tratamento de geração parcial: manter cards válidos ou gerar apenas os faltantes.
- O arquivo `.apkg` será criado no backend com mídia incorporada e um único deck `English Light Verbs`.
- O download será iniciado pelo navegador. A aplicação poderá sugerir um nome como `english-light-verbs-make-2025-01-01.apkg`, mas não poderá garantir a criação automática de `Documentos/anki` em todos os sistemas móveis.
- Cards, mídias e pacotes exportados serão armazenados por 30 dias e então removidos automaticamente, salvo exclusão antecipada pelo usuário.
- O verso conterá a tradução em pt-BR e poderá conter observações/pronúncia conforme a configuração do card. A frente conterá frase, imagem e áudio.

## Fluxo das Telas

### 1. Login e cadastro

- Login com e-mail e senha.
- Cadastro de nova conta.
- Recuperação de senha.
- Mensagens claras para credenciais inválidas e conta inexistente.

### 2. Configurações

- Cadastro de chave OpenRouter.
- Cadastro opcional de provedor e chave TTS.
- Validação imediata das credenciais.
- Seleção de modelos recomendados por categoria.
- Preferências padrão de voz, sotaque, sexo e velocidade.
- Informações de limite/saldo quando disponíveis.

### 3. Nova geração

- Seleção de verbo em uma lista dos 9 verbos.
- Seleção do nível de dificuldade.
- Seleção ou confirmação dos modelos.
- Seleção ou confirmação da voz.
- Botão para iniciar a geração de 10 cards.

### 4. Processamento

- Progresso por card e por recurso: texto, tradução, imagem e áudio.
- Estado de sucesso, erro e processamento.
- Ao final, opção de continuar com cards válidos ou tentar gerar os faltantes.

### 5. Revisão

- Lista ou carrossel dos 10 cards.
- Visualização da frente e do verso.
- Edição inline dos campos.
- Reprodução do áudio.
- Regeneração individual de imagem e áudio.
- Exclusão, tags, observações e pronúncia personalizada.
- Indicador de validação e duplicidade.
- Botão de aprovação/exportação.

### 6. Exportação e histórico

- Resumo dos cards aprovados.
- Geração do `.apkg`.
- Download com nome de arquivo descritivo.
- Histórico de gerações e downloads ainda dentro dos 30 dias.
- Exclusão manual de geração e mídias.

## Testing Decisions

- Testar comportamento externo e fluxos completos, evitando testes acoplados à implementação interna.
- O principal seam de teste será o fluxo da geração até a exportação: configuração → geração → revisão → `.apkg`.
- Testar autenticação, isolamento de dados por usuário e proteção das chaves.
- Testar seleção de verbo, nível, modelos e voz.
- Testar que uma geração solicita 10 cards e rejeita duplicidades conforme o histórico.
- Testar geração parcial, regeneração de faltantes e falha de provedor sem fallback automático.
- Testar edição, exclusão, tags, observações, pronúncia e regeneração individual.
- Testar que o `.apkg` contém o deck correto, os campos esperados e as mídias reproduzíveis.
- Testar retenção e exclusão após 30 dias.
- Como o repositório está vazio, não há testes anteriores para reutilizar; a suíte inicial deverá ser definida junto com a primeira implementação.

## Out of Scope

- Aplicativo nativo Android ou iOS.
- Sincronização direta com o Anki ou AnkiConnect.
- Criação automática garantida da pasta `Documentos/anki` no dispositivo.
- Fallback automático entre modelos ou provedores.
- Decks separados por verbo ou nível.
- Sistema de repetição espaçada próprio.
- Estatísticas de desempenho no Anki.
- Avaliação semântica avançada de similaridade no primeiro MVP.
- Marketplace de vozes, modelos ou imagens.
- Compartilhamento público de decks.
- Pagamento, cobrança ou gerenciamento de créditos pela aplicação.

## Design System e Direção Visual

- A interface seguirá uma linguagem visual lúdica de aplicativo de aprendizagem, inspirada no material de referência fornecido, sem copiar identidade proprietária.
- Tema claro, com canvas `#ffffff` (Paper White), superfícies planas e bastante espaço em branco.
- Cor primária para CTAs e progresso: Eager Green `#58cc02`.
- Cor secundária para links e ações alternativas: Spark Blue `#1cb0f6`.
- Destaques suaves: Storybook Green `#d7ffb8` e Fresh Leaf `#a5ed6e`.
- Texto principal: Charcoal `#4b4b4b`; texto secundário: Pencil Gray `#777777`; estados desabilitados e bordas: Faded Gray `#afafaf`.
- Títulos de destaque usarão a fonte `feather` ou substituta arredondada equivalente, peso 700, entre 48px e 64px, com letter-spacing de `-0.02em`.
- Corpo e navegação usarão `duolingo-sans` ou substituta equivalente; corpo em 17px/500 e rótulos de navegação em caixa alta, 15px/700, com tracking aproximado de `0.053em`.
- Botões, links destacados, campos e itens de navegação terão cantos arredondados de 12px; botões secundários usarão borda de 2px.
- Não usar gradientes, glassmorphism, sombras pesadas ou cantos retos.
- Ilustrações e imagens poderão usar uma paleta secundária lúdica, mas essa paleta não será usada no chrome da interface.
- A experiência será predominantemente de coluna única, responsiva, com navegação simples e layouts de revisão priorizando legibilidade no celular.
- Os tokens de design ficam documentados em `/home/movida/Downloads/tokens.json`; a referência visual completa está em `/home/movida/Downloads/DESIGN.md`.

## Further Notes

- A escolha de permitir chaves próprias reduz o custo operacional, mas exige documentação clara sobre segurança, limites e cobrança de cada provedor.
- O contrato de provedores deve ser modular para permitir adicionar TTS e outros serviços sem alterar o fluxo de revisão/exportação.
- Antes da implementação, devem ser confirmadas as APIs específicas para geração de imagem, TTS e consulta de saldo do OpenRouter/provedor escolhido.
- Como o diretório do projeto está vazio e não há issue tracker configurado, esta especificação foi criada como documento local. A publicação em um tracker exige a configuração indicada por `/setup-matt-pocock-skills`.
