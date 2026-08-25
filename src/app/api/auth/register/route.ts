import { getAppDb } from '@/lib/db'
import { SESSION_DURATION_MS } from '@/lib/session-repository'

function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { email, password, confirmation } = (body ?? {}) as Record<string, unknown>
  if (typeof email !== 'string' || !email.trim()) {
    return Response.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
  }
  if (!isValidPassword(password as string)) {
    return Response.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
  }
  if (password !== confirmation) {
    return Response.json({ error: 'As senhas não coincidem.' }, { status: 400 })
  }

  const db = getAppDb()
  try {
    const user = await db.users.createUser(email, password as string)
    const session = db.sessions.createSession(user.id)
    const response = Response.json({ email: user.email }, { status: 201 })
    response.headers.set(
      'Set-Cookie',
      `anki_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`,
    )
    return response
  } catch (error) {
    if (error instanceof Error && error.message === 'E-mail já cadastrado.') {
      return Response.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
    }
    throw error
  }
}
