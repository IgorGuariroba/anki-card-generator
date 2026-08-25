import { getAppDb } from '@/lib/db'
import { SESSION_DURATION_MS } from '@/lib/session-repository'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
    return Response.json({ error: 'Informe e-mail e senha para entrar.' }, { status: 400 })
  }

  const db = getAppDb()
  const user = await db.users.verifyPassword(email, password)
  if (!user) {
    return Response.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })
  }

  const session = db.sessions.createSession(user.id)
  const response = Response.json({ email: user.email }, { status: 200 })
  response.headers.set(
    'Set-Cookie',
    `anki_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`,
  )
  return response
}
