import { beforeEach, describe, expect, it } from 'vitest'
import { getAppDb, resetAppDbForTests } from '@/lib/db'
import { POST } from './route'

beforeEach(() => {
  resetAppDbForTests()
})

const req = (body: unknown) =>
  new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/auth/login', () => {
  it('autentica com credenciais corretas e define cookie de sessão', async () => {
    await getAppDb().users.createUser('login@exemplo.com', 'senha-correta-123')
    const response = await POST(req({ email: 'login@exemplo.com', password: 'senha-correta-123' }))
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('anki_session=')
  })

  it('rejeita senha incorreta com 401 sem expor detalhes', async () => {
    await getAppDb().users.createUser('login2@exemplo.com', 'senha-correta-123')
    const response = await POST(req({ email: 'login2@exemplo.com', password: 'errada' }))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'E-mail ou senha inválidos.' })
  })

  it('rejeita e-mail ou senha em branco', async () => {
    const response = await POST(req({ email: '   ', password: '   ' }))
    expect(response.status).toBe(400)
  })
})
