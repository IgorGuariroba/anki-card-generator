import { describe, expect, it } from 'vitest'
import { POST } from './route'

const request = (body: string, cookie?: string) => new Request('http://localhost/api/generate', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
  body,
})

describe('POST /api/generate', () => {
  it('rejeita usuário sem sessão antes de processar o contrato', async () => {
    const response = await POST(request(JSON.stringify({ verb: 'make', level: 'iniciante', cardCount: 10 })))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Autenticação necessária.' })
  })

  it('rejeita contrato inválido sem expor dados recebidos', async () => {
    const response = await POST(request(JSON.stringify({ verb: 'invalid', level: 'iniciante', cardCount: 10, secret: 'sk-real-looking' }), 'anki_session=active'))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Verbo inválido.' })
  })

  it('declara a integração pendente para uma solicitação válida', async () => {
    const response = await POST(request(JSON.stringify({ verb: 'make', level: 'iniciante', cardCount: 10 }), 'anki_session=active'))
    expect(response.status).toBe(501)
    expect(await response.json()).toEqual({ error: 'Geração por provedor ainda não está disponível.' })
  })
})
