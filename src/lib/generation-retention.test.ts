import { describe, expect, it } from 'vitest';
import {
  isWithinRetention,
  pruneExpiredGenerations,
  removeGeneration,
  RETENTION_DAYS,
  type StoredGeneration,
} from './generation-retention';

const now = new Date('2026-08-25T12:00:00-03:00');

function generationAt(id: string, generatedAt: string): StoredGeneration {
  return { id, verb: 'make', level: 'iniciante', fileName: `${id}.apkg`, generatedAt };
}

describe('isWithinRetention', () => {
  it('mantém uma geração criada há poucos dias', () => {
    expect(isWithinRetention('2026-08-20T12:00:00-03:00', now)).toBe(true);
  });

  it('mantém uma geração exatamente no limite de 30 dias', () => {
    const exactlyThirtyDaysAgo = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    expect(isWithinRetention(exactlyThirtyDaysAgo, now)).toBe(true);
  });

  it('remove uma geração criada há mais de 30 dias', () => {
    expect(isWithinRetention('2026-07-01T12:00:00-03:00', now)).toBe(false);
  });
});

describe('pruneExpiredGenerations', () => {
  it('mantém apenas gerações dentro do período de retenção', () => {
    const generations = [
      generationAt('recente', '2026-08-24T12:00:00-03:00'),
      generationAt('expirada', '2026-01-01T12:00:00-03:00'),
    ];

    expect(pruneExpiredGenerations(generations, now)).toEqual([generations[0]]);
  });

  it('não remove nenhuma geração quando todas estão dentro do período', () => {
    const generations = [generationAt('a', '2026-08-01T12:00:00-03:00'), generationAt('b', '2026-08-20T12:00:00-03:00')];
    expect(pruneExpiredGenerations(generations, now)).toEqual(generations);
  });
});

describe('removeGeneration', () => {
  it('remove apenas a geração com o id informado, preservando as demais', () => {
    const generations = [generationAt('a', '2026-08-01T12:00:00-03:00'), generationAt('b', '2026-08-20T12:00:00-03:00')];
    expect(removeGeneration(generations, 'a')).toEqual([generationAt('b', '2026-08-20T12:00:00-03:00')]);
  });

  it('mantém a lista inalterada quando o id não existe', () => {
    const generations = [generationAt('a', '2026-08-01T12:00:00-03:00')];
    expect(removeGeneration(generations, 'inexistente')).toEqual(generations);
  });
});
