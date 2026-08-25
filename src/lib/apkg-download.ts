/**
 * Disponibiliza o download do pacote `.apkg` de forma compatível com
 * celular (etapa export-3).
 *
 * Contexto/pesquisa: a maioria dos navegadores móveis modernos (Chrome e
 * Firefox Android, Safari iOS) suporta `URL.createObjectURL` combinado
 * com o atributo `download` do `<a>`. Navegadores embutidos em apps
 * (WKWebView, usados por apps como Instagram/Facebook no iOS) têm um bug
 * documentado onde o atributo `download` é ignorado para URLs `blob:`
 * (WebKit bug 216918: "WKWebView does not support blob: URLs as href
 * value in anchors with download attribute",
 * https://bugs.webkit.org/show_bug.cgi?id=216918). Como o IDL property
 * `download` sempre existe no elemento `<a>` independentemente desse
 * bug, não há feature-detection confiável em tempo de execução para
 * esse caso; por isso este módulo garante o caminho padrão (blob +
 * atributo download), que funciona no navegador principal do
 * dispositivo (Safari/Chrome/Firefox), e mantém como limitação
 * documentada — já prevista em SPEC.md linha 79 — a impossibilidade de
 * garantir o download automático dentro de WebViews embutidos de
 * terceiros.
 *
 * O guardrail testável aqui é o nome de arquivo: deve ser descritivo e
 * seguro em qualquer sistema de arquivos móvel (iOS/Android), sem
 * caracteres reservados (`/ \ : * ? " < > |`) nem espaços, que causam
 * problemas de compatibilidade em alguns apps de arquivos móveis.
 */

const UNSAFE_FILENAME_CHARS = /[/\\:*?"<>| ]+/g;

/**
 * Sanitiza um nome de arquivo para uso seguro em qualquer sistema de
 * arquivos móvel: remove/substitui caracteres reservados por hífen e
 * preserva a extensão `.apkg`.
 */
export function sanitizeApkgFileName(rawFileName: string): string {
  const trimmed = rawFileName.trim();
  const sanitized = trimmed.replace(UNSAFE_FILENAME_CHARS, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return sanitized.endsWith('.apkg') ? sanitized : `${sanitized}.apkg`;
}

export interface ApkgDownloadResult {
  /** Nome de arquivo sanitizado e efetivamente usado no download. */
  fileName: string;
}

/**
 * Dispara o download do `.apkg` no navegador atual usando
 * `URL.createObjectURL` e um `<a download>` temporário, com o nome de
 * arquivo sanitizado por {@link sanitizeApkgFileName}.
 */
export function triggerApkgDownload(bytes: Uint8Array, rawFileName: string): ApkgDownloadResult {
  const fileName = sanitizeApkgFileName(rawFileName);
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return { fileName };
}
