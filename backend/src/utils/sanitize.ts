export function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeNullableText(value?: string): string | null {
  if (!value) {
    return null;
  }

  const sanitized = sanitizeText(value);
  return sanitized.length > 0 ? sanitized : null;
}
