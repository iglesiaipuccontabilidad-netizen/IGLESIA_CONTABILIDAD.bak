/**
 * Genera un slug URL-friendly a partir de un nombre.
 * Ej: "IPUC 3ra Villa Estadio-Bosconia" → "ipuc-3ra-villa-estadio-bosconia"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s-]/g, '')    // quitar caracteres especiales
    .replace(/[\s]+/g, '-')          // espacios → guiones
    .replace(/-+/g, '-')             // múltiples guiones → uno
    .replace(/^-|-$/g, '')           // quitar guiones al inicio/final
}
