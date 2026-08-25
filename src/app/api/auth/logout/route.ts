import { getAppDb } from '@/lib/db'

function readSessionToken(request: Request): string {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.split(';').find((part) => part.trim().startsWith('anki_session='))
  return match ? match.trim().slice('anki_session='.length) : ''
}

export async function POST(request: Request) {
  const token = readSessionToken(request)
  if (token) {
    getAppDb().sessions.deleteSession(token)
  }

  const response = Response.json({ ok: true }, { status: 200 })
  response.headers.set('Set-Cookie', 'anki_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')
  return response
}
