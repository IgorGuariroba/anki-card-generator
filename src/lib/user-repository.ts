/**
 * Repositório de usuários persistido (etapa backend-persistence-production).
 *
 * Contexto/pesquisa: node:sqlite (DatabaseSync) é experimental, mas nativo
 * do Node >=24 (engines.node em package.json exige >=20.9.0; validado em
 * runtime com node --version == v24.13.0), evitando adicionar uma nova
 * dependência de terceiros só para persistência local. Documentação
 * oficial: https://nodejs.org/api/sqlite.html.
 *
 * Guardrail: senhas nunca são armazenadas em texto puro. Usa-se
 * crypto.scrypt (node:crypto, PBKDF assíncrono recomendado pela própria
 * documentação do Node para hashing de senha) com salt aleatório por
 * usuário. Nenhuma chave de provedor é tratada por este módulo.
 */
import { randomUUID, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'

const SCRYPT_KEYLEN = 64

export interface User {
  id: string
  email: string
  createdAt: string
}

export interface UserRepository {
  createUser(email: string, password: string): Promise<User>
  verifyPassword(email: string, password: string): Promise<User | null>
  findByEmail(email: string): User | null
  close(): void
}

function hashPassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEYLEN, (err, derived) => {
      if (err) reject(err)
      else resolve(derived)
    })
  })
}

/**
 * Cria (ou reutiliza) um repositório de usuários apoiado em SQLite.
 * `locationOrDb` aceita ':memory:'/caminho de arquivo (abre uma nova
 * conexão) ou uma DatabaseSync já aberta (para compartilhar a mesma
 * conexão entre repositórios, como faz src/lib/db.ts). O isolamento por
 * usuário é garantido por userId único (UUID) e por toda consulta de
 * dados de geração exigir esse id como filtro (ver generation-repository.ts).
 */
export function createUserRepository(locationOrDb: string | DatabaseSync): UserRepository {
  const db = locationOrDb instanceof DatabaseSync ? locationOrDb : new DatabaseSync(locationOrDb)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `)

  const insertStmt = db.prepare(
    'INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)',
  )
  const findByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?')

  return {
    async createUser(email, password) {
      const normalizedEmail = email.trim().toLowerCase()
      const existing = findByEmailStmt.get(normalizedEmail)
      if (existing) {
        throw new Error('E-mail já cadastrado.')
      }
      const salt = randomBytes(16)
      const hash = await hashPassword(password, salt)
      const user: User = { id: randomUUID(), email: normalizedEmail, createdAt: new Date().toISOString() }
      insertStmt.run(user.id, user.email, hash.toString('hex'), salt.toString('hex'), user.createdAt)
      return user
    },

    async verifyPassword(email, password) {
      const normalizedEmail = email.trim().toLowerCase()
      const row = findByEmailStmt.get(normalizedEmail) as
        | { id: string; email: string; password_hash: string; password_salt: string; created_at: string }
        | undefined
      if (!row) return null

      const salt = Buffer.from(row.password_salt, 'hex')
      const expected = Buffer.from(row.password_hash, 'hex')
      const actual = await hashPassword(password, salt)
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
        return null
      }
      return { id: row.id, email: row.email, createdAt: row.created_at }
    },

    findByEmail(email) {
      const normalizedEmail = email.trim().toLowerCase()
      const row = findByEmailStmt.get(normalizedEmail) as
        | { id: string; email: string; created_at: string }
        | undefined
      if (!row) return null
      return { id: row.id, email: row.email, createdAt: row.created_at }
    },

    close() {
      if (!(locationOrDb instanceof DatabaseSync)) db.close()
    },
  }
}
