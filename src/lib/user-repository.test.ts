import { afterEach, describe, expect, it } from 'vitest'
import { createUserRepository, type UserRepository } from './user-repository'

let repo: UserRepository | undefined

afterEach(() => {
  repo?.close()
  repo = undefined
})

describe('user-repository', () => {
  it('cria um usuário e não expõe a senha em texto puro no armazenamento', async () => {
    repo = createUserRepository(':memory:')
    const user = await repo.createUser('Pessoa@Exemplo.com', 'senha-forte-123')
    expect(user.email).toBe('pessoa@exemplo.com')
    expect(user.id).toBeTruthy()
  })

  it('rejeita e-mail duplicado', async () => {
    repo = createUserRepository(':memory:')
    await repo.createUser('dup@exemplo.com', 'senha-forte-123')
    await expect(repo.createUser('dup@exemplo.com', 'outra-senha')).rejects.toThrow('E-mail já cadastrado.')
  })

  it('verifyPassword retorna o usuário com senha correta e null com senha incorreta', async () => {
    repo = createUserRepository(':memory:')
    await repo.createUser('login@exemplo.com', 'senha-correta-123')

    const ok = await repo.verifyPassword('login@exemplo.com', 'senha-correta-123')
    expect(ok?.email).toBe('login@exemplo.com')

    const fail = await repo.verifyPassword('login@exemplo.com', 'senha-errada')
    expect(fail).toBeNull()
  })

  it('verifyPassword retorna null para e-mail inexistente sem lançar erro', async () => {
    repo = createUserRepository(':memory:')
    const result = await repo.verifyPassword('inexistente@exemplo.com', 'qualquer')
    expect(result).toBeNull()
  })
})
