import { beforeEach, describe, expect, it } from 'vitest'
import { getAppDb, resetAppDbForTests } from '@/lib/db'
import { POST } from './route'

beforeEach(() => {
  resetAppDbForTests()
})

describe('POST /api/auth/logout', () => {
  it('invalida a sessão e limpa o cookie', async () => {
    const db = getAppDb()
    const user = await db.users.createUser('logout@exemplo.com', 'senha-forte-123')
    const session = db.sessions.createSession(user.id)

    const response = await POST(
      new Request('http://localhost/api/auth/logout', {
        method: 'POST',
        headers: { cookie: `anki_session=${session.token}` },
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
    expect(db.sessions.getSession(session.token)).toBeNull()
  })

  it('não lança erro quando não há cookie de sessão', async () => {
    const response = await POST(new Request('http://localhost/api/auth/logout', { method: 'POST' }))
    expect(response.status).toBe(200)
  })
})
