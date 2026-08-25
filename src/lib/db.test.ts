import { beforeEach, describe, expect, it } from 'vitest'
import { getAppDb, resetAppDbForTests } from './db'

beforeEach(() => {
  resetAppDbForTests()
})

describe('getAppDb', () => {
  it('retorna a mesma instância entre chamadas (singleton por processo)', () => {
    const first = getAppDb()
    const second = getAppDb()
    expect(first).toBe(second)
  })

  it('compartilha uma única conexão SQLite: usuário criado é visível para sessions/generations', async () => {
    const db = getAppDb()
    const user = await db.users.createUser('compartilhado@exemplo.com', 'senha-forte-123')
    const session = db.sessions.createSession(user.id)
    expect(db.sessions.getSession(session.token)?.userId).toBe(user.id)

    const generation = db.generations.addGeneration(user.id, {
      verb: 'make',
      level: 'iniciante',
      fileName: 'a.apkg',
      generatedAt: new Date().toISOString(),
    })
    expect(db.generations.listGenerations(user.id)).toEqual([generation])
  })
})
