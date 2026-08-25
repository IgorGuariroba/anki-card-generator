export const STRUCTURAL_VERBS = ['make', 'do', 'take', 'get', 'have', 'give', 'put', 'set', 'go'] as const
export const DIFFICULTY_LEVELS = ['iniciante', 'intermediário', 'avançado'] as const

export type StructuralVerb = (typeof STRUCTURAL_VERBS)[number]
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

/** Contrato mínimo para o futuro Route Handler; não transporta credenciais. */
export type GenerationRequest = {
  verb: StructuralVerb
  level: DifficultyLevel
  cardCount: 10
}

export type ValidationResult =
  | { ok: true; request: GenerationRequest }
  | { ok: false; error: string }

export function validateGenerationRequest(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Solicitação inválida.' }
  const value = input as Record<string, unknown>
  if (!STRUCTURAL_VERBS.includes(value.verb as StructuralVerb)) return { ok: false, error: 'Verbo inválido.' }
  if (!DIFFICULTY_LEVELS.includes(value.level as DifficultyLevel)) return { ok: false, error: 'Nível inválido.' }
  if (value.cardCount !== 10) return { ok: false, error: 'A geração deve solicitar exatamente 10 cards.' }

  return {
    ok: true,
    request: { verb: value.verb as StructuralVerb, level: value.level as DifficultyLevel, cardCount: 10 },
  }
}
