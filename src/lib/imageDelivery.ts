// Formato canônico das URLs de foto de produto/site.
// A rota `/api/public/img/<path>` entrega o arquivo do bucket `product-images`
// com fallback público → autenticado. Manter este prefixo é obrigatório:
// mudá-lo quebraria todas as fotos já cadastradas no banco.
export const IMG_ROUTE_PREFIX = "/api/public/img/";

export function buildImageUrl(storagePath: string): string {
  return `${IMG_ROUTE_PREFIX}${storagePath.replace(/^\/+/, "")}`;
}

export function isServedImageUrl(url: string): boolean {
  return url.startsWith(IMG_ROUTE_PREFIX) || url.startsWith("/__l5e/") || /^https?:\/\//.test(url);
}
