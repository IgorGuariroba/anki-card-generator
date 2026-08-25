/**
 * Retenção de gerações/exportações por 30 dias e exclusão manual
 * (etapa export-4).
 *
 * Contexto/pesquisa: SPEC.md linha 80 define "Cards, mídias e pacotes
 * exportados serão armazenados por 30 dias e então removidos
 * automaticamente, salvo exclusão antecipada pelo usuário" e a linha 131
 * lista o histórico de gerações dentro dos 30 dias como parte do fluxo
 * de exportação/histórico. Como o projeto ainda não tem backend/banco
 * de dados (nenhuma dependência de persistência em package.json), este
 * módulo isola a regra de retenção como função pura e testável com
 * Vitest, para ser reutilizada tanto por um histórico local (nesta
 * etapa) quanto por uma futura persistência real no backend, sem
 * duplicar a lógica de expiração.
 *
 * O módulo não depende de DOM, rede ou relógio implícito: o "agora" é
 * sempre um parâmetro explícito, o que torna os testes determinísticos
 * e elimina flakiness por fuso horário/data do sistema.
 */

export const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

export interface StoredGeneration {
  id: string;
  verb: string;
  level: string;
  fileName: string;
  /** Data/hora ISO 8601 em que a geração/exportação foi criada. */
  generatedAt: string;
}

/**
 * Indica se uma geração criada em `generatedAt` ainda está dentro do
 * período de retenção de {@link RETENTION_DAYS} dias, considerando
 * `now` como referência do momento atual.
 *
 * O limite é inclusivo: uma geração exatamente no dia 30 ainda é
 * mantida, e só é removida a partir do momento em que ultrapassa esse
 * limite, evitando remoção prematura por arredondamento.
 */
export function isWithinRetention(generatedAt: string, now: Date): boolean {
  const generatedTime = new Date(generatedAt).getTime();
  const elapsed = now.getTime() - generatedTime;
  return elapsed <= RETENTION_MS;
}

/**
 * Remove automaticamente as gerações que ultrapassaram o período de
 * retenção, preservando a ordem original das gerações restantes.
 */
export function pruneExpiredGenerations(
  generations: StoredGeneration[],
  now: Date = new Date(),
): StoredGeneration[] {
  return generations.filter((generation) => isWithinRetention(generation.generatedAt, now));
}

/**
 * Remove uma geração específica por exclusão manual do usuário,
 * independentemente do período de retenção. Gerações com id
 * inexistente não alteram a lista.
 */
export function removeGeneration(generations: StoredGeneration[], id: string): StoredGeneration[] {
  return generations.filter((generation) => generation.id !== id);
}
