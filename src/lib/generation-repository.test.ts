import { afterEach, describe, expect, it } from 'vitest'
import { createGenerationRepository, type GenerationRepository } from './generation-repository'

let repo: GenerationRepository | undefined

afterEach(() => {
  repo?.close()
  repo = undefined
})

describe('generation-repository', () => {
  it('isola gerações por userId: um usuário nunca vê gerações de outro', () => {
    repo = createGenerationRepository(':memory:')
    repo.addGeneration('user-a', { verb: 'make', level: 'iniciante', fileName: 'a.apkg', generatedAt: new Date().toISOString() })
    repo.addGeneration('user-b', { verb: 'go', level: 'avançado', fileName: 'b.apkg', generatedAt: new Date().toISOString() })

    const forA = repo.listGenerations('user-a')
    const forB = repo.listGenerations('user-b')

    expect(forA).toHaveLength(1)
    expect(forA[0].verb).toBe('make')
    expect(forB).toHaveLength(1)
    expect(forB[0].verb).toBe('go')
  })

  it('aplica a retenção de 30 dias ao listar (reutilizando generation-retention)', () => {
    repo = createGenerationRepository(':memory:')
    const now = new Date('2026-09-01T00:00:00.000Z')
    const expiredDate = new Date('2026-07-01T00:00:00.000Z').toISOString()
    const validDate = new Date('2026-08-15T00:00:00.000Z').toISOString()

    repo.addGeneration('user-a', { verb: 'make', level: 'iniciante', fileName: 'expirado.apkg', generatedAt: expiredDate })
    repo.addGeneration('user-a', { verb: 'do', level: 'iniciante', fileName: 'valido.apkg', generatedAt: validDate })

    const generations = repo.listGenerations('user-a', now)
    expect(generations).toHaveLength(1)
    expect(generations[0].fileName).toBe('valido.apkg')
  })

  it('removeGeneration só remove a geração pertencente ao userId informado', () => {
    repo = createGenerationRepository(':memory:')
    const created = repo.addGeneration('user-a', { verb: 'make', level: 'iniciante', fileName: 'a.apkg', generatedAt: new Date().toISOString() })

    const removedByWrongUser = repo.removeGeneration('user-b', created.id)
    expect(removedByWrongUser).toBe(false)
    expect(repo.listGenerations('user-a')).toHaveLength(1)

    const removedByOwner = repo.removeGeneration('user-a', created.id)
    expect(removedByOwner).toBe(true)
    expect(repo.listGenerations('user-a')).toHaveLength(0)
  })

  it('exige userId em todas as operações', () => {
    repo = createGenerationRepository(':memory:')
    expect(() => repo!.addGeneration('', { verb: 'make', level: 'iniciante', fileName: 'a.apkg', generatedAt: new Date().toISOString() })).toThrow(
      'userId é obrigatório',
    )
    expect(() => repo!.listGenerations('')).toThrow('userId é obrigatório')
    expect(() => repo!.removeGeneration('', 'qualquer')).toThrow('userId é obrigatório')
  })
})
