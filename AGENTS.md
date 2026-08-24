# Instruções para agentes

<!-- BEGIN:nextjs-agent-rules -->
## Regras específicas do Next.js 16

Esta aplicação usa Next.js 16. APIs, convenções e estrutura podem diferir de versões anteriores. Antes de alterar código Next.js, leia a documentação versionada em `node_modules/next/dist/docs/` e consulte o guia oficial de upgrade da versão instalada. Respeite avisos de depreciação.

- Use App Router, Server Components por padrão e Client Components somente quando interatividade exigir.
- Use Turbopack, `next/image`, `next/font` e APIs assíncronas de request (`params`, `searchParams`, `cookies`, `headers`).
- Use `proxy.ts` em vez de criar novo `middleware.ts`.
- Não use `next lint`; use o ESLint CLI.
- Não introduza APIs `experimental` ou `unstable_` sem decisão documentada.
- Preserve `typedRoutes` e `reactStrictMode` no `next.config.ts`.
- Antes de concluir uma tarefa Next.js, execute `npm run verify`.

<!-- END:nextjs-agent-rules -->

## Plano obrigatório de desenvolvimento

O fluxo oficial de desenvolvimento deste projeto está definido em [`project-plan.json`](./project-plan.json).

Todo agente deve:

1. Ler o `project-plan.json` antes de iniciar qualquer implementação.
2. Executar os subpassos de pré-implementação da etapa antes de alterar código:
   - pesquisar no código os arquivos afetados e oportunidades de reaproveitamento;
   - consultar a documentação oficial correspondente à versão instalada do framework e das bibliotecas relevantes;
   - definir e registrar guardrails determinísticos para a mudança (invariantes, contratos, validações e comandos de verificação).
3. Só iniciar a implementação depois que a pesquisa e os guardrails estiverem registrados na etapa e os três gates pré-implementação (`research-code`, `research-docs`, `define-guardrails`) estiverem com `status: completed` no `project-plan.json`.
2. Identificar a etapa e a subetapa correspondente ao trabalho solicitado.
3. Respeitar as dependências declaradas em `dependsOn`.
4. Não iniciar uma subetapa bloqueada por outra etapa ainda não concluída.
5. Atualizar o status da tarefa no `project-plan.json`:
   - `pending`: ainda não iniciada;
   - `in_progress`: em desenvolvimento;
   - `completed`: implementada e validada;
   - `blocked`: impedida por dependência, decisão ou problema externo.
6. Registrar o agente responsável no campo `agent` da etapa principal quando assumir uma tarefa.
7. Só marcar uma tarefa como `completed` depois de executar as validações e testes aplicáveis.
7.1. O status `completed` de uma etapa exige que o gate pós-implementação `securityVerification` esteja `completed`, com evidência para SAST, SCA, Secret Scanning, DAST e API Security Testing (ou `not_applicable` justificado).
8. Atualizar `updatedAt` ao modificar o plano.
9. Após cada etapa concluída, executar e registrar obrigatoriamente a verificação de segurança: **SAST**, **SCA**, **Secret Scanning**, **DAST** e **API Security Testing**. Se alguma ferramenta não se aplicar ou ainda não estiver disponível, registrar explicitamente a limitação e o motivo no `project-plan.json`; não considerar a etapa concluída sem essa evidência ou bloqueio documentado.

## Guardrails determinísticos

Cada etapa deve conter, antes dos subpassos de implementação, subpassos explícitos de pesquisa. Esses subpassos devem produzir decisões verificáveis, não apenas intenção:

- `research-code`: arquivos, módulos, componentes ou interfaces existentes que serão reutilizados ou afetados;
- `research-docs`: links ou referências da documentação da versão instalada;
- `define-guardrails`: regras que podem ser verificadas por teste, lint, typecheck, build, auditoria ou revisão de diff.

Se a pesquisa descobrir uma nova área de trabalho, dependência ou risco, adicione uma tarefa ao `project-plan.json` antes de implementá-la.

## Novas tarefas

Se durante o desenvolvimento surgir uma tarefa, dependência ou etapa que não esteja no plano:

1. Não implementar a tarefa de forma silenciosa.
2. Adicionar a nova tarefa ao `project-plan.json`.
3. Definir um `id` único e descritivo.
4. Informar o título, status inicial e dependências necessárias.
5. Colocar subtarefas em `substeps` quando a tarefa tiver mais de uma atividade.
6. Só depois iniciar a implementação, desde que as dependências estejam satisfeitas.

## Gerenciamento obrigatório de processos

Antes de iniciar um novo processo de desenvolvimento, servidor, watcher ou teste persistente, o agente deve encerrar o processo anterior equivalente. Em particular, executar `npm run dev` novamente deve derrubar o servidor anterior na porta configurada e iniciar uma única instância nova. Nunca deixar processos órfãos ocupando portas ou executando tarefas duplicadas.

## Regras de colaboração

- Evite editar simultaneamente a mesma etapa ou os mesmos arquivos sem coordenação.
- Mantenha as alterações focadas na etapa assumida.
- Se encontrar um bloqueio, marque a tarefa como `blocked`, descreva o motivo no contexto da tarefa ou na documentação apropriada e informe a dependência necessária.
- Ao concluir, deixe claro quais arquivos foram alterados, quais testes foram executados e qual tarefa foi atualizada.
- Não remova tarefas do plano sem registrar a decisão e confirmar que elas não são mais necessárias.

## Especificação e design

A especificação funcional está em [`SPEC.md`](./SPEC.md). A implementação deve respeitar suas decisões, incluindo o fluxo de geração, revisão, exportação `.apkg`, provedores configuráveis e retenção de arquivos.

A direção visual e os tokens de design estão descritos nos arquivos de referência indicados em `SPEC.md`. Novas decisões visuais relevantes devem ser refletidas na especificação ou nos tokens correspondentes.

## Verificação de segurança obrigatória por etapa

Cada etapa do `project-plan.json` deve possuir um subpasso `security-verification` (ou equivalente) que só pode ser marcado como `completed` após registrar:

- **SAST**: análise estática do código;
- **SCA**: análise de dependências e vulnerabilidades;
- **Secret Scanning**: busca de segredos versionados ou expostos;
- **DAST**: análise dinâmica da aplicação em execução;
- **API Security Testing**: validação de endpoints, autenticação, autorização, entradas e respostas de API.

Os resultados, comandos executados e limitações devem ficar registrados no próprio step, com data e agente responsável. O gate só deve ser marcado como `completed` depois de todas as verificações obrigatórias.

## Critério de conclusão

Uma entrega só está concluída quando:

- atende à especificação da etapa;
- possui validações ou testes adequados;
- não viola dependências do plano;
- atualiza o status correspondente em `project-plan.json`;
- documenta bloqueios, decisões ou novas tarefas identificadas.
