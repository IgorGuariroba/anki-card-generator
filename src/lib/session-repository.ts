/**
 * Repositório de sessões persistidas (etapa backend-persistence-production).
 *
 * Contexto/pesquisa: até esta etapa o cookie anki_session usava sempre o
 * valor fixo 'active' (src/app/login/page.tsx), o que autenticava
 * qualquer usuário como a mesma identidade e impedia isolamento real por
 * userId nas rotas de API. Este módulo substitui esse valor por um token
 * opaco aleatório (crypto.randomBytes) associado a um userId e com
 * expiração, seguindo a recomendação da documentação do Node
 * (https://nodejs.org/api/crypto.html#cryptorandombytessize-callback)
 * de usar bytes criptograficamente aleatórios para tokens de sessão.
 */
import { randomBytes } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export interface Session {
  token: string
  userId: string
  expiresAt: string
}

export interface SessionRepository {
  createSession(userId: string, now?: Date): Session
  getSession(token: string, now?: Date): Session | null
  deleteSession(token: string): void
  close(): void
}

export function createSessionRepository(locationOrDb: string | DatabaseSync): SessionRepository {
  const db = locationOrDb instanceof DatabaseSync ? locationOrDb : new DatabaseSync(locationOrDb)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `)

  const insertStmt = db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
  const getStmt = db.prepare('SELECT * FROM sessions WHERE token = ?')
  const deleteStmt = db.prepare('DELETE FROM sessions WHERE token = ?')

  return {
    createSession(userId, now = new Date()) {
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS).toISOString()
      insertStmt.run(token, userId, expiresAt)
      return { token, userId, expiresAt }
    },

    getSession(token, now = new Date()) {
      if (!token) return null
      const row = getStmt.get(token) as { token: string; user_id: string; expires_at: string } | undefined
      if (!row) return null
      if (new Date(row.expires_at).getTime() < now.getTime()) {
        deleteStmt.run(token)
        return null
      }
      return { token: row.token, userId: row.user_id, expiresAt: row.expires_at }
    },

    deleteSession(token) {
      deleteStmt.run(token)
    },

    close() {
      if (!(locationOrDb instanceof DatabaseSync)) db.close()
    },
  }
}
