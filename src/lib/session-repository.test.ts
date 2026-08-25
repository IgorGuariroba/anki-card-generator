import { afterEach, describe, expect, it } from 'vitest'
import { createSessionRepository, SESSION_DURATION_MS, type SessionRepository } from './session-repository'

let repo: SessionRepository | undefined

afterEach(() => {
  repo?.close()
  repo = undefined
})

describe('session-repository', () => {
  it('cria um token opaco e distinto por usuário (não é mais um valor fixo)', () => {
    repo = createSessionRepository(':memory:')
    const s1 = repo.createSession('user-a')
    const s2 = repo.createSession('user-a')
    expect(s1.token).not.toBe(s2.token)
    expect(s1.token.length).toBeGreaterThanOrEqual(32)
  })

  it('getSession retorna o userId correto para um token válido', () => {
    repo = createSessionRepository(':memory:')
    const session = repo.createSession('user-a')
    const found = repo.getSession(session.token)
    expect(found?.userId).toBe('user-a')
  })

  it('getSession retorna null para token inexistente ou vazio', () => {
    repo = createSessionRepository(':memory:')
    expect(repo.getSession('token-que-nao-existe')).toBeNull()
    expect(repo.getSession('')).toBeNull()
  })

  it('getSession retorna null e remove sessão expirada', () => {
    repo = createSessionRepository(':memory:')
    const now = new Date('2026-01-01T00:00:00.000Z')
    const session = repo.createSession('user-a', now)
    const afterExpiry = new Date(now.getTime() + SESSION_DURATION_MS + 1000)

    expect(repo.getSession(session.token, afterExpiry)).toBeNull()
    expect(repo.getSession(session.token, now)).toBeNull()
  })

  it('deleteSession invalida o token (logout)', () => {
    repo = createSessionRepository(':memory:')
    const session = repo.createSession('user-a')
    repo.deleteSession(session.token)
    expect(repo.getSession(session.token)).toBeNull()
  })
})
