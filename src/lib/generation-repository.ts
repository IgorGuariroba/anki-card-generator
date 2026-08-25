/**
 * Repositório de gerações/exportações persistido e isolado por usuário
 * (etapa backend-persistence-production).
 *
 * Contexto/pesquisa: reutiliza o mesmo StoredGeneration e as regras puras
 * de retenção já testadas em src/lib/generation-retention.ts
 * (isWithinRetention/pruneExpiredGenerations), agora aplicadas sobre
 * dados persistidos em SQLite (node:sqlite, nativo do Node 24) em vez de
 * estado local do componente React. Nenhuma consulta ou mutação aceita
 * userId implícito: toda chamada exige o id do usuário autenticado,
 * cumprindo o guardrail de isolamento por usuário.
 */
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { pruneExpiredGenerations, type StoredGeneration } from './generation-retention'

export interface GenerationRepository {
  addGeneration(userId: string, generation: Omit<StoredGeneration, 'id'>): StoredGeneration
  listGenerations(userId: string, now?: Date): StoredGeneration[]
  removeGeneration(userId: string, id: string): boolean
  close(): void
}

interface GenerationRow {
  id: string
  user_id: string
  verb: string
  level: string
  file_name: string
  generated_at: string
}

export function createGenerationRepository(locationOrDb: string | DatabaseSync): GenerationRepository {
  const db = locationOrDb instanceof DatabaseSync ? locationOrDb : new DatabaseSync(locationOrDb)
  db.exec(`
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      verb TEXT NOT NULL,
      level TEXT NOT NULL,
      file_name TEXT NOT NULL,
      generated_at TEXT NOT NULL
    )
  `)
  db.exec('CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id)')

  const insertStmt = db.prepare(
    'INSERT INTO generations (id, user_id, verb, level, file_name, generated_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const listStmt = db.prepare('SELECT * FROM generations WHERE user_id = ? ORDER BY generated_at ASC')
  const deleteStmt = db.prepare('DELETE FROM generations WHERE user_id = ? AND id = ?')

  function toStoredGeneration(row: GenerationRow): StoredGeneration {
    return { id: row.id, verb: row.verb, level: row.level, fileName: row.file_name, generatedAt: row.generated_at }
  }

  return {
    addGeneration(userId, generation) {
      if (!userId) throw new Error('userId é obrigatório para registrar uma geração.')
      const stored: StoredGeneration = { id: randomUUID(), ...generation }
      insertStmt.run(stored.id, userId, stored.verb, stored.level, stored.fileName, stored.generatedAt)
      return { ...stored }
    },

    listGenerations(userId, now = new Date()) {
      if (!userId) throw new Error('userId é obrigatório para listar gerações.')
      const rows = listStmt.all(userId) as unknown as GenerationRow[]
      return pruneExpiredGenerations(rows.map(toStoredGeneration), now)
    },

    removeGeneration(userId, id) {
      if (!userId) throw new Error('userId é obrigatório para remover uma geração.')
      const result = deleteStmt.run(userId, id)
      return result.changes > 0
    },

    close() {
      if (!(locationOrDb instanceof DatabaseSync)) db.close()
    },
  }
}
