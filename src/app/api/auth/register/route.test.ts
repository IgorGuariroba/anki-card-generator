import { beforeEach, describe, expect, it } from 'vitest'
import { resetAppDbForTests } from '@/lib/db'
import { POST } from './route'

beforeEach(() => {
  resetAppDbForTests()
})

const req = (body: unknown) =>
  new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/auth/register', () => {
  it('cria a conta, define cookie de sessão HttpOnly e não retorna a senha', async () => {
    const response = await POST(req({ email: 'nova@exemplo.com', password: 'senha-forte-123', confirmation: 'senha-forte-123' }))
    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload).toEqual({ email: 'nova@exemplo.com' })
    expect(payload.password).toBeUndefined()
    const setCookie = response.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('anki_session=')
    expect(setCookie).toContain('HttpOnly')
  })

  it('rejeita senha curta', async () => {
    const response = await POST(req({ email: 'x@exemplo.com', password: '123', confirmation: '123' }))
    expect(response.status).toBe(400)
  })

  it('rejeita confirmação divergente', async () => {
    const response = await POST(req({ email: 'x@exemplo.com', password: 'senha-forte-123', confirmation: 'outra' }))
    expect(response.status).toBe(400)
  })

  it('rejeita e-mail já cadastrado com 409', async () => {
    await POST(req({ email: 'dup@exemplo.com', password: 'senha-forte-123', confirmation: 'senha-forte-123' }))
    const response = await POST(req({ email: 'dup@exemplo.com', password: 'senha-forte-123', confirmation: 'senha-forte-123' }))
    expect(response.status).toBe(409)
  })
})
