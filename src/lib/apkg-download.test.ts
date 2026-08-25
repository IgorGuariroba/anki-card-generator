import { afterEach, describe, expect, it, vi } from 'vitest';
import { sanitizeApkgFileName, triggerApkgDownload } from './apkg-download';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sanitizeApkgFileName', () => {
  it('mantém um nome já seguro inalterado', () => {
    expect(sanitizeApkgFileName('english-light-verbs-make-2025-01-01.apkg')).toBe(
      'english-light-verbs-make-2025-01-01.apkg',
    );
  });

  it('substitui espaços e caracteres reservados por hífen para compatibilidade com sistemas de arquivos móveis', () => {
    expect(sanitizeApkgFileName('english light verbs: make? "test".apkg')).toBe('english-light-verbs-make-test-.apkg');
  });

  it('garante a extensão .apkg mesmo quando ausente', () => {
    expect(sanitizeApkgFileName('meu-deck')).toBe('meu-deck.apkg');
  });
});

describe('triggerApkgDownload', () => {
  it('cria e clica em um link temporário com o blob e o nome sanitizado, revogando a URL ao final', () => {
    const urlWithStubs = URL as unknown as { createObjectURL?: (blob: Blob) => string; revokeObjectURL?: (url: string) => void };
    if (!urlWithStubs.createObjectURL) {
      urlWithStubs.createObjectURL = () => 'blob:stub';
    }
    if (!urlWithStubs.revokeObjectURL) {
      urlWithStubs.revokeObjectURL = () => {};
    }
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const clickSpy = vi.fn();
    const removeSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag) as HTMLAnchorElement;
      if (tag === 'a') {
        el.click = clickSpy;
        el.remove = removeSpy;
      }
      return el;
    });

    const result = triggerApkgDownload(new Uint8Array([1, 2, 3]), 'english light verbs make 2025-01-01.apkg');

    expect(result.fileName).toBe('english-light-verbs-make-2025-01-01.apkg');
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url');
  });
});
