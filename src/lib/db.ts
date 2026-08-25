/**
 * Fábrica dos repositórios persistidos usados pelas rotas de API
 * (etapa backend-persistence-production).
 *
 * Contexto/pesquisa: Route Handlers do Next.js 16 rodam no runtime
 * Node.js por padrão (node_modules/next/dist/docs .../route.md), então
 * node:sqlite pode ser usado diretamente nos handlers. O caminho do
 * arquivo é configurável por ANKI_DB_PATH (documentado no README) e usa
 * ':memory:' como padrão de desenvolvimento para não versionar dados
 * reais sem configuração explícita.
 */
import { DatabaseSync } from 'node:sqlite'
import { createGenerationRepository, type GenerationRepository } from './generation-repository'
import { createSessionRepository, type SessionRepository } from './session-repository'
import { createUserRepository, type UserRepository } from './user-repository'

interface AppDb {
  users: UserRepository
  sessions: SessionRepository
  generations: GenerationRepository
}

let cached: AppDb | undefined

export function getAppDb(): AppDb {
  if (cached) return cached
  const location = process.env.ANKI_DB_PATH?.trim() || ':memory:'
  // Uma única conexão compartilhada entre os 3 repositórios, para que
  // usuário, sessão e geração enxerguem o mesmo banco (uma DatabaseSync
  // por ':memory:' criaria bancos isolados entre si).
  const db = new DatabaseSync(location)
  cached = {
    users: createUserRepository(db),
    sessions: createSessionRepository(db),
    generations: createGenerationRepository(db),
  }
  return cached
}

/** Uso exclusivo de testes: força a recriação dos repositórios. */
export function resetAppDbForTests(): void {
  cached = undefined
}
