import { describe, expect, it } from 'vitest'
import { validateGenerationRequest, type GenerationRequest } from './backend-contract'

describe('validateGenerationRequest', () => {
  it('aceita uma solicitação completa e não contém segredo', () => {
    const request: GenerationRequest = { verb: 'make', level: 'iniciante', cardCount: 10 }
    expect(validateGenerationRequest(request)).toEqual({ ok: true, request })
  })

  it('rejeita quantidade diferente de 10 cards', () => {
    expect(validateGenerationRequest({ verb: 'make', level: 'iniciante', cardCount: 9 })).toEqual({
      ok: false,
      error: 'A geração deve solicitar exatamente 10 cards.',
    })
  })

  it('rejeita verbos e níveis fora do contrato', () => {
    expect(validateGenerationRequest({ verb: 'unknown', level: 'iniciante', cardCount: 10 })).toEqual({ ok: false, error: 'Verbo inválido.' })
    expect(validateGenerationRequest({ verb: 'make', level: 'expert', cardCount: 10 })).toEqual({ ok: false, error: 'Nível inválido.' })
  })
})
