import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

function request(pathname: string, session = '') {
  return {
    nextUrl: { pathname },
    cookies: { get: (name: string) => name === 'anki_session' && session ? { name, value: session } : undefined },
    url: `http://localhost${pathname}`,
  } as never;
}

describe('proteção de rotas', () => {
  it('redireciona usuário anônimo ao login', () => {
    const response = proxy(request('/dashboard'));
    expect(response.headers.get('location')).toBe('http://localhost/login');
  });

  it('permite usuário autenticado na área privada', () => {
    expect(proxy(request('/dashboard', 'active')).headers.get('location')).toBeNull();
  });

  it('mantém páginas públicas acessíveis', () => {
    expect(proxy(request('/login')).headers.get('location')).toBeNull();
  });
});
