# Anki Card Generator

Aplicação web responsiva para gerar, revisar e exportar cards de inglês para um deck Anki único chamado `English Light Verbs`.

## Requisitos

- Node.js `>=22.5.0` (necessário para `node:sqlite`, usado pela persistência em `src/lib/db.ts`)
- npm

## Executar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. O fluxo demonstrável é:

1. acessar `/login`;
2. entrar com qualquer e-mail e senha não vazios (autenticação é simulada nesta etapa);
3. escolher verbo e nível no dashboard;
4. gerar 10 cards;
5. revisar, editar e aprovar cards;
6. clicar em `Confirmar geração final` para baixar o `.apkg`.

Para validação completa, use:

```bash
npm run verify
```

Esse comando executa validação do plano, auditoria de dependências, typecheck, testes Vitest, ESLint e build Next.js.

## Configuração

A tela de dashboard permite informar uma chave OpenRouter, selecionar modelos de texto, tradução, imagem e áudio e ajustar voz, sotaque e velocidade. Nesta versão, essas configurações são apenas de interface: nenhuma chave é enviada, validada ou persistida em backend.

A exportação usa `ankipack` e `sql.js` no navegador. Os arquivos `public/sql-wasm.wasm` e `public/sql-wasm-browser.wasm` são necessários ao runtime do browser.

## Código reutilizado e contratos

- `src/app/dashboard/page.tsx`: fluxo de geração, revisão, aprovação, exportação e histórico.
- `src/app/globals.css`: tokens e componentes visuais existentes.
- `src/lib/anki-template.ts`: nome do deck, note-type, campos e templates reutilizados por `src/lib/anki-package.ts`.
- `src/lib/anki-package.ts`: serialização do `.apkg`, incluindo somente cards aprovados e mídia quando bytes reais existem.
- `src/lib/apkg-download.ts`: sanitização do nome e disparo do download usando APIs nativas do navegador.
- `src/lib/generation-retention.ts`: retenção e exclusão de gerações.
- Testes Vitest/Testing Library existentes em `src/app/**` e `src/lib/**` foram ampliados nas etapas de qualidade.

## Guardrails

- O deck exportado é sempre `English Light Verbs`.
- Apenas cards aprovados são incluídos; sem aprovação, a exportação falha com mensagem determinística.
- O note-type mantém sete campos estáveis: `Sentence`, `Translation`, `Tags`, `Notes`, `Pronunciation`, `Image` e `Audio`.
- A frente contém frase, imagem e áudio; o verso contém tradução e campos opcionais.
- O nome do arquivo preserva `.apkg` e remove caracteres incompatíveis com sistemas móveis.
- O histórico local remove gerações além de 30 dias e permite exclusão manual.
- Chaves de provedores não são persistidas no navegador nesta versão.

## Limitações conhecidas

- Não existe backend: autenticação, histórico, cards e configurações não persistem entre sessões e o isolamento real por usuário ainda não está implementado.
- A geração de texto, tradução, imagem e áudio é simulada; o `.apkg` pode não conter mídia real quando os bytes dos provedores não estão disponíveis.
- Validação de chaves, saldo/limite, chamadas de provedores e criptografia ficam para a integração de backend.
- A retenção de 30 dias é recalculada durante a renderização, sem job agendado.
- Alguns WebViews móveis podem ignorar downloads de URLs `blob:`; não há garantia de download automático em todos os ambientes.
- Não há endpoints de API nesta versão; testes de API Security Testing não se aplicam.

## Referências

- Requisitos funcionais e tokens: `SPEC.md`.
- Regras operacionais do projeto: `AGENTS.md`.
- Plano e evidências de execução: `project-plan.json`.
- Next.js 16.3.2: documentação versionada em `node_modules/next/dist/docs/`.
- Anki package: documentação do `ankipack` e template em `src/lib/anki-template.ts`.
