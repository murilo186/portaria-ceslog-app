function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function toUpperWithoutAccents(value: string): string {
  return removeAccents(value).toUpperCase();
}

export function sanitizeText(value: string): string {
  const sanitized = value
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return toUpperWithoutAccents(sanitized);
}

export function sanitizeNullableText(value?: string): string | null {
  if (!value) {
    return null;
  }

  const sanitized = sanitizeText(value);
  return sanitized.length > 0 ? sanitized : null;
}
