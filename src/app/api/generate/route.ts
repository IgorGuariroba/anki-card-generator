import { getAppDb } from '@/lib/db'
import { validateGenerationRequest } from '@/lib/backend-contract'

function readSessionToken(request: Request): string {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.split(';').find((part) => part.trim().startsWith('anki_session='))
  return match ? match.trim().slice('anki_session='.length) : ''
}

export async function POST(request: Request) {
  const token = readSessionToken(request)
  const session = token ? getAppDb().sessions.getSession(token) : null
  if (!session) {
    return Response.json({ error: 'Autenticação necessária.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const validation = validateGenerationRequest(body)
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 })
  }

  return Response.json({ error: 'Geração por provedor ainda não está disponível.' }, { status: 501 })
}
