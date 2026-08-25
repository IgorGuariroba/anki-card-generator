import { beforeEach, describe, expect, it } from 'vitest'
import { getAppDb, resetAppDbForTests } from '@/lib/db'
import { POST } from './route'

beforeEach(() => {
  resetAppDbForTests()
})

const request = (body: string, cookie?: string) => new Request('http://localhost/api/generate', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
  body,
})

async function createSessionCookie() {
  const db = getAppDb()
  const user = await db.users.createUser('gen@exemplo.com', 'senha-forte-123')
  const session = db.sessions.createSession(user.id)
  return `anki_session=${session.token}`
}

describe('POST /api/generate', () => {
  it('rejeita usuário sem sessão antes de processar o contrato', async () => {
    const response = await POST(request(JSON.stringify({ verb: 'make', level: 'iniciante', cardCount: 10 })))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Autenticação necessária.' })
  })

  it('rejeita token de sessão inexistente/inválido, não apenas ausência de cookie', async () => {
    const response = await POST(request(JSON.stringify({ verb: 'make', level: 'iniciante', cardCount: 10 }), 'anki_session=token-forjado-qualquer'))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Autenticação necessária.' })
  })

  it('rejeita contrato inválido sem expor dados recebidos', async () => {
    const cookie = await createSessionCookie()
    const response = await POST(request(JSON.stringify({ verb: 'invalid', level: 'iniciante', cardCount: 10, secret: 'sk-real-looking' }), cookie))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Verbo inválido.' })
  })

  it('declara a integração pendente para uma solicitação válida com sessão real', async () => {
    const cookie = await createSessionCookie()
    const response = await POST(request(JSON.stringify({ verb: 'make', level: 'iniciante', cardCount: 10 }), cookie))
    expect(response.status).toBe(501)
    expect(await response.json()).toEqual({ error: 'Geração por provedor ainda não está disponível.' })
  })
})
