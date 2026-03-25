/** Limite alinhado ao bucket `lead-attachments` (5 MB). */
export const MAX_LEAD_IMAGE_BYTES = 5 * 1024 * 1024;

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpe": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

/**
 * Muitos browsers/Android enviam `File.type` vazio ou `application/octet-stream`;
 * o Storage do Supabase valida o Content-Type contra o bucket — precisamos inferir pela extensão.
 */
export function resolveLeadImageContentType(file: File): string {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf(".");
  if (dot >= 0) {
    const ext = name.slice(dot);
    if (EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  }
  const t = file.type?.trim().toLowerCase();
  if (t && t !== "application/octet-stream") {
    if (t === "image/jpg" || t === "image/pjpeg") return "image/jpeg";
    return t;
  }
  return "image/jpeg";
}

function isAllowedImageContentType(ct: string): boolean {
  const x = ct.toLowerCase();
  if (x === "image/jpg") return true;
  return /^image\/(jpeg|png|gif|webp|heic|heif|pjpeg)$/i.test(x);
}

export function validateLeadImageFile(file: File): string | null {
  if (file.size === 0) return "O arquivo da imagem está vazio.";
  if (file.size > MAX_LEAD_IMAGE_BYTES) {
    return "A imagem deve ter no máximo 5 MB. Reduza o tamanho ou envie sem foto.";
  }
  const ct = resolveLeadImageContentType(file);
  if (!isAllowedImageContentType(ct)) {
    return "Use uma imagem JPG, PNG, WebP ou GIF (máx. 5 MB).";
  }
  return null;
}
