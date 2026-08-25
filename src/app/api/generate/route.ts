import { validateGenerationRequest } from '@/lib/backend-contract'

function hasActiveSession(request: Request) {
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.split(';').some((part) => {
    const [name, ...value] = part.trim().split('=')
    return name === 'anki_session' && value.join('=').trim().length > 0
  })
}

export async function POST(request: Request) {
  if (!hasActiveSession(request)) {
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
